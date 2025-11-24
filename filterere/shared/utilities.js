const {OpenAI} = require("openai");
const fs = require('fs').promises;
const fsSync = require('fs');
const admin = require('firebase-admin');
const path = require('path');

let remoteConfigCache = null;
let remoteConfigCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let db = null;
let firebaseInitialized = false;

function getFirestoreDB(config) {
    if (db) return db;

    if (config.settings.isFirebaseFunctions) {
        // In Cloud Functions, credentials are automatically detected
        if (admin.apps.length === 0) {
            admin.initializeApp();
            firebaseInitialized = true;
            console.log('[Firebase] Admin SDK initialized successfully');
        }
    } else {
        const serviceAccountPath = path.isAbsolute(config.settings.firestoreServiceAccountPath) ?
            config.settings.firestoreServiceAccountPath :
            path.join(__dirname, '..', config.settings.firestoreServiceAccountPath);

        // Try to use specific service account file if it exists
        if (fsSync.existsSync(serviceAccountPath)) {
            try {
                const serviceAccount = require(serviceAccountPath);

                if (admin.apps.length === 0) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                    firebaseInitialized = true;
                    console.log('[Firebase] Admin SDK initialized successfully using service account file');
                }
            } catch (error) {
                console.warn(`[Firebase] Failed to initialize with service account file: ${error.message}. Falling back to default credentials...`);
            }
        }

        // If not initialized yet (no file or file failed), try Application Default Credentials
        if (!firebaseInitialized && admin.apps.length === 0) {
            try {
                admin.initializeApp();
                firebaseInitialized = true;
                console.log('[Firebase] Admin SDK initialized successfully using Application Default Credentials');
            } catch (error) {
                const errorMsg = `Failed to initialize Firebase Admin SDK. \n1. Checked for service account at: ${serviceAccountPath} (not found or invalid)\n2. Checked for Application Default Credentials (run 'gcloud auth application-default login')\nError: ${error.message}`;
                console.error(`[Firebase] ${errorMsg}`);
                throw new Error(errorMsg);
            }
        }
    }

    db = admin.firestore();
    console.log('[Firebase] Firestore database connection established');
    return db;
}

async function getRunInterval(config) {
    try {
        // Check cache first
        const now = Date.now();
        if (remoteConfigCache && (now - remoteConfigCacheTime) < CACHE_DURATION) {
            const runInterval = remoteConfigCache.parameters?.runInterval?.defaultValue?.value;
            if (runInterval && !isNaN(parseInt(runInterval))) {
                console.log(`[Remote Config] Using cached runInterval: ${runInterval} seconds`);
                return parseInt(runInterval);
            }
        }

        // Fetch from Remote Config
        const remoteConfig = admin.remoteConfig();
        const template = await remoteConfig.getTemplate();

        remoteConfigCache = template;
        remoteConfigCacheTime = now;

        const runInterval = template.parameters?.runInterval?.defaultValue?.value;
        if (runInterval && !isNaN(parseInt(runInterval))) {
            console.log(`[Remote Config] Retrieved runInterval: ${runInterval} seconds`);
            return parseInt(runInterval);
        } else {
            console.log(`[Remote Config] runInterval not found or invalid, using config default: ${config.settings.refreshInterval} seconds`);
            return config.settings.refreshInterval;
        }
    } catch (error) {
        console.error('[Remote Config] Error fetching runInterval:', error.message);
        console.log(`[Remote Config] Falling back to config default: ${config.settings.refreshInterval} seconds`);
        return config.settings.refreshInterval;
    }
}

async function executeOpenAIWithRetry(params, retries = 3, backoff = 2500, rateLimitRetry = 10, timeoutOverride = 27500) {
    const RATE_LIMIT_RETRY_DURATION = 61000; // 61 seconds

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    let attempts = 0;
    let rateLimitAttempts = 0;
    let error;
    let result;

    while (attempts < retries) {
        try {
            result = await Promise.race([
                openai.chat.completions.create(params),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Request took longer than ${timeoutOverride / 1000} seconds`)), timeoutOverride)
                )
            ]);

            //console.log(result);

            return result.choices[0].message.content.trim();
        } catch (e) {
            error = e;
            attempts++;

            // If we hit a rate limit
            if (e.response && e.response.status === 429 && rateLimitAttempts < rateLimitRetry) {
                console.log(`Hit rate limit. Sleeping for 61s...`);
                await sleep(RATE_LIMIT_RETRY_DURATION);
                rateLimitAttempts++;
                continue; // Don't increase backoff time, just retry
            }

            // Exponential backoff with jitter
            const delay = (Math.pow(2, attempts) * backoff) + (backoff * Math.random());

            console.log(`Attempt ${attempts} failed with error: ${e.message}. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    throw error; // If all retries failed, throw the last error encountered
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function fixJSON(input) {
    return input
        // Fix common errors with local LLM JSON
        .replace(/[\u201C\u201D]/g, '"') // Replace curly double quotes with straight double quotes
        .replace(/[\u2018\u2019]/g, "'") // Replace curly single quotes with straight single quotes
        .replace(/`/g, "'") // Replace backticks with straight single quotes
        .replace(/\\_/g, "_") // Replace escaped underscores with unescaped underscores
        .replaceAll("'''json\n", '')
        .replaceAll("'''", '');
}

async function getLastTimestamp(timestampFilePath, config) {
    if (config.settings.useFirestoreForTimestamp) {
        try {
            const db = getFirestoreDB(config);
            const docRef = db.collection(config.settings.firestoreCollection).doc(config.settings.firestoreDocument);
            const doc = await docRef.get();

            if (doc.exists && doc.data()[config.settings.firestoreField]) {
                console.log('[Firebase] Retrieved last timestamp from Firestore');
                return doc.data()[config.settings.firestoreField];
            } else {
                console.log('[Firebase] No timestamp found in Firestore, using current time');
                return new Date().toISOString();
            }
        } catch (error) {
            console.error('[Firebase] Error reading timestamp from Firestore, falling back to local file:', error.message);
            // Fallback to local file if Firestore fails
            try {
                const lastTimestamp = await fs.readFile(timestampFilePath, 'utf8');
                console.log('[Fallback] Retrieved last timestamp from local file');
                return lastTimestamp;
            } catch (fileError) {
                console.log('[Fallback] No local timestamp file found, using current time');
                return new Date().toISOString();
            }
        }
    }

    try {
        const lastTimestamp = await fs.readFile(timestampFilePath, 'utf8');
        console.log('[Local Storage] Retrieved last timestamp from local file');
        return lastTimestamp;
    } catch (error) {
        // If the file doesn't exist, use the current date-time
        console.log('[Local Storage] No timestamp file found, using current time');
        return new Date().toISOString();
    }
}

async function saveLastTimestamp(timestamp, timestampFilePath, config) {
    if (config.settings.useFirestoreForTimestamp) {
        try {
            const db = getFirestoreDB(config);
            const docRef = db.collection(config.settings.firestoreCollection).doc(config.settings.firestoreDocument);
            await docRef.set({
                [config.settings.firestoreField]: timestamp
            }, { merge: true });
            console.log('[Firebase] Saved last timestamp to Firestore');
        } catch (error) {
            console.error('[Firebase] Error saving timestamp to Firestore, falling back to local file:', error.message);
            // Fallback to local file if Firestore fails
            try {
                await fs.writeFile(timestampFilePath, timestamp, 'utf8');
                console.log('[Fallback] Saved last timestamp to local file');
            } catch (fileError) {
                console.error('[Fallback] Failed to save timestamp to local file:', fileError.message);
            }
        }
        return;
    }

    try {
        await fs.writeFile(timestampFilePath, timestamp, 'utf8');
        console.log('[Local Storage] Saved last timestamp to local file');
    } catch (error) {
        console.error('[Local Storage] Failed to save timestamp to local file:', error.message);
    }
}


module.exports = {
    executeOpenAIWithRetry,
    fixJSON,
    getLastTimestamp,
    saveLastTimestamp,
    getFirestoreDB,
    getRunInterval
};

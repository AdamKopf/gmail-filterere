/**
 * Firebase Cloud Functions for clearmail
 * Scheduled function to process emails at regular intervals
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { processEmails } = require("../shared/processEmails");
const { getLastTimestamp } = require("../shared/utilities");
const config = require("./config");

// Define secrets for IMAP and OpenAI credentials
const imapUser = defineSecret("IMAP_USER");
const imapPassword = defineSecret("IMAP_PASSWORD");
const openAIKey = defineSecret("OPENAI_API_KEY");

/**
 * Scheduled Cloud Function to process emails every 10 minutes
 * Set environment variables (secrets) before deploying:
 * firebase functions:secrets:set IMAP_USER
 * firebase functions:secrets:set IMAP_PASSWORD
 * firebase functions:secrets:set OPENAI_API_KEY
 */
exports.processEmailsScheduled = onSchedule({
  schedule: "every 6 minutes",
  secrets: [imapUser, imapPassword, openAIKey],
  timeoutSeconds: 300,
  memory: "512MiB"
}, async (event) => {
  try {
    logger.info("Starting scheduled email processing");

    // Set environment variables from secrets
    process.env.IMAP_USER = imapUser.value();
    process.env.IMAP_PASSWORD = imapPassword.value();
    process.env.OPENAI_API_KEY = openAIKey.value();

    // Get the last timestamp from Firestore
    const timestamp = await getLastTimestamp("lastTimestamp.txt", config);
    logger.info(`Processing emails since: ${timestamp}`);

    // Process emails
    const result = await processEmails(timestamp);
    logger.info(`Email processing completed: ${JSON.stringify(result)}`);

    return result;
  } catch (error) {
    logger.error(`Error processing emails: ${error.message}`);
    throw error;
  }
});

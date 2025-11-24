const config = require('./config');
const {
    executeOpenAIWithRetry,
    fixJSON,
    getLastTimestamp,
    saveLastTimestamp,
    getFirestoreDB
} = require('../shared/utilities');

async function getLastTimestampWrapped(timestampFilePath) {
    return getLastTimestamp(timestampFilePath, config);
}

async function saveLastTimestampWrapped(timestamp, timestampFilePath) {
    return saveLastTimestamp(timestamp, timestampFilePath, config);
}

function getFirestoreDBWrapped() {
    return getFirestoreDB(config);
}

module.exports = {
    executeOpenAIWithRetry,
    fixJSON,
    getLastTimestamp: getLastTimestampWrapped,
    saveLastTimestamp: saveLastTimestampWrapped,
    getFirestoreDB: getFirestoreDBWrapped
};

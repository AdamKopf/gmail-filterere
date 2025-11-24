const config = require("./config");
const {processEmails: sharedProcessEmails} = require("../shared/processEmails");

async function processEmails(timestamp) {
    return sharedProcessEmails(timestamp, config);
}

module.exports = { processEmails };

module.exports = { processEmails };
const { analyzeEmail: sharedAnalyzeEmail } = require("../shared/analyzeEmail");
const config = require('./config');

async function analyzeEmail(emailSubject, emailSender, emailBody, emailDate) {
    return sharedAnalyzeEmail(emailSubject, emailSender, emailBody, emailDate, config);
}

module.exports = { analyzeEmail };

module.exports = { analyzeEmail };

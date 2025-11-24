# Clearmail Project Structure

## Directory Overview

```
clearmail-main/
├── src/                      # Main application code
│   ├── server.js            # Express server (server mode)
│   └── config/              # Configuration
│       ├── config.js        # Config loader
│       └── config.yml       # Config file (YAML)
│
├── shared/                   # Shared modules (duplicated from src/)
│   ├── analyzeEmail.js      # Email analysis
│   ├── processEmails.js     # Email processing
│   ├── utilities.js         # Utilities
│   └── config.yml           # Configuration
│
├── functions/               # Google Cloud Functions (TypeScript)
│   └── src/
│       └── index.ts         # Primary Cloud Function exports
│
├── filterere/               # Google Cloud Functions deployment
│   ├── index.js            # Cloud Function entry point
│   └── config.js/yml       # Configuration
│
├── firebase/                # Firebase configuration
│   ├── firestore.rules      # Firestore security rules
│   ├── firestore.indexes.json
│   ├── storage.rules        # Cloud Storage security rules
│   └── remoteconfig.template.json
│
├── certs/                   # SSL certificates for IMAP
│   ├── imap-cert.pem
│   └── imap-key.pem
│
└── package.json            # Root dependencies
```

## Running the Application

### As a Server (Express)
```bash
npm install
npm start
```
Listens on port specified in config (default: 3000)
GET `/process-emails` - Process emails immediately

### As a Script
Set `runAsServerOrScript: "script"` in config.yml
```bash
npm install
npm start
```
Runs continuously at `refreshInterval` specified in config

### Firebase Cloud Functions
```bash
firebase deploy
```
Deploys both `functions/` and `filterere/` based on firebase.json configuration

## Configuration

Create `.env` from `.env.example`:
```
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password
OPENAI_API_KEY=sk-...
FIREBASE_...=credentials
```

Configuration settings in `src/config/config.yml`

## Key Modules

All core logic is in the `shared/` directory:

- **shared/processEmails.js**: Connects to IMAP server, fetches emails
- **shared/analyzeEmail.js**: Uses OpenAI to categorize/analyze emails
- **shared/utilities.js**: Firebase integration, OpenAI retries, timestamp tracking
- **src/server.js**: Express API for on-demand processing (imports from shared/)

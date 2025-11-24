# filterere

This is a fork of [clearmail](https://github.com/andywalters47/clearmail), an open-source project that leverages AI to filter emails according to a set of simple rules you can write in english.

## Introduction

**filterere** is an intelligent email filtering system that uses AI to automatically star important emails and move non-important emails to specified folders or labels according to rules you define in plain English. The tool respects your privacy—it never deletes emails, only organizes them with labels and moves.

This project began as a fork of clearmail and adds additional features and improvements for deployment as Google Cloud Functions and other enhanced capabilities.

## How it works

### 1. At a Given Interval...

Filterere operates on a configurable interval, determined by the `refreshInterval` setting in the `shared/config.yml` file. This interval sets how often filterere checks for new emails. When running in script mode, the process runs continuously and checks for new emails at the specified interval (e.g., every 120 seconds by default).

### 2. Connecting to Gmail via IMAP

Filterere uses the IMAP protocol to connect to your Gmail account. It securely authenticates using the credentials provided in the `.env` file and establishes a connection to the server.

### 3. Searching for New Emails

Once connected, filterere searches the inbox for any unread emails that have arrived since the last processed timestamp that are not STARRED.

### 4. Processing Each Email

For each new email identified, filterere performs the following steps:

- **Analyzing the Email:** The email's sender, subject, and body is analyzed using either the local LLM or OpenAI to determine if the email should be kept/starred or rejected/sorted according to predefined rules you specify in plain English in the `config.yml` file.

#### Sample Rules for Keeping Emails

```yaml
rules:
  keep: |
    * Email is a direct reply to one of my sent emails
    * Email contains tracking information for a recent purchase
    * Subject: "Invoice" or "Receipt" (Transactional emails)
```

#### Example Rules for Rejecting Emails

```yaml
rules:
  reject: |
    * Bulk emails that are not addressed to me specifically by name
    * Subject contains "Subscribe" or "Join now"
    * Email looks like a promotion
```

- **Categorizing or Moving the Email:** If the email is worth reading according to your rules, it is left in the inbox and starred. If it's not, it's either:
    - Moved to the rejection folder (as named in `rejectedFolderName`), if the email is considered not important.
    - Moved to a specific label like `Social`, if `sortIntoCategoryFolders` is enabled and the email matches one of the specified categories. You can specify any categories you want! For example:

        ```yaml
        categoryFolderNames:
          - News
          - Social Updates
          - Work
          - Family
          - Financial
        ```

### 5. Wrap Up

If any errors occur during the process, such as connection issues or errors in email analysis, filterere logs these errors for debugging purposes.

## Requirements

To use filterere you will need:

- A Gmail account
- Node.js installed on your system

Note: this has only been tested for Mac.

## Setup Instructions

**Quick Start:** Filterere works out of the box as a local Node.js application. You can skip Firebase setup entirely and start with Steps 1, 3, 4, and 5.

Follow these steps to get filterere up and running on your system:

### Step 1: Gmail IMAP Access with App Password

To securely access your Gmail account using IMAP in applications like filterere, especially when you have 2-Step Verification enabled, you'll need to create and use an app password. An app password is a 16-character code that allows less secure apps to access your Google Account. Here's a detailed guide on how to create and use app passwords for Gmail IMAP access:

#### Prerequisites
- **2-Step Verification:** To create an app password, your Google Account must have 2-Step Verification enabled. This adds an additional layer of security to your account by requiring a second verification step during sign-in.

#### Creating an App Password

1. **Go to Your Google Account:**
    - Navigate to [Google Account settings](https://myaccount.google.com/).

2. **Select Security:**
    - Find the "Security" tab on the left-hand side and click on it to access your security settings.

3. **Access 2-Step Verification Settings:**
    - Under the "Signing in to Google" section, find and select "2-Step Verification." You may need to sign in to your account again for security purposes.

4. **Open App Passwords Page:**
    - Scroll down to the bottom of the 2-Step Verification page, and you should see the "App passwords" option. Click on it to proceed.
    - If you do not see this option, ensure that 2-Step Verification is indeed enabled and not set up exclusively for security keys. Note that app passwords may not be available for accounts managed by work, school, or other organizations, or for accounts with Advanced Protection enabled.

5. **Generate a New App Password:**
    - Click on "Select app" and choose "Mail" as the application you want to generate the password for.
    - Choose the device you are generating the password for (e.g., Windows Computer, iPhone, or other).
    - Click on "Generate" to create your new app password.

6. **Copy and Use the App Password:**
    - A 16-character code will be displayed on your screen. This is your app password, and you'll use it instead of your regular password for setting up IMAP access in filterere.
    - Follow any on-screen instructions to enter the app password into filterere's configuration. Typically, you'll replace your regular password with this app password in the `.env` file where IMAP credentials are specified.

### Step 2: Optional - Firebase Cloud Deployment
 
 **Firebase is completely optional.** Filterere works perfectly as a standard Node.js application with local file storage. You only need Firebase if you want to:
 
 - **Deploy to Cloud Functions** - Run email processing as serverless functions on Firebase infrastructure
 - **Use Firestore storage** - Store timestamps and settings in the cloud instead of local files
 
 **Skip this entire step if you just want to run locally** - the app will work with local file storage by default.
 
 #### If You Want Firebase Cloud Deployment:
 
 1. **Install Firebase CLI & Google Cloud SDK**:
    - Install Firebase tools: `npm install -g firebase-tools`
    - Install Google Cloud SDK: Follow instructions at [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
 
 2. **Authenticate**:
    - Log in to Firebase:
      ```bash
      firebase login
      ```
    - Set up Application Default Credentials (allows running locally without manually downloading keys):
      ```bash
      gcloud auth application-default login
      ```
 
 3. **Enable Firestore in Firebase**:
    - Go to [Firebase Console](https://console.firebase.google.com/) -> **Firestore Database**
    - Click **"Create Database"**
    - Choose **"Start in production mode"** and select a location (e.g., `eur3`)
    - Click **"Enable"**
 
 4. **Update shared/config.yml**:
    - Set `useFirestoreForTimestamp: true` in `shared/config.yml`
 
 #### Legacy Method (Manual Service Account Key)
 If you prefer not to use the gcloud CLI, you can still use a service account key file:
 1. Generate a new private key in Firebase Console -> Project Settings -> Service Accounts.
 2. Save the JSON file to `certs/serviceAccountKey.json` in the project root.
 3. The app will automatically detect and use this file if present.

### Step 3: Configure the YAML File

Navigate to the `shared/config.yml` file. Customize these settings to match your email management preferences.

#### YAML File Options

The `config.yml` file contains several options to customize how filterere works:

- `useLocalLLM`: Determines whether to use a local language model or OpenAI for email analysis.
- `maxEmailChars`: The maximum number of characters from an email body to feed to the AI for analysis.
- `maxEmailsToProcessAtOnce`: Limits the number of emails processed in a single batch.
- `refreshInterval`: How often, in seconds, to check for new emails.
- `timestampFilePath`: The file path for storing the timestamp of the last processed email.
- `sortIntoCategoryFolders`: Whether to sort emails into specified categories.
- `rejectedFolderName`: The name of the folder where rejected emails are moved.
- `categoryFolderNames`: A list of folder names for categorizing emails.
- `rules`: Simple rules defining which emails to keep or reject.

Additional details are included as comments in `shared/config.yml`.

### Step 4: Configure .env File

To integrate your environment with filterere, you'll need to configure the `.env` file by setting up various environment variables that the application requires to run. Copy the `.env.example` to `.env` and fill in the following:

#### .env File Configuration

1. **OPENAI_API_KEY**:
    - **Description**: Optional. If you choose to not use a local LLM, fill in your OpenAI API key here.

2. **IMAP_USER**:
    - **Description**: Your email address that you will use to access your Gmail account via IMAP.

3. **IMAP_PASSWORD**:
    - **Description**: Use app password generated above.

4. **IMAP_HOST**:
    - **Description**: The IMAP server address for Gmail.
    - **Default Value**: `imap.gmail.com`. This is pre-set for Gmail accounts and typically does not need to be changed.

5. **IMAP_PORT**:
    - **Description**: The port number used to connect to the IMAP server.
    - **Default Value**: `993`. This is the standard port for IMAP over SSL (IMAPS) and is used by Gmail.

#### Example .env File Content

```plaintext
OPENAI_API_KEY=your_openai_api_key_here
IMAP_USER=yourname@gmail.com
IMAP_PASSWORD=your_app_password_or_regular_password_here
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

### Step 5: Install Dependencies and Run filterere

#### Installing Node.js

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine, and it's required to run `filterere`. Here's how to install it:

1. **Download Node.js**: Visit the [official Node.js website](https://nodejs.org/) to download the installer for your operating system. It is recommended to download the LTS (Long Term Support) version for better stability.

2. **Install Node.js**:
   - **Windows & macOS**: Run the downloaded installer and follow the on-screen instructions. The installer includes Node.js and npm (Node Package Manager).
   - **Linux**: You can install Node.js via a package manager. Instructions for different distributions are available on the Node.js website under the [Linux installations guide](https://nodejs.org/en/download/package-manager/).

3. **Verify Installation**: Open a terminal or command prompt and type the following commands to verify that Node.js and npm are installed correctly:

    ```bash
    node --version
    npm --version
    ```

   If the installation was successful, you should see the version numbers for both Node.js and npm.

#### Navigating to the filterere Directory

Before running `filterere`, make sure you are in the project root directory:

1. **Open a Terminal or Command Prompt**: Use a terminal on Linux or macOS, or Command Prompt/Powershell on Windows.

2. **Navigate to the Project Root**: Use the `cd` (change directory) command to navigate to the folder where you have the project installed. For example:

   - On Windows:
       ```bash
       cd Desktop\clearmail-main
       ```
   - On Linux or macOS:
       ```bash
       cd ~/Desktop/clearmail-main
       ```

#### Installing Project Dependencies

Once you are in the project root directory, install the required npm dependencies:

```bash
npm install
```

#### Running filterere

After dependencies are installed, start `filterere` by running:

```bash
npm start
```

The behavior depends on your configuration:

- **Script Mode** (default, `runAsServerOrScript: script`): The process runs continuously, checking for new emails at the interval specified by `refreshInterval` in `config.yml`. It will output activity information to the terminal.

- **Server Mode** (`runAsServerOrScript: server`): An Express server starts and listens on the port specified by `portNumber` (default: 3003). Trigger email processing via HTTP GET request to `http://localhost:3003/process-emails`.

#### Stopping filterere

To stop the filterere process, press `Ctrl + C` on your keyboard.

## Large Language Model (LLM) Choice: Local or OpenAI

Filterere supports integration with any running local LLM and is configured out of the box to support default LM Studio settings. The advantage of Local LLMs is privacy and zero inference costs, but the tradeoff is likely performance. For that reason, filterere also supports using any OpenAI chat completion model.

### Local Option: Setting Up LM Studio

[LM Studio](https://lmstudio.ai/) is a powerful platform that allows you to run large language models locally. To get started, follow these steps:

1. **Download and Install LM Studio:** Visit [https://lmstudio.ai/](https://lmstudio.ai/) and download the latest version of LM Studio for your operating system. Follow the installation instructions provided on the website.

2. **Start an Inference Server:** Once LM Studio is installed, launch the application and start an inference server. This server will handle requests from filterere to process emails.

3. **Download a Language Model:** Any model can work, but we recommend searching for `TheBloke/Mistral-7B-Instruct-v0.2-code-ft-GGUF` within LM Studio's model marketplace and download any of the models listed there. These models are specifically tailored for instruction-following tasks and code generation, making them well-suited for analyzing and categorizing emails.

4. **Specify the Connection String:** After setting up the inference server, note the connection string provided by LM Studio. If you modify it, update filterere's `config.yml` under the `localLLM.postURL` field to ensure filterere can communicate with the local LLM server. If you don't modify it, filterere will work out of the box with LMStudio's loaded model.

### Configuration in filterere

Once your LM Studio server is running and the model is downloaded, configure filterere to use the local LLM by editing the `shared/config.yml` file:

```yaml
settings:
  useLocalLLM: true

localLLM:
  postURL: http://localhost:1234/v1/chat/completions  # Replace with your actual LM Studio connection string
```

Make sure the `useLocalLLM` setting is set to `true` and the `postURL` points to your running LM Studio inference server.

### Using OpenAI

While using local LLMs can offer many advantages, it's important to note that performance and reliability may vary compared to using OpenAI's APIs. We have included some `fixJSON` work in the filterere codebase to address potential inconsistencies with model outputs, but local models can still be somewhat unreliable. If you encounter issues, consider using OpenAI but keep in mind you are sending your emails to their AI and you need to be comfortable with that level of not-privacy.

#### Obtaining Your OpenAI API Key

1. **Log in or Sign Up to OpenAI**:
    - Visit the OpenAI platform at [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys). If you already have an account, log in using your credentials. If you don't, you'll need to sign up and create an account.

2. **Create a New Secret Key**:
    - Once logged in, you'll be directed to the API keys section of your OpenAI account. Look for the "Create new secret key" button and click on it. This action will generate a new API key for you to use with applications like filterere.

3. **Copy Your Key**:
    - After creating your new secret key, a window will pop up showing your newly generated API key. Use the "Copy" button to copy your key to your clipboard. Make sure to save it in a secure place, as you will need to enter this key into your filterere configuration.

#### Integrating the API Key into filterere

1. **Open Your .env File**: Navigate to the root directory of your filterere project and open the `.env` file in a text editor. If you haven't created this file yet, you can copy and rename the `.env.example` file to `.env`.

2. **Enter Your OpenAI API Key**: Locate the line starting with `OPENAI_API_KEY=` and paste your copied API key right after the equals sign (`=`) without any spaces. It should look something like this:

    ```plaintext
    OPENAI_API_KEY=your_copied_api_key_here
    ```

   Replace `your_copied_api_key_here` with the API key you copied from the OpenAI platform.

3. **Save Changes**: After entering your API key, save the `.env` file. This update will allow filterere to use your OpenAI API key to access the AI services required for email analysis.

## Using PM2 to Manage the filterere Process

[PM2](https://pm2.keymetrics.io/) is a process manager for Node.js applications that can help manage and keep your filterere process running in the background. To use PM2 with filterere:

1. Install PM2 globally using npm:

    ```bash
    npm install pm2 -g
    ```

2. Start filterere with PM2:

    ```bash
    pm2 start src/server.js --name filterere
    ```

3. To ensure filterere starts on system reboot, use the `pm2 startup` command and follow the instructions provided.

4. To stop filterere, use:

    ```bash
    pm2 stop filterere
    ```

## Contributing

This is a fork of clearmail with enhancements. Contributions are welcome. Please feel free to submit issues and pull requests.

## License

Please refer to the original clearmail project for licensing information.

## Acknowledgments

This project is a fork of [clearmail](https://github.com/andywalters47/clearmail) by Andy Walters.

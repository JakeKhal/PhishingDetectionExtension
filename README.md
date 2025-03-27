# Phishing Detection Google Extension
CS433 - Jake Khal - Rajveer Gill - Jamie Whiting

[Click here to view our Presentation with a Recorded Demo](https://www.canva.com/design/DAGhXgNvbdA/VdMluFFBNrlNSndNGLhVRg/view?utm_content=DAGhXgNvbdA&utm_campaign=share_your_design&utm_medium=link2&utm_source=shareyourdesignpanel#1)


## 📖 Description
The **Phishing Detection Extension** is a Chrome extension designed to analyze email content and detect potential phishing attempts.  
It provides users with a **phishing confidence score (0-100)** for emails viewed in **Gmail**, helping them identify and avoid malicious attacks.  
This tool is designed for **everyday users**, providing a simple, one-click email analysis without requiring **technical expertise**.  

The extension extracts email content, sends it to an AI-powered backend, and returns a phishing risk assessment using **GPT-4 and VirusTotal**.

---

## 🛠️ Technologies Used
### **Frontend**
- **Chrome Extension**: Built with **HTML, JavaScript, and CSS** for an intuitive user interface.
- **Content Scripts**: Extracts email content directly from Gmail's Document Object Model **(DOM)**.
- **Popup UI**: Displays phishing analysis results with a user-friendly interface.

### **Backend**
- **Flask**: Serves as the backend for processing email content and coordinating API requests.
- **Flask-CORS**: Enables secure communication between the extension and backend.

### **APIs**
- **OpenAI GPT-4 API**: Analyzes email content for **phishing indicators**, including urgency, language patterns, and social engineering tactics.
- **VirusTotal API**: Scans URLs extracted from email content and categorizes them as **malicious, suspicious, or undetected**.

### **Parsing Tools**
- **querySelector()**: Used to extract the plain text and links from email **HTML** for analysis.

---

## 🚀 Running This Extension (Local Setup)
1. Clone this repository.
2. Populate API keys as instructed:
    - Create ".env" file in backend foler with format:

    OPENAI_API_KEY=openai_api_key
    VIRUSTOTAL_API_KEY=virustotal_api_key

3. Load the folder /PhishingDetection Extension content in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
4. Click the extension icon in the Chrome toolbar, then select the "PhishingDetectionExtension" extension. It should then be accessible in extensions menu.

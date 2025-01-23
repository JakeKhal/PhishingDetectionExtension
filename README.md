# Phishing Detection Google Extension
CS433 - Jake Khal - Rajveer Gill - Jamie Whiting -

## Description
The Phishing Detection Extension is a Chrome extension designed to analyze email content and detect potential phishing attempts. 
It provides users with a phishing confidence score (0-100) for emails viewed in Gmail, helping them identify and avoid malicious attacks. 
This tool is tailored for everyday users who may not have technical expertise, allowing them to scan emails effortlessly and understand their risk level without relying on backend developer tools or APIs that require manual integration.


## Technologies Used
<br>• Frontend:<br>
Chrome Extension: Built with HTML, JavaScript, and CSS to provide a simple and intuitive user interface.
Content Scripts: Extract email content directly from Gmail's DOM.
<br>• Backend:<br>
Flask: Serves as the backend for processing email content and coordinating API requests.
<br>Flask-CORS: Enables secure communication between the frontend and backend.
<br>• APIs:<br>
OpenAI GPT-4 API: Analyzes email content and provides a phishing confidence score based on linguistic and contextual patterns.
<br>VirusTotal API: Scans URLs extracted from email content and provides detailed analysis of their safety (e.g., malicious, suspicious, or undetected).
<br>• Parsing Tools:<br>
BeautifulSoup: Extracts plain text and links from email HTML for analysis.

## Running This Extension
1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension icon in the Chrome toolbar, then select the "PhishingDetectionExtension" extension. It should then be accessible in extensions menu.

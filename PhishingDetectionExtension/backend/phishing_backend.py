from dotenv import load_dotenv
from flask import Flask, request, jsonify
import openai
import requests
from flask_cors import CORS
import os
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# API Keys
openai.api_key = os.getenv("OPENAI_API_KEY")
virustotal_api_key = os.getenv("VIRUSTOTAL_API_KEY")

@app.route('/')
def home():
    return "Phishing Detection Backend is running.", 200

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/analyze', methods=['POST'])
def analyze_email():
    """
    Main endpoint to analyze email content and links.
    """
    data = request.json
    email_content = data.get('emailContent', '')  # Content directly from content.js
    links = data.get('links', [])  # Links directly from content.js

    try:
        # Scan links using VirusTotal
        vt_results = scan_links_with_virustotal(links)

        # Get phishing score from ChatGPT, including VirusTotal data
        phishing_score = analyze_with_chatgpt(email_content, vt_results)

        return jsonify({
            "phishingScore": phishing_score,
            "virusTotalResults": vt_results
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def analyze_with_chatgpt(email_text, vt_results):
    """
    Use OpenAI GPT API to analyze email content and VirusTotal data to generate a phishing score.
    """
    try:
        # Extensive prompt for phishing detection
        prompt = f"""
        You are an AI specialized in phishing detection. Analyze the following email and its associated VirusTotal data 
        for potential phishing activity. Consider the following factors when determining a phishing confidence score:
        
        1. Email Content:
           - Does the email use urgency, fear, or pressure tactics (e.g., "Your account is compromised", "Act now", "Verify your account")?
           - Are there spelling or grammatical errors that suggest it might be a phishing email?
           - Does the email request sensitive information (e.g., passwords, personal data, credit card details)?
        
        2. VirusTotal Data for Links:
           - How many engines marked the link as malicious, suspicious, or undetected?
           - Are there any red flags in the URL structure (e.g., unusual domains, shortened links)?
        
        Based on the analysis, provide a single phishing confidence score between 0 and 100, where:
        - 0 indicates you are confident the email is legitimate.
        - 100 indicates the email is definitely phishing.

        Only respond with a JSON object containing:
        {{
            "phishingScore": <numeric value between 0 and 100>
        }}

        Here is the input data:
        - Email Content:
        {email_text}
        
        - VirusTotal Results:
        {vt_results}
        """
        
        # Call OpenAI API with the new interface
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an AI specialized in phishing detection."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150
        )

        # Parse the JSON response content
        response_content = response['choices'][0]['message']['content']
        response_json = json.loads(response_content.strip())  # Convert string to JSON
        return response_json["phishingScore"]  # Extract the phishingScore as an integer
    except Exception as e:
        return {"error": f"OpenAI API error: {str(e)}"}


def scan_links_with_virustotal(links):
    """
    Use VirusTotal API to scan links for phishing or malware.
    """
    headers = {"x-apikey": virustotal_api_key}
    analysis_results = {}

    for link in links:
        try:
            # Ensure link has correct formatting
            if not link.startswith(("http://", "https://")):
                link = "https://" + link

            # Submit the link to VirusTotal for analysis
            response = requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": link}
            )
            response_data = response.json()

            if 'data' in response_data and 'id' in response_data['data']:
                # Fetch analysis details using the analysis ID
                analysis_id = response_data['data']['id']
                details_response = requests.get(
                    f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                    headers=headers
                )
                details_data = details_response.json()

                # Extract statistics (malicious, suspicious, undetected)
                if 'data' in details_data and 'attributes' in details_data['data']:
                    stats = details_data['data']['attributes']['stats']
                    analysis_results[link] = {
                        "malicious": stats.get('malicious', 0),
                        "suspicious": stats.get('suspicious', 0),
                        "undetected": stats.get('undetected', 0)
                    }
                else:
                    analysis_results[link] = {"error": "Details not found"}
            else:
                analysis_results[link] = {"error": "Submission failed"}
        except requests.exceptions.RequestException as e:
            analysis_results[link] = {"error": f"VirusTotal API request failed: {str(e)}"}

    return analysis_results


if __name__ == "__main__":
    app.run(debug=True, port=5000)


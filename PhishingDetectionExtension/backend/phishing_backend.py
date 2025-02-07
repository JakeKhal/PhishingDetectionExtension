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
CORS(app, origins=["http://localhost:3000", "chrome-extension://*"])

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
    data = request.json
    email_content = data.get('emailBody', '') 
    links = data.get('links', []) 

    if not email_content:
        return jsonify({"error": "Email content is missing"}), 400
    
    app.logger.info(f"Received email content (truncated): {email_content[:200]}...")
    app.logger.info(f"Links: {links}")

    try:
        vt_results = scan_links_with_virustotal(links)
        phishing_score, chatgpt_analysis = analyze_with_chatgpt(email_content, vt_results)

        return jsonify({
            "phishingScore": phishing_score,
            "virusTotalResults": vt_results,
            "aiAnalysis": chatgpt_analysis
        })
    except Exception as e:
        app.logger.error(f"Error in /analyze: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


def analyze_with_chatgpt(email_text, vt_results):
    try:
        prompt = f"""
        You are an AI specialized in phishing detection. Analyze the following email and its associated VirusTotal data 
        for potential phishing activity.

        - Email Content:
        {email_text}

        - VirusTotal Results:
        {json.dumps(vt_results, indent=2)}

        Provide a JSON object:
        {{
            "phishingScore": <numeric value between 0 and 100>,
            "analysisExplanation": <string explaining your analysis>
        }}
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an AI specialized in phishing detection."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        try:
            response_content = response['choices'][0]['message']['content']
            response_json = json.loads(response_content.strip())
            return response_json["phishingScore"], response_json["analysisExplanation"]
        except (json.JSONDecodeError, KeyError) as e:
            app.logger.error(f"Invalid OpenAI response: {response_content}")
            return 50, "Could not parse AI response."

    except Exception as e:
        app.logger.error(f"Error in analyze_with_chatgpt: {str(e)}")
        return 50, f"AI analysis failed: {str(e)}"


def scan_links_with_virustotal(links):
    headers = {"x-apikey": virustotal_api_key}
    analysis_results = {}

    for link in links:
        try:
            if not link.startswith(("http://", "https://")):
                link = "https://" + link

            response = requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": link}
            )
            response_data = response.json()

            if response.status_code == 429:
                app.logger.error("VirusTotal API rate limit exceeded")
                analysis_results[link] = {"error": "Rate limit exceeded"}
                continue

            if 'data' in response_data and 'id' in response_data['data']:
                analysis_id = response_data['data']['id']
                details_response = requests.get(
                    f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                    headers=headers
                )
                details_data = details_response.json()

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
    app.run(debug=True, port=3000) 

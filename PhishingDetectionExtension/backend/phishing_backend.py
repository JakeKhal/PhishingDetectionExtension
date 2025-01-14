from flask import Flask, request, jsonify
import openai
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# API Keys
openai.api_key = "your_openai_api_key"
virustotal_api_key = "f354bcfd32512396164a4a9ce2508a60309366ae29a4ddc2d0f32936fabc5981"

@app.route('/analyze', methods=['POST'])
def analyze_email():
    data = request.json
    email_content = data.get('emailContent', '')
    links = data.get('links', [])

    try:
        # Analyze email content with ChatGPT
        ai_response = analyze_with_chatgpt(email_content)

        # Scan links with VirusTotal
        vt_response = scan_links_with_virustotal(links)

        return jsonify({
            "aiAnalysis": ai_response,
            "virusTotalResults": vt_response
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def analyze_with_chatgpt(email_content):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an AI that helps detect phishing emails."},
            {"role": "user", "content": f"Analyze this email content: {email_content}"}
        ],
    )
    return response['choices'][0]['message']['content']


# VIRUSTOTAL API --START--
def scan_links_with_virustotal(links, virustotal_api_key):
    headers = {"x-apikey": virustotal_api_key}
    analysis_ids = {}
    
    for link in links:
        # Ensure the URL is properly formatted
        if not link.startswith("http://") and not link.startswith("https://"):
            link = "https://" + link
        
        # Submit the URL for analysis
        response = requests.post(
            "https://www.virustotal.com/api/v3/urls",
            headers=headers,
            data={"url": link}
        )
        response_data = response.json()
        
        # Extract the analysis ID
        if 'data' in response_data and 'id' in response_data['data']:
            analysis_ids[link] = response_data['data']['id']
        else:
            analysis_ids[link] = None  # Handle cases where submission fails

    return analysis_ids

def get_analysis_score(analysis_id, api_key):
    headers = {"x-apikey": api_key}
    url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"
    response = requests.get(url, headers=headers)
    analysis_data = response.json()
    
    # Extract the score from the 'stats' field
    if 'data' in analysis_data and 'attributes' in analysis_data['data']:
        stats = analysis_data['data']['attributes']['stats']
        malicious = stats.get('malicious', 0)
        suspicious = stats.get('suspicious', 0)
        undetected = stats.get('undetected', 0)
        
        # Return the extracted stats
        return {
            "malicious": malicious,
            "suspicious": suspicious,
            "undetected": undetected
        }
    else:
        return {"error": "Analysis data not found or incomplete"}

def get_scores_for_links(links, api_key):
    # Submit links for analysis and get their IDs
    analysis_ids = scan_links_with_virustotal(links, api_key)
    scores = {}
    
    for link, analysis_id in analysis_ids.items():
        if analysis_id:  # Only fetch score if analysis ID is available
            scores[link] = get_analysis_score(analysis_id, api_key)
        else:
            scores[link] = {"error": "Failed to submit URL for analysis"}
    
    return scores
# VIRUSTOTAL API --END--

if __name__ == "__main__":
    links = ["www.apple.com", "www.chatgpt.com"]
    
    # Get scores for all links
    link_scores = get_scores_for_links(links, virustotal_api_key)
    print(link_scores)



    app.run(debug=True, port=5000)

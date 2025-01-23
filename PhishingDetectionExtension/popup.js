document.getElementById("scanButton").addEventListener("click", () => {
  const emailStatus = document.getElementById("emailStatus");
  emailStatus.textContent = "Parsing email content...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { message: "extract_email" },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError.message);
          emailStatus.textContent = "Error: Could not parse email content.";
          return;
        }

        if (response.error) {
          console.error("Error:", response.error);
          emailStatus.textContent = `Error: ${response.error}`;
          return;
        }

        const { emailBody, emailSubject } = response;

        // Update the UI with parsed email content
        document.getElementById("aiAnalysis").textContent = `Subject: ${emailSubject}`;
        document.getElementById("vtResults").textContent = `Body: ${emailBody}`;
        emailStatus.textContent = "Email content parsed successfully!";

        try {
          // Send the parsed content to the backend for analysis
          const backendResponse = await fetch("http://localhost:5000/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailContent: emailBody,
              links: extractLinks(emailBody) // Dynamically extract links
            }),
          });

          const data = await backendResponse.json();

          // Handle errors from the backend
          if (data.error) {
            console.error("Backend error:", data.error);
            emailStatus.textContent = `Error: ${data.error}`;
            return;
          }

          // Display the phishing score
          document.getElementById("phishingScoreDisplay").textContent = `Phishing Score: ${data.phishingScore}`;

          // Display additional backend results
          document.getElementById("aiAnalysis").textContent = data.aiAnalysis || "No AI analysis available.";
          document.getElementById("vtResults").textContent = JSON.stringify(data.virusTotalResults, null, 2);
        } catch (err) {
          console.error("Error communicating with backend:", err);
          emailStatus.textContent = "Error: Could not analyze email.";
        }
      }
    );
  });
});

// Function to extract links from the email body
function extractLinks(emailBody) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return emailBody.match(urlRegex) || [];
}

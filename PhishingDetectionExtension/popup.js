document.getElementById("scanButton").addEventListener("click", () => {
  const emailStatus = document.getElementById("emailStatus");
  emailStatus.textContent = "Parsing email content...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) {
      console.error("No active tabs found.");
      emailStatus.textContent = "Error: No active tab detected.";
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      { message: "extract_email" },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError.message);
          emailStatus.textContent = "Error: Could not parse email content.";
          return;
        }

        if (!response || response.error) {
          console.error("Error:", response?.error || "No response from content script.");
          emailStatus.textContent = `Error: ${response?.error || "Failed to extract email data."}`;
          return;
        }

        const { emailBody, emailSubject } = response;

        document.getElementById("emailContent").textContent = `Subject: ${emailSubject}\nBody: ${emailBody}`;
        emailStatus.textContent = "Email content parsed successfully!";

        const extractedLinks = extractLinks(emailBody);

        console.log("Sending to backend:", {
          emailSubject: emailSubject,
          emailBody: emailBody,
          links: extractedLinks
        });

        try {
          // Send email data to backend
          const backendResponse = await fetch("http://localhost:3000/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailSubject: emailSubject,
              emailBody: emailBody,
              links: extractedLinks
            }),
          });

          if (!backendResponse.ok) {
            throw new Error(`HTTP error! Status: ${backendResponse.status}`);
          }

          const data = await backendResponse.json();

          if (data.error) {
            console.error("Backend error:", data.error);
            emailStatus.textContent = `Error: ${data.error}`;
            return;
          }

          // Display phishing score & analysis results
          document.getElementById("phishingScoreDisplay").textContent = `Phishing Score: ${data.phishingScore || "N/A"}`;
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

function extractLinks(emailBody) {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>'"]+/gi;
  return emailBody.match(urlRegex) || [];
}
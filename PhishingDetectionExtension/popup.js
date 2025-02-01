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
        document.getElementById("emailContent").textContent = `Subject: ${emailSubject}` + `Body: ${emailBody}`;
        emailStatus.textContent = "Email content parsed successfully!";

        // Log the data being sent to the backend
        console.log("Sending to backend:", {
          emailSubject: emailSubject, 
          emailBody: emailBody,
          links: extractLinks(emailBody)  // Log the extracted links as well
        });

        try {
          // Send both the subject and body to the backend for analysis
          const backendResponse = await fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emailSubject: emailSubject,  // Add email subject here
              emailBody: emailBody,        // Send the body content as well
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
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>'"]+/gi;
  return emailBody.match(urlRegex) || [];
}

document.addEventListener("DOMContentLoaded", function () {
  
  const scanButton = document.getElementById("scanButton");
  const emailStatus = document.getElementById("emailStatus");
  const phishingScoreDisplay = document.getElementById("phishingScoreDisplay");
  const emailContent = document.getElementById("emailContent");
  const urlList = document.getElementById("urlList");
  const aiAnalysis = document.getElementById("aiAnalysis");
  const vtResults = document.getElementById("vtResults");
  const analysisContainer = document.getElementById("analysisContainer");
  const showAnalysisButton = document.getElementById("showAnalysis");

  document.querySelectorAll(".toggle-btn").forEach(button => {
    button.addEventListener("click", function () {
      const target = document.getElementById(this.getAttribute("data-target"));
      target.style.display = (target.style.display === "none" || !target.style.display) ? "block" : "none";
    });
  });

  scanButton.addEventListener("click", () => {
    emailStatus.textContent = "Parsing email content...";
    
    phishingScoreDisplay.textContent = "Phishing Score: Thinking...";
    phishingScoreDisplay.classList.remove("green", "yellow", "orange", "red");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) {
        emailStatus.textContent = "Error: No active tab detected.";
        phishingScoreDisplay.textContent = "Phishing Score: N/A";
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { message: "extract_email" },
        async (response) => {
          if (!response || response.error) {
            emailStatus.textContent = `Error: ${response?.error || "Failed to extract email data."}`;
            phishingScoreDisplay.textContent = "Phishing Score: N/A";
            return;
          }

          const { emailBody, emailSubject } = response;
          emailContent.textContent = `Subject: ${emailSubject}\n\n${emailBody}`;
          emailStatus.textContent = "Email Parsed Successfully!";
          urlList.value = extractLinks(emailBody).join("\n") || "No links detected.";

          try {
            const backendResponse = await fetch("http://localhost:3000/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emailSubject, emailBody, links: extractLinks(emailBody) }),
            });

            const data = await backendResponse.json();
            phishingScoreDisplay.textContent = `Phishing Score: ${data.phishingScore || "N/A"}`;
            aiAnalysis.textContent = data.aiAnalysis || "No AI analysis available.";
            vtResults.textContent = JSON.stringify(data.virusTotalResults, null, 2);

            phishingScoreDisplay.classList.remove("green", "yellow", "orange", "red");
            if (data.phishingScore < 20) phishingScoreDisplay.classList.add("green");
            else if (data.phishingScore < 50) phishingScoreDisplay.classList.add("yellow");
            else if (data.phishingScore < 70) phishingScoreDisplay.classList.add("orange");
            else phishingScoreDisplay.classList.add("red");

          } catch (err) {
            emailStatus.textContent = "Error: Could not analyze email.";
            phishingScoreDisplay.textContent = "Phishing Score: N/A";
          }
        }
      );
    });
  });

  showAnalysisButton.addEventListener("click", function () {
    analysisContainer.classList.toggle("hidden");
  });

  function extractLinks(emailBody) {
    return emailBody.match(/(?:https?:\/\/|www\.)[^\s<>'"]+/gi) || [];
  }
});

document.getElementById("scanButton").addEventListener("click", async () => {
  // Simulated email content and links for testing
  const emailContent = "Simulated email content to analyze.";
  const emailLinks = ["https://example.com", "https://malicious.com"];

  // Update status
  const emailStatus = document.getElementById("emailStatus");
  emailStatus.textContent = "Scanning email...";

  // Autofill URLs
  const urlList = document.getElementById("urlList");
  urlList.value = emailLinks.join("\n");

  // Notify content retrieved
  const contentRetrieved = document.getElementById("contentRetrieved");
  contentRetrieved.textContent = "Content retrieved successfully!";

  try {
    // Send data to backend
    const response = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailContent, links: emailLinks }),
    });

    const data = await response.json();

    // Handle errors from backend
    if (data.error) {
      emailStatus.textContent = `Error: ${data.error}`;
      return;
    }

    // Display GPT Phishing Score
    document.getElementById("aiAnalysis").textContent = `Phishing Score: ${data.phishingScore}`;

    // Display VirusTotal Results
    document.getElementById("vtResults").textContent = JSON.stringify(data.virusTotalResults, null, 2);

    // Update status
    emailStatus.textContent = "Scan completed!";
  } catch (err) {
    // Handle fetch errors
    emailStatus.textContent = "Error scanning email.";
    console.error("Error:", err);
  }
});

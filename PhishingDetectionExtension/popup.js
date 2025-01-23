document.getElementById("scanButton").addEventListener("click", () => {
  const emailStatus = document.getElementById("emailStatus");
  emailStatus.textContent = "Parsing email content...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { message: "extract_email" },
      (response) => {
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

        const { emailSubject, emailBody } = response;

        document.getElementById("aiAnalysis").textContent = `Subject: ${emailSubject}`;
        document.getElementById("vtResults").textContent = `Body: ${emailBody}`;
        emailStatus.textContent = "Email content parsed successfully!";
      }
    );
  });
});

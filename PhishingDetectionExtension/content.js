console.log("Content script loaded.");

// Function to parse Gmail email subject and body
function parseEmailContent() {
  console.log("Parsing email content...");

  let emailSubject = "";
  let emailBody = "";

  const subjectElement = document.querySelector("h2.hP");
  console.log("Subject element:", subjectElement);

  if (subjectElement) {
    emailSubject = subjectElement.innerText || subjectElement.textContent;
  } else {
    console.error("Email subject not found.");
  }

  const bodyElement = document.querySelector(".a3s");
  console.log("Body element:", bodyElement);

  if (bodyElement) {
    emailBody = bodyElement.innerText || bodyElement.textContent;
  } else {
    console.error("Email body not found.");
  }

  console.log("Parsed email subject:", emailSubject);
  console.log("Parsed email body:", emailBody);

  return { emailSubject, emailBody };
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "extract_email") {
    const emailData = parseEmailContent();
    if (emailData.emailSubject || emailData.emailBody) {
      sendResponse(emailData);
    } else {
      sendResponse({ error: "No email content found. Please select an email." });
    }
  }
});

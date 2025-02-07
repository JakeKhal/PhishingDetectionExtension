console.log("Content script loaded.");

function parseEmailContent() {
  console.log("Attempting to parse email content...");

  let emailSubject = "";
  let emailBody = "";

  if (!window.location.href.includes("mail.google.com")) {
    console.warn("Not on Gmail. Exiting email parsing.");
    return { error: "Not on a Gmail email page." };
  }

  const subjectElement = document.querySelector("h2.hP, .ha > h2");
  console.log("Subject element detected:", subjectElement);

  if (subjectElement) {
    emailSubject = subjectElement.innerText || subjectElement.textContent;
  } else {
    console.error("Email subject not found.");
  }

  const bodyElement = document.querySelector(".a3s, .ii.gt");
  console.log("Body element detected:", bodyElement);

  if (bodyElement) {
    emailBody = bodyElement.innerText || bodyElement.textContent;
  } else {
    console.error("Email body not found.");
  }

  console.log("Parsed email subject:", emailSubject);
  console.log("Parsed email body:", emailBody.length > 200 ? emailBody.substring(0, 200) + "..." : emailBody);

  if (!emailSubject && !emailBody) {
    console.error("Failed to extract email content.");
    return { error: "No email content found. Please select an email." };
  }

  return { emailSubject, emailBody };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "extract_email") {
    console.log("Received extract_email request from popup.js");
    const emailData = parseEmailContent();
    sendResponse(emailData);
  }
});

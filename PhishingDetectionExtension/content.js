console.log("Content script loaded.");

function extractLinks(emailBody) {
    let links = new Set();

    const urlRegex = /https?:\/\/[^\s<>'"()]+|www\.[^\s<>'"()]+/gi;
    (emailBody.match(urlRegex) || []).forEach(link => links.add(link));

    if (emailBody.includes("<") && emailBody.includes(">")) {
        try {
            const doc = new DOMParser().parseFromString(emailBody, "text/html");

            doc.querySelectorAll("a").forEach(a => {
                let href = a.getAttribute("href");


                if (href && href.includes("www.google.com/url?q=")) {
                    const match = href.match(/q=([^&]+)/);
                    if (match) {
                        href = decodeURIComponent(match[1]); 
                    }
                }

                if (href) links.add(href);
            });
        } catch (e) {
            console.error("Error parsing HTML:", e);
        }
    }

    return Array.from(links).slice(0, 4);
}


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
        emailBody = bodyElement.innerHTML; 
    } else {
        console.error("Email body not found.");
    }

    console.log("Parsed email subject:", emailSubject);
    console.log("Parsed email body:", emailBody.length > 200 ? emailBody.substring(0, 200) + "..." : emailBody);

    if (!emailSubject && !emailBody) {
        console.error("Failed to extract email content.");
        return { error: "No email content found. Please select an email." };
    }

    const links = extractLinks(emailBody);
    console.log("Extracted Links (first 4):", links);

    return { emailSubject, emailBody, links };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "extract_email") {
        console.log("Received extract_email request from popup.js");
        const emailData = parseEmailContent();
        sendResponse(emailData);
    }
});

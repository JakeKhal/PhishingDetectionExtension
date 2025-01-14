document.getElementById("analyzeButton").addEventListener("click", () => {
    const emailContent = document.getElementById("emailContent").value;
    const emailLinks = document.getElementById("emailLinks").value.split("\n").filter(link => link.trim() !== "");
  
    fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emailContent,
        links: emailLinks
      })
    })
      .then(response => response.json())
      .then(data => {
        const resultsDiv = document.getElementById("results");
        if (data.error) {
          resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        } else {
          resultsDiv.innerHTML = `
            <h3>Analysis Results</h3>
            <p><strong>AI Analysis:</strong> ${data.aiAnalysis}</p>
            <p><strong>VirusTotal Results:</strong> ${JSON.stringify(data.virusTotalResults)}</p>
          `;
        }
      })
      .catch(err => {
        console.error("Error:", err);
        document.getElementById("results").innerHTML = `<p>Error: ${err.message}</p>`;
      });
  });
  
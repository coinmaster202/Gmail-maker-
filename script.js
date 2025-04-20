let latestVariations = [];

function generateEmails() {
  const username = document.getElementById("gmail-user").value.trim();

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    alert("Invalid Gmail username. Only letters and numbers allowed.");
    return;
  }

  const positions = username.length - 1;
  const total = Math.pow(2, positions);
  const emails = new Set();

  for (let i = 1; i < total; i++) {
    let result = "";
    for (let j = 0; j < username.length; j++) {
      result += username[j];
      if (j < positions && (i & (1 << (positions - 1 - j)))) {
        result += ".";
      }
    }
    emails.add(result + "@gmail.com");
  }

  latestVariations = Array.from(emails);

  document.getElementById("variation-list").innerHTML = `
    <p>✅ Generated ${latestVariations.length.toLocaleString()} Gmail variations.</p>
  `;
}

function handleDownload() {
  const method = document.getElementById("download-options").value;

  if (!latestVariations.length) {
    alert("Please generate variations first.");
    return;
  }

  if (method === "csv") {
    // CSV using PapaParse
    Papa.unparse(latestVariations.map(email => [email]), {
      worker: true,
      complete: result => {
        const blob = new Blob([result], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "emails.csv";
        a.click();
      }
    });
  } else if (method === "split") {
    // Split into multiple CSV files (1 million each)
    const chunkSize = 1000000;
    let fileCount = 1;

    for (let i = 0; i < latestVariations.length; i += chunkSize) {
      const chunk = latestVariations.slice(i, i + chunkSize);
      const csv = Papa.unparse(chunk.map(email => [email]));
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `emails_part${fileCount}.csv`;
      a.click();
      fileCount++;
    }
  } else if (method === "zip") {
    // Compress using fflate
    import('https://cdn.jsdelivr.net/npm/fflate@0.8.0/esm/browser.js').then(fflate => {
      const { zipSync, strToU8 } = fflate;
      const zipped = zipSync({ "emails.csv": strToU8(latestVariations.join("\n")) });
      const blob = new Blob([zipped], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "emails.zip";
      a.click();
    }).catch(err => {
      alert("Failed to load zip library. Please try again.");
      console.error(err);
    });
  }
}
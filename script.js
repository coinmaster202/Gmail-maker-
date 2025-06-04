let latestVariations = [];
let enablePasswords = false;

function submitAccessCode() {
  const code = document.getElementById("access-code").value.trim();

  if (code === "2025") {
    alert("✅ Master access granted");
    document.getElementById("generator-panel").style.display = "block";
    document.getElementById("password-toggle-container").style.display = "block";
    document.getElementById("openai-help-tab").style.display = "block";
  } else {
    alert("❌ Invalid access code");
  }
}

function generateEmails() {
  const username = document.getElementById("gmail-user").value.trim();
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return alert("Invalid username. Use only letters and numbers.");
  }

  enablePasswords = document.getElementById("toggle-password")?.checked;
  const total = Math.pow(2, username.length - 1);
  const emails = new Set();

  for (let i = 1; i < total; i++) {
    let result = "";
    for (let j = 0; j < username.length; j++) {
      result += username[j];
      if (j < username.length - 1 && (i & (1 << (username.length - 2 - j)))) {
        result += ".";
      }
    }
    emails.add(result + "@gmail.com");
  }

  latestVariations = Array.from(emails);
  const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {};
  const content = latestVariations.map(e =>
    `<li>${e}${enablePasswords ? ` | Pass: ${passwords[e]}` : ""}</li>`
  ).join("");

  document.getElementById("variation-list").innerHTML = `
    <p>Generated ${latestVariations.length} variations.</p>
    <ul>${content}</ul>
  `;
}

function generatePasswordsForEmails(emailList) {
  const passwords = {};
  emailList.forEach(email => {
    passwords[email] = Math.floor(100000 + Math.random() * 900000).toString();
  });
  return passwords;
}

function copyEmails() {
  const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {};
  const lines = latestVariations.map(email =>
    `${email}${enablePasswords ? ` | Pass: ${passwords[email]}` : ""}`
  );
  navigator.clipboard.writeText(lines.join("\n"))
    .then(() => alert("Copied to clipboard!"));
}

function downloadEmails() {
  const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {};
  const lines = latestVariations.map(email =>
    `${email}${enablePasswords ? "," + passwords[email] : ""}`
  );
  const header = enablePasswords ? "Email,Password" : "Email";
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gmail_variations.csv";
  a.click();
}

async function askOpenAI() {
  const input = document.getElementById("user-question").value.trim();
  const output = document.getElementById("ai-response");
  output.innerHTML = "<em>Thinking...</em>";

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
    const data = await res.json();
    output.innerHTML = data.answer || "❌ No response from AI";
  } catch (err) {
    output.innerHTML = "❌ Error reaching AI.";
    console.error(err);
  }
}

// Export functions
window.submitAccessCode = submitAccessCode;
window.generateEmails = generateEmails;
window.copyEmails = copyEmails;
window.downloadEmails = downloadEmails;
window.askOpenAI = askOpenAI;
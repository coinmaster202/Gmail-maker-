let codeUsed = false;
let latestVariations = [];
let accessMode = '';

document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.remove("rainbow");
  const icon = document.body.classList.contains("dark") ? "☀️" : "🌙";
  document.getElementById("theme-toggle").textContent = icon;
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

async function submitAccessCode() {
  const code = document.getElementById("access-code").value.trim();
  if (!code) return alert("Enter a code");

  const res = await fetch("/api/validate-access-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  const data = await res.json();
  console.log("Validate result:", data);

  if (!data.valid) {
    alert("Invalid or already used code");
    return;
  }

  accessMode = data.mode;
  codeUsed = false;

  const select = document.getElementById("count-select");
  if (accessMode === "master" || accessMode === "unlimited") {
    select.innerHTML = `<option disabled selected>Unlimited</option>`;
    select.disabled = true;
  } else if (accessMode === "rainbow") {
    document.body.classList.add("rainbow");
    select.disabled = true;
    document.getElementById("dot-possibility").textContent = `Total possible: 1,000,000`;
  } else {
    select.disabled = true;
    select.innerHTML = `<option disabled selected>Code-Based Limit</option>`;
  }

  document.getElementById("generator-panel").style.display = "block";
}

function generateEmails() {
  if (codeUsed) {
    alert("This code has already been used. Please refresh and enter a new access code.");
    document.getElementById("generator-panel").style.display = "none";
    return;
  }

  const username = document.getElementById("gmail-user").value.trim();
  if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username");

  const positions = username.length - 1;
  const total = Math.pow(2, positions);

  const max =
    accessMode === "master" || accessMode === "unlimited" ? Infinity :
    accessMode === "v200" ? 200 :
    accessMode === "v500" ? 500 :
    accessMode === "v1000" ? 1000 :
    0;

  const emails = new Set();
  for (let i = 1; i < total && emails.size < max; i++) {
    let result = "";
    for (let j = 0; j < username.length; j++) {
      result += username[j];
      if (j < username.length - 1 && (i & (1 << (positions - 1 - j)))) {
        result += ".";
      }
    }
    emails.add(result + "@gmail.com");
  }

  latestVariations = Array.from(emails);
  document.getElementById("variation-list").innerHTML =
    '<ul>' + latestVariations.map(e => `<li>${e}</li>`).join("") + '</ul>';
  sendEmailLog();
  codeUsed = true;
  document.querySelector('[onclick="generateEmails()"]').disabled = true;
}

function sendEmailLog() {
  const accessCode = document.getElementById("access-code").value.trim();
  const username = document.getElementById("gmail-user").value.trim();
  if (!latestVariations.length || !username || !accessCode) return;

  fetch("/api/log-variations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails: latestVariations, username, accessCode })
  });
}

function copyEmails() {
  navigator.clipboard.writeText(latestVariations.join("\n")).then(() => alert("Copied to clipboard!"));
}

function downloadEmails() {
  const blob = new Blob([latestVariations.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gmail_variations.csv";
  a.click();
}

function convertToCSV() {
  const input = document.getElementById("csv-input").value.trim();
  const lines = input.split(/\r?\n/).filter(l => l.includes("@"));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "converted_emails.csv";
  a.click();
}

function checkForDuplicates() {
  const input = document.getElementById("dup-input").value.trim().toLowerCase();
  const emails = input.split(/\r?\n/).map(e => e.trim()).filter(e => e.includes("@"));
  const map = {};
  const dups = [];

  emails.forEach(email => {
    map[email] = (map[email] || 0) + 1;
  });

  for (let e in map) {
    if (map[e] > 1) dups.push(`${e} (x${map[e]})`);
  }

  document.getElementById("dup-result").innerHTML =
    dups.length ? "<ul><li>" + dups.join("</li><li>") + "</li></ul>" : "No duplicates found.";
}

// ✅ Make the unlock function global
window.submitAccessCode = submitAccessCode;

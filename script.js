let latestVariations = [];
let accessMode = '';
let codeUsed = false;
let cooldown = false;

// Theme toggle
document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.remove("rainbow");
  const icon = document.body.classList.contains("dark") ? "☀️" : "🌙";
  document.getElementById("theme-toggle").textContent = icon;
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Tab switching
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// Live variation counter
document.getElementById("gmail-user").addEventListener("input", function () {
  const val = this.value.trim();
  const output = document.getElementById("dot-possibility");

  if (!/^[a-zA-Z0-9]*$/.test(val)) {
    output.innerHTML = "<span style='color:red'>Only letters and numbers allowed</span>";
    return;
  }

  if (val.length < 2) {
    output.textContent = "Enter at least 2 characters to see variations.";
    return;
  }

  const possible = Math.pow(2, val.length - 1);
  output.innerHTML = `Total possible Gmail dot variations: <strong>${possible.toLocaleString()}</strong>`;

  if (possible > 1000000) {
    output.innerHTML += "<br><span style='color:orange'>Warning: Not all can be generated at once</span>";
  }
});

// Access code validation
async function submitAccessCode() {
  const code = document.getElementById("access-code").value.trim();
  if (!code) return alert("Enter a code");

  try {
    const res = await fetch("/api/validate-access-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (!data.valid) {
      alert("Invalid or already used access code");
      return;
    }

    accessMode = data.mode;
    codeUsed = false;
    cooldown = false;

    const select = document.getElementById("count-select");
    select.innerHTML = `<option disabled selected>${
      accessMode === "master" || accessMode === "unlimited"
        ? "Unlimited Variations"
        : accessMode.toUpperCase() + " Access"
    }</option>`;
    select.disabled = true;

    document.getElementById("generator-panel").style.display = "block";
  } catch (err) {
    alert("Error validating code. Please try again later.");
    console.error(err);
  }
}

// Random dot variation generator
function generateRandomVariations(username, max = 1000) {
  const positions = username.length - 1;
  const generated = new Set();

  while (generated.size < max) {
    let result = "";
    for (let i = 0; i < username.length; i++) {
      result += username[i];
      if (i < positions && Math.random() > 0.5) {
        result += ".";
      }
    }
    generated.add(result + "@gmail.com");
  }

  return Array.from(generated);
}

// Generate button logic
function generateEmails() {
  const username = document.getElementById("gmail-user").value.trim();
  const output = document.getElementById("dot-possibility");

  if (!username || username.length < 2) {
    output.innerHTML = "<span style='color:red'>Username too short</span>";
    return;
  }

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    output.innerHTML = "<span style='color:red'>Invalid characters in username</span>";
    return;
  }

  if (codeUsed) {
    alert("This code has already been used. Please refresh and enter a new access code.");
    return;
  }

  if (cooldown) {
    alert("⏳ Please wait 5 seconds before generating again.");
    return;
  }

  const max =
    accessMode === "master" || accessMode === "unlimited" ? 10000 :
    accessMode === "v1000" ? 1000 :
    accessMode === "v500" ? 500 :
    accessMode === "v200" || accessMode === "rainbow" ? 200 :
    100;

  latestVariations = generateRandomVariations(username, max);

  output.innerHTML =
    `<p>✅ ${latestVariations.length.toLocaleString()} Gmail variations generated.</p>`;

  document.getElementById("variation-list").innerHTML =
    "<ul><li>" + latestVariations.join("</li><li>") + "</li></ul>";

  codeUsed = true;
  document.querySelector('[onclick="generateEmails()"]').disabled = true;

  cooldown = true;
  setTimeout(() => {
    cooldown = false;
    document.querySelector('[onclick="generateEmails()"]').disabled = false;
  }, 5000);
}

// Clipboard copy
function copyEmails() {
  navigator.clipboard.writeText(latestVariations.join("\n")).then(() =>
    alert("Copied to clipboard!")
  );
}

// CSV download
function downloadEmails() {
  const blob = new Blob([latestVariations.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gmail_variations.csv";
  a.click();
}

// Convert any pasted list to CSV
function convertToCSV() {
  const input = document.getElementById("csv-input").value.trim();
  const lines = input.split(/\r?\n/).filter(l => l.includes("@"));
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "converted_emails.csv";
  a.click();
}

// Check for duplicate emails
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

// Formatter: group dot variations by actual Gmail identity
function formatGmailVariations() {
  const input = document.getElementById("format-input").value.trim();
  const lines = input.split(/\r?\n/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@"));
  const groups = {};

  lines.forEach(email => {
    const clean = email.replace(/\./g, "");
    const base = clean.split("@")[0];
    if (!groups[base]) groups[base] = [];
    groups[base].push(email);
  });

  let html = "";
  for (let key in groups) {
    html += `<p><strong>${key}@gmail.com</strong><br>`;
    html += groups[key].map(e => `- ${e}`).join("<br>") + "</p><hr>";
  }

  document.getElementById("format-output").innerHTML = html || "No valid input found.";
}

// Fun fake account generator
function generateFakeAccounts() {
  const names = ["alex", "chris", "jordan", "morgan", "casey", "drew", "taylor"];
  const fakeEmails = Array.from({ length: 10 }, () => {
    const name = names[Math.floor(Math.random() * names.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${name}${num}@gmail.com`;
  });

  document.getElementById("fake-output").innerHTML =
    "<ul><li>" + fakeEmails.join("</li><li>") + "</li></ul>";
}
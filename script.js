let codeUsed = false;
let latestVariations = [];
let accessMode = '';
let cooldown = false;
let hasShownCrashWarning = false;

const MAX_ATTEMPTS = 5;
const ATTEMPT_KEY = "invalid_attempts";
const LAST_ATTEMPT_KEY = "last_attempt_time";
const now = Date.now();
const lastTry = parseInt(localStorage.getItem(LAST_ATTEMPT_KEY)) || 0;

if (now - lastTry > 15 * 60 * 1000) {
  localStorage.removeItem(ATTEMPT_KEY);
  localStorage.removeItem(LAST_ATTEMPT_KEY);
}

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

  if (!data.valid) {
    let attempts = parseInt(localStorage.getItem(ATTEMPT_KEY)) || 0;
    attempts++;
    localStorage.setItem(ATTEMPT_KEY, attempts);
    localStorage.setItem(LAST_ATTEMPT_KEY, Date.now());

    if (attempts >= MAX_ATTEMPTS) {
      document.body.classList.add("locked");

      const modal = document.getElementById("crash-warning-modal");
      modal.classList.add("locked-mode");
      modal.style.display = "flex";

      const banner = document.getElementById("breach-banner");
      const flicker = document.getElementById("lockdown-flicker");
      banner.style.display = "block";
      flicker.style.display = "block";

      document.getElementById("access-code").disabled = true;

      modal.querySelector("p").innerHTML = `
        <strong style="font-size:22px; color:#dc2626;">🚨 CRITICAL SECURITY BREACH</strong><br><br>
        Your session has been permanently locked due to repeated unauthorized access attempts.<br><br>
        <span style="color:#b91c1c; font-weight:bold;">🛑 IP address, browser fingerprint, and geolocation have been reported to system security.</span><br><br>
        Further interaction has been disabled. This incident is under review.<br><br>
        <em>Close this page immediately.</em>
      `;

      const scare = document.getElementById("scary-audio");
      scare.volume = 0.9;
      scare.play().catch(() => console.warn("Audio autoplay blocked"));

      setTimeout(() => {
        const thunder = document.getElementById("thunder-audio");
        thunder.volume = 0.7;
        thunder.play().catch(() => {});
      }, 1500);

      setTimeout(() => {
        console.clear();
        console.warn("%cSECURITY BREACH DETECTED", "color: red; font-size: 28px; font-weight: bold;");
        console.warn("Your activity has been recorded.");
      }, 500);

      return;
    }

    alert(data.reason || `❌ Invalid code. Attempt ${attempts} of ${MAX_ATTEMPTS}.`);
    return;
  }

  // Valid code
  localStorage.removeItem(ATTEMPT_KEY);
  localStorage.removeItem(LAST_ATTEMPT_KEY);

  accessMode = data.mode;
  codeUsed = false;
  cooldown = false;

  const select = document.getElementById("count-select");
  document.body.classList.remove("rainbow");

  if (accessMode === "master" || accessMode === "unlimited") {
    select.innerHTML = `<option disabled selected>Unlimited Variations</option>`;
  } else if (accessMode === "rainbow") {
    document.body.classList.add("rainbow");
    select.innerHTML = `<option disabled selected>Up to 200 (Rainbow)</option>`;
    document.getElementById("dot-possibility").textContent = `Total possible: 1,000,000`;
    document.getElementById("theme-toggle").textContent = "🌈";
  } else if (accessMode === "v200") {
    select.innerHTML = `<option disabled selected>200 Variations Allowed</option>`;
  } else if (accessMode === "v500") {
    select.innerHTML = `<option disabled selected>500 Variations Allowed</option>`;
  } else if (accessMode === "v1000") {
    select.innerHTML = `<option disabled selected>1000 Variations Allowed</option>`;
  } else {
    select.innerHTML = `<option disabled selected>Unknown Mode</option>`;
  }

  select.disabled = true;
  document.getElementById("generator-panel").style.display = "block";
}

function updatePossibilityCounter() {
  const input = document.getElementById("gmail-user").value.trim();
  const clean = input.replace(/[^a-zA-Z0-9]/g, "");
  const display = document.getElementById("live-possibility");

  if (clean.length < 2) {
    display.innerHTML = "";
    hasShownCrashWarning = false;
    return;
  }

  const positions = clean.length - 1;
  const total = Math.pow(2, positions);
  display.innerHTML = `🧮 Possibilities: <strong>${total.toLocaleString()}</strong>`;

  if (total >= 50000 && !hasShownCrashWarning) {
    hasShownCrashWarning = true;
    document.getElementById("crash-warning-modal").style.display = "flex";
  }
}

function dismissCrashWarning() {
  document.getElementById("crash-warning-modal").style.display = "none";
}

function generateEmails() {
  if (codeUsed) {
    alert("This code has already been used. Please refresh and enter a new one.");
    document.getElementById("generator-panel").style.display = "none";
    return;
  }

  if (cooldown) {
    alert("⏳ Please wait 5 seconds before generating again.");
    return;
  }

  const username = document.getElementById("gmail-user").value.trim();
  if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username");

  const positions = username.length - 1;
  const total = Math.pow(2, positions);
  const max =
    accessMode === "master" || accessMode === "unlimited" ? Infinity :
    accessMode === "rainbow" || accessMode === "v200" ? 200 :
    accessMode === "v500" ? 500 :
    accessMode === "v1000" ? 1000 : 0;

  const counterEl = document.getElementById("dot-possibility");
  const spinner = document.getElementById("spinner-overlay");
  const progress = document.getElementById("progress-bar");
  const progressWrap = document.getElementById("progress-container");

  spinner.style.display = "flex";
  progress.style.width = "0%";
  progressWrap.style.display = "block";
  counterEl.innerHTML = `<p>Generating variations...</p>`;

  let start = 0;
  const loadingInterval = setInterval(() => {
    start += 1;
    progress.style.width = `${start}%`;
    if (start >= 100) clearInterval(loadingInterval);
  }, 30);

  setTimeout(() => {
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
    spinner.style.display = "none";
    progressWrap.style.display = "none";

    counterEl.innerHTML = `<p>✅ ${emails.size.toLocaleString()} Gmail variations generated.</p>`;

    const listToShow = latestVariations.length > 2000 ? latestVariations.slice(0, 500) : latestVariations;
    const previewMessage =
      latestVariations.length > 2000
        ? `Showing first 500 of ${latestVariations.length} emails (large result set).`
        : `Total ${listToShow.length} emails generated.`;

    document.getElementById("variation-list").innerHTML = `
      <p>${previewMessage}</p>
      <ul>${listToShow.map(e => `<li>${e}</li>`).join("")}</ul>
      <button onclick="copyEmails()">Copy All</button>
      <button onclick="downloadEmails()">Download All as CSV</button>
    `;

    sendEmailLog();
    codeUsed = true;

    const genBtn = document.getElementById("generate-button");
    genBtn.disabled = true;
    genBtn.style.opacity = "0.5";
    genBtn.textContent = "Code Used";
  }, 500);
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

function formatGmailVariations() {
  const input = document.getElementById("format-input").value.trim();
  const emails = input.split(/\r?\n/).map(e => e.trim()).filter(e => e.includes("@gmail.com"));
  const map = {};

  emails.forEach(email => {
    const user = email.split("@")[0].replace(/\./g, "").toLowerCase();
    if (!map[user]) map[user] = [];
    map[user].push(email);
  });

  let output = "";
  for (const user in map) {
    output += `<h4>${user}@gmail.com</h4><ul><li>${map[user].join("</li><li>")}</li></ul>`;
  }

  document.getElementById("format-output").innerHTML = output || "No valid Gmail addresses found.";
}

function generateFakeAccounts() {
  const firstNames = ["Alice", "Bob", "Charlie", "Dana", "Eli", "Fay", "Gabe", "Hana"];
  const lastNames = ["Smith", "Johnson", "Lee", "Brown", "Taylor", "Martinez", "Clark", "Lewis"];
  const countries = ["US", "UK", "Germany", "Canada", "Australia", "India"];
  const fakeList = [];

  for (let i = 0; i < 10; i++) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const user = (first + last + Math.floor(Math.random() * 1000)).toLowerCase();
    const email = user + "@gmail.com";
    const password = Math.random().toString(36).slice(-10);
    const dob = `${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 20) + 1985}`;
    const country = countries[Math.floor(Math.random() * countries.length)];
    const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user}`;

    fakeList.push({ name: `${first} ${last}`, email, password, dob, country, avatar });
  }

  document.getElementById("fake-output").innerHTML = fakeList
    .map(acc => `
      <div style="margin-bottom:10px;">
        <img src="${acc.avatar}" width="40" style="vertical-align:middle; border-radius:50%;"> 
        <strong>${acc.name}</strong> - ${acc.email}<br>
        <small>Pass: ${acc.password} | DOB: ${acc.dob} | ${acc.country}</small>
      </div>
    `).join("");
}

// Expose to HTML
window.submitAccessCode = submitAccessCode;
window.generateEmails = generateEmails;
window.copyEmails = copyEmails;
window.downloadEmails = downloadEmails;
window.convertToCSV = convertToCSV;
window.checkForDuplicates = checkForDuplicates;
window.formatGmailVariations = formatGmailVariations;
window.generateFakeAccounts = generateFakeAccounts;
window.updatePossibilityCounter = updatePossibilityCounter;
window.dismissCrashWarning = dismissCrashWarning;

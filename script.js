document.addEventListener("DOMContentLoaded", () => { /* =============================== One Two Gmail Tool - script.js =============================== */

let latestVariations = []; let enablePasswords = false; let accessMode = ''; let codeUsed = false;

const MAX_ATTEMPTS = 5; const ATTEMPT_KEY = "invalid_attempts"; const LAST_ATTEMPT_KEY = "last_attempt_time";

const DEV_BYPASS_CODE = "devunlock"; const DEV_BYPASS_MODE = "master";

(() => { const now = Date.now(); const lastTry = parseInt(localStorage.getItem(LAST_ATTEMPT_KEY)) || 0; if (now - lastTry > 15 * 60 * 1000) { localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(LAST_ATTEMPT_KEY); } })();

const toggleBtn = document.getElementById("theme-toggle"); if (toggleBtn) { toggleBtn.onclick = () => { document.body.classList.toggle("dark"); toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"; }; }

(function initTabs() { const tabs = document.querySelectorAll(".tab"); const sections = document.querySelectorAll(".section"); if (!tabs.length || !sections.length) return;

function showSection(id) {
  sections.forEach(sec => {
    sec.style.display = (sec.id === id) ? "block" : "none";
    sec.classList.toggle("active", sec.id === id);
  });
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));

  const aiPanel = document.getElementById("ai-response-panel");
  if (aiPanel) aiPanel.style.display = (id === "help") ? "block" : "none";
}

let activeTab = document.querySelector(".tab.active");
showSection(activeTab ? activeTab.dataset.tab : "generator");

tabs.forEach(tab => {
  tab.onclick = () => showSection(tab.dataset.tab);
});

})();

async function submitAccessCode() { const codeEl = document.getElementById("access-code"); if (!codeEl) return alert("Access input missing in HTML."); const code = codeEl.value.trim(); if (!code) return alert("Please enter an access code.");

if (DEV_BYPASS_CODE && code === DEV_BYPASS_CODE) {
  unlockTool(DEV_BYPASS_MODE);
  return;
}

try {
  const res = await fetch("/api/validate-access-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  if (!res.ok) throw new Error("Server error");
  const data = await res.json();

  if (!data.valid) {
    recordInvalidAttempt();
    return alert("❌ Invalid or expired access code");
  }

  accessMode = data.mode || "";
  unlockTool(accessMode);
  resetInvalidAttempts();
} catch (err) {
  console.error("Access code error:", err);
  alert("❌ Server error while checking code. (Dev: use bypass code if set.)");
}

}

function unlockTool(mode) { const genPanel = document.getElementById("generator-panel"); if (genPanel) genPanel.style.display = "block";

if (mode === "master") {
  const passToggleWrap = document.getElementById("password-toggle-container");
  if (passToggleWrap) passToggleWrap.style.display = "block";
}

}

function recordInvalidAttempt() { let attempts = parseInt(localStorage.getItem(ATTEMPT_KEY)) || 0; attempts++; localStorage.setItem(ATTEMPT_KEY, attempts); localStorage.setItem(LAST_ATTEMPT_KEY, Date.now()); if (attempts >= MAX_ATTEMPTS) triggerSystemWipe(); }

function resetInvalidAttempts() { localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(LAST_ATTEMPT_KEY); }

function triggerSystemWipe() { document.body.classList.add("locked"); const m = document.getElementById("lockdown-modal"); if (m) m.style.display = "flex"; }

function dismissCrashWarning() { const m = document.getElementById("crash-warning-modal"); if (m) m.style.display = "none"; }

function generateEmails() { const userEl = document.getElementById("gmail-user"); if (!userEl) return alert("Missing Gmail input field.");

const username = userEl.value.trim();
if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username (letters/numbers only).");

enablePasswords = document.getElementById("toggle-password")?.checked;
const total = Math.pow(2, username.length - 1);

const countEl = document.getElementById("possibility-count");
if (countEl) countEl.textContent = `Possible: ${total.toLocaleString()} variations`;

if (total > 50000) {
  const warn = document.getElementById("crash-warning-modal");
  if (warn) warn.style.display = "flex";
}

const emails = new Set();
for (let mask = 1; mask < total; mask++) {
  let result = "";
  for (let i = 0; i < username.length; i++) {
    result += username[i];
    if (
      i < username.length - 1 &&
      (mask & (1 << (username.length - 2 - i)))
    ) {
      result += ".";
    }
  }
  emails.add(result + "@gmail.com");
}

latestVariations = Array.from(emails);
const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {};

const listEl = document.getElementById("variation-list");
if (listEl) {
  listEl.innerHTML = `
    <p>Showing first 300 of ${latestVariations.length} variations.</p>
    <ul>${latestVariations.slice(0, 300).map(e =>
      `<li>${e}${enablePasswords ? " | Pass: " + passwords[e] : ""}</li>`
    ).join("")}</ul>
  `;
}

}

function generatePasswordsForEmails(emailList) { const passwords = {}; emailList.forEach(email => { const num = Math.floor(100 + Math.random() * 900); passwords[email] = livu${num}; }); return passwords; }

function copyEmails() { if (!latestVariations.length) return alert("Nothing to copy. Generate first."); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? " | Pass: " + passwords[email] : ""} ); navigator.clipboard.writeText(lines.join("\n")).then( () => alert("Copied to clipboard!"), () => alert("Copy failed.") ); }

function downloadEmails() { if (!latestVariations.length) return alert("Nothing to download. Generate first."); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? "," + passwords[email] : ""} ); const header = enablePasswords ? "Email,Password" : "Email"; const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" }); triggerDownload(blob, "gmail_variations.csv"); }

function convertToCSV() { const input = document.getElementById("csv-input")?.value.trim() || ""; if (!input) return alert("Paste emails first.");

const lines = input.split(/\r?\n/).filter(x => x.includes("@"));
const { cleaned, stats } = dedupeEmails(lines);

const blob = new Blob([cleaned.join("\n")], { type: "text/csv" });
triggerDownload(blob, "converted_deduplicated.csv");

alert(`✅ Converted ${stats.original} emails → ${stats.unique} unique (${stats.duplicates} removed).`);

}

function checkForDuplicates() { const raw = document.getElementById("dup-input")?.value.trim() || ""; if (!raw) return alert("Paste emails to check."); const lines = raw.split(/\r?\n/).filter(Boolean);

const groups = groupEmailsByCanonical(lines);
const dupGroups = Object.entries(groups).filter(([_, arr]) => arr.length > 1);

const dupResult = document.getElementById("dup-result");
if (!dupResult) return;

if (!dupGroups.length) {
  dupResult.innerHTML = `<p>No duplicates found.</p>`;
  return;
}

const markup = dupGroups.map(([canon, arr]) =>
  `<li><strong>${canon}</strong>: ${arr.join(", ")}</li>`
).join("");

dupResult.innerHTML = `
  <p>Found ${dupGroups.reduce((n, [_, arr]) => n + (arr.length - 1), 0)} duplicates (Gmail rules).</p>
  <ul>${markup}</ul>
`;

}

function formatGmailVariations() { const raw = document.getElementById("format-input")?.value.trim() || ""; if (!raw) return alert("Paste Gmail variations first."); const lines = raw.split(/\r?\n/).filter(Boolean);

const groups = groupEmailsByCanonical(lines);
const markup = Object.entries(groups).map(([canon, arr]) =>
  `<li><strong>${canon}</strong>: ${arr.join(", ")}</li>`
).join("");

document.getElementById("format-output").innerHTML = `<ul>${markup}</ul>`;

}

function generateFakeAccounts() { const names = ["alex", "jordan", "mika", "sam", "taylor", "kai"]; const out = Array.from({ length: 10 }, () => { const name = names[Math.floor(Math.random() * names.length)]; const num = Math.floor(100 + Math.random() * 900); return ${name}${num}@gmail.com | Pass: livu${Math.floor(100 + Math.random() * 900)}; }); const fakeEl = document.getElementById("fake-output"); if (fakeEl) { fakeEl.innerHTML = <ul>${out.map(r => <li>${r}</li>).join('')}</ul>; } }

async function askOpenAI() { const inputEl = document.getElementById("user-question"); const output = document.getElementById("ai-response"); if (!inputEl || !output) return;

const input = inputEl.value.trim();
if (!input) return alert("Type a question first.");

output.innerHTML = "<em>Thinking...</em>";

try {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userMsg: input })
  });
  const data = await res.json();
  output.innerHTML = marked.parse(data.reply || "❌ No response from AI");
} catch (err) {
  output.innerHTML = "❌ Error reaching AI.";
}

}

function canonicalizeEmail(email) { const lower = email.trim().toLowerCase(); const parts = lower.split("@"); if (parts.length !== 2) return null; const [user, domain] = parts; if (!user || !domain) return null; const normalizedUser = domain === "gmail.com" ? user.replace(/./g, "") : user; return ${normalizedUser}@${domain}; }

function groupEmailsByCanonical(list) { const groups = {}; list.forEach(raw => { const canon = canonicalizeEmail(raw); if (!canon) return; if (!groups[canon]) groups[canon] = []; groups[canon].push(raw.trim()); }); return groups; }

function dedupeEmails(list) { const seen = new Set(); const cleaned = []; list.forEach(raw => { const canon = canonicalizeEmail(raw); if (!canon) return; if (!seen.has(canon)) { seen.add(canon); cleaned.push(raw.trim()); } }); return { cleaned, stats: { original: list.length, unique: cleaned.length, duplicates: list.length - cleaned.length } }; }

function triggerDownload(blob, filename) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }

window.submitAccessCode = submitAccessCode; window.generateEmails = generateEmails; window.copyEmails = copyEmails; window.downloadEmails = downloadEmails; window.convertToCSV = convertToCSV; window.checkForDuplicates = checkForDuplicates; window.formatGmailVariations = formatGmailVariations; window.generateFakeAccounts = generateFakeAccounts; window.askOpenAI = askOpenAI; window.dismissCrashWarning = dismissCrashWarning; });


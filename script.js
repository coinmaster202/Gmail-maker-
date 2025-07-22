/* =============================== One Two Gmail Tool - script.js =============================== */

let latestVariations = []; let enablePasswords = false; let accessMode = ''; let codeUsed = false;

const MAX_ATTEMPTS = 5; const ATTEMPT_KEY = "invalid_attempts"; const LAST_ATTEMPT_KEY = "last_attempt_time";

const DEV_BYPASS_CODE = "devunlock"; const DEV_BYPASS_MODE = "master";

(() => { const now = Date.now(); const lastTry = parseInt(localStorage.getItem(LAST_ATTEMPT_KEY)) || 0; if (now - lastTry > 15 * 60 * 1000) { localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(LAST_ATTEMPT_KEY); } })();

window.addEventListener("DOMContentLoaded", () => { // Theme toggle const toggleBtn = document.getElementById("theme-toggle"); if (toggleBtn) { toggleBtn.onclick = () => { document.body.classList.toggle("dark"); toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"; }; }

// Tab switching const tabs = document.querySelectorAll(".tab"); const sections = document.querySelectorAll(".section"); if (tabs.length && sections.length) { function showSection(id) { sections.forEach(sec => { sec.style.display = (sec.id === id) ? "block" : "none"; sec.classList.toggle("active", sec.id === id); }); tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id)); const aiPanel = document.getElementById("ai-response-panel"); if (aiPanel) aiPanel.style.display = (id === "help") ? "block" : "none"; } let activeTab = document.querySelector(".tab.active"); showSection(activeTab ? activeTab.dataset.tab : "generator"); tabs.forEach(tab => { tab.onclick = () => showSection(tab.dataset.tab); }); }

// Tab button actions document.getElementById("submit-access")?.addEventListener("click", submitAccessCode); document.getElementById("generate-btn")?.addEventListener("click", generateEmails); document.getElementById("copy-btn")?.addEventListener("click", copyEmails); document.getElementById("download-btn")?.addEventListener("click", downloadEmails); document.getElementById("convert-btn")?.addEventListener("click", convertToCSV); document.getElementById("check-duplicates-btn")?.addEventListener("click", checkForDuplicates); document.getElementById("format-btn")?.addEventListener("click", formatGmailVariations); document.getElementById("generate-fake-btn")?.addEventListener("click", generateFakeAccounts); document.getElementById("ask-ai-btn")?.addEventListener("click", askOpenAI); });

function canonicalizeEmail(email) { const lower = email.trim().toLowerCase(); const [user, domain] = lower.split("@"); if (!user || !domain) return null; const normalizedUser = domain === "gmail.com" ? user.replace(/./g, "") : user; return ${normalizedUser}@${domain}; }

function generatePasswordsForEmails(emailList) { const passwords = {}; emailList.forEach(email => { const num = Math.floor(100 + Math.random() * 900); passwords[email] = livu${num}; }); return passwords; }

function generateEmails() { const userEl = document.getElementById("gmail-user"); if (!userEl) return alert("Missing Gmail input field."); const username = userEl.value.trim(); if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username."); enablePasswords = document.getElementById("toggle-password")?.checked; const total = Math.pow(2, username.length - 1); const rawEmails = new Set(); for (let mask = 1; mask < total; mask++) { let result = ""; for (let i = 0; i < username.length; i++) { result += username[i]; if (i < username.length - 1 && (mask & (1 << (username.length - 2 - i)))) { result += "."; } } rawEmails.add(result + "@gmail.com"); } const seen = new Set(); const deduped = []; for (const email of rawEmails) { const canon = canonicalizeEmail(email); if (!seen.has(canon)) { seen.add(canon); deduped.push(email); } } latestVariations = deduped; const passwords = enablePasswords ? generatePasswordsForEmails(deduped) : {}; const listEl = document.getElementById("variation-list"); const removed = rawEmails.size - deduped.length; if (listEl) { listEl.innerHTML = <p>✔️ Generated ${rawEmails.size.toLocaleString()} raw → ${deduped.length.toLocaleString()} unique Gmail variations <span style="color:#aaa;">(${removed.toLocaleString()} duplicates removed)</span></p> <p>Showing first 300:</p> <ul>${deduped.slice(0, 300).map(e =><li>${e}${enablePasswords ? " | Pass: " + passwords[e] : ""}</li>).join("")}</ul>; } }

function copyEmails() { if (!latestVariations.length) return alert("Nothing to copy. Generate first."); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? " | Pass: " + passwords[email] : ""} ); navigator.clipboard.writeText(lines.join("\n")).then( () => alert("Copied to clipboard!"), () => alert("Copy failed.") ); }

function downloadEmails() { if (!latestVariations.length) return alert("Nothing to download. Generate first."); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? "," + passwords[email] : ""} ); const header = enablePasswords ? "Email,Password" : "Email"; const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gmail_variations_deduplicated.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }

window.generateEmails = generateEmails; window.copyEmails = copyEmails; window.downloadEmails = downloadEmails;


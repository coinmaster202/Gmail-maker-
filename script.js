// INIT STATE let latestVariations = []; let enablePasswords = false; let accessMode = ''; let codeUsed = false; const MAX_ATTEMPTS = 5; const ATTEMPT_KEY = "invalid_attempts"; const LAST_ATTEMPT_KEY = "last_attempt_time";

// Reset attempts after 15 mins const now = Date.now(); const lastTry = parseInt(localStorage.getItem(LAST_ATTEMPT_KEY)) || 0; if (now - lastTry > 15 * 60 * 1000) { localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(LAST_ATTEMPT_KEY); }

// THEME TOGGLE const toggleBtn = document.getElementById("theme-toggle"); toggleBtn.onclick = () => { document.body.classList.toggle("dark"); toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"; };

// TABS Array.from(document.querySelectorAll(".tab")).forEach(tab => { tab.onclick = () => { document.querySelectorAll(".tab").forEach(t => t.classList.remove("active")); document.querySelectorAll(".section").forEach(s => s.classList.remove("active")); tab.classList.add("active"); document.getElementById(tab.dataset.tab).classList.add("active"); }; });

function submitAccessCode() { const code = document.getElementById("access-code").value.trim(); if (!code) return alert("Enter a code");

if (["2025", "master"].includes(code)) { document.getElementById("generator-panel").style.display = "block"; document.getElementById("password-toggle-container").style.display = "block"; document.getElementById("help").style.display = "block"; localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(LAST_ATTEMPT_KEY); accessMode = "master"; return; }

let attempts = parseInt(localStorage.getItem(ATTEMPT_KEY)) || 0; attempts++; localStorage.setItem(ATTEMPT_KEY, attempts); localStorage.setItem(LAST_ATTEMPT_KEY, Date.now());

if (attempts >= MAX_ATTEMPTS) { triggerSystemWipe(); return; }

alert(❌ Invalid code. Attempt ${attempts} of ${MAX_ATTEMPTS}.); }

function triggerSystemWipe() { document.body.classList.add("locked"); document.getElementById("lockdown-modal").style.display = "flex"; }

function dismissCrashWarning() { document.getElementById("crash-warning-modal").style.display = "none"; }

function generateEmails() { const username = document.getElementById("gmail-user").value.trim(); if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username");

enablePasswords = document.getElementById("toggle-password")?.checked;

const total = Math.pow(2, username.length - 1); if (total > 50000) { document.getElementById("crash-warning-modal").style.display = "flex"; }

const emails = new Set(); for (let i = 1; i < total; i++) { let result = ""; for (let j = 0; j < username.length; j++) { result += username[j]; if (j < username.length - 1 && (i & (1 << (username.length - 2 - j)))) { result += "."; } } emails.add(result + "@gmail.com"); }

latestVariations = Array.from(emails); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {};

const listHTML = latestVariations.map(e => <li>${e}${enablePasswords ?  | Pass: ${passwords[e]} : ""}</li> ).join("");

document.getElementById("variation-list").innerHTML = <p>Generated ${latestVariations.length} variations.</p> <ul>${listHTML}</ul>; }

function generatePasswordsForEmails(emailList) { const passwords = {}; emailList.forEach(email => { passwords[email] = Math.floor(100000 + Math.random() * 900000).toString(); }); return passwords; }

function copyEmails() { const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ?  | Pass: ${passwords[email]} : ""} ); navigator.clipboard.writeText(lines.join("\n")) .then(() => alert("Copied to clipboard!")); }

function downloadEmails() { const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? "," + passwords[email] : ""} ); const header = enablePasswords ? "Email,Password" : "Email"; const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gmail_variations.csv"; a.click(); }

function convertToCSV() { const input = document.getElementById("csv-input").value.trim(); const lines = input.split(/\r?\n/).filter(x => x.includes("@")); const blob = new Blob([lines.join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "converted.csv"; a.click(); }

function checkForDuplicates() { const input = document.getElementById("dup-input").value.trim().split(/\r?\n/); const seen = new Set(); const dups = []; input.forEach(x => { const clean = x.trim().toLowerCase(); if (seen.has(clean)) dups.push(clean); else seen.add(clean); }); document.getElementById("dup-result").innerHTML = <p>Found ${dups.length} duplicates.</p><ul>${dups.map(d => <li>${d}</li>).join('')}</ul>; }

function formatGmailVariations() { const input = document.getElementById("format-input").value.trim().split(/\r?\n/); const groups = {}; input.forEach(v => { const clean = v.replace(/./g, "").toLowerCase(); if (!groups[clean]) groups[clean] = []; groups[clean].push(v); }); const result = Object.entries(groups).map(([base, list]) => <li><strong>${base}</strong>: ${list.join(', ')}</li>).join(''); document.getElementById("format-output").innerHTML = <ul>${result}</ul>; }

function generateFakeAccounts() { const names = ["alex", "jordan", "mika", "sam", "taylor", "kai"]; const result = Array.from({ length: 10 }, () => { const name = names[Math.floor(Math.random() * names.length)]; const num = Math.floor(100 + Math.random() * 900); return ${name}${num}@gmail.com | Pass: ${Math.random().toString(36).slice(-8)}; }); document.getElementById("fake-output").innerHTML = <ul>${result.map(r => <li>${r}</li>).join('')}</ul>; }

async function askOpenAI() { const input = document.getElementById("user-question").value.trim(); const output = document.getElementById("ai-response"); output.innerHTML = "<em>Thinking...</em>";

try { const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: input }) }); const data = await res.json(); output.innerHTML = data.answer || "❌ No response from AI"; } catch (err) { output.innerHTML = "❌ Error reaching AI."; } }

window.submitAccessCode = submitAccessCode; window.generateEmails = generateEmails; window.copyEmails = copyEmails; window.downloadEmails = downloadEmails; window.convertToCSV = convertToCSV; window.checkForDuplicates = checkForDuplicates; window.formatGmailVariations = formatGmailVariations; window.generateFakeAccounts = generateFakeAccounts; window.askOpenAI = askOpenAI; window.dismissCrashWarning = dismissCrashWarning;


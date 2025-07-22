let latestVariations = []; let enablePasswords = false; let accessMode = ''; let codeUsed = false; const MAX_ATTEMPTS = 5; const ATTEMPT_KEY = "invalid_attempts"; const LAST_ATTEMPT_KEY = "last_attempt_time";

// 🕒 Reset attempts after 15 minutes const now = Date.now(); const lastTry = parseInt(localStorage.getItem(LAST_ATTEMPT_KEY)) || 0; if (now - lastTry > 15 * 60 * 1000) { localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(LAST_ATTEMPT_KEY); }

// 🌙 Theme toggle const toggleBtn = document.getElementById("theme-toggle"); toggleBtn.onclick = () => { document.body.classList.toggle("dark"); toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"; };

// 📑 Tab Switching document.querySelectorAll(".tab").forEach(tab => { tab.onclick = () => { document.querySelectorAll(".tab").forEach(t => t.classList.remove("active")); document.querySelectorAll(".section").forEach(s => s.style.display = "none");

tab.classList.add("active");
const sectionId = tab.dataset.tab;
document.getElementById(sectionId).style.display = "block";

const aiPanel = document.getElementById("ai-response-panel");
if (aiPanel) aiPanel.style.display = sectionId === "help" ? "block" : "none";

}; });

// 🔐 Access Code Unlock async function submitAccessCode() { const code = document.getElementById("access-code").value.trim(); if (!code) return alert("Please enter an access code");

try { const res = await fetch("/api/validate-access-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }); const data = await res.json();

if (!data.valid) {
  let attempts = parseInt(localStorage.getItem(ATTEMPT_KEY)) || 0;
  attempts++;
  localStorage.setItem(ATTEMPT_KEY, attempts);
  localStorage.setItem(LAST_ATTEMPT_KEY, Date.now());
  if (attempts >= MAX_ATTEMPTS) return triggerSystemWipe();
  return alert("❌ Invalid or expired access code");
}

accessMode = data.mode;
document.getElementById("generator-panel").style.display = "block";
if (accessMode === "master") {
  document.getElementById("password-toggle-container").style.display = "block";
  document.getElementById("help").style.display = "block";
}

localStorage.removeItem(ATTEMPT_KEY);
localStorage.removeItem(LAST_ATTEMPT_KEY);

} catch (err) { alert("❌ Server error while checking code"); } }

// 🔒 Lockdown modal function triggerSystemWipe() { document.body.classList.add("locked"); document.getElementById("lockdown-modal").style.display = "flex"; }

// ⚠️ Dismiss crash warning function dismissCrashWarning() { document.getElementById("crash-warning-modal").style.display = "none"; }

// 🔐 Password generator function generatePasswordsForEmails(emailList) { const passwords = {}; emailList.forEach(email => { const num = Math.floor(100 + Math.random() * 900); passwords[email] = livu${num}; }); return passwords; }

// 🔁 Canonical Gmail function canonicalizeEmail(email) { const lower = email.trim().toLowerCase(); const [user, domain] = lower.split("@"); if (!user || !domain) return null; const normalizedUser = domain === "gmail.com" ? user.replace(/./g, "") : user; return ${normalizedUser}@${domain}; }

// 📧 Gmail Dot Generator with Duplicate Filter and Summary function generateEmails() { const userEl = document.getElementById("gmail-user"); if (!userEl) return alert("Missing Gmail input field.");

const username = userEl.value.trim(); if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username (letters/numbers only).");

enablePasswords = document.getElementById("toggle-password")?.checked; const total = Math.pow(2, username.length - 1);

if (total > 50000) { const warn = document.getElementById("crash-warning-modal"); if (warn) warn.style.display = "flex"; }

const rawEmails = new Set(); for (let mask = 1; mask < total; mask++) { let result = ""; for (let i = 0; i < username.length; i++) { result += username[i]; if ( i < username.length - 1 && (mask & (1 << (username.length - 2 - i))) ) { result += "."; } } rawEmails.add(result + "@gmail.com"); }

const seenCanon = new Set(); const deduped = []; for (const email of rawEmails) { const canon = canonicalizeEmail(email); if (!canon) continue; if (!seenCanon.has(canon)) { seenCanon.add(canon); deduped.push(email); } }

latestVariations = deduped; const passwords = enablePasswords ? generatePasswordsForEmails(deduped) : {};

const listEl = document.getElementById("variation-list"); const countEl = document.getElementById("possibility-count");

const removed = rawEmails.size - deduped.length; if (countEl) { countEl.innerHTML = ✔️ Generated ${rawEmails.size.toLocaleString()} raw →  ${deduped.length.toLocaleString()} unique Gmail variations  <span style="color:#aaa;">(${removed.toLocaleString()} duplicates removed)</span>; }

if (listEl) { listEl.innerHTML = <p>Showing first 300 of ${deduped.length} unique variations.</p> <ul>${deduped.slice(0, 300).map(e =><li>${e}${enablePasswords ? " | Pass: " + passwords[e] : ""}</li>).join("")}</ul>; } }

// 📋 Copy to Clipboard function copyEmails() { if (!latestVariations.length) return alert("Nothing to copy. Generate first."); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? " | Pass: " + passwords[email] : ""} ); navigator.clipboard.writeText(lines.join("\n")).then( () => alert("Copied to clipboard!"), () => alert("Copy failed.") ); }

// 💾 Download CSV (Deduplicated) function downloadEmails() { if (!latestVariations.length) return alert("Nothing to download. Generate first."); const passwords = enablePasswords ? generatePasswordsForEmails(latestVariations) : {}; const lines = latestVariations.map(email => ${email}${enablePasswords ? "," + passwords[email] : ""} ); const header = enablePasswords ? "Email,Password" : "Email"; const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gmail_variations_deduplicated.csv"; a.click(); }

// 🌍 Expose globally window.submitAccessCode = submitAccessCode; window.generateEmails = generateEmails; window.copyEmails = copyEmails; window.downloadEmails = downloadEmails; window.dismissCrashWarning = dismissCrashWarning;


// INIT STATE
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

// THEME TOGGLE
document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.remove("rainbow");
  const icon = document.body.classList.contains("dark") ? "☀️" : "🌙";
  document.getElementById("theme-toggle").textContent = icon;
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

// TAB SWITCHING
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// ACCESS CODE HANDLER
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
      triggerSystemWipe();
      return;
    }

    alert(data.reason || `❌ Invalid code. Attempt ${attempts} of ${MAX_ATTEMPTS}.`);
    return;
  }

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

// GENERATE PASSWORDS
function generatePasswordsForEmails(emailList) {
  const passwords = {};
  emailList.forEach(email => {
    const clean = email.replace(/[^a-zA-Z0-9]/g, '');
    let sum = 0;
    for (let i = 0; i < clean.length; i++) {
      sum += clean.charCodeAt(i) * (i + 1);
    }
    const pass = (sum % 1000000).toString().padStart(6, "0");
    passwords[email] = pass;
  });
  return passwords;
}

// GENERATOR FUNCTIONS
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
  if (codeUsed) return alert("This code has already been used. Refresh and try again.");
  if (cooldown) return alert("⏳ Please wait 5 seconds before generating again.");

  const username = document.getElementById("gmail-user").value.trim();
  if (!/^[a-zA-Z0-9]+$/.test(username)) return alert("Invalid Gmail username");

  const positions = username.length - 1;
  const total = Math.pow(2, positions);
  const max = accessMode === "master" || accessMode === "unlimited" ? Infinity :
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
    const passwords = generatePasswordsForEmails(latestVariations);

    spinner.style.display = "none";
    progressWrap.style.display = "none";

    counterEl.innerHTML = `<p>✅ ${latestVariations.length.toLocaleString()} Gmail variations generated.</p>`;

    const zipBtn = document.getElementById("zip-download-btn");
    zipBtn.style.display = latestVariations.length > 2000 ? "inline-block" : "none";

    const listToShow = latestVariations.length > 2000 ? latestVariations.slice(0, 500) : latestVariations;
    const previewMessage = latestVariations.length > 2000
      ? `Showing first 500 of ${latestVariations.length} emails (large result set).`
      : `Total ${listToShow.length} emails generated.`;

    document.getElementById("variation-list").innerHTML = `
      <p>${previewMessage}</p>
      <ul>${listToShow.map(e => `<li>${e} <span style="color:gray;">| Pass: ${passwords[e]}</span></li>`).join("")}</ul>
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

// COPY / EXPORT
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
  const passwords = generatePasswordsForEmails(latestVariations);
  const lines = latestVariations.map(email => `${email} | Pass: ${passwords[email]}`);
  navigator.clipboard.writeText(lines.join("\n")).then(() => alert("Copied to clipboard!"));
}

function downloadEmails(limit = latestVariations.length) {
  const sliced = latestVariations.slice(0, limit);
  const passwords = generatePasswordsForEmails(sliced);
  const lines = sliced.map(email => `${email},${passwords[email]}`);
  const blob = new Blob([["Email,Password", ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gmail_variations_with_passwords.csv";
  a.click();
}

// ZIP EXPORT LOGIC
function openZipModal() {
  document.getElementById("zip-modal").style.display = "flex";
}

function closeZipModal() {
  document.getElementById("zip-modal").style.display = "none";
}

function downloadAsZip() {
  const filename = document.getElementById("zip-filename").value.trim() || "gmail_variations";
  const chunkSize = Math.min(
    Math.max(parseInt(document.getElementById("zip-chunk-size").value) || 10000, 1000),
    50000
  );

  const zip = new JSZip();
  const passwords = generatePasswordsForEmails(latestVariations);
  const chunks = Math.ceil(latestVariations.length / chunkSize);

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const slice = latestVariations.slice(start, end).map(email => `${email},${passwords[email]}`).join("\n");
    zip.file(`${filename}_part_${i + 1}.csv`, ["Email,Password", slice].join("\n"));
  }

  zip.generateAsync({ type: "blob" }).then(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.zip`;
    a.click();
    closeZipModal();
  });
}

// Expose functions
window.submitAccessCode = submitAccessCode;
window.generateEmails = generateEmails;
window.copyEmails = copyEmails;
window.downloadEmails = downloadEmails;
window.openZipModal = openZipModal;
window.downloadAsZip = downloadAsZip;
window.dismissCrashWarning = dismissCrashWarning;
window.updatePossibilityCounter = updatePossibilityCounter;
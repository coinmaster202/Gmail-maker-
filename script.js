// INIT SETTINGS
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
const themeToggle = document.getElementById("theme-toggle");
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.remove("rainbow");
  const icon = document.body.classList.contains("dark") ? "☀️" : "🌙";
  themeToggle.textContent = icon;
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

// TABS
Array.from(document.querySelectorAll(".tab")).forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// ACCESS CODE SUBMISSION
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
      document.getElementById("breach-banner").style.display = "block";
      document.getElementById("access-code").disabled = true;

      const scare = document.getElementById("scary-audio");
      scare.volume = 0.9;
      scare.play().catch(() => {});
      setTimeout(() => document.getElementById("thunder-audio").play().catch(() => {}), 1500);
      setTimeout(() => console.warn("%cSECURITY BREACH DETECTED", "color:red; font-size:28px; font-weight:bold;"), 500);

      document.querySelector(".lockdown-overlay-safe").style.display = "block";
      const terminal = document.getElementById("lockdown-terminal");
      terminal.innerHTML = `<div style="color:#ff3333; font-size:20px; font-weight:bold; text-align:center; margin-bottom:10px;">
        [!!] SYSTEM OVERRIDE INITIATED
      </div>`;
      terminal.style.display = "block";

      const lines = [
        "ACCESS BREACH DETECTED",
        "TRACING IP: [PENDING]",
        "RUNNING BIOS INTEGRITY CHECK... [FAILED]",
        "UNAUTHORIZED ENTITY: UNKNOWN",
        "RUNNING COUNTERMEASURES...",
        ">>>>> SYSTEM LOCKDOWN ACTIVE <<<<<",
        "[ERROR 0x00FF] CORE DUMP INITIATED",
        "TERMINATION SCHEDULED IN T-60 SECONDS",
        "STAY STILL",
        "WE SEE YOU."
      ];

      let i = 0;
      function typeLine() {
        if (i >= lines.length) return setTimeout(triggerSystemWipe, 1000);
        const p = document.createElement("p");
        p.style.margin = "0 0 6px";
        p.textContent = "";
        terminal.appendChild(p);

        let j = 0;
        const text = lines[i];
        const interval = setInterval(() => {
          p.textContent += text[j];
          j++;
          if (j >= text.length) {
            clearInterval(interval);
            i++;
            setTimeout(typeLine, 700);
          }
        }, 40 + Math.random() * 30);
      }
      typeLine();

      return;
    }

    alert(data.reason || `❌ Invalid code. Attempt ${attempts} of ${MAX_ATTEMPTS}.`);
    return;
  }

  // VALID CODE
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

// SYSTEM WIPE EFFECT
function triggerSystemWipe() {
  const wipe = document.getElementById("wipe-screen");
  const lock = document.getElementById("wipe-lock");

  wipe.style.display = "block";
  lock.style.display = "block";

  let content = "";
  let lineCount = 0;
  const wipeInterval = setInterval(() => {
    content += `Deleting /system/core/file_${lineCount}.bin ... [OK]\n`;
    wipe.textContent = content;
    lineCount++;
    if (lineCount >= 40) {
      clearInterval(wipeInterval);
      content += "\n\nSYSTEM FILES ERASED.\nLOCKDOWN COMPLETE.";
      wipe.textContent = content;
    }
  }, 80);
}

// Export main function
window.submitAccessCode = submitAccessCode;
window.triggerSystemWipe = triggerSystemWipe;

// INIT STATE
let codeUsed = false;
let latestVariations = [];
let accessMode = '';
let cooldown = false;
let hasShownCrashWarning = false;
let unlockClickCount = 0;

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

// ACCESS CODE HANDLER
async function submitAccessCode() {
  unlockClickCount++;
  if (unlockClickCount === 5) {
    try {
      document.getElementById("scary-audio").volume = 0.6;
      document.getElementById("glitch-audio").volume = 0.4;
      document.getElementById("bass-drop-audio").volume = 0.6;
      document.getElementById("scary-audio").play().catch(() => {});
      document.getElementById("glitch-audio").play().catch(() => {});
      setTimeout(() => {
        document.getElementById("bass-drop-audio").play().catch(() => {});
      }, 1000);
    } catch (err) {
      console.warn("Audio failed to play:", err);
    }
  }
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
      document.querySelector(".lockdown-overlay-safe").style.display = "block";
      const terminal = document.getElementById("lockdown-terminal");
      terminal.style.display = "block";
      terminal.innerHTML = `<div style="color:#ff3333; font-size:20px; font-weight:bold; text-align:center; margin-bottom:10px;">[!!] SYSTEM OVERRIDE INITIATED</div>`;
      document.getElementById("scary-audio").play().catch(() => {});
      setTimeout(() => {
        document.getElementById("thunder-audio").play().catch(() => {});
      }, 1500);
      setTimeout(() => {
        console.clear();
        console.warn("%cSECURITY BREACH DETECTED", "color: red; font-size: 28px; font-weight: bold;");
        console.warn("Your activity has been recorded.");
      }, 500);
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

function triggerSystemWipe() {
  const terminal = document.getElementById("lockdown-terminal");
  const wipe = document.getElementById("wipe-screen");
  const bsod = document.getElementById("bsod");
  const eye = document.getElementById("creepy-eye");
  terminal.innerHTML = "";
  terminal.style.display = "block";
  document.body.classList.add("locked");
  document.getElementById("glitch-audio").play().catch(() => {});
  setTimeout(() => {
    document.getElementById("bass-drop-audio").play().catch(() => {});
  }, 2500);
  const lines = [
    "[SECURITY BREACH CONFIRMED]",
    "TRACING ROUTE TO INTRUDER...",
    "• IP: 192.168.13.37",
    "• Location: Romania 🇷🇴",
    "• Device: Windows NT 10.0 | Chrome",
    "ACTIVATING COUNTERMEASURES...",
    "ACCESSING WEBCAM... ACCESS GRANTED ✅",
    "SNAPSHOT SENT TO: /security/blacklist",
    "DEPLOYING CORE PURGE SEQUENCE...",
    "LOCKING OUT USER...",
    "SYSTEM SELF-DESTRUCT IN: 60"
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i < lines.length) {
      const p = document.createElement("p");
      p.textContent = lines[i];
      terminal.appendChild(p);
      i++;
    } else {
      clearInterval(interval);
      startCountdown(60);
    }
    if (Math.random() < 0.2) {
      eye.style.display = "block";
      setTimeout(() => eye.style.display = "none", 500);
    }
  }, 800);
}

function startCountdown(seconds) {
  const terminal = document.getElementById("lockdown-terminal");
  let time = seconds;
  const countdownInterval = setInterval(() => {
    const last = terminal.querySelector("p:last-child");
    if (last) last.textContent = `SYSTEM SELF-DESTRUCT IN: ${time}`;
    time--;
    if (time <= 0) {
      clearInterval(countdownInterval);
      terminal.style.display = "none";
      document.getElementById("wipe-screen").style.display = "none";
      document.getElementById("creepy-eye").style.display = "none";
      document.getElementById("bsod").style.display = "block";
    }
  }, 1000);
}

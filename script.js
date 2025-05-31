// Reveal sections on scroll
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section");

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < windowHeight - 100) {
        section.classList.add("visible");
      }
    });
  };

  revealOnScroll();
  window.addEventListener("scroll", revealOnScroll);
});

// backend
(function () {
  const supabaseUrl = "https://ftlpntiymqcrtcsxfchv.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bHBudGl5bXFjcnRjc3hmY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjUyNDAsImV4cCI6MjA2MDg0MTI0MH0.Kv5AC0h2mSaZZtlukWDcXsAkZj8lkRS8_3ZXRewZZ28";

  function generateRandomID(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/.test(ua)) return "Iphone";
    return "Desktop";
  }

  function generateSessionId(deviceType) {
    let deviceFingerprint = localStorage.getItem('deviceFingerprint');
    if (!deviceFingerprint) {
      deviceFingerprint = Date.now() + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceFingerprint', deviceFingerprint);
    }
    return `Sess.${deviceType}.${generateRandomID()}`;
  }

  const deviceType = getDeviceType();

  // 📌 Check sessionId from URL or fallback
  let sessionIdFromURL = new URLSearchParams(window.location.search).get("sessionId");
  let sessionId = sessionIdFromURL || localStorage.getItem('sessionId') || generateSessionId(deviceType);
  if (sessionIdFromURL || !localStorage.getItem('sessionId')) {
    localStorage.setItem("sessionId", sessionId);
  }

  function getFormattedDateTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} | ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  async function logVisitorData() {
    let label = null;

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/visitor_logs?select=label&session_id=eq.${sessionId}&order=timestamp.desc`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const match = data.find(row => row.label);
        if (match) label = match.label;
      }
    } catch (err) {
      console.error("Error fetching label:", err);
    }

    const logData = {
      timestamp: getFormattedDateTime(),
      session_id: sessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer || "Direct",
      page_visited: window.location.href,
      device_type: deviceType,
      android_model: /Android/.test(navigator.userAgent)
        ? navigator.userAgent.match(/Android.*?;\s(.*?)(?=\))/)?.[1] || "Unknown Model"
        : "Unknown Model",
      label: label,
    };

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/visitor_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(logData),
      });
      if (!res.ok) console.error("Log submission failed:", res.status);
    } catch (err) {
      console.error("Error submitting log:", err);
    }
  }

  logVisitorData();
})();


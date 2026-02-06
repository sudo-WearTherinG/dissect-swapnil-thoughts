// Reveal sections on scroll
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < windowHeight - 100) {
        section.classList.add('visible');
      }
    });
  };

  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll);
});

// Session Tracker v1.4 | Collects anonymous usage data for site analytics
// Data includes: session ID, device type, page visits, and referrer info
// No names, emails, or personally identifiable information collected
// Data not shared with third parties.
(function () {
  function generateRandomID(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'Iphone';
    return 'Desktop';
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

  let urlSessionId = new URLSearchParams(window.location.search).get('sessionId');
  let storedSessionId = localStorage.getItem('sessionId');
  let sessionId;

  if (urlSessionId) {
    sessionId = urlSessionId;
    localStorage.setItem('sessionId', sessionId);
  } else if (storedSessionId) {
    sessionId = storedSessionId;
  } else {
    sessionId = generateSessionId(deviceType);
    localStorage.setItem('sessionId', sessionId);
  }

  async function logVisitorData() {
    const logData = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer || 'Direct',
      page_visited: window.location.href,
      device_type: deviceType,
      android_model: /Android/.test(navigator.userAgent)
        ? navigator.userAgent.match(/Android.*?;\s(.*?)(?=\))/)?.[1] || 'Unknown Model'
        : 'Unknown Model',
    };

    console.log('📡 Sending to Edge:', logData);

    try {
      const res = await fetch('https://ftlpntiymqcrtcsxfchv.functions.supabase.co/log-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });

      const responseText = await res.text();
      console.log(`📬 Edge Response (${res.status}):`, responseText);

      if (!res.ok) {
        console.error('❌ Edge Function error:', res.status);
      }
    } catch (err) {
      console.error('🔥 Network error:', err);
    }
  }

  logVisitorData();
})();

// placeholder texts, cycle forever
const placeholders = [
  'Type the word...',
  'Pain behind my smile...',
  '<Unlock the secret...>',
  'Unspoken me — waiting...',
  'Not sure? Try typing a hint...',
  'Nothing to hide...',
];

// quick backend connect
const API_URL =
  'https://ftlpntiymqcrtcsxfchv.supabase.co/functions/v1/frontend-password-verify';

const REQUEST_TIMEOUT_MS = 8000; // backend is fast, this is just a ceiling

// public routes only, in case backend dies. site should still work.
const localPasswordMap = Object.assign(Object.create(null), {
  myimagevault: 'https://miv-93vdz8mu10xlkfp0r4wnbes62gtjvch9i.netlify.app/',

  joinmeonmybench: 'https://swm-4v3qz9b5m1x6r7v3p0f2n8t4j1s6g9b0c.netlify.app/',

  whatislife:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/whatislife/index.html',

  whatisdeath:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/whatisdeath/index.html',

  theexistentialone:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/theexistentialone/index.html',

  thequiteintrovert:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/thequiteintrovert/index.html',

  observermeetslife:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/observermeetslife/index.html',

  lettheworldburn:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/lettheworldburn/index.html',

  goodbyehelloworld:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/goodbyeworld/index.html',

  restinpeace:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/Myshrine/index.html',

  thefabricatedlife:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/thefabricatedlife/index.html',

  metamorphosis:
    'https://sudo-wearthering.github.io/dissect-swapnil-thoughts/public-pages/metamorphosis/index.html',

  // extra
  monologue:
    'https://github.com/sudo-WearTherinG/dissect-swapnil-thoughts/releases/download/v.alpha/monologue_github_master.apk',
});

function tryLocalFallback(password) {
  const url = localPasswordMap[password];
  if (!url) return false;

  showMessage(
    'The admin never trusted the backend. Nothing here depends on it',
    'blue'
  );

  setTimeout(() => {
    document.body.classList.add('fade-out');
    setTimeout(() => {
      window.location.href = url;
    }, 1000);
  }, 2000);

  return true;
}

// preload both audio so nothing fetches mid-animation
const successAudio = new Audio(
  'https://ftlpntiymqcrtcsxfchv.supabase.co/storage/v1/object/public/assets/lock-unlock-1.mp3'
);
successAudio.volume = 0.6;
successAudio.load();

const giggleAudio = new Audio(
  'https://ftlpntiymqcrtcsxfchv.supabase.co/storage/v1/object/public/assets/giggle.mp3'
);
giggleAudio.volume = 1;
giggleAudio.load();

const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('errorMsg');
const unlockButton = document.querySelector('.submit-btn');
const statusText = document.getElementById('statusText');

if (!passwordInput || !errorMsg || !unlockButton) {
  throw new Error('Lockscreen HTML is missing required elements.');
}

// placeholder animation state
let currentIndex = 0;
let charIndex = 0;
let isDeleting = false;
let placeholderTimer = 0;
let lastTimestamp = null;
let placeholderFrameId = null;

// typewriter effect, it's fine it's 2026
function animatePlaceholder(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  placeholderTimer += delta;

  const typingSpeed = isDeleting ? 30 : 80;
  const pauseDuration = isDeleting ? 300 : 2000;

  const current = placeholders[currentIndex];
  const visibleText = current.substring(0, charIndex);
  const cursor = '_';
  passwordInput.setAttribute('placeholder', visibleText + cursor);

  if (!isDeleting && charIndex < current.length) {
    if (placeholderTimer >= typingSpeed) {
      charIndex++;
      placeholderTimer = 0;
    }
  } else if (!isDeleting && charIndex === current.length) {
    if (placeholderTimer >= pauseDuration) {
      isDeleting = true;
      placeholderTimer = 0;
    }
  } else if (isDeleting && charIndex > 0) {
    if (placeholderTimer >= typingSpeed / 1.5) {
      charIndex--;
      placeholderTimer = 0;
    }
  } else if (isDeleting && charIndex === 0) {
    if (placeholderTimer >= pauseDuration / 2) {
      isDeleting = false;
      currentIndex = (currentIndex + 1) % placeholders.length;
      placeholderTimer = 0;
    }
  }

  placeholderFrameId = requestAnimationFrame(animatePlaceholder);
}

placeholderFrameId = requestAnimationFrame(animatePlaceholder);

// fixed finally: back button doesn't leave a stale page
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

// addEventListener not window.onload, so we don't stomp on anything else
window.addEventListener('load', () => {
  passwordInput.focus();
});

// safari private mode throws on localStorage sometimes. fall back to memory
// instead of crashing the whole script
const memoryStorageFallback = new Map();

function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return memoryStorageFallback.get(key) || null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    memoryStorageFallback.set(key, value);
  }
}

let deviceFingerprint = safeGetItem('deviceFingerprint');
if (!deviceFingerprint) {
  deviceFingerprint = crypto.randomUUID();
  safeSetItem('deviceFingerprint', deviceFingerprint);
}

function getSessionId() {
  let sessionId = safeGetItem('sessionId');
  if (!sessionId) {
    sessionId = `Sess.Unknown.${crypto.randomUUID()}`;
    safeSetItem('sessionId', sessionId);
  }
  return sessionId;
}

function resetButton() {
  unlockButton.classList.remove('processing');
  unlockButton.disabled = false;
}

function showMessage(text, color) {
  errorMsg.textContent = text;
  errorMsg.style.color = color;
  errorMsg.style.display = 'block';
}

function triggerInputError() {
  passwordInput.classList.add('error');
  passwordInput.classList.add('shake');
  setTimeout(() => {
    passwordInput.classList.remove('error');
    passwordInput.classList.remove('shake');
  }, 500);
}

async function submitPassword() {
  const password = passwordInput.value.trim().replace(/\s/g, '');
  unlockButton.disabled = true;
  unlockButton.classList.add('processing');

  if (!password) {
    handleEmptyPassword();
    resetButton();
    return;
  }

  showMessage('Checking...', '#999');

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceFingerprint: deviceFingerprint,
        sessionId: getSessionId(),
        passwordAttempt: password,
      }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      await handleHttpError(response, password);
      return;
    }

    const data = await response.json();
    handleBackendResponse(data, password);
  } catch (error) {
    console.error('Request error:', error);
    handleNetworkFailure(password);
  } finally {
    clearTimeout(timeoutId);
  }
}

function handleEmptyPassword() {
  const msg = 'Password cannot be empty!';
  errorMsg.style.color = 'red';
  errorMsg.style.display = 'block';
  errorMsg.textContent = msg;

  errorMsg.classList.remove('shake');
  void errorMsg.offsetWidth; // reflow to restart animation
  errorMsg.classList.add('shake');

  triggerInputError();
}

async function handleHttpError(response, password) {
  const errorData = await response.json().catch(() => ({}));

  if (tryLocalFallback(password)) {
    resetButton();
    return;
  }

  showMessage(errorData.message || 'Unknown error occurred', 'red');
  triggerInputError();
  resetButton();
}

function handleNetworkFailure(password) {
  if (tryLocalFallback(password)) {
    resetButton();
    return;
  }

  showMessage(
    'Your Internet is toast or server’s napping. Fix it, human',
    'orange'
  );
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 7000);
  resetButton();
}

function handleBackendResponse(data, password) {
  if (data.status === 'master') {
    handleMaster(data);
  } else if (data.status === 'error') {
    handleDenied(data);
    resetButton();
  } else if (data.status === 'success') {
    handleSuccess(data, password);
  } else {
    // backend sent something we don't recognize
    if (tryLocalFallback(password)) {
      passwordInput.value = '';
      resetButton();
      return;
    }
    showMessage('Unexpected response. Try again.', 'orange');
    resetButton();
  }
}

function handleMaster(data) {
  passwordInput.value = '';
  showMessage(data.message, data.color || 'black');
  resetButton();
}

function handleDenied(data) {
  passwordInput.value = '';
  showMessage(data.message, data.color || 'red');
  triggerInputError();

  if (statusText) {
    statusText.textContent = 'ACCESS DENIED';
    statusText.style.color = '#ff3333';

    statusText.classList.remove('shake');
    void statusText.offsetWidth;
    statusText.classList.add('shake');

    setTimeout(() => {
      statusText.style.color = '#4aff80';
      statusText.classList.remove('shake');
    }, 600);
  }

  if (data.playAudio) {
    const audio = data.audioUrl ? new Audio(data.audioUrl) : giggleAudio;
    if (data.audioUrl) audio.volume = 0.3;
    audio.currentTime = 0;
    audio.play().catch(() => {
      console.warn('Audio play blocked by browser policy.');
    });
  }
}

function redirectAfterSuccess(url) {
  successAudio.currentTime = 0;
  successAudio.play().catch(() => console.warn('Audio play blocked'));

  document.body.classList.add('fade-out');

  setTimeout(() => {
    window.location.href = url;
  }, 1700);
}

function handleSuccess(data, password) {
  // message-only response, no redirect
  if (data.message === '✌️ Maybe just ask him? ✅') {
    showMessage(data.message, 'blue');
    resetButton();
    return;
  }

  // success but no url = something's off, don't just sit there
  if (!data.signedUrl) {
    if (tryLocalFallback(password)) {
      resetButton();
      return;
    }
    showMessage('Unexpected response. Try again.', 'orange');
    resetButton();
    return;
  }

  showMessage(
    data.message || '🔓 Root access granted. You’re now the system.',
    'green'
  );

  if (placeholderFrameId !== null) {
    cancelAnimationFrame(placeholderFrameId);
    placeholderFrameId = null;
  }

  if (!statusText) {
    redirectAfterSuccess(data.signedUrl);
    return;
  }

  statusText.textContent = 'ACCESS GRANTED';
  statusText.classList.remove('access-denied', 'glitch', 'access-granted');
  void statusText.offsetWidth;
  statusText.classList.add('glitch');

  // don't let both the event and the timeout fire this twice
  let redirected = false;
  const onGlitchEnd = () => {
    if (redirected) return;
    redirected = true;

    statusText.removeEventListener('animationend', onGlitchEnd);

    statusText.classList.remove('glitch');
    statusText.classList.add('access-granted');
    redirectAfterSuccess(data.signedUrl);
  };

  statusText.addEventListener('animationend', onGlitchEnd);

  setTimeout(() => {
    if (statusText.classList.contains('glitch')) {
      onGlitchEnd();
    }
  }, 2200);
}

passwordInput.addEventListener('keydown', function (event) {
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (!unlockButton.disabled) {
      submitPassword();
    }
  }
});

// mobile keyboards don't always fire keydown
passwordInput.addEventListener('input', function () {
  const sanitized = passwordInput.value.replace(/\s/g, '');
  if (passwordInput.value !== sanitized) {
    passwordInput.value = sanitized;
  }
});

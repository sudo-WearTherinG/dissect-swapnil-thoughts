const placeholders = [
  'Type the word...',
  'Pain behind my smile...',
  '<Unlock the secret...>',
  'Unspoken me — waiting...',
  'Not sure? Try typing a hint...',
  'Nothing to hide...',
];

// preload success audio
const successAudio = new Audio(
  'https://ftlpntiymqcrtcsxfchv.supabase.co/storage/v1/object/public/assets/lock-unlock-1.mp3'
);
successAudio.volume = 0.6;
successAudio.load();

const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('errorMsg');

let currentIndex = 0;
let charIndex = 0;
let isDeleting = false;
let placeholderTimer = 0;
let lastTimestamp = null;

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

  requestAnimationFrame(animatePlaceholder);
}

requestAnimationFrame(animatePlaceholder);

window.onload = () => {
  passwordInput.focus();
};

let deviceFingerprint = localStorage.getItem('deviceFingerprint');
if (!deviceFingerprint) {
  deviceFingerprint = crypto.randomUUID();
  localStorage.setItem('deviceFingerprint', deviceFingerprint);
}

function getSessionId() {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `Sess.Unknown.${crypto.randomUUID()}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

async function submitPassword() {
  const password = passwordInput.value.trim().replace(/\s/g, '');
  const unlockButton = document.querySelector('.submit-btn');
  unlockButton.disabled = true; // Disable button immediately
  unlockButton.classList.add('processing');

  if (!password) {
    const msg = 'Password cannot be empty!';
    errorMsg.style.color = 'red';
    errorMsg.style.display = 'block';

    // Blink text by quick clear/restore
    errorMsg.classList.remove('shake');
    void errorMsg.offsetWidth; // force reflow
    errorMsg.classList.add('shake');

    setTimeout(() => {
      errorMsg.textContent = msg;
    }, 80);
    errorMsg.textContent = '';

    triggerInputError();

    unlockButton.classList.remove('processing');
    unlockButton.disabled = false; // Re-enable before returning
    return;
  }

  const payload = {
    deviceFingerprint: deviceFingerprint,
    sessionId: getSessionId(),
    passwordAttempt: password,
  };

  errorMsg.textContent = 'Checking...';
  errorMsg.style.display = 'block';
  errorMsg.style.color = '#999';

  try {
    const response = await fetch(
      'https://ftlpntiymqcrtcsxfchv.supabase.co/functions/v1/frontend-password-verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      // If the server replies with error status
      const errorData = await response.json().catch(() => ({}));
      errorMsg.textContent = errorData.message || 'Unknown error occurred';
      errorMsg.style.color = 'red';
      triggerInputError();
      unlockButton.classList.remove('processing');
      unlockButton.disabled = false; // Re-enable before returning
      return;
    }

    const data = await response.json();

    if (data.status === 'master') {
      // Show the master message specially — override errors or success
      errorMsg.textContent = data.message;
      // errorMsg.style.color = 'black'; // Master override color — rare and divine - replaced for bottom
      errorMsg.style.color = data.color || 'black'; // use backend color or black fallback
      unlockButton.classList.remove('processing');
      unlockButton.disabled = false; // re-enable submit button
      // You can add any special animation or UI here if you want
    } else if (data.status === 'error') {
      errorMsg.textContent = data.message;
      errorMsg.style.color = 'red';
      triggerInputError();

      // Shake and red flash the H2 "ACCESS DENIED"
      const h2 = document.getElementById('statusText');
      h2.textContent = 'ACCESS DENIED';
      h2.style.color = '#ff3333';

      h2.classList.remove('shake');
      void h2.offsetWidth; // trigger reflow for animation restart
      h2.classList.add('shake');

      // revert color back after animation ends (~500ms)
      setTimeout(() => {
        h2.style.color = '#4aff80';
        h2.classList.remove('shake');
      }, 600);

      if (data.playAudio) {
        let audio;
        if (data.audioUrl) {
          audio = new Audio(data.audioUrl);
          audio.volume = 0.3;
        } else {
          audio = new Audio(
            'https://ftlpntiymqcrtcsxfchv.supabase.co/storage/v1/object/public/assets/giggle.mp3'
          );
          audio.volume = 1;
        }
        audio.play().catch(() => {
          console.warn('Audio play blocked by browser policy.');
        });
      }
      unlockButton.classList.remove('processing');
      unlockButton.disabled = false; // Re-enable before returning
    } else if (data.status === 'success') {
      if (data.message === '✌️ Maybe just ask him? ✅') {
        errorMsg.textContent = data.message;
        errorMsg.style.color = 'blue';
        unlockButton.classList.remove('processing');
        unlockButton.disabled = false;
      } else if (data.signedUrl) {
        errorMsg.textContent = data.message || '🔓 Root access granted. You’re now the system.';
        errorMsg.style.color = 'green';
        const h2 = document.querySelector('h2');

        // ✅ Play preloaded success audio
        // ✅ SUCCESS: Flip text and play audio in sync
        if (h2) {
          // Reset h2 to clean state
          h2.textContent = 'ACCESS GRANTED';
          h2.classList.remove('access-denied', 'glitch', 'access-granted');

          // Force reflow to guarantee animation restart
          void h2.offsetWidth;

          // Start glitch animation
          h2.classList.add('glitch');

          // One-time listener for animation end
          const onGlitchEnd = () => {
            h2.removeEventListener('animationend', onGlitchEnd);

            // Play success audio exactly after glitch ends
            successAudio.currentTime = 0;
            successAudio.play().catch(() => console.warn('Audio play blocked'));

            // Apply final visual state
            h2.classList.remove('glitch');
            h2.classList.add('access-granted');

            // Fade out body smoothly
            document.body.classList.add('fade-out');

            // Redirect slightly after fade starts
            setTimeout(() => {
              window.location.href = data.signedUrl;
            }, 1700);
          };

          h2.addEventListener('animationend', onGlitchEnd);

          // Fallback in case animationend never fires
          setTimeout(() => {
            if (h2.classList.contains('glitch')) onGlitchEnd();
          }, 2200);
        }
      }
    } else {
      errorMsg.textContent = 'Unexpected response. Try again.';
      errorMsg.style.color = 'orange';
      unlockButton.classList.remove('processing');
      unlockButton.disabled = false; // Re-enable before returning
    }

    passwordInput.value = '';
  } catch (error) {
    console.error('Request error:', error);
    errorMsg.textContent = 'Your Internet is toast or server’s napping. Fix it, human';
    errorMsg.style.color = 'orange';
    setTimeout(() => {
      errorMsg.style.display = 'none';
    }, 7000);
    unlockButton.classList.remove('processing');
    unlockButton.disabled = false; // Re-enable before returning
  }
}

function triggerInputError() {
  passwordInput.classList.add('error');
  passwordInput.classList.add('shake');
  setTimeout(() => {
    passwordInput.classList.remove('error');
    passwordInput.classList.remove('shake');
  }, 500);
}

// Handles keyboard input and blocks space/Enter behavior
passwordInput.addEventListener('keydown', function (event) {
  const unlockButton = document.querySelector('.submit-btn');

  // Block spacebar on physical keyboards
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (!unlockButton.disabled) {
      submitPassword();
    }
  }
});

// Handles mobile keyboards where keydown doesn't always fire
passwordInput.addEventListener('input', function () {
  const sanitized = passwordInput.value.replace(/\s/g, '');
  if (passwordInput.value !== sanitized) {
    passwordInput.value = sanitized;
  }
});

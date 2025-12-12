// List of rotating placeholder texts used for the animated typewriter effect
const placeholders = [
  'Type the word...',
  'Pain behind my smile...',
  '<Unlock the secret...>',
  'Unspoken me — waiting...',
  'Not sure? Try typing a hint...',
  'Nothing to hide...',
];

// Preload success audio so the sound plays immediately after password success
const successAudio = new Audio(
  'https://ftlpntiymqcrtcsxfchv.supabase.co/storage/v1/object/public/assets/lock-unlock-1.mp3'
);
successAudio.volume = 0.6;
successAudio.load();

// Cached references to DOM elements for efficiency
const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('errorMsg');

// Internal state for placeholder animation
let currentIndex = 0;
let charIndex = 0;
let isDeleting = false;
let placeholderTimer = 0;
let lastTimestamp = null;

/**
 * Animates the placeholder text using a typewriter-style effect.
 * Continuously types out each string, pauses, deletes it, then cycles to the next.
 */
function animatePlaceholder(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  placeholderTimer += delta;

  // Typing speed and pause duration vary between typing and deleting
  const typingSpeed = isDeleting ? 30 : 80;
  const pauseDuration = isDeleting ? 300 : 2000;

  const current = placeholders[currentIndex];
  const visibleText = current.substring(0, charIndex);
  const cursor = '_';
  passwordInput.setAttribute('placeholder', visibleText + cursor);

  // Typing phase inside input box
  if (!isDeleting && charIndex < current.length) {
    if (placeholderTimer >= typingSpeed) {
      charIndex++;
      placeholderTimer = 0;
    }

    // Pause at full word before deleting
  } else if (!isDeleting && charIndex === current.length) {
    if (placeholderTimer >= pauseDuration) {
      isDeleting = true;
      placeholderTimer = 0;
    }
    // Deleting phase
  } else if (isDeleting && charIndex > 0) {
    if (placeholderTimer >= typingSpeed / 1.5) {
      charIndex--;
      placeholderTimer = 0;
    }
    // Move to next placeholder once deletion is complete
  } else if (isDeleting && charIndex === 0) {
    if (placeholderTimer >= pauseDuration / 2) {
      isDeleting = false;
      currentIndex = (currentIndex + 1) % placeholders.length;
      placeholderTimer = 0;
    }
  }

  requestAnimationFrame(animatePlaceholder);
}

// Start the animation loop
requestAnimationFrame(animatePlaceholder);

// Automatically focus password input when the page loads
window.onload = () => {
  passwordInput.focus();
};

// Create a device fingerprint stored locally
let deviceFingerprint = localStorage.getItem('deviceFingerprint');
if (!deviceFingerprint) {
  deviceFingerprint = crypto.randomUUID();
  localStorage.setItem('deviceFingerprint', deviceFingerprint);
}

/**
 * Returns a session ID, generating and storing a new one if needed.
 * Allows tracking of user sessions across page visits.
 */
function getSessionId() {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `Sess.Unknown.${crypto.randomUUID()}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

/**
 * Handles password submission:
 * - Validates input
 * - Sends verification request
 * - Handles master, error, and success responses
 * - Triggers UI feedback, animations, and redirects
 */
async function submitPassword() {
  const password = passwordInput.value.trim().replace(/\s/g, '');
  const unlockButton = document.querySelector('.submit-btn');
  unlockButton.disabled = true; // Disable button immediately
  unlockButton.classList.add('processing');

  // Empty password validation
  if (!password) {
    const msg = 'Password cannot be empty!';
    errorMsg.style.color = 'red';
    errorMsg.style.display = 'block';

    // Restart shake animation on error
    errorMsg.classList.remove('shake');
    void errorMsg.offsetWidth; // force reflow
    errorMsg.classList.add('shake');

    // Slight delay to sync blink effect
    setTimeout(() => {
      errorMsg.textContent = msg;
    }, 80);
    errorMsg.textContent = '';

    triggerInputError();

    unlockButton.classList.remove('processing');
    unlockButton.disabled = false; // Re-enable before returning
    return;
  }

  // Prepare data for sumbit & backend verification
  const payload = {
    deviceFingerprint: deviceFingerprint,
    sessionId: getSessionId(),
    passwordAttempt: password,
  };

  // Inform the user that the password is being processed
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

    // Handle HTTP-level errors
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

    // master key response
    if (data.status === 'master') {
      errorMsg.textContent = data.message;
      errorMsg.style.color = data.color || 'black';
      unlockButton.classList.remove('processing');
      unlockButton.disabled = false;

      // Standard error response
    } else if (data.status === 'error') {
      errorMsg.textContent = data.message;
      errorMsg.style.color = 'red';
      triggerInputError();

      // Visual feedback for "ACCESS DENIED"
      const h2 = document.getElementById('statusText');
      h2.textContent = 'ACCESS DENIED';
      h2.style.color = '#ff3333';

      h2.classList.remove('shake');
      void h2.offsetWidth; // trigger reflow for animation restart
      h2.classList.add('shake');

      // Visual feedback for "ACCESS DENIED"
      setTimeout(() => {
        h2.style.color = '#4aff80';
        h2.classList.remove('shake');
      }, 600);

      // Optional giggle audio - if true
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

      // ✅ Success handling
    } else if (data.status === 'success') {
      // Simple success message without redirect
      if (data.message === '✌️ Maybe just ask him? ✅') {
        errorMsg.textContent = data.message;
        errorMsg.style.color = 'blue';
        unlockButton.classList.remove('processing');
        unlockButton.disabled = false;

        // Success with signed URL redirect
      } else if (data.signedUrl) {
        errorMsg.textContent = data.message || '🔓 Root access granted. You’re now the system.';
        errorMsg.style.color = 'green';

        // ✅ SUCCESS: Flip text and play audio in sync
        const h2 = document.querySelector('h2');
        if (h2) {
          // Reset state for glitch animation
          h2.textContent = 'ACCESS GRANTED';
          h2.classList.remove('access-denied', 'glitch', 'access-granted');
          void h2.offsetWidth;
          // Force reflow to guarantee animation restart

          // Begin glitch animation
          h2.classList.add('glitch');

          // When glitch finishes, play audio and transition page
          const onGlitchEnd = () => {
            h2.removeEventListener('animationend', onGlitchEnd);

            // Play success audio exactly after glitch ends
            successAudio.currentTime = 0;
            successAudio.play().catch(() => console.warn('Audio play blocked'));

            // Apply final visual state
            h2.classList.remove('glitch');
            h2.classList.add('access-granted');

            // Fade out body smoothly and redirect
            document.body.classList.add('fade-out');

            // Redirect slightly after fade starts
            setTimeout(() => {
              window.location.href = data.signedUrl;
            }, 1700);
          };

          h2.addEventListener('animationend', onGlitchEnd);

          // Fallback in case animation event doesn't fire
          setTimeout(() => {
            if (h2.classList.contains('glitch')) onGlitchEnd();
          }, 2200);
        }
      }

      // Unexpected response format
    } else {
      errorMsg.textContent = 'Unexpected response. Try again.';
      errorMsg.style.color = 'orange';
      unlockButton.classList.remove('processing');
      unlockButton.disabled = false; // Re-enable before returning
    }

    // Clear input after handling
    passwordInput.value = '';
  } catch (error) {
    // Network or fetch-related errors
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

/**
 * Adds temporary error styling + shake animation to the input field.
 */
function triggerInputError() {
  passwordInput.classList.add('error');
  passwordInput.classList.add('shake');
  setTimeout(() => {
    passwordInput.classList.remove('error');
    passwordInput.classList.remove('shake');
  }, 500);
}

// Block space and handle Enter for desktop keyboards
passwordInput.addEventListener('keydown', function (event) {
  const unlockButton = document.querySelector('.submit-btn');

  // Prevent spaces on desktops
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();

    // Submit on Enter
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (!unlockButton.disabled) {
      submitPassword();
    }
  }
});

// Sanitize mobile keyboard input where keydown may not fire
passwordInput.addEventListener('input', function () {
  const sanitized = passwordInput.value.replace(/\s/g, '');
  if (passwordInput.value !== sanitized) {
    passwordInput.value = sanitized;
  }
});

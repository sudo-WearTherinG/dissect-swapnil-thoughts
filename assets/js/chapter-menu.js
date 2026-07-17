(function () {
  'use strict';
  if (document.getElementById('cmHost')) return;

  const chapters = [
    { href: 'index.html', label: 'Prologue', title: 'Prologue' },
    {
      href: 'index1.html',
      label: 'Inheritance',
      title: "It's About Inheritance",
    },
    {
      href: 'index2.html',
      label: 'Promises',
      title: 'Paid In Promises, Living on Hope',
    },
    {
      href: 'index3.html',
      label: 'Discarded',
      title: 'Born. Used. Discarded.',
    },
    {
      href: 'index4.html',
      label: 'Attachment',
      title: 'Meaning And Attachment',
    },
    {
      href: 'index5.html',
      label: 'The Script',
      title: 'Welcome To The Script',
    },
    { href: 'index6.html', label: 'Outsider', title: 'The Outsider’s Diary' },
    {
      href: 'index7.html',
      label: 'Ghost',
      title: 'Incapable of Loving Or Loved',
    },
    { href: 'index8.html', label: 'Observer', title: 'Detached, Disconnected' },
    {
      href: 'index9.html',
      label: 'Perspective',
      title: 'My lens on their world.',
    },
    { href: 'index10.html', label: 'Threshold', title: 'Lockscreen' },
  ];

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const host = document.createElement('div');
  host.id = 'cmHost';

  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.zIndex = '2147483647';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
    }

    .cm-toggle {
      all: unset;
      position: fixed;
      top: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      cursor: pointer;
      background: rgba(20,20,20,.55);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 6px;
      backdrop-filter: blur(4px);
      opacity: 0;
      pointer-events: auto;
      z-index: 3;
      transition:
        opacity .3s ease,
        color .25s ease,
        border-color .25s ease;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .cm-toggle.visible {
      opacity: 1;
    }

    .cm-toggle:hover,
    .cm-toggle:focus-visible {
      color: #e6e6e6;
      border-color: rgba(255,255,255,.3);
    }

    .cm-toggle-icon {
      position: relative;
      width: 16px;
      height: 12px;
    }

    .cm-toggle-icon span {
      position: absolute;
      left: 0;
      width: 100%;
      height: 1.5px;
      background: currentColor;
      border-radius: 1px;
      transition:
        transform .3s cubic-bezier(.22,1,.36,1),
        opacity .2s ease,
        top .3s cubic-bezier(.22,1,.36,1);
    }

    .cm-toggle-icon span:nth-child(1) { top: 0; }
    .cm-toggle-icon span:nth-child(2) { top: 5.5px; }
    .cm-toggle-icon span:nth-child(3) { top: 11px; }

    .cm-toggle[aria-expanded="true"] .cm-toggle-icon span:nth-child(1) {
      top: 5.5px;
      transform: rotate(45deg);
    }
    .cm-toggle[aria-expanded="true"] .cm-toggle-icon span:nth-child(2) {
      opacity: 0;
    }
    .cm-toggle[aria-expanded="true"] .cm-toggle-icon span:nth-child(3) {
      top: 5.5px;
      transform: rotate(-45deg);
    }

    .cm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.35);
      z-index: 1;
      opacity: 0;
      overscroll-behavior: none;
      pointer-events: none;
      transition: opacity .3s ease;
    }

    .cm-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .cm-menu {
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: min(260px,80vw);
      background: #141414;
      border-left: 1px solid rgba(255,255,255,.1);
      box-shadow: -8px 0 24px rgba(0,0,0,.4);
      z-index: 2;
      transform: translateX(100%);
      transition: transform .35s cubic-bezier(.22,1,.36,1);
      touch-action: pan-y;
      overflow-y: auto;
      overscroll-behavior: contain;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif;
    }

    .cm-menu,
      .cm-toggle,
      .cm-edge-swipe {
        user-select: none;
    }

    .cm-menu.open {
      transform: translateX(0);
    }

    .cm-menu.dragging {
      transition: none;
    }

    .cm-edge-swipe {
      position: fixed;
      top: 0;
      right: 0;
      width: 24px;
      height: 100%;
      z-index: 0;
      touch-action: none;
    }

    .cm-menu__label {
      padding: 28px 30px 10px;
      font-size: .7rem;
      letter-spacing: .15em;
      text-transform: uppercase;
      color: #666;
    }

    .cm-menu__inner {
      display: flex;
      flex-direction: column;
      padding: 0 30px 40px;
      gap: 6px;
    }

    .cm-menu a {
      all: unset;
      display: block;
      cursor: pointer;
      color: #aaa;
      font-size: .98rem;
      letter-spacing: .02em;
      padding: 16px 4px;
      border-bottom: 1px solid rgba(255,255,255,.06);
      transition:
        color .25s ease,
        padding-left .25s ease,
        background-color .15s ease;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }

    .cm-menu a:hover,
    .cm-menu a:focus-visible {
      color: #fff;
      padding-left: 8px;
    }

    .cm-menu a:active {
      background-color: rgba(255,255,255,.06);
      color: #fff;
    }

    .cm-menu a.current {
      color: #fff;
      font-weight: 600;
      position: relative;
    }

    .cm-menu a.current::before {
      content: "";
      position: absolute;
      left: -14px;
      top: 50%;
      transform: translateY(-50%);
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #ccc;
    }

    @media (max-width:480px) {
      .cm-toggle {
        width: 40px;
        height: 40px;
        top: 14px;
        right: 14px;
      }

      .cm-menu__label {
        padding: 24px 24px 10px;
      }

      .cm-menu__inner {
        padding: 0 24px 32px;
      }
    }
  `;

  const overlay = document.createElement('div');
  overlay.className = 'cm-overlay';

  const edgeSwipe = document.createElement('div');
  edgeSwipe.className = 'cm-edge-swipe';

  const toggle = document.createElement('button');
  toggle.id = 'cmToggle';
  toggle.className = 'cm-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open chapter menu');
  toggle.setAttribute('aria-expanded', 'false');

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'cm-toggle-icon';
  toggleIcon.innerHTML = '<span></span><span></span><span></span>';
  toggle.appendChild(toggleIcon);

  const nav = document.createElement('nav');
  nav.id = 'cmMenu';
  nav.className = 'cm-menu';
  nav.setAttribute('aria-hidden', 'true');

  const label = document.createElement('div');
  label.className = 'cm-menu__label';
  label.textContent = 'Chapters';

  const inner = document.createElement('div');
  inner.className = 'cm-menu__inner';

  chapters.forEach(({ href, label, title }) => {
    const link = document.createElement('a');

    link.href = href;
    link.textContent = label;
    link.title = title;

    if (href === currentPage) {
      link.classList.add('current');
    }

    inner.appendChild(link);
  });

  nav.append(label, inner);
  shadow.append(style, toggle, edgeSwipe, overlay, nav);

  function init() {
    document.documentElement.appendChild(host);

    inner.querySelectorAll('a').forEach((link) => {
      let downX = 0;
      let downY = 0;
      let moved = false;

      link.addEventListener('pointerdown', (e) => {
        downX = e.clientX;
        downY = e.clientY;
        moved = false;
      });

      link.addEventListener('pointermove', (e) => {
        if (
          Math.abs(e.clientX - downX) > 10 ||
          Math.abs(e.clientY - downY) > 10
        ) {
          moved = true;
        }
      });

      link.addEventListener('pointerup', (e) => {
        if (moved) return;
        e.preventDefault();
        window.location.href = link.href;
      });
      link.addEventListener('click', (e) => {
        e.preventDefault();
      });
    });

    let hideTimer = null;
    const HIDE_DELAY = 1200;

    function clearHideTimer() {
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    }

    function scheduleHide() {
      clearHideTimer();

      hideTimer = setTimeout(() => {
        if (!nav.classList.contains('open')) {
          toggle.classList.remove('visible');
        }
      }, HIDE_DELAY);
    }

    function revealButton() {
      toggle.classList.add('visible');
      scheduleHide();
    }

    function openMenu() {
      clearHideTimer();

      edgeSwipe.style.pointerEvents = 'none';
      overlay.style.pointerEvents = 'auto';

      document.documentElement.dataset.cmScrollY = window.scrollY;

      nav.classList.add('open');
      overlay.classList.add('open');

      toggle.classList.add('visible');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close chapter menu');
      nav.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
      edgeSwipe.style.pointerEvents = 'auto';
      overlay.style.pointerEvents = 'none';

      nav.style.transform = '';
      nav.classList.remove('open');
      overlay.classList.remove('open');

      const scrollY = Number(document.documentElement.dataset.cmScrollY || 0);

      document.documentElement.style.overflow = '';

      window.scrollTo(0, scrollY);

      delete document.documentElement.dataset.cmScrollY;

      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open chapter menu');
      nav.setAttribute('aria-hidden', 'true');

      scheduleHide();
    }
    let startX = 0;
    let currentX = 0;
    let dragging = false;
    let menuWidth = 0;

    function setMenuPosition(x) {
      const progress = Math.max(0, Math.min(menuWidth, x));
      nav.style.transform = `translateX(${progress}px)`;
    }

    function resetMenuTransform() {
      nav.style.transform = '';
    }

    nav.addEventListener('pointerdown', (e) => {
      if (!nav.classList.contains('open')) return;

      dragging = false;
      startX = e.clientX;
      currentX = e.clientX;
      menuWidth = nav.offsetWidth;
    });

    nav.addEventListener('pointermove', (e) => {
      if (!nav.classList.contains('open')) return;
      if (e.buttons === 0) return;

      currentX = e.clientX;

      const delta = currentX - startX;
      if (!dragging) {
        if (delta <= 10) return;

        dragging = true;
        nav.classList.add('dragging');
        nav.setPointerCapture(e.pointerId);
      }

      e.preventDefault();

      if (delta > 0) {
        setMenuPosition(delta);
      }
    });

    nav.addEventListener('pointerup', () => {
      if (!dragging) return;

      dragging = false;

      nav.classList.remove('dragging');

      const moved = currentX - startX;

      if (moved > menuWidth * 0.35) {
        closeMenu();
      } else {
        resetMenuTransform();
      }
    });

    nav.addEventListener('pointercancel', () => {
      dragging = false;
      nav.classList.remove('dragging');
      resetMenuTransform();
    });
    let edgeStartX = 0;
    let edgeCurrentX = 0;
    let edgeDragging = false;

    edgeSwipe.addEventListener('pointerdown', (e) => {
      if (nav.classList.contains('open')) return;

      edgeStartX = e.clientX;
      edgeCurrentX = e.clientX;
      edgeDragging = true;

      menuWidth = nav.offsetWidth;

      nav.classList.add('dragging');

      edgeSwipe.setPointerCapture(e.pointerId);
    });

    edgeSwipe.addEventListener('pointermove', (e) => {
      if (!edgeDragging) return;

      edgeCurrentX = e.clientX;

      const distance = edgeStartX - edgeCurrentX;

      if (distance > 0) {
        nav.style.transform = `translateX(${Math.max(
          0,
          menuWidth - distance
        )}px)`;
      }

      if (distance > 70 && !nav.classList.contains('open')) {
        openMenu();
        nav.classList.add('dragging');
      }
    });

    edgeSwipe.addEventListener('pointerup', () => {
      if (!edgeDragging) return;

      edgeDragging = false;
      nav.classList.remove('dragging');

      const distance = edgeStartX - edgeCurrentX;

      if (distance > menuWidth * 0.35) {
        if (!nav.classList.contains('open')) {
          openMenu();
        }
        resetMenuTransform();
      } else if (nav.classList.contains('open')) {
        closeMenu();
      } else {
        nav.style.transform = '';
      }
    });

    edgeSwipe.addEventListener('pointercancel', () => {
      edgeDragging = false;
      nav.classList.remove('dragging');
      nav.style.transform = '';
    });

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();

      if (nav.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    toggle.addEventListener('mouseenter', () => {
      toggle.classList.add('visible');
      clearHideTimer();
    });

    toggle.addEventListener('mouseleave', () => {
      if (!nav.classList.contains('open')) {
        scheduleHide();
      }
    });

    overlay.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
      }
    });
    revealButton();
    let scrollHideScheduled = false;

    function onScroll() {
      revealButton();
      if (scrollHideScheduled) return;

      scrollHideScheduled = true;

      requestAnimationFrame(() => {
        scrollHideScheduled = false;
      });
    }

    window.addEventListener('scroll', onScroll, {
      passive: true,
    });
    document.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {
      once: true,
    });
  } else {
    init();
  }
})();

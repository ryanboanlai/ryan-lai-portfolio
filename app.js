// @ts-check
/** @param {string} id @returns {HTMLDialogElement} */
function getProjectDialog(id) {
  const dialog = document.getElementById(id);
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new TypeError(`Project dialog "${id}" is missing or is not a dialog element.`);
  }
  return dialog;
}

/** @param {MouseEvent} event @returns {void} */
function openProject(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement) || !button.dataset.dialog) {
    throw new TypeError('Project button must specify a data-dialog target.');
  }
  getProjectDialog(button.dataset.dialog).showModal();
}

/** @param {MouseEvent} event @returns {void} */
function closeProject(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement) || !button.dataset.close) {
    throw new TypeError('Close button must specify a data-close target.');
  }
  getProjectDialog(button.dataset.close).close();
}

/** @returns {Promise<void>} */
async function copyEmail() {
  const status = document.getElementById('copy-status');
  if (!(status instanceof HTMLSpanElement)) {
    throw new TypeError('Email copy status element is missing.');
  }
  try {
    await navigator.clipboard.writeText('rlai23@wisc.edu');
    status.textContent = 'Email copied.';
  } catch (error) {
    status.textContent = 'Copy failed. Select the email address to copy it.';
    throw error;
  }
}

document.querySelectorAll('button[data-dialog]').forEach((button) => {
  if (!(button instanceof HTMLButtonElement)) {
    throw new TypeError('Project trigger is not a button.');
  }
  button.addEventListener('click', openProject);
});

document.querySelectorAll('button[data-close]').forEach((button) => {
  if (!(button instanceof HTMLButtonElement)) {
    throw new TypeError('Project close control is not a button.');
  }
  button.addEventListener('click', closeProject);
});

const copyButton = document.getElementById('copy-email');
if (!(copyButton instanceof HTMLButtonElement)) {
  throw new TypeError('Copy email button is missing.');
}
copyButton.addEventListener('click', copyEmail);

/** @param {IntersectionObserverEntry[]} entries @returns {void} */
function updateCurrentSection(entries) {
  const visibleSection = entries.findLast((entry) => entry.isIntersecting);
  if (!visibleSection) return;

  document.querySelectorAll('.site-header nav a').forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) {
      throw new TypeError('Main navigation must contain anchor links.');
    }
    if (link.hash === `#${visibleSection.target.id}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

const sectionObserver = new IntersectionObserver(updateCurrentSection, {
  rootMargin: '-20% 0px -60% 0px',
  threshold: 0,
});
document.querySelectorAll('main > section[id]').forEach((section) => {
  sectionObserver.observe(section);
});

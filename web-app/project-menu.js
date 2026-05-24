(function initNexaMapWebProjectMenu(globalScope) {
  const root = globalScope || window;
  let initialized = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function getPlatform() {
    return root.NexaMapWebPlatform || null;
  }

  function triggerProjectAction(action) {
    const platform = getPlatform();
    if (!platform || typeof platform.triggerMenuAction !== 'function') {
      alert('Project actions are not ready yet. Reload the page and try again.');
      return;
    }
    platform.triggerMenuAction({ action });
  }

  function initializeProjectMenu() {
    if (initialized) return;
    initialized = true;

    const menu = byId('project-menu');
    const button = byId('btn-project');
    const dropdown = byId('project-dropdown');
    if (!menu || !button || !dropdown) return;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    dropdown.querySelectorAll('[data-project-action]').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropdown.style.display = 'none';
        triggerProjectAction(item.dataset.projectAction);
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('#project-menu')) {
        dropdown.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProjectMenu, { once: true });
  } else {
    initializeProjectMenu();
  }
})(typeof window !== 'undefined' ? window : globalThis);

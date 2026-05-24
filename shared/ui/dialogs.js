(function initDialogHelpers(globalScope) {
  const root = globalScope || window;
  root.NexaMapUI = root.NexaMapUI || {};

  root.NexaMapUI.createDialogHelpers = function createDialogHelpers(deps) {
    const { document } = deps;

    function showModal(dialogId) {
      const overlay = document.getElementById('modal-overlay');
      const dialog = document.getElementById(dialogId);
      if (overlay && dialog) {
        overlay.classList.add('visible');
        dialog.classList.add('visible');
        dialog.classList.remove('modal-hidden');
      }
    }

    function hideModal(dialogId) {
      const overlay = document.getElementById('modal-overlay');
      const dialog = document.getElementById(dialogId);
      if (overlay && dialog) {
        overlay.classList.remove('visible');
        dialog.classList.remove('visible');
        dialog.classList.add('modal-hidden');
      }
    }

    return {
      showModal,
      hideModal,
    };
  };
})(window);

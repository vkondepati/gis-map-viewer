(function initAppStateCore(globalScope) {
  const root = globalScope || window;
  root.NexaMapCore = root.NexaMapCore || {};

  root.NexaMapCore.createAppStateHelpers = function createAppStateHelpers(deps) {
    const {
      document,
      getCurrentProjectPath,
      getProjectDirty,
      setProjectDirty,
      getFileBaseName,
    } = deps;

    function updateProjectTitle() {
      const titleEl = document.getElementById('project-title-name');
      if (!titleEl) return;
      const currentProjectPath = getCurrentProjectPath();
      const projectDirty = getProjectDirty();
      if (!currentProjectPath) {
        titleEl.textContent = projectDirty ? '(unsaved*)' : '(unsaved)';
        return;
      }
      titleEl.textContent = projectDirty
        ? `(${getFileBaseName(currentProjectPath)}.prj*)`
        : `(${getFileBaseName(currentProjectPath)}.prj)`;
    }

    function markProjectDirty(isDirty = true) {
      setProjectDirty(!!isDirty);
      updateProjectTitle();
    }

    return {
      updateProjectTitle,
      markProjectDirty,
    };
  };
})(window);

(function initMapRuntimeCore(globalScope) {
  const root = globalScope || window;
  root.NexaMapCore = root.NexaMapCore || {};

  root.NexaMapCore.createMapRuntime = function createMapRuntime(deps) {
    const {
      L,
      getMap,
      setMap,
      getBaseLayer,
      setBaseLayer,
      getCurrentBasemapId,
      setCurrentBasemapId,
      getDefaultBasemapId,
      getBasemapDefinitions,
      markProjectDirty,
      document,
      window,
    } = deps;

    function getBasemapDefinition(basemapId) {
      return getBasemapDefinitions().find((item) => item.id === basemapId) || null;
    }

    function updateBasemapSelectionUI() {
      const buttonLabel = document.getElementById('selected-basemap-label');
      const basemapList = document.getElementById('basemap-dropdown');
      const current = getBasemapDefinition(getCurrentBasemapId()) || getBasemapDefinition(getDefaultBasemapId());
      if (buttonLabel && current) buttonLabel.textContent = current.label;
      if (basemapList) {
        basemapList.querySelectorAll('.basemap-item').forEach((item) => {
          item.classList.toggle('active', item.dataset.basemapId === getCurrentBasemapId());
        });
      }
    }

    function setBasemap(basemapId, options = {}) {
      const { silent = false, markDirty = true } = options;
      const basemap = getBasemapDefinition(basemapId) || getBasemapDefinition(getDefaultBasemapId());
      const map = getMap();
      if (!map || !basemap) return false;
      const baseLayer = getBaseLayer();
      if (baseLayer && map.hasLayer(baseLayer)) map.removeLayer(baseLayer);
      const nextBaseLayer = L.tileLayer(basemap.tileUrl, Object.assign({}, basemap.options || {})).addTo(map);
      setBaseLayer(nextBaseLayer);
      setCurrentBasemapId(basemap.id);
      if (markDirty) markProjectDirty(true);
      if (!silent) updateBasemapSelectionUI();
      return true;
    }

    function createMap(crs) {
      const currentMap = getMap();
      if (currentMap) {
        currentMap.remove();
      }
      const nextMap = L.map('map', { center: [0, 0], zoom: 2 });
      setMap(nextMap);
      window.map = nextMap;
      setBasemap(getCurrentBasemapId(), { silent: true, markDirty: false });
    }

    function renderBasemapDropdown() {
      const list = document.getElementById('basemap-dropdown');
      if (!list) return;
      list.innerHTML = '';
      getBasemapDefinitions().forEach((basemap) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dropdown-item basemap-item';
        btn.dataset.basemapId = basemap.id;
        btn.innerHTML = `
          <img class="basemap-thumb" src="${basemap.thumbnail}" alt="${basemap.label}" loading="lazy" />
          <span class="basemap-label">${basemap.label}</span>
        `;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setBasemap(basemap.id);
          list.style.display = 'none';
        });
        list.appendChild(btn);
      });
      updateBasemapSelectionUI();
    }

    return {
      createMap,
      getBasemapDefinition,
      setBasemap,
      updateBasemapSelectionUI,
      renderBasemapDropdown,
    };
  };
})(window);

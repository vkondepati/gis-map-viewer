(function initFileImportCore(globalScope) {
  const root = globalScope || window;
  root.NexaMapCore = root.NexaMapCore || {};

  root.NexaMapCore.createFileImportTools = function createFileImportTools(deps) {
    const {
      shp,
      fetch,
      URL,
      Uint8Array,
      atob,
      proj4,
      L,
      window,
      getFileBaseName,
      escapeHtml,
      getDefaultSymbology,
      entrySetSymDefaults,
      getLayerSymStore,
      normalizeGeometryType,
      getLayerIdSeq,
      setLayerIdSeq,
      addLayerEntry,
      getMap,
      setActiveLayerId,
      setCurrentGeoJsonLayer,
      setLastGeoJSONLoaded,
      renderLayerList,
    } = deps;

    function base64ToArrayBuffer(base64) {
      const binary = atob(String(base64 || ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    }

    function combineFeatureCollections(input) {
      if (!input) return { type: 'FeatureCollection', features: [] };
      if (Array.isArray(input)) {
        return {
          type: 'FeatureCollection',
          features: input.flatMap((item) => {
            if (!item) return [];
            if (Array.isArray(item.features)) return item.features;
            if (item.type === 'Feature') return [item];
            return [];
          }),
        };
      }
      if (input.type === 'FeatureCollection') return input;
      if (input.type === 'Feature') return { type: 'FeatureCollection', features: [input] };
      return { type: 'FeatureCollection', features: [] };
    }

    async function parseSpatialFilePayload(filePayload) {
      if (!filePayload || !filePayload.path) {
        throw new Error('Missing file payload.');
      }
      const extension = String(filePayload.extension || '').toLowerCase();
      if (extension === '.geojson' || extension === '.json') {
        return {
          geojson: JSON.parse(filePayload.content),
          sourceCrs: null,
          sourcePath: filePayload.path,
        };
      }
      if (extension === '.zip' || extension === '.shp') {
        if (typeof shp !== 'function') {
          throw new Error('Shapefile parser is not available.');
        }
        let parsed;
        if (extension === '.zip') {
          parsed = await shp(base64ToArrayBuffer(filePayload.content));
        } else {
          const shapeParts = {
            shp: base64ToArrayBuffer(filePayload.content),
          };
          const related = filePayload.relatedFiles || {};
          if (related.dbf && related.dbf.content) shapeParts.dbf = base64ToArrayBuffer(related.dbf.content);
          if (related.prj && typeof related.prj.content === 'string') shapeParts.prj = related.prj.content;
          if (related.cpg && typeof related.cpg.content === 'string') shapeParts.cpg = related.cpg.content;
          parsed = await shp(shapeParts);
        }
        return {
          geojson: combineFeatureCollections(parsed),
          sourceCrs: 'EPSG:4326',
          sourcePath: filePayload.path,
        };
      }
      throw new Error(`Unsupported file type: ${extension || 'unknown'}`);
    }

    function normalizeArcGISRestLayerUrl(rawUrl) {
      const trimmed = String(rawUrl || '').trim();
      if (!trimmed) return '';
      const parsed = new URL(trimmed);
      parsed.hash = '';
      parsed.search = '';
      const normalizedPath = parsed.pathname.replace(/\/query$/i, '').replace(/\/+$/, '');
      parsed.pathname = normalizedPath;
      return parsed.toString();
    }

    async function fetchJsonOrThrow(url) {
      const response = await fetch(url);
      const payload = await response.json();
      if (!response.ok) {
        const message = payload && payload.error && payload.error.message
          ? payload.error.message
          : `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      if (payload && payload.error && payload.error.message) {
        throw new Error(payload.error.message);
      }
      return payload;
    }

    function inferGeometryTypeFromArcGISMetadata(metadata) {
      const rawType = String(metadata && metadata.geometryType || '').toLowerCase();
      if (rawType.includes('polygon')) return 'Polygon';
      if (rawType.includes('polyline') || rawType.includes('line')) return 'LineString';
      if (rawType.includes('point')) return 'Point';
      return 'Point';
    }

    function parseArcGISLayerReference(layerUrl) {
      const normalizedUrl = normalizeArcGISRestLayerUrl(layerUrl);
      const featureMatch = normalizedUrl.match(/\/FeatureServer\/(\d+)$/i);
      if (featureMatch) {
        return {
          normalizedUrl,
          serviceUrl: normalizedUrl.replace(/\/FeatureServer\/\d+$/i, '/MapServer'),
          layerId: Number(featureMatch[1]),
          sourceKind: 'FeatureServer',
        };
      }
      const mapMatch = normalizedUrl.match(/\/MapServer\/(\d+)$/i);
      if (mapMatch) {
        return {
          normalizedUrl,
          serviceUrl: normalizedUrl.replace(/\/MapServer\/\d+$/i, '/MapServer'),
          layerId: Number(mapMatch[1]),
          sourceKind: 'MapServer',
        };
      }
      return {
        normalizedUrl,
        serviceUrl: normalizedUrl,
        layerId: null,
        sourceKind: /\/MapServer$/i.test(normalizedUrl) ? 'MapServer' : 'Unknown',
      };
    }

    function projectArcGISExtentToBounds(extent) {
      if (!extent || !extent.spatialReference) return null;
      const wkid = Number(extent.spatialReference.latestWkid || extent.spatialReference.wkid || 0);
      const xmin = Number(extent.xmin);
      const ymin = Number(extent.ymin);
      const xmax = Number(extent.xmax);
      const ymax = Number(extent.ymax);
      if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) return null;
      if (wkid === 4326) {
        return L.latLngBounds([ymin, xmin], [ymax, xmax]);
      }
      if ((wkid === 3857 || wkid === 102100) && typeof proj4 === 'function') {
        const sw = proj4('EPSG:3857', 'EPSG:4326', [xmin, ymin]);
        const ne = proj4('EPSG:3857', 'EPSG:4326', [xmax, ymax]);
        return L.latLngBounds([sw[1], sw[0]], [ne[1], ne[0]]);
      }
      return null;
    }

    async function fetchArcGISFeatureCollection(layerRef, metadata) {
      if (!layerRef || !layerRef.normalizedUrl) return null;
      const maxRecordCount = Number(metadata && metadata.maxRecordCount) || 2000;
      const supportsPagination = !!(metadata
        && metadata.advancedQueryCapabilities
        && metadata.advancedQueryCapabilities.supportsPagination);
      const baseQueryUrl = `${layerRef.normalizedUrl}/query`;
      const allFeatures = [];
      let offset = 0;
      let keepPaging = true;

      while (keepPaging) {
        const query = new URL(baseQueryUrl);
        query.searchParams.set('f', 'geojson');
        query.searchParams.set('where', '1=1');
        query.searchParams.set('outFields', '*');
        query.searchParams.set('returnGeometry', 'true');
        query.searchParams.set('outSR', '4326');
        if (supportsPagination) {
          query.searchParams.set('resultOffset', String(offset));
          query.searchParams.set('resultRecordCount', String(maxRecordCount));
        }

        const payload = await fetchJsonOrThrow(query.toString());
        if (!payload || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
          throw new Error('ArcGIS REST query did not return GeoJSON features.');
        }

        allFeatures.push(...payload.features);
        const pageSize = payload.features.length;
        const exceededTransferLimit = !!payload.exceededTransferLimit;
        if (!supportsPagination || !exceededTransferLimit || pageSize === 0) {
          keepPaging = false;
        } else {
          offset += pageSize;
        }
      }

      return {
        type: 'FeatureCollection',
        features: allFeatures,
      };
    }

    function createArcGISInteractionLayer(layerRef) {
      if (!layerRef || !layerRef.normalizedUrl || typeof L.esri.featureLayer !== 'function') return null;
      const interactionLayer = L.esri.featureLayer({
        url: layerRef.normalizedUrl,
        simplifyFactor: 0.35,
        precision: 6,
        style: () => ({
          color: '#000000',
          weight: 1,
          opacity: 0,
          fillColor: '#000000',
          fillOpacity: 0,
        }),
        pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
          radius: 8,
          color: '#000000',
          weight: 1,
          opacity: 0,
          fillColor: '#000000',
          fillOpacity: 0,
        }),
      });
      interactionLayer.bindPopup((layer) => {
        const props = layer && layer.feature && layer.feature.properties ? layer.feature.properties : {};
        return `<pre>${escapeHtml(JSON.stringify(props, null, 2))}</pre>`;
      });
      return interactionLayer;
    }

    async function addArcGISRestServiceLayer(layerUrl, options = {}) {
      const layerRef = parseArcGISLayerReference(layerUrl);
      if (!layerRef.normalizedUrl) throw new Error('Layer URL is required.');
      if (!window.L || !L.esri) {
        throw new Error('Esri Leaflet is not available.');
      }
      const metadata = await fetchJsonOrThrow(`${layerRef.normalizedUrl}?f=json`);
      const id = options.layerId || ('layer-' + getLayerIdSeq());
      if (!options.layerId) {
        setLayerIdSeq(getLayerIdSeq() + 1);
      } else {
        const seqMatch = /^layer-(\d+)$/.exec(options.layerId);
        if (seqMatch) {
          const parsedSeq = Number(seqMatch[1]);
          if (Number.isFinite(parsedSeq)) setLayerIdSeq(Math.max(getLayerIdSeq(), parsedSeq + 1));
        }
      }
      const geometryType = inferGeometryTypeFromArcGISMetadata(metadata);
      const layerSym = getLayerSymStore();
      if (!layerSym[id]) {
        entrySetSymDefaults(id, getDefaultSymbology(geometryType));
      }
      let serviceLayer = null;
      let interactionLayer = null;
      if (layerRef.layerId != null && typeof L.esri.dynamicMapLayer === 'function') {
        serviceLayer = L.esri.dynamicMapLayer({
          url: layerRef.serviceUrl,
          layers: [layerRef.layerId],
          opacity: 0.85,
          transparent: true,
        });
        interactionLayer = createArcGISInteractionLayer(layerRef);
      } else if (typeof L.esri.featureLayer === 'function') {
        interactionLayer = createArcGISInteractionLayer(layerRef);
        serviceLayer = interactionLayer;
        interactionLayer = null;
      } else {
        throw new Error('No supported ArcGIS layer type is available.');
      }

      let featureCollection = null;
      try {
        featureCollection = await fetchArcGISFeatureCollection(layerRef, metadata);
      } catch (err) {
        console.warn('Unable to cache ArcGIS REST features for selection:', err);
      }

      const entry = {
        id,
        name: options.name || metadata.name || getFileBaseName(layerRef.normalizedUrl),
        layer: serviceLayer,
        interactionLayer,
        visible: options.visible !== false,
        geojson: featureCollection,
        geometryType: normalizeGeometryType(geometryType),
        sourcePath: layerRef.normalizedUrl,
        sourceType: 'arcgis-rest',
        serviceMetadata: metadata,
      };

      if (entry.visible !== false) serviceLayer.addTo(getMap());
      if (entry.visible !== false && interactionLayer && interactionLayer !== serviceLayer) interactionLayer.addTo(getMap());
      addLayerEntry(entry);
      if (options.activate !== false) setActiveLayerId(id);
      setCurrentGeoJsonLayer(null);
      setLastGeoJSONLoaded(null);
      if (!options.skipRender) renderLayerList();

      try {
        const extentBounds = projectArcGISExtentToBounds(metadata.extent || metadata.fullExtent || metadata.initialExtent);
        if (options.fitBounds !== false && extentBounds && extentBounds.isValid && extentBounds.isValid()) {
          getMap().fitBounds(extentBounds, { padding: [20, 20] });
        }
      } catch (err) {
        console.warn('Unable to fit ArcGIS REST layer extent:', err);
      }

      return entry;
    }

    return {
      base64ToArrayBuffer,
      combineFeatureCollections,
      parseSpatialFilePayload,
      normalizeArcGISRestLayerUrl,
      fetchJsonOrThrow,
      inferGeometryTypeFromArcGISMetadata,
      parseArcGISLayerReference,
      projectArcGISExtentToBounds,
      addArcGISRestServiceLayer,
    };
  };
})(window);

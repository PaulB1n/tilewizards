(function () {
  const MAP_CONFIG = {
    center: [-79.3832, 43.6532],
    zoom: 9,
    checkZoom: 11.5,
    style: "mapbox://styles/mapbox/dark-v11",
    serviceAreaUrl: "assets/data/service-area.geojson",
    searchBounds: [-80.8, 43.0, -78.1, 44.8],
    zoneFillColor: "#d4af37",
    zoneFillOpacity: 0.18,
    zoneLineColor: "#f2d67f",
    zoneLineWidth: 2.25
  };
  const MAP_ASSETS = {
    styles: [
      "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css",
      "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.1.0/mapbox-gl-geocoder.css"
    ],
    scripts: [
      ["https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.js"],
      ["https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.1.0/mapbox-gl-geocoder.min.js"],
      [
        "https://unpkg.com/@turf/turf@7.2.0/turf.min.js",
        "https://cdn.jsdelivr.net/npm/@turf/turf@7.2.0/turf.min.js"
      ]
    ]
  };

  const DEFAULT_MESSAGE = "Enter an address above to start the coverage check.";
  const FALLBACK_SERVICE_AREA = {
    type: "Feature",
    properties: { zoneId: "fallback-zone", name: "Fallback Zone" },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-79.9710, 43.2475],
        [-79.8215, 43.2505],
        [-79.6720, 43.2630],
        [-79.5090, 43.2960],
        [-79.3515, 43.3115],
        [-79.1230, 43.3060],
        [-78.9205, 43.3460],
        [-78.7075, 43.4780],
        [-78.5730, 43.7110],
        [-78.6215, 44.0085],
        [-78.8695, 44.2230],
        [-79.2920, 44.3355],
        [-79.7165, 44.3065],
        [-79.9940, 44.0760],
        [-80.1115, 43.7575],
        [-80.1050, 43.5120],
        [-79.9710, 43.2475]
      ]]
    }
  };

  let mapInitialized = false;
  let observerInitialized = false;
  let cachedServiceAreaData = null;
  let mapAssetsPromise = null;

  function getMapToken() {
    if (typeof window.MAPBOX_TOKEN !== "string") return "";
    return window.MAPBOX_TOKEN.trim();
  }

  function isLocalDevEnvironment() {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  }

  async function ensureMapToken() {
    const currentToken = getMapToken();
    if (currentToken) return currentToken;

    if (!isLocalDevEnvironment()) {
      return "";
    }

    const staticLocalConfig = document.querySelector('script[src="assets/js/config.local.js"]');
    if (staticLocalConfig) {
      return getMapToken();
    }

    try {
      await loadScript("assets/js/config.local.js");
    } catch (_error) {
      return "";
    }

    return getMapToken();
  }

  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error("Failed to load stylesheet: " + href));
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.getAttribute("data-loaded") === "true") {
          resolve();
          return;
        }
        if (existing.getAttribute("data-error") === "true") {
          reject(new Error("Failed to load script: " + src));
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load script: " + src)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.setAttribute("data-loaded", "true");
        resolve();
      };
      script.onerror = () => {
        script.setAttribute("data-error", "true");
        reject(new Error("Failed to load script: " + src));
      };
      document.head.appendChild(script);
    });
  }

  function loadMapAssets() {
    if (mapAssetsPromise) return mapAssetsPromise;

    mapAssetsPromise = (async function () {
      await Promise.all(MAP_ASSETS.styles.map(loadStylesheet));

      for (const scriptSources of MAP_ASSETS.scripts) {
        const sources = Array.isArray(scriptSources) ? scriptSources : [scriptSources];
        let lastError = null;

        for (const scriptSrc of sources) {
          try {
            await loadScript(scriptSrc);
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
          }
        }

        if (lastError) {
          throw lastError;
        }
      }
    })();

    return mapAssetsPromise;
  }

  function getUi() {
    return {
      mapContainer: document.getElementById("serviceMap"),
      searchContainer: document.getElementById("mapSearch"),
      selectedAddress: document.getElementById("selectedAddress"),
      result: document.getElementById("zoneCheckResult"),
      insideCta: document.getElementById("zoneMatchCta"),
      manualCta: document.getElementById("zoneManualCta"),
      mapCard: document.querySelector(".contact-map")
    };
  }

  function setZoneResult(message, state) {
    const ui = getUi();
    if (!ui.result) return;

    ui.result.textContent = message;
    ui.result.setAttribute("data-state", state || "info");
  }

  function setSelectedAddress(text) {
    const ui = getUi();
    if (!ui.selectedAddress) return;

    if (!text) {
      ui.selectedAddress.hidden = true;
      ui.selectedAddress.textContent = "";
      return;
    }

    ui.selectedAddress.hidden = false;
    ui.selectedAddress.textContent = "Selected address: " + text;
  }

  function setResultActions(mode) {
    const ui = getUi();
    if (!ui.insideCta || !ui.manualCta) return;

    ui.insideCta.hidden = mode !== "inside";
    ui.manualCta.hidden = mode !== "outside";
  }

  function activateManualCoverageFallback(message) {
    const ui = getUi();
    if (!ui.mapContainer || !ui.searchContainer) return;

    mapInitialized = true;

    if (ui.mapCard) {
      ui.mapCard.classList.add("contact-map--fallback");
      ui.mapCard.classList.add("contact-map--ready");
    }

    ui.mapContainer.setAttribute("hidden", "hidden");
    ui.searchContainer.innerHTML = "";

    const fallbackSearchNote = document.createElement("p");
    fallbackSearchNote.className = "contact-map__search-fallback";
    fallbackSearchNote.textContent = "Interactive lookup is temporarily unavailable. Call us and we will confirm your address within 24 hours.";
    ui.searchContainer.appendChild(fallbackSearchNote);

    setSelectedAddress("");
    setZoneResult(message || "Call us to confirm coverage for your exact address.", "warn");
    setResultActions("outside");
  }

  function isPolygonGeometry(geometry) {
    if (!geometry) return false;
    return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
  }

  function normalizeServiceAreaData(geojson) {
    if (!geojson) return null;

    if (geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
      const polygonFeatures = geojson.features.filter(function (feature) {
        return feature && isPolygonGeometry(feature.geometry);
      });

      if (!polygonFeatures.length) return null;
      return {
        type: "FeatureCollection",
        features: polygonFeatures
      };
    }

    if (geojson.type === "Feature" && isPolygonGeometry(geojson.geometry)) {
      return geojson;
    }

    if (isPolygonGeometry(geojson)) {
      return {
        type: "Feature",
        properties: {},
        geometry: geojson
      };
    }

    return null;
  }

  async function loadServiceAreaData() {
    if (cachedServiceAreaData) return cachedServiceAreaData;

    try {
      const response = await fetch(MAP_CONFIG.serviceAreaUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch service area");
      }

      const geojson = await response.json();
      const normalizedData = normalizeServiceAreaData(geojson);

      if (!normalizedData) {
        throw new Error("No polygon in service area file");
      }

      cachedServiceAreaData = normalizedData;
      return cachedServiceAreaData;
    } catch (_error) {
      cachedServiceAreaData = FALLBACK_SERVICE_AREA;
      return cachedServiceAreaData;
    }
  }

  function initMapOnVisible() {
    if (observerInitialized || mapInitialized) return;

    const section = document.getElementById("service-area-check");
    if (!section) return;

    observerInitialized = true;

    if (typeof window.IntersectionObserver !== "function") {
      initServiceMap();
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;

      observer.disconnect();
      initServiceMap();
    }, {
      rootMargin: "220px 0px"
    });

    observer.observe(section);
  }

  async function initServiceMap() {
    if (mapInitialized) return;

    const ui = getUi();
    if (!ui.mapContainer || !ui.searchContainer) return;

    const mapToken = await ensureMapToken();
    if (!mapToken) {
      activateManualCoverageFallback("Live coverage lookup is unavailable right now. Call us to confirm your exact address.");
      return;
    }

    try {
      await loadMapAssets();
    } catch (_error) {
      activateManualCoverageFallback("Interactive coverage map is unavailable right now. Call us to confirm your exact address.");
      return;
    }

    if (typeof window.mapboxgl === "undefined" || typeof window.MapboxGeocoder === "undefined" || typeof window.turf === "undefined") {
      activateManualCoverageFallback("Interactive coverage map is unavailable right now. Call us to confirm your exact address.");
      return;
    }

    window.mapboxgl.accessToken = mapToken;
    setZoneResult("Loading map and service area...", "info");

    const serviceAreaData = await loadServiceAreaData();

    const map = new mapboxgl.Map({
      container: "serviceMap",
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      cooperativeGestures: true,
      attributionControl: true
    });

    mapInitialized = true;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      countries: "ca",
      language: "en",
      limit: 6,
      bbox: MAP_CONFIG.searchBounds,
      proximity: {
        longitude: MAP_CONFIG.center[0],
        latitude: MAP_CONFIG.center[1]
      },
      placeholder: "Enter your address in Toronto or GTA"
    });

    ui.searchContainer.innerHTML = "";
    ui.searchContainer.appendChild(geocoder.onAdd(map));

    const marker = new mapboxgl.Marker({ color: MAP_CONFIG.zoneFillColor })
      .setLngLat(MAP_CONFIG.center)
      .addTo(map);

    function fitToServiceArea(duration) {
      if (!serviceAreaData || typeof window.turf === "undefined") {
        map.flyTo({
          center: MAP_CONFIG.center,
          zoom: MAP_CONFIG.zoom,
          duration: duration || 0,
          essential: true
        });
        return;
      }

      const bounds = turf.bbox(serviceAreaData);
      map.fitBounds(bounds, {
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        maxZoom: 10,
        duration: duration || 0,
        essential: true
      });
    }

    function pointInServiceArea(pointFeature) {
      if (!serviceAreaData || typeof window.turf === "undefined") return false;

      if (serviceAreaData.type === "FeatureCollection") {
        return serviceAreaData.features.some(function (feature) {
          return turf.booleanPointInPolygon(pointFeature, feature);
        });
      }

      return turf.booleanPointInPolygon(pointFeature, serviceAreaData);
    }

    function resetState() {
      marker.setLngLat(MAP_CONFIG.center);
      setSelectedAddress("");
      setZoneResult(DEFAULT_MESSAGE, "info");
      setResultActions("idle");
      fitToServiceArea(700);
    }

    function updateCoverageResult(lng, lat, addressLabel) {
      const latRounded = lat.toFixed(5);
      const lngRounded = lng.toFixed(5);

      marker.setLngLat([lng, lat]);
      map.flyTo({
        center: [lng, lat],
        zoom: MAP_CONFIG.checkZoom,
        speed: 1,
        curve: 1.4,
        essential: true
      });

      if (addressLabel) {
        setSelectedAddress(addressLabel);
      } else {
        setSelectedAddress(latRounded + ", " + lngRounded);
      }

      if (!serviceAreaData || typeof window.turf === "undefined") {
        setZoneResult("Address found (" + latRounded + ", " + lngRounded + "). Zone check is unavailable.", "warn");
        setResultActions("outside");
        return;
      }

      const point = turf.point([lng, lat]);
      const isInServiceZone = pointInServiceArea(point);

      if (isInServiceZone) {
        setZoneResult("Great news. This address is inside our service zone.", "ok");
        setResultActions("inside");
      } else {
        setZoneResult("This address is outside the standard service zone. Please call to confirm options.", "warn");
        setResultActions("outside");
      }
    }

    map.on("load", function () {
      if (serviceAreaData) {
        map.addSource("service-zone", {
          type: "geojson",
          data: serviceAreaData
        });

        map.addLayer({
          id: "service-zone-fill",
          type: "fill",
          source: "service-zone",
          paint: {
            "fill-color": MAP_CONFIG.zoneFillColor,
            "fill-opacity": MAP_CONFIG.zoneFillOpacity
          }
        });

        map.addLayer({
          id: "service-zone-line",
          type: "line",
          source: "service-zone",
          paint: {
            "line-color": MAP_CONFIG.zoneLineColor,
            "line-width": MAP_CONFIG.zoneLineWidth
          }
        });
      }

      if (ui.mapCard) {
        ui.mapCard.classList.add("contact-map--ready");
      }

      resetState();
    });

    geocoder.on("result", function (event) {
      const center = event && event.result && event.result.center;
      if (!center || center.length < 2) return;

      updateCoverageResult(center[0], center[1], event.result.place_name || "");
    });

    geocoder.on("clear", resetState);

    map.on("click", function (event) {
      const label = "Dropped pin: " + event.lngLat.lat.toFixed(5) + ", " + event.lngLat.lng.toFixed(5);
      updateCoverageResult(event.lngLat.lng, event.lngLat.lat, label);
    });
  }

  document.addEventListener("partialsLoaded", initMapOnVisible);
  document.addEventListener("DOMContentLoaded", initMapOnVisible, { once: true });

  if (document.readyState === "interactive" || document.readyState === "complete") {
    initMapOnVisible();
  }
})();

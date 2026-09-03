(function () {
  "use strict";

  let map = null;
  let userMarker = null;
  let accuracyCircle = null;
  let resultsLayer = null;

  const resultMarkers = new Map();

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureLeaflet() {
    if (!window.L) {
      throw new Error(
        "The interactive map library is unavailable."
      );
    }
  }

  function init(containerId) {
    if (map) {
      return map;
    }

    ensureLeaflet();

    const container = document.getElementById(containerId);

    if (!container) {
      throw new Error(
        `Map container #${containerId} was not found.`
      );
    }

    map = window.L.map(container, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 2,
      worldCopyJump: true
    }).setView([20, 0], 2);

    window.L
      .tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        }
      )
      .addTo(map);

    resultsLayer = window.L
      .layerGroup()
      .addTo(map);

    window.setTimeout(
      () => map.invalidateSize(),
      50
    );

    return map;
  }

  function createUserIcon() {
    return window.L.divIcon({
      className: "onh-user-marker",
      html: '<span class="onh-user-dot"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  function createResultIcon(index) {
    return window.L.divIcon({
      className: "onh-result-marker",
      html:
        `<span class="onh-result-dot">` +
        `<span>${index + 1}</span>` +
        `</span>`,
      iconSize: [25, 25],
      iconAnchor: [12, 22],
      popupAnchor: [0, -19]
    });
  }

  function setLocation(location, options) {
    if (!map) {
      init("live-map-canvas");
    }

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw new Error(
        "A valid location is required for the map."
      );
    }

    if (userMarker) {
      map.removeLayer(userMarker);
    }

    if (accuracyCircle) {
      map.removeLayer(accuracyCircle);
    }

    userMarker = window.L
      .marker([latitude, longitude], {
        icon: createUserIcon(),
        keyboard: true,
        title:
          location.shortLabel ||
          location.label ||
          "Selected location"
      })
      .addTo(map)
      .bindPopup(
        `<div class="onh-popup">` +
          `<strong>Your search centre</strong>` +
          `<span>${escapeHtml(
            location.shortLabel ||
              location.label ||
              "Selected location"
          )}</span>` +
        `</div>`
      );

    const accuracy = Number(location.accuracy || 0);

    if (accuracy > 0) {
      accuracyCircle = window.L
        .circle([latitude, longitude], {
          radius: Math.min(accuracy, 2000),
          color: "#5fe5d1",
          weight: 1,
          opacity: 0.45,
          fillColor: "#5fe5d1",
          fillOpacity: 0.08,
          interactive: false
        })
        .addTo(map);
    }

    if (!options || options.recenter !== false) {
      map.setView(
        [latitude, longitude],
        (options && options.zoom) || 14,
        {
          animate: true
        }
      );
    }

    window.setTimeout(
      () => map.invalidateSize(),
      60
    );
  }

  function getDirectionsUrl(result) {
    const destination = encodeURIComponent(
      `${result.latitude},${result.longitude}`
    );

    return (
      "https://www.google.com/maps/dir/" +
      `?api=1&destination=${destination}`
    );
  }

  function createPopup(result) {
    const distance = Number.isFinite(result.distanceKm)
      ? `${result.distanceKm.toFixed(1)} km away`
      : "Nearby listing";

    return `
      <div class="onh-popup">
        <strong>${escapeHtml(result.name)}</strong>
        <span>
          ${escapeHtml(result.category || "Service")}
          ·
          ${escapeHtml(distance)}
        </span>
        <a
          href="${getDirectionsUrl(result)}"
          target="_blank"
          rel="noreferrer"
        >
          Directions ↗
        </a>
      </div>
    `;
  }

  function clearResults() {
    resultMarkers.clear();

    if (resultsLayer) {
      resultsLayer.clearLayers();
    }
  }

  function setResults(results, location) {
    if (!map) {
      init("live-map-canvas");
    }

    clearResults();

    const bounds = [];

    if (
      location &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
    ) {
      bounds.push([
        location.latitude,
        location.longitude
      ]);
    }

    results.forEach((result, index) => {
      if (
        !Number.isFinite(result.latitude) ||
        !Number.isFinite(result.longitude)
      ) {
        return;
      }

      const marker = window.L
        .marker(
          [result.latitude, result.longitude],
          {
            icon: createResultIcon(index),
            keyboard: true,
            title: result.name
          }
        )
        .bindPopup(createPopup(result))
        .on("click", () => {
          window.dispatchEvent(
            new CustomEvent(
              "onh:map-result-selected",
              {
                detail: {
                  id: result.id
                }
              }
            )
          );
        });

      marker.addTo(resultsLayer);

      resultMarkers.set(
        String(result.id),
        marker
      );

      bounds.push([
        result.latitude,
        result.longitude
      ]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, {
        padding: [42, 42],
        maxZoom: 15,
        animate: true
      });
    } else if (location) {
      map.setView(
        [
          location.latitude,
          location.longitude
        ],
        14,
        {
          animate: true
        }
      );
    }

    window.setTimeout(
      () => map.invalidateSize(),
      60
    );
  }

  function focusResult(id) {
    const marker = resultMarkers.get(
      String(id)
    );

    if (!marker || !map) {
      return false;
    }

    map.setView(
      marker.getLatLng(),
      Math.max(map.getZoom(), 16),
      {
        animate: true
      }
    );

    marker.openPopup();

    return true;
  }

  function invalidateSize() {
    if (map) {
      map.invalidateSize();
    }
  }

  window.ONH_MAP = Object.freeze({
    init,
    setLocation,
    setResults,
    clearResults,
    focusResult,
    invalidateSize,
    getDirectionsUrl
  });
})();

(function () {
  "use strict";

  window.ONH_CONFIG = Object.freeze({
    appName: "Our Nearest Helpers",
    appShortName: "ONH",
    edition: "Live Map Edition",
    projectDay: 2,
    year: 2026,
    creatorName: "Our Nearest Helpers",
    defaultLanguage: "en",
    englishFallback: true,
    locationStorageEnabled: false,
    locationTimeoutMs: 12000,
    locationMaximumAgeMs: 300000,
    demoMode: false,
    future: Object.freeze({
      mapsProvider: "openstreetmap",
      nearbySearchProvider: "overpass",
      directionsProvider: "google-maps",
      helperRegistrationEnabled: false,
      liveNearbySearchEnabled: true
    })
  });
})();

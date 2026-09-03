(function () {
  "use strict";

  const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

  function createError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function getLanguage() {
    return String(navigator.language || "en")
      .toLocaleLowerCase()
      .split("-")[0];
  }

  function fetchJson(url, timeoutMs) {
    const controller = new AbortController();

    const timeout = window.setTimeout(
      () => controller.abort(),
      timeoutMs || 12000
    );

    return fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw createError(
            "network",
            `Location service returned ${response.status}.`
          );
        }

        return response.json();
      })
      .catch((error) => {
        if (error && error.name === "AbortError") {
          throw createError(
            "timeout",
            "The place search took too long."
          );
        }

        throw error;
      })
      .finally(() => window.clearTimeout(timeout));
  }

  function getCurrentPosition() {
    const config = window.ONH_CONFIG || {};

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          createError(
            "unsupported",
            "Location is not supported on this device."
          )
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            type: "coordinates",
            latitude: Number(position.coords.latitude),
            longitude: Number(position.coords.longitude),
            accuracy: Number(position.coords.accuracy || 0),
            label: "Your current location",
            shortLabel: "Your current location"
          });
        },

        (error) => {
          const messages = {
            1: "Location permission was not granted.",
            2: "Your current position could not be detected.",
            3: "The location request timed out."
          };

          reject(
            createError(
              error && error.code === 1
                ? "permission-denied"
                : "geolocation",
              messages[error && error.code] ||
                "Your location could not be detected."
            )
          );
        },

        {
          enableHighAccuracy: true,
          timeout: config.locationTimeoutMs || 12000,
          maximumAge: config.locationMaximumAgeMs || 300000
        }
      );
    });
  }

  function getLocationLabel(result, fallback) {
    const parts = [
      result.name,
      result.admin1,
      result.country
    ].filter(Boolean);

    const uniqueParts = parts.filter(
      (part, index) => parts.indexOf(part) === index
    );

    return uniqueParts.join(", ") || fallback;
  }

  async function geocode(query) {
    const normalizedQuery = String(query || "").trim();

    if (normalizedQuery.length < 2) {
      throw createError(
        "invalid-query",
        "Enter a valid city, town, or postal code."
      );
    }

    const params = new URLSearchParams({
      name: normalizedQuery,
      count: "1",
      language: getLanguage(),
      format: "json"
    });

    const data = await fetchJson(
      `${GEOCODING_URL}?${params}`,
      14000
    );

    const result =
      data && Array.isArray(data.results)
        ? data.results[0]
        : null;

    if (!result) {
      throw createError(
        "not-found",
        "That place could not be found. Try city and country together."
      );
    }

    const latitude = Number(result.latitude);
    const longitude = Number(result.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw createError(
        "invalid-result",
        "The location service returned an invalid result."
      );
    }

    const label = getLocationLabel(
      result,
      normalizedQuery
    );

    return {
      type: "manual",
      latitude,
      longitude,
      label,
      shortLabel: label,
      countryCode: result.country_code || "",
      timezone: result.timezone || "",
      source: "Open-Meteo / GeoNames"
    };
  }

  function reverseGeocode() {
    return Promise.resolve({
      label: "Your current location",
      shortLabel: "Your current location"
    });
  }

  window.ONH_LOCATION = Object.freeze({
    isSupported: () => Boolean(navigator.geolocation),
    getCurrentPosition,
    geocode,
    reverseGeocode
  });
})();

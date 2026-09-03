(function () {
  "use strict";

  const OVERPASS_ENDPOINTS = [
    {
      name: "Private.coffee",
      url: "https://overpass.private.coffee/api/interpreter",
    },
    {
      name: "Main Overpass",
      url: "https://overpass-api.de/api/interpreter",
    },
  ];

  const CACHE_TTL_MS = 10 * 60 * 1000;
  const MAX_CACHE_ENTRIES = 40;
  const RATE_LIMIT_COOLDOWN_MS = 30 * 1000;
  const FAILURE_COOLDOWN_MS = 12 * 1000;
  const REQUEST_TIMEOUT_MS = 22 * 1000;

  const responseCache = new Map();
  const endpointCooldowns = new Map();

  const FILTERS = {
    plumber: [
      ["craft", "plumber"],
      ["shop", "plumbing"],
    ],
    electrician: [
      ["craft", "electrician"],
      ["shop", "electrical"],
    ],
    carpenter: [["craft", "carpenter"]],
    mechanic: [
      ["shop", "car_repair"],
      ["craft", "car_repair"],
    ],
    locksmith: [["craft", "locksmith"]],
    painter: [["craft", "painter"]],
    mason: [["craft", "stonemason"]],
    cleaner: [["craft", "cleaning"]],
    gardener: [["craft", "gardener"]],
    "domestic helper": [["office", "company"]],

    "ac & refrigerator technician": [
      ["craft", "hvac"],
      ["craft", "electronics_repair"],
    ],

    "pest control professional": [
      ["craft", "pest_control"],
    ],

    doctor: [
      ["amenity", "doctors"],
      ["healthcare", "doctor"],
    ],
    nurse: [["healthcare", "nurse"]],
    dentist: [
      ["amenity", "dentist"],
      ["healthcare", "dentist"],
    ],
    pharmacist: [["amenity", "pharmacy"]],
    physiotherapist: [
      ["healthcare", "physiotherapist"],
    ],
    veterinarian: [["amenity", "veterinary"]],

    "ambulance service": [
      ["emergency", "ambulance_station"],
      ["amenity", "hospital"],
    ],

    police: [["amenity", "police"]],
    "fire service": [["amenity", "fire_station"]],
    "security professional": [["office", "security"]],
    "animal rescue service": [
      ["amenity", "animal_shelter"],
    ],

    grocer: [
      ["shop", "supermarket"],
      ["shop", "convenience"],
      ["shop", "grocery"],
    ],
    "fresh produce vendor": [
      ["shop", "greengrocer"],
    ],
    "milk supplier": [["shop", "dairy"]],

    "water supplier": [
      ["amenity", "drinking_water"],
      ["shop", "water"],
    ],

    baker: [["shop", "bakery"]],
    chef: [
      ["amenity", "restaurant"],
      ["amenity", "fast_food"],
    ],
    shopkeeper: [["shop", null]],
    "delivery professional": [["office", "courier"]],

    farmer: [
      ["shop", "farm"],
      ["landuse", "farmyard"],
    ],

    fisherman: [["shop", "seafood"]],
    driver: [["amenity", "taxi"]],
    "auto driver": [["amenity", "taxi"]],
    "taxi service": [["amenity", "taxi"]],
    "bus conductor": [["amenity", "bus_station"]],
    "courier service": [["office", "courier"]],
    postman: [["amenity", "post_office"]],
    "vehicle mechanic": [["shop", "car_repair"]],
    transporter: [["office", "logistics"]],
    pilot: [["aeroway", "aerodrome"]],

    teacher: [
      ["amenity", "school"],
      ["amenity", "college"],
    ],

    tutor: [
      ["office", "educational_institution"],
      ["amenity", "training"],
    ],

    librarian: [["amenity", "library"]],
    scientist: [["office", "research"]],
    writer: [["office", "publisher"]],
    publisher: [["office", "publisher"]],
    translator: [["office", "translator"]],
    "career counsellor": [
      ["office", "employment_agency"],
    ],
    "research assistant": [["office", "research"]],

    barber: [["shop", "hairdresser"]],
    tailor: [["craft", "tailor"]],
    cobbler: [["craft", "shoemaker"]],

    "gym trainer": [
      ["leisure", "fitness_centre"],
      ["leisure", "sports_centre"],
    ],

    "childcare provider": [
      ["amenity", "childcare"],
      ["amenity", "kindergarten"],
    ],

    "elder care provider": [
      ["amenity", "social_facility"],
    ],

    astrologer: [["shop", "astrologer"]],
    "event planner": [["office", "event_planning"]],
    lawyer: [["office", "lawyer"]],
    engineer: [["office", "engineer"]],
    architect: [["office", "architect"]],
    accountant: [["office", "accountant"]],
    "property dealer": [["office", "estate_agent"]],

    goldsmith: [
      ["craft", "goldsmith"],
      ["shop", "jewelry"],
    ],

    blacksmith: [["craft", "blacksmith"]],
    surveyor: [["office", "surveyor"]],
    "insurance advisor": [["office", "insurance"]],
    "financial consultant": [["office", "financial"]],
    "sanitation worker": [
      ["amenity", "waste_transfer_station"],
    ],

    "waste collector": [
      ["amenity", "waste_disposal"],
      ["amenity", "recycling"],
    ],

    "skilled labourer": [["craft", null]],
    "general labourer": [["craft", null]],
    "community volunteer": [["office", "ngo"]],
    "social worker": [["office", "ngo"]],

    "emergency responder": [
      ["amenity", "rescue_station"],
      ["amenity", "fire_station"],
    ],

    musician: [
      ["amenity", "music_school"],
      ["shop", "musical_instrument"],
    ],

    sculptor: [["craft", "sculptor"]],
    magician: [["office", "entertainment"]],

    photographer: [
      ["shop", "photo"],
      ["craft", "photographer"],
    ],

    videographer: [["craft", "photographer"]],
    "graphic designer": [["office", "graphic_design"]],
    "makeup artist": [["shop", "beauty"]],
    "craft artist": [["craft", "handicraft"]],

    "website designer": [
      ["office", "it"],
      ["office", "web_design"],
    ],

    "app developer": [["office", "it"]],

    "it support": [
      ["office", "it"],
      ["shop", "computer"],
    ],

    "computer repair professional": [
      ["shop", "computer"],
      ["craft", "electronics_repair"],
    ],

    "mobile repair professional": [
      ["shop", "mobile_phone"],
    ],

    "online tutor": [
      ["office", "educational_institution"],
    ],

    "content writer": [["office", "publisher"]],
    "social media manager": [["office", "marketing"]],
    "digital marketer": [["office", "marketing"]],
    "cybersecurity professional": [["office", "it"]],
  };
    let activeSearchController = null;

  function normalize(value) {
    return String(value || "").trim().toLocaleLowerCase();
  }

  function escapeOverpassString(value) {
    return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildQuery(helper, latitude, longitude, radius) {
    const normalizedHelper = normalize(helper);
    const filters = FILTERS[normalizedHelper];

    const safeRadius = Math.max(
      500,
      Math.min(Number(radius) || 5000, 25000),
    );

    const safeLatitude = Number(latitude).toFixed(6);
    const safeLongitude = Number(longitude).toFixed(6);

    const around =
      `(around:${Math.round(safeRadius)},` +
      `${safeLatitude},${safeLongitude})`;

    let statements;

    if (filters && filters.length) {
      statements = filters.map(([key, value]) => {
        const keyFilter =
          `["${escapeOverpassString(key)}"]`;

        const valueFilter =
          value === null
            ? keyFilter
            : `["${escapeOverpassString(key)}"=` +
              `"${escapeOverpassString(value)}"]`;

        return `nwr${valueFilter}${around};`;
      });
    } else {
      const pattern = escapeOverpassString(
        escapeRegex(helper),
      );

      statements = [
        `nwr["name"~"${pattern}",i]${around};`,
        `nwr["description"~"${pattern}",i]${around};`,
      ];
    }

    return (
      `[out:json][timeout:20];` +
      `(${statements.join("")});` +
      `out center tags 80;`
    );
  }

  function createCacheKey(
    helper,
    latitude,
    longitude,
    radius,
  ) {
    return [
      normalize(helper),
      Number(latitude).toFixed(5),
      Number(longitude).toFixed(5),
      Math.round(radius),
    ].join("|");
  }

  function pruneCache() {
    const now = Date.now();

    for (const [key, entry] of responseCache) {
      if (entry.expiresAt <= now) {
        responseCache.delete(key);
      }
    }

    while (responseCache.size > MAX_CACHE_ENTRIES) {
      const oldestKey =
        responseCache.keys().next().value;

      responseCache.delete(oldestKey);
    }
  }

  function readCache(key) {
    pruneCache();

    const entry = responseCache.get(key);

    if (!entry) {
      return null;
    }

    responseCache.delete(key);
    responseCache.set(key, entry);

    return entry.data;
  }

  function writeCache(key, data) {
    responseCache.delete(key);

    responseCache.set(key, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    pruneCache();
  }

  function createAbortError() {
    try {
      return new DOMException(
        "Nearby search was cancelled.",
        "AbortError",
      );
    } catch {
      const error = new Error(
        "Nearby search was cancelled.",
      );

      error.name = "AbortError";

      return error;
    }
  }

  function markEndpointCooldown(
    endpoint,
    duration,
  ) {
    endpointCooldowns.set(
      endpoint.url,
      Date.now() + duration,
    );
  }

  function getEndpointWait(endpoint) {
    return Math.max(
      0,
      (endpointCooldowns.get(endpoint.url) || 0) -
        Date.now(),
    );
  }

  async function requestEndpoint(
    endpoint,
    query,
    searchSignal,
  ) {
    const requestController =
      new AbortController();

    let timedOut = false;

    const cancelRequest = () =>
      requestController.abort();

    searchSignal.addEventListener(
      "abort",
      cancelRequest,
      {
        once: true,
      },
    );

    const timeout = window.setTimeout(() => {
      timedOut = true;
      requestController.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",

        headers: {
          Accept: "application/json",

          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8",
        },

        body: new URLSearchParams({
          data: query,
        }),

        signal: requestController.signal,
      });

      if (!response.ok) {
        const error = new Error(
          `Nearby search returned ${response.status}.`,
        );

        error.status = response.status;

        throw error;
      }

      return await response.json();
    } catch (error) {
      if (searchSignal.aborted) {
        throw createAbortError();
      }

      if (timedOut) {
        const timeoutError = new Error(
          `${endpoint.name} took too long to respond.`,
        );

        timeoutError.code = "timeout";

        throw timeoutError;
      }

      throw error;
    } finally {
      window.clearTimeout(timeout);

      searchSignal.removeEventListener(
        "abort",
        cancelRequest,
      );
    }
  }

  async function fetchOverpass(
    query,
    searchSignal,
  ) {
    let lastError = null;
    let soonestWait = Infinity;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      if (searchSignal.aborted) {
        throw createAbortError();
      }

      const wait = getEndpointWait(endpoint);

      if (wait > 0) {
        soonestWait = Math.min(
          soonestWait,
          wait,
        );

        continue;
      }

      try {
        const data = await requestEndpoint(
          endpoint,
          query,
          searchSignal,
        );

        endpointCooldowns.delete(endpoint.url);

        return data;
      } catch (error) {
        if (
          error &&
          error.name === "AbortError"
        ) {
          throw error;
        }

        lastError = error;

        const isRateLimited =
          error &&
          (error.status === 429 ||
            error.status === 406);

        markEndpointCooldown(
          endpoint,
          isRateLimited
            ? RATE_LIMIT_COOLDOWN_MS
            : FAILURE_COOLDOWN_MS,
        );
      }
    }

    const error = new Error(
      "Live public listings are temporarily unavailable. Please try again shortly.",
    );

    error.code = "service-unavailable";
    error.cause = lastError;

    if (Number.isFinite(soonestWait)) {
      error.retryAfterMs = soonestWait;
    }

    throw error;
 }
    function toRadians(value) {
    return value * (Math.PI / 180);
  }

  function getDistanceKm(
    lat1,
    lon1,
    lat2,
    lon2,
  ) {
    const earthRadiusKm = 6371;

    const latitudeDelta =
      toRadians(lat2 - lat1);

    const longitudeDelta =
      toRadians(lon2 - lon1);

    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(longitudeDelta / 2) ** 2;

    return (
      earthRadiusKm *
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      )
    );
  }

  function getCoordinates(element) {
    const latitude = Number(
      element.lat ??
        (element.center &&
          element.center.lat),
    );

    const longitude = Number(
      element.lon ??
        (element.center &&
          element.center.lon),
    );

    return {
      latitude,
      longitude,
    };
  }

  function getAddress(tags) {
    if (tags["addr:full"]) {
      return tags["addr:full"];
    }

    const street = [
      tags["addr:housenumber"],
      tags["addr:street"],
    ]
      .filter(Boolean)
      .join(" ");

    const locality =
      tags["addr:city"] ||
      tags["addr:town"] ||
      tags["addr:village"] ||
      tags["addr:suburb"];

    const postcode =
      tags["addr:postcode"];

    return (
      [street, locality, postcode]
        .filter(Boolean)
        .join(", ") ||
      "Address not listed"
    );
  }

  function getCategory(tags, fallback) {
    const raw =
      tags.healthcare ||
      tags.amenity ||
      tags.shop ||
      tags.craft ||
      tags.office ||
      tags.leisure;

    if (!raw) {
      return fallback;
    }

    return String(raw)
      .split("_")
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1),
      )
      .join(" ");
  }

  function parseResults(
    data,
    helper,
    location,
  ) {
    const elements = Array.isArray(
      data && data.elements,
    )
      ? data.elements
      : [];

    const seen = new Set();

    return elements
      .map((element) => {
        const tags = element.tags || {};

        const coordinates =
          getCoordinates(element);

        if (
          !Number.isFinite(
            coordinates.latitude,
          ) ||
          !Number.isFinite(
            coordinates.longitude,
          )
        ) {
          return null;
        }

        const name =
          tags.name ||
          tags.brand ||
          tags.operator ||
          `${helper} service`;

        const uniqueKey =
          `${normalize(name)}:` +
          `${coordinates.latitude.toFixed(4)}:` +
          `${coordinates.longitude.toFixed(4)}`;

        if (seen.has(uniqueKey)) {
          return null;
        }

        seen.add(uniqueKey);

        return {
          id: `${element.type}-${element.id}`,

          name,

          category: getCategory(
            tags,
            helper,
          ),

          latitude:
            coordinates.latitude,

          longitude:
            coordinates.longitude,

          distanceKm: getDistanceKm(
            location.latitude,
            location.longitude,
            coordinates.latitude,
            coordinates.longitude,
          ),

          address: getAddress(tags),

          phone:
            tags["contact:phone"] ||
            tags.phone ||
            "",

          website:
            tags["contact:website"] ||
            tags.website ||
            "",

          openingHours:
            tags.opening_hours || "",

          source: "OpenStreetMap",
        };
      })
      .filter(Boolean)
      .sort(
        (first, second) =>
          first.distanceKm -
          second.distanceKm,
      )
      .slice(0, 24);
  }

  async function searchNearby(options) {
    const helper = String(
      (options && options.helper) || "",
    ).trim();

    const location =
      (options && options.location) || {};

    const latitude = Number(
      location.latitude,
    );

    const longitude = Number(
      location.longitude,
    );

    const radius = Math.max(
      500,
      Math.min(
        Number(
          options && options.radius,
        ) || 5000,
        25000,
      ),
    );

    if (!helper) {
      throw new Error(
        "Choose a helper before searching.",
      );
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw new Error(
        "Choose a valid location before searching.",
      );
    }

    cancelCurrentSearch();

    const controller =
      new AbortController();

    activeSearchController =
      controller;

    const cacheKey = createCacheKey(
      helper,
      latitude,
      longitude,
      radius,
    );

    try {
      let data = readCache(cacheKey);

      const fromCache = Boolean(data);

      if (!data) {
        const query = buildQuery(
          helper,
          latitude,
          longitude,
          radius,
        );

        data = await fetchOverpass(
          query,
          controller.signal,
        );

        writeCache(cacheKey, data);
      }

      return {
        helper,
        radius,
        fromCache,

        results: parseResults(
          data,
          helper,
          {
            latitude,
            longitude,
          },
        ),
      };
    } finally {
      if (
        activeSearchController ===
        controller
      ) {
        activeSearchController = null;
      }
    }
  }

  function cancelCurrentSearch() {
    if (activeSearchController) {
      activeSearchController.abort();

      activeSearchController = null;
    }
  }

  window.ONH_SEARCH = Object.freeze({
    searchNearby,
    cancelCurrentSearch,
  });
})();

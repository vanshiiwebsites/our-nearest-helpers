(function () {
  "use strict";

  const categories = Array.isArray(window.ONH_CATEGORIES)
    ? window.ONH_CATEGORIES
    : [];

  const radiusSteps = [2000, 5000, 10000, 25000];

  const state = {
    query: "",
    activeCategory: "all",
    selectedHelper: "",
    lastFocusedElement: null,
    location: null,
    results: [],
    searchSerial: 0,
    toastTimer: null,
  };

  const elements = {};

  function cacheElements() {
    elements.scrollProgress = document.getElementById("scroll-progress");

    elements.menuButton = document.getElementById("menu-button");

    elements.mobileMenu = document.getElementById("mobile-menu");

    elements.mainSearch = document.getElementById("main-search");

    elements.helperSearch = document.getElementById("helper-search");

    elements.filterRow = document.getElementById("filter-row");

    elements.categoryGrid = document.getElementById("category-grid");

    elements.emptyState = document.getElementById("empty-state");

    elements.locationModal = document.getElementById("location-modal");

    elements.modalClose = document.getElementById("modal-close");

    elements.useLocation = document.getElementById("use-location");

    elements.manualLocationForm = document.getElementById(
      "manual-location-form",
    );

    elements.manualLocation = document.getElementById("manual-location");

    elements.modalMessage = document.getElementById("modal-message");

    elements.locationStatus = document.getElementById("location-status");

    elements.locationSummary = document.getElementById("location-summary");

    elements.toast = document.getElementById("toast");

    elements.liveMapSection = document.getElementById("live-map");

    elements.mapUnavailable = document.getElementById("map-unavailable");

    elements.mapLoading = document.getElementById("map-loading");

    elements.mapLocationButton = document.getElementById("map-location-button");

    elements.nearbySearchButton = document.getElementById(
      "nearby-search-button",
    );

    elements.radiusSelect = document.getElementById("radius-select");

    elements.selectedHelperLabel = document.getElementById(
      "selected-helper-label",
    );

    elements.selectedHelperControl = document.querySelector(
      ".selected-helper-control",
    );

    elements.resultsTitle = document.getElementById("results-title");

    elements.resultsCount = document.getElementById("results-count");

    elements.resultsStatus = document.getElementById("results-status");

    elements.resultsList = document.getElementById("results-list");

    elements.resultsEmpty = document.getElementById("results-empty");
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeHttpUrl(value) {
    if (!value) {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);

      return url.protocol === "http:" || url.protocol === "https:"
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function getVisibleCategories() {
    const query = normalize(state.query);

    return categories
      .filter(
        (category) =>
          state.activeCategory === "all" ||
          category.id === state.activeCategory,
      )
      .map((category) => {
        if (!query) {
          return category;
        }

        const categoryMatches = normalize(category.title).includes(query);

        const helpers = categoryMatches
          ? category.helpers
          : category.helpers.filter((helper) =>
              normalize(helper).includes(query),
            );

        return {
          ...category,
          helpers,
        };
      })
      .filter((category) => category.helpers.length > 0);
  }

  function renderFilters() {
    const filters = [
      {
        id: "all",
        title: "All helpers",
      },

      ...categories.map((category) => ({
        id: category.id,
        title: category.title,
      })),
    ];

    elements.filterRow.innerHTML = filters
      .map((filter) => {
        const active = filter.id === state.activeCategory;

        return `
            <button
              class="filter-chip${active ? " is-active" : ""}"
              type="button"
              data-filter="${escapeHtml(filter.id)}"
              aria-pressed="${active}"
            >
              ${escapeHtml(filter.title)}
            </button>
          `;
      })
      .join("");
  }
    function renderCategories() {
    const visibleCategories = getVisibleCategories();

    elements.categoryGrid.innerHTML = visibleCategories
      .map((category, index) => {
        const helperTags = category.helpers
          .map((helper) => {
            const selected = helper === state.selectedHelper;

            return `
                  <button
                    class="helper-tag${selected ? " is-selected" : ""}"
                    type="button"
                    data-helper="${escapeHtml(helper)}"
                    aria-pressed="${selected}"
                  >
                    ${escapeHtml(helper)}
                  </button>
                `;
          })
          .join("");

        return `
            <article class="category-card">
              <div class="card-top">
                <span
                  class="category-icon"
                  aria-hidden="true"
                >
                  ${escapeHtml(category.icon)}
                </span>

                <small>
                  ${String(index + 1).padStart(2, "0")}
                </small>
              </div>

              <h3>
                ${escapeHtml(category.title)}
              </h3>

              <div class="helper-tags">
                ${helperTags}
              </div>
            </article>
          `;
      })
      .join("");

    const hasResults = visibleCategories.length > 0;

    elements.categoryGrid.hidden = !hasResults;

    elements.emptyState.hidden = hasResults;
  }

  function updateSearch(query, source) {
    state.query = query;

    if (source !== elements.mainSearch) {
      elements.mainSearch.value = query;
    }

    if (source !== elements.helperSearch) {
      elements.helperSearch.value = query;
    }

    renderCategories();
  }

  function handleFilterClick(event) {
    const button = event.target.closest("[data-filter]");

    if (!button) {
      return;
    }

    state.activeCategory = button.dataset.filter || "all";

    renderFilters();
    renderCategories();
  }

  function selectHelper(helper, trigger) {
    state.selectedHelper = helper;

    elements.selectedHelperLabel.textContent = helper;

    elements.selectedHelperControl.classList.add("is-ready");

    elements.resultsTitle.textContent = helper;

    renderCategories();

    if (!state.location) {
      showToast(`${helper} selected. Choose a location to continue.`);

      window.setTimeout(() => openLocationModal(trigger), 180);

      return;
    }

    scrollToMap();
    performNearbySearch();
  }

  function handleHelperClick(event) {
    const button = event.target.closest("[data-helper]");

    if (!button) {
      return;
    }

    const helper = button.dataset.helper || "Helper";

    selectHelper(helper, button);
  }

  function openLocationModal(trigger) {
    state.lastFocusedElement = trigger || document.activeElement;

    elements.locationModal.hidden = false;

    document.body.classList.add("modal-open");

    resetModalMessage();

    window.requestAnimationFrame(() => elements.modalClose.focus());
  }

  function closeLocationModal() {
    elements.locationModal.hidden = true;

    document.body.classList.remove("modal-open");

    if (state.lastFocusedElement instanceof HTMLElement) {
      state.lastFocusedElement.focus();
    }
  }

  function setModalMessage(message, type) {
    elements.modalMessage.textContent = message;

    elements.modalMessage.classList.toggle("is-error", type === "error");

    elements.modalMessage.classList.toggle("is-success", type === "success");
  }

  function resetModalMessage() {
    setModalMessage(
      "No account required. Your location is not stored.",
      "neutral",
    );
  }

  function updateLocationUI(location) {
    const label = location.shortLabel || location.label || "Selected location";

    elements.locationStatus.textContent = "LOCATION READY";

    elements.locationStatus.parentElement.classList.add("is-ready");

    elements.locationSummary.textContent = `Selected area: ${label}`;
  }

  function acceptLocation(location) {
    state.location = location;

    updateLocationUI(location);

    window.dispatchEvent(
      new CustomEvent("onh:location-selected", {
        detail: {
          location,
        },
      }),
    );

    try {
      window.ONH_MAP.setLocation(location, {
        zoom: 14,
      });

      elements.mapUnavailable.hidden = true;
    } catch {
      elements.mapUnavailable.hidden = false;
    }

    closeLocationModal();

    showToast(`Location ready: ${location.shortLabel || location.label}`);

    scrollToMap();

    if (state.selectedHelper) {
      performNearbySearch();
    } else {
      setResultsStatus(
        "Location ready. Choose a helper category below.",
        "success",
      );
    }
  }

  async function requestCurrentLocation() {
    if (!window.ONH_LOCATION) {
      setModalMessage(
        "The location service could not load. Use manual search instead.",
        "error",
      );

      return;
    }

    elements.useLocation.disabled = true;

    setModalMessage("Waiting for your browser permission…", "neutral");

    try {
      const location = await window.ONH_LOCATION.getCurrentPosition();

      try {
        const place = await window.ONH_LOCATION.reverseGeocode(
          location.latitude,
          location.longitude,
        );

        location.label = place.label;

        location.shortLabel = place.shortLabel;
      } catch {
        location.shortLabel = "Your current location";
      }

      acceptLocation(location);
    } catch (error) {
      const message =
        error && error.code === "permission-denied"
          ? "Location permission was not granted. Manual search is always available."
          : (error && error.message) || "Your location could not be detected.";

      setModalMessage(message, "error");
    } finally {
      elements.useLocation.disabled = false;
    }
  }

  async function submitManualLocation(event) {
    event.preventDefault();

    const query = elements.manualLocation.value.trim();

    if (query.length < 2) {
      setModalMessage(
        "Please enter a valid city, town, or postal code.",
        "error",
      );

      elements.manualLocation.focus();

      return;
    }

    if (!window.ONH_LOCATION) {
      setModalMessage("The place-search service could not load.", "error");

      return;
    }

    const submitButton = elements.manualLocationForm.querySelector(
      "button[type='submit']",
    );

    submitButton.disabled = true;

    setModalMessage("Finding this place…", "neutral");

    try {
      const location = await window.ONH_LOCATION.geocode(query);

      elements.manualLocationForm.reset();

      acceptLocation(location);
    } catch (error) {
      setModalMessage(
        (error && error.message) || "That place could not be found.",
        "error",
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  function setResultsStatus(message, type) {
    elements.resultsStatus.textContent = message;

    elements.resultsStatus.classList.toggle("is-error", type === "error");

    elements.resultsStatus.classList.toggle("is-success", type === "success");
  }

  function setMapLoading(isLoading) {
    elements.mapLoading.hidden = !isLoading;

    elements.nearbySearchButton.disabled = isLoading;

    elements.mapLocationButton.disabled = isLoading;
  }

  function getRadiusSequence(selectedRadius) {
    const selected = Number(selectedRadius) || 5000;

    const sequence = radiusSteps.filter((radius) => radius >= selected);

    return sequence.length ? sequence : [25000];
  }

  async function performNearbySearch() {
    if (!state.selectedHelper) {
      showToast("Choose a helper before searching.");

      elements.helperSearch.focus();

      return;
    }

    if (!state.location) {
      openLocationModal(elements.nearbySearchButton);

      return;
    }

    if (!window.ONH_SEARCH) {
      setResultsStatus(
        "Nearby search could not load. Refresh and try again.",
        "error",
      );

      return;
    }

    const serial = ++state.searchSerial;

    const radii = getRadiusSequence(elements.radiusSelect.value);

    let finalResponse = null;

    setMapLoading(true);

    elements.resultsList.innerHTML = "";

    elements.resultsEmpty.hidden = true;

    elements.resultsCount.textContent = "0";

    setResultsStatus(
      `Searching for ${state.selectedHelper} within ${radii[0] / 1000} km…`,
      "neutral",
    );

    try {
      for (const radius of radii) {
        if (serial !== state.searchSerial) {
          return;
        }

        setResultsStatus(
          `Searching for ${state.selectedHelper} within ${radius / 1000} km…`,
          "neutral",
        );

        finalResponse = await window.ONH_SEARCH.searchNearby({
          helper: state.selectedHelper,
          location: state.location,
          radius,
        });

        if (finalResponse.results.length > 0) {
          elements.radiusSelect.value = String(radius);
          break;
        }

        if (radius !== radii[radii.length - 1]) {
          setResultsStatus(
            `No public listing found within ${
              radius / 1000
            } km. Expanding the search…`,
            "neutral",
          );
        }
      }

      if (serial !== state.searchSerial) {
        return;
      }

      state.results = finalResponse ? finalResponse.results : [];

      renderNearbyResults(state.results);

      window.ONH_MAP.setResults(state.results, state.location);

      if (state.results.length) {
        const usedRadius = finalResponse.radius / 1000;

        setResultsStatus(
          `${state.results.length} public listing${
            state.results.length === 1 ? "" : "s"
          } found within ${usedRadius} km.`,
          "success",
        );
      } else {
        setResultsStatus(
          "No public map listings were found within 25 km. Try another helper or location.",
          "error",
        );
      }
    } catch (error) {
      if (serial !== state.searchSerial) {
        return;
      }

      state.results = [];

      renderNearbyResults([]);

      window.ONH_MAP.clearResults();

      const message =
        error && error.name === "AbortError"
          ? "The search took too long. Please try again in a moment."
          : "Live public listings are temporarily unavailable. Please try again shortly.";

      setResultsStatus(message, "error");
    } finally {
      if (serial === state.searchSerial) {
        setMapLoading(false);
      }
    }
  }
    function getDirectionsUrl(result) {
    if (window.ONH_MAP && window.ONH_MAP.getDirectionsUrl) {
      return window.ONH_MAP.getDirectionsUrl(result);
    }

    const destination = encodeURIComponent(
      `${result.latitude},${result.longitude}`,
    );

    return (
      "https://www.google.com/maps/dir/" + `?api=1&destination=${destination}`
    );
  }

  function renderResultActions(result) {
    const actions = [
      `
        <button
          class="result-focus-button"
          type="button"
          data-focus-result="${escapeHtml(result.id)}"
        >
          Show on map
        </button>
      `,

      `
        <a
          href="${getDirectionsUrl(result)}"
          target="_blank"
          rel="noreferrer"
        >
          Directions ↗
        </a>
      `,
    ];

    if (result.phone) {
      const phone = String(result.phone).replace(/[^+\d,;#*]/g, "");

      if (phone) {
        actions.push(`<a href="tel:${escapeHtml(phone)}">Call</a>`);
      }
    }

    const website = safeHttpUrl(result.website);

    if (website) {
      actions.push(
        `
          <a
            href="${escapeHtml(website)}"
            target="_blank"
            rel="noreferrer"
          >
            Website ↗
          </a>
        `,
      );
    }

    return actions.join("");
  }

  function renderNearbyResults(results) {
    elements.resultsCount.textContent = String(results.length);

    elements.resultsTitle.textContent =
      state.selectedHelper || "Nearby helpers";

    elements.resultsEmpty.hidden = results.length > 0;

    if (!results.length) {
      elements.resultsList.innerHTML = "";

      elements.resultsEmpty.querySelector("p").textContent =
        "No public listings matched this search yet.";

      return;
    }

    elements.resultsList.innerHTML = results
      .map(
        (result) => `
            <article
              class="result-card"
              data-result-card="${escapeHtml(result.id)}"
            >
              <div class="result-card-top">
                <h4>
                  ${escapeHtml(result.name)}
                </h4>

                <span class="result-distance">
                  ${result.distanceKm.toFixed(1)} km
                </span>
              </div>

              <p class="result-category">
                ${escapeHtml(result.category)}
              </p>

              <p class="result-address">
                ${escapeHtml(result.address)}
              </p>

              <div class="result-actions">
                ${renderResultActions(result)}
              </div>
            </article>
          `,
      )
      .join("");
  }

  function focusResult(id) {
    elements.resultsList.querySelectorAll(".result-card").forEach((card) => {
      card.classList.toggle(
        "is-active",
        card.dataset.resultCard === String(id),
      );
    });

    const card = Array.from(
      elements.resultsList.querySelectorAll("[data-result-card]"),
    ).find((item) => item.dataset.resultCard === String(id));

    if (card) {
      card.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }

    window.ONH_MAP.focusResult(id);
  }

  function handleResultsClick(event) {
    const button = event.target.closest("[data-focus-result]");

    if (button) {
      focusResult(button.dataset.focusResult);
    }
  }

  function scrollToMap() {
    elements.liveMapSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.setTimeout(
      () => window.ONH_MAP && window.ONH_MAP.invalidateSize(),
      450,
    );
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);

    elements.toast.textContent = message;

    elements.toast.hidden = false;

    state.toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 3600);
  }

  function handleModalClick(event) {
    if (event.target === elements.locationModal) {
      closeLocationModal();
    }
  }

  function handleGlobalKeydown(event) {
    if (event.key === "Escape" && !elements.locationModal.hidden) {
      closeLocationModal();

      return;
    }

    if (event.key !== "Tab" || elements.locationModal.hidden) {
      return;
    }

    const focusable = Array.from(
      elements.locationModal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];

    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setupMobileMenu() {
    elements.menuButton.addEventListener("click", () => {
      const willOpen = elements.mobileMenu.hidden;

      elements.mobileMenu.hidden = !willOpen;

      elements.menuButton.setAttribute("aria-expanded", String(willOpen));

      elements.menuButton.setAttribute(
        "aria-label",
        willOpen ? "Close navigation" : "Open navigation",
      );
    });

    elements.mobileMenu.addEventListener("click", (event) => {
      if (event.target.matches("a")) {
        elements.mobileMenu.hidden = true;

        elements.menuButton.setAttribute("aria-expanded", "false");

        elements.menuButton.setAttribute("aria-label", "Open navigation");
      }
    });
  }

  function setupScrollProgress() {
    let ticking = false;

    function update() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

      elements.scrollProgress.style.width = `${Math.min(
        100,
        Math.max(0, progress),
      )}%`;

      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);

          ticking = true;
        }
      },
      {
        passive: true,
      },
    );

    update();
  }

  function setupRevealAnimations() {
    const revealItems = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
      },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function initializeMap() {
    try {
      if (!window.ONH_MAP) {
        throw new Error("Map module unavailable.");
      }

      window.ONH_MAP.init("live-map-canvas");

      elements.mapUnavailable.hidden = true;
    } catch {
      elements.mapUnavailable.hidden = false;

      elements.nearbySearchButton.disabled = true;

      setResultsStatus(
        "The interactive map could not load. Check your internet connection.",
        "error",
      );
    }
  }

  function bindEvents() {
    document.querySelectorAll("[data-open-location]").forEach((button) => {
      button.addEventListener("click", () => openLocationModal(button));
    });

    elements.mainSearch.addEventListener("input", (event) =>
      updateSearch(event.target.value, elements.mainSearch),
    );

    elements.helperSearch.addEventListener("input", (event) =>
      updateSearch(event.target.value, elements.helperSearch),
    );

    elements.filterRow.addEventListener("click", handleFilterClick);

    elements.categoryGrid.addEventListener("click", handleHelperClick);

    elements.modalClose.addEventListener("click", closeLocationModal);

    elements.locationModal.addEventListener("click", handleModalClick);

    elements.useLocation.addEventListener("click", requestCurrentLocation);

    elements.manualLocationForm.addEventListener(
      "submit",
      submitManualLocation,
    );

    elements.mapLocationButton.addEventListener("click", () =>
      openLocationModal(elements.mapLocationButton),
    );

    elements.nearbySearchButton.addEventListener("click", performNearbySearch);

    elements.resultsList.addEventListener("click", handleResultsClick);

    document.addEventListener("keydown", handleGlobalKeydown);

    window.addEventListener("onh:map-result-selected", (event) => {
      if (event.detail && event.detail.id) {
        focusResult(event.detail.id);
      }
    });
  }

  function init() {
    cacheElements();
    renderFilters();
    renderCategories();
    setupMobileMenu();
    setupScrollProgress();
    setupRevealAnimations();
    initializeMap();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true,
    });
  } else {
    init();
  }
})();
  

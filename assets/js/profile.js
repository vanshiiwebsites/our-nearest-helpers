(function () {
  "use strict";

  const state = {
    profile: null,
    lastFocusedElement: null,
    draftTimer: null,
    statusTimer: null,
    selectedLocationLabel: "",
  };

  const elements = {};

  function cacheElements() {
    elements.modal = document.getElementById("helper-profile-modal");

    elements.dialog = document.getElementById("helper-profile-dialog");

    elements.form = document.getElementById("helper-profile-form");

    elements.closeButton = document.getElementById("profile-close");

    elements.category = document.getElementById("profile-category");

    elements.primarySkill = document.getElementById("profile-primary-skill");

    elements.skillOptions = document.getElementById("profile-skill-options");

    elements.saveDraftButton = document.getElementById("profile-save-draft");

    elements.resetButton = document.getElementById("profile-reset");

    elements.saveStatus = document.getElementById("profile-save-status");

    elements.previewAvatar = document.getElementById("profile-preview-avatar");

    elements.previewName = document.getElementById("profile-preview-name");

    elements.previewRole = document.getElementById("profile-preview-role");

    elements.previewLocation = document.getElementById(
      "profile-preview-location",
    );

    elements.previewBio = document.getElementById("profile-preview-bio");

    elements.previewTags = document.getElementById("profile-preview-tags");

    elements.previewExperience = document.getElementById(
      "profile-preview-experience",
    );

    elements.previewAvailability = document.getElementById(
      "profile-preview-availability",
    );

    elements.previewMode = document.getElementById("profile-preview-mode");

    elements.previewPricing = document.getElementById(
      "profile-preview-pricing",
    );
  }

  function getCategories() {
    return Array.isArray(window.ONH_CATEGORIES) ? window.ONH_CATEGORIES : [];
  }

  function getStore() {
    return window.ONH_PROFILE_STORE;
  }

  function getCategoryLabel(categoryId) {
    const category = getCategories().find((item) => item.id === categoryId);

    return category ? category.title : "";
  }

  function populateCategories() {
    const currentValue = elements.category.value;

    const fragment = document.createDocumentFragment();

    getCategories().forEach((category) => {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.title;

      fragment.appendChild(option);
    });

    elements.category.appendChild(fragment);

    if (
      Array.from(elements.category.options).some(
        (option) => option.value === currentValue,
      )
    ) {
      elements.category.value = currentValue;
    }
  }

  function updateSkillOptions(categoryId) {
    const categories = getCategories();

    const category = categories.find((item) => item.id === categoryId);

    const helpers = category
      ? category.helpers
      : categories.flatMap((item) =>
          Array.isArray(item.helpers) ? item.helpers : [],
        );

    const uniqueHelpers = Array.from(new Set(helpers));

    const fragment = document.createDocumentFragment();

    uniqueHelpers.forEach((helper) => {
      const option = document.createElement("option");

      option.value = helper;

      fragment.appendChild(option);
    });

    elements.skillOptions.replaceChildren(fragment);
  }

  function getFormProfile() {
    const data = new FormData(elements.form);

    const current = state.profile || getStore().createEmptyProfile();

    return getStore().normalizeProfile({
      ...current,

      fullName: data.get("fullName"),

      professionalTitle: data.get("professionalTitle"),

      category: data.get("category"),

      primarySkill: data.get("primarySkill"),

      experienceYears: data.get("experienceYears"),

      serviceArea: data.get("serviceArea"),

      postcode: data.get("postcode"),

      languages: data.getAll("languages"),

      serviceMode: data.get("serviceMode"),

      availability: data.get("availability"),

      pricing: data.get("pricing"),

      phone: data.get("phone"),

      email: data.get("email"),

      website: data.get("website"),

      bio: data.get("bio"),

      consent: data.get("consent") === "accepted",
    });
  }

  function setFieldValue(name, value) {
    const field = elements.form.elements.namedItem(name);

    if (!field) {
      return;
    }

    field.value = value === null || value === undefined ? "" : String(value);
  }

  function fillForm(profile) {
    setFieldValue("fullName", profile.fullName);

    setFieldValue("professionalTitle", profile.professionalTitle);

    setFieldValue("category", profile.category);

    updateSkillOptions(profile.category);

    setFieldValue("primarySkill", profile.primarySkill);

    setFieldValue("experienceYears", profile.experienceYears);

    setFieldValue("serviceArea", profile.serviceArea);

    setFieldValue("postcode", profile.postcode);

    setFieldValue("serviceMode", profile.serviceMode);

    setFieldValue("availability", profile.availability);

    setFieldValue("pricing", profile.pricing);

    setFieldValue("phone", profile.phone);

    setFieldValue("email", profile.email);

    setFieldValue("website", profile.website);

    setFieldValue("bio", profile.bio);

    elements.form
      .querySelectorAll('input[name="languages"]')
      .forEach((checkbox) => {
        checkbox.checked = profile.languages.includes(checkbox.value);
      });

    const consent = elements.form.elements.namedItem("consent");

    if (consent) {
      consent.checked = profile.consent;
    }
  }

  function getExperienceLabel(value) {
    if (value === "" || value === null || value === undefined) {
      return "Not added";
    }

    const years = Number(value);

    if (years === 0) {
      return "Starting out";
    }

    return `${years} year${years === 1 ? "" : "s"}`;
  }

  function createPreviewTag(text) {
    const tag = document.createElement("span");

    tag.className = "profile-preview-tag";

    tag.textContent = text;

    return tag;
  }

  function updatePreview(profile) {
    const categoryLabel = getCategoryLabel(profile.category);

    elements.previewAvatar.textContent = getStore().getInitials(
      profile.fullName,
    );

    elements.previewName.textContent = profile.fullName || "Your name";

    elements.previewRole.textContent =
      profile.professionalTitle || profile.primarySkill || "Professional title";

    elements.previewLocation.textContent = profile.serviceArea
      ? `📍 ${profile.serviceArea}${
          profile.postcode ? ` · ${profile.postcode}` : ""
        }`
      : "📍 Service area";

    elements.previewBio.textContent =
      profile.bio || "Your professional introduction will appear here.";

    const tags = [
      categoryLabel,
      profile.primarySkill,
      ...profile.languages,
    ].filter(Boolean);

    elements.previewTags.replaceChildren(
      ...tags.slice(0, 6).map(createPreviewTag),
    );

    elements.previewExperience.textContent = getExperienceLabel(
      profile.experienceYears,
    );

    elements.previewAvailability.textContent =
      profile.availability || "Not added";

    elements.previewMode.textContent = profile.serviceMode || "Not added";

    elements.previewPricing.textContent = profile.pricing || "Discuss directly";
                                                    }
    function setStatus(message, type, clearAfter) {
    window.clearTimeout(state.statusTimer);

    elements.saveStatus.textContent = message;

    elements.saveStatus.classList.toggle("is-success", type === "success");

    elements.saveStatus.classList.toggle("is-error", type === "error");

    if (clearAfter) {
      state.statusTimer = window.setTimeout(() => {
        elements.saveStatus.textContent = "";

        elements.saveStatus.classList.remove("is-success", "is-error");
      }, clearAfter);
    }
  }

  function clearValidationErrors() {
    elements.form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
      field.removeAttribute("aria-invalid");
    });

    elements.form
      .querySelectorAll("[data-profile-error]")
      .forEach((message) => {
        message.textContent = "";
      });
  }

  function getFieldsForError(key) {
    const mappedName = key === "contact" ? "phone" : key;

    return Array.from(elements.form.querySelectorAll(`[name="${mappedName}"]`));
  }

  function showValidationErrors(errors) {
    clearValidationErrors();

    const errorEntries = Object.entries(errors);

    errorEntries.forEach(([key, message]) => {
      const errorElement = elements.form.querySelector(
        `[data-profile-error="${key}"]`,
      );

      if (errorElement) {
        errorElement.textContent = message;
      }

      getFieldsForError(key).forEach((field) => {
        field.setAttribute("aria-invalid", "true");
      });
    });

    if (!errorEntries.length) {
      return;
    }

    const firstKey = errorEntries[0][0];

    const firstField = getFieldsForError(firstKey)[0];

    if (firstField) {
      firstField.focus();

      firstField.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function hasDraftContent(profile) {
    return Boolean(
      profile.fullName ||
        profile.professionalTitle ||
        profile.category ||
        profile.primarySkill ||
        profile.serviceArea ||
        profile.phone ||
        profile.email ||
        profile.bio,
    );
  }

  function saveCurrentDraft(announce) {
    const profile = getFormProfile();

    state.profile = profile;

    updatePreview(profile);

    if (!hasDraftContent(profile)) {
      if (announce) {
        setStatus(
          "Add some profile details before saving a draft.",
          "error",
          3600,
        );
      }

      return null;
    }

    try {
      const saved = getStore().saveDraft(profile);

      state.profile = saved;

      if (announce) {
        setStatus("Draft saved on this device.", "success", 3200);
      }

      return saved;
    } catch (error) {
      setStatus(
        (error && error.message) || "The draft could not be saved.",
        "error",
      );

      return null;
    }
  }

  function scheduleDraftSave() {
    window.clearTimeout(state.draftTimer);

    state.draftTimer = window.setTimeout(() => {
      saveCurrentDraft(false);
    }, 700);
  }

  function handleFormUpdate() {
    const profile = getFormProfile();

    state.profile = profile;

    updatePreview(profile);

    clearValidationErrors();
    scheduleDraftSave();

    setStatus("Editing draft…", "neutral", 1800);
  }

  function handleCategoryChange() {
    updateSkillOptions(elements.category.value);

    const selectedCategory = getCategories().find(
      (category) => category.id === elements.category.value,
    );

    if (
      selectedCategory &&
      elements.primarySkill.value &&
      !selectedCategory.helpers.includes(elements.primarySkill.value)
    ) {
      elements.primarySkill.value = "";
    }

    handleFormUpdate();
  }

  function updateProfileButtons(hasSavedProfile) {
    document
      .querySelectorAll("[data-profile-button-label]")
      .forEach((label) => {
        label.textContent = hasSavedProfile
          ? "Edit helper profile"
          : "Join as a helper";
      });

    document.querySelectorAll("[data-open-profile]").forEach((button) => {
      button.dataset.profileState = hasSavedProfile ? "saved" : "new";
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    window.clearTimeout(state.draftTimer);

    const profile = getFormProfile();

    const validation = getStore().validateProfile(profile);

    if (!validation.valid) {
      showValidationErrors(validation.errors);

      setStatus("Please check the highlighted details.", "error");

      return;
    }

    clearValidationErrors();

    const submitButton = elements.form.querySelector("button[type='submit']");

    submitButton.disabled = true;

    setStatus("Saving your profile…", "neutral");

    try {
      const saved = getStore().saveProfile(validation.profile);

      state.profile = saved;

      fillForm(saved);
      updatePreview(saved);
      updateProfileButtons(true);

      setStatus("Profile saved successfully on this device.", "success");
    } catch (error) {
      if (error && error.errors) {
        showValidationErrors(error.errors);
      }

      setStatus(
        (error && error.message) || "Your profile could not be saved.",
        "error",
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  function handleSaveDraft() {
    window.clearTimeout(state.draftTimer);

    saveCurrentDraft(true);
  }

  function handleResetProfile() {
    const confirmed = window.confirm(
      "Remove the saved profile and start again? This cannot be undone on this device.",
    );

    if (!confirmed) {
      return;
    }

    window.clearTimeout(state.draftTimer);

    getStore().clearProfile();

    const emptyProfile = getStore().createEmptyProfile();

    state.profile = emptyProfile;

    elements.form.reset();

    fillForm(emptyProfile);
    updatePreview(emptyProfile);
    clearValidationErrors();
    updateProfileButtons(false);

    setStatus("Saved profile removed.", "success", 3200);
  }

  function useSelectedLocation(event) {
    const location = event.detail && event.detail.location;

    if (!location || !elements.form) {
      return;
    }

    const label = location.shortLabel || location.label || "";

    if (!label) {
      return;
    }

    state.selectedLocationLabel = label;

    const areaField = elements.form.elements.namedItem("serviceArea");

    if (!areaField || areaField.value.trim()) {
      return;
    }

    areaField.value = label;

    if (!elements.modal.hidden) {
      state.isDirty = true;
      handleFormUpdate();
    }
  }

  function getLatestProfile() {
    const store = getStore();

    const saved = store.loadSavedProfile();

    const draft = store.loadDraft();

    if (!saved && !draft) {
      return {
        profile: store.createEmptyProfile(),
        restoredDraft: false,
      };
    }

    if (!saved) {
      return {
        profile: draft,
        restoredDraft: true,
      };
    }

    if (!draft) {
      return {
        profile: saved,
        restoredDraft: false,
      };
    }

    const savedTime = Date.parse(saved.updatedAt) || 0;

    const draftTime = Date.parse(draft.updatedAt) || 0;

    return draftTime > savedTime
      ? {
          profile: draft,
          restoredDraft: true,
        }
      : {
          profile: saved,
          restoredDraft: false,
        };
      }
    function openProfileModal(trigger) {
    state.lastFocusedElement = trigger || document.activeElement;

    const latest = getLatestProfile();

    state.profile = latest.profile;

    state.isDirty = false;

    fillForm(state.profile);

    if (state.selectedLocationLabel && !state.profile.serviceArea) {
      const areaField = elements.form.elements.namedItem("serviceArea");

      if (areaField) {
        areaField.value = state.selectedLocationLabel;

        state.profile = getFormProfile();

        state.isDirty = true;
      }
    }

    updatePreview(state.profile);
    clearValidationErrors();

    elements.modal.hidden = false;

    document.body.classList.add("modal-open");

    if (latest.restoredDraft) {
      setStatus("Your saved draft has been restored.", "success", 3600);
    } else if (state.profile.status === "saved") {
      setStatus("Editing your saved profile.", "neutral", 2800);
    } else {
      setStatus("", "neutral");
    }

    window.requestAnimationFrame(() => elements.closeButton.focus());
  }

  function closeProfileModal() {
    window.clearTimeout(state.draftTimer);

    if (state.isDirty) {
      saveCurrentDraft(false);
      state.isDirty = false;
    }

    elements.modal.hidden = true;

    document.body.classList.remove("modal-open");

    if (state.lastFocusedElement instanceof HTMLElement) {
      state.lastFocusedElement.focus();
    }
  }

  function handleDocumentClick(event) {
    const openButton = event.target.closest("[data-open-profile]");

    if (openButton) {
      openProfileModal(openButton);
    }
  }

  function handleModalClick(event) {
    if (event.target === elements.modal) {
      closeProfileModal();
    }
  }

  function handleProfileKeydown(event) {
    if (elements.modal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      closeProfileModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      elements.dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hidden && element.offsetParent !== null);

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

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);

    elements.closeButton.addEventListener("click", closeProfileModal);

    elements.modal.addEventListener("click", handleModalClick);

    elements.form.addEventListener("input", () => {
      state.isDirty = true;
      handleFormUpdate();
    });

    elements.form.addEventListener("change", (event) => {
      state.isDirty = true;

      if (event.target === elements.category) {
        handleCategoryChange();
      } else {
        handleFormUpdate();
      }
    });

    elements.form.addEventListener("submit", (event) => {
      handleSubmit(event);

      if (state.profile && state.profile.status === "saved") {
        state.isDirty = false;
      }
    });

    elements.saveDraftButton.addEventListener("click", () => {
      handleSaveDraft();
      state.isDirty = false;
    });

    elements.resetButton.addEventListener("click", () => {
      handleResetProfile();
      state.isDirty = false;
    });

    document.addEventListener("keydown", handleProfileKeydown);

    window.addEventListener("onh:location-selected", useSelectedLocation);

    window.addEventListener("onh:profile-saved", () =>
      updateProfileButtons(true),
    );

    window.addEventListener("onh:profile-cleared", () =>
      updateProfileButtons(false),
    );
  }

  function init() {
    cacheElements();

    if (!elements.modal || !elements.dialog || !elements.form || !getStore()) {
      return;
    }

    populateCategories();
    updateSkillOptions("");

    const savedProfile = getStore().loadSavedProfile();

    updateProfileButtons(Boolean(savedProfile));

    bindEvents();
  }

  window.ONH_PROFILE = Object.freeze({
    open: openProfileModal,
    close: closeProfileModal,

    getSavedProfile() {
      return getStore() ? getStore().loadSavedProfile() : null;
    },
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true,
    });
  } else {
    init();
  }
})();

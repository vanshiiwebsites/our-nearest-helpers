(function () {
  "use strict";

  const state = {
    selectedLocation: null,
    profileHasUnsavedChanges: false,
    submission: null,
    submitting: false,
  };

  const elements = {};

  function getStore() {
    return window.ONH_PROFILE_STORE;
  }

  function getDirectory() {
    return window.ONH_DIRECTORY;
  }

  function createElement(
    tagName,
    options,
  ) {
    const element =
      document.createElement(tagName);

    const settings = options || {};

    if (settings.className) {
      element.className =
        settings.className;
    }

    if (settings.id) {
      element.id = settings.id;
    }

    if (settings.text) {
      element.textContent =
        settings.text;
    }

    return element;
  }

  function createVisibilityChoice(
    id,
    labelText,
  ) {
    const label = createElement(
      "label",
      {
        className: "profile-choice",
      },
    );

    const input = createElement(
      "input",
      {
        id,
      },
    );

    input.type = "checkbox";

    const text = createElement(
      "span",
      {
        text: labelText,
      },
    );

    label.append(input, text);

    return {
      label,
      input,
    };
  }

  function buildPanel() {
    const panel = createElement(
      "section",
      {
        className: "profile-section",
        id: "directory-submission-panel",
      },
    );

    panel.setAttribute(
      "aria-labelledby",
      "directory-submission-title",
    );

    const title = createElement(
      "h3",
      {
        id: "directory-submission-title",
        text: "Submit to the public helper directory",
      },
    );

    const introduction = createElement(
      "p",
      {
        className: "profile-section-note",
        text:
          "First save your completed profile. You can then send it for moderation. Nothing becomes public until it is approved.",
      },
    );

    const field = createElement(
      "div",
      {
        className: "profile-field is-full",
      },
    );

    const choiceLabel = createElement(
      "span",
      {
        className: "profile-choice-label",
        text: "Contact details to show after approval",
      },
    );

    const choiceGrid = createElement(
      "div",
      {
        className: "profile-choice-grid",
      },
    );

    const phoneChoice =
      createVisibilityChoice(
        "directory-publish-phone",
        "Show my phone",
      );

    const emailChoice =
      createVisibilityChoice(
        "directory-publish-email",
        "Show my email",
      );

    elements.publishPhone =
      phoneChoice.input;

    elements.publishEmail =
      emailChoice.input;

    choiceGrid.append(
      phoneChoice.label,
      emailChoice.label,
    );

    const contactNote = createElement(
      "small",
      {
        id: "directory-contact-note",
        text:
          "Choose only the contact details you want visitors to see. A website or professional link, if added, will also be public after approval.",
      },
    );

    field.append(
      choiceLabel,
      choiceGrid,
      contactNote,
    );

    const consentLabel = createElement(
      "label",
      {
        className: "profile-consent",
      },
    );

    elements.publicConsent =
      createElement("input", {
        id: "directory-public-consent",
      });

    elements.publicConsent.type =
      "checkbox";

    const consentText = createElement(
      "span",
      {
        text:
          "I choose to send this profile to Our Nearest Helpers for moderation and possible public display. I understand that my profile details, service area, website and selected contact details will be stored online. If I selected a map location during this visit, only rounded approximate coordinates will be sent.",
      },
    );

    consentLabel.append(
      elements.publicConsent,
      consentText,
    );

    elements.error = createElement(
      "small",
      {
        className: "profile-field-error",
        id: "directory-submission-error",
      },
    );

    const actions = createElement(
      "div",
      {
        className: "profile-actions",
      },
    );

    elements.submitButton =
      createElement("button", {
        className: "profile-primary-button",
        id: "directory-submit-profile",
        text: "Submit for review",
      });

    elements.submitButton.type =
      "button";

    elements.status = createElement(
      "p",
      {
        className: "profile-save-status",
        id: "directory-submission-status",
      },
    );

    elements.status.setAttribute(
      "role",
      "status",
    );

    elements.status.setAttribute(
      "aria-live",
      "polite",
    );

    actions.append(
      elements.submitButton,
      elements.status,
    );

    panel.append(
      title,
      introduction,
      field,
      consentLabel,
      elements.error,
      actions,
    );

    elements.form.after(panel);

    elements.panel = panel;
  }
    function updateExistingPrivacyText() {
    const localConsentText =
      elements.form.querySelector(
        'input[name="consent"] + span',
      );

    if (localConsentText) {
      localConsentText.textContent =
        "I understand that saving keeps this profile in this browser. It is sent online only if I separately use the public-directory submission below.";
    }

    const introduction =
      document.querySelector(
        ".profile-intro",
      );

    if (introduction) {
      introduction.textContent =
        "Build and save your helper profile on this device. You can separately submit it for moderation if you want it considered for the public directory.";
    }
  }

  function setStatus(
    message,
    type,
  ) {
    elements.status.textContent =
      message;

    elements.status.classList.toggle(
      "is-success",
      type === "success",
    );

    elements.status.classList.toggle(
      "is-error",
      type === "error",
    );
  }

  function setError(message) {
    elements.error.textContent =
      message || "";

    elements.publicConsent.toggleAttribute(
      "aria-invalid",
      Boolean(message),
    );
  }

  function getSavedProfile() {
    const store = getStore();

    return store
      ? store.loadSavedProfile()
      : null;
  }

  function hasNewerDraft() {
    const store = getStore();

    if (!store) {
      return false;
    }

    const draft =
      store.loadDraft();

    const saved =
      store.loadSavedProfile();

    if (!draft) {
      return false;
    }

    if (!saved) {
      return true;
    }

    const draftTime =
      Date.parse(draft.updatedAt) || 0;

    const savedTime =
      Date.parse(saved.updatedAt) || 0;

    return draftTime > savedTime;
  }

  function getProfileReadiness() {
    const store = getStore();

    const profile =
      getSavedProfile();

    if (!store || !profile) {
      return {
        ready: false,
        profile: null,
        reason:
          "Complete and save your profile first.",
      };
    }

    if (hasNewerDraft()) {
      return {
        ready: false,
        profile,
        reason:
          "Save your latest profile changes before submitting.",
      };
    }

    const validation =
      store.validateProfile(profile);

    if (!validation.valid) {
      return {
        ready: false,
        profile,
        reason:
          "Complete the required details and save your profile again.",
      };
    }

    if (
      state.profileHasUnsavedChanges
    ) {
      return {
        ready: false,
        profile,
        reason:
          "Save your latest profile changes before submitting.",
      };
    }

    return {
      ready: true,
      profile:
        validation.profile,
      reason: "",
    };
  }

  function updateContactChoices(
    profile,
  ) {
    const hasPhone = Boolean(
      profile && profile.phone,
    );

    const hasEmail = Boolean(
      profile && profile.email,
    );

    elements.publishPhone.disabled =
      !hasPhone;

    elements.publishEmail.disabled =
      !hasEmail;

    if (!hasPhone) {
      elements.publishPhone.checked =
        false;
    }

    if (!hasEmail) {
      elements.publishEmail.checked =
        false;
    }
  }

  function getSubmissionLabel() {
    if (
      !state.submission ||
      !state.submission.status
    ) {
      return "Submit for review";
    }

    if (
      state.submission.status ===
      "pending"
    ) {
      return "Update pending submission";
    }

    if (
      state.submission.status ===
      "rejected"
    ) {
      return "Resubmit for review";
    }

    return "Profile already approved";
  }

  function refreshPanel() {
    const readiness =
      getProfileReadiness();

    updateContactChoices(
      readiness.profile,
    );

    const approved =
      state.submission &&
      state.submission.status ===
        "approved";

    elements.submitButton.textContent =
      getSubmissionLabel();

    elements.submitButton.disabled =
      state.submitting ||
      !readiness.ready ||
      Boolean(approved) ||
      !getDirectory();

    if (
      !state.submitting &&
      !readiness.ready
    ) {
      setStatus(
        readiness.reason,
        "neutral",
      );
    }
  }

  function hasPublicContact(profile) {
    return Boolean(
      (elements.publishPhone.checked &&
        profile.phone) ||
        (elements.publishEmail.checked &&
          profile.email) ||
        profile.website,
    );
  }

  function getLocationOptions() {
    const location =
      state.selectedLocation;

    return {
      latitude:
        location &&
        location.latitude,

      longitude:
        location &&
        location.longitude,
    };
      }
    async function submitForReview() {
    if (state.submitting) {
      return;
    }

    setError("");

    const readiness =
      getProfileReadiness();

    if (!readiness.ready) {
      setError(readiness.reason);
      refreshPanel();
      return;
    }

    if (
      !elements.publicConsent.checked
    ) {
      setError(
        "Please read and accept the public-directory consent before submitting.",
      );

      elements.publicConsent.focus();
      return;
    }

    if (
      !hasPublicContact(
        readiness.profile,
      )
    ) {
      setError(
        "Choose a phone or email to show, or add and save a website link first.",
      );
      return;
    }

    const directory =
      getDirectory();

    if (!directory) {
      setError(
        "The public directory service is unavailable. Refresh and try again.",
      );
      return;
    }

    state.submitting = true;
    refreshPanel();

    setStatus(
      "Creating a secure session and submitting your profile…",
      "neutral",
    );

    try {
      const submission =
        await directory.submitProfile(
          readiness.profile,
          {
            ...getLocationOptions(),
            publishPhone:
              elements.publishPhone.checked,
            publishEmail:
              elements.publishEmail.checked,
            publicConsent: true,
          },
        );

      state.submission =
        submission;

      elements.publicConsent.checked =
        false;

      setStatus(
        "Submitted for review. It is not public unless an administrator approves it.",
        "success",
      );
    } catch (error) {
      setError(
        (error && error.message) ||
          "The profile could not be submitted. Please try again.",
      );

      setStatus(
        "Submission was not completed.",
        "error",
      );
    } finally {
      state.submitting = false;
      refreshPanel();
    }
  }

  function useSelectedLocation(
    event,
  ) {
    const location =
      event.detail &&
      event.detail.location;

    if (!location) {
      return;
    }

    state.selectedLocation = {
      latitude:
        Number(location.latitude),
      longitude:
        Number(location.longitude),
    };
  }

  function handleProfileInput() {
    state.profileHasUnsavedChanges =
      true;

    refreshPanel();
  }

  function handleProfileSaved() {
    state.profileHasUnsavedChanges =
      false;

    setError("");
    refreshPanel();
  }

  function handleProfileCleared() {
    state.profileHasUnsavedChanges =
      false;

    state.submission = null;

    elements.publishPhone.checked =
      false;

    elements.publishEmail.checked =
      false;

    elements.publicConsent.checked =
      false;

    setError("");
    refreshPanel();
  }

  async function loadSubmissionStatus() {
    const directory =
      getDirectory();

    if (!directory) {
      setStatus(
        "The public directory service did not load. Refresh the page.",
        "error",
      );
      refreshPanel();
      return;
    }

    try {
      state.submission =
        await directory.getOwnSubmission();

      if (!state.submission) {
        refreshPanel();
        return;
      }

      if (
        state.submission.status ===
        "pending"
      ) {
        setStatus(
          "Your directory profile is waiting for review.",
          "success",
        );
      } else if (
        state.submission.status ===
        "approved"
      ) {
        setStatus(
          "Your directory profile is approved and published.",
          "success",
        );
      } else {
        setStatus(
          "Your previous submission was not approved. Update your saved profile before resubmitting.",
          "error",
        );
      }

      refreshPanel();
    } catch (error) {
      setStatus(
        (error && error.message) ||
          "Submission status could not be loaded.",
        "error",
      );
      refreshPanel();
    }
  }

  function bindEvents() {
    elements.submitButton.addEventListener(
      "click",
      submitForReview,
    );

    elements.publicConsent.addEventListener(
      "change",
      () => setError(""),
    );

    elements.publishPhone.addEventListener(
      "change",
      () => setError(""),
    );

    elements.publishEmail.addEventListener(
      "change",
      () => setError(""),
    );

    elements.form.addEventListener(
      "input",
      handleProfileInput,
    );

    elements.form.addEventListener(
      "change",
      handleProfileInput,
    );

    window.addEventListener(
      "onh:profile-saved",
      handleProfileSaved,
    );

    window.addEventListener(
      "onh:profile-cleared",
      handleProfileCleared,
    );

    window.addEventListener(
      "onh:location-selected",
      useSelectedLocation,
    );
  }

  function init() {
    elements.form =
      document.getElementById(
        "helper-profile-form",
      );

    if (
      !elements.form ||
      !getStore()
    ) {
      return;
    }

    buildPanel();
    updateExistingPrivacyText();
    bindEvents();
    refreshPanel();
    loadSubmissionStatus();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true,
      },
    );
  } else {
    init();
  }
})();
  

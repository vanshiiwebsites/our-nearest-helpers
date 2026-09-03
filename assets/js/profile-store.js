(function () {
  "use strict";

  const DRAFT_KEY =
    "onh:helper-profile:draft:v1";

  const SAVED_KEY =
    "onh:helper-profile:saved:v1";

  const VERSION = 1;

  let storageAvailable = null;

  function createProfileId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      "helper-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );
  }

  function createEmptyProfile() {
    return {
      version: VERSION,
      id: createProfileId(),
      status: "draft",

      fullName: "",
      professionalTitle: "",
      category: "",
      primarySkill: "",

      experienceYears: "",
      serviceArea: "",
      postcode: "",

      languages: [],
      serviceMode: "",
      availability: "",
      pricing: "",

      phone: "",
      email: "",
      website: "",
      bio: "",

      consent: false,
      createdAt: "",
      updatedAt: ""
    };
  }

  function cleanText(value, maxLength) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function cleanMultilineText(
    value,
    maxLength
  ) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, maxLength);
  }

  function cleanArray(value) {
    const values = Array.isArray(value)
      ? value
      : String(value || "").split(",");

    const seen = new Set();

    return values
      .map((item) =>
        cleanText(item, 40)
      )
      .filter((item) => {
        const key =
          item.toLocaleLowerCase();

        if (!item || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }

  function normalizeProfile(value) {
    const source =
      value && typeof value === "object"
        ? value
        : {};

    const base = createEmptyProfile();

    const experience =
      source.experienceYears === ""
        ? ""
        : Number(
            source.experienceYears
          );

    return {
      ...base,

      version: VERSION,

      id:
        cleanText(source.id, 100) ||
        base.id,

      status:
        source.status === "saved"
          ? "saved"
          : "draft",

      fullName: cleanText(
        source.fullName,
        80
      ),

      professionalTitle: cleanText(
        source.professionalTitle,
        100
      ),

      category: cleanText(
        source.category,
        80
      ),

      primarySkill: cleanText(
        source.primarySkill,
        100
      ),

      experienceYears:
        Number.isFinite(experience)
          ? Math.max(
              0,
              Math.min(60, experience)
            )
          : "",

      serviceArea: cleanText(
        source.serviceArea,
        120
      ),

      postcode: cleanText(
        source.postcode,
        15
      ),

      languages: cleanArray(
        source.languages
      ),

      serviceMode: cleanText(
        source.serviceMode,
        30
      ),

      availability: cleanText(
        source.availability,
        50
      ),

      pricing: cleanText(
        source.pricing,
        80
      ),

      phone: cleanText(
        source.phone,
        30
      ),

      email: cleanText(
        source.email,
        120
      ),

      website: cleanText(
        source.website,
        250
      ),

      bio: cleanMultilineText(
        source.bio,
        500
      ),

      consent:
        source.consent === true,

      createdAt: cleanText(
        source.createdAt,
        40
      ),

      updatedAt: cleanText(
        source.updatedAt,
        40
      )
    };
  }

  function canUseStorage() {
    if (storageAvailable !== null) {
      return storageAvailable;
    }

    try {
      const testKey =
        "onh:storage-test";

      window.localStorage.setItem(
        testKey,
        "1"
      );

      window.localStorage.removeItem(
        testKey
      );

      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }

    return storageAvailable;
  }

  function readStorage(key) {
    if (!canUseStorage()) {
      return null;
    }

    try {
      const raw =
        window.localStorage.getItem(key);

      if (!raw) {
        return null;
      }

      return normalizeProfile(
        JSON.parse(raw)
      );
    } catch {
      return null;
    }
  }

  function writeStorage(key, profile) {
    if (!canUseStorage()) {
      throw new Error(
        "Profile storage is unavailable in this browser."
      );
    }

    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(profile)
      );
    } catch {
      throw new Error(
        "Your profile could not be saved on this device."
      );
    }
  }

  function saveDraft(value) {
    const profile =
      normalizeProfile(value);

    const now =
      new Date().toISOString();

    profile.status = "draft";

    profile.createdAt =
      profile.createdAt || now;

    profile.updatedAt = now;

    writeStorage(
      DRAFT_KEY,
      profile
    );

    window.dispatchEvent(
      new CustomEvent(
        "onh:profile-draft-saved",
        {
          detail: {
            profile
          }
        }
      )
    );

    return profile;
  }

  function loadDraft() {
    return readStorage(DRAFT_KEY);
  }

  function loadSavedProfile() {
    return readStorage(SAVED_KEY);
  }

  function loadLatestProfile() {
    return (
      loadSavedProfile() ||
      loadDraft() ||
      createEmptyProfile()
    );
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(String(value || ""));
  }

  function isValidPhone(value) {
    const digits =
      String(value || "")
        .replace(/\D/g, "");

    return (
      digits.length >= 7 &&
      digits.length <= 15
    );
  }

  function isValidWebsite(value) {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);

      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  function validateProfile(value) {
    const profile =
      normalizeProfile(value);

    const errors = {};

    if (profile.fullName.length < 2) {
      errors.fullName =
        "Enter your full name.";
    }

    if (
      profile.professionalTitle.length <
      2
    ) {
      errors.professionalTitle =
        "Enter a clear professional title.";
    }

    if (!profile.category) {
      errors.category =
        "Choose a helper category.";
    }

    if (!profile.primarySkill) {
      errors.primarySkill =
        "Enter your primary skill.";
    }

    if (
      profile.experienceYears === ""
    ) {
      errors.experienceYears =
        "Enter your experience.";
    }

    if (
      profile.serviceArea.length < 2
    ) {
      errors.serviceArea =
        "Enter your city or service area.";
    }

    if (!profile.languages.length) {
      errors.languages =
        "Choose at least one language.";
    }

    if (!profile.serviceMode) {
      errors.serviceMode =
        "Choose how you provide services.";
    }

    if (!profile.availability) {
      errors.availability =
        "Choose your availability.";
    }

    if (
      !profile.phone &&
      !profile.email
    ) {
      errors.contact =
        "Add a phone number or email.";
    }

    if (
      profile.phone &&
      !isValidPhone(profile.phone)
    ) {
      errors.phone =
        "Enter a valid phone number.";
    }

    if (
      profile.email &&
      !isValidEmail(profile.email)
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    if (
      profile.website &&
      !isValidWebsite(profile.website)
    ) {
      errors.website =
        "Use a complete link beginning with http:// or https://.";
    }

    if (profile.bio.length < 30) {
      errors.bio =
        "Write at least 30 characters about your work.";
    }

    if (!profile.consent) {
      errors.consent =
        "Please accept the profile-storage notice.";
    }

    return {
      valid:
        Object.keys(errors).length ===
        0,

      errors,
      profile
    };
  }

  function saveProfile(value) {
    const validation =
      validateProfile(value);

    if (!validation.valid) {
      const error = new Error(
        "Please complete the required profile details."
      );

      error.code =
        "validation-failed";

      error.errors =
        validation.errors;

      throw error;
    }

    const profile =
      validation.profile;

    const now =
      new Date().toISOString();

    profile.status = "saved";

    profile.createdAt =
      profile.createdAt || now;

    profile.updatedAt = now;

    writeStorage(
      SAVED_KEY,
      profile
    );

    if (canUseStorage()) {
      window.localStorage.removeItem(
        DRAFT_KEY
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "onh:profile-saved",
        {
          detail: {
            profile
          }
        }
      )
    );

    return profile;
  }

  function clearProfile() {
    if (canUseStorage()) {
      window.localStorage.removeItem(
        DRAFT_KEY
      );

      window.localStorage.removeItem(
        SAVED_KEY
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "onh:profile-cleared"
      )
    );
  }

  function getInitials(name) {
    const parts =
      cleanText(name, 80)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2);

    if (!parts.length) {
      return "NH";
    }

    return parts
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .toUpperCase();
  }

  window.ONH_PROFILE_STORE =
    Object.freeze({
      createEmptyProfile,
      normalizeProfile,
      saveDraft,
      loadDraft,
      loadSavedProfile,
      loadLatestProfile,
      validateProfile,
      saveProfile,
      clearProfile,
      getInitials,
      canUseStorage
    });
})();

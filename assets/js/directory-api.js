(function () {
  "use strict";

  const SUPABASE_URL =
    "https://wuoijbrtmadhiggdxwbj.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_VxfOWoaUlrhrBBLfHtufNg_WltXcMKm";

  const AUTH_STORAGE_KEY =
    "onh:supabase-auth:v1";

  const PRIVACY_VERSION =
    "2026-09-01";

  let client = null;

  function getClient() {
    if (client) {
      return client;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !==
        "function"
    ) {
      throw new Error(
        "The public directory service could not load. Refresh and try again.",
      );
    }

    client =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            storageKey:
              AUTH_STORAGE_KEY,

            persistSession: true,

            autoRefreshToken: true,

            detectSessionInUrl: false,
          },

          global: {
            headers: {
              "X-Client-Info":
                "our-nearest-helpers-web/1.0",
            },
          },
        },
      );

    return client;
  }

  function cleanNullable(value) {
    const text = String(
      value || "",
    ).trim();

    return text || null;
  }

  function getRoundedCoordinate(
    value,
    minimum,
    maximum,
  ) {
    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < minimum ||
      number > maximum
    ) {
      return null;
    }

    return Number(
      number.toFixed(2),
    );
  }

  function getCoordinates(options) {
    const latitude =
      getRoundedCoordinate(
        options && options.latitude,
        -90,
        90,
      );

    const longitude =
      getRoundedCoordinate(
        options && options.longitude,
        -180,
        180,
      );

    if (
      latitude === null ||
      longitude === null
    ) {
      return {
        latitude: null,
        longitude: null,
      };
    }

    return {
      latitude,
      longitude,
    };
  }

  async function getExistingSession() {
    const directoryClient =
      getClient();

    const { data, error } =
      await directoryClient.auth.getSession();

    if (error) {
      throw new Error(
        "Your directory session could not be checked. Please try again.",
      );
    }

    return data && data.session
      ? data.session
      : null;
  }

  async function ensureAnonymousSession() {
    const existingSession =
      await getExistingSession();

    if (
      existingSession &&
      existingSession.user
    ) {
      return existingSession;
    }

    const directoryClient =
      getClient();

    const { data, error } =
      await directoryClient.auth
        .signInAnonymously({
          options: {
            data: {
              source:
                "our-nearest-helpers",
            },
          },
        });

    if (
      error ||
      !data ||
      !data.session ||
      !data.user
    ) {
      throw new Error(
        "A secure submission session could not be created. Please try again.",
      );
    }

    return data.session;
  }
    function createSubmissionPayload(
    profile,
    options,
    userId,
  ) {
    const coordinates =
      getCoordinates(options);

    const phone =
      cleanNullable(profile.phone);

    const email =
      cleanNullable(profile.email);

    return {
      user_id: userId,

      status: "pending",

      is_published: false,

      full_name: String(
        profile.fullName || "",
      ).trim(),

      professional_title: String(
        profile.professionalTitle || "",
      ).trim(),

      category: String(
        profile.category || "",
      ).trim(),

      primary_skill: String(
        profile.primarySkill || "",
      ).trim(),

      experience_years: Number(
        profile.experienceYears,
      ),

      service_area: String(
        profile.serviceArea || "",
      ).trim(),

      postcode: cleanNullable(
        profile.postcode,
      ),

      languages: Array.isArray(
        profile.languages,
      )
        ? profile.languages
        : [],

      service_mode: String(
        profile.serviceMode || "",
      ).trim(),

      availability: String(
        profile.availability || "",
      ).trim(),

      pricing: cleanNullable(
        profile.pricing,
      ),

      phone,
      email,

      website: cleanNullable(
        profile.website,
      ),

      bio: String(
        profile.bio || "",
      ).trim(),

      publish_phone: Boolean(
        options &&
          options.publishPhone &&
          phone,
      ),

      publish_email: Boolean(
        options &&
          options.publishEmail &&
          email,
      ),

      approximate_latitude:
        coordinates.latitude,

      approximate_longitude:
        coordinates.longitude,

      public_consent: true,

      public_consent_at:
        new Date().toISOString(),

      privacy_version:
        PRIVACY_VERSION,

      reviewed_at: null,
    };
  }

  async function submitProfile(
    profile,
    options,
  ) {
    if (
      !profile ||
      typeof profile !== "object"
    ) {
      throw new Error(
        "A completed helper profile is required.",
      );
    }

    if (
      !options ||
      options.publicConsent !== true
    ) {
      throw new Error(
        "Please confirm that you want to submit this profile for public review.",
      );
    }

    const session =
      await ensureAnonymousSession();

    const directoryClient =
      getClient();

    const payload =
      createSubmissionPayload(
        profile,
        options,
        session.user.id,
      );

    const { data, error } =
      await directoryClient
        .from("helper_profiles")
        .upsert(payload, {
          onConflict: "user_id",
        })
        .select(
          "id,status,created_at,updated_at",
        )
        .single();

    if (error) {
      throw new Error(
        error.code === "42501"
          ? "This profile cannot be resubmitted in its current review state."
          : "The profile could not be submitted for review. Please try again.",
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "onh:directory-submitted",
        {
          detail: {
            submission: data,
          },
        },
      ),
    );

    return data;
  }

  async function getOwnSubmission() {
    const session =
      await getExistingSession();

    if (
      !session ||
      !session.user
    ) {
      return null;
    }

    const directoryClient =
      getClient();

    const { data, error } =
      await directoryClient
        .from("helper_profiles")
        .select(
          "id,status,created_at,updated_at,reviewed_at",
        )
        .eq(
          "user_id",
          session.user.id,
        )
        .maybeSingle();

    if (error) {
      throw new Error(
        "Your directory submission status could not be loaded.",
      );
    }

    return data || null;
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
    function mapApprovedProfile(
    row,
    location,
  ) {
    const latitude = Number(
      row.approximate_latitude,
    );

    const longitude = Number(
      row.approximate_longitude,
    );

    const hasCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    const hasSearchLocation =
      location &&
      Number.isFinite(
        Number(location.latitude),
      ) &&
      Number.isFinite(
        Number(location.longitude),
      );

    return {
      id: `community-${row.id}`,

      directoryId: row.id,

      name: row.full_name,

      professionalTitle:
        row.professional_title,

      category:
        row.primary_skill ||
        row.category,

      categoryId: row.category,

      primarySkill:
        row.primary_skill,

      experienceYears:
        row.experience_years,

      serviceArea:
        row.service_area,

      languages:
        Array.isArray(row.languages)
          ? row.languages
          : [],

      serviceMode:
        row.service_mode,

      availability:
        row.availability,

      pricing:
        row.pricing ||
        "Discuss directly",

      phone: row.phone || "",

      email: row.email || "",

      website:
        row.website || "",

      bio: row.bio || "",

      latitude:
        hasCoordinates
          ? latitude
          : null,

      longitude:
        hasCoordinates
          ? longitude
          : null,

      distanceKm:
        hasCoordinates &&
        hasSearchLocation
          ? getDistanceKm(
              Number(
                location.latitude,
              ),
              Number(
                location.longitude,
              ),
              latitude,
              longitude,
            )
          : null,

      address:
        row.service_area ||
        "Service area not listed",

      source:
        "Our Nearest Helpers community",

      profileType: "community",

      moderationStatus:
        "approved",

      updatedAt: row.updated_at,
    };
  }

  async function getApprovedProfiles(
    options,
  ) {
    const settings = options || {};

    const directoryClient =
      getClient();

    let query = directoryClient
      .from(
        "approved_helper_profiles",
      )
      .select("*")
      .limit(60);

    const helper = String(
      settings.helper || "",
    ).trim();

    const category = String(
      settings.category || "",
    ).trim();

    if (helper) {
      query = query.ilike(
        "primary_skill",
        `%${helper}%`,
      );
    }

    if (category) {
      query = query.eq(
        "category",
        category,
      );
    }

    const { data, error } =
      await query;

    if (error) {
      throw new Error(
        "Community helper profiles are temporarily unavailable.",
      );
    }

    const location =
      settings.location || null;

    const radiusKm = Math.max(
      0.5,
      Math.min(
        Number(
          settings.radiusKm,
        ) || 25,
        25,
      ),
    );

    return (
      Array.isArray(data)
        ? data
        : []
    )
      .map((row) =>
        mapApprovedProfile(
          row,
          location,
        ),
      )
      .filter(
        (profile) =>
          profile.distanceKm ===
            null ||
          profile.distanceKm <=
            radiusKm,
      )
      .sort(
        (first, second) => {
          if (
            first.distanceKm ===
            null
          ) {
            return 1;
          }

          if (
            second.distanceKm ===
            null
          ) {
            return -1;
          }

          return (
            first.distanceKm -
            second.distanceKm
          );
        },
      );
  }

  async function checkConnection() {
    const directoryClient =
      getClient();

    const { error } =
      await directoryClient
        .from(
          "approved_helper_profiles",
        )
        .select("id")
        .limit(1);

    return !error;
  }

  window.ONH_DIRECTORY =
    Object.freeze({
      submitProfile,
      getOwnSubmission,
      getApprovedProfiles,
      checkConnection,
    });
})();

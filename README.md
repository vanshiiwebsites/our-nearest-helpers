# Our Nearest Helpers

**Repository name:** `our-nearest-helpers`

Our Nearest Helpers is a premium, privacy-first platform for discovering useful nearby skills and services across languages and communities.

## Day 1–3 features

### Helper discovery

- Responsive premium homepage
- Searchable helper categories
- Category filters
- Permission-based browser location
- Manual city, town, or postal-code search
- Interactive OpenStreetMap
- Real nearby public-listing search
- Automatic 2 km → 5 km → 10 km → 25 km radius expansion
- Google Maps directions links
- Available phone and website actions
- Mobile navigation
- Accessible modal and keyboard controls
- Reduced-motion support

### Helper profiles

- Join-as-a-helper profile form
- Professional title and helper-category selection
- Category-based skill suggestions
- Experience and pricing information
- Service area and postal code
- Language selection
- In-person and online service modes
- Availability selection
- Phone, email, and professional-link fields
- Professional introduction
- Live profile preview
- Profile validation and accessible error messages
- Automatic draft saving
- Edit and reset controls
- Selected location can prefill the profile service area
- Profile data remains on the current device

## Repository structure

```text
our-nearest-helpers/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   ├── map.css
    │   ├── profile.css
    │   └── style.css
    ├── icons/
    │   └── favicon.svg
    └── js/
        ├── app.js
        ├── categories.js
        ├── config.js
        ├── location.js
        ├── maps.js
        ├── profile-store.js
        ├── profile.js
        └── search.js
```

## GitHub Pages setup

1. Open the repository on GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch.
5. Select `/ (root)`.
6. Press **Save**.
7. Wait for the latest deployment to complete.

## Day 3 profile storage

The Day 3 helper-profile system uses browser `localStorage`.

This means:

- No account is required.
- Profile information remains on the same browser and device.
- The profile is not uploaded to a public database.
- The profile is not yet searchable by other visitors.
- Clearing browser or website data may remove the saved profile.
- Public accounts, authentication, moderation, and shared profiles require a future backend stage.

## Location privacy

- Browser location is requested only after the visitor chooses to use it.
- Manual location search is always available.
- Exact coordinates are kept only in the current browser session.
- Location is not permanently stored by this version.
- A selected location label may be used to prefill the helper-profile service area.

## Public data services

- Interactive maps use Leaflet and OpenStreetMap.
- Nearby results use public OpenStreetMap listings.
- Manual place search uses Open-Meteo geocoding with GeoNames data.
- Public listings may be incomplete or outdated.
- Public services have fair-use and availability limits.
- Production scaling will require dedicated providers or a backend.

## Safety notice

Visitors should independently verify a helper’s:

- Identity
- Qualifications
- Availability
- Price
- Contact information
- Service suitability

Do not share sensitive personal, financial, medical, identity, or security information through the profile form.

## Day 3 test checklist

- Open the website on GitHub Pages.
- Confirm the homepage and live map load.
- Press **Join as a helper**.
- Confirm the profile form opens.
- Enter profile information and check the live preview.
- Test required-field validation.
- Save a draft and reopen the profile.
- Save the completed profile.
- Refresh the page and confirm the profile remains available.
- Reset the profile and confirm the saved information is removed.
- Select a location and confirm it can prefill the service area.

## Important information

- Do not rename any file or folder.
- Day 1–3 require no private API key.
- GitHub Pages provides the HTTPS required for browser location.
- JavaScript must be enabled for interactive features.
- This is currently a front-end prototype, not a production marketplace.

## Credits

Built as a privacy-first community helper discovery project.

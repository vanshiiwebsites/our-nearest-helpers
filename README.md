# Our Nearest Helpers

**Repository name:** `our-nearest-helpers`

Our Nearest Helpers is a responsive, privacy-first platform for discovering useful nearby skills and services across languages and communities.

## Day 1–4 features

### Helper discovery

- Responsive premium homepage
- Searchable helper categories and category filters
- Permission-based browser location
- Manual city, town, or postal-code search
- Interactive OpenStreetMap
- Real nearby public-listing search
- Automatic 2 km → 5 km → 10 km → 25 km radius expansion
- Google Maps directions links for listings with map coordinates
- Available phone, email, and website actions
- Mobile navigation and accessible modal controls
- Keyboard and reduced-motion support

### Helper profiles

- Join-as-a-helper profile form
- Professional title and helper-category selection
- Category-based skill suggestions
- Experience, pricing, service-area, and language details
- In-person and online service modes
- Availability and professional introduction
- Phone, email, and website contact options
- Website-only profiles are supported
- Live profile preview
- Accessible validation and error messages
- Automatic local draft saving
- Edit and reset controls
- Selected location can prefill the profile service area

### Community directory and moderation

- Optional profile submission to a Supabase-backed directory
- Anonymous browser authentication for submissions
- New submissions remain pending and hidden from public search
- Only approved and published profiles appear through the public directory view
- Approved community profiles are merged with OpenStreetMap results
- Profiles without map coordinates appear as **Online / area only**
- Profiles without coordinates do not receive fake map markers or directions buttons
- Phone and email are submitted only when the helper chooses to publish them
- Website contact can be published independently
- Public directory data excludes private account and precise-location fields

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
        ├── directory-api.js
        ├── directory-ui.js
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

## Day 4 profile storage and publishing

The helper form uses two separate storage stages:

1. **Local draft:** Profile information is saved in the current browser using `localStorage`. Clearing browser or website data may remove it.
2. **Directory submission:** The helper can optionally submit the profile to the moderated Supabase directory.

Submitted profiles are not public immediately. They remain pending until reviewed. A profile becomes searchable only when it is both approved and published.

Directory approval is currently managed through Supabase. This is a moderation foundation for the prototype, not a complete production admin system.

## Contact privacy

- A helper can use a phone number, email address, or website as profile contact.
- Phone and email are uploaded only when their publish options are selected.
- Unselected phone and email values are sent as `null`.
- The public view exposes only contact information approved for publication.
- Visitors should still verify all contact information independently.

## Location privacy

- Browser location is requested only after the visitor chooses to use it.
- Manual location search is always available.
- Exact search coordinates remain in the current browser session.
- A helper may submit rounded approximate coordinates when using a selected map location.
- Missing profile coordinates remain empty and are never converted into a false `0,0` location.
- Profiles without coordinates can still appear as online or area-only listings.
- Private account identifiers and postal codes are not exposed by the public directory view.

## Public data services

- Interactive maps use Leaflet and OpenStreetMap.
- Nearby public listings use OpenStreetMap data.
- Manual place search uses Open-Meteo geocoding with GeoNames data.
- Moderated community profiles use Supabase.
- Public listings may be incomplete or outdated.
- Public services have fair-use and availability limits.
- Production scaling will require dedicated service plans and additional backend controls.

## Safety notice

Visitors should independently verify a helper’s:

- Identity
- Qualifications
- Availability
- Price
- Contact information
- Service suitability

Do not share sensitive personal, financial, medical, identity, or security information through the profile form.

## Day 4 test checklist

- Confirm the homepage, location search, and live map load.
- Search a helper category and verify nearby public listings.
- Open **Join as a helper** and test required-field validation.
- Save, reopen, edit, and reset a local profile draft.
- Confirm phone, email, or website can satisfy the contact requirement.
- Submit a profile and confirm it remains pending before approval.
- Confirm only approved and published profiles appear in public search.
- Confirm unselected phone and email details remain private.
- Confirm a website-only approved profile displays only its website action.
- Confirm a profile without coordinates has no fake marker or directions button.
- Confirm approved community profiles merge with nearby map results.
- Remove test profiles after final verification.

## Important information

- Do not rename project files or folders without updating their references.
- GitHub Pages provides the HTTPS required for browser location.
- JavaScript must be enabled for interactive features.
- The Supabase publishable browser key is public by design; never place a service-role key in client-side files.
- Database Row Level Security and the approved public view protect directory access.
- This remains a prototype and is not yet a production marketplace.

## Credits

Built as a privacy-first community helper discovery project.

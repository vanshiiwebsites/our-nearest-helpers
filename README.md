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

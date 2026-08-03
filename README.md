"# FixMyCity - Ahmedabad

This repository contains a civic issue reporting platform pre-configured for Ahmedabad, India. The app restricts reporting, search, and listings to Ahmedabad boundaries and includes sample data and utilities for local deployment.

Key changes made to scope the project to Ahmedabad:
- Frontend geocoding and search are limited to Ahmedabad.
- Frontend branding and copy reference Ahmedabad.
- Backend validation and list endpoints only accept and return issues within an Ahmedabad bounding box.
- A management command `seed_ahmedabad` seeds departments and example issues in Ahmedabad.

See the frontend and backend README sections for local setup and seeding instructions."

## Frontend Wiring (how components connect)

Overview: the frontend is a small React app (Vite) located in the `frontend` folder. Routing and page-level components are defined in `frontend/src/App.jsx`. The app is pre-configured to work only for Ahmedabad: client-side geocoding is restricted and the backend validates coordinates against a bounding box.

- Routes (`frontend/src/App.jsx`):
	- `/` → Home page (`frontend/src/pages/home.jsx`)
	- `/login` → Login form (`frontend/src/pages/login.jsx`)
	- `/register` → Registration (`frontend/src/pages/register.jsx`)
	- `/submit-issue` → Issue submission (`frontend/src/pages/SubmitIssue.jsx`) — requires login
	- `/issues` → Issue tracking list (`frontend/src/pages/IssueTracking.jsx`) — requires login
	- `/admin` → Admin dashboard (`frontend/src/pages/AdminDashboard.jsx`) — requires login

- Shared components:
	- `frontend/src/components/Navbar.jsx` — top navigation used across pages, contains links and logout helper.

- Services:
	- `frontend/src/services/api.jsx` — Axios instance configured with `baseURL: http://127.0.0.1:8000/api`. It automatically attaches the `token` from `localStorage` as a `Bearer` header.
	- `frontend/src/services/geocoding.jsx` — wraps Nominatim calls. Searches are bounded to Ahmedabad using a rough viewbox and `bounded=1`; reverse lookups return `"Outside Ahmedabad"` when coordinates are outside the city bounding box. The client shows a user-facing error and prevents submitting issues outside Ahmedabad.

- Pages and responsibilities:
	- `home.jsx` — marketing / CTA, links into report flows.
	- `login.jsx` — posts credentials to `/login/`, stores token in `localStorage`, then navigates to `/issues`.
	- `register.jsx` — posts to `/register/` and shows success/failure messages.
	- `SubmitIssue.jsx` — user picks a location (map or search), photo, category and submits a multipart POST to `/issues/` using the `API` service. It uses `geocoding.jsx` for search, reverse lookup and current-location.
	- `IssueTracking.jsx` — fetches `/issues/` and renders list, filters, and status timeline.

Notes on Ahmedabad enforcement:
	- Client: `geocoding.jsx` uses a viewbox to limit search results to Ahmedabad and returns `"Outside Ahmedabad"` for reverse lookups outside the bbox. The submit UI blocks submission when the reverse lookup returns that value.
	- Server: `backend/issues/serializers.py` validates latitude/longitude to fall inside the Ahmedabad bbox; `backend/issues/views.py` filters the list endpoints to only return Ahmedabad issues. This provides defense-in-depth.

## How to run locally

Backend (create virtualenv, migrate, seed, run):

```bash
python -m venv venv
venv\Scripts\activate
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_ahmedabad
python manage.py runserver
```

Frontend (install deps, dev server):

```bash
cd frontend
npm install
npm run dev
```

## Quick verification
- Open the frontend at `http://localhost:5173` (default Vite port) and try:
	- Register, Login (after login you land on `/issues`).
	- Submit an issue using the map or search; ensure the selected location is within Ahmedabad — if outside you will see an error.
	- Seeded sample data is created by `python manage.py seed_ahmedabad` and you can view them on `/issues`.

If you want stricter municipal boundaries (polygon), I can add a GeoJSON polygon check on the backend and a point-in-polygon test on the frontend.

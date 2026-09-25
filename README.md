# FixMyCity — Ahmedabad Civic Intelligence Platform

**FixMyCity** is an AI-powered civic issue reporting and municipal dispatch platform tailored specifically for the city of **Ahmedabad, Gujarat, India**.

It features automated multi-modal defect classification, intelligent topic mismatch detection, physical visual ground-truth severity assessment, least-privilege role-based access control (RBAC), and strict geographic boundary enforcement.

---

## 🏛️ System Architecture

The application consists of three decoupled services running concurrently:

```
┌─────────────────────────────────────────────────────────┐
│              React + Vite Frontend (Port 5173)          │
│          Modern Glassmorphism UI & Ahmedabad Maps        │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────────────┐  ┌───────────────────────────────────┐
│     Django REST Backend       │  │    Flask AI Microservice (5000)   │
│         (Port 8000)           │◄─┤   MobileNetV2 + Scikit-Learn NLP  │
│ RBAC, ORM, SQLite, Auth, REST │  │  Multi-modal Civic Classification │
└───────────────────────────────┘  └───────────────────────────────────┘
```

1. **Frontend (`/frontend`)**: React 18, Vite, Lucide Icons, Leaflet / Nominatim Ahmedabad Geocoding.
2. **Backend (`/backend`)**: Django 4.2 REST Framework with JWT authentication, role-based query scoping, and data validation.
3. **AI Microservice (`/ai_service`)**: Flask, TensorFlow (MobileNetV2), Scikit-Learn NLP, and computer vision defect cavity measurement.

---

## ⚙️ Prerequisites

Before running the project, ensure you have installed:
- **Python 3.9+** (recommended: Python 3.9 – 3.11)
- **Node.js 18+** and **npm**
- **Git**
- *(Optional)* Free **MongoDB Atlas** account for cloud document storage & geospatial indexing

---

## 🚀 How to Run Locally (Step-by-Step)

Follow these steps in order to set up and run the entire platform.

### Step 0: Initial Environment Setup & Dependencies (First Time Only)

Open your terminal in the `fixmycity` root folder:

```bash
# 1. Activate the Python virtual environment
# Windows (PowerShell / Command Prompt):
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# 2. Install AI Microservice & Backend dependencies
pip install -r ai_service/requirements.txt
pip install -r backend/requirements.txt pymongo dnspython python-dotenv

# 3. Install Frontend npm dependencies
cd frontend
npm install
cd ..
```

---

### Step 1: Database Setup & MongoDB Atlas Sync

The platform uses Django ORM for relational authentication with automatic real-time synchronization to **MongoDB Atlas** for civic issues:

```bash
# Activate virtual environment
.venv\Scripts\activate

# Navigate to backend directory
cd backend

# 1. Apply Django database migrations
python manage.py migrate

# 2. Seed Ahmedabad municipal departments and demo accounts
python manage.py seed_ahmedabad

# 3. Synchronize issues and departments to MongoDB Atlas
python manage.py sync_to_mongodb
```
> *(The MongoDB connection is configured via `backend/.env`. A `2dsphere` geospatial index is automatically created on `issues.location`).*

---

### Step 2: Start the 3 Services (Open 3 Separate Terminals)

To run the complete platform, start the three services concurrently:

#### 🟢 Terminal 1: AI Intelligence Microservice (Port 5000)
```bash
cd fixmycity
.venv\Scripts\activate
python ai_service/app.py
```
* **Status:** `http://127.0.0.1:5000/health`
* Handles MobileNetV2 defect cavity calculation, multi-modal topic mismatch detection, and Hinglish NLP.

#### 🔵 Terminal 2: Django REST Backend (Port 8000)
```bash
cd fixmycity/backend
.venv\Scripts\activate
python manage.py runserver 127.0.0.1:8000
```
* **Status:** `http://127.0.0.1:8000/api/departments/`
* **Admin Portal:** `http://127.0.0.1:8000/admin/`
* Handles JWT auth, role queries, Ahmedabad geofencing, and real-time MongoDB mirroring.

#### 🟣 Terminal 3: React + Vite Frontend (Port 5173)
```bash
cd fixmycity/frontend
npm run dev
```
* **Access App:** **`http://localhost:5173`**

---

### Step 3: Open in Browser & Login
Visit **`http://localhost:5173`** in your browser. On the login page (`/login`), you can use the **1-Click Instant Access** buttons or log in manually with the credentials below.

---

## 👥 Default Demo Credentials & Roles

The system strictly enforces **Least-Privilege Role-Based Access Control (RBAC)**:

| Role | Username | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **City Administrator** | `anuj` or `adminuser` | `password123` | Full municipal oversight, cross-department analytics, global issue assignment, department management. |
| **Roads Officer** | `officer_roads` | `password123` | Restricted strictly to the **Roads & Infrastructure Department** queue and status updates. |
| **Water Officer** | `officer_water` | `password123` | Restricted strictly to the **Water Supply & Sewerage Board** queue and status updates. |
| **Citizen** | `citizen1` | `password123` | Can submit issues, track own submitted reports, and edit personal profile. Cannot access internal officer portals. |

*(You can also register a brand new citizen account directly from the `/register` page).*

---

## 🧠 Key Intelligence & Safety Features

### 1. Cross-Field & Cross-Modal Topic Mismatch Protection
- **Cross-Field Conflict**: If a user enters a title about one department (e.g., *"pipe leakage"* $\rightarrow$ Water) and a description about another (e.g., *"big road broken"* $\rightarrow$ Roads), the AI detects the contradiction, sets the category to `NONE`, and flags `is_mismatch = True`.
- **Cross-Modal Conflict**: If the uploaded photo shows roadway damage but the text describes a burst water pipe or hanging electrical wires, the report is flagged as mismatched.
- **Enforcement**: Submissions with detected topic mismatches are blocked on the frontend and rejected by the backend with `HTTP 400 Bad Request`.

### 2. Computer Vision Ground-Truth Severity Override
- Instead of relying solely on exaggerated citizen descriptions (e.g. *"huge crater dangerous emergency"*), the AI measures the physical cavity area of the road surface using computer vision luminance thresholds.
- If physical evidence shows a **small surface cavity** ($< 4.5\%$ defect coverage), the system automatically **downgrades priority to `LOW`** routine maintenance, logging the ground-truth rationale.

### 3. Gibberish & Meaningless Input Rejection
- Blocks keyboard sequence mashing (e.g. `asdfghjk`, `qwertyuiop`), repeated characters (`aaaa`), and non-civic input strings from polluting municipal queues.

### 4. Ahmedabad Geofencing & Bounding Box
- **Client & Server Defense-in-Depth**: Geocoding search and GPS location pins are validated to fall strictly within the Ahmedabad metropolitan bounding box ($22.95^\circ\text{N} - 23.12^\circ\text{N}, 72.45^\circ\text{E} - 72.66^\circ\text{E}$). Reports outside the city boundary are rejected.

---

## 🧪 Running Automated Verification Tests

To verify all worst-case scenarios, fallback handlers, and least-privilege security rules:

```bash
# Activate virtualenv
.venv\Scripts\activate

# 1. Run worst-case topic mismatch and visual ground truth tests:
python scratch/test_worst_cases.py

# 2. Run backend rejection and validation tests:
python scratch/test_django_rejection.py

# 3. Run gibberish, role isolation, and department queue tests:
python scratch/test_unrecognized_and_gibberish.py
```
*(All test suites are configured to run end-to-end against local services).*

# 🏥 RuralCare — Telemedicine for Rural India

> A full-stack telemedical platform bridging the healthcare gap in rural India through AI-powered diagnostics, video consultations, and digital pharmacy access.

![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?logo=tailwindcss)

---

## 📖 About the Project

Healthcare access in rural India is severely limited due to a lack of doctors, diagnostic centers, and accessible pharmacies. **RuralCare** is designed to bridge this gap by bringing essential healthcare services directly to a patient's fingertips through an easy-to-use digital platform.

The system serves three primary users:
1. **Patients:** Can check their symptoms using AI, consult with verified doctors via video calls, digitize and analyze their medical reports, and locate life-saving medicines at nearby pharmacies.
2. **Doctors:** Gain access to rural patients through a streamlined portal where they can manage their schedule and conduct seamless video/audio consultations.
3. **Pharmacists (Medical Shops):** Can digitize their inventory, making it easy for patients within the locality to check medicine availability in real-time.

By combining real-time communication (WebRTC) and advanced Artificial Intelligence (Groq LLM/Vision), RuralCare mimics the full life-cycle of a clinic visit—all from a mobile-friendly web interface.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🩺 **AI Symptom Checker** | Log symptoms and get AI-powered health insights using Groq LLM |
| 👨‍⚕️ **Talk to Doctor** | Book appointments and consult via real-time **WebRTC video/audio calls** |
| 💊 **Find Medicines** | Search medicines and check availability at nearby pharmacies |
| 📁 **Health Records** | Upload medical files to cloud storage + **AI image diagnosis** for reports |
| 📊 **Health Dashboard** | Personalized health score, lab reports, and daily health mandates |
| 🏪 **Pharmacy Admin** | Manage store profile, inventory, and stock levels |

---

## 🛠️ Tech Stack

**Backend:** Python · FastAPI · SQLAlchemy · PostgreSQL (Neon) · WebSocket · aiortc (WebRTC)

**Frontend:** React 18 · TypeScript · Vite · TailwindCSS · shadcn/ui · React Router v7

**AI & Cloud:** Groq API (LLaMA 3.3 + LLaMA 4 Scout Vision) · Cloudinary CDN

---

## 🚀 Quick Start

## 🌍 Deployment URLs

- Live links : https://ruralcare-rust.vercel.app


### Prerequisites
- Python 3.10+ & Pipenv
- Node.js 18+ & npm
- PostgreSQL database (or [Neon](https://neon.tech) account)
- API keys: [Groq](https://console.groq.com), [Cloudinary](https://cloudinary.com)

### Backend Setup
```bash
cd backend
pip install pipenv
pipenv install
# Configure backend/app/config/dev.env with your credentials
pipenv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (proxies API calls to :8000)
```

---

```
                React + Vite
                      │
             REST API / WebSocket
                      │
                FastAPI Backend
                      │
        ┌─────────────┼──────────────┐
        │             │              │
   PostgreSQL     Cloudinary      Groq AI
      (Neon)        Storage      Symptom Analysis

```

## 📂 Project Structure

```
RuralCare/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point + WebSocket endpoints
│   │   ├── models.py            # SQLAlchemy models (7 tables)
│   │   ├── database.py          # DB engine & session setup
│   │   ├── settings.py          # Environment config (Pydantic)
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth_routes.py
│   │   │   ├── doctor_routes.py
│   │   │   ├── patient_routes.py
│   │   │   ├── pharmacist_routes.py
│   │   │   ├── pharmacy_routes.py
│   │   │   └── health_records_routes.py
│   │   ├── services/            # Business logic & external API calls
│   │   └── schemas/             # Pydantic request/response models
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/           # 14 page components
│   │   │   ├── components/      # Layout, Auth, UI (48 shadcn components)
│   │   │   ├── context/         # AuthContext (login state)
│   │   │   └── routes.tsx       # Route definitions
│   │   └── styles/              # CSS + Tailwind + theme
│   └── vite.config.ts           # Dev server proxy config
│
└── README.md
```


## 👥 User Roles

| Role | Access |
|---|---|
| **Patient** | Symptom checker, doctor consultations, health records, medicine search, dashboard |
| **Doctor** | Profile management, appointment handling, video consultations |
| **Pharmacist** | Store profile, inventory management, stock tracking |

---

## 📡 Key API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/auth/signup` | POST | User registration |
| `/auth/login` | POST | User login |
| `/doctors/` | GET/POST | List/create doctors |
| `/doctors/{id}/book-appointment` | POST | Book appointment |
| `/patients/ai/symptom-analysis` | POST | AI symptom analysis |
| `/medicines/` | GET | Search medicines |
| `/pharmacies/availability` | GET | Check medicine stock |
| `/health-records/upload` | POST | Upload medical file |
| `/health-records/analyze` | POST | AI image diagnosis |



---

## Screenshots
<img width="1900" height="912" alt="image" src="https://github.com/user-attachments/assets/08cbf73a-05f2-4a3d-a7fc-c869d4fcfeaf" />
<img width="1900" height="907" alt="image" src="https://github.com/user-attachments/assets/f43d3745-b4d8-4a53-9b52-2772c3a39bfa" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a8f56f78-fb3a-4426-9936-2a235120ab4e" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a93098e5-0f3c-41ff-8207-e17d033a43b5" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b936579d-64d9-438d-b1b3-959322894165" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/64e19033-cfb6-4fb2-803d-68cd78c53595" />




## 📄 License

This project is for educational and demonstration purposes.

---

<p align="center">
  <b>RuralCare</b> — Healthcare Access for Every Rural Area 🇮🇳
</p>

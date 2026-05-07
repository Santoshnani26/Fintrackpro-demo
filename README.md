# FinTrack Pro — AI-Powered Personal Finance Manager

A full-stack, cloud-ready web application with an Agentic AI system for intelligent financial management.

---

## 🗂️ Project Structure

```
fintrack-pro/
├── frontend/        → Next.js 14 + TypeScript + Tailwind CSS
├── backend/         → Node.js + Express.js REST API
├── ai-service/      → Python FastAPI + LangChain AI Agents
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

---

### 1. Clone & Install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# AI Service
cd ../ai-service
pip install -r requirements.txt
```

---

### 2. Environment Variables

**Backend** — create `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/fintrack
JWT_SECRET=your_super_secret_key_here
AI_SERVICE_URL=http://localhost:8000
```

**Frontend** — create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**AI Service** — create `ai-service/.env`:
```
OPENAI_API_KEY=sk-your-openai-key
```

---

### 3. Run All Services

```bash
# Terminal 1 — Frontend (http://localhost:3000)
cd frontend && npm run dev

# Terminal 2 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 3 — AI Service (http://localhost:8000)
cd ai-service && uvicorn main:app --reload
```

---

### 4. Run with Docker (Recommended)

```bash
docker-compose up --build
```

---

## 🧠 AI Agents

| Agent | Trigger | Output |
|---|---|---|
| Expense Analysis | After any transaction CRUD | Spending patterns per category |
| Prediction Agent | On demand / weekly | Forecasted monthly spend |
| Recommendation Agent | Dashboard load | Top 3 saving suggestions |
| Alert Agent | Budget exceeded | Real-time budget alerts |
| Explanation Agent | Any agent output | Plain-English explanations |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js, JWT Auth, Mongoose |
| AI Layer | Python, FastAPI, LangChain, OpenAI GPT-4 |
| Database | MongoDB Atlas |
| Deployment | Vercel (FE), Render (BE+AI), MongoDB Atlas |

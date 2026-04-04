# 🛡️ FinGuard AI — Emergency Financial Preparedness Coach

> Built for the StateFarm Financial Wellness Hackathon Track  
> Stack: **React + Vite** (frontend) · **FastAPI + Python** (backend)

---

## 📁 Project Structure

```
finguard/
├── backend/
│   ├── main.py            # FastAPI app — all routes & logic
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── src/
    │   ├── pages/         # Landing, Onboarding, Dashboard, Chat
    │   ├── components/    # Navbar, ScoreRing
    │   └── utils/api.js   # API calls to backend
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Local Setup

### Prerequisites
- **Python 3.9+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node)

---

### Step 1 — Backend (FastAPI)

```bash
# Navigate to backend folder
cd finguard/backend

# Create a virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

✅ Backend runs at: **http://localhost:8000**  
📖 API docs at: **http://localhost:8000/docs** (Swagger UI)

---

### Step 2 — Frontend (React + Vite)

Open a **new terminal tab**, then:

```bash
# Navigate to frontend folder
cd finguard/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

> The Vite dev server proxies `/api/*` requests to `http://localhost:8000` automatically.

---

## 🧪 Test the App

1. Go to **http://localhost:5173**
2. Click **"Get My Free Assessment"**
3. Complete the 3-step quiz
4. See your personalized risk dashboard
5. Click **"AI Coach"** to ask financial questions

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/analyze` | Analyze user profile → scores + plan |
| POST | `/api/chat` | AI chat response |
| GET | `/api/flood-risk/{zip}` | Flood risk by ZIP |
| GET | `/api/insurance-products` | List all insurance products |

### Example: Analyze Profile
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "income_range": "30k_60k",
    "dependents": 1,
    "housing_type": "rent",
    "zip_code": "77001",
    "employment": "employed",
    "has_savings": false,
    "savings_months": 0
  }'
```

---

## ☁️ Deployment (Cloud)

### Option A: Render.com (free tier, easiest)

**Backend:**
1. Push code to GitHub
2. New Web Service → connect repo → select `backend/` folder
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Frontend:**
1. New Static Site → select `frontend/` folder
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Set env var: `VITE_API_URL=https://your-backend.onrender.com`

### Option B: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway up
```

### Option C: Vercel (frontend) + Railway (backend)

Frontend → Vercel: `vercel --prod` from `frontend/`  
Backend → Railway: connect GitHub repo, set start command

---

## 🔑 Adding Real AI (Claude or OpenAI)

When you're ready to replace mock responses with real AI:

### Claude (Anthropic)
```python
# In backend/main.py, replace mock_ai_chat() with:
import anthropic
client = anthropic.Anthropic(api_key="YOUR_KEY")

def real_ai_chat(message: str, profile) -> str:
    system = "You are a financial wellness coach. Answer in plain English, no jargon."
    msg = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=500,
        system=system,
        messages=[{"role": "user", "content": message}]
    )
    return msg.content[0].text
```

### OpenAI
```python
from openai import OpenAI
client = OpenAI(api_key="YOUR_KEY")

def real_ai_chat(message: str, profile) -> str:
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a financial wellness coach."},
            {"role": "user", "content": message}
        ]
    )
    return res.choices[0].message.content
```

---

## 🛠️ Troubleshooting

**Backend won't start:**
- Make sure Python virtual environment is activated
- Check Python version: `python --version` (needs 3.9+)

**Frontend can't reach backend:**
- Ensure backend is running on port 8000
- Check `vite.config.js` proxy settings

**CORS errors:**
- Backend already has CORS configured for localhost:5173 and localhost:3000
- For production, update `allow_origins` in `main.py`

**Port already in use:**
```bash
# Kill port 8000
lsof -ti:8000 | xargs kill -9
# Kill port 5173
lsof -ti:5173 | xargs kill -9
```

---

## 📜 License

MIT — Built for StateFarm Financial Wellness Hackathon

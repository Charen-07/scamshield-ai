# ScamShield AI

ScamShield AI is an explainable scam-email detector for students, employees,
and everyday email users. Instead of focusing only on bad grammar or obvious
spam wording, it looks for observable social-engineering tactics and risky
requested actions.

## What it detects

ScamShield AI looks for signals such as:

- Urgency pressure
- Authority claims or impersonation
- Credential requests
- Payment or gift-card requests
- Process bypassing and unusual external actions

The app returns a verdict, risk decomposition, evidence spans copied from the
message, the requested action, and a fixed safer next step.

## How it works

```text
User pastes an email
        ↓
React frontend sends it to FastAPI
        ↓
Gemini extracts structured tactic labels and evidence
        ↓
FastAPI validates the evidence and calculates the risk
        ↓
ScamShield AI shows an evidence brief
```

If Gemini is unavailable, the backend uses a local rule-based fallback so the
demo can still return a result.

## Project structure

```text
scamshield-ai/
├── src/
│   ├── main.jsx          # React interface and API connection
│   └── styles.css        # Responsive visual design
├── backend/
│   ├── app/main.py       # FastAPI API and analysis logic
│   ├── index.py          # Vercel FastAPI entry point
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Safe environment-variable template
├── index.html
├── package.json
└── .env.example
```

## Run locally

You need two terminals.

### 1. Start the backend

From the project folder:

```bash
cd backend
python -m venv .venv
```

Activate the environment.

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies and start FastAPI:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend runs at:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### 2. Start the frontend

Open a second terminal in the project folder:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Gemini configuration

Create this private file:

```text
backend/.env
```

Add your own values:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.8-flash
FRONTEND_ORIGIN=http://localhost:5173
```

Never upload `backend/.env` to GitHub. Upload only:

```text
backend/.env.example
```

The frontend does not contain the Gemini key. The key stays in the backend.

## API endpoints

### Health check

```http
GET /api/health
```

### Analyze an email

```http
POST /api/analyze
```

Request body:

```json
{
  "email_text": "Please verify your password within 24 hours.",
  "sender": "security@example.com",
  "subject": "Action required"
}
```

The response includes the verdict, risk level, tactics, evidence, requested
action, safer recommendation, and a simple baseline comparison.

## Deploy with Vercel

This repository contains two deployable parts.

### Frontend project

Import the repository into Vercel with:

```text
Root Directory: .
Framework Preset: Vite
```

Add this frontend environment variable:

```text
VITE_API_BASE_URL=https://your-backend-name.vercel.app
```

### Backend project

Import the same repository again with:

```text
Root Directory: backend
Framework Preset: FastAPI
```

Add these backend environment variables in Vercel:

```text
GEMINI_API_KEY=your_real_key
GEMINI_MODEL=gemini-3.8-flash
FRONTEND_ORIGIN=https://your-frontend-name.vercel.app
```

Redeploy after changing environment variables.

## Privacy and safety

- Do not paste private personal emails into the demo.
- Do not log or commit API keys.
- Email text is not stored by the frontend interface.
- Links and attachments are treated as text; the app does not open them.
- ScamShield AI is a decision-support tool, not a guarantee of safety.

## Current limitations

This hackathon version is a working prototype. It includes Gemini-powered
structured tactic extraction and a local fallback detector. The full research
evaluation is not included yet: no benchmark results, campaign-separated
dataset report, cross-generator experiment, or measured phrase-removal
faithfulness result is claimed here.

Those measurements are planned future work rather than invented results.

## Built with

- React
- Vite
- FastAPI
- Python
- Google Gemini API

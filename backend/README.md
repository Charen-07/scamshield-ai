# ScamShield AI backend

This is a small FastAPI server for the ScamShield AI frontend. It currently
uses Gemini for structured tactic extraction when `GEMINI_API_KEY` is set. If
Gemini is unavailable, it automatically falls back to the deterministic local
rules so the demo still works.

## Run it

From the `backend` folder:

```bash
python -m venv .venv
```

Activate the environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install the packages and start the server:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is then available at `http://localhost:8000`.

For Vercel, set the project Root Directory to `backend`. Vercel uses
`backend/index.py` as the entry point. After the frontend is deployed, add its
public URL to the backend environment variable `FRONTEND_ORIGIN`.

## Endpoints

- `GET /api/health` returns `{ "status": "ok" }`.
- `POST /api/analyze` accepts JSON with `email_text`, `sender`, and `subject`.

Example request:

```json
{
  "email_text": "Please verify your password within 24 hours.",
  "sender": "security@example.com",
  "subject": "Action required"
}
```

The server allows requests from the frontend at `http://localhost:5173`.

`.env.example` lists the environment variable names. The real `backend/.env`
file must never be uploaded to GitHub. Set `GEMINI_MODEL` to `gemini-3.8-flash`
for the current fast model, or use another model available to your API key.

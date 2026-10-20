# ScamShield AI backend

This is a small FastAPI server for the ScamShield AI frontend. It currently
uses a deterministic keyword and rule-based analyzer, so it works without an
LLM key. The analysis function is kept separate in `app/main.py` so a future
LLM extractor can replace it without changing the frontend response shape.

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

`.env.example` lists optional future LLM settings. They are not needed for the
current rule-based fallback.

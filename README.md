# OTUBE AI — YouTube → Study Assistant

OTUBE turns any YouTube video into a study companion with AI-generated summary, key learning points, practice questions, chat Q&A, teaching explanations, and a Mind Map view.

- Frontend: React + Vite (JavaScript + JSX)
- Backend: FastAPI (Python) with Groq LLM and youtube-transcript-api
- Features: Transcript fetch, summary (JSON), key points (JSON), questions, answers, teaching, multilingual, Mind Map

## Live Development

- Frontend: Vite dev server on 5173/5174
- Backend: FastAPI on 3001

Start servers locally (two terminals):

```
# Terminal 1: backend
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 3001

# Terminal 2: frontend
npm install
npm run dev
```

or use the combined script:

```
npm run dev:all
```

Vite proxy is configured so frontend can call `/api/*` to reach `http://localhost:3001`.

## Environment Variables

Backend (in `backend/.env`):
- `GROQ_API_KEY` — required for Groq LLM

Frontend (in `.env`):
- `VITE_API_BASE` — optional. Leave empty to use Vite proxy locally. Set to your deployed backend URL in production (e.g. `https://your-backend.onrender.com`).

## Repository Structure

```
backend/
  main.py                 # FastAPI app with endpoints
  requirements.txt        # Python deps

src/
  App.jsx                 # Main app
  main.jsx                # Vite entry
  index.css               # Styles
  components/
    VideoInput.jsx        # Paste YouTube URL
    VideoSummary.jsx      # Summary + Key Points rendering
    QuestionList.jsx      # Practice questions UI
    ChatInterface.jsx     # Chat Q&A
    LanguageSelector.jsx  # Language picker
    MindMap.jsx           # Mind map side panel
  services/
    ai.js                 # Calls to AI endpoints
    youtube.js            # VideoId extraction + transcript fetch
  utils/
    textFormatting.jsx    # Bold + text formatting helpers
  lib/
    supabase.js           # Placeholder (if used)
  types/
    index.js              # JSDoc typedefs for Video/Question/etc.

index.html                # Loads /src/main.jsx
vite.config.ts            # Dev proxy (/api → 3001)
```

## Backend API (FastAPI)

- `GET /api/health` health check
- `POST /api/transcript/{video_id}` fetch transcript with robust fallbacks
- `POST /api/summary` returns structured JSON summary:
  ```json
  {
    "summary": {
      "title": "...",
      "paragraphs": ["..."],
      "bullets": ["..."],
      "sections": [
        { "heading": "...", "bullets": ["..."], "paragraphs": ["..."] }
      ]
    }
  }
  ```
- `POST /api/keypoints` returns:
  ```json
  {
    "keyPoints": [ { "id": "1", "text": "..." }, ... ]
  }
  ```
- `POST /api/questions` returns 4 JSON questions with id/question/answer/difficulty
- `POST /api/answer` chat-style answer
- `POST /api/teach` expanded explanation
- `POST /api/process-video` takes `{ url, language }` and returns:
  ```json
  {
    "success": true,
    "videoId": "...",
    "transcript": "...",
    "videoInfo": { "title": "...", "thumbnailUrl": "..." },
    "summary": { ... },
    "keyPoints": [ {"id":"1","text":"..."}, ... ]
  }
  ```

Notes:
- Uses `youtube-transcript-api` with multiple fallbacks (languages, generated transcripts, listing) and a safe dummy transcript if all fail.
- Uses Groq `llama-3.3-70b-versatile` with graceful fallback content on rate limits.

## Frontend Features

- Paste YouTube link → process video → show summary, key points, questions
- Chat Q&A about the video
- “Explain in detail” teaching expansion
- Language selector; prompts request responses in the selected language
- Mind Map: button in header opens a side panel visualizing summary and key points
- Markdown-like formatting: bold with `**text**`, sections, bullets, numbers

## Mind Map Usage

1. Paste a video and wait for processing.
2. Click “Mind Map” in the header.
3. A right-side panel opens with a branch-like layout built from summary JSON and key points.

## Deployment

Backend (Render example):
- Root Directory: `backend`
- Runtime: Python 3.11.x (or add `backend/runtime.txt` with `3.11.9`)
- Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port 3001`
- Env: `GROQ_API_KEY`

Frontend (Vercel/Netlify):
- Build: `npm run build`
- Preview/Prod Env: `VITE_API_BASE=https://your-backend.example.com`

## Common Issues

- Vite tries to load `/src/main.tsx`: ensure `index.html` script is `/src/main.jsx`.
- TypeScript non-null `!` in JS: remove it. In `main.jsx`, use `createRoot(document.getElementById('root')).render(...)`.
- 429s from Groq: backend returns graceful fallbacks.
- Thumbnails: using `hqdefault.jpg` for reliability.

## Scripts

- `npm run dev` — start Vite
- `npm run dev:api` — start FastAPI with uvicorn
- `npm run dev:all` — run backend and frontend together
- `npm run build` — Vite build

## Security

- Never commit API keys. Backend reads `GROQ_API_KEY` from env. `.env` files are gitignored.
- History was cleaned to remove past leaked keys.

## License

MIT

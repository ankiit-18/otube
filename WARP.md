# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Starting Development Servers

```bash
# Start both frontend and backend (recommended)
npm run dev:all

# Start frontend only (Vite dev server on port 5173/5174)
npm run dev

# Start backend only (FastAPI on port 3001)
npm run dev:api
# Or manually:
cd backend && python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 3001
```

### Code Quality

```bash
# Lint frontend code
npm run lint

# TypeScript type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Testing
Backend does not currently have automated tests. When testing backend endpoints, use the `/api/health` endpoint to verify the server is running.

## Environment Setup

### Backend Environment Variables
Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend Environment Variables (Optional)
Create `.env` in root:
```
VITE_API_BASE=
```
Leave empty for local development (uses Vite proxy). Set to deployed backend URL for production.

## Architecture Overview

### High-Level Flow
1. **Video Processing Pipeline**: User submits YouTube URL → Backend extracts video ID → Fetches transcript via `youtube-transcript-api` with multiple fallback strategies → Groq LLM generates summary, key points, and questions
2. **Vite Proxy Architecture**: Frontend calls `/api/*` → Vite dev server proxies to `http://localhost:3001` (FastAPI backend)
3. **Language Support**: All AI prompts dynamically inject the selected language, allowing responses in multiple languages

### Backend (`backend/main.py`)
- **Single-file FastAPI application** with all endpoints in one module
- **LLM Provider**: Groq API using `llama-3.3-70b-versatile` model
- **Transcript Fetching Strategy**: 4-level fallback chain:
  1. Direct fetch with `['en']`
  2. Try alternative language codes `['hi', 'en-US', 'en-GB']`
  3. Use `list_transcripts()` approach
  4. Try auto-generated transcripts
  5. Return dummy transcript if all fail (graceful degradation)
- **Error Handling**: All endpoints return fallback content when Groq API fails (e.g., rate limits) to maintain UX
- **JSON Response Parsing**: Endpoints clean markdown code fences from LLM responses before JSON parsing

### Frontend Architecture

**State Management**: All state lives in `App.jsx` (no external state library)

**Key Components**:
- `VideoInput.jsx`: URL input form
- `VideoSummary.jsx`: Renders structured summary JSON (title, paragraphs, bullets, sections)
- `QuestionList.jsx`: Practice questions with difficulty badges
- `ChatInterface.jsx`: Q&A chat with message history (last 6 messages sent to backend for context)
- `MindMap.jsx`: Right-side panel rendering summary/keypoints as visual tree
- `LanguageSelector.jsx`: Dropdown for selecting response language

**Services Layer**:
- `services/ai.js`: All API calls to backend (`/api/summary`, `/api/keypoints`, `/api/questions`, `/api/answer`, `/api/teach`, `/api/process-video`)
- `services/youtube.js`: Video ID extraction (not heavily used; backend does most processing)

**Utilities**:
- `utils/textFormatting.jsx`: Renders `**bold**` text and other markdown-like formatting

### API Endpoints Summary

All endpoints accept JSON and return JSON:

- `GET /api/health` - Health check
- `POST /api/transcript/{video_id}` - Fetch raw transcript
- `POST /api/summary` - Generate structured summary (expects `{ transcript, language }`)
- `POST /api/keypoints` - Extract key points array
- `POST /api/questions` - Generate 4 practice questions with answers
- `POST /api/answer` - Chat-style answer (expects `{ question, video, history, language }`)
- `POST /api/teach` - Expanded teaching explanation
- `POST /api/process-video` - One-shot processing (expects `{ url, language }`)

### Important Architectural Notes

- **No database**: All data is ephemeral (stored in React state). Supabase is imported but not actively used.
- **CORS configuration**: Backend allows `localhost:5173`, `localhost:5174`, and regex pattern for `localhost:517X`
- **Transcript chunking**: Backend limits transcript to 12,000 characters to avoid token limits
- **Frontend uses JSX not TSX**: Despite TypeScript config files, components are `.jsx`. Do not use TypeScript syntax like `!` non-null assertions.
- **Bold text formatting**: Use `**text**` pattern, which is parsed by `textFormatting.jsx`

## Project Context

**Purpose**: OTUBE transforms YouTube videos into interactive study experiences with AI-generated summaries, key points, practice questions, chat Q&A, and mind map visualization.

**Tech Stack**:
- Frontend: React 18 + Vite + Tailwind CSS + Lucide Icons
- Backend: FastAPI + Groq LLM + youtube-transcript-api
- Language: Frontend is JavaScript/JSX (not TypeScript), Backend is Python

## Common Gotchas

- If Vite tries to load `/src/main.tsx` instead of `.jsx`, check `index.html` script tag
- Backend prints `GROQ_API_KEY` to console on startup (line 41 in `main.py`) - this should be removed for security
- Rate limiting from Groq returns fallback content rather than errors to maintain UX
- Manual transcript paste feature exists when auto-fetch fails (`handleManualTranscript` in `App.jsx`)

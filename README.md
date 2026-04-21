MoodBoard
![License](https://img.shields.io/github/license/amanrai05/Mood-Board?style=flat-square)
![Stars](https://img.shields.io/github/stars/amanrai05/Mood-Board?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/amanrai05/Mood-Board?style=flat-square)
Privacy-first mood tracker and daily journal — designed for effortless self-hosting.
Your data, your server, your rules.
---
What is MoodBoard?
MoodBoard is an open-source alternative to apps like Daylio. No ads, no subscriptions, no data mining. Log your mood, journal your thoughts, and track patterns — all from a beautiful web interface you host yourself.
---
Features
Core
Mood Tracking — Log daily mood on a 5-point scale with customizable tags (Sleep, Productivity, etc.)
Rich Journaling — Write notes with full Markdown support
Analytics — Calendar view, mood trends, streaks, and mood distribution stats
Achievements — Gamified milestones to keep you consistent
Privacy First — All data stored in a local SQLite file on your server. No telemetry.
Docker Ready — Up and running in under 5 minutes
🤖 AI Features
AI Mood Insights — Analyzes your journal entries and mood patterns to surface meaningful trends you might miss
Smart Journaling Prompts — Suggests personalized prompts based on your recent entries and mood history
Sentiment Analysis — Automatically detects emotional tone in your journal entries to enrich your mood data
AI Weekly Summary — Generates a weekly digest of your mood, highlights, and patterns in plain language
---
Quick Start (Docker)
> **Note:** MoodBoard runs in single-user mode by default. Enable Google OAuth for multi-user support.
```bash
# 1. Clone the repo
git clone https://github.com/amanrai05/Mood-Board.git
cd Mood-Board

# 2. Create config file
cp .env.docker .env

# 3. Set your secrets (open .env and update SECRET_KEY and JWT_SECRET)
nano .env

# 4. Launch
docker compose up -d
```
App runs at http://localhost:5173
---
Configuration (`.env`)
Backend (API)
Variable	Description
`SECRET_KEY`	Long random string for session security
`JWT_SECRET`	Secret for JWT token signing
`DATABASE_PATH`	Path to SQLite DB (default: `/app/data/moodboard.db`)
`ENABLE_GOOGLE_OAUTH`	`1` to enable, `0` to disable
`CORS_ORIGINS`	Your frontend domain
Frontend (Vite)
Variable	Description
`VITE_API_URL`	Backend URL (local dev only)
`VITE_GOOGLE_CLIENT_ID`	Google OAuth client ID (if enabled)
---
Local Development
Prerequisites: Node.js v18+, Python v3.11+
```bash
# Install frontend deps
npm install

# Setup backend
cd api
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Run both servers
npm run dev        # Frontend at http://localhost:5173
npm run api:dev    # Backend API
```
---
Tech Stack
Layer	Tech
Frontend	React 19 + Vite, served by Nginx
Backend	Flask (Python), JSON API
Database	SQLite with auto-migrations
Auth	JWT + optional Google OAuth
---
API Overview
All protected endpoints require `Authorization: Bearer <jwt>`.
Auth: `POST /api/auth/local/login` · `POST /api/auth/google` · `POST /api/auth/verify`
Moods: `GET/POST /api/mood` · `GET/PUT/DELETE /api/mood/:id` · `GET /api/statistics`
Tags: `GET/POST /api/groups` · `POST /api/groups/:id/options`
Achievements: `GET /api/achievements` · `POST /api/achievements/check`
---
Self-Hosting with TLS
```bash
git clone https://github.com/amanrai05/Mood-Board.git
cd Mood-Board
cp .env.docker .env
# Edit .env with your domain and strong secrets
docker compose -f docker-compose.prod.yml up -d
```
Put TLS certs in `./ssl/` (`fullchain.pem`, `privkey.pem`). Nginx serves on ports 80 and 443.
---
Contributing
PRs welcome! For major changes, open an issue first.
```bash
npm test   # Runs backend tests via pytest
```
---
License
AGPL-3.0

# Exametry 0.01 (Beta)

> AI-powered study management platform for CUET, NEET, JEE, 12th Boards, CET & more.

**Created by Rihan Mirza** — [mirzarihan112@gmail.com](mailto:mirzarihan112@gmail.com)

## Quick Start

1. Open `index.html` in a modern browser (Chrome recommended)
2. Create an account or load sample data
3. Add your API keys in **Settings > Integrations**

No build step required — pure HTML, CSS, JavaScript.

## Features

| Feature | Description |
|---------|------------|
| **Dashboard** | KPI cards, charts, streak tracking, quick actions |
| **Analysis Mode** | Log study sessions, horizontal timeline, analytics with heatmap |
| **Rudius 3.z** | AI mentor chat powered by Groq (voice input supported) |
| **Spekle** | AI quizzes, flashcards & write-mode questions via Cerebras |
| **Tic Tac Toe** | Neon-themed game with minimax AI (3 difficulties) |
| **Settings** | Profile, theme, API keys, data export/import |

## API Key

| Provider | Purpose | Endpoint |
|----------|---------|----------|
| **Groq** | All AI features (Rudius + Spekle) | `https://api.groq.com/openai/v1/chat/completions` |

Enter your key in **Settings > Integrations**. Key is stored locally (obfuscated, never transmitted elsewhere).

## Optional: Python Proxy

For NTA scraping (Research Mode), run the optional Python backend:

```bash
pip install flask requests beautifulsoup4 flask-cors
python server.py
```

## Tech Stack

- HTML5, CSS3 (custom properties, glassmorphism), JavaScript ES6+
- Chart.js for visualizations
- IndexedDB for data persistence
- Web Speech API for voice features
- No frameworks, no build tools

## Data

All data is stored client-side in IndexedDB. Use Settings > Data Management to:
- **Export** all data as JSON backup
- **Import** from a previous backup
- **Load Sample Data** for demo/testing

# Jenny AI
### "AI That Thinks Clearly When You Can't"

Jenny AI is a high-fidelity, multi-agent panic recovery system designed to provide instant, prioritized action plans during emergencies and crises. Built for the modern user, Jenny orchestrates a parallel intelligence network to analyze situations, calm the user, and provide actionable solutions across multiple platforms.

---

## 🚀 Key Features

- **Multi-Agent Orchestration**: Utilizes 7 specialized AI agents (Safety, Situation, Planning, Emotion, etc.) working in parallel for deep situation analysis.
- **Cross-Platform Accessibility**: Seamlessly transition between **Web**, **Telegram**, and **WhatsApp**.
- **Real-Time Recovery Plans**: Generates structured, step-by-step instructions tailored to the user's specific crisis.
- **Smart Fact Extraction**: Automatically detects location, urgency, budget, battery levels, and risk factors from natural conversation.
- **Interactive Emergency Tools**: Integrated deep-links for instant ride-booking (Uber, Ola, Rapido) and one-tap emergency service dialing.
- **Psychological Support**: Dedicated Emotion Agent provides calming techniques and grounding instructions during high-stress moments.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Radix UI + Shadcn/UI
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js + Express
- **AI Core**: Google Gemini 1.5 Flash (Multi-agent orchestration)
- **Messaging**: Telegraf (Telegram) + Twilio (WhatsApp/SMS)
- **Automation**: n8n Workflow Integration

---

## 🏗 Architecture Overview

Jenny uses a **Parallel Agentic Architecture**. When a user reports a crisis, the **Orchestrator** triggers seven specialized agents simultaneously to minimize response latency:

1.  **Emotion Agent**: Calms the user and sets the initial tone.
2.  **Situation Agent**: Extracts facts (Location, Money, Urgency).
3.  **Planning Agent**: Builds a prioritized 3-step action plan.
4.  **Safety Agent**: Identifies nearby safe havens and emergency numbers.
5.  **Cost Agent**: Provides a budget breakdown for transit or resources.
6.  **Communication Agent**: Pre-drafts "Safe" messages for family and friends.
7.  **Conversational Agent**: Refines the final output into a human-centric, supportive response.

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API Key (Free)

### 1. Backend Setup
```bash
cd jenny-backend
npm install
cp .env.example .env  # Fill in your GEMINI_API_KEY
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`/jenny-backend/.env`)
```env
PORT=3001
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash
TELEGRAM_BOT_TOKEN=your_token_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
FRONTEND_URL=http://localhost:5173
```

---

## 📁 Folder Structure

- `frontend/`: High-fidelity React application with animated crisis-handling components.
- `jenny-backend/src/agents/`: Logic for the 7 specialized AI agents.
- `jenny-backend/src/services/`: Integration services for Telegram, WhatsApp, and Gemini.
- `jenny-backend/src/utils/`: Multi-agent orchestrator and session memory.

---

## 🔮 Future Improvements

- **Voice-First Integration**: Hands-free crisis reporting via Phone/Twilio Voice.
- **Location-Aware Dispatch**: Real-time coordination with local first responders via GPS.
- **Offline Mode**: SMS-based recovery plans for areas with low data connectivity.
- **Hero Network**: Connecting users in distress with nearby verified "Jenny Heroes."

---

## 👥 Authors
- **Vamshi Krishna Bandanakanti** — [GitHub](https://github.com/vamshikrishnabandanakanti)

---
**Live Demo**: [jenny-mocha.vercel.app](https://jenny-mocha.vercel.app)

*Built with ❤️ during the Jenny AI Hackathon.*

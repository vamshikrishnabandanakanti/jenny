# Jenny Backend — Gemini Edition
## "AI That Thinks Clearly When You Can't"

Multi-agent AI backend powered by **Google Gemini (Free)**.

---

## QUICK START (3 steps)

### Step 1 — Get your FREE Gemini API Key
1. Go to → https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key" → copy it (looks like AIzaSy...)

### Step 2 — Configure
```bash
# Create your .env file
cp .env.example .env
```
Open `.env` and replace `your_gemini_api_key_here` with your real key.

### Step 3 — Run
```bash
npm install
npm run dev
```
Backend starts at → http://localhost:3001

---

## CONNECT YOUR FRONTEND

Replace the contents of `frontend/src/lib/jenny-api.ts`
with the file `jenny-api-frontend-replace.ts` included here.

That's it. Start your frontend with `npm run dev` and Jenny is live.

---

## API ENDPOINTS

| Method | Endpoint              | Purpose                          |
|--------|-----------------------|----------------------------------|
| POST   | /api/chat             | Send message (initial + follow-up) |
| POST   | /api/analyze          | Alias for /api/chat              |
| GET    | /api/session/:id      | View session context             |
| GET    | /api/health           | Health check                     |

### Request body for /api/chat
```json
{
  "message": "I missed my train at Kacheguda. I have 200 rupees.",
  "sessionId": "optional — omit on first message, include for follow-ups"
}
```

### Response shape (matches your frontend exactly)
```json
{
  "sessionId": "uuid",
  "detectedCategories": ["travel"],
  "agentsActivated": ["Emotion", "Situation", "Planning", "Cost", "Safety", "Communication"],
  "recoveryPlan": "Take a breath. Here's your plan...",
  "urgencyLevel": "high",
  "estimatedResolutionTime": "Next 15–30 minutes",
  "agentResults": [...]
}
```

---

## FOLDER STRUCTURE

```
jenny-backend/
├── src/
│   ├── index.js                    ← Server (port 3001)
│   ├── routes/api.js               ← All endpoints
│   ├── agents/
│   │   ├── emotionAgent.js         ← Detects panic, calms user
│   │   ├── situationAgent.js       ← Extracts location/money/urgency
│   │   ├── planningAgent.js        ← Step-by-step action plan
│   │   ├── costAgent.js            ← Travel cost breakdown (₹)
│   │   ├── safetyAgent.js          ← Safe places + emergency numbers
│   │   ├── communicationAgent.js   ← Pre-filled family/friend messages
│   │   └── conversationalAgent.js  ← Handles follow-up questions
│   ├── utils/
│   │   ├── geminiClient.js         ← Google Gemini API wrapper
│   │   └── orchestrator.js         ← Coordinates all agents
│   └── memory/
│       └── sessionStore.js         ← In-memory conversation history
├── .env.example                    ← Copy this to .env
├── jenny-api-frontend-replace.ts   ← Drop into your frontend
└── package.json
```

---

## HOW IT WORKS

```
User message
     ↓
Orchestrator (detects: initial vs follow-up)
     ↓
Initial message → runs 6 agents IN PARALLEL (fast!)
     │  ├── Emotion Agent     → calm message + urgency level
     │  ├── Situation Agent   → extract location, money, battery
     │  ├── Planning Agent    → step-by-step plan
     │  ├── Cost Agent        → ₹ breakdown for all travel modes
     │  ├── Safety Agent      → nearby safe places + 112/100/108
     │  └── Communication Agent → copy-paste messages for family
     ↓
Follow-up question → Conversational Agent only (uses session memory)
     ↓
Unified JSON response → Frontend renders it
```

---

## GEMINI FREE TIER LIMITS

- 1,500 requests/day
- 1 million tokens/minute
- No credit card required

For a hackathon demo: completely free, no limits hit.

---

## COMMON ERRORS

**"API key not valid"**
→ Check GEMINI_API_KEY in your .env file

**"CORS error" in browser**
→ Make sure backend is running on port 3001

**"Cannot find module"**
→ Run `npm install` again

**Follow-up doesn't remember context**
→ Make sure frontend sends `sessionId` from the first response

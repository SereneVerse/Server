# SereneVerse Server

REST API for the SereneVerse mental health platform.

## Stack
Node.js · Express · MongoDB (Mongoose) · Passport (Google OAuth) · Ably (realtime) · Claude AI (Anthropic)

## Local Setup

```bash
git clone https://github.com/SereneVerse/Server
cd Server
npm install
cp .env.example .env        # fill in all values
npm run dev                 # starts on PORT=3000
```

## Run Tests

```bash
npm test
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Self-registration (role always Patient) |
| `POST /auth/login` | Email/password login |
| `DELETE /auth/sign-out` | Log out |
| `POST /auth/refresh` | Renew access token |
| `POST /auth/password/forgot` | Send OTP to email |
| `POST /auth/confirm-otp` | Verify OTP |
| `PATCH /auth/password/reset` | Reset password |
| `GET /users/` | Admin — list all users |
| `POST /users/admin/create-admin` | Admin — create admin account |
| `POST /users/admin/create-expert` | Admin — invite consultant |
| `POST /streak/start` | Start a new streak |
| `GET /streak/yay/:id` | Read streak (read-only) |
| `POST /streak/checkin/:id` | Check in to increment streak |
| `POST /ai/chat` | AI companion chat (streaming SSE) |
| `GET /ai/thread` | Load AI chat history |
| `GET /ai/summary/:userId` | Consultant session briefing |
| `GET /ai/recommendations` | Personalised resource recommendations |
| `GET /ai/crisis/:userId` | Consultant — view crisis flags |
| `POST /checkins/` | Submit mood check-in |
| `GET /checkins/me` | Own check-in history |
| `GET /checkins/streak/:id/motivation` | Streak with AI motivation message |
| `POST /api/realtime/token` | Issue Ably auth token for client |

## Environment Variables

See `.env.example` for all required variables with descriptions.

## Realtime (Ably)

Socket.IO has been replaced with [Ably](https://ably.com) for Vercel serverless compatibility.

1. Sign up at ably.com and copy your API key into `ABLY_API_KEY`
2. Client calls `POST /api/realtime/token` with Bearer token to get a scoped Ably token
3. Client connects to Ably directly using that token
4. Server publishes events to Ably channels via REST — no persistent connection needed on Vercel

## Cron Jobs (Vercel)

Streak resets run via Vercel Cron at 08:00 UTC daily.
Configure `CRON_SECRET` and set the same value in Vercel dashboard → Settings → Cron Jobs.

## AI Features

Powered by Claude (Anthropic). Set `ANTHROPIC_API_KEY` in your Vercel environment.

- **AI Chat** — 24/7 empathetic support companion (streaming SSE)
- **Crisis Detection** — auto-flags concerning/crisis messages, emails consultant on crisis
- **Mood Check-ins** — AI extracts mood score + themes from free text
- **Streak Motivation** — daily personalised motivational messages (cached per day)
- **Session Summarizer** — 3-bullet briefing for consultants before sessions (cached 1h)
- **Resource Recommendations** — personalised resource picks based on mood history

# ReachInbox Email Scheduler

Production-oriented full-stack assignment implementation using TypeScript, Express, PostgreSQL, Redis/BullMQ, Elasticsearch, Ethereal SMTP and React/Vite.

## Features
- Persistent delayed BullMQ jobs; no cron.
- PostgreSQL source of truth and idempotent `jobId=email:<emailId>`.
- Configurable worker concurrency.
- Configurable minimum send delay.
- Atomic Redis hourly rate counter, safe across worker instances.
- Rate-limit hits reschedule jobs rather than dropping them and notify connected Slack users.
- Elasticsearch indexing/search endpoint.
- Real Google OAuth login.
- Real Slack OAuth connection.
- React dashboard with CSV/TXT lead upload, scheduled/sent views and compose modal.
- Dockerized PostgreSQL, Redis and Elasticsearch.

## Local setup
1. Copy `.env.example` to `.env`.
2. Start infrastructure: `docker compose up -d`.
3. Create an Ethereal account at https://ethereal.email and put SMTP credentials in `.env`.
4. Configure Google OAuth redirect as `http://localhost:4000/auth/google/callback`.
5. Configure Slack OAuth redirect as `http://localhost:4000/auth/slack/callback` and grant `chat:write`.
6. `npm install`.
7. `npm run dev`.

API runs on 4000 and web on 5173.

## Rate limiting design
`MAX_EMAILS_PER_HOUR` is configurable. Workers increment an atomic Redis key per user/hour before sending. If capacity is exhausted, the counter is rolled back, the email returns to `scheduled`, and a new delayed BullMQ job is created for the next hour window. Slack notification is attempted only for users with an OAuth connection. `MIN_SEND_DELAY_MS` is the per-worker provider-throttling delay. Because multiple workers can execute in parallel, the Redis hourly counter is the authoritative distributed limit.

## Restart behavior
Postgres retains email state and Redis retains BullMQ delayed jobs. On worker/API restart, BullMQ restores delayed/waiting jobs from Redis. The worker claims an email with a conditional `scheduled -> processing` DB transition, preventing duplicate sends by concurrent workers. Completed jobs are retained briefly for observability.

## Load behavior
1000+ emails scheduled for one timestamp become persistent delayed jobs. Workers consume them at configured concurrency while Redis rate limiting and the send delay constrain actual SMTP traffic. Excess jobs remain queued or are rescheduled into future windows.

## Production deployment
Deploy the API and worker as a persistent Node service (or two processes from the same image), React as a static site, and use managed PostgreSQL/Redis/Elasticsearch. Set all OAuth redirect URLs and `FRONTEND_URL` to HTTPS production URLs. Do not commit `.env` or OAuth/SMTP secrets. Put the Bull Board UI behind authentication if added.

## Note
The repository is deployment-ready, but actual Google/Slack OAuth, Ethereal credentials, managed DB/Redis/Elasticsearch and GitHub/Vercel/Render/Railway accounts must be supplied by the owner; those credentials cannot be safely fabricated or embedded in the repository.

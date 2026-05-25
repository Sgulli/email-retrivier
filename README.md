# Email Retriever

AI-powered Gmail assistant that lets you **search, read, and download attachments** from your inbox through a conversational chat interface.

Built with [Next.js](https://nextjs.org) (App Router), [CopilotKit](https://copilotkit.ai) for the chat UI, [Mastra](https://mastra.ai) as the AI agent framework, and the [Gmail API](https://developers.google.com/gmail/api).

## Features

- **Natural language email search** — ask "find emails from John about the Q4 report" and get results instantly
- **Read message details** — preview sender, subject, snippet, and full thread info
- **Download attachments** — select any email and download its attachments as a ZIP
- **Read-only by design** — the agent strictly searches and retrieves; no send, delete, or archive
- **OAuth with Google** — secure Gmail access via Better Auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI / Chat | CopilotKit, shadcn/ui, Tailwind CSS |
| AI Agent | Mastra AI |
| Auth | Better Auth + Google OAuth |
| Storage | SQLite (LibSQL) + MinIO (attachments) |
| Language | TypeScript, Effect (functional effects) |

## Prerequisites

- Node.js >= 20
- pnpm
- A Google Cloud project with the Gmail API enabled and OAuth 2.0 credentials
- (Optional) MinIO server for attachment storage

## Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd email-retrivier
   pnpm install
   ```

2. **Configure environment**

   Copy the `.env.example` (or use the existing `.env`) and fill in:

   | Variable | Description |
   |----------|-------------|
   `BETTER_AUTH_SECRET` | Secret for Better Auth (generate with `openssl rand -base64 32`) |
   `BETTER_AUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
   `GOOGLE_CLIENT_ID` | Google OAuth client ID |
   `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
   `GOOGLE_REDIRECT_URI` | OAuth callback (e.g. `http://localhost:3000/api/auth/callback/google`) |
   `ADMIN_EMAIL` | Email address allowed to sign in |
   `MINIO_*` | MinIO connection details (optional — falls back to local storage) |

3. **Run the dev server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000), sign in with your Google account, and start asking about your emails.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Run tests in watch mode |

### Screenshots

```bash
pnpm exec tsx scripts/screenshot.ts
```

Requires Playwright to be installed:

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

Takes desktop (1280×800) and mobile (390×844) screenshots from `http://localhost:3000`. Set `URL` env to change the target.

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, API routes)
│   ├── api/
│   │   ├── auth/     # Better Auth endpoints
│   │   ├── copilotkit/ # CopilotKit runtime proxy
│   │   ├── download/ # Attachment download API
│   │   └── email/    # Email detail API
│   └── auth/sign-in/ # Sign-in page
├── components/       # React components (chat, UI panels, auth)
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities (auth, schemas, ZIP)
└── mastra/           # Mastra AI agent
    ├── agents/       # Email agent definition
    ├── gmail/        # Gmail API client, auth, services
    ├── tools/        # Agent tools (search, download, etc.)
    └── processors/   # Input/output processors
```

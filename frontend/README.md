# SAP HANA Insights Dashboard Frontend

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend base URL (default local backend is `http://localhost:4000`).
3. Install dependencies:

```bash
npm install
```

4. Start dev server:

```bash
npm run dev
```

## Expected Backend Contract

- `GET /api/agents`
- `POST /api/agents/{agentId}/run`
- `GET /api/runs/{runId}`
- `GET /api/runs?agentId=&status=&search=&from=&to=`

If your backend differs, adapt `src/lib/api-client.ts` only.

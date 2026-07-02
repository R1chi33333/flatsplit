# Contributing

Thanks for your interest. This project is small and contributions are welcome.

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Rules

- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`). Releases are cut automatically from commit messages.
- `npm run lint`, `npm run typecheck` and `npm test` must pass before a PR.
- Money is always integer cents. Never introduce floating-point currency arithmetic.
- No emoji anywhere: code, comments, docs, commit messages.
- Never commit real bank statements or real personal data, even in fixtures.

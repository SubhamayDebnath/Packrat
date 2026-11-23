# Packrat

A private, self-hosted link and bookmark library. Next.js 16, TypeScript, MongoDB, Tailwind v4, shadcn/ui, Motion and Zustand.

- The first account you create becomes the **admin**. After that `/register` closes for good.
- The admin adds family or friends from **Settings → Users**. Everyone gets a fully separate library.
- Paste a URL and the title, description and favicon are fetched for you.
- Color-coded groups. Every group is **private** until you switch it to **Public**, which gives it a read-only link.
- Instant search across title, link and group. Results are paginated (10 per page) and the search and page live in the URL, so a reload keeps your place.
- Multi-select, right-click menu, keyboard shortcuts (hover a row to see `Ctrl/⌘ Enter` to open it).
- Deleting a group deletes the links inside it. Settings → Danger zone deletes all your groups and bookmarks, or (for non-admin users) your whole account, each with two confirmations. It only ever touches your own data. The admin account can't be deleted in the app; remove the database and hosting to start over.
- Import and export the standard browser bookmarks HTML file.

## Run it locally

```bash
npm install
cp .env.example .env.local     # then fill in MONGODB_URI and JWT_SECRET
npm run dev
```

Open http://localhost:3000. You land on the sign-up page because no user exists yet.

Generate a secret with `openssl rand -base64 48`.

## Deploy on Vercel + MongoDB Atlas (free tier)

1. Create a free **M0** cluster on MongoDB Atlas. Add a database user, then under **Network Access** allow `0.0.0.0/0` (Vercel's IPs change).
2. Push this folder to a Git repo and import it on Vercel.
3. Add the two environment variables `MONGODB_URI` and `JWT_SECRET`.
4. Deploy. Open the site and create the admin account **right away**, because sign-up stays open until the first account exists.

The app caches one connection per instance, keeps the pool tiny (3, idle sockets closed after 10 s) and uses `attachDatabasePool` from `@vercel/functions`, so idle connections are released before a function is suspended and many instances stay inside the M0 connection limit.

## Adding people

**Settings → Users → Add a person.** Type a password or press the dice to generate one. You then get an activation link and a ready-made invite message to copy. The person must open the link to activate the account before they can sign in. They may set their own password on that page.

There is no email service. You share the activation link and password yourself.

Passwords are changed from **Settings → General → Change password**. If someone forgets theirs, the admin sets a new one from Settings → Users. There is no email reset.

## Security

| Area                 | What it does                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessions             | JWT (HS256) in an `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie, 7 days.                                                                     |
| Revocation           | Each request re-checks the user. Deleting a user, or changing a password, signs them out at once.                                                       |
| Passwords            | bcrypt, cost 12. 8 to 72 characters with a letter and a number.                                                                                         |
| Brute force          | Mongo-backed rate limits on login, sign-up and activation (works across serverless instances).                                                          |
| Timing               | Unknown emails cost the same as wrong passwords, so accounts cannot be enumerated.                                                                      |
| CSRF                 | SameSite cookies plus a same-origin check on every write.                                                                                               |
| Admin                | The database enforces a single admin (unique partial index), so the first-user race is safe.                                                            |
| Link previews (SSRF) | Only http(s). Private, loopback, link-local and cloud-metadata addresses are blocked at connect time on every redirect hop. Size and time limits apply. |
| Favicons             | Stored in MongoDB and served from your own origin, so the browser never contacts third-party sites. SVG icons are skipped.                              |
| Headers              | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, strict referrer and permissions policies.                                                                |
| Validation           | Every input is checked with Zod on the server.                                                                                                          |

## Project layout

```
app/
  (auth)/login, register, activate   Auth pages
  (app)/page.tsx                     Home (server-loaded, hydrates the store)
  s/[shareId]/                       Public read-only group
  api/                               Route handlers
  not-found.tsx, error.tsx
proxy.ts                             Optimistic auth gate (Next 16 name for middleware)
components/
  ui/                                shadcn primitives
  layout/  bookmarks/  dialogs/  settings/  auth/
hooks/                               Shortcuts, platform, bookmark actions
stores/                              Zustand: app (per request), ui, theme
lib/
  server/                            db, models, auth, metadata fetcher
  validators.ts, netscape.ts, ...    Shared helpers
```

## Scripts

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run format`

## Notes

- Next 16 renamed `middleware` to `proxy`. `cacheComponents` is switched off because every page here is per-user and dynamic.
- Fonts come from the `geist` package, so there is no request to Google Fonts at build or run time.

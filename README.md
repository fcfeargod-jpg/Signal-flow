# Signal Flow — Church Media Signal Flow Manager

A responsive church-media workspace for documenting audio/video equipment, building signal diagrams, and saving service configurations.

## What's included

- Dashboard with setup and equipment overview
- Audio and video signal-flow builder powered by React Flow
- Add, connect, move, and delete equipment nodes
- Separate audio/video node styling and connection colors
- Equipment inventory with model, connection type, location, and notes
- Saved service setups with reusable diagrams
- Supabase email/password authentication and cloud database
- GitHub Actions deployment to GitHub Pages

## 1. Create and configure Supabase

1. Create a project at [https://supabase.com](https://supabase.com).
2. Open **SQL Editor**, create a new query, paste all of `supabase/schema.sql`, and run it.
3. Open **Project Settings → API** (or **Data API**) and copy:
   - Project URL
   - anon / publishable key
4. In your GitHub repository, open **Settings → Secrets and variables → Actions**.
5. Add two repository secrets:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon / publishable key

Use only the public anon/publishable key in the frontend. **Never put a Supabase service-role key in this project or in GitHub Pages.** Row Level Security is enabled in the supplied schema.

## 2. Upload this project to GitHub

Upload the contents of this ZIP into the root of your repository. The `.github` and `supabase` folders must remain in the root.

Your repository should contain at least:

```text
.github/workflows/deploy.yml
src/
supabase/schema.sql
index.html
package.json
vite.config.js
```

The workflow is configured for the `main` branch. If your default branch has another name, change `branches: [main]` in `.github/workflows/deploy.yml`.

## 3. Enable GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push/commit the files to `main`.
4. Open the **Actions** tab and wait for **Deploy Signal Flow to GitHub Pages** to finish.
5. Your published URL will appear in the deployment job.

## 4. Run locally (optional)

Install Node.js 20 or newer, then run:

```bash
npm install
cp .env.example .env.local
```

Put your Supabase URL and anon key in `.env.local`, then:

```bash
npm run dev
```

## Important notes

- GitHub Pages hosts the frontend; Supabase provides authentication and cloud database storage.
- A user must sign up/sign in before cloud data can be saved.
- If Supabase credentials are not configured, the app opens in **Preview mode** and saves data in that browser only. This lets you explore the interface before connecting the database.
- For a private church team, create an account for each team member. Current database policies keep each user's data private to that account. Shared team workspaces and roles are a future enhancement; do not share one account password among team members.
- GitHub Pages is a static host. Do not add server secrets or service-role keys to frontend environment variables.

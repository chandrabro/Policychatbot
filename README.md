# Policy Assistant

An internal chat tool: your team asks a question in plain English, and it
answers using only the facts in your company's policy PDFs — with the exact
page cited and a link that jumps straight to it.

**Built for $0 with no credit card, and nothing to install.** Reading PDFs,
splitting them into sections, and turning them into searchable "embeddings"
all happens for free inside the browser (yours, when you add policies; your
team's, when they ask questions). The only external service called is
Google's Gemini API for writing the final answer in plain English — that
tier is free and does not require billing.

## How it's built (and why)

- **A free AI model runs in the browser** (via WebAssembly, downloaded from
  a CDN — nothing to install) to turn policy text into "embeddings" —
  numbers that capture meaning, so the app can find the most relevant
  section of the most relevant policy for any question. Same approach for
  turning a user's question into an embedding to search with.
- **Vercel Blob** stores the original PDFs (for page-linking) and one small
  JSON file holding all the embeddings — this stands in for a full vector
  database, which isn't needed at the scale of ~30 documents.
- **Gemini's plain text API** (not the paid File Search product) writes the
  final answer from whatever text the browser already found. This tier is
  free with no card on file.
- **No upload/delete route reachable by regular users.** The chat page only
  ever sends a question; there is no button, endpoint, or hidden feature
  that lets someone using the chat add, change, or remove a document.
- **A separate `/admin` page** is the only place documents can be added,
  protected by its own password (different from the one your team uses).

## One-time setup — entirely in your browser, no installs

### 1. Get a free Gemini API key

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey),
sign in with a Google account, and create a key. No credit card involved —
this is Gemini's free tier for generating text.

### 2. Put the code on GitHub (no git required)

1. Unzip the project you were given.
2. Go to [github.com/new](https://github.com/new), create a new **private**
   repository (name it anything, e.g. `policy-assistant`), and leave
   everything else default.
3. On the new empty repo's page, click **"uploading an existing file"**.
4. Drag the *contents* of the unzipped folder into the browser (all the
   files and folders at once) and commit. GitHub handles the rest — no
   terminal, no git.

### 3. Import it into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (you can use
   your GitHub account to sign up — still no credit card required for the
   free "Hobby" plan).
2. Import the repository you just created. Vercel auto-detects it's a
   Next.js app — no settings to change.
3. **Before clicking Deploy**, add these environment variables (there's a
   section for this right on the import screen, or you can add them after
   in Settings → Environment Variables):
   - `GEMINI_API_KEY` — from step 1
   - `APP_PASSWORD` — whatever password your team should use for the chat
   - `ADMIN_PASSWORD` — a different password, just for adding policies
   - `COOKIE_SECRET` — any long random string (mash your keyboard, or use
     an online random string generator — it just needs to be unpredictable)
4. Click **Deploy**.

### 4. Connect Blob storage (a few clicks, no card)

1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database → Blob**, give it any name, create it.
3. That's it — Vercel automatically wires up the access token for you.
   Nothing to copy or paste.
4. Redeploy once (Deployments tab → ⋯ on the latest one → Redeploy) so the
   app picks up the new storage connection.

### 5. Add your policies — from your browser, on the live site

1. Visit `your-app.vercel.app/admin`.
2. Enter the `ADMIN_PASSWORD` you set earlier.
3. Drag in all 30 PDFs (or however many you have) — you can select them all
   at once.
4. Click **"Index"**. Watch the per-file status: each one gets read, split
   into sections, turned into embeddings, and saved — right there in your
   browser tab. The very first file will pause for a bit while a small
   (~90MB) free AI model downloads; after that it's cached in your browser
   and every file after (and every future visit) is fast.
5. Once every file shows "done," you're finished. Visit the homepage and
   start asking questions.

## Updating policies later

Just go back to `/admin` and re-upload the changed PDF with the exact same
filename — it automatically replaces the old version's entries in the
search index rather than duplicating them.

## Honest limitations

- **The password gates are basic** — shared passwords, not individual
  logins with different permission levels per person. Fine for "keep this
  off the open internet," not a substitute for real per-person access
  control if some policies need to be restricted by role.
- **Retrieval quality depends on chunking** — this splits text into
  ~150-word overlapping sections per page. Works well for normal paragraph
  text; very table-heavy or bullet-only pages may retrieve slightly less
  precisely. Worth spot-checking a few real questions after your first
  index run.
- **No dedicated vector database** — for ~30 documents this in-memory
  search is plenty fast, but it re-scans every stored section on every
  question. If you ever grow to hundreds of documents, you'd want to
  switch to a real vector database at that point.
- **Model name may drift** — `GEMINI_MODEL` defaults to `gemini-3.8-flash`.
  If Google renames or retires it, check
  [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
  and set the env var to whatever's current.
- **"Free" depends on Google's and Vercel's policies staying as they are**
  today — both companies could change free-tier terms in the future. As of
  now, neither the Gemini free text-generation tier nor Vercel's Hobby plan
  with Blob storage requires a credit card.

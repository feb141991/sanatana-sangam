# 🕉️ Sanatana Sangam — Deployment Guide

## Step 1 — Set up Supabase (10 minutes, free)

1. Go to https://supabase.com and create a free account
2. Click **New Project** → name it `sanatana-sangam` → set a strong DB password
3. Wait ~2 minutes for your project to provision
4. Go to **SQL Editor** → click **New Query**
5. Copy the entire contents of `supabase/schema.sql` and paste it → click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon / public key**

---

## Step 2 — Configure Environment (2 minutes)

In your project folder, copy the example file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

---

## Step 3 — Install & Run Locally (5 minutes)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see the landing page!

---

## Step 4 — Deploy to Vercel (5 minutes, free)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial Sanatana Sangam build"
   git remote add origin https://github.com/YOUR_USERNAME/sanatana-sangam.git
   git push -u origin main
   ```

2. Go to https://vercel.com → **New Project** → Import your GitHub repo

3. Add your environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Click **Deploy** — your app will be live at `https://sanatana-sangam.vercel.app` in ~2 minutes!

---

## Step 5 — Enable PWA Icons (optional but recommended)

Create placeholder icons at:
- `public/icons/icon-192.png` (192×192px — your logo on saffron background)
- `public/icons/icon-512.png` (512×512px — same logo, larger)

You can create these free at https://realfavicongenerator.net

---

## What's Built (Phase 1)

| Feature | Status |
|---|---|
| Landing page | ✅ Done |
| Sign up with Dharmic Identity (3-step) | ✅ Done |
| Sign in | ✅ Done |
| Mandali (local community feed) | ✅ Done |
| Post to Mandali (updates, events, questions) | ✅ Done |
| Vichaar Sabha (forums with categories) | ✅ Done |
| Thread detail with replies | ✅ Done |
| User profile with seva score | ✅ Done |
| PWA (Add to Home Screen on Android) | ✅ Done |
| Bottom navigation | ✅ Done |

## Coming Next (Phase 2)

- Tirtha Map — mandir finder with Leaflet + OpenStreetMap
- Parampara Library — texts, mantras, daily shloka
- Daily panchang (tithi, rahu kaal, muhurat)
- Push notifications via OneSignal

## Coming Phase 3

- Aarti Together — live synchronised aarti
- Bhajan Baithak — live audio rooms
- Pandit marketplace

---

## Total Monthly Cost: £0
- Vercel free tier ✅
- Supabase free tier ✅
- OpenStreetMap (Phase 2) — free forever ✅
- OneSignal (Phase 2) — free tier ✅

*Domain name (~£10/yr from Namecheap) is the only optional cost.*

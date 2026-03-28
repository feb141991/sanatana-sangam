# 🚀 Sanatana Sangam — Vercel Deployment Guide

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial Sanatana Sangam launch"
git remote add origin https://github.com/YOUR_USERNAME/sanatana-sangam.git
git push -u origin main
```

---

## Step 2 — Deploy on Vercel (free)

1. Go to https://vercel.com → **Add New Project**
2. Import your GitHub repo `sanatana-sangam`
3. Framework: **Next.js** (auto-detected)
4. Root Directory: leave as `/` (default)
5. Add these **Environment Variables** before clicking Deploy:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Your OneSignal App ID |

6. Click **Deploy** — live in ~2 minutes!

Your URL will be: `https://sanatana-sangam.vercel.app`

---

## Step 3 — Update Supabase for Production (IMPORTANT)

Without this, signup/login will break on Vercel.

### 3a — Add Redirect URLs
Go to: **Supabase → Authentication → URL Configuration**

Add these to **Redirect URLs**:
```
https://sanatana-sangam.vercel.app/**
https://sanatana-sangam.vercel.app/mandali
http://localhost:3000/**
http://localhost:3001/**
```

### 3b — Set Site URL
In the same page, set **Site URL** to:
```
https://sanatana-sangam.vercel.app
```

### 3c — Enable Email Auth
Go to: **Supabase → Authentication → Providers → Email**
- ✅ Enable email provider
- ✅ Confirm email (optional — disable for faster testing)

---

## Step 4 — Update OneSignal for Production

Go to: **OneSignal → Your App → Settings → Web Configuration**

Change **Site URL** from:
```
http://localhost:3001
```
to:
```
https://sanatana-sangam.vercel.app
```

---

## Step 5 — Custom Domain (optional, ~£10/yr)

In Vercel → Your Project → Settings → Domains → Add Domain:
```
sanatanasangam.com
```
Vercel gives you the DNS records to add at your domain registrar (Namecheap etc.)

---

## Guest Access Summary

| Page | Guest | Signed In |
|---|---|---|
| `/` Landing page | ✅ Full access | ✅ Full access |
| `/tirtha-map` | ✅ Browse temples | ✅ Browse temples |
| `/vichaar-sabha` | ✅ Read threads | ✅ Read + post |
| `/mandali` | ❌ Redirects to signup | ✅ Full community feed |
| `/profile` | ❌ Redirects to signup | ✅ Full profile |

---

## Signup / Login Flow (Production)

1. User visits `/signup` → fills 3-step Dharmic Identity form
2. Supabase creates account + sends confirmation email
3. User clicks email link → redirected to `/mandali`
4. DB trigger auto-assigns them to their city's Mandali

> **To skip email confirmation during testing:**
> Supabase → Authentication → Providers → Email → Disable "Confirm email"

---

## Checklist before going live

- [ ] Schema SQL run in Supabase (`schema.sql`)
- [ ] Auto-assign SQL run (`mandali-auto-assign.sql`)
- [ ] Supabase Site URL updated to Vercel URL
- [ ] Supabase Redirect URLs added
- [ ] All 3 env vars added in Vercel dashboard
- [ ] OneSignal Site URL updated to Vercel URL
- [ ] Test signup → email received → login works
- [ ] Test Tirtha Map loads temples (no auth needed)
- [ ] Test Vichaar Sabha readable as guest

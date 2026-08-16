# Google Cloud Platform (GCP Cloud Run) Setup & Migration Guide

This repository is fully configured for automated deployment to **Google Cloud Run** using Next.js `standalone` mode and multi-stage Docker builds.

---

## 1. What Has Been Prepared in Codebase

- **`next.config.js`**: `output: 'standalone'` added.
- **`Dockerfile`**: Multi-stage production image (<140MB) running Node 20 on Alpine.
- **`.dockerignore`**: Optimizes build speeds by ignoring local artifacts & dev scripts.
- **`.github/workflows/deploy-gcp.yml`**: GitHub Actions workflow for automatic CI/CD deployment on `git push origin main`.
- **`scripts/deploy-gcp.sh`**: 1-command deployment script using `gcloud` CLI.

---

## 2. Option A: Connecting GitHub Directly to GCP Cloud Run (Recommended — No CLI Needed)

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud Project (e.g. `shoonaya-production`).
3. Go to **Cloud Run** and click **Create Service**.
4. Select **"Continuously deploy from a repository"** and click **Set Up with Cloud Build**.
5. Select **GitHub** as Provider and authorize access to your repository `sanatana-sangam`.
6. Set:
   - **Branch**: `^main$`
   - **Build Type**: `Dockerfile`
   - **Dockerfile Location**: `/Dockerfile`
7. In Service Settings:
   - **Service Name**: `shoonaya-app`
   - **Region**: `us-central1` (or your preferred region)
   - **Authentication**: Select *"Allow unauthenticated invocations"* (public web app).
   - **Container Port**: `3000`
   - **Request Timeout**: `300` seconds (allows long festival materialization crons without timing out).
   - **Autoscaling**: Min `0` instances (scales to 0 cost when idle), Max `10` instances.
8. Add Environment Variables (see Section 3 below).
9. Click **Create**. Every future `git push` to `main` will automatically build & deploy!

---

## 3. Environment Variables to Set in Cloud Run

Under **Cloud Run → Edit & Deploy New Revision → Variables & Secrets**, add the following keys from your `.env.local` / Vercel settings:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Service-Role Key (Use GCP Secret Manager for extra security) |
| `ADMIN_USERNAME` | Admin panel login username |
| `ADMIN_PASSWORD` | Admin panel login password |
| `ADMIN_SECRET` | 32+ character HMAC secret string for admin cookies |
| `NODE_ENV` | `production` |

---

## 4. Connecting Your Custom Domain (`www.shoonaya.com`)

1. In GCP Cloud Run, click **Custom Domains** tab in the top navigation bar.
2. Click **Add Mapping** → Select `shoonaya-app`.
3. Enter `www.shoonaya.com` (and `shoonaya.com`).
4. GCP will provide standard DNS `CNAME` and `A` records.
5. Update your domain DNS settings (GoDaddy/Namecheap/Cloudflare) with these records. GCP will automatically issue a free Google-managed SSL certificate.

---

## 5. Option B: Deploying via GitHub Actions (`.github/workflows/deploy-gcp.yml`)

If you prefer using GitHub Actions:
1. Create a Service Account in GCP with `Cloud Run Admin` and `Storage Admin` roles.
2. Create a JSON key for the Service Account.
3. In GitHub Repository → **Settings → Secrets and variables → Actions**, add:
   - `GCP_PROJECT_ID`: Your GCP Project ID
   - `GCP_SA_KEY`: The full JSON key content of your service account.
4. Pushing to `main` will trigger `.github/workflows/deploy-gcp.yml`.

---

## 6. Option C: Manual CLI Deployment

If you want to deploy from your computer using `gcloud`:
```bash
# Login to GCP
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID

# Run deployment script
GCP_PROJECT_ID=your-gcp-project-id ./scripts/deploy-gcp.sh
```

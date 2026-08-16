#!/usr/bin/env bash
# Script to build and deploy Shoonaya to Google Cloud Run
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${GCP_SERVICE_NAME:-shoonaya-app}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: GCP_PROJECT_ID environment variable is not set."
  echo "Usage: GCP_PROJECT_ID=your-project-id ./scripts/deploy-gcp.sh"
  exit 1
fi

echo "🚀 Submitting container build to Google Cloud Build..."
gcloud builds submit --project="$PROJECT_ID" --tag="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" .

echo "📦 Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=1 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300

echo "✅ Successfully deployed $SERVICE_NAME to Google Cloud Run!"

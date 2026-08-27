CORS setup for Firebase Storage

1. Create `cors.json` (already provided in repo root) and review origins. Replace `https://your-production-domain.com` with your real domain.

2. Install Google Cloud SDK (Windows)

- Download and run the installer: https://cloud.google.com/sdk/docs/install#windows
- During install, allow adding `gcloud` to PATH.

3. Authenticate and enable tools
   Open PowerShell and run:

```powershell
# Login to Google account
gcloud auth login

# (Optional) set project if you have multiple
gcloud config set project imam-travel-website
```

4. Apply the CORS policy using gsutil

```powershell
# Apply cors.json to your storage bucket (use exact bucket name from firebase-config.js)
gsutil cors set cors.json gs://imam-travel-website.firebasestorage.app

# Verify the CORS policy
gsutil cors get gs://imam-travel-website.firebasestorage.app
```

5. Wait ~1 minute, then hard-refresh the site (CTRL+F5) and retry uploads.

Troubleshooting

- If `gsutil` is not found, ensure Cloud SDK installation added it to PATH or open the Cloud SDK Shell from Start Menu.
- If authentication issues occur, run `gcloud auth login` again and follow the browser prompts.
- If uploads still fail, check the bucket name in `firebase-config.js` and the Firebase Console Storage rules.

Security note

- Don't leave `"origin": ["*"]` in production. Use explicit origins only.

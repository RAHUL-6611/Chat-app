# Deployment Guide: Railway (Free Trial)

This guide outlines how to deploy the Chat App to [Railway](https://railway.app/). We will use the existing `Dockerfile` which builds both the frontend and backend into a single container.

## Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
2.  **Railway Account**: Sign up at [railway.app](https://railway.app/).
3.  **MongoDB Atlas**: A production-ready MongoDB database. (Railway's default Mongo plugin is good for dev but expensive for long-term/high-usage).

## 1. Prepare Your Code

We have already updated the following to be production-ready:
- **`backend/src/index.js`**: Fixed environment path handling and wildcard routing.
- **`frontend/src/api/api.js`**: Updated to use relative API paths in production automatically.
- **`Dockerfile`**: Configured for multi-stage build.

Ensure you push these changes:
```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

## 2. Deploy on Railway

1.  **New Project**:
    -   Log in to Railway.
    -   Click **+ New Project** > **Deploy from GitHub repo**.
    -   Select your repository.
    -   Click **Deploy Now**.

2.  **Configure Environment Variables**:
    -   Go to the **Variables** tab in your Railway project dashboard.
    -   Add the following variables (copy values from your local `.env` or `.env.production.example`):

    | Variable | Value Description |
    | :--- | :--- |
    | `NODE_ENV` | `production` |
    | `MONGODB_URI` | Your MongoDB Connection String (e.g., from Atlas) |
    | `JWT_SECRET` | A long random string for security |
    | `OPEN_ROUTER` | Your OpenRouter API Key |
    | `VITE_API_URL` | Set to `/` (this ensures frontend talks to the backend on the same domain) |

    *Note: `PORT` is automatically set by Railway and injected into the container.*

3.  **Verify Settings**:
    -   Go to **Settings** > **Service**.
    -   Ensure **Root Directory** is `/` (default).
    -   Railway should automatically detect the `Dockerfile` in the root.

## 3. Post-Deployment

1.  **Wait for Build**: Railway will build your container (this may take 3-5 minutes as it builds the frontend and installs backend deps).
2.  **Public URL**: Railway will generate a public domain (e.g., `web-production-xxxx.up.railway.app`).
    -   Click the link to open your app.
3.  **Health Check**:
    -   Visit `/health` (if implemented) or just ensure the Chat UI loads.
    -   The backend logs (in Railway Deployments tab) should show "Server running in production mode...".

## Troubleshooting

-   **Frontend connection failed?**
    -   Check the browser console. If it tries to reach `localhost:5001`, ensure `VITE_API_URL` is set to `/` in Railway variables.
-   **Database connection error?**
    -   Check `Variables` to ensure `MONGODB_URI` is correct and your Atlas IP Whitelist allows "All IPs" (`0.0.0.0/0`) since Railway IPs change.

## Alternative: Render.com (Free Tier)

If you prefer a simpler free tier:
1.  Create a **Web Service** on Render.
2.  Connect GitHub repo.
3.  Select `Docker` as the environment.
4.  Add the same Environment Variables.
5.  Render's free tier spins down after inactivity (slow initial request).

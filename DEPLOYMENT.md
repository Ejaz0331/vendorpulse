# VendorPulse - Production Deployment Guide

This guide walks you through deploying the VendorPulse MERN stack application to production.

---

## 🚀 Pre-Deployment Verification

All bugs, hardcoded localhost URLs, Express 5 routing conflicts, and database ID race conditions have been resolved. The project is verified and ready for deployment.

### Quick Commands (Local Testing)
```bash
# Build frontend for production
npm run build --prefix frontend

# Run backend smoke & production readiness tests
npm test --prefix backend

# Seed initial demo suppliers, POs, and KPI data (optional)
npm run seed --prefix backend
```

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Create a new **Free Shared Cluster (M0)**.
3. Under **Database Access**, create a database user:
   - Choose **Password** authentication (e.g., username `vendorpulse_admin`, strong password).
   - Set privileges to **Read and write to any database**.
4. Under **Network Access**, click **Add IP Address**:
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so cloud servers (Render, Railway, Vercel) can connect.
5. Under **Clusters**, click **Connect** -> **Drivers** -> **Node.js**:
   - Copy your connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.mongodb.net/supplier_platform?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your credentials.

---

## 🌐 Option 1: Unified Deployment on Render (Recommended)

In this setup, your Express backend serves both the API and the pre-built React frontend. This eliminates CORS issues and requires only **one single free service**.

### Steps:
1. Push your repository to **GitHub** or **GitLab**.
2. Go to [Render.com](https://render.com) and log in.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `vendorpulse`
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore).
   - **Branch**: `main`
   - **Root Directory**: Leave blank (uses repository root).
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster0.mongodb.net/supplier_platform?retryWrites=true&w=majority`
7. Click **Deploy Web Service**.
8. Render will install dependencies, build the Vite frontend, start the server, and verify the `/api/health` check.
9. Visit your live Render URL (e.g., `https://vendorpulse.onrender.com`)!

---

## ⚡ Option 2: Separate Deployment (Frontend on Vercel, Backend on Render)

If you prefer deploying the frontend to Vercel's global CDN and backend to Render:

### Part A: Deploy Backend to Render
1. Follow Option 1 above, but set:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
2. Environment Variables on Render:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `CLIENT_URL` = `*` (or your future Vercel domain)
3. Copy your backend URL (e.g., `https://vendorpulse-api.onrender.com`).

### Part B: Deploy Frontend to Vercel
1. Go to [Vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite`.
   - **Build Command**: `vite build` (default).
   - **Output Directory**: `dist` (default).
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://vendorpulse-api.onrender.com` *(your Render backend URL)*
5. Click **Deploy**.
6. SPA page refreshes are handled automatically by `frontend/vercel.json`.

---

## 🐳 Option 3: Docker & Docker Compose Deployment

To deploy anywhere using Docker (VPS, AWS EC2, DigitalOcean Droplet):

```bash
# Clone the repository on your server
git clone <repo-url>
cd <repo-folder>

# Start fullstack app and local MongoDB container
docker compose up -d --build
```
The application will be live at `http://localhost:5000` (or `http://your-server-ip:5000`).

---

## 🔑 Default Login Credentials

The server automatically initializes default user accounts upon database connection:

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `password123` |
| **Manager** | `manager` | `password123` |
| **Staff** | `staff` | `password123` |
| **Management** | `management` | `password123` |

---

## 🛡️ Health Check & Monitoring

You can monitor service status using the built-in health check endpoint:
```http
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "uptime": 124.5,
  "timestamp": "2026-10-21T15:00:00.000Z",
  "database": "connected"
}
```

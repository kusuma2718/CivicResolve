# CivicResolve - AI-Powered Civic Complaint Management Platform

CivicResolve is an AI-powered civic complaint management and municipal operations platform designed to help citizens report public issues and support authorities in monitoring, prioritizing, and resolving complaints.

## Key Features

- Civic Complaint Reporting
- AI Image Intelligence
- Duplicate Complaint Detection
- Civic Issue Heatmap
- Multilingual AI Assistant
- Community Impact Score
- Real-Time Notifications
- Repeat-Issue Detection
- Predictive Civic Analytics
- SLA Monitoring and Escalation

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- i18next
- Recharts
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- SQLite
- better-sqlite3
- JWT Authentication
- Google Gemini API

## Architecture

CivicResolve follows a frontend-backend architecture.

1. React provides the citizen and administrative interfaces.
2. Express handles API requests, authentication, and business logic.
3. SQLite stores application data.
4. Gemini-powered services support AI-assisted analysis and multilingual interactions.
5. Civic intelligence services support issue detection, analytics, and prioritization.

During local development, Vite proxies /api and /uploads requests to the backend.

## Project Structure

- src/ - React frontend source code
- server/ - Express backend source code
- server/src/config/ - Backend configuration
- server/src/db/ - Database implementation
- server/src/routes/ - API routes
- server/src/services/ - Backend services
- server/src/middlewares/ - Backend middleware
- server/src/tests/ - Backend tests
- server/nginx/ - Nginx configuration
- package.json - Frontend dependencies and scripts
- vite.config.ts - Vite configuration

## Prerequisites

- Node.js and npm
- Git
- Google Gemini API key for AI-powered features

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd CivicResolve
```

Replace YOUR_REPOSITORY_URL with your GitHub repository URL.

### 2. Install frontend dependencies

Run from the project root:

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

From the server directory, create a local environment file:

```powershell
Copy-Item .env.example .env
```

Configure these variables in server/.env:

| Variable | Purpose |
|---|---|
| PORT | Backend server port |
| NODE_ENV | Application environment |
| CLIENT_URL | Allowed frontend origin |
| DATABASE_PATH | SQLite database location |
| UPLOAD_DIR | Uploaded file storage directory |
| MAX_FILE_SIZE_MB | Maximum upload size |
| GEMINI_API_KEY | Google Gemini API key |
| JWT_SECRET | Secret used for JWT signing |
| TRUST_PROXY | Trusted reverse-proxy configuration |
| BACKUP_DIR | Database backup directory |

Use strong, unique production secrets. Never commit .env files or expose API keys.

## Running the Application

### 1. Start the backend

Open a terminal in the server directory and run:

```bash
npm run dev
```

The backend runs on port 5000 by default.

### 2. Start the frontend

Open a second terminal in the project root and run:


```bash
npm run dev
```

Open the application at http://localhost:5173.

## Build and Testing

### Frontend production build

Run from the project root:
```bash
npm run build
```

### Backend production build

Run inside the server directory:
```bash
npm run build
```

### Backend tests

Run inside the server directory:
```bash
npm test
```

### Database backup

After building the backend, run inside the server directory:
```bash
npm run backup
```

## Security Considerations

- Keep API keys and secrets in environment variables.
- Never commit server/.env or other files containing credentials.
- Use a strong, unique JWT_SECRET in production.
- Configure HTTPS and secure reverse-proxy settings for public deployment.
- Validate user inputs and restrict file uploads.
- Apply appropriate access controls to administrative operations.

## Project Goal

CivicResolve aims to improve civic issue reporting and municipal response by combining AI-assisted complaint analysis, multilingual accessibility, data-driven prioritization, and operational monitoring. It is designed to support more transparent, efficient, and accountable civic services.

## Screenshots

Add screenshots of the CivicResolve application here to demonstrate its main features and user interface.

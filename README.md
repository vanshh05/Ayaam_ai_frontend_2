# Ayaam ERP — AI Assistant Frontend

React-based chat UI for the Ayaam ERP AI Assistant.
Built by Datawheel Software Technology LLP.

---

## Run Locally

```bash
npm install
npm start
```

Opens at `http://localhost:3000`
Proxies API calls to `http://localhost:8080` (your Spring Boot backend).

---

## Login Credentials (Development)

| Username | Password  | Role    |
|----------|-----------|---------|
| owner    | ayaam123  | Owner   |
| manager  | ayaam123  | Manager |

---

## Deploy on Vercel

1. Push this folder to GitHub
2. Connect repo on vercel.com
3. Set environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```
4. Deploy — done.

---

## Project Structure

```
src/
├── App.js              ← Routes between Login and Chat
├── index.js            ← Entry point
├── index.css           ← Global styles + CSS variables
└── components/
    ├── Login.js        ← Login page with Ayaam branding
    └── Chat.js         ← Full chat UI with sidebar
```

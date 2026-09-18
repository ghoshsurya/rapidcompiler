<div align="center">

<img src="https://img.shields.io/badge/RapidCompiler-Online%20IDE-2563eb?style=for-the-badge&logo=code&logoColor=white" alt="RapidCompiler" />

# ⚡ RapidCompiler

### A professional online code editor and compiler supporting 14 programming languages

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-rapidcompiler.netlify.app-2563eb?style=flat-square)](https://rapidcompiler.netlify.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/rapidcompiler/deploys)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org)
[![Judge0](https://img.shields.io/badge/Powered%20by-Judge0%20CE-orange?style=flat-square)](https://ce.judge0.com)

</div>

---

## ✨ What is RapidCompiler?

RapidCompiler is a **fully featured, browser-based IDE** that lets you write, run, save, and share code in 14 programming languages — no installation, no setup, no waiting. Just open the browser and start coding.

Built for students, developers, and educators who need a fast, reliable coding environment anywhere.

---

## 🌐 Live Demo

**[https://rapidcompiler.netlify.app](https://rapidcompiler.netlify.app)**

---

## 🚀 Features

### 🖥️ Code Editor
- **Monaco Editor** — the same engine that powers VS Code
- Syntax highlighting for all 14 languages
- IntelliSense autocomplete with language-specific snippets
- Resizable editor / input / output panels (drag handles)
- Dark mode and light mode with persistent preference
- Mobile-friendly with touch toolbar (copy, paste, undo, redo)

### ⚙️ Code Execution
- **Real execution** via [Judge0 CE](https://ce.judge0.com) — a sandboxed, secure execution engine
- All 14 languages run on actual compilers/runtimes (not simulated)
- Stdin support — pass input to your programs
- Compile errors, runtime errors, and TLE all shown clearly
- 10-second CPU time limit, 128 MB memory limit

### 💾 Project Management
- Save unlimited projects to the cloud (requires login)
- Load any saved project via URL (`?project=<id>`)
- Update existing projects in-place
- Delete projects you no longer need

### 🔗 Code Sharing
- One-click share — generates a public URL for any project
- Shared projects are read-only and runnable by anyone
- No login required to view or run a shared project

### 📥 Download
- Download your code as a file with the correct extension (`.py`, `.cpp`, `.java`, etc.)

### 🔐 Authentication
- Auth0-powered login (email/password + social providers)
- JWT-secured API — all project data is private to your account
- User profile management (username, full name, avatar)
- Admin dashboard for platform management

### 📱 Mobile Support
- Fully responsive layout — works on phones and tablets
- Touch-optimized toolbar for copy/paste/undo/redo
- Adaptive layout switches between column (desktop) and row (mobile) views

---

## 🗣️ Supported Languages

| Language | Runtime | Version |
|---|---|---|
| 🐍 Python | CPython | 3.8.1 |
| 🟨 JavaScript | Node.js | 12.14.0 |
| 🔷 TypeScript | tsc | 3.7.4 |
| ⚙️ C | GCC | 9.2.0 |
| ⚙️ C++ | G++ | 9.2.0 |
| ☕ Java | OpenJDK | 13.0.1 |
| 🔵 C# | Mono | 6.6.0 |
| 🐹 Go | Go | 1.13.5 |
| 🦀 Rust | rustc | 1.40.0 |
| 🍎 Swift | Swift | 5.2.3 |
| 💎 Ruby | Ruby | 2.7.0 |
| 🐘 PHP | PHP | 7.4.1 |
| 🗄️ SQL | SQLite | 3.27.2 |
| 🌐 HTML/CSS/JS | Browser iframe | — |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React 18)                    │
│  Monaco Editor  ──►  runCode()  ──►  fetch /run         │
│  Auth0 SDK      ──►  useAuth()  ──►  fetch /neon-api    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Netlify CDN + Serverless Functions          │
│                                                          │
│  /.netlify/functions/run          /.netlify/functions/   │
│  ┌──────────────────────┐         neon-api               │
│  │  run.js              │         ┌──────────────────┐   │
│  │  • Receives language,│         │  neon-api.js     │   │
│  │    code, stdin       │         │  • Auth0 JWT     │   │
│  │  • Base64 encodes    │         │    verification  │   │
│  │  • POSTs to Judge0   │         │  • CRUD for      │   │
│  │  • Decodes result    │         │    users &       │   │
│  │  • Returns output    │         │    projects      │   │
│  └──────────┬───────────┘         └────────┬─────────┘   │
└─────────────┼───────────────────────────────┼────────────┘
              │ HTTPS                          │ SSL
┌─────────────▼──────────┐    ┌───────────────▼────────────┐
│   Judge0 CE            │    │   Neon PostgreSQL           │
│   ce.judge0.com        │    │   (Serverless Postgres)     │
│                        │    │                             │
│   Sandboxed execution  │    │   users table               │
│   Real compilers       │    │   projects table            │
│   14 languages         │    │   execution_history (future)│
│   Free, no API key     │    │                             │
└────────────────────────┘    └─────────────────────────────┘
```

### How Code Execution Works

1. User clicks **Run** in the browser
2. `runCode()` in `CodeEditor.js` sends `{ language, code, stdin }` to `/.netlify/functions/run`
3. `run.js` maps the language to a Judge0 language ID, base64-encodes the code and stdin
4. A POST request is made to `https://ce.judge0.com/submissions?wait=true`
5. Judge0 compiles and runs the code in a sandboxed container
6. The response (stdout, stderr, compile_output, status) is decoded and returned
7. The frontend displays the output in the terminal panel

### How Authentication Works

1. User clicks **Account** → redirected to Auth0 Universal Login
2. After login, Auth0 redirects back with an authorization code
3. `useAuth.js` calls `getAccessTokenSilently()` and stores the JWT in `localStorage`
4. Every API request via `axios` attaches `Authorization: Bearer <token>`
5. `neon-api.js` verifies the JWT using Auth0's JWKS endpoint before any DB operation

---

## 🗄️ Database Schema

```sql
-- Users (Auth0 user ID as primary key)
CREATE TABLE users (
  id          UUID PRIMARY KEY,   -- Auth0 sub (e.g. "auth0|abc123")
  email       VARCHAR(120) UNIQUE NOT NULL,
  username    VARCHAR(80),
  full_name   VARCHAR(200),
  avatar_url  TEXT,
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  language    VARCHAR(50)  NOT NULL,
  code        TEXT         NOT NULL,
  share_id    VARCHAR(50)  UNIQUE,          -- public share token
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Monaco Editor, Tailwind CSS, React Router v6 |
| Icons | Lucide React |
| Auth | Auth0 (`@auth0/auth0-react`) |
| HTTP Client | Axios |
| Backend | Netlify Serverless Functions (Node.js 18) |
| Code Execution | Judge0 CE (`ce.judge0.com`) — free, no API key |
| Database | Neon (serverless PostgreSQL) |
| Hosting | Netlify (CDN + Functions) |

---

## 🚀 Deployment

### Prerequisites
- [Netlify](https://netlify.com) account
- [Auth0](https://auth0.com) account (free tier)
- [Neon](https://neon.tech) account (free tier)

### 1. Clone and connect to Netlify

```bash
git clone https://github.com/ghoshsurya/rapidcompiler.git
cd rapidcompiler
```

Connect your repo to Netlify via the dashboard or CLI:
```bash
npm install -g netlify-cli
netlify init
```

### 2. Set up Auth0

1. Create a new **Single Page Application** in Auth0
2. Set **Allowed Callback URLs**: `https://your-site.netlify.app`
3. Set **Allowed Logout URLs**: `https://your-site.netlify.app`
4. Set **Allowed Web Origins**: `https://your-site.netlify.app`
5. Create an **API** in Auth0 with identifier `https://rapidcompiler-api`

### 3. Set up Neon Database

1. Create a new project at [neon.tech](https://neon.tech)
2. Run the schema from `database/neon-schema.sql`
3. Copy the connection string

### 4. Configure Environment Variables

In Netlify dashboard → **Site settings → Environment variables**, add:

| Variable | Description |
|---|---|
| `REACT_APP_AUTH0_DOMAIN` | Your Auth0 domain (e.g. `dev-xxx.us.auth0.com`) |
| `REACT_APP_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `REACT_APP_AUTH0_AUDIENCE` | Auth0 API identifier |
| `AUTH0_DOMAIN` | Same as above (used by serverless functions) |
| `AUTH0_AUDIENCE` | Same as above (used by serverless functions) |
| `DATABASE_URL` | Neon PostgreSQL connection string |

### 5. Deploy

```bash
git push origin main
```

Netlify auto-deploys on every push. The build command is:
```
cd frontend && npm install && npm run build && cd ../netlify/functions && npm install
```

---

## 💻 Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install function dependencies
cd netlify/functions && npm install && cd ../..

# Create frontend/.env.local with your Auth0 credentials
cp frontend/.env.example frontend/.env.local

# Start local dev server (runs React + Netlify Functions together)
netlify dev
```

The app will be available at `http://localhost:8888`.

---

## 📁 Project Structure

```
rapidcompiler/
├── frontend/                    # React application
│   ├── public/
│   │   ├── index.html           # HTML shell with SEO meta tags
│   │   └── sw.js                # Service worker
│   └── src/
│       ├── App.js               # Root: routing, Auth0Provider, dark mode
│       ├── components/
│       │   ├── CodeEditor.js    # Main IDE component (Monaco + execution)
│       │   ├── Navbar.js        # Top navigation bar
│       │   ├── UserProfile.js   # Profile settings + project management
│       │   └── AdminDashboard.js# Admin panel
│       ├── pages/
│       │   ├── Auth.js          # Login / signup page
│       │   ├── Projects.js      # Saved projects list
│       │   └── SharedProject.js # Public shared project viewer
│       ├── hooks/
│       │   └── useAuth.js       # Auth context wrapping Auth0
│       └── lib/
│           └── api.js           # Axios client + Auth0 config
│
├── netlify/functions/           # Serverless backend
│   ├── run.js                   # Code execution via Judge0 CE
│   └── neon-api.js              # REST API: users + projects CRUD
│
├── database/
│   └── neon-schema.sql          # PostgreSQL schema
│
├── netlify.toml                 # Netlify build + redirect config
└── README.md
```

---

## 🔒 Security

- All user data is protected by Auth0 JWT verification on every API call
- Code execution runs in Judge0's isolated sandboxed containers
- No user code ever touches the Netlify function server directly
- Database connections use SSL (`rejectUnauthorized: false` for Neon compatibility)
- CORS headers are set on all serverless function responses

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Suryakanta Ghosh**

- GitHub: [@ghoshsurya](https://github.com/ghoshsurya)
- Email: suryakanta9662@gmail.com

---

<div align="center">

Made with ❤️ by [Suryakanta Ghosh](https://github.com/ghoshsurya)

⭐ Star this repo if you find it useful!

</div>

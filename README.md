# Gemini Vector Ingestion Admin 🚀

A production-ready full-stack application built for **Vercel** deployment with Next.js App Router, TypeScript, and Tailwind CSS. It features a secure Admin Panel for creating isolated projects, ingesting documents (PDFs, web scraping, and text notes), generating real-time vector embeddings with **Google Gemini (`gemini-embedding-001`)** in the background, storing them in your configured **Vector Database**, and testing them with an interactive semantic search playground.

---

## ✨ Key Features

1. **🔐 Admin Panel with Authentication**:
   - Secure login screen with JWT cookie sessions and middleware route protection.
   - Configurable admin credentials in `src/entry.config.ts` or `.env.local` (default: `admin` / `admin123`).

2. **📁 Multi-Project Knowledge Isolation**:
   - Create and manage isolated projects (e.g., "Documentation", "Legal Contracts", "Customer Support QA").
   - Each project has its own vector namespace and customizable chunking parameters (`chunkSize`, `chunkOverlap`).

3. **📄 Multi-Source Document Ingestion**:
   - **File Upload**: PDF, TXT, Markdown, CSV, JSON files.
   - **Web Scraping**: Paste one or multiple website URLs. The application automatically fetches the page, cleans boilerplate (nav, scripts, styles), extracts article content, and chunks it.
   - **Raw Text Notes**: Instant knowledge entry with rich markdown support.

4. **⚡ Google Gemini Embeddings (`gemini-embedding-001`)**:
   - Seamlessly converts document chunks into high-dimensional vector embeddings using Google's `gemini-embedding-001` model.
   - Supports batch embedding requests and automatic rate-limit backoff.

5. **🔑 Direct Entry File Key Configuration**:
   - As requested, you can put your Gemini API key directly into the entry configuration file: `src/entry.config.ts`.
   - Alternatively, supply it via `GEMINI_API_KEY` in `.env.local` or Vercel Environment Variables.

6. **🗄️ Pluggable Vector Database Support (Configured via `.env`)**:
   - **Pinecone**: Cloud serverless vector DB (`PINECONE_API_KEY`, `PINECONE_HOST`).
   - **Upstash Vector**: Serverless HTTP vector DB optimized for Vercel (`UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`).
   - **Supabase / PostgreSQL pgvector**: Direct pgvector table and RPC (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
   - **Qdrant**: Cloud or self-hosted Qdrant (`QDRANT_URL`, `QDRANT_API_KEY`).
   - **Local Store**: Built-in zero-config cosine similarity store saved locally in `.data/` so the app runs immediately even without third-party DB credentials!

7. **⏳ Asynchronous Background Conversion**:
   - Uploads and scraping requests return immediately with a job ID.
   - The conversion pipeline runs non-blocking in the background:
     `Extracting Content` ➔ `Chunking` ➔ `Gemini Embedding` ➔ `Vector DB Upsert` ➔ `Completed`.
   - Live progress bars and real-time execution trace & log modal in the admin UI.

8. **🔍 Semantic Vector Search Playground**:
   - Test your vector database in real-time. Enter queries, select a project, set top-K, and view cosine similarity scores with chunk previews and metadata.

---

## 🚀 Quick Start (Local Development)

### 1. Configure Your Gemini API Key

Open `src/entry.config.ts` and paste your Gemini API key:

```typescript
// src/entry.config.ts
export const ENTRY_CONFIG = {
  GEMINI_API_KEY: "AIzaSyYourGeminiApiKeyHere", // <-- Put your key here!
  EMBEDDING_MODEL: "gemini-embedding-001",
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "admin123",
};
```

*(Alternatively, you can leave it empty in the entry file and place `GEMINI_API_KEY=AIzaSy...` in your `.env.local` file).*

### 2. Configure Your Vector Database in `.env.local`

Choose your vector provider in `.env.local`:

```bash
# Default zero-setup local store (works out-of-the-box):
VECTOR_DB_PROVIDER=local

# Or for Pinecone:
# VECTOR_DB_PROVIDER=pinecone
# PINECONE_API_KEY=your_key
# PINECONE_HOST=https://your-index.svc.pinecone.io

# Or for Upstash Vector:
# VECTOR_DB_PROVIDER=upstash
# UPSTASH_VECTOR_REST_URL=https://xxxx.upstash.io
# UPSTASH_VECTOR_REST_TOKEN=your_token

# Or for Supabase pgvector:
# VECTOR_DB_PROVIDER=supabase
# SUPABASE_URL=https://your-proj.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_key
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Admin Login**:
  - Username: `admin`
  - Password: `admin123`

---

## 🌐 Deploying to Vercel

This project is built and optimized specifically for **Vercel** serverless functions.

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Gemini Vector Admin"
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `VECTOR_DB_PROVIDER`: `pinecone` (or `upstash` / `supabase` / `local`)
   - `PINECONE_API_KEY`: (If using Pinecone)
   - `PINECONE_HOST`: (If using Pinecone)
   - `ADMIN_USERNAME`: Your custom admin username (e.g. `admin`)
   - `ADMIN_PASSWORD`: Your custom secure admin password
   - `JWT_SECRET`: A 32+ character random string
5. Click **Deploy**!

### Option B: Deploy via Vercel CLI

```bash
npx vercel
```

Follow the prompts to deploy directly.

---

## 📂 Project Structure

```
├── src/
│   ├── entry.config.ts           # 🔑 Entry config file (Gemini key, model, admin credentials)
│   ├── middleware.ts             # Route protection middleware for /admin/*
│   ├── app/
│   │   ├── layout.tsx            # Global HTML layout & styling
│   │   ├── page.tsx              # Root redirect to /admin or /login
│   │   ├── login/page.tsx        # Admin login page
│   │   ├── admin/
│   │   │   ├── layout.tsx        # Admin layout (Sidebar + Navbar)
│   │   │   ├── page.tsx          # Dashboard overview & stats
│   │   │   ├── projects/page.tsx # Project management & chunking settings
│   │   │   ├── documents/page.tsx# Document upload, web scraping & live background queue
│   │   │   ├── search/page.tsx   # Vector search test playground
│   │   │   └── settings/page.tsx # Configuration inspector & diagnostics
│   │   └── api/
│   │       ├── auth/             # Login, logout, session verification
│   │       ├── projects/         # CRUD projects & namespace deletion
│   │       ├── documents/        # Upload, web scrape, text note, delete
│   │       ├── jobs/[id]/        # Background job status & logs polling
│   │       ├── search/           # Real-time Gemini embedding & vector query
│   │       └── settings/         # System status & Vector DB test
│   ├── components/
│   │   ├── Sidebar.tsx           # Admin sidebar navigation
│   │   ├── Navbar.tsx            # Header with active project switcher & status
│   │   ├── Badge.tsx             # Document conversion status badges
│   │   └── JobProgressModal.tsx  # Live background job logs modal
│   └── lib/
│       ├── auth.ts               # JWT token creation & cookie verification
│       ├── gemini.ts             # Google Gemini gemini-embedding-001 client
│       ├── types.ts              # TypeScript interfaces
│       ├── data-store.ts         # Project, document, and job data store
│       ├── background-worker.ts  # Background conversion pipeline
│       ├── vector-store/         # Unified Vector DB Adapter:
│       │   ├── local.ts          # Zero-config cosine similarity store
│       │   ├── pinecone.ts       # Pinecone REST client
│       │   ├── upstash.ts        # Upstash Vector REST client
│       │   ├── supabase.ts       # Supabase pgvector REST client
│       │   └── qdrant.ts         # Qdrant REST client
│       └── document-processor/   # Text extraction & semantic chunking:
│           ├── extractor.ts      # PDF, Cheerio Web scraper, Text reader
│           └── chunker.ts        # Sentence/paragraph boundary chunker
├── vercel.json                   # Vercel function timeout configuration
├── tailwind.config.ts            # Tailwind CSS styling configuration
├── tsconfig.json                 # TypeScript compiler configuration
├── package.json                  # Dependencies
└── .env.example                  # Environment variables documentation
```

---

## 🛠️ Verification & Testing

To test the application locally:
1. Run `npm run build` — compiles 100% cleanly without errors.
2. Run `npm run start` or `npm run dev`.
3. Log in at `/login` with `admin` / `admin123`.
4. Create a Project in the Projects tab.
5. Ingest a document, PDF, or website URL in the Ingest tab.
6. Watch the real-time background status bar progress through extraction, chunking, Gemini embedding, and Vector DB storage.
7. Go to the Vector Search tab to test semantic retrieval!

# VUKnowledgebase 🎓

Official Knowledge Base & AI Assistant application for **Varendra University (VU), Rajshahi**, built with Next.js App Router, TypeScript, Tailwind CSS, Google Gemini (`gemini-embedding-001`), and Neon Serverless PostgreSQL with `pgvector`. Designed for seamless deployment on **Vercel**.

---

## ✨ Features

1. **🌐 Interactive AI Assistant Front Page (`/`)**:
   - Public-facing query portal for students, faculty, and visitors.
   - User enters questions regarding admissions, tuition fees, academic faculties, scholarships, campus facilities, and payment guidelines.
   - Question is converted into vector embeddings using `gemini-embedding-001`.
   - Runs cosine similarity search against Neon Serverless PostgreSQL (`pgvector`).
   - Retrieves best matching sources and fine-tunes the answer using the Gemini API.
   - Displays ranked source citations with cosine similarity match percentages and expandable excerpts.

2. **🔐 Secure Administration Panel (`/admin`)**:
   - Institutional login protection with JWT cookies and middleware route guards.
   - Project management for isolated subjects, departments, and admission cycles.
   - Multi-source document ingestion: PDF upload, website collection (`vu.edu.bd`), and text notes.
   - Asynchronous background ingestion pipeline: text extraction, semantic chunking, Gemini embedding generation, and vector database storage.
   - Clean university knowledge management interface with zero exposed internal jargon.

3. **🗄️ Vector Database (Neon Serverless PostgreSQL)**:
   - Configured via `NEON_DATABASE_URL` in `.env`.
   - Automatically initializes `CREATE EXTENSION IF NOT EXISTS vector;` and table `document_embeddings` with `vector(768)`.

4. **⚡ Google Gemini Integration**:
   - Model: `gemini-embedding-001` (normalized 768 dimensions via Matryoshka Representation Learning).
   - Answer synthesis powered by Gemini API.
   - Configurable in `src/entry.config.ts` or via `GEMINI_API_KEY` in `.env`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- A Google Gemini API key
- A Neon Serverless PostgreSQL database connection string (with pgvector)

### 2. Environment Variables
Copy `.env.example` to `.env` (or configure in Vercel):
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

VECTOR_DB_PROVIDER=neon
NEON_DATABASE_URL=your_neon_connection_string

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your_jwt_secret_32_characters
```

### 3. Installation & Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the public AI assistant, or [http://localhost:3000/admin](http://localhost:3000/admin) for the Admin Panel.

### 4. Deploy to Vercel
1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variables from `.env` in the Vercel project settings.
4. Deploy!

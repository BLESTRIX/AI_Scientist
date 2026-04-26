# 🧪 The AI Scientist LIMS

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge\&logo=typescript\&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge\&logo=vite\&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge\&logo=tailwind-css\&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge\&logo=supabase\&logoColor=3ECF8E)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)

---

## 🚀 Overview

**The AI Scientist LIMS** is an AI-powered **Lab Information Management System (LIMS)** that transforms scientific ideas into **fully structured, executable experiment plans**.

Built for the **Hack-Nation x World Bank Youth Summit Global AI Hackathon (Challenge 04 by Fulcrum Science)**, the platform dramatically reduces the time required for experimental planning—from **weeks to minutes**.

It combines **LLMs, smart inventory management, and automated research workflows** into a single intelligent system.

---

## ✨ Key Features

### 🧠 Automated Experiment Generation

* Input a hypothesis
* AI generates a **step-by-step experimental protocol**
* Structured output ready for execution

### 🔍 Novelty Checking

* Scans scientific literature
* Classifies results as:

  * ✅ Novel
  * ⚠️ Similar work exists
  * ❌ Already done

### 💰 Smart Procurement & Budgeting

* Integrates with **user inventory**
* Automatically:

  * Detects available equipment
  * Assigns $0 cost to in-stock items
* Produces **realistic budget estimates**

### 📝 Application Justification

* Generates **formal research justification**
* Useful for:

  * Grants
  * Academic approvals
  * Lab proposals

### 🔐 Secure Data Management

* Supabase authentication
* Row-Level Security (RLS)
* User-specific:

  * Experiments
  * Equipment
  * Corrections

### 📄 Export Functionality

* Export complete experiment plans as:

  * **DOCX files**
* Ready for sharing and submission

---

## 🏗️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui (Radix UI)

### Backend

* Node.js
* Express.js
* Groq SDK (LLM integration)

### Database & Auth

* Supabase (PostgreSQL)
* Row-Level Security (RLS)

---

## 🗄️ Database Schema

### `profiles`

* Extends `auth.users`
* Stores:

  * full_name
  * organization
  * department
  * role
* Auto-created via **auth trigger**

### `user_equipment`

* Tracks lab inventory per user
* Used by **Smart Procurement Engine**

### `saved_experiments`

* Stores:

  * hypothesis
  * generated protocol (JSON)
  * total budget

### `corrections`

* Logs user edits to AI-generated hypotheses
* Enables iteration tracking

---

## ⚙️ Getting Started

### ✅ Prerequisites

* Node.js (v18+)
* npm / yarn / pnpm
* Supabase account
* Groq API key

---

## 📥 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ai-scientist-lims.git
cd ai-scientist-lims
```

---

### 2. Environment Setup

#### Frontend (.env)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (backend/.env)

```env
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

---

### 3. Database Initialization

* Open Supabase SQL Editor
* Run the provided schema script
* This will:

  * Create tables
  * Enable RLS
  * Setup triggers

---

### 4. Run the Project

#### Start Backend

```bash
npm install
npm run dev
```

#### Start Frontend

```bash
cd src
npm install
npm run dev
```

---

## 🌐 Local Development

App runs on:

```
http://localhost:5173
```

---

## 📂 Project Structure

```
├── index.ts                   # Backend server & AI logic
├── src/
│   ├── components/
│   │   ├── layout/            # Navigation & layout UI
│   │   ├── scientist/         # Core LIMS features
│   │   └── ui/                # Reusable components
│   ├── context/               # Auth context (Supabase)
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities & helpers
│   ├── pages/                 # App pages
│   ├── test/                  # Testing setup
│   └── App.tsx / main.tsx     # Entry points
├── supabase/
│   └── migrations/            # SQL schema & RLS
├── package.json
└── tailwind.config.lov.json
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch:

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes:

```bash
git commit -m "Add AmazingFeature"
```

4. Push to GitHub:

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

## 📌 Future Improvements

* Multi-organization collaboration
* Advanced literature integration (PubMed APIs)
* Real-time experiment monitoring
* AI-assisted result analysis
* Cloud deployment support

---

## 🏁 Acknowledgment

Built as part of the **Hack-Nation x World Bank Youth Summit Global AI Hackathon**, in collaboration with **Fulcrum Science**.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 💡 Final Note

**The AI Scientist LIMS** is more than a tool—it's a step toward **autonomous scientific discovery**, where AI doesn't just assist research, but actively accelerates it.

# ROMASHKA: AI-Powered Website Scanning, Integration, and Automation Platform

## Project Overview
ROMASHKA is a next-generation, AI-powered platform designed to help businesses, developers, and enterprises seamlessly scan, analyze, and integrate website content, automate workflows, and connect with major SaaS platforms. It combines advanced website crawling, content extraction, knowledge generation, analytics, and a robust integration ecosystem—all within a modern, user-friendly web application.

ROMASHKA empowers users to:
- **Scan and extract knowledge from any website** using AI and NLP
- **Integrate with leading platforms** (Salesforce, HubSpot, Zendesk, Shopify, and more)
- **Automate business workflows** and data synchronization
- **Test and embed AI chat widgets** on their own sites
- **Analyze conversations, agent performance, and knowledge base health**
- **Manage onboarding, billing, and user access** with enterprise-grade security

## Key Features

### 1. Website Scanning & Knowledge Extraction
- **URL Scanner UI**: Input any website URL, configure scan depth, and track progress in real time
- **Content Extraction**: Crawl pages, extract text, classify content types (FAQ, docs, blog, etc.)
- **AI-Powered Knowledge Generation**: Summarize, clean, and structure extracted content for use in chatbots and knowledge bases
- **Progress Tracking**: Visual feedback on scan status, errors, and extracted word counts
- **Secure, Multi-tenant Storage**: All data is stored per user/organization with strict RLS policies

### 2. Integration Ecosystem
- **Marketplace UI**: Browse, search, and connect to major SaaS platforms (CRM, helpdesk, e-commerce, business tools)
- **Provider Services**: Modular integration services for Salesforce, HubSpot, Zendesk, Shopify, Google Workspace, Slack, and more
- **OAuth & API Key Management**: Secure credential storage and encrypted secrets
- **Webhook & Data Sync**: Real-time and scheduled data synchronization between ROMASHKA and external platforms
- **Field Mapping & Setup Wizards**: User-friendly flows for mapping data fields and configuring integrations

### 3. AI Playground & Widget Embedding
- **Playground UI**: Test AI chatbots, knowledge retrieval, and prompt engineering in a safe sandbox
- **Widget Generator**: Configure, preview, and generate embeddable chat widgets for any website
- **Session Analytics**: Track user interactions, feedback, and performance of embedded widgets

### 4. Analytics & Reporting
- **Dashboards**: Visualize conversation volume, agent performance, knowledge coverage, and integration health
- **Customizable Widgets**: Bar charts, line charts, pie charts, KPI cards, and tables for deep insights
- **Export & Sharing**: Download reports or share dashboards with stakeholders

### 5. User Management & Security
- **Authentication**: Email/password, Google, GitHub sign-in, email verification, password reset
- **Role-Based Access Control**: Admin, agent, and user roles with granular permissions
- **Branding & Customization**: White-label options for logos, colors, and chat widget appearance
- **Enterprise Security**: Encrypted credentials, RLS, audit logs, and secure API endpoints

## Architecture & Workflow

### High-Level Architecture
- **Frontend**: Modern React (Vite) SPA with TypeScript, Tailwind CSS, Zustand, React Query, and Framer Motion
- **Backend**: Supabase (Postgres) for database, authentication, storage, and real-time features
- **API Layer**: RESTful endpoints for AI, knowledge, conversations, integrations, and analytics
- **Integration Services**: Modular TypeScript services for each provider, managed by an Integration Manager
- **AI & Content Processing**: OpenAI-powered content extraction, classification, and summarization
- **Widget & Playground**: Isolated environments for testing and embedding AI chatbots

### Data Flow Example: Website Scanning
1. User enters a URL in the UI
2. `websiteScanner.ts` crawls the site, extracts content, and stores raw data
3. `contentProcessor.ts` cleans, classifies, and generates knowledge entries
4. Results are displayed in `ScanResults.tsx` and stored in the database
5. Knowledge is available for chatbots, analytics, and export

### Integration Example
1. User connects a platform (e.g., Salesforce) via the Integration Marketplace
2. OAuth flow or API key is securely stored
3. Integration Manager schedules or listens for data sync events
4. Data is mapped, transformed, and synchronized between ROMASHKA and the external platform
5. Users can view sync status, errors, and analytics in the dashboard

## Tech Stack (Full List)

### Frontend
- **React** (Vite, TypeScript)
- **Tailwind CSS** (custom theme)
- **Zustand** (state management)
- **React Query** (API calls, caching)
- **React Router** (routing)
- **Framer Motion** (animations)
- **Headless UI, Heroicons** (UI components)
- **Jest, Playwright, Vitest** (testing)

### Backend & Database
- **Supabase** (Postgres, Auth, Storage, Realtime)
- **PostgreSQL** (custom schemas for website scanning, integrations, analytics, playground, widgets)
- **RLS (Row Level Security)** and triggers for multi-tenancy and data integrity
- **OpenAI API** (content extraction, summarization, classification)
- **Node.js** (for custom scripts, schema migrations, and backend logic)

### Integrations
- **Salesforce, HubSpot, Zendesk, Shopify, Google Workspace, Slack, Notion, Trello, Jira, Asana, Intercom, Freshdesk, Stripe, Paddle, and more**
- **OAuth 2.0, API Key, Webhook** support

### Infrastructure & DevOps
- **Vercel** (deployment)
- **GitHub Actions** (CI/CD)
- **ESLint, Prettier** (linting, formatting)
- **Monorepo structure** (separate root and app dependencies)

## Setup & Deployment
1. **Clone the repo** and install dependencies at both root and `romashka/`:
   ```bash
   npm install
   cd romashka && npm install
   ```
2. **Configure environment variables** in `.env` (see `romashka/README.md` for details)
3. **Run Supabase locally or connect to your cloud instance**
4. **Apply SQL schemas** for website scanning, integrations, analytics, playground, and widgets
5. **Start the dev server**:
   ```bash
   npm run dev
   ```
6. **Access the app** at `http://localhost:5173` (or your configured port)

## Target Users & Use Cases
- **Enterprises**: Automate knowledge extraction, integrate with SaaS tools, and analyze business data
- **Developers**: Embed AI chatbots, test integrations, and build custom workflows
- **Support Teams**: Centralize conversations, automate responses, and improve agent performance
- **Product Managers**: Visualize analytics, monitor integrations, and manage onboarding

## Security, Extensibility, and Performance
- **Security**: All sensitive data is encrypted, RLS is enforced, and OAuth credentials are never exposed
- **Extensibility**: Modular integration and widget systems allow for rapid addition of new providers and features
- **Performance**: Vite-powered frontend, indexed Postgres tables, and real-time updates ensure a fast, responsive experience

## Documentation & Support
- See `romashka/README.md` for developer setup, design system, and advanced configuration
- See `romashka/WEBSITE_SCANNING_SUMMARY.md` and `romashka/WEBSITE_SCANNING_TESTING_GUIDE.md` for details on the website scanning system
- For integration and API docs, see the `/services` and `/types` directories
- For troubleshooting, see the Troubleshooting Guide in `romashka/README.md`

---

ROMASHKA is built to be the most comprehensive, extensible, and user-friendly AI-powered website scanning and integration platform available. Whether you're a developer, enterprise, or startup, ROMASHKA gives you the tools to automate, analyze, and integrate your digital world. 
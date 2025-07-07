# ROMASHKA

A modern React + Vite project with a custom design system, state management, API integration, and beautiful UI foundations.

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS (custom theme)
- Zustand (state management)
- React Query (API calls)
- Supabase (backend)
- React Router (routing)
- Framer Motion (animations)
- Headless UI & Heroicons (UI)

## Design System
- **Primary Pink:** #FF6B9D
- **Primary Green:** #4ECDC4
- **Primary Purple:** #A8E6CF
- **Dark Mode:** #0F172A
- **Light Mode:** #FFFFFF
- **Gray Scale:** #64748B, #94A3B8, #CBD5E1, #F1F5F9
- **Fonts:** Inter (headings), Source Sans Pro (body)

## Project Structure
```
src/
├── components/
│   ├── ui/
│   ├── layout/
│   └── features/
├── pages/
├── hooks/
├── utils/
├── services/
├── types/
└── stores/
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in a `.env` file:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Features
- ThemeProvider with dark/light mode
- Color mode toggle
- Glassmorphism navigation
- Skeleton loading components
- Toast notification system
- Modern button variants

Ready for feature development!

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Authentication System
- Modern landing page (`/`)
- Multi-step sign up (`/signup`)
- Sign in with email/password, Google, GitHub (`/signin`)
- Email verification flow (`/verify-email`)
- Password reset
- Protected routes (`/dashboard`)
- Persistent auth state
- Stunning UI/UX: glassmorphism, gradients, micro-interactions, dark/light mode

## Supabase Setup Notes
- Run `supabase_schema.sql` in your Supabase SQL editor
- Enable Auth providers (email, Google, GitHub) in Supabase dashboard
- Add your Supabase URL and anon key to `.env`
- Create a storage bucket for file uploads if needed
- Enable real-time on `messages` and `conversations` tables

## API Documentation
- **Endpoints**: `/api/ai`, `/api/knowledge`, `/api/conversations`, etc.
- **Auth**: Bearer token required for all endpoints.
- **Example:**
  ```bash
  curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/ai -d '{"message": "Hello"}'
  ```

## User Guide
- **Getting Started**: How to sign up, verify email, and onboard.
- **Screenshots**: ![Dashboard](docs/dashboard.png)
- **Features**: Chat, analytics, billing, automation, knowledge base, etc.

## Admin Manual
- **Configuration**: Setting up environment variables, billing, and integrations.
- **User Management**: Inviting, suspending, and managing users.
- **Branding**: Customizing logo, colors, and chat widget.

## Troubleshooting Guide
- **Common Issues**: Login problems, email not received, payment errors.
- **Debugging**: How to check logs, contact support, and report bugs.

## Changelog
- **v1.0.0**: Initial release with AI chat, analytics, billing, and automation.
- **v1.1.0**: Added PWA, mobile support, and advanced security.

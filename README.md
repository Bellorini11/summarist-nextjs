# Briefly — Summarist-inspired Next.js frontend

Original React/Next.js implementation based on the supplied internship outline and visual reference assets. Not affiliated with Summarist. The optional animated/active homepage heading was deliberately **not** implemented.

## Requirements
- Node.js 20.9+ (Node 22 LTS recommended)
- VS Code

## Start in VS Code (PowerShell)
```powershell
cd "C:\path\to\summarist-nextjs"
npm install
npm run dev
```
Open http://localhost:3000. Stop with Ctrl+C. For production validation: `npm run build` then `npm run start`.

## Included features
- Responsive homepage with supplied PNG references; original Tailwind layout and branding
- Firebase email/password registration and login, anonymous guest login, logout
- Redux Toolkit global auth-modal state
- Selected/recommended/suggested books from the internship's public APIs
- Dynamic book pages and book-duration labels
- Dynamic player with HTML audio controls, seek and ±10 seconds, elapsed/total duration
- Debounced (300ms) book search; responsive sidebar; skeleton loading
- Firestore saved and completed library; settings and subscription status
- Subscription selection and FAQ **UI only**. Checkout is intentionally disabled until backend configuration.

## Firebase setup — do this together after reviewing the frontend
1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web app. Copy **public** web config values to `.env.local` using `.env.example` as a template. Do not commit `.env.local`.
3. In Authentication > Sign-in method, enable Email/Password and Anonymous.
4. Create a Firestore database. Configure restrictive rules so a user can only read/write their own `customers/{uid}/library/{bookId}` documents. Avoid publicly writable subscription fields.
5. In Authentication > Settings > Authorized domains, add your local/deployment domains as needed.
6. Restart `npm run dev` after editing `.env.local`.

## Stripe — not yet connected
Create Stripe monthly and annual recurring prices, with a 7-day trial on the annual price. Install and configure the Firebase **Run Payments with Stripe** extension (or another secure server integration), configure Stripe secret keys *only* in secure backend configuration, and set up the checkout/session and customer-portal flows. Firestore subscription status must come from verified Stripe events, not client-written fields. Current choose-plan button intentionally shows a setup message and **never charges**. Prices in the UI are placeholders.

## Duration handling
Book cards and detail pages display `duration` if provided by the book API; otherwise they explicitly say “Duration available in player.” The player reads the real duration from audio metadata. This avoids inventing durations.

## API and availability
The public endpoints are maintained by the internship provider and may fail, change, block browser CORS, or have usage restrictions. Error states are shown. No API key is assumed. Images and audio are linked to the provider's returned URLs.

## Security and implementation notes
- Firebase web config is not a server secret; Firestore rules and backend authorization are essential.
- `NEXT_PUBLIC_` values are visible to browsers. Never put Stripe secret keys or Firebase service account credentials there.
- Anonymous guest accounts are per-user and do not share a hard-coded password.
- Subscription status display is demonstration-level until secure Stripe integration is completed.
- The optional homepage active heading was omitted as requested.
- This is a complete **frontend**, not a production-ready payments backend.

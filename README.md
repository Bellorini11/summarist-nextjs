# Briefly — Summarist-Inspired Full-Stack Application

A responsive, full-stack book summary and audio streaming application developed as part of the Frontend Simplified Virtual Internship.

Built with Next.js, TypeScript, Tailwind CSS, Firebase, Redux Toolkit, and Stripe. The application allows users to discover books, read summaries, listen to audio, manage their personal library, and purchase premium subscriptions in Stripe Sandbox mode.

This is an independent educational project inspired by Summarist and is not affiliated with Summarist.

## Live Website

https://summarist-nextjs.vercel.app

## GitHub Repository

https://github.com/Bellorini11/summarist-nextjs

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Firebase Authentication
- Firebase Firestore
- Firebase Admin SDK
- Stripe Checkout
- Stripe Webhooks
- React Icons
- REST APIs
- Git and GitHub
- Vercel

## Application Features

### Homepage

- Responsive website design
- Authentication modal
- Desktop and mobile layouts
- Original styling and supplied visual assets

### Authentication

- Email and password registration
- Email and password login
- Anonymous guest login
- Google authentication
- Password recovery
- Logout functionality
- Authentication error handling
- Global authentication modal using Redux Toolkit

### Book Discovery

- Selected Book section
- Recommended Books section
- Suggested Books section
- Dynamic book data from external REST APIs
- Premium book indicators
- Book cover images, authors, ratings, and durations
- Dynamic book details pages
- Skeleton loading states

### Audio Player

- Audio playback
- Play and pause controls
- Forward and backward skipping
- Adjustable playback progress
- Elapsed time and total duration
- Book titles and summaries
- Automatic finished book tracking

### Search and Navigation

- Search by book title or author
- 300-millisecond search debounce
- Cancellation of outdated search requests
- Responsive sidebar navigation
- Mobile-friendly interface

### Personal Library

- Save books to My Library
- Remove saved books
- Display completed books
- Automatic completion tracking
- Persistent Firestore storage

### Subscription and Payment Integration

Stripe Checkout is integrated with Firebase using custom server-side API routes and verified Stripe webhooks.

| Membership   | Price       |
| ------------ | ----------- |
| Basic        | Free        |
| Premium      | $9.99/month |
| Premium Plus | $99.99/year |

The annual subscription includes a seven-day free trial.

Subscription functionality includes:

- Monthly and annual Stripe Checkout
- Automatic membership activation
- Firebase subscription synchronization
- Subscription cancellation handling
- Automatic downgrade to Basic following immediate cancellation
- Premium content access restrictions
- Subscription status displayed on the Settings page

All payment testing was performed using Stripe Sandbox mode.

### Settings

- User email display
- Current subscription status
- Basic, Premium, and Premium Plus membership levels
- Upgrade navigation
- Skeleton loading placeholders
- Authentication-dependent content

## Local Installation

### Requirements

- Compatible Node.js installation
- npm
- Git
- VS Code or another code editor

### Clone the repository

```powershell
git clone https://github.com/Bellorini11/summarist-nextjs.git
cd summarist-nextjs
```

### Install dependencies

```powershell
npm.cmd install
```

### Configure environment variables

Create a `.env.local` file using `.env.example` as a template.

Required environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_SERVICE_ACCOUNT_BASE64=

STRIPE_SECRET_KEY=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_YEARLY_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

APP_URL=http://localhost:3000
```

Never commit private credentials or the `.env.local` file.

### Start the development server

```powershell
npm.cmd run dev -- -p 3000
```

Open:

http://localhost:3000

### Production build

```powershell
npm.cmd run build
```

### Start the production server locally

```powershell
npm.cmd run start
```

## Firebase Configuration

- Enable Email/Password authentication.
- Enable Anonymous authentication.
- Enable Google authentication.
- Configure Firestore.
- Configure authorized application domains.
- Configure server-side Firebase Admin credentials.
- Apply restrictive Firestore security rules.
- Prevent clients from directly modifying subscription status.

## Stripe Configuration

- Create monthly and annual recurring prices.
- Configure Stripe Sandbox credentials.
- Configure the annual seven-day trial through the checkout integration.
- Configure the Stripe webhook endpoint.
- Subscribe to the following webhook events:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted

Production webhook endpoint:

https://summarist-nextjs.vercel.app/api/stripe/webhook

Stripe webhook signatures are verified before subscription information is synchronized with Firestore.

## Security

- Private environment variables excluded from Git.
- Firebase Admin credentials restricted to server-side code.
- Stripe secret keys restricted to server-side code.
- Stripe webhook signature verification.
- Firebase authentication token verification for checkout requests.
- Restrictive Firestore access rules.
- Dependency security updates and npm audit testing.

The final dependency audit reported zero known vulnerabilities at the time of testing. This does not constitute a comprehensive application security assessment.

## Testing and Deployment

The application was tested locally and following deployment to Vercel.

Verified functionality includes:

- Authentication
- Book API integration
- Book search
- Audio playback
- Library management
- Premium content restrictions
- Monthly subscription activation
- Annual subscription activation
- Stripe webhook processing
- Firebase membership synchronization
- Subscription cancellation
- Settings skeleton loading
- Production build

The application is deployed through Vercel with GitHub integration.

## Implementation Notes

- Firebase anonymous authentication replaces the suggested shared guest credentials.
- Custom Stripe API routes and webhooks replace the Firebase Stripe extension.
- The optional animated homepage heading was intentionally omitted.
- Book content, images, and audio depend on external APIs supplied by the internship provider.
- Audio duration is retrieved from available book data or audio metadata.
- Payment processing is configured for educational Sandbox testing, not live commercial transactions.

## Educational Purpose

This project demonstrates full-stack web development, authentication, asynchronous API integration, state management, database integration, subscription management, responsive design, security-conscious development, and cloud deployment.

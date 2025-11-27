# FoeFinder

🌐 **[foefinder.me](https://foefinder.me)** *(open to name suggestions!)*

**Find your worst possible match.**

## Why This Exists

There are too many apps dedicated to "finding connection" — Instagram, Facebook, dating apps, social networks — and somehow they've left us more disconnected than ever. We're trapped in echo chambers, algorithmic bubbles showing us only what we already believe, matching us with people who think exactly like we do.

I'm flipping the script.

FoeFinder is a social experiment: take a quiz, find your **worst possible match** — the person who disagrees with you on almost everything. The hope? That maybe, just maybe, connecting with your "opposite" actually brings us together in ways that finding our clones never could.

Sometimes the best conversations happen with people who challenge us.

## The Concept

Unlike traditional matching apps that find similarities, FoeFinder matches users who have the **greatest differences** in their responses to thought-provoking questions. Based on the idea that opposites attract — or at least that engaging with different perspectives has value.

## How It Works

1. Users answer a questionnaire with questions on a scale of 1 to 7
2. Our matching algorithm calculates the absolute value of differences between user responses
3. Users are matched with those who have the **maximum difference** in scores
4. Connect with your "opposite" and engage in meaningful conversations across differences

## Tech Stack

- **Frontend**: Ionic 8+ with Angular 20+ (cross-platform mobile & web)
- **Native Bridge**: Capacitor 6+ (iOS, Android, Web)
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Matching Algorithm**: Rust (compiled to WebAssembly)
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting (web), App Store (iOS), Play Store (Android)

## Current Status

🔄 **Migrating to Ionic** - Converting Angular app to Ionic for cross-platform support
✅ **Angular Foundation** - Base app with authentication and questionnaire
⏳ **Mobile Integration** - Adding Capacitor for iOS/Android deployment
⏳ **Backend In Progress** - Cloud Functions and Rust matching engine

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account
- Xcode (for iOS development, macOS only)
- Android Studio (for Android development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NemisisFinder
   ```

2. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Firebase**
   - Follow the instructions in [frontend/QUICKSTART.md](frontend/QUICKSTART.md)
   - Update `frontend/src/environments/environment.ts` with your Firebase config

4. **Run the application**
   ```bash
   # Install Ionic CLI globally (first time only)
   npm install -g @ionic/cli

   # Run on web
   ionic serve
   ```

   Navigate to http://localhost:8100

5. **Run on mobile** (after migration complete)
   ```bash
   # iOS (requires macOS and Xcode)
   ionic cap run ios

   # Android (requires Android Studio)
   ionic cap run android
   ```

For detailed setup instructions, see:
- [Frontend Setup Guide](frontend/SETUP.md)
- [Implementation Plan](FIREBASE_IMPLEMENTATION_PLAN.md)
- [Quick Start](frontend/QUICKSTART.md)

## Project Structure

```
NemisisFinder/
├── frontend/              # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/     # Services, guards, models
│   │   │   ├── features/ # Auth, questionnaire, profile
│   │   │   └── shared/   # Reusable components
│   │   └── environments/ # Firebase configuration
│   ├── SETUP.md          # Detailed setup guide
│   └── QUICKSTART.md     # Quick start guide
│
├── CLAUDE.md                      # Development guide for Claude Code
├── FIREBASE_IMPLEMENTATION_PLAN.md # Complete implementation plan
└── README.md                       # This file
```

## Features

### Completed ✅
- User authentication (email/password)
- User registration with profile creation
- 10-question questionnaire with 1-7 scale
- Progress tracking
- User profile page
- Protected routes
- Real-time Firebase integration
- Angular foundation with TypeScript

### In Progress 🚧
- **Ionic Migration** - Converting UI to Ionic components
- **Capacitor Integration** - Adding native capabilities
- Cloud Functions for matching algorithm
- Rust matching engine (WebAssembly)
- Google Sheets integration
- Match results display

### Planned 📋
- Push notifications for new matches
- Match messaging with real-time chat
- User preferences and filters
- Enhanced questionnaire with categories
- Camera integration for profile photos
- Biometric authentication (Face ID, fingerprint)
- Offline mode with local storage
- Analytics dashboard
- App Store & Play Store deployment

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Guide for Claude Code when working on this project
- **[FIREBASE_IMPLEMENTATION_PLAN.md](FIREBASE_IMPLEMENTATION_PLAN.md)** - Complete technical implementation plan
- **[frontend/SETUP.md](frontend/SETUP.md)** - Detailed frontend setup instructions
- **[frontend/QUICKSTART.md](frontend/QUICKSTART.md)** - Quick start guide

## Contributing

This is currently a personal project. Contributions welcome once the MVP is complete.

## Philosophy

In a world of algorithmic echo chambers, we're betting that real connection comes from friction, not frictionlessness. The best relationships — friendships, debates, even rivalries — often happen between people who see the world differently. FoeFinder is an experiment in breaking bubbles.

## License

TBD

## Contact

For questions or feedback, please open an issue.

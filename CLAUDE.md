# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NemisisFinder** is a matchmaking application that connects people with opposite opinions and perspectives. Unlike traditional matching apps that find similarities, this project maximizes opinion differences to facilitate diverse conversations and challenge echo chambers.

## Current Status

🔄 **In Active Development** - Angular foundation with Rust matching engine
✅ **Implemented**: User authentication, questionnaire system, Firebase integration, basic Rust matcher
⏳ **In Progress**: Ionic migration for mobile support (see IONIC_MIGRATION.md)
⏳ **Next**: Cloud Functions integration, match display UI, native mobile features

## Learning Goals & Educational Approach

**IMPORTANT**: The developer is actively learning JavaScript, HTML, CSS, and the full technology stack used in this project (Ionic, Angular, TypeScript, Capacitor, Firebase, Rust, WebAssembly). When working on this codebase, Claude should:

### Teaching Methodology
1. **Explain While Implementing**
   - Describe what each piece of code does and why
   - Explain JavaScript/TypeScript concepts (closures, promises, async/await, arrow functions, destructuring, etc.)
   - Break down HTML structure and semantic meaning
   - Clarify CSS properties, selectors, flexbox, grid, and responsive design
   - Explain Ionic UI components and mobile-first design principles
   - Provide context for Angular patterns (components, services, directives, pipes, dependency injection)
   - Explain Capacitor APIs for native device features (camera, storage, push notifications)
   - Explain Firebase concepts (real-time listeners, security rules, cloud functions)

2. **Provide Conceptual Context**
   - Why certain patterns are used (e.g., "We use async/await here because...")
   - Trade-offs between different approaches
   - Best practices and common pitfalls
   - How pieces fit into the larger architecture

3. **Interactive Learning**
   - **Quiz periodically** to reinforce concepts just covered
   - Ask questions like: "Before I implement this, what do you think this CSS property will do?"
   - Suggest modifications: "Try changing X to Y and observe the result"
   - Check understanding: "Can you explain why we used const instead of let here?"

4. **Progressive Complexity**
   - Start with simpler implementations, then refactor to more advanced patterns
   - Introduce new concepts gradually with clear explanations
   - Build on previously learned material
   - Reference earlier code examples when introducing related concepts

5. **Practical Exercises**
   - Suggest small challenges related to current work ("Try adding a hover effect to this button")
   - Recommend experimental changes to deepen understanding
   - Point out areas to explore independently in documentation

### Example Interaction Pattern
```
When implementing a component:
1. Explain the component structure and lifecycle
2. Show the TypeScript class with detailed comments
3. Explain the HTML template and data binding
4. Walk through the CSS styling choices
5. Quiz: "What would happen if we changed this Observable to a Promise?"
6. Suggest: "Try adding a loading spinner while data fetches"
```

### Knowledge Check Topics
- **JavaScript**: Variables (let/const/var), functions, arrow functions, promises, async/await, array methods (map/filter/reduce), destructuring, spread operator, modules
- **HTML**: Semantic elements, forms, accessibility, data attributes
- **CSS**: Selectors, specificity, box model, flexbox, grid, positioning, responsive design, animations, CSS variables
- **TypeScript**: Types, interfaces, generics, decorators
- **Ionic**: UI components (ion-button, ion-card, ion-list), navigation (ion-router-outlet), theming, mobile design patterns
- **Angular**: Components, templates, directives, services, dependency injection, routing, forms, observables
- **Capacitor**: Native APIs (Camera, Filesystem, Push Notifications, Storage), plugins, platform detection
- **Firebase**: Authentication, Firestore queries, real-time listeners, security rules, cloud functions

The goal is to build a functional application while ensuring the developer deeply understands every line of code written.

### TODO(human) Pattern
Code files may contain `TODO(human)` comments marking areas where the developer should implement specific functionality as a learning exercise. When you encounter these:
- Explain the context and what needs to be implemented
- Provide guidance on the approach and trade-offs
- Wait for the developer to implement before proceeding
- Example: `frontend/src/app/core/models/match.model.ts` contains a TODO(human) for the Match interface

## Architecture

### Technology Stack
- **Frontend Framework**: Ionic 8+ with Angular 20+ (TypeScript-based cross-platform app)
- **Native Bridge**: Capacitor 6+ (access to native device APIs)
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Matching Algorithm**: Rust (compiled to WebAssembly or Cloud Function)
- **Database**: Firestore (NoSQL document database)
- **Data Collection**: Google Forms → Google Sheets → Cloud Functions
- **Deployment Targets**: Web (PWA), iOS (App Store), Android (Play Store)

### Data Flow
```
Google Forms (questionnaire, 1-7 scale)
  ↓
Google Sheets (temporary storage)
  ↓
Cloud Function (data import)
  ↓
Firestore (persistent storage)
  ↓
Ionic/Angular App ←→ Firebase SDK (real-time sync)
  ↓                    ↑
  ↓                    ↑ (Capacitor Push Notifications)
  ↓                    ↑
Cloud Function (trigger matching algorithm)
  ↓
Rust Matching Engine (WebAssembly or serverless)
  ↓
Firestore (store match results)
  ↓
Ionic/Angular App (display matches)
  ↓
iOS/Android/Web (cross-platform deployment)
```

### Matching Algorithm
The core algorithm calculates opinion differences:
- Users answer questionnaire questions on a 1-7 scale
- Matching score = sum of absolute differences between user responses
- Goal: Match users with maximum total difference (most opposite opinions)
- Implementation: Rust for performance and safety in handling large-scale matching

### Rust Matching Engine Structure
Located in `rust-matcher/src/`:
- **lib.rs**: WebAssembly bindings and public API for JavaScript interop
- **matching.rs**: Core matching algorithm implementation (maximum weight perfect matching)
- **scoring.rs**: Score calculation logic (absolute difference computation, normalization)

### Frontend Architecture (Angular)
Located in `frontend/src/app/`:
- **core/**: Singleton services, guards, and data models
  - `services/`: AuthService, QuestionnaireService (Firebase integration)
  - `guards/`: AuthGuard (route protection)
  - `models/`: User, Questionnaire, Response, Match interfaces
- **features/**: Feature modules (auth, questionnaire, profile)
- **shared/**: Reusable UI components (navbar, etc.)

## Development Commands

### Initial Setup
```bash
# Install global tools
npm install -g @ionic/cli @angular/cli firebase-tools

# Install project dependencies
cd frontend
npm install
```

### Ionic Development
```bash
# Development server (web)
ionic serve
# Access at http://localhost:8100

# Run on iOS simulator (requires macOS & Xcode)
ionic cap run ios

# Run on Android emulator (requires Android Studio)
ionic cap run android

# Build for production (web)
ionic build --prod

# Sync native projects after installing plugins
ionic cap sync

# Open in Xcode
ionic cap open ios

# Open in Android Studio
ionic cap open android

# Generate Ionic page with routing
ionic generate page <page-name>

# Generate Angular component
ionic generate component <component-name>

# Generate Angular service
ionic generate service <service-name>

# Live reload on device (must be on same WiFi)
ionic cap run ios --livereload --external
ionic cap run android --livereload --external
```

### Capacitor Configuration
```bash
# Add iOS platform
ionic cap add ios

# Add Android platform
ionic cap add android

# Install Capacitor plugins
npm install @capacitor/camera @capacitor/push-notifications @capacitor/storage

# Update native projects after changes
ionic cap sync

# Copy web assets to native projects
ionic cap copy

# Update Capacitor dependencies
npm install @capacitor/core @capacitor/cli
ionic cap sync
```

### Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (from root directory)
firebase init

# Select: Firestore, Functions, Hosting, Emulators

# Start Firebase emulators (local development)
firebase emulators:start

# Deploy to Firebase
firebase deploy

# Deploy only hosting (web app)
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

### Testing
```bash
# Navigate to frontend directory first
cd frontend

# Unit tests (Jasmine + Karma)
npm test

# Watch mode for TDD
npm run watch

# Note: E2E tests not yet configured
# Linting not yet configured (planned)
```

### Angular Development (current state)
```bash
# Navigate to frontend directory
cd frontend

# Development server (before Ionic migration)
npm start
# Access at http://localhost:4200

# Production build
npm run build
# Output in dist/frontend/browser/

# Watch mode (rebuilds on file changes)
npm run watch
```

### Cloud Functions (TypeScript)
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:matchUsers

# View function logs
firebase functions:log
```

### Rust Matching Engine
```bash
# Navigate to rust-matcher directory
cd rust-matcher

# Build as WebAssembly (for browser)
wasm-pack build --target web

# Run tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Build for Node.js (Cloud Functions integration)
wasm-pack build --target nodejs

# Build optimized release
cargo build --release

# Check code without building
cargo check
```

## Key Development Priorities

### Phase 1: Core Infrastructure
1. **Firebase Project Setup**
   - Create Firebase project in console
   - Enable Authentication (Email/Password, Google Sign-In)
   - Initialize Firestore database
   - Set up Firebase Hosting
   - Configure security rules

2. **Firestore Database Design**
   - users collection (profiles, metadata)
   - questionnaires collection (questions, versions)
   - responses collection (user answers, 1-7 values)
   - matches collection (paired users, scores)
   - Configure indexes and security rules

3. **Ionic + Angular + Firebase Foundation**
   - Initialize Ionic project with Angular integration
   - Install @angular/fire and configure Firebase SDK
   - Add Capacitor for native capabilities
   - Set up authentication guards and services
   - Create base Ionic components (ion-header, ion-menu, ion-tabs)
   - Implement real-time Firestore listeners
   - Configure mobile-first responsive design

### Phase 2: Data Collection & Algorithm
4. **Google Sheets Integration**
   - Cloud Function to import from Google Sheets API
   - Scheduled function for automated sync
   - CSV/JSON parsing and data transformation
   - Write to Firestore collections

5. **Rust Matching Engine**
   - Implement absolute difference algorithm
   - Compile to WebAssembly (wasm-pack)
   - Create Node.js bindings for Cloud Functions
   - Optimize for large datasets with SIMD

### Phase 3: Feature Development
6. **Questionnaire System**
   - Ionic form components (ion-range for 1-7 scale)
   - Mobile-optimized input controls
   - Firestore write for responses
   - Real-time validation
   - Progress tracking with ion-progress-bar

7. **Cloud Functions for Matching**
   - Trigger function when new responses arrive
   - Call Rust WASM matching engine
   - Batch processing for efficiency
   - Store results in Firestore matches collection
   - Send push notifications via Capacitor Push Notifications API

8. **User Management & Matches Display**
   - Firebase Authentication flows (email, Google)
   - User profile management with ion-avatar, ion-card
   - Real-time match display with Firestore listeners
   - Match history with ion-list components
   - Swipe gestures for match interactions (ion-gesture)
   - Native device features (camera for profile photos)

## Important Development Notes

### Code Organization
- **Standalone Components**: Angular app uses standalone components (no NgModules in features)
- **Dependency Injection**: Services are provided in root (`providedIn: 'root'`)
- **Routing**: Uses function-based route configuration in `app.routes.ts`
- **TypeScript Strict Mode**: The project uses TypeScript 5.9+ with strict type checking

### File Naming Conventions
- Components: `component-name.component.ts`
- Services: `service-name.service.ts`
- Models: `model-name.model.ts`
- Guards: `guard-name.guard.ts`

### Git Workflow
- Main branch: `main`
- Build artifacts (Rust `target/`, `node_modules/`) are gitignored
- Ionic/Capacitor native projects (`ios/`, `android/`) are gitignored

### Related Documentation
For detailed guides, see:
- **IONIC_MIGRATION.md**: Complete guide for converting Angular to Ionic + Capacitor
- **FIREBASE_IMPLEMENTATION_PLAN.md**: Firebase setup and integration steps
- **GETTING_STARTED.md**: Initial setup instructions
- **README.md**: Project overview and features

## Philosophy

The project is built on the belief that "opposites attract" and that engaging with different perspectives has value. The matching strategy intentionally creates connections between people with divergent viewpoints to foster meaningful dialogue across differences.

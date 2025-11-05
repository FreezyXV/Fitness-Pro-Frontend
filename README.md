# 🏋️ FitnessPro Frontend - Complete & Educational Documentation

> **Complete guide to understand the architecture, operation, and development of the FitnessPro Angular frontend**
>
> This documentation is designed to be **accessible to everyone**, from beginners to experienced developers.

---

## 📚 Table of Contents

1. [Introduction - What is a Frontend?](#1-introduction)
2. [Global Application Architecture](#2-global-architecture)
3. [Technologies Used and Why](#3-technologies)
4. [Installation and Configuration](#4-installation)
5. [Complete Project Structure](#5-structure)
6. [Data Flow - From Click to Display](#6-data-flow)
7. [Authentication System](#7-authentication)
8. [Frontend-Backend Communication](#8-api-communication)
9. [Main Components Detailed](#9-components)
10. [Services and State Management](#10-services)
11. [Routing and Navigation](#11-routing)
12. [Guards and Interceptors](#12-guards-interceptors)
13. [Styling and Design System](#13-styling)
14. [Build and Deployment](#14-build-deployment)
15. [Development and Best Practices](#15-development)
16. [Troubleshooting and FAQ](#16-troubleshooting)

---

<a name="1-introduction"></a>
## 1. Introduction - What is a Frontend?

### 🎯 Simple Analogy: The Restaurant

Imagine a web application like **a restaurant**:

```
┌───────────────────────────────────────────────────────────────┐
│                    🍽️ RESTAURANT                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  👨‍🍳 KITCHEN (Backend)          🧑‍💼 DINING ROOM (Frontend)    │
│  ├─ Prepares dishes          ├─ Welcomes customers          │
│  ├─ Stores ingredients       ├─ Presents menu               │
│  ├─ Manages recipes          ├─ Takes orders                │
│  └─ Checks quality           └─ Serves dishes               │
│                                                               │
│  📊 DATABASE                  🎨 INTERFACE                    │
│  └─ Freezer/inventory        └─ Tables, decoration           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**The Frontend (our Angular application)** is:
- ✅ **What the user sees and touches** (the graphical interface)
- ✅ **Presentation logic** (displaying data nicely)
- ✅ **Interaction management** (clicks, forms, navigation)
- ✅ **Communication with backend** (send/receive data)

### 🔄 User Action Lifecycle

Here's what happens when a user clicks "View my workouts":

```
┌───────────────────────────────────────────────────────────────┐
│         COMPLETE USER ACTION CYCLE                            │
└───────────────────────────────────────────────────────────────┘

1️⃣ USER
   │
   └─> 🖱️ Click on "My Workouts"
       │
       ↓
2️⃣ FRONTEND (Angular Component)
   │
   ├─> 📄 WorkoutComponent detects click
   │   └─> Calls WorkoutService.getWorkouts()
       │
       ↓
3️⃣ FRONTEND (Angular Service)
   │
   ├─> 🔌 WorkoutService prepares HTTP request
   │   └─> HttpClient.get('/api/workouts')
       │
       ↓
4️⃣ INTERCEPTORS (Middleware)
   │
   ├─> 🔐 AuthInterceptor adds JWT token
   │   └─> Headers: { Authorization: "Bearer xxx..." }
       │
       ↓
5️⃣ NETWORK
   │
   └─> 🌐 HTTP request to backend
       │   GET https://api.fitnesspro.com/api/workouts
       │   Headers: { Authorization: "Bearer xxx..." }
       │
       ↓
6️⃣ BACKEND (Laravel)
   │
   ├─> 🛡️ Verifies JWT token
   ├─> 📊 Queries database
   ├─> 🔧 Processes data
   └─> 📤 Returns JSON
       │
       ↓
7️⃣ FRONTEND (Service receives response)
   │
   ├─> 📦 WorkoutService receives data
   │   └─> Stores in BehaviorSubject (reactive state)
       │
       ↓
8️⃣ FRONTEND (Component reacts)
   │
   ├─> 🔄 WorkoutComponent subscribes to data
   │   └─> Automatically receives update
       │
       ↓
9️⃣ FRONTEND (Template updates)
   │
   ├─> 🎨 Angular detects change
   └─> 🖼️ Updates HTML display
       │
       ↓
🔟 USER
   │
   └─> 👁️ Sees their workouts list on screen
```

---

<a name="2-global-architecture"></a>
## 2. Global Application Architecture

### 🏛️ Layered Architecture

FitnessPro Frontend follows a **layered architecture** to separate responsibilities:

```
┌───────────────────────────────────────────────────────────────┐
│                   FRONTEND ARCHITECTURE                        │
│                     (Layered View)                             │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  LAYER 1: PRESENTATION (UI Components)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LoginComponent   DashboardComponent   WorkoutComponent │  │
│  │  📱 User Interface                                      │  │
│  │  ├─ Displays data                                       │  │
│  │  ├─ Captures events (clicks, inputs)                   │  │
│  │  └─ Delegates logic to services                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  LAYER 2: BUSINESS LOGIC (Services)                          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  AuthService   WorkoutService   ExerciseService         │  │
│  │  🧠 Application Logic and State                        │  │
│  │  ├─ Manages data state (BehaviorSubject)               │  │
│  │  ├─ Orchestrates API calls                             │  │
│  │  ├─ Applies business logic                             │  │
│  │  └─ Caches data                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  LAYER 3: MIDDLEWARE (Interceptors & Guards)                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  AuthInterceptor   ErrorInterceptor   AuthGuard         │  │
│  │  🔐 Security and Transformation                        │  │
│  │  ├─ Adds authentication headers                        │  │
│  │  ├─ Handles errors globally                            │  │
│  │  └─ Protects routes                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  LAYER 4: COMMUNICATION (HTTP Client)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  HttpClient (Angular)                                   │  │
│  │  🌐 Communication with Backend API                     │  │
│  │  ├─ Makes HTTP requests (GET, POST, PUT, DELETE)       │  │
│  │  ├─ Manages headers and parameters                     │  │
│  │  └─ Transforms responses into Observables              │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
                         🌐 INTERNET
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  BACKEND API (Laravel)                                        │
│  📊 Data processing and server logic                         │
└───────────────────────────────────────────────────────────────┘
```

### 🧩 SPA Pattern (Single Page Application)

FitnessPro is a **SPA** - a single HTML page that changes dynamically:

```
┌───────────────────────────────────────────────────────────────┐
│            COMPARISON: TRADITIONAL APPLICATION                 │
│                    vs SPA (Angular)                           │
└───────────────────────────────────────────────────────────────┘

📄 TRADITIONAL APPLICATION (Multi-Page)
────────────────────────────────────────────
   User clicks "Dashboard"
        ↓
   🌐 Full request to server
        ↓
   📄 New HTML page loaded
        ↓
   🔄 Everything reloaded (CSS, JS, images...)
        ↓
   ⏱️ White screen during loading
        ↓
   ✅ Page displayed (slow, not smooth)


🚀 SPA (Single Page Application - Angular)
────────────────────────────────────────────
   User clicks "Dashboard"
        ↓
   ⚡ Angular Router changes view
        ↓
   🎨 Only component changes (no reload)
        ↓
   📊 If needed, data loaded in background
        ↓
   ✨ Smooth, instant transition
        ↓
   ✅ Fast and modern experience
```

**SPA Advantages:**
- ⚡ Instant navigation
- 📱 Native mobile experience
- 🔄 Real-time updates
- 💾 Less bandwidth
- 🎯 Better UX (User Experience)

---

<a name="3-technologies"></a>
## 3. Technologies Used and Why

### 🛠️ Complete Technical Stack

```
┌───────────────────────────────────────────────────────────────┐
│                     TECHNICAL STACK                            │
└───────────────────────────────────────────────────────────────┘

🅰️  ANGULAR 19
    ├─ Why Angular?
    │  ├─ Complete framework (all-in-one)
    │  ├─ Native TypeScript (strong typing)
    │  ├─ Scalable architecture for large apps
    │  ├─ Excellent for enterprise applications
    │  ├─ Mature and stable ecosystem
    │  └─ Google support and active community
    │
    └─ Alternatives considered
       ├─ React (simpler but less structured)
       ├─ Vue (lighter but less rich ecosystem)
       └─ Svelte (performant but less mature)

📘 TYPESCRIPT 5.7
    ├─ Why TypeScript?
    │  ├─ Error detection before execution
    │  ├─ Intelligent auto-completion (IDE)
    │  ├─ Safe and easy refactoring
    │  ├─ Self-documented code (types = doc)
    │  └─ Better long-term maintainability
    │
    └─ Example benefit
       // ❌ JavaScript - runtime error
       function add(a, b) {
         return a + b;
       }
       add("5", 3); // "53" - silent bug!

       // ✅ TypeScript - error detected immediately
       function add(a: number, b: number): number {
         return a + b;
       }
       add("5", 3); // ❌ Compilation error!

🎨 SCSS (Sass)
    ├─ Why SCSS?
    │  ├─ Variables for colors/sizes
    │  ├─ Nesting for readability
    │  ├─ Mixins for reusability
    │  ├─ Functions and calculations
    │  └─ Better CSS organization
    │
    └─ Example
       // Variables
       $primary-color: #6366f1;
       $border-radius: 12px;

       // Reusable mixin
       @mixin card {
         background: white;
         border-radius: $border-radius;
         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
       }

       // Usage
       .workout-card {
         @include card;
         padding: 1.5rem;
       }

📡 RxJS (Reactive Extensions)
    ├─ Why RxJS?
    │  ├─ Asynchronous event management
    │  ├─ Reactive data streams
    │  ├─ Powerful operators (map, filter, merge...)
    │  ├─ Automatic cancellation (unsubscribe)
    │  └─ Observable/Observer pattern
    │
    └─ Concrete example
       // Search with debounce (wait 300ms)
       searchInput.valueChanges.pipe(
         debounceTime(300),      // Wait for user to stop typing
         distinctUntilChanged(), // Ignore if same value
         switchMap(term =>       // Cancel previous search
           this.searchService.search(term)
         )
       ).subscribe(results => {
         this.results = results;
       });

🌐 HTTP CLIENT (Angular)
    ├─ Why HttpClient?
    │  ├─ Based on Observables (RxJS)
    │  ├─ Integrated interceptors
    │  ├─ Typed requests/responses
    │  ├─ Automatic error handling
    │  └─ Facilitated testing
    │
    └─ Example
       // Typed request with transformation
       this.http.get<Workout[]>('/api/workouts').pipe(
         map(workouts => workouts.filter(w => w.active)),
         catchError(error => {
           console.error('Error:', error);
           return of([]); // Default value
         })
       ).subscribe(workouts => {
         this.workouts = workouts;
       });

▲ VERCEL (Deployment)
    ├─ Why Vercel?
    │  ├─ Automatic deployment (push = deploy)
    │  ├─ Ultra-fast global CDN
    │  ├─ Automatic previews for PRs
    │  ├─ Automatic HTTPS
    │  ├─ Integrated build optimizations
    │  └─ Free for personal projects
    │
    └─ Alternatives considered
       ├─ Netlify (similar, also good)
       ├─ AWS Amplify (more complex)
       └─ GitHub Pages (limited, no backend)
```

### 🔄 Compilation Flow

Here's how our TypeScript/Angular code becomes a web application:

```
┌───────────────────────────────────────────────────────────────┐
│             BUILD PROCESS (ng build)                          │
└───────────────────────────────────────────────────────────────┘

1️⃣ SOURCE CODE
   ├─ app.component.ts (TypeScript)
   ├─ app.component.html (Template)
   ├─ app.component.scss (Styles)
   └─ services/*.ts (Logic)
          ↓
          ↓ Angular Compiler (NGC)
          ↓
2️⃣ TYPESCRIPT COMPILATION
   ├─ TypeScript → JavaScript (ES2022)
   ├─ Type checking
   └─ Optimized code generation
          ↓
          ↓ Angular AOT Compiler
          ↓
3️⃣ AOT (Ahead-of-Time) COMPILATION
   ├─ HTML Templates → JavaScript
   ├─ Component optimization
   ├─ Tree shaking (unused code removal)
   └─ Pre-compilation for performance
          ↓
          ↓ Webpack/esbuild
          ↓
4️⃣ BUNDLING (Grouping)
   ├─ All JS files → optimized bundles
   ├─ SCSS → compiled and minified CSS
   ├─ Images → optimized and compressed
   └─ Lazy loading chunks separated
          ↓
          ↓ Minification
          ↓
5️⃣ OPTIMIZATION
   ├─ Minification (remove spaces/comments)
   ├─ Uglification (shorten variable names)
   ├─ Gzip/brotli compression
   └─ Source maps (for debugging)
          ↓
          ↓
6️⃣ FINAL OUTPUT (dist/frontend/)
   ├─ index.html (entry point)
   ├─ main.js (main bundle ~180KB gzipped)
   ├─ polyfills.js (browser compatibility ~35KB)
   ├─ runtime.js (Angular runtime ~12KB)
   ├─ lazy-*.js (on-demand loaded modules)
   ├─ styles.css (global styles)
   └─ assets/ (images, fonts, icons)

📊 RESULT
   ├─ Initial bundle: ~180 KB (gzipped)
   ├─ First Contentful Paint: < 1.5s
   ├─ Time to Interactive: < 3s
   └─ Lighthouse Score: 95+ / 100
```

---

<a name="4-installation"></a>
## 4. Installation and Configuration

### 📋 Prerequisites

```bash
# Required versions
Node.js:     v20.x or higher
npm:         v10.x or higher
Angular CLI: v19.x

# Check installed versions
node --version    # should display v20.x.x
npm --version     # should display 10.x.x
ng version        # should display Angular CLI: 19.x.x
```

### 🚀 Step-by-Step Installation

```bash
# 1️⃣ Clone the repository
git clone https://github.com/your-username/fitness-pro.git
cd fitness-pro/frontend

# 2️⃣ Install dependencies
npm install
# This will:
# - Download all packages (~500MB node_modules)
# - Install Angular, RxJS, TypeScript, etc.
# - Configure build scripts
# Duration: 2-5 minutes depending on your connection

# 3️⃣ Environment configuration
# Environment files are already configured in src/environments/

# 4️⃣ Start the development server
npm start
# or
ng serve

# The application will be accessible at:
# 🌐 http://localhost:4200
```

### ⚙️ Environment Configuration

**`src/environments/environment.ts`** (Local Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',  // Local backend
  appName: 'FitnessPro',
  version: '2.1.0',

  // Feature flags (enable/disable features)
  features: {
    offlineMode: true,
    analytics: false,
    debugging: true
  },

  // Cache configuration
  cache: {
    ttl: 300000,  // 5 minutes in milliseconds
    maxSize: 100  // 100 entries max
  }
};
```

**`src/environments/environment.prod.ts`** (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.fitnesspro.com/api',  // Production API
  appName: 'FitnessPro',
  version: '2.1.0',

  features: {
    offlineMode: false,
    analytics: true,
    debugging: false
  },

  cache: {
    ttl: 600000,  // 10 minutes
    maxSize: 200
  }
};
```

### 🏃 Running the Application

```bash
# Start development server
npm start
# or
ng serve

# The application will be accessible at:
# 🌐 http://localhost:4200

# What happens in the background:
# 1. TypeScript compilation → JavaScript
# 2. SCSS compilation → CSS
# 3. File bundling
# 4. Development server startup
# 5. Watch mode activated (automatic recompilation)
# 6. Hot Module Replacement (no browser refresh)

# Useful options
ng serve --open              # Automatically opens browser
ng serve --port 4300         # Change port
ng serve --host 0.0.0.0      # Accessible from local network
ng serve --ssl               # Enable HTTPS in dev
```

### 🔗 Verify Backend Connection

```bash
# Backend must be running on http://localhost:8000
# Verify the API responds:
curl http://localhost:8000/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-04T10:30:00Z"}

# If connection error:
# 1. Verify Laravel backend is running
cd ../backend
php artisan serve

# 2. Check CORS configuration in backend/config/cors.php
# 'allowed_origins' => ['http://localhost:4200']
```

---

<a name="5-structure"></a>
## 5. Complete Project Structure

### 📁 Detailed Tree Structure

```
frontend/
├── 📄 angular.json              # Angular project configuration
├── 📄 package.json              # npm dependencies and scripts
├── 📄 tsconfig.json             # Global TypeScript configuration
├── 📄 tsconfig.app.json         # TypeScript config for app
├── 📄 tsconfig.spec.json        # TypeScript config for tests
│
└── 📁 src/                      # Source code
    ├── 📄 index.html            # Main HTML page (SPA entry point)
    ├── 📄 main.ts               # Angular bootstrap (JS entry point)
    ├── 📄 styles.scss           # Global styles
    │
    ├── 📁 app/                  # Angular application
    │   ├── 📄 app.component.ts   # Root component
    │   ├── 📄 app.config.ts      # Providers configuration
    │   ├── 📄 app.routes.ts      # Application routes
    │   │
    │   ├── 📁 core/             # Core module (singleton)
    │   │   ├── 📁 guards/
    │   │   │   ├── auth.guard.ts       # Protected routes
    │   │   │   └── guest.guard.ts      # Public routes
    │   │   │
    │   │   ├── 📁 interceptors/
    │   │   │   ├── auth.interceptor.ts     # JWT token injection
    │   │   │   └── error.interceptor.ts    # HTTP error handling
    │   │   │
    │   │   ├── 📁 services/
    │   │   │   └── api.service.ts          # Base API service
    │   │   │
    │   │   └── 📁 layout/
    │   │       ├── layout/
    │   │       │   ├── layout.component.ts
    │   │       │   ├── layout.component.html
    │   │       │   └── layout.component.scss
    │   │       │
    │   │       └── sidebar/
    │   │           ├── sidebar.component.ts
    │   │           ├── sidebar.component.html
    │   │           └── sidebar.component.scss
    │   │
    │   ├── 📁 features/         # Business modules
    │   │   ├── 📁 auth/         # Authentication
    │   │   │   ├── login/
    │   │   │   ├── register/
    │   │   │   └── reset-password/
    │   │   │
    │   │   ├── 📁 dashboard/    # Dashboard
    │   │   ├── 📁 exercises/    # Exercise management
    │   │   ├── 📁 workout/      # Workout programs
    │   │   ├── 📁 nutrition/    # Nutrition
    │   │   ├── 📁 calendar/     # Calendar
    │   │   ├── 📁 goals/        # Goals
    │   │   ├── 📁 challenges/   # Challenges
    │   │   └── 📁 profile/      # User profile
    │   │
    │   └── 📁 shared/           # Shared code
    │       ├── 📁 components/   # Reusable components
    │       ├── 📁 models/       # TypeScript interfaces
    │       └── 📁 constants/    # Constants
    │
    ├── 📁 assets/               # Static resources
    │   ├── images/
    │   ├── icons/
    │   └── fonts/
    │
    ├── 📁 environments/         # Environment configuration
    │   ├── environment.ts       # Development
    │   └── environment.prod.ts  # Production
    │
    └── 📁 styles/               # Organized SCSS styles
        ├── _variables.scss      # Variables (colors, sizes)
        ├── _mixins.scss         # Reusable mixins
        └── _reset.scss          # CSS reset
```

### 📖 Key File Explanations

#### 🎯 **index.html** - The Single HTML Page

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FitnessPro</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <!-- 🎯 Angular application entry point -->
  <!-- Angular will replace this tag with the AppComponent -->
  <app-root></app-root>
</body>
</html>
```

**Why is this special?**
- This is the **ONLY** HTML file in the entire application
- The `<app-root>` tag is where Angular injects all the application
- Once loaded, Angular takes full control and manages the page

#### 🚀 **main.ts** - Application Bootstrap

```typescript
// main.ts - JavaScript entry point

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// 🔥 APPLICATION STARTUP
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// What happens:
// 1. Angular loads AppComponent
// 2. Applies configuration (appConfig)
// 3. Replaces <app-root> in index.html
// 4. Application is running!
```

#### ⚙️ **app.config.ts** - Global Configuration

```typescript
// app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 🚏 Router - Navigation between pages
    provideRouter(routes),

    // 🌐 HTTP Client - API calls
    provideHttpClient(
      withInterceptors([authInterceptor])  // Adds token automatically
    ),

    // 🎨 Animations
    provideAnimations(),

    // ... other providers
  ]
};

// 💡 Providers are services available throughout the app
```

#### 🛣️ **app.routes.ts** - Route Definitions

```typescript
// app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 🏠 Root redirection
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // 🔓 Public routes (accessible without login)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard]  // Redirects if already logged in
  },

  // 🔒 Protected routes (requires login)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],  // Blocks if not logged in
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'workouts', component: WorkoutComponent },
      { path: 'exercises', component: ExercisesComponent },
      // ... other routes
    ]
  },

  // 🚫 Fallback (unknown route)
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
```

**Routing system explained:**

```
┌────────────────────────────────────────────────────────────┐
│                 ROUTING SYSTEM                             │
└────────────────────────────────────────────────────────────┘

URL: http://localhost:4200/
   ↓
   Router evaluates routes in order
   ↓
   Finds: { path: '', redirectTo: 'login' }
   ↓
   Redirects to: /login


URL: http://localhost:4200/dashboard
   ↓
   Finds route with LayoutComponent parent
   ↓
   AuthGuard checks authentication
   ↓
   ✅ Logged in → Shows LayoutComponent + DashboardComponent
   ❌ Not logged in → Redirect /login


URL: http://localhost:4200/something
   ↓
   No route matches
   ↓
   Fallback: { path: '**', redirectTo: 'dashboard' }
   ↓
   Redirects to /dashboard
```

### 📂 The **core/** Folder Explained

The `core/` folder contains **singleton services** (one instance throughout the app).

**Rules:**
- ✅ Globally used services (AuthService, ApiService)
- ✅ Guards and Interceptors
- ✅ Layout components (Sidebar, Header)
- ❌ Never imported in features (only in AppComponent)

```
core/
├── guards/           # 🛡️ Route protection
│   └── auth.guard.ts
│
│       export const AuthGuard: CanActivateFn = (route, state) => {
│         // Check if user is logged in
│         if (authService.isAuthenticated) {
│           return true;  // Allow
│         }
│
│         // Redirect to login
│         router.navigate(['/login']);
│         return false;  // Block
│       };
│
├── interceptors/     # 🔌 HTTP Middleware
│   └── auth.interceptor.ts
│
│       export const authInterceptor: HttpInterceptorFn = (req, next) => {
│         const token = authService.token;
│
│         if (token) {
│           // Clone request and add token
│           req = req.clone({
│             setHeaders: { Authorization: `Bearer ${token}` }
│           });
│         }
│
│         return next(req);  // Continue
│       };
│
└── layout/           # 🖼️ Visual structure
    └── sidebar/
        └── sidebar.component.ts

            @Component({
              selector: 'app-sidebar',
              templateUrl: './sidebar.component.html',
              styleUrls: ['./sidebar.component.scss']
            })
            export class SidebarComponent {
              // Navigation menu
              menuItems = [
                { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
                { label: 'Workouts', route: '/workouts', icon: 'fitness' },
                // ...
              ];
            }
```

### 📂 The **features/** Folder Explained

Each **feature** = a **complete and autonomous business module**.

**Separation principle:**
- ✅ By functional domain (not technical!)
- ✅ Autonomous (can be removed without breaking app)
- ✅ Communicates via shared services

**Example: Workout Module**

```
features/workout/
├── workout.component.ts              # Program list
│
│   @Component({...})
│   export class WorkoutComponent implements OnInit {
│     workouts$ = this.workoutService.workouts$;
│
│     ngOnInit() {
│       this.workoutService.loadWorkouts();
│     }
│   }
│
├── create-workout/                   # Sub-module: Creation
│   ├── create-workout.component.ts
│   │
│   │   export class CreateWorkoutComponent {
│   │     workoutForm = this.fb.group({
│   │       name: ['', Validators.required],
│   │       description: [''],
│   │       exercises: this.fb.array([])
│   │     });
│   │
│   │     onSubmit() {
│   │       this.workoutService.create(this.workoutForm.value)
│   │         .subscribe(() => {
│   │           this.router.navigate(['/workouts']);
│   │         });
│   │     }
│   │   }
│   │
│   ├── create-workout.component.html
│   └── create-workout.component.scss
│
├── workout-plan-detail/              # Sub-module: Details
│   └── workout-plan-detail.component.ts
│
└── workout.service.ts                # Module service

    @Injectable({ providedIn: 'root' })
    export class WorkoutService {
      private workoutsSubject = new BehaviorSubject<Workout[]>([]);
      workouts$ = this.workoutsSubject.asObservable();

      loadWorkouts() {
        this.http.get<Workout[]>('/api/workouts')
          .subscribe(workouts => {
            this.workoutsSubject.next(workouts);
          });
      }
    }
```

**Data flow in the module:**

```
┌────────────────────────────────────────────────────────────┐
│           DATA FLOW IN WORKOUT MODULE                      │
└────────────────────────────────────────────────────────────┘

1️⃣ USER VISITS /workouts
   ↓
   Router loads WorkoutComponent
   ↓
   ngOnInit() calls workoutService.loadWorkouts()
   ↓
   Service makes GET /api/workouts
   ↓
   Receives data and updates BehaviorSubject
   ↓
   Component (subscribed via workouts$) receives data
   ↓
   Template updates automatically
   ↓
   User sees their workouts list


2️⃣ USER CLICKS "CREATE"
   ↓
   Navigation to /workouts/create
   ↓
   Router loads CreateWorkoutComponent
   ↓
   Form displayed
   ↓
   User fills and submits
   ↓
   Service makes POST /api/workouts with form data
   ↓
   Backend creates workout and returns object
   ↓
   Redirect to /workouts/:id (detail)
```

---

<a name="6-data-flow"></a>
## 6. Data Flow - From Click to Display

Here's an **ultra-detailed** example of what happens when a user creates a new workout.

### 🎬 Scenario: Create a Workout Program

```
┌────────────────────────────────────────────────────────────┐
│     COMPLETE FLOW: CREATE A WORKOUT                        │
│     (Educational example with full detail)                 │
└────────────────────────────────────────────────────────────┘


STEP 1: 🖱️ USER CLICKS "CREATE A PROGRAM"
──────────────────────────────────────────────────────────────
File: features/workout/workout.component.html

<button (click)="createWorkout()">
  Create a Program
</button>

Component detects the click:

createWorkout() {
  this.router.navigate(['/workouts/create']);
}


STEP 2: 🚏 ROUTING NAVIGATION
──────────────────────────────────────────────────────────────
Angular Router:
  URL changes: /workouts → /workouts/create
  ↓
  Finds the route:
  { path: 'workouts/create', component: CreateWorkoutComponent }
  ↓
  AuthGuard checks (user logged in? yes)
  ↓
  Loads CreateWorkoutComponent


STEP 3: 🎨 COMPONENT INITIALIZED
──────────────────────────────────────────────────────────────
File: features/workout/create-workout/create-workout.component.ts

export class CreateWorkoutComponent implements OnInit {
  workoutForm!: FormGroup;
  exercises: Exercise[] = [];

  constructor(
    private fb: FormBuilder,
    private workoutService: WorkoutService,
    private exerciseService: ExerciseService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🔄 CreateWorkoutComponent initialized');

    // Create reactive form
    this.workoutForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      difficulty: ['intermediate'],
      exercises: this.fb.array([])  // Array of exercises
    });

    // Load available exercises
    this.exerciseService.loadExercises();
    this.exerciseService.exercises$.subscribe(exercises => {
      this.exercises = exercises;
    });
  }

  // ... rest of component
}

What: Form is ready, available exercises loaded


STEP 4: 👤 USER FILLS THE FORM
──────────────────────────────────────────────────────────────
Template displays:

<form [formGroup]="workoutForm" (ngSubmit)="onSubmit()">
  <input formControlName="name" placeholder="Program name">
  <textarea formControlName="description"></textarea>

  <select formControlName="difficulty">
    <option value="beginner">Beginner</option>
    <option value="intermediate">Intermediate</option>
    <option value="advanced">Advanced</option>
  </select>

  <!-- List of exercises to add -->
  <div *ngFor="let exercise of exercises">
    <button (click)="addExercise(exercise)">
      Add {{ exercise.name }}
    </button>
  </div>

  <button type="submit" [disabled]="workoutForm.invalid">
    Create Program
  </button>
</form>

User enters:
  - Name: "Morning Routine"
  - Description: "Quick 30min workout"
  - Difficulty: "intermediate"
  - Adds 2 exercises: Push-ups (3x12), Squats (4x10)

Form state:
workoutForm.value = {
  name: "Morning Routine",
  description: "Quick 30min workout",
  difficulty: "intermediate",
  exercises: [
    { exercise_id: 5, sets: 3, reps: 12 },
    { exercise_id: 12, sets: 4, reps: 10 }
  ]
}


STEP 5: ✅ USER CLICKS "CREATE"
──────────────────────────────────────────────────────────────
(ngSubmit) triggers:

onSubmit() {
  if (this.workoutForm.invalid) {
    console.warn('⚠️ Invalid form');
    return;
  }

  console.log('📤 Sending data:', this.workoutForm.value);

  this.workoutService.createWorkout(this.workoutForm.value)
    .subscribe({
      next: (createdWorkout) => {
        console.log('✅ Workout created:', createdWorkout);
        this.router.navigate(['/workouts', createdWorkout.id]);
      },
      error: (error) => {
        console.error('❌ Error:', error);
        alert('Error creating workout');
      }
    });
}


STEP 6: 🧠 SERVICE PROCESSES THE REQUEST
──────────────────────────────────────────────────────────────
File: features/workout/workout.service.ts

createWorkout(workout: CreateWorkoutDto): Observable<Workout> {
  console.log('📡 Service: Creating workout');

  return this.http.post<Workout>('/api/workouts', workout)
    .pipe(
      tap(created => {
        console.log('✅ Workout created (ID:', created.id, ')');

        // Update local cache
        const current = this.workoutsSubject.value;
        this.workoutsSubject.next([...current, created]);
      }),
      catchError(error => {
        console.error('❌ API Error:', error);
        throw error;
      })
    );
}


STEP 7: 🔌 INTERCEPTOR ADDS THE TOKEN
──────────────────────────────────────────────────────────────
File: core/interceptors/auth.interceptor.ts

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  if (token) {
    console.log('🔐 Adding JWT token');

    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};


STEP 8: 🌐 HTTP REQUEST SENT
──────────────────────────────────────────────────────────────
Complete HTTP request:

POST https://api.fitnesspro.com/api/workouts

Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
  Content-Type: application/json
  Accept: application/json

Body:
{
  "name": "Morning Routine",
  "description": "Quick 30min workout",
  "difficulty": "intermediate",
  "exercises": [
    { "exercise_id": 5, "sets": 3, "reps": 12 },
    { "exercise_id": 12, "sets": 4, "reps": 10 }
  ]
}


STEP 9: 📊 BACKEND PROCESSES (Laravel)
──────────────────────────────────────────────────────────────
Backend receives the request:

1. Middleware auth:api verifies JWT
   ✅ Valid token, user_id = 1

2. Route to WorkoutController@store

3. Data validation:
   ✓ name: required, min 3 characters
   ✓ description: optional
   ✓ difficulty: in [beginner, intermediate, advanced]
   ✓ exercises: array required

4. Database creation:
   INSERT INTO workouts (user_id, name, description, difficulty)
   VALUES (1, 'Morning Routine', 'Quick 30min workout', 'intermediate')

   INSERT INTO workout_exercise (workout_id, exercise_id, sets, reps)
   VALUES (42, 5, 3, 12), (42, 12, 4, 10)

5. JSON Response:


STEP 10: 📥 FRONTEND RECEIVES RESPONSE
──────────────────────────────────────────────────────────────
Service receives:

HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 42,
  "user_id": 1,
  "name": "Morning Routine",
  "description": "Quick 30min workout",
  "difficulty": "intermediate",
  "created_at": "2025-11-04T10:30:00Z",
  "exercises": [
    {
      "id": 5,
      "name": "Push-ups",
      "pivot": { "sets": 3, "reps": 12 }
    },
    {
      "id": 12,
      "name": "Squats",
      "pivot": { "sets": 4, "reps": 10 }
    }
  ]
}


STEP 11: 🔄 CACHE UPDATE
──────────────────────────────────────────────────────────────
Service updates the BehaviorSubject:

const current = this.workoutsSubject.value;  // [workout1, workout2]
const updated = [...current, createdWorkout];  // [workout1, workout2, workout42]
this.workoutsSubject.next(updated);

Result:
  All components subscribed to workouts$ receive the updated list!


STEP 12: 🚏 AUTOMATIC NAVIGATION
──────────────────────────────────────────────────────────────
In the subscribe next():

this.router.navigate(['/workouts', createdWorkout.id]);
// Redirects to: /workouts/42

Router loads WorkoutPlanDetailComponent


STEP 13: 📄 DETAIL PAGE DISPLAYS
──────────────────────────────────────────────────────────────
WorkoutPlanDetailComponent:

ngOnInit() {
  const id = this.route.snapshot.params['id'];  // 42

  this.workoutService.getWorkout(id).subscribe(workout => {
    this.workout = workout;
  });
}

Template shows:
  ✅ Workout name: "Morning Routine"
  ✅ Description: "Quick 30min workout"
  ✅ Difficulty: Intermediate
  ✅ Exercises list:
     - Push-ups: 3 sets × 12 reps
     - Squats: 4 sets × 10 reps


STEP 14: 🎉 USER SEES RESULT
──────────────────────────────────────────────────────────────
User is now on /workouts/42 page seeing their newly created
program with all details!

Total time: ~500ms from click to display
```

### 📊 Summary Diagram

```
USER CLICK
   ↓
Component (detect event)
   ↓
Router (change URL)
   ↓
New Component (initialize)
   ↓
User fills form
   ↓
Component calls Service
   ↓
Service makes HTTP call
   ↓
Interceptor adds JWT token
   ↓
Request sent to Backend
   ↓
Backend processes & responds
   ↓
Service receives response
   ↓
Service updates BehaviorSubject cache
   ↓
All subscribed components auto-update
   ↓
Router navigates to detail page
   ↓
Detail Component displays
   ↓
USER SEES RESULT
```

---

<a name="7-authentication"></a>
## 7. Authentication System

The authentication system is at the **core** of the application. Here's how it works in detail.

### 🔐 JWT (JSON Web Token) Architecture

```
┌────────────────────────────────────────────────────────────┐
│           JWT AUTHENTICATION SYSTEM                        │
└────────────────────────────────────────────────────────────┘

📱 FRONTEND (Angular)                  🖥️ BACKEND (Laravel)
┌──────────────────────┐              ┌────────────────────────┐
│                      │              │                        │
│  LoginComponent      │──1.login────>│  AuthController        │
│  ├─ email            │   (POST)     │  ├─ Verify email      │
│  └─ password         │              │  ├─ Hash password     │
│                      │              │  └─ Generate JWT      │
│                      │              │                        │
│                      │<─2.token─────│  JWT created:         │
│  AuthService         │   (200 OK)   │  {                     │
│  ├─ Store token      │              │   "sub": user_id,     │
│  ├─ Store user       │              │   "exp": timestamp    │
│  └─ Emit event       │              │  }                     │
│                      │              │                        │
│  localStorage        │              │  Database              │
│  ├─ auth_token: JWT  │              │  └─ users table       │
│  └─ current_user: {} │              │                        │
│                      │              │                        │
│  ALL REQUESTS        │──3.request──>│                        │
│      ↓               │   + token    │  Middleware auth:api   │
│  AuthInterceptor     │              │  ├─ Verify JWT        │
│  └─ Adds:            │              │  ├─ Decode payload    │
│    Authorization:    │              │  └─ Load user         │
│    Bearer <token>    │              │                        │
│                      │<─4.data──────│  Protected data        │
└──────────────────────┘              └────────────────────────┘
```

### 🔄 Complete Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│        AUTHENTICATION LIFECYCLE                            │
└────────────────────────────────────────────────────────────┘


📱 FIRST VISIT (user never logged in)
─────────────────────────────────────────────────────────────
1. App starts
   └─> AuthService.initializeAuth()
       └─> localStorage empty
           └─> isAuthenticated = false

2. User visits /dashboard
   └─> AuthGuard checks
       └─> Not logged in → redirect /login

3. User fills login form
   └─> LoginComponent.submit()
       └─> AuthService.login(email, password)
           └─> POST /api/auth/login
               └─> Backend verifies credentials
                   └─> Generates JWT token
                       └─> Returns { token, user }

4. Frontend receives response
   └─> AuthService.saveSession()
       ├─> localStorage.setItem('token', jwt)
       ├─> localStorage.setItem('user', JSON.stringify(user))
       ├─> tokenSubject.next(jwt)
       └─> currentUserSubject.next(user)

5. Automatic redirection
   └─> router.navigate(['/dashboard'])
       └─> AuthGuard authorizes (token present)
           └─> ✅ Dashboard access


🔄 SUBSEQUENT VISIT (user already logged in)
─────────────────────────────────────────────────────────────
1. App starts
   └─> AuthService.initializeAuth()
       ├─> localStorage.getItem('token') → JWT found
       ├─> localStorage.getItem('user') → User found
       ├─> tokenSubject.next(jwt)
       ├─> currentUserSubject.next(user)
       └─> isAuthenticated = true

2. Server verification (optional)
   └─> AuthService.me()
       └─> GET /api/auth/me (with Authorization header)
           └─> Backend verifies JWT
               ├─> Valid → returns updated user
               └─> Invalid/expired → 401 error
                   └─> AuthService.clearSession()
                       └─> Redirect /login

3. Free navigation
   └─> All protected pages accessible


👋 LOGOUT
─────────────────────────────────────────────────────────────
1. User clicks "Logout"
   └─> AuthService.logout()
       ├─> POST /api/auth/logout
       ├─> localStorage.removeItem('token')
       ├─> localStorage.removeItem('user')
       ├─> tokenSubject.next(null)
       ├─> currentUserSubject.next(null)
       └─> router.navigate(['/login'])


⏱️ TOKEN EXPIRATION
─────────────────────────────────────────────────────────────
1. User makes request after expiration
   └─> AuthInterceptor adds expired token
       └─> Backend returns 401 Unauthorized
           └─> ErrorInterceptor detects 401
               └─> AuthService.clearSession()
                   └─> Redirect /login
                   └─> Message: "Session expired"
```

### 💾 localStorage vs sessionStorage

```typescript
┌────────────────────────────────────────────────────────────┐
│              AUTH DATA STORAGE                             │
└────────────────────────────────────────────────────────────┘

localStorage (used in FitnessPro)
─────────────────────────────────────────
✅ Persists after browser close
✅ No expiration date
✅ User stays logged in between sessions
⚠️ Vulnerable to XSS (mitigated by JWT expiration)

Storage:
  localStorage.setItem('fitness_auth_token', token);
  localStorage.setItem('fitness_current_user', JSON.stringify(user));

Reading:
  const token = localStorage.getItem('fitness_auth_token');
  const user = JSON.parse(localStorage.getItem('fitness_current_user'));


sessionStorage (alternative)
─────────────────────────────────────────
✅ More secure (cleared on close)
❌ User logged out if tab closed
❌ Not practical for UX

Usage:
  sessionStorage.setItem('token', token);
```

---

<a name="8-api-communication"></a>
## 8. Frontend-Backend Communication

### 🌐 Communication Architecture

```
┌────────────────────────────────────────────────────────────┐
│           FRONTEND ↔️ BACKEND COMMUNICATION                 │
└────────────────────────────────────────────────────────────┘

FRONTEND (Angular)                    BACKEND (Laravel)
http://localhost:4200                 http://localhost:8000

┌────────────────────┐              ┌──────────────────────┐
│  Component         │              │  Controller          │
│  └─> Service       │              │  └─> process request │
│         ↓          │              │          ↑           │
│  Service           │              │  Middleware          │
│  └─> HttpClient    │──request────>│  ├─> auth:api       │
│         ↓          │   HTTP       │  ├─> cors           │
│  Interceptor       │              │  └─> throttle        │
│  ├─> add JWT       │              │          ↓           │
│  └─> handle error  │              │  Route               │
│         ↓          │              │  └─> api.php         │
│  🌐 INTERNET       │──────────────│          ↓           │
│         ↓          │              │  Controller Method   │
│  Service receives  │<─response────│  ├─> validation     │
│  └─> update state  │   JSON       │  ├─> logic          │
│         ↓          │              │  └─> response        │
│  Component         │              │          ↓           │
│  └─> update UI     │              │  Database Query      │
└────────────────────┘              └──────────────────────┘
```

### 📡 HTTP Request Types

```typescript
// ═══════════════════════════════════════════════════════════
// COMPLETE CRUD (Create, Read, Update, Delete)
// ═══════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private apiUrl = `${environment.apiUrl}/workouts`;

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────
  // 📖 READ - Fetch data
  // ──────────────────────────────────────────────────────

  // GET /api/workouts - Complete list
  getAll(): Observable<Workout[]> {
    return this.http.get<Workout[]>(this.apiUrl);
  }

  // GET /api/workouts/42 - Specific workout
  getById(id: number): Observable<Workout> {
    return this.http.get<Workout>(`${this.apiUrl}/${id}`);
  }

  // GET /api/workouts?difficulty=intermediate - With filters
  getByDifficulty(difficulty: string): Observable<Workout[]> {
    const params = new HttpParams().set('difficulty', difficulty);
    return this.http.get<Workout[]>(this.apiUrl, { params });
  }

  // ──────────────────────────────────────────────────────
  // ✏️ CREATE - Create new data
  // ──────────────────────────────────────────────────────

  // POST /api/workouts
  create(workout: CreateWorkoutDto): Observable<Workout> {
    return this.http.post<Workout>(this.apiUrl, workout);
  }

  // ──────────────────────────────────────────────────────
  // 🔄 UPDATE - Modify existing data
  // ──────────────────────────────────────────────────────

  // PUT /api/workouts/42 - Complete replacement
  update(id: number, workout: UpdateWorkoutDto): Observable<Workout> {
    return this.http.put<Workout>(`${this.apiUrl}/${id}`, workout);
  }

  // PATCH /api/workouts/42 - Partial modification
  partialUpdate(id: number, changes: Partial<Workout>): Observable<Workout> {
    return this.http.patch<Workout>(`${this.apiUrl}/${id}`, changes);
  }

  // ──────────────────────────────────────────────────────
  // 🗑️ DELETE - Remove data
  // ──────────────────────────────────────────────────────

  // DELETE /api/workouts/42
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### ⚠️ Error Handling

```typescript
// ═══════════════════════════════════════════════════════════
// ROBUST ERROR HANDLING
// ═══════════════════════════════════════════════════════════

getWorkout(id: number): Observable<Workout> {
  return this.http.get<Workout>(`${this.apiUrl}/${id}`)
    .pipe(
      // 1️⃣ Automatic retry (temporary network error)
      retry({
        count: 2,             // Retry 2 times
        delay: 1000,          // Wait 1s between attempts
        resetOnSuccess: true
      }),

      // 2️⃣ Timeout (don't wait indefinitely)
      timeout(10000),  // 10 seconds max

      // 3️⃣ Logging for debug
      tap(workout => console.log('✅ Workout loaded:', workout)),

      // 4️⃣ Error handling
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error:', error);

        // Handle based on error type
        if (error.status === 404) {
          throw new Error(`Workout ${id} not found`);
        } else if (error.status === 401) {
          throw new Error('Session expired');
        } else if (error.status === 0) {
          throw new Error('No internet connection');
        } else if (error.status >= 500) {
          throw new Error('Server error');
        }

        throw new Error('An error occurred');
      })
    );
}
```

---

<a name="9-components"></a>
## 9. Main Components Detailed

### 🧩 Anatomy of an Angular Component

An Angular component consists of **3 files**:

```
workout.component/
├── workout.component.ts       # Logic (TypeScript)
├── workout.component.html     # Template (HTML)
└── workout.component.scss     # Styles (SCSS)
```

**Complete example:**

```typescript
// workout.component.ts
// ═══════════════════════════════════════════════════════════

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { WorkoutService } from './workout.service';
import { Workout } from '@shared/models/workout.model';

@Component({
  selector: 'app-workout',           // HTML tag: <app-workout>
  templateUrl: './workout.component.html',
  styleUrls: ['./workout.component.scss']
})
export class WorkoutComponent implements OnInit, OnDestroy {

  // ─────────────────────────────────────────────────────────
  // PROPERTIES (Component state)
  // ─────────────────────────────────────────────────────────

  workouts$!: Observable<Workout[]>;    // Data stream
  isLoading = false;                    // Loading state
  errorMessage = '';                    // Error message

  private subscription?: Subscription;  // For cleanup

  // ─────────────────────────────────────────────────────────
  // CONSTRUCTOR (Dependency injection)
  // ─────────────────────────────────────────────────────────

  constructor(
    private workoutService: WorkoutService,
    private router: Router
  ) {
    // Don't initialize ANYTHING here!
    // Use ngOnInit() instead
  }

  // ─────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    // ✅ Called when component is initialized
    console.log('🔄 WorkoutComponent initialized');

    // Subscribe to data stream
    this.workouts$ = this.workoutService.workouts$;

    // Load data
    this.loadWorkouts();
  }

  ngOnDestroy(): void {
    // ✅ Called when component is destroyed
    // Clean up subscriptions to avoid memory leaks
    console.log('🗑️ WorkoutComponent destroyed');
    this.subscription?.unsubscribe();
  }

  // ─────────────────────────────────────────────────────────
  // METHODS (Component actions)
  // ─────────────────────────────────────────────────────────

  loadWorkouts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.workoutService.loadWorkouts().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Loading error';
        console.error(error);
      }
    });
  }

  createWorkout(): void {
    this.router.navigate(['/workouts/create']);
  }

  deleteWorkout(id: number): void {
    if (confirm('Delete this program?')) {
      this.workoutService.delete(id).subscribe({
        next: () => this.loadWorkouts(),
        error: (error) => alert('Deletion error')
      });
    }
  }
}
```

```html
<!-- workout.component.html -->
<!-- ═══════════════════════════════════════════════════════════ -->

<div class="workout-container">
  <!-- Loading state -->
  <div *ngIf="isLoading" class="loading">
    Loading workouts...
  </div>

  <!-- Error state -->
  <div *ngIf="errorMessage" class="error">
    {{ errorMessage }}
  </div>

  <!-- Success state -->
  <div *ngIf="workouts$ | async as workouts">
    <div *ngFor="let workout of workouts" class="workout-card">
      <h3>{{ workout.name }}</h3>
      <p>{{ workout.description }}</p>
      <button (click)="deleteWorkout(workout.id)">Delete</button>
    </div>
  </div>

  <!-- Create button -->
  <button (click)="createWorkout()" class="create-btn">
    Create New Workout
  </button>
</div>
```

### 🔄 Component Lifecycle Hooks

```typescript
┌────────────────────────────────────────────────────────────┐
│           COMPONENT LIFECYCLE                              │
└────────────────────────────────────────────────────────────┘

constructor()
   ↓
   🏗️ Component instance created
   ⚠️ Don't initialize data here!
   ↓
ngOnInit()
   ↓
   ✅ Component initialized
   ✅ Best place to load data
   ✅ Set up subscriptions
   ↓
ngOnDestroy()
   ↓
   🗑️ Component about to be destroyed
   ✅ Clean up subscriptions
   ✅ Remove event listeners
```

---

<a name="10-services"></a>
## 10. Services and State Management

### 🧠 Services with BehaviorSubject

Services manage the application's **state** and **business logic**.

```typescript
// ═══════════════════════════════════════════════════════════
// WORKOUT SERVICE - Complete example
// ═══════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private apiUrl = `${environment.apiUrl}/workouts`;

  // ─────────────────────────────────────────────────────────
  // STATE (private BehaviorSubjects)
  // ─────────────────────────────────────────────────────────

  private workoutsSubject = new BehaviorSubject<Workout[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // PUBLIC OBSERVABLES (read-only streams)
  // ─────────────────────────────────────────────────────────

  workouts$ = this.workoutsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────────────────
  // PUBLIC METHODS (actions)
  // ─────────────────────────────────────────────────────────

  loadWorkouts(): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<Workout[]>(this.apiUrl).pipe(
      tap(workouts => {
        console.log('✅ Workouts loaded:', workouts.length);
        this.workoutsSubject.next(workouts);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('❌ Error loading workouts:', error);
        this.errorSubject.next('Failed to load workouts');
        this.loadingSubject.next(false);
        return throwError(() => error);
      }),
      map(() => void 0)
    );
  }

  createWorkout(workout: CreateWorkoutDto): Observable<Workout> {
    return this.http.post<Workout>(this.apiUrl, workout).pipe(
      tap(created => {
        // Update local cache
        const current = this.workoutsSubject.value;
        this.workoutsSubject.next([...current, created]);
      })
    );
  }

  deleteWorkout(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove from local cache
        const current = this.workoutsSubject.value;
        const updated = current.filter(w => w.id !== id);
        this.workoutsSubject.next(updated);
      })
    );
  }
}
```

### 📊 BehaviorSubject Pattern

```
┌────────────────────────────────────────────────────────────┐
│           BEHAVIORSUBJECT PATTERN                          │
└────────────────────────────────────────────────────────────┘

SERVICE (Single source of truth)
┌─────────────────────────┐
│  private workoutsSubject│  ← Stores current state
│  = new BehaviorSubject  │
│  ([])                   │
│                         │
│  public workouts$       │  ← Read-only stream
│  = subject.asObservable()│
└─────────────────────────┘
         │
         │ Emits updates
         ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Component A    │  │  Component B    │  │  Component C    │
│  subscribes     │  │  subscribes     │  │  subscribes     │
│                 │  │                 │  │                 │
│  workouts$      │  │  workouts$      │  │  workouts$      │
│  | async        │  │  | async        │  │  | async        │
└─────────────────┘  └─────────────────┘  └─────────────────┘

ALL components automatically receive the same data!
```

**Advantages:**
- ✅ Single source of truth
- ✅ Automatic synchronization
- ✅ All components always in sync
- ✅ Easy to test
- ✅ Memory leak prevention (with async pipe)

---

<a name="11-routing"></a>
## 11. Routing and Navigation

### 🛣️ Route Parameters

```typescript
// ═══════════════════════════════════════════════════════════
// READING ROUTE PARAMETERS
// ═══════════════════════════════════════════════════════════

export class WorkoutDetailComponent implements OnInit {
  workout$!: Observable<Workout>;

  constructor(
    private route: ActivatedRoute,
    private workoutService: WorkoutService
  ) {}

  ngOnInit() {
    // ─────────────────────────────────────────────────────
    // ROUTE PARAMS
    // ─────────────────────────────────────────────────────

    // URL: /workouts/42
    this.workout$ = this.route.params.pipe(
      switchMap(params => {
        const id = +params['id'];
        return this.workoutService.getWorkout(id);
      })
    );

    // ✅ Automatically cancels previous request
    // ✅ No need to unsubscribe (async pipe does it)

    // ─────────────────────────────────────────────────────
    // QUERY PARAMS
    // ─────────────────────────────────────────────────────

    // URL: /workouts?search=cardio&page=2
    this.route.queryParams.subscribe(params => {
      const search = params['search'];  // "cardio"
      const page = +params['page'];     // 2
    });
  }
}
```

### 🔗 Template Navigation

```html
<!-- ══════════════════════════════════════════════════════ -->
<!-- NAVIGATION WITH routerLink                             -->
<!-- ══════════════════════════════════════════════════════ -->

<!-- Simple -->
<a routerLink="/dashboard">Dashboard</a>

<!-- With parameters -->
<a [routerLink]="['/workouts', workout.id]">View</a>
<!-- Result: /workouts/42 -->

<!-- With query params -->
<a
  [routerLink]="['/workouts']"
  [queryParams]="{ search: 'cardio', page: 1 }">
  Search
</a>
<!-- Result: /workouts?search=cardio&page=1 -->

<!-- Relative -->
<a routerLink="../list">Back</a>

<!-- Active class -->
<a
  routerLink="/dashboard"
  routerLinkActive="active"
  [routerLinkActiveOptions]="{ exact: true }">
  Dashboard
</a>

<!-- CSS style applied when route is active -->
<style>
  a.active {
    color: blue;
    font-weight: bold;
  }
</style>
```

---

<a name="12-guards-interceptors"></a>
## 12. Guards and Interceptors

### 🛡️ Guards (Route Protection)

**Guards** protect access to routes.

```typescript
// ═══════════════════════════════════════════════════════════
// AUTH GUARD - Protected route protection
// ═══════════════════════════════════════════════════════════

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Checking for', state.url);

  // Check if user is logged in
  if (authService.isAuthenticated) {
    console.log('✅ AuthGuard: Access granted');
    return true;  // ✅ Allow access
  }

  // ❌ Not logged in, redirect to login
  console.warn('🚫 AuthGuard: Access denied, redirecting to login');

  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }  // Save destination
  });

  return false;  // ❌ Block access
};

// ─────────────────────────────────────────────────────────
// Usage in routes
// ─────────────────────────────────────────────────────────

{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]  // ✅ Protected route
}
```

```typescript
// ═══════════════════════════════════════════════════════════
// GUEST GUARD - Redirect if already logged in
// ═══════════════════════════════════════════════════════════

export const GuestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already logged in, redirect to dashboard
  if (authService.isAuthenticated) {
    console.log('🔄 GuestGuard: Already logged in, redirecting to dashboard');
    router.navigate(['/dashboard']);
    return false;
  }

  // Not logged in, allow access to login/register
  return true;
};

// ─────────────────────────────────────────────────────────
// Usage
// ─────────────────────────────────────────────────────────

{
  path: 'login',
  component: LoginComponent,
  canActivate: [GuestGuard]  // ✅ Redirect if already logged in
}
```

### 🔌 Interceptors (HTTP Middleware)

**Interceptors** transform all HTTP requests.

```typescript
// ═══════════════════════════════════════════════════════════
// AUTH INTERCEPTOR - Automatic JWT token injection
// ═══════════════════════════════════════════════════════════

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  console.log('🔌 AuthInterceptor:', req.method, req.url);

  // Get the token
  const token = authService.token;

  // If no token, continue without modification
  if (!token) {
    console.log('  ⚠️ No token');
    return next(req);
  }

  // Clone request and add token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('  ✅ Token added');

  // Continue with modified request
  return next(authReq);
};

// ─────────────────────────────────────────────────────────
// Configuration in app.config.ts
// ─────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])  // ✅ Globally enabled
    )
  ]
};

// Now ALL HTTP requests will have the token!
```

```typescript
// ═══════════════════════════════════════════════════════════
// ERROR INTERCEPTOR - Global error handling
// ═══════════════════════════════════════════════════════════

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ HTTP Error:', error);

      // Handle based on error code
      switch (error.status) {
        case 401:
          // Invalid/expired token
          console.warn('🔒 401 Unauthorized - Logging out');
          authService.logout();
          router.navigate(['/login']);
          break;

        case 403:
          // Forbidden access
          console.warn('🚫 403 Forbidden');
          router.navigate(['/forbidden']);
          break;

        case 404:
          // Resource not found
          console.warn('🔍 404 Not Found');
          break;

        case 500:
          // Server error
          console.error('💥 500 Server Error');
          // Display global message
          break;

        case 0:
          // Network error
          console.error('🌐 Network Error');
          // Display "No connection" message
          break;
      }

      // Re-throw error so components can handle it
      return throwError(() => error);
    })
  );
};
```

---

<a name="13-styling"></a>
## 13. Styling and Design System

### 🎨 SCSS Organization

```
styles/
├── _variables.scss    # Variables (colors, sizes)
├── _mixins.scss       # Reusable mixins
├── _reset.scss        # CSS reset
└── _utilities.scss    # Utility classes
```

```scss
// ═══════════════════════════════════════════════════════════
// _variables.scss - Single source of truth
// ═══════════════════════════════════════════════════════════

// Primary colors
$primary-color: #21bf73;      // Main green
$secondary-color: #8b5cf6;    // Purple
$success-color: #10b981;      // Success green
$danger-color: #ef4444;       // Red
$warning-color: #f59e0b;      // Orange

// Text colors
$gray-900: #111827;
$gray-800: #1f2937;
$gray-700: #374151;
$gray-600: #4b5563;
$gray-500: #6b7280;
$gray-400: #9ca3af;
$gray-300: #d1d5db;
$gray-200: #e5e7eb;
$gray-100: #f3f4f6;

// Spacing (base 4px)
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px

// Typography
$font-family: 'Inter', -apple-system, sans-serif;
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px

// Border radius
$border-radius-sm: 0.375rem;  // 6px
$border-radius: 0.75rem;      // 12px
$border-radius-lg: 1rem;      // 16px

// Shadows
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

// Responsive breakpoints
$breakpoint-sm: 640px;   // Mobile
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Desktop
$breakpoint-xl: 1280px;  // Large desktop
```

```scss
// ═══════════════════════════════════════════════════════════
// _mixins.scss - Reusable styles
// ═══════════════════════════════════════════════════════════

// Responsive breakpoints
@mixin respond-to($breakpoint) {
  @media (min-width: $breakpoint) {
    @content;
  }
}

// Usage:
.sidebar {
  width: 100%;

  @include respond-to($breakpoint-md) {
    width: 250px;
  }
}

// Card style
@mixin card {
  background: white;
  border-radius: $border-radius;
  box-shadow: $shadow;
  padding: $spacing-lg;
  transition: all 0.2s;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }
}

// Flexbox center
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Truncate text
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Button base
@mixin button-base {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  border: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}
```

### 📱 Responsive Design

```scss
// ═══════════════════════════════════════════════════════════
// RESPONSIVE PATTERNS
// ═══════════════════════════════════════════════════════════

// Mobile-first approach (recommended)
.container {
  // Mobile styles by default
  padding: 1rem;

  // Tablet and up
  @include respond-to($breakpoint-md) {
    padding: 2rem;
  }

  // Desktop and up
  @include respond-to($breakpoint-lg) {
    padding: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}

// Responsive grid
.grid {
  display: grid;
  gap: 1rem;

  // Mobile: 1 column
  grid-template-columns: 1fr;

  // Tablet: 2 columns
  @include respond-to($breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
  }

  // Desktop: 3 columns
  @include respond-to($breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

<a name="14-build-deployment"></a>
## 14. Build and Deployment

### 🏗️ Production Build

```bash
# Optimized build for production
ng build

# Or with npm
npm run build

# What happens:
# 1. TypeScript compilation → JavaScript
# 2. SCSS compilation → CSS
# 3. AOT (Ahead-of-Time) compilation
# 4. Tree shaking (unused code removal)
# 5. Minification
# 6. Gzip/brotli compression
# 7. Source maps generation

# Output in: dist/frontend/
```

### ▲ Vercel Deployment

```bash
# 1️⃣ Install Vercel CLI
npm install -g vercel

# 2️⃣ Login
vercel login

# 3️⃣ Deployment
vercel

# 4️⃣ Production
vercel --prod
```

**Vercel Configuration** (`vercel.json`):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/frontend/browser"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 🔧 Build Optimizations

```json
// angular.json - Optimized build configuration

{
  "configurations": {
    "production": {
      "optimization": true,          // ✅ Optimizations enabled
      "outputHashing": "all",        // ✅ Cache busting
      "sourceMap": false,            // ❌ No source maps
      "namedChunks": false,          // ❌ Anonymous chunks
      "aot": true,                   // ✅ AOT compilation
      "extractLicenses": true,
      "buildOptimizer": true,        // ✅ Build optimizer
      "budgets": [                   // ⚠️ Size limits
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        }
      ]
    }
  }
}
```

---

<a name="15-development"></a>
## 15. Development and Best Practices

### 📝 Naming Conventions

```typescript
// ═══════════════════════════════════════════════════════════
// TYPESCRIPT/ANGULAR CONVENTIONS
// ═══════════════════════════════════════════════════════════

// Files
workout.component.ts          // ✅ kebab-case
workoutService.ts             // ❌ Not good
workout-service.ts            // ✅ Correct

// Classes
export class WorkoutComponent  // ✅ PascalCase
export class workoutService    // ❌ Not good

// Variables and functions
const workoutCount = 10;       // ✅ camelCase
const WorkoutCount = 10;       // ❌ Not good

// Constants
const API_URL = '...';         // ✅ UPPER_SNAKE_CASE
const MAX_RETRIES = 3;         // ✅ Correct

// Interfaces
interface Workout { }          // ✅ PascalCase
interface IWorkout { }         // ❌ Avoid I prefix

// Observables
workouts$                      // ✅ $ suffix
workoutsObservable            // ❌ Not needed

// Private
private _count = 0;            // ✅ _ prefix
private count = 0;             // ✅ Also acceptable
```

### ✅ Best Practices

```typescript
// ═══════════════════════════════════════════════════════════
// ANGULAR BEST PRACTICES
// ═══════════════════════════════════════════════════════════

// ✅ Use async pipe (avoids memory leaks)
<div *ngFor="let workout of workouts$ | async">

// ❌ Avoid subscribe in template
<div *ngFor="let workout of workouts">  // Need manual subscribe

// ✅ Unsubscribe in ngOnDestroy
ngOnDestroy() {
  this.subscription.unsubscribe();
}

// ✅ Or use takeUntil
private destroy$ = new Subject<void>();

ngOnInit() {
  this.data$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// ✅ Strong typing
getWorkout(id: number): Observable<Workout> {  // ✅ Explicit types
  return this.http.get<Workout>(`/api/workouts/${id}`);
}

// ❌ any is bad
getWorkout(id: any): any {  // ❌ Avoid any
  return this.http.get(`/api/workouts/${id}`);
}

// ✅ Readonly for non-modifiable properties
readonly API_URL = 'https://api.com';

// ✅ Services as singletons
@Injectable({ providedIn: 'root' })  // ✅ Singleton
export class WorkoutService { }
```

---

<a name="16-troubleshooting"></a>
## 16. Troubleshooting and FAQ

### 🐛 Common Issues

#### ❌ Error: Cannot GET /api/...

**Cause:** Backend API not started or incorrect URL

**Solution:**
```bash
# Verify backend is running
cd backend
php artisan serve

# Check environment.ts
apiUrl: 'http://localhost:8000/api'
```

#### ❌ CORS Errors

**Cause:** Backend CORS configuration

**Solution:** Check `backend/config/cors.php`:
```php
'allowed_origins' => ['http://localhost:4200'],
```

#### ❌ JWT Token expired

**Cause:** Session expired

**Solution:** AuthInterceptor handles automatically, redirects to login

#### ❌ Module not found

**Cause:** Incorrect import

**Solution:**
```typescript
// ❌ Wrong
import { Workout } from '../models/workout';

// ✅ Correct (with @ alias)
import { Workout } from '@shared/models/workout.model';
```

### 💡 Useful Commands

```bash
# Start dev server
ng serve

# Build production
ng build

# Run tests
ng test

# Generate component
ng generate component features/my-component

# Generate service
ng generate service core/services/my-service

# Analyze bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json

# Linter
ng lint
```

### 📚 Resources

- [Angular Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Angular Style Guide](https://angular.io/guide/styleguide)

---

## 🎉 Conclusion

You now have a complete understanding of the FitnessPro frontend!

**Key points:**
- ✅ Layered architecture (Components → Services → API)
- ✅ Reactive state management with RxJS
- ✅ Secure JWT authentication
- ✅ SPA routing and navigation
- ✅ Robust API communication
- ✅ Cohesive design system
- ✅ Angular best practices

---

**Version:** 2.1.0
**Last updated:** November 2025
**Author:** Ivan Petrov


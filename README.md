# 🎨 FitnessPro - Frontend Documentation

> **L'interface utilisateur moderne qui transforme votre expérience fitness** - Une application Angular 19 responsive, rapide et intuitive pour gérer vos entraînements, nutrition et objectifs.

---

## 📚 Table des Matières

- [Vue d'Ensemble](#-vue-densemble)
- [Architecture Expliquée](#-architecture-expliquée)
- [Installation & Configuration](#-installation--configuration)
- [Structure du Projet](#-structure-du-projet)
- [Composants Principaux](#-composants-principaux)
- [Services & État](#-services--état)
- [Cycle de Vie d'une Interaction](#-cycle-de-vie-dune-interaction)
- [Routing & Navigation](#-routing--navigation)
- [Authentification Frontend](#-authentification-frontend)
- [Communication avec l'API](#-communication-avec-lapi)
- [Styling & Design](#-styling--design)
- [Développement](#-développement)
- [Build & Déploiement](#-build--déploiement)
- [Dépannage](#-dépannage)

---

## 🎯 Vue d'Ensemble

### Qu'est-ce que ce Frontend ?

Ce frontend est **l'interface visuelle** de l'application FitnessPro. Imaginez-le comme la **vitrine d'un magasin** :

- 🖼️ Il **affiche les données** de manière attrayante et organisée
- 🖱️ Il **capture les interactions** utilisateur (clics, formulaires, navigation)
- 📡 Il **communique avec le backend** pour récupérer et envoyer des données
- 🎭 Il **gère l'état** de l'application (utilisateur connecté, données en cache, etc.)
- 🚀 Il offre une **expérience fluide** avec navigation instantanée (SPA)

### Technologies Principales

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🅰️ Angular 19       Framework SPA moderne            │
│  📘 TypeScript 5.7    Langage typé (JavaScript++)     │
│  🎨 SCSS              CSS avec superpuissances         │
│  📡 RxJS              Programmation réactive           │
│  🔀 Angular Router    Navigation SPA                   │
│  🌐 HttpClient        Communication HTTP               │
│  ▲ Vercel             Plateforme de déploiement       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Capacités du Frontend

- ✅ **SPA (Single Page Application)** - Navigation instantanée sans rechargement
- ✅ **Responsive Design** - S'adapte à tous les écrans (mobile, tablette, desktop)
- ✅ **Authentification JWT** - Connexion sécurisée avec gestion de session
- ✅ **Gestion d'État Réactive** - RxJS Observables pour données temps réel
- ✅ **Route Guards** - Protection des pages authentifiées
- ✅ **HTTP Interceptors** - Gestion automatique des tokens et erreurs
- ✅ **Lazy Loading** - Chargement optimisé des modules à la demande
- ✅ **Offline Support** - Fonctionnalités de base en mode hors ligne
- ✅ **Performance** - Build optimisé avec tree-shaking et compression

---

## 🏗️ Architecture Expliquée

### Architecture d'une SPA (Single Page Application)

Une SPA charge une seule page HTML initiale, puis met à jour dynamiquement le contenu sans rechargement complet :

```
┌────────────────────────────────────────────────────────────────┐
│              ARCHITECTURE ANGULAR SPA                          │
└────────────────────────────────────────────────────────────────┘

🌐 NAVIGATEUR
   │
   ├─ index.html                    ← Seule page HTML chargée
   │   └─ <app-root></app-root>    ← Point d'entrée Angular
   │
   ├─ main.ts                       ← Bootstrap de l'application
   │   └─ bootstrapApplication(AppComponent)
   │
   └─ Angular Application Runtime
       │
       ├─ 📦 MODULES & COMPONENTS
       │   ├─ AppComponent (racine)
       │   ├─ HeaderComponent
       │   ├─ SidebarComponent
       │   ├─ DashboardComponent
       │   ├─ WorkoutComponent
       │   └─ ... autres composants
       │
       ├─ 🚏 ROUTER
       │   ├─ /login         → LoginComponent
       │   ├─ /dashboard     → DashboardComponent (protégé)
       │   ├─ /workouts      → WorkoutComponent (protégé)
       │   └─ /exercises     → ExerciseComponent (protégé)
       │
       ├─ 🔧 SERVICES
       │   ├─ AuthService    → Gestion authentification
       │   ├─ WorkoutService → API workouts
       │   ├─ ExerciseService→ API exercises
       │   └─ UserService    → API utilisateur
       │
       ├─ 🛡️ GUARDS
       │   ├─ AuthGuard      → Vérifie authentification
       │   └─ GuestGuard     → Pages publiques uniquement
       │
       └─ 📡 INTERCEPTORS
           ├─ AuthInterceptor    → Ajoute token JWT
           └─ ErrorInterceptor   → Gère erreurs HTTP


┌────────────────────────────────────────────────────────────────┐
│            FLUX DE DONNÉES (Data Flow)                         │
└────────────────────────────────────────────────────────────────┘

    USER INTERACTION                    COMPONENT
         │                                  │
         │ 1. Click button                  │
         ▼                                  │
    ┌──────────────┐                       │
    │   EVENT      │                       │
    │  (click)     │                       │
    └──────┬───────┘                       │
           │                                │
           │ 2. Call method                 │
           ▼                                │
    ┌─────────────────────────────────────────┐
    │        COMPONENT.TS                     │
    │  onSubmit() {                           │
    │    this.workoutService.create(data)     │
    │  }                                      │
    └──────┬──────────────────────────────────┘
           │
           │ 3. Call service method
           ▼
    ┌─────────────────────────────────────────┐
    │         SERVICE.TS                      │
    │  create(data): Observable {             │
    │    return this.http.post(url, data)     │
    │  }                                      │
    └──────┬──────────────────────────────────┘
           │
           │ 4. HTTP Request
           ▼
    ┌─────────────────────────────────────────┐
    │       HTTP INTERCEPTOR                  │
    │  - Ajoute Authorization header          │
    │  - Ajoute Content-Type                  │
    └──────┬──────────────────────────────────┘
           │
           │ 5. Send to backend
           ▼
    ╔═════════════════════════════════════════╗
    ║         BACKEND API                     ║
    ║  POST /api/workouts                     ║
    ╚══════┬══════════════════════════════════╝
           │
           │ 6. Response
           ▼
    ┌─────────────────────────────────────────┐
    │       HTTP INTERCEPTOR                  │
    │  - Vérifie statut (200, 401, etc.)      │
    │  - Gère erreurs                         │
    └──────┬──────────────────────────────────┘
           │
           │ 7. Return Observable
           ▼
    ┌─────────────────────────────────────────┐
    │        SERVICE.TS                       │
    │  .pipe(                                 │
    │    map(response => response.data),      │
    │    tap(data => cache.update(data))      │
    │  )                                      │
    └──────┬──────────────────────────────────┘
           │
           │ 8. Subscribe in component
           ▼
    ┌─────────────────────────────────────────┐
    │        COMPONENT.TS                     │
    │  .subscribe(workout => {                │
    │    this.workouts.push(workout);         │
    │    this.showSuccess();                  │
    │  })                                     │
    └──────┬──────────────────────────────────┘
           │
           │ 9. Update view
           ▼
    ┌─────────────────────────────────────────┐
    │        COMPONENT.HTML                   │
    │  <div *ngFor="let w of workouts">       │
    │    {{ w.name }}                         │
    │  </div>                                 │
    └─────────────────────────────────────────┘
           │
           │ 10. Re-render DOM
           ▼
    ┌─────────────────────────────────────────┐
    │           BROWSER DOM                   │
    │  Updated UI visible to user             │
    └─────────────────────────────────────────┘
```

### Pattern de Composants Angular

Chaque composant Angular est composé de 3-4 fichiers :

```
workout.component/
├── workout.component.ts       # 🧠 Logique TypeScript
├── workout.component.html     # 🖼️ Template HTML
├── workout.component.scss     # 🎨 Styles SCSS
└── workout.component.spec.ts  # 🧪 Tests unitaires (optionnel)
```

**Exemple de Composant Complet** :

**workout.component.ts** (Logique) :
```typescript
import { Component, OnInit } from '@angular/core';
import { WorkoutService } from '@services/workout.service';
import { Workout } from '@models/workout.interface';

@Component({
  selector: 'app-workout',        // Balise HTML: <app-workout></app-workout>
  templateUrl: './workout.component.html',
  styleUrls: ['./workout.component.scss']
})
export class WorkoutComponent implements OnInit {
  // 📊 État du composant
  workouts: Workout[] = [];
  loading: boolean = false;
  error: string | null = null;

  // 💉 Injection de dépendances
  constructor(private workoutService: WorkoutService) {}

  // 🔄 Lifecycle hook - appelé à l'initialisation
  ngOnInit(): void {
    this.loadWorkouts();
  }

  // 📡 Méthodes d'interaction avec l'API
  loadWorkouts(): void {
    this.loading = true;
    this.workoutService.getWorkouts().subscribe({
      next: (data) => {
        this.workouts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load workouts';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  // 🎯 Méthode appelée depuis le template
  createWorkout(name: string): void {
    const newWorkout = { name, is_template: true };
    this.workoutService.createWorkout(newWorkout).subscribe({
      next: (workout) => {
        this.workouts.push(workout);
        alert('Workout created!');
      },
      error: (err) => console.error('Error:', err)
    });
  }
}
```

**workout.component.html** (Template) :
```html
<!-- 🔄 Affichage conditionnel avec *ngIf -->
<div *ngIf="loading" class="loading-spinner">
  Chargement...
</div>

<!-- ⚠️ Affichage d'erreur -->
<div *ngIf="error" class="error-message">
  {{ error }}
</div>

<!-- 📋 Liste avec *ngFor -->
<div *ngIf="!loading && !error" class="workout-list">
  <h2>Mes Entraînements</h2>

  <div *ngFor="let workout of workouts" class="workout-card">
    <h3>{{ workout.name }}</h3>
    <p>{{ workout.description }}</p>
    <span class="badge">{{ workout.exercises?.length }} exercices</span>
  </div>

  <!-- 📝 Formulaire avec binding bidirectionnel -->
  <div class="create-form">
    <input
      type="text"
      #workoutName
      placeholder="Nom du workout"
    />
    <button (click)="createWorkout(workoutName.value)">
      Créer
    </button>
  </div>
</div>
```

**workout.component.scss** (Styles) :
```scss
:host {
  display: block;
  padding: 2rem;
}

.loading-spinner {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.workout-list {
  .workout-card {
    background: white;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    h3 {
      margin: 0 0 0.5rem;
      color: #333;
    }

    .badge {
      background: #4CAF50;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
    }
  }
}

.create-form {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #4CAF50;
    }
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;

    &:hover {
      background: #45a049;
    }
  }
}
```

---

## 🚀 Installation & Configuration

### Prérequis

```bash
# 1. Node.js 18+ (LTS recommandé)
node --version
# Doit afficher: v18.x.x ou plus

# 2. npm 9+
npm --version
# Doit afficher: 9.x.x ou plus

# 3. Angular CLI 19+
npm install -g @angular/cli
ng version
# Doit afficher: Angular CLI: 19.x.x
```

### Installation Étape par Étape

#### 1️⃣ Installer les Dépendances

```bash
# Se déplacer dans le dossier frontend
cd frontend

# Installer toutes les dépendances NPM
npm install
# Cela télécharge tous les packages dans node_modules/
# Durée: 2-5 minutes selon votre connexion
```

#### 2️⃣ Configurer les Environnements

**Environnement de Développement** ([src/environments/environment.ts](src/environments/environment.ts:1)) :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',    // Backend local
  appName: 'FitnessPro',
  appVersion: '1.0.0-dev',
  enableDebug: true,                       // Logs détaillés
  requestTimeout: 30000,                   // 30 secondes
  tokenKey: 'fitness_token',               // Clé localStorage
  userKey: 'fitness_user'
};
```

**Environnement de Production** ([src/environments/environment.production.ts](src/environments/environment.production.ts:1)) :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://fitness-pro-backend.fly.dev/api',  // Backend production
  appName: 'FitnessPro',
  appVersion: '1.0.0',
  enableDebug: false,                      // Pas de logs en production
  requestTimeout: 30000,
  tokenKey: 'fitness_token',
  userKey: 'fitness_user'
};
```

#### 3️⃣ Lancer le Serveur de Développement

```bash
# Option 1: Commande standard
npm start
# ou
ng serve

# Option 2: Port personnalisé
ng serve --port 4200

# Option 3: Ouvrir automatiquement dans le navigateur
ng serve --open

# Option 4: Avec proxy pour contourner CORS
ng serve --proxy-config proxy.conf.json
```

**Configuration Proxy** (optionnel) - [proxy.conf.json](proxy.conf.json:1) :

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Avec cette configuration, les requêtes vers `/api/*` sont automatiquement redirigées vers `http://localhost:8000/api/*`.

#### 4️⃣ Accéder à l'Application

Une fois le serveur démarré :

```
✅ Compilation réussie!

** Angular Live Development Server is listening on localhost:4200 **

  Local:   http://localhost:4200
  Network: http://192.168.1.10:4200

  Compiled successfully in 3.2s
  ➜ Press h to show help
```

Ouvrez votre navigateur à : **http://localhost:4200**

---

## 📁 Structure du Projet

```
frontend/src/
│
├── index.html                    # 📄 Page HTML unique
├── main.ts                       # 🚀 Point d'entrée de l'app
├── styles.scss                   # 🎨 Styles globaux
│
├── app/                          # 📦 Application principale
│   ├── app.component.ts          # 🏠 Composant racine
│   ├── app.component.html        # 🖼️ Template racine
│   ├── app.component.scss        # 🎨 Styles racine
│   ├── app.routes.ts             # 🚏 Configuration routing
│   ├── app.config.ts             # ⚙️ Configuration app
│   │
│   ├── auth/                     # 🔐 Module authentification
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   ├── register/
│   │   └── reset-password/
│   │
│   ├── dashboard/                # 📊 Module tableau de bord
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   ├── dashboard.component.scss
│   │   └── widgets/              # Composants enfants
│   │       ├── stats-card/
│   │       ├── workout-summary/
│   │       └── nutrition-overview/
│   │
│   ├── exercises/                # 💪 Module exercices
│   │   ├── exercise-list/
│   │   │   ├── exercise-list.component.ts
│   │   │   ├── exercise-list.component.html
│   │   │   └── exercise-list.component.scss
│   │   ├── exercise-detail/
│   │   ├── exercise-search/
│   │   └── exercise-filters/
│   │
│   ├── workout/                  # 🏋️ Module entraînements
│   │   ├── workout-list/
│   │   ├── workout-detail/
│   │   ├── workout-session/      # Session active
│   │   ├── workout-history/
│   │   └── workout-builder/      # Création de templates
│   │
│   ├── nutrition/                # 🍎 Module nutrition
│   │   ├── nutrition-diary/
│   │   ├── meal-entry/
│   │   ├── nutrition-goals/
│   │   └── nutrition-stats/
│   │
│   ├── goals/                    # 🎯 Module objectifs
│   │   ├── goal-list/
│   │   ├── goal-create/
│   │   ├── goal-progress/
│   │   └── achievements/
│   │
│   ├── profile/                  # 👤 Module profil
│   │   ├── profile-view/
│   │   ├── profile-edit/
│   │   ├── settings/
│   │   └── progress-photos/
│   │
│   ├── shared/                   # 🔄 Composants partagés
│   │   ├── components/
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   ├── footer/
│   │   │   ├── loading-spinner/
│   │   │   ├── error-message/
│   │   │   ├── confirmation-dialog/
│   │   │   └── notification/
│   │   │
│   │   ├── directives/           # Directives custom
│   │   │   ├── auto-focus.directive.ts
│   │   │   └── click-outside.directive.ts
│   │   │
│   │   ├── pipes/                # Pipes custom
│   │   │   ├── time-ago.pipe.ts
│   │   │   ├── duration.pipe.ts
│   │   │   └── safe-html.pipe.ts
│   │   │
│   │   └── validators/           # Validateurs custom
│   │       ├── password-strength.validator.ts
│   │       └── email.validator.ts
│   │
│   ├── core/                     # 🎯 Fonctionnalités core
│   │   ├── services/             # 🔧 Services principaux
│   │   │   ├── auth.service.ts
│   │   │   ├── workout.service.ts
│   │   │   ├── exercise.service.ts
│   │   │   ├── nutrition.service.ts
│   │   │   ├── goal.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── notification.service.ts
│   │   │
│   │   ├── guards/               # 🛡️ Route guards
│   │   │   ├── auth.guard.ts
│   │   │   └── guest.guard.ts
│   │   │
│   │   ├── interceptors/         # 📡 HTTP interceptors
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── loading.interceptor.ts
│   │   │
│   │   └── models/               # 📋 Interfaces TypeScript
│   │       ├── user.interface.ts
│   │       ├── workout.interface.ts
│   │       ├── exercise.interface.ts
│   │       ├── goal.interface.ts
│   │       ├── meal-entry.interface.ts
│   │       └── api-response.interface.ts
│   │
│   └── constants/                # 📌 Constantes
│       ├── app-config.ts
│       ├── api-endpoints.ts
│       └── regex-patterns.ts
│
├── assets/                       # 📦 Ressources statiques
│   ├── images/
│   │   ├── logo.png
│   │   ├── default-avatar.png
│   │   └── exercise-placeholder.svg
│   ├── icons/
│   │   └── favicon.ico
│   └── i18n/                     # Traductions (si multilingue)
│       ├── en.json
│       └── fr.json
│
└── environments/                 # 🌍 Configurations environnement
    ├── environment.ts            # Développement
    └── environment.production.ts # Production
```

---

## 🧩 Composants Principaux

### 1. AuthComponent - Authentification

**Rôle** : Gérer connexion, inscription, et réinitialisation de mot de passe.

**LoginComponent** ([src/app/auth/login/login.component.ts](src/app/auth/login/login.component.ts:1)) :

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // 📝 Formulaire réactif
  loginForm!: FormGroup;

  // 🔄 État du composant
  loading = false;
  error: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialisation du formulaire avec validations
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  // 🎯 Getter pour accès facile aux champs
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  // 📤 Soumission du formulaire
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const { email, password, rememberMe } = this.loginForm.value;

    this.authService.login(email, password, rememberMe).subscribe({
      next: (response) => {
        console.log('✅ Login successful:', response.user.name);

        // Navigation vers dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.error = err.error?.message || 'Invalid credentials';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // 👁️ Toggle visibilité mot de passe
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
```

**login.component.html** :

```html
<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <img src="assets/images/logo.png" alt="FitnessPro Logo" class="logo" />
      <h1>Bienvenue sur FitnessPro</h1>
      <p>Connectez-vous pour accéder à votre espace</p>
    </div>

    <!-- ⚠️ Message d'erreur -->
    <div *ngIf="error" class="alert alert-error">
      {{ error }}
    </div>

    <!-- 📝 Formulaire -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <!-- Email -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          placeholder="votre@email.com"
          [class.invalid]="email?.invalid && email?.touched"
        />
        <div *ngIf="email?.invalid && email?.touched" class="error-message">
          <span *ngIf="email?.errors?.['required']">Email requis</span>
          <span *ngIf="email?.errors?.['email']">Email invalide</span>
        </div>
      </div>

      <!-- Mot de passe -->
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <div class="password-input-wrapper">
          <input
            id="password"
            [type]="showPassword ? 'text' : 'password'"
            formControlName="password"
            placeholder="••••••••"
            [class.invalid]="password?.invalid && password?.touched"
          />
          <button
            type="button"
            class="toggle-password"
            (click)="togglePasswordVisibility()"
          >
            <i [class]="showPassword ? 'icon-eye-off' : 'icon-eye'"></i>
          </button>
        </div>
        <div *ngIf="password?.invalid && password?.touched" class="error-message">
          <span *ngIf="password?.errors?.['required']">Mot de passe requis</span>
          <span *ngIf="password?.errors?.['minlength']">
            Minimum 8 caractères
          </span>
        </div>
      </div>

      <!-- Se souvenir de moi -->
      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" formControlName="rememberMe" />
          Se souvenir de moi
        </label>
        <a routerLink="/reset-password" class="forgot-password">
          Mot de passe oublié ?
        </a>
      </div>

      <!-- Bouton de soumission -->
      <button
        type="submit"
        class="btn btn-primary"
        [disabled]="loading || loginForm.invalid"
      >
        <span *ngIf="!loading">Se connecter</span>
        <span *ngIf="loading" class="loading-spinner">
          <i class="icon-spinner"></i> Connexion...
        </span>
      </button>
    </form>

    <!-- Lien inscription -->
    <div class="login-footer">
      <p>
        Pas encore de compte ?
        <a routerLink="/register">S'inscrire</a>
      </p>
    </div>
  </div>
</div>
```

### 2. DashboardComponent - Tableau de Bord

**Rôle** : Afficher un aperçu des statistiques utilisateur, workouts récents, objectifs actifs.

**dashboard.component.ts** :

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { WorkoutService } from '@core/services/workout.service';
import { GoalService } from '@core/services/goal.service';
import { NutritionService } from '@core/services/nutrition.service';

interface DashboardStats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  activeGoals: number;
  caloriesConsumedToday: number;
  caloriesGoal: number;
  currentStreak: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // 📊 Données du dashboard
  stats: DashboardStats | null = null;
  recentWorkouts: any[] = [];
  activeGoals: any[] = [];
  nutritionToday: any = null;

  // 🔄 État
  loading = true;
  error: string | null = null;
  userName: string = '';

  // 🧹 Cleanup subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private workoutService: WorkoutService,
    private goalService: GoalService,
    private nutritionService: NutritionService
  ) {}

  ngOnInit(): void {
    // Récupérer le nom de l'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.userName = user?.name || 'Utilisateur';
      });

    // Charger toutes les données en parallèle
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    // Nettoyer les subscriptions pour éviter memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // 🚀 forkJoin = attendre que TOUTES les requêtes se terminent
    forkJoin({
      stats: this.workoutService.getStats(),
      recentWorkouts: this.workoutService.getRecentWorkouts(5),
      activeGoals: this.goalService.getActiveGoals(),
      nutritionToday: this.nutritionService.getDailySummary(new Date())
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.recentWorkouts = data.recentWorkouts;
        this.activeGoals = data.activeGoals;
        this.nutritionToday = data.nutritionToday;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading dashboard:', err);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }

  // 🔄 Rafraîchir les données
  refresh(): void {
    this.loadDashboardData();
  }

  // 📅 Naviguer vers une section spécifique
  navigateToWorkouts(): void {
    // Navigation programmatique
  }

  navigateToGoals(): void {
    // Navigation programmatique
  }
}
```

### 3. ExerciseListComponent - Liste d'Exercices

**Rôle** : Afficher et filtrer la base de données d'exercices.

**exercise-list.component.ts** :

```typescript
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ExerciseService } from '@core/services/exercise.service';
import { Exercise } from '@core/models/exercise.interface';

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  styleUrls: ['./exercise-list.component.scss']
})
export class ExerciseListComponent implements OnInit {
  // 📋 Données
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];

  // 🔍 Filtres
  searchControl = new FormControl('');
  selectedBodyPart: string = 'all';
  selectedEquipment: string = 'all';

  // 📊 Options de filtre
  bodyParts: string[] = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  equipment: string[] = ['all', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];

  // 🔄 État
  loading = false;
  error: string | null = null;

  // 📄 Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;

  constructor(private exerciseService: ExerciseService) {}

  ngOnInit(): void {
    // Charger tous les exercices
    this.loadExercises();

    // 🔍 Recherche avec debounce (attendre 300ms après dernière frappe)
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),            // Attendre 300ms
        distinctUntilChanged(),        // Ignorer si valeur identique
        switchMap(searchTerm =>        // Annuler requête précédente
          this.exerciseService.searchExercises(searchTerm || '')
        )
      )
      .subscribe({
        next: (exercises) => {
          this.filteredExercises = exercises;
        },
        error: (err) => {
          console.error('Search error:', err);
        }
      });
  }

  loadExercises(): void {
    this.loading = true;
    this.exerciseService.getExercises().subscribe({
      next: (data) => {
        this.exercises = data;
        this.filteredExercises = data;
        this.totalItems = data.length;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load exercises';
        this.loading = false;
      }
    });
  }

  // 🔍 Appliquer filtres
  applyFilters(): void {
    this.filteredExercises = this.exercises.filter(exercise => {
      const matchesBodyPart = this.selectedBodyPart === 'all' ||
                              exercise.bodyPart === this.selectedBodyPart;
      const matchesEquipment = this.selectedEquipment === 'all' ||
                               exercise.equipment === this.selectedEquipment;

      return matchesBodyPart && matchesEquipment;
    });
  }

  // 📄 Pagination
  get paginatedExercises(): Exercise[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredExercises.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredExercises.length / this.itemsPerPage);
  }

  // ⭐ Ajouter aux favoris
  toggleFavorite(exercise: Exercise): void {
    this.exerciseService.toggleFavorite(exercise.id).subscribe({
      next: () => {
        exercise.isFavorite = !exercise.isFavorite;
      },
      error: (err) => {
        console.error('Failed to toggle favorite:', err);
      }
    });
  }
}
```

---

## 🔧 Services & État

### Pattern de Services Angular

Les services sont des **singletons** (une seule instance) qui gèrent :
- 📡 Communication avec l'API
- 💾 Gestion d'état (cache)
- 🔄 Logique métier partagée

### AuthService - Gestion d'Authentification

**Responsabilités** :
- Login/Logout
- Stockage du token JWT
- Gestion de l'état utilisateur
- Auto-logout sur expiration

**auth.service.ts** ([src/app/core/services/auth.service.ts](src/app/core/services/auth.service.ts:1)) :

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.interface';
import { ApiResponse } from '@core/models/api-response.interface';

@Injectable({
  providedIn: 'root'  // Singleton au niveau root
})
export class AuthService {
  // 🔐 URL de l'API
  private readonly API_URL = environment.apiUrl;

  // 🔑 Clés localStorage
  private readonly TOKEN_KEY = environment.tokenKey;
  private readonly USER_KEY = environment.userKey;

  // 📡 BehaviorSubject = Observable avec valeur actuelle
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private tokenSubject: BehaviorSubject<string | null>;
  public token$: Observable<string | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialiser avec données stockées (si disponibles)
    const storedUser = localStorage.getItem(this.USER_KEY);
    const storedToken = localStorage.getItem(this.TOKEN_KEY);

    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.tokenSubject = new BehaviorSubject<string | null>(storedToken);
    this.token$ = this.tokenSubject.asObservable();
  }

  // 📊 Getters pour valeur actuelle
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.tokenValue;
  }

  // 🔐 LOGIN
  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    console.log('🔄 AuthService: Attempting login for', email);

    return this.http.post<ApiResponse<any>>(
      `${this.API_URL}/auth/login`,
      { email, password, rememberMe }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Login failed');
      }),
      tap(data => {
        // Stocker token et utilisateur
        this.setSession(data.token, data.user);
        console.log('✅ AuthService: Login successful for', data.user.name);
      }),
      catchError(err => {
        console.error('❌ AuthService: Login failed', err);
        return throwError(() => err);
      })
    );
  }

  // 📝 REGISTER
  register(userData: any): Observable<any> {
    console.log('🔄 AuthService: Registering new user', userData.email);

    return this.http.post<ApiResponse<any>>(
      `${this.API_URL}/auth/register`,
      userData
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Registration failed');
      }),
      tap(data => {
        // Stocker token et utilisateur
        this.setSession(data.token, data.user);
        console.log('✅ AuthService: Registration successful');
      }),
      catchError(err => {
        console.error('❌ AuthService: Registration failed', err);
        return throwError(() => err);
      })
    );
  }

  // 🚪 LOGOUT
  logout(): void {
    console.log('🔄 AuthService: Logging out');

    // Optionnel: Appeler backend pour invalider le token
    if (this.tokenValue) {
      this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe({
        next: () => console.log('✅ Backend logout successful'),
        error: (err) => console.error('⚠️ Backend logout failed', err)
      });
    }

    // Nettoyer le frontend
    this.clearSession();

    // Rediriger vers login
    this.router.navigate(['/login']);
  }

  // 💾 Stocker session
  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);

    // Planifier auto-logout après 24h
    this.scheduleAutoLogout();
  }

  // 🧹 Nettoyer session
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  // ⏰ Auto-logout après expiration
  private scheduleAutoLogout(): void {
    const expirationTime = 24 * 60 * 60 * 1000; // 24 heures
    setTimeout(() => {
      console.log('⏰ Token expired - auto logout');
      this.logout();
    }, expirationTime);
  }

  // 🔄 Refresh user data
  refreshUserData(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`).pipe(
      map(response => {
        if (response.success && response.data) {
          const user = response.data;
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }
        throw new Error('Failed to refresh user data');
      })
    );
  }

  // 🔐 Reset password
  resetPassword(email: string, password: string, passwordConfirmation: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.API_URL}/auth/password/direct-reset`,
      { email, password, password_confirmation: passwordConfirmation }
    ).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Password reset failed');
      })
    );
  }
}
```

### WorkoutService - Gestion des Entraînements

**workout.service.ts** :

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Workout } from '@core/models/workout.interface';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private readonly API_URL = `${environment.apiUrl}/workouts`;

  // 💾 Cache local des workouts
  private workoutsCache = new BehaviorSubject<Workout[]>([]);
  public workouts$ = this.workoutsCache.asObservable();

  constructor(private http: HttpClient) {}

  // 📋 Récupérer tous les workouts
  getWorkouts(): Observable<Workout[]> {
    return this.http.get<any>(`${this.API_URL}`).pipe(
      map(response => response.data || response),
      tap(workouts => {
        // Mettre à jour le cache
        this.workoutsCache.next(workouts);
      })
    );
  }

  // 📋 Récupérer templates
  getTemplates(): Observable<Workout[]> {
    return this.http.get<any>(`${this.API_URL}/templates`).pipe(
      map(response => response.data || response)
    );
  }

  // 🆕 Créer nouveau workout
  createWorkout(workout: Partial<Workout>): Observable<Workout> {
    return this.http.post<any>(`${this.API_URL}/templates`, workout).pipe(
      map(response => response.data),
      tap(newWorkout => {
        // Ajouter au cache
        const current = this.workoutsCache.value;
        this.workoutsCache.next([...current, newWorkout]);
      })
    );
  }

  // ✏️ Mettre à jour workout
  updateWorkout(id: number, workout: Partial<Workout>): Observable<Workout> {
    return this.http.put<any>(`${this.API_URL}/templates/${id}`, workout).pipe(
      map(response => response.data),
      tap(updatedWorkout => {
        // Mettre à jour le cache
        const current = this.workoutsCache.value;
        const index = current.findIndex(w => w.id === id);
        if (index !== -1) {
          current[index] = updatedWorkout;
          this.workoutsCache.next([...current]);
        }
      })
    );
  }

  // 🗑️ Supprimer workout
  deleteWorkout(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/templates/${id}`).pipe(
      tap(() => {
        // Retirer du cache
        const current = this.workoutsCache.value;
        this.workoutsCache.next(current.filter(w => w.id !== id));
      })
    );
  }

  // ▶️ Démarrer session
  startSession(templateId?: number): Observable<Workout> {
    const body = templateId ? { template_id: templateId, date: new Date().toISOString() } : {};
    return this.http.post<any>(`${this.API_URL}/start`, body).pipe(
      map(response => response.data)
    );
  }

  // ✅ Compléter session
  completeSession(id: number, data: any): Observable<Workout> {
    return this.http.post<any>(`${this.API_URL}/logs/${id}/complete`, data).pipe(
      map(response => response.data)
    );
  }

  // 📊 Statistiques
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/stats`).pipe(
      map(response => response.data || response)
    );
  }

  // 📅 Workouts récents
  getRecentWorkouts(limit: number = 5): Observable<Workout[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any>(`${this.API_URL}/logs`, { params }).pipe(
      map(response => response.data || response)
    );
  }
}
```

---

## 🔄 Cycle de Vie d'une Interaction

Comprenons le cycle complet d'une action utilisateur dans une SPA Angular.

### Exemple Concret: Créer un Nouveau Workout

```
┌────────────────────────────────────────────────────────────────┐
│      CYCLE COMPLET: CRÉER UN WORKOUT                           │
└────────────────────────────────────────────────────────────────┘

🔹 ÉTAPE 1: USER INPUT - Utilisateur remplit le formulaire
───────────────────────────────────────────────────────────────
Browser DOM:
  <form [formGroup]="workoutForm" (ngSubmit)="onSubmit()">
    <input formControlName="name" />  ← User types "Push Day"
    <button type="submit">Créer</button>  ← User clicks
  </form>


🔹 ÉTAPE 2: EVENT BINDING - Angular détecte l'événement
───────────────────────────────────────────────────────────────
Angular Change Detection:
  1. Détecte (ngSubmit) event
  2. Appelle la méthode onSubmit() du composant
  3. Passe au contexte TypeScript


🔹 ÉTAPE 3: COMPONENT METHOD - Traitement dans le composant
───────────────────────────────────────────────────────────────
workout-create.component.ts:

onSubmit(): void {
  // 1. Vérifier validité du formulaire
  if (this.workoutForm.invalid) {
    this.workoutForm.markAllAsTouched();
    return;  // Stop ici si invalide
  }

  // 2. Extraire les données
  const workoutData = {
    name: this.workoutForm.value.name,          // "Push Day"
    description: this.workoutForm.value.description,
    is_template: true,
    exercises: this.selectedExercises
  };

  // 3. Activer état de chargement
  this.loading = true;

  // 4. Appeler le service
  this.workoutService.createWorkout(workoutData)
    .subscribe({
      next: (workout) => this.handleSuccess(workout),
      error: (err) => this.handleError(err)
    });
}


🔹 ÉTAPE 4: SERVICE CALL - Service prépare la requête
───────────────────────────────────────────────────────────────
workout.service.ts:

createWorkout(data: Partial<Workout>): Observable<Workout> {
  console.log('🔄 WorkoutService: Creating workout', data.name);

  return this.http.post<ApiResponse<Workout>>(
    `${this.API_URL}/workouts/templates`,
    data
  ).pipe(
    map(response => response.data),
    tap(workout => {
      // Mettre à jour le cache local
      const current = this.workoutsCache.value;
      this.workoutsCache.next([...current, workout]);
    })
  );
}


🔹 ÉTAPE 5: HTTP INTERCEPTOR - Ajoute token d'authentification
───────────────────────────────────────────────────────────────
auth.interceptor.ts:

intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // 1. Récupérer le token
  const token = this.authService.tokenValue;

  // 2. Cloner la requête et ajouter le header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  console.log('📤 HTTP Request:', req.method, req.url);

  // 3. Passer au handler suivant
  return next.handle(req);
}


🔹 ÉTAPE 6: HTTP REQUEST - Envoi vers le backend
───────────────────────────────────────────────────────────────
HttpClient envoie:

POST https://fitness-pro-backend.fly.dev/api/workouts/templates
Headers:
  Authorization: Bearer 1|abcdefghijklmnopqrstuvwxyz1234567890
  Content-Type: application/json
  Accept: application/json
Body:
  {
    "name": "Push Day",
    "description": "Chest, shoulders, triceps",
    "is_template": true,
    "exercises": [...]
  }


🔹 ÉTAPE 7: BACKEND PROCESSING - Traitement serveur
───────────────────────────────────────────────────────────────
Laravel Backend:
  1. Vérifie le token JWT (middleware auth:sanctum)
  2. Route vers WorkoutController@createTemplate
  3. Valide les données
  4. WorkoutService crée le workout en base de données
  5. Retourne la réponse JSON


🔹 ÉTAPE 8: HTTP RESPONSE - Réception de la réponse
───────────────────────────────────────────────────────────────
Backend retourne:

Status: 201 Created
Headers:
  Content-Type: application/json
Body:
  {
    "success": true,
    "data": {
      "id": 42,
      "name": "Push Day",
      "description": "Chest, shoulders, triceps",
      "is_template": true,
      "exercises": [...],
      "created_at": "2025-01-13T15:30:00Z"
    },
    "message": "Workout template created successfully"
  }


🔹 ÉTAPE 9: RXJS OPERATORS - Transformation des données
───────────────────────────────────────────────────────────────
RxJS Pipeline dans le service:

return this.http.post(...).pipe(
  // 1. map: Extraire data du wrapper API
  map(response => {
    console.log('📥 Raw response:', response);
    return response.data;  // Extraire workout
  }),

  // 2. tap: Effet de bord (cache update)
  tap(workout => {
    console.log('✅ Workout created:', workout.name);
    // Mettre à jour le cache
    const current = this.workoutsCache.value;
    this.workoutsCache.next([...current, workout]);
  }),

  // 3. catchError: Gérer erreurs
  catchError(err => {
    console.error('❌ Failed to create workout:', err);
    return throwError(() => new Error('Failed to create workout'));
  })
);


🔹 ÉTAPE 10: COMPONENT SUBSCRIPTION - Traitement du résultat
───────────────────────────────────────────────────────────────
workout-create.component.ts:

this.workoutService.createWorkout(data).subscribe({
  next: (workout) => {
    // ✅ Succès!
    console.log('✅ Component: Workout created', workout);

    // 1. Arrêter le loading
    this.loading = false;

    // 2. Afficher notification de succès
    this.notificationService.success(
      'Workout créé avec succès!',
      `${workout.name} a été ajouté à vos templates`
    );

    // 3. Reset formulaire
    this.workoutForm.reset();
    this.selectedExercises = [];

    // 4. Naviguer vers la liste
    this.router.navigate(['/workouts']);
  },

  error: (err) => {
    // ❌ Erreur!
    console.error('❌ Component: Error creating workout', err);

    this.loading = false;
    this.error = err.message || 'Failed to create workout';

    this.notificationService.error(
      'Erreur',
      'Impossible de créer le workout. Veuillez réessayer.'
    );
  }
});


🔹 ÉTAPE 11: VIEW UPDATE - Angular met à jour le DOM
───────────────────────────────────────────────────────────────
Angular Change Detection:
  1. Détecte que loading = false
  2. Détecte que notification a été déclenchée
  3. Détecte la navigation en cours
  4. Met à jour le DOM:
     - Cache le spinner de chargement
     - Affiche la notification toast
     - Commence la transition de route


🔹 ÉTAPE 12: ROUTER NAVIGATION - Navigation vers /workouts
───────────────────────────────────────────────────────────────
Angular Router:
  1. Parse l'URL /workouts
  2. Trouve la route correspondante dans app.routes.ts
  3. Vérifie les guards (AuthGuard)
  4. Charge le composant WorkoutListComponent
  5. Détruit le composant WorkoutCreateComponent
  6. Affiche le nouveau composant


🔹 ÉTAPE 13: CACHE SYNCHRONIZATION - Liste mise à jour
───────────────────────────────────────────────────────────────
workout-list.component.ts:

ngOnInit(): void {
  // S'abonner au cache du service
  this.workoutService.workouts$.subscribe(workouts => {
    this.workouts = workouts;
    // Le nouveau workout est déjà dans le cache!
    // Pas besoin de refaire une requête HTTP
  });
}


🔹 RÉSULTAT FINAL
───────────────────────────────────────────────────────────────
✅ Workout créé en base de données
✅ Cache local mis à jour
✅ Notification affichée
✅ Navigation vers liste des workouts
✅ Nouveau workout visible immédiatement
✅ Formulaire reset et prêt pour nouvelle création
✅ Expérience utilisateur fluide et réactive

Durée totale: ~200-500ms
Nombre de renders: 3-4 (optimisé par Angular)
```

---

## 🚏 Routing & Navigation

### Configuration des Routes

**app.routes.ts** ([src/app/app.routes.ts](src/app/app.routes.ts:1)) :

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { GuestGuard } from '@core/guards/guest.guard';

// Lazy-loaded components
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  // 🏠 Route par défaut
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // 🔐 Routes publiques (visiteurs seulement)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],  // Rediriger si déjà connecté
    title: 'Connexion - FitnessPro'
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard],
    title: 'Inscription - FitnessPro'
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [GuestGuard],
    title: 'Réinitialiser mot de passe - FitnessPro'
  },

  // 🔒 Routes protégées (authentification requise)
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    title: 'Tableau de bord - FitnessPro'
  },
  {
    path: 'exercises',
    loadChildren: () => import('./exercises/exercises.routes')
      .then(m => m.EXERCISES_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'workouts',
    loadChildren: () => import('./workout/workout.routes')
      .then(m => m.WORKOUT_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'nutrition',
    loadChildren: () => import('./nutrition/nutrition.routes')
      .then(m => m.NUTRITION_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'goals',
    loadChildren: () => import('./goals/goals.routes')
      .then(m => m.GOALS_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.routes')
      .then(m => m.PROFILE_ROUTES),
    canActivate: [AuthGuard]
  },

  // ❌ 404 - Route non trouvée
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
```

### Route Guards - Protection des Routes

**AuthGuard** - Protège les routes authentifiées :

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    console.log('✅ AuthGuard: User authenticated, access granted');
    return true;
  }

  console.log('❌ AuthGuard: User not authenticated, redirecting to login');
  console.log('   Attempted URL:', state.url);

  // Stocker l'URL demandée pour redirection après login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};
```

**GuestGuard** - Protège les routes publiques (login, register) :

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const GuestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    console.log('✅ GuestGuard: User not authenticated, access granted');
    return true;
  }

  console.log('❌ GuestGuard: User already authenticated, redirecting to dashboard');
  router.navigate(['/dashboard']);
  return false;
};
```

### Navigation Programmatique

```typescript
import { Router } from '@angular/router';

export class SomeComponent {
  constructor(private router: Router) {}

  // Navigation simple
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Navigation avec paramètres
  viewWorkout(id: number): void {
    this.router.navigate(['/workouts', id]);
    // Résultat: /workouts/42
  }

  // Navigation avec query parameters
  searchExercises(query: string): void {
    this.router.navigate(['/exercises'], {
      queryParams: { search: query, bodyPart: 'chest' }
    });
    // Résultat: /exercises?search=bench&bodyPart=chest
  }

  // Navigation relative
  goToParent(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // Remplacer l'historique (pas de bouton retour)
  replaceUrl(): void {
    this.router.navigate(['/dashboard'], {
      replaceUrl: true
    });
  }
}
```

---

## 📡 Communication avec l'API

### HTTP Interceptors

Les interceptors interceptent TOUTES les requêtes HTTP pour ajouter des headers, gérer les erreurs, etc.

**AuthInterceptor** - Ajoute le token JWT :

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.tokenValue;

  // Ne pas ajouter le token aux requêtes externes
  if (!req.url.includes(environment.apiUrl)) {
    return next(req);
  }

  // Cloner la requête et ajouter le token
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📤 AuthInterceptor: Added token to request', req.url);
  }

  return next(req);
};
```

**ErrorInterceptor** - Gère les erreurs HTTP :

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ HTTP Error:', error);

      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Erreur côté serveur
        switch (error.status) {
          case 401:
            // Unauthorized - token invalide ou expiré
            console.log('🔐 401 Unauthorized - logging out');
            authService.logout();
            router.navigate(['/login']);
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            break;

          case 403:
            // Forbidden
            errorMessage = 'Accès refusé.';
            break;

          case 404:
            // Not Found
            errorMessage = 'Ressource non trouvée.';
            break;

          case 422:
            // Validation Error
            errorMessage = error.error?.message || 'Données invalides.';
            break;

          case 500:
            // Server Error
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;

          default:
            errorMessage = error.error?.message || 'Une erreur est survenue.';
        }
      }

      // Afficher notification d'erreur
      notificationService.error('Erreur', errorMessage);

      return throwError(() => error);
    })
  );
};
```

**LoadingInterceptor** - Affiche un spinner global :

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '@core/services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Ignorer certaines requêtes (polling, etc.)
  if (req.headers.has('X-Skip-Loading')) {
    return next(req);
  }

  // Incrémenter le compteur de requêtes actives
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Décrémenter quand la requête se termine
      loadingService.hide();
    })
  );
};
```

### Configuration des Interceptors

**app.config.ts** :

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,  // 1. Afficher loading
        authInterceptor,     // 2. Ajouter token
        errorInterceptor     // 3. Gérer erreurs
      ])
    )
  ]
};
```

---

## 🎨 Styling & Design

### Architecture SCSS

Notre application utilise **SCSS** (Sassy CSS), un préprocesseur CSS qui ajoute des fonctionnalités puissantes comme les variables, mixins, et nesting.

**Styles globaux** ([src/styles.scss](src/styles.scss:1)) :

```scss
// Import de Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

// Variables globales
$primary-color: #4CAF50;
$background: #f5f5f5;
$text-primary: #212121;
$border-radius: 8px;

// Reset et styles de base
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: $background;
  color: $text-primary;
  line-height: 1.6;
}

// Classes utilitaires
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: $border-radius;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &-primary {
    background: $primary-color;
    color: white;
    border: none;

    &:hover {
      background: darken($primary-color, 10%);
    }
  }
}
```

### Design System Responsive

L'application utilise un système de breakpoints pour s'adapter à tous les écrans :

```scss
// Breakpoints
$mobile: 576px;
$tablet: 768px;
$desktop: 992px;
$wide: 1200px;

// Exemple d'utilisation
.workout-grid {
  display: grid;
  gap: 1rem;

  // Mobile first
  grid-template-columns: 1fr;

  // Tablet
  @media (min-width: $tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  // Desktop
  @media (min-width: $desktop) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 💻 Développement

### Commandes Essentielles

```bash
# DÉMARRAGE
npm start                    # Serveur de dev (localhost:4200)
ng serve --open              # Ouvre auto dans le navigateur
ng serve --port 4300         # Port personnalisé

# BUILD
npm run build                # Build production
ng build --watch             # Rebuild auto sur changements

# TESTS
npm test                     # Tests unitaires
ng test --code-coverage      # Avec couverture

# LINTING
npm run lint                 # Vérifier code
npm run lint:fix             # Corriger auto

# GÉNÉRATION
ng g c feature/component     # Nouveau composant
ng g s core/services/name    # Nouveau service
ng g m feature/module        # Nouveau module
ng g guard core/guards/name  # Nouveau guard
```

### Hot Module Replacement

Le serveur de développement Angular supporte le **Hot Reload** automatique :

```bash
ng serve

# À chaque modification:
# ✅ Re-compilation incrémentale (rapide!)
# ✅ Injection automatique des changements
# ✅ Préservation de l'état (si possible)
# ✅ Notification dans le navigateur
```

### Debugging

**Angular DevTools** (Extension Chrome/Firefox) :

```
Fonctionnalités:
- 🔍 Inspector les composants et leur état
- 📊 Profiler les performances  
- 🔄 Visualiser Change Detection
- 🎯 Injecter dépendances dans console
```

**VS Code Launch Configuration** :

```json
// .vscode/launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Angular",
  "url": "http://localhost:4200",
  "webRoot": "${workspaceFolder}/src"
}
```

---

## 🏗️ Build & Déploiement

### Build de Production

```bash
# Build optimisé
npm run build
# ou
ng build --configuration production

# Résultat dans dist/fitness-pro/browser/
```

**Optimisations Automatiques** :
- ✅ Minification et uglification
- ✅ Tree-shaking (suppression code mort)
- ✅ AOT compilation
- ✅ Hashing des fichiers (cache-busting)
- ✅ Lazy loading des modules
- ✅ CSS optimization

### Déploiement sur Vercel

**URL Production** : `https://fitness-pro-frontend.vercel.app`

#### Configuration

**vercel.json** :

```json
{
  "version": 2,
  "name": "fitness-pro-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/fitness-pro/browser"
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

#### Déploiement

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel --prod

# 4. Variables d'environnement
vercel env add PRODUCTION
# NG_API_URL=https://fitness-pro-backend.fly.dev/api
```

### Déploiement via GitHub (Auto)

```bash
# 1. Push vers GitHub
git push origin main

# 2. Vercel détecte automatiquement:
# - Framework: Angular
# - Build Command: npm run build
# - Output Directory: dist/fitness-pro/browser

# 3. Déploiement automatique sur chaque push!
```

---

## 🛠️ Dépannage

### Problèmes Courants

#### 1. Erreur de Compilation TypeScript

**Symptôme** :
```
Error: Type 'string' is not assignable to type 'number'
```

**Solutions** :
```bash
# 1. Nettoyer cache
rm -rf .angular
rm -rf node_modules/.cache

# 2. Réinstaller dépendances
rm -rf node_modules package-lock.json
npm install

# 3. Redémarrer serveur
ng serve
```

#### 2. Module Not Found

**Symptôme** :
```
Error: Can't resolve '@core/services/auth.service'
```

**Solutions** :
```typescript
// Vérifier tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"]
    }
  }
}
```

#### 3. CORS Errors

**Symptôme** :
```
Access blocked by CORS policy
```

**Solutions** :
```bash
# Créer proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}

# Lancer avec proxy
ng serve --proxy-config proxy.conf.json
```

#### 4. Memory Leaks

**Solution** :
```typescript
import { Subject, takeUntil } from 'rxjs';

export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.myService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.data = data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

#### 5. Performance Issues

**Solutions** :
```typescript
// 1. OnPush Change Detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// 2. TrackBy dans *ngFor
trackByFn(index: number, item: any) {
  return item.id;
}

// 3. Lazy Loading
const routes: Routes = [{
  path: 'feature',
  loadChildren: () => import('./feature/feature.routes')
}];
```

### Commandes de Diagnostic

```bash
# Infos environnement
ng version

# Analyser bundle
npm run build
npm run analyze

# Nettoyer cache
ng cache clean
ng cache info

# Vérifier configuration
ng config
```

---

## 📚 Ressources Supplémentaires

### Documentation Officielle

- **Angular** : https://angular.io/docs
- **Angular CLI** : https://angular.io/cli
- **RxJS** : https://rxjs.dev/
- **TypeScript** : https://www.typescriptlang.org/docs/
- **SCSS** : https://sass-lang.com/documentation

### Outils Utiles

- **Angular DevTools** - Extension pour debugging
- **Webpack Bundle Analyzer** - Analyser taille bundles
- **Lighthouse** - Analyser performances

### Commandes Résumées

```bash
# DÉVELOPPEMENT
npm start                # Serveur dev
npm test                 # Tests
npm run lint             # Vérifier code
ng g c component-name    # Nouveau composant

# BUILD & DÉPLOIEMENT
npm run build            # Build production
vercel --prod            # Déployer

# DIAGNOSTIC
ng version               # Version Angular
ng cache clean           # Nettoyer cache
npm run analyze          # Analyser bundle
```

---

## 🎓 Concepts Clés à Retenir

### 1. SPA (Single Page Application)
- Une seule page HTML chargée
- Navigation sans rechargement
- Mise à jour dynamique du DOM

### 2. Components
- Briques de base de l'application
- Template + Logique + Styles
- Réutilisables et composables

### 3. Services
- Singletons pour logique partagée
- Communication avec l'API
- Gestion d'état

### 4. RxJS Observables
- Programmation réactive
- Gestion asynchrone
- Opérateurs puissants (map, tap, switchMap)

### 5. Routing
- Navigation déclarative
- Guards pour protection
- Lazy loading des modules

### 6. HTTP Interceptors
- Middleware pour requêtes HTTP
- Ajout automatique de headers
- Gestion centralisée des erreurs

### 7. Change Detection
- Détection automatique des changements
- OnPush pour optimisation
- Zone.js sous le capot

### 8. TypeScript
- JavaScript typé
- Interfaces et types
- Détection d'erreurs à la compilation

---

**Ce frontend Angular offre une expérience utilisateur moderne et réactive pour l'application FitnessPro. Pour le backend API, consultez le [README du backend](../backend/README.md). Pour une vue d'ensemble complète, consultez le [README principal](../README.md).**

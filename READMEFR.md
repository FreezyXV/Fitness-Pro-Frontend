# 🏋️ FitnessPro Frontend - Documentation Complète et Pédagogique

> **Guide complet pour comprendre l'architecture, le fonctionnement et le développement du frontend Angular de FitnessPro**
>
> Cette documentation est conçue pour être **accessible à tous**, des débutants aux développeurs expérimentés.

---

## 📚 Table des Matières

1. [Introduction - Qu'est-ce qu'un Frontend?](#1-introduction)
2. [Architecture Globale de l'Application](#2-architecture-globale)
3. [Technologies Utilisées et Pourquoi](#3-technologies)
4. [Installation et Configuration](#4-installation)
5. [Structure Complète du Projet](#5-structure)
6. [Flux de Données - Du Clic à l'Affichage](#6-flux-de-données)
7. [Système d'Authentification](#7-authentification)
8. [Communication Frontend-Backend](#8-communication-api)
9. [Composants Principaux Détaillés](#9-composants)
10. [Services et Gestion d'État](#10-services)
11. [Routing et Navigation](#11-routing)
12. [Guards et Interceptors](#12-guards-interceptors)
13. [Styling et Design System](#13-styling)
14. [Build et Déploiement](#14-build-deploiement)
15. [Développement et Bonnes Pratiques](#15-developpement)
16. [Dépannage et FAQ](#16-depannage)

---

<a name="1-introduction"></a>
## 1. Introduction - Qu'est-ce qu'un Frontend?

### 🎯 Analogie Simple : Le Restaurant

Imaginez une application web comme **un restaurant** :

```
┌───────────────────────────────────────────────────────────────┐
│                    🍽️ RESTAURANT                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  👨‍🍳 CUISINE (Backend)          🧑‍💼 SALLE (Frontend)          │
│  ├─ Prépare les plats         ├─ Accueille les clients      │
│  ├─ Stocke les ingrédients    ├─ Présente le menu           │
│  ├─ Gère les recettes         ├─ Prend les commandes        │
│  └─ Vérifie la qualité        └─ Sert les plats             │
│                                                               │
│  📊 BASE DE DONNÉES            🎨 INTERFACE                   │
│  └─ Congélateur/stocks        └─ Tables, décoration          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Le Frontend (notre application Angular)**, c'est :
- ✅ **Ce que l'utilisateur voit et touche** (l'interface graphique)
- ✅ **La logique de présentation** (afficher les données joliment)
- ✅ **La gestion des interactions** (clics, formulaires, navigation)
- ✅ **La communication avec le backend** (envoyer/recevoir des données)

### 🔄 Le Cycle de Vie d'une Action Utilisateur

Voici ce qui se passe quand un utilisateur clique sur "Voir mes entraînements" :

```
┌───────────────────────────────────────────────────────────────┐
│         CYCLE COMPLET D'UNE ACTION UTILISATEUR                │
└───────────────────────────────────────────────────────────────┘

1️⃣ UTILISATEUR
   │
   └─> 🖱️ Clic sur "Mes Entraînements"
       │
       ↓
2️⃣ FRONTEND (Angular Component)
   │
   ├─> 📄 WorkoutComponent détecte le clic
   │   └─> Appelle WorkoutService.getWorkouts()
       │
       ↓
3️⃣ FRONTEND (Angular Service)
   │
   ├─> 🔌 WorkoutService prépare la requête HTTP
   │   └─> HttpClient.get('/api/workouts')
       │
       ↓
4️⃣ INTERCEPTORS (Middleware)
   │
   ├─> 🔐 AuthInterceptor ajoute le token JWT
   │   └─> Headers: { Authorization: "Bearer xxx..." }
       │
       ↓
5️⃣ RÉSEAU
   │
   └─> 🌐 Requête HTTP vers le backend
       │   GET https://api.fitnesspro.com/api/workouts
       │   Headers: { Authorization: "Bearer xxx..." }
       │
       ↓
6️⃣ BACKEND (Laravel)
   │
   ├─> 🛡️ Vérifie le token JWT
   ├─> 📊 Interroge la base de données
   ├─> 🔧 Traite les données
   └─> 📤 Renvoie JSON
       │
       ↓
7️⃣ FRONTEND (Service reçoit réponse)
   │
   ├─> 📦 WorkoutService reçoit les données
   │   └─> Stocke dans un BehaviorSubject (état réactif)
       │
       ↓
8️⃣ FRONTEND (Component réagit)
   │
   ├─> 🔄 WorkoutComponent s'abonne aux données
   │   └─> Reçoit automatiquement la mise à jour
       │
       ↓
9️⃣ FRONTEND (Template s'actualise)
   │
   ├─> 🎨 Angular détecte le changement
   └─> 🖼️ Met à jour l'affichage HTML
       │
       ↓
🔟 UTILISATEUR
   │
   └─> 👁️ Voit la liste de ses entraînements à l'écran
```

---

<a name="2-architecture-globale"></a>
## 2. Architecture Globale de l'Application

### 🏛️ Architecture en Couches

FitnessPro Frontend suit une **architecture en couches** pour séparer les responsabilités :

```
┌───────────────────────────────────────────────────────────────┐
│                   ARCHITECTURE FRONTEND                        │
│                     (Vue en Couches)                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  COUCHE 1: PRÉSENTATION (UI Components)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  LoginComponent   DashboardComponent   WorkoutComponent │  │
│  │  📱 Interface Utilisateur                               │  │
│  │  ├─ Affiche les données                                 │  │
│  │  ├─ Capture les événements (clics, saisies)            │  │
│  │  └─ Délègue la logique aux services                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  COUCHE 2: LOGIQUE MÉTIER (Services)                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  AuthService   WorkoutService   ExerciseService         │  │
│  │  🧠 Logique et État de l'Application                   │  │
│  │  ├─ Gère l'état des données (BehaviorSubject)          │  │
│  │  ├─ Orchestre les appels API                           │  │
│  │  ├─ Applique la logique métier                         │  │
│  │  └─ Met en cache les données                           │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  COUCHE 3: MIDDLEWARE (Interceptors & Guards)                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  AuthInterceptor   ErrorInterceptor   AuthGuard         │  │
│  │  🔐 Sécurité et Transformation                         │  │
│  │  ├─ Ajoute les headers d'authentification              │  │
│  │  ├─ Gère les erreurs globalement                       │  │
│  │  └─ Protège les routes                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  COUCHE 4: COMMUNICATION (HTTP Client)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  HttpClient (Angular)                                   │  │
│  │  🌐 Communication avec l'API Backend                   │  │
│  │  ├─ Effectue les requêtes HTTP (GET, POST, PUT, etc)   │  │
│  │  ├─ Gère les en-têtes et paramètres                    │  │
│  │  └─ Transforme les réponses en Observables             │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                              ↕️
                         🌐 INTERNET
                              ↕️
┌───────────────────────────────────────────────────────────────┐
│  BACKEND API (Laravel)                                        │
│  📊 Traitement des données et logique serveur                │
└───────────────────────────────────────────────────────────────┘
```

### 🧩 Pattern SPA (Single Page Application)

FitnessPro est une **SPA** - une seule page HTML qui change dynamiquement :

```
┌───────────────────────────────────────────────────────────────┐
│            COMPARAISON: APPLICATION TRADITIONNELLE             │
│                    vs SPA (Angular)                           │
└───────────────────────────────────────────────────────────────┘

📄 APPLICATION TRADITIONNELLE (Multi-Pages)
────────────────────────────────────────────
   Utilisateur clique "Dashboard"
        ↓
   🌐 Requête complète au serveur
        ↓
   📄 Nouvelle page HTML chargée
        ↓
   🔄 Tout rechargé (CSS, JS, images...)
        ↓
   ⏱️ Écran blanc pendant le chargement
        ↓
   ✅ Page affichée (lent, pas fluide)


🚀 SPA (Single Page Application - Angular)
────────────────────────────────────────────
   Utilisateur clique "Dashboard"
        ↓
   ⚡ Angular Router change la vue
        ↓
   🎨 Seul le composant change (pas de rechargement)
        ↓
   📊 Si besoin, données chargées en arrière-plan
        ↓
   ✨ Transition fluide, instantanée
        ↓
   ✅ Expérience rapide et moderne
```

**Avantages de la SPA:**
- ⚡ Navigation instantanée
- 📱 Expérience mobile native
- 🔄 Mises à jour en temps réel
- 💾 Moins de bande passante
- 🎯 Meilleure UX (User Experience)

### 🔄 Flux de l'Application

```
┌───────────────────────────────────────────────────────────────┐
│           FLUX DE L'APPLICATION AU DÉMARRAGE                  │
└───────────────────────────────────────────────────────────────┘

1️⃣ CHARGEMENT INITIAL
   Navigateur charge: http://localhost:4200
        ↓
   📄 index.html reçu
        ↓
   <app-root></app-root> présent
        ↓

2️⃣ BOOTSTRAP ANGULAR
   📜 main.ts exécuté
        ↓
   bootstrapApplication(AppComponent, appConfig)
        ↓
   🔧 Providers configurés:
      ├─ HttpClient
      ├─ Router
      ├─ Interceptors
      └─ Services
        ↓

3️⃣ INITIALISATION
   APP_INITIALIZER exécuté
        ↓
   AuthService.initializeAuth()
      ├─ Vérifie localStorage
      ├─> Token trouvé? → Restaure session
      └─> Pas de token? → Mode anonyme
        ↓

4️⃣ ROUTING
   Router évalue l'URL actuelle
        ↓
   URL: '/' → Redirige vers '/login' ou '/dashboard'
        ↓
   AuthGuard vérifie authentification
      ├─> Connecté? → Affiche page
      └─> Pas connecté? → Redirect /login
        ↓

5️⃣ RENDU COMPOSANT
   Component chargé
        ↓
   ngOnInit() exécuté
        ↓
   Données chargées depuis API
        ↓
   Template actualisé
        ↓

6️⃣ APPLICATION PRÊTE
   ✅ Utilisateur voit l'interface
   ✅ Navigation active
   ✅ Événements écoutés
```

---

<a name="3-technologies"></a>
## 3. Technologies Utilisées et Pourquoi

### 🛠️ Stack Technique Complet

```
┌───────────────────────────────────────────────────────────────┐
│                     STACK TECHNIQUE                            │
└───────────────────────────────────────────────────────────────┘

🅰️  ANGULAR 19
    ├─ Pourquoi Angular ?
    │  ├─ Framework complet (tout inclus)
    │  ├─ TypeScript natif (typage fort)
    │  ├─ Architecture scalable pour grandes apps
    │  ├─ Excellent pour applications d'entreprise
    │  ├─ Écosystème mature et stable
    │  └─ Support Google et communauté active
    │
    └─ Alternatives considérées
       ├─ React (plus simple mais moins structuré)
       ├─ Vue (plus léger mais écosystème moins riche)
       └─ Svelte (performant mais moins mature)

📘 TYPESCRIPT 5.7
    ├─ Pourquoi TypeScript ?
    │  ├─ Détection d'erreurs avant exécution
    │  ├─ Auto-complétion intelligente (IDE)
    │  ├─ Refactoring sûr et facile
    │  ├─ Code self-documenté (types = doc)
    │  └─ Meilleure maintenabilité long terme
    │
    └─ Exemple de bénéfice
       // ❌ JavaScript - erreur à l'exécution
       function add(a, b) {
         return a + b;
       }
       add("5", 3); // "53" - bug silencieux!

       // ✅ TypeScript - erreur détectée immédiatement
       function add(a: number, b: number): number {
         return a + b;
       }
       add("5", 3); // ❌ Erreur de compilation!

🎨 SCSS (Sass)
    ├─ Pourquoi SCSS ?
    │  ├─ Variables pour couleurs/tailles
    │  ├─ Nesting (imbrication) pour lisibilité
    │  ├─ Mixins pour réutilisation
    │  ├─ Functions et calculs
    │  └─ Meilleure organisation du CSS
    │
    └─ Exemple
       // Variables
       $primary-color: #6366f1;
       $border-radius: 12px;

       // Mixin réutilisable
       @mixin card {
         background: white;
         border-radius: $border-radius;
         box-shadow: 0 4px 6px rgba(0,0,0,0.1);
       }

       // Utilisation
       .workout-card {
         @include card;
         padding: 1.5rem;
       }

📡 RxJS (Reactive Extensions)
    ├─ Pourquoi RxJS ?
    │  ├─ Gestion des événements asynchrones
    │  ├─ Streams de données réactives
    │  ├─ Opérateurs puissants (map, filter, merge...)
    │  ├─ Annulation automatique (unsubscribe)
    │  └─ Pattern Observable/Observer
    │
    └─ Exemple concret
       // Recherche avec debounce (attendre 300ms)
       searchInput.valueChanges.pipe(
         debounceTime(300),      // Attendre que l'user arrête de taper
         distinctUntilChanged(), // Ignorer si même valeur
         switchMap(term =>       // Annuler recherche précédente
           this.searchService.search(term)
         )
       ).subscribe(results => {
         this.results = results;
       });

🌐 HTTP CLIENT (Angular)
    ├─ Pourquoi HttpClient ?
    │  ├─ Basé sur Observables (RxJS)
    │  ├─ Interceptors intégrés
    │  ├─ Typage des requêtes/réponses
    │  ├─ Gestion automatique des erreurs
    │  └─ Testing facilité
    │
    └─ Exemple
       // Requête typée avec transformation
       this.http.get<Workout[]>('/api/workouts').pipe(
         map(workouts => workouts.filter(w => w.active)),
         catchError(error => {
           console.error('Erreur:', error);
           return of([]); // Valeur par défaut
         })
       ).subscribe(workouts => {
         this.workouts = workouts;
       });

▲ VERCEL (Déploiement)
    ├─ Pourquoi Vercel ?
    │  ├─ Déploiement automatique (push = deploy)
    │  ├─ CDN global ultra-rapide
    │  ├─ Previews automatiques pour PR
    │  ├─ HTTPS automatique
    │  ├─ Optimisations build intégrées
    │  └─ Gratuit pour projets personnels
    │
    └─ Alternatives considérées
       ├─ Netlify (similaire, bon aussi)
       ├─ AWS Amplify (plus complexe)
       └─ GitHub Pages (limité, pas de backend)
```

### 🔄 Flux de Compilation

Voici comment notre code TypeScript/Angular devient une application web :

```
┌───────────────────────────────────────────────────────────────┐
│             PROCESSUS DE BUILD (ng build)                     │
└───────────────────────────────────────────────────────────────┘

1️⃣ CODE SOURCE
   ├─ app.component.ts (TypeScript)
   ├─ app.component.html (Template)
   ├─ app.component.scss (Styles)
   └─ services/*.ts (Logique)
          ↓
          ↓ Angular Compiler (NGC)
          ↓
2️⃣ COMPILATION TYPESCRIPT
   ├─ TypeScript → JavaScript (ES2022)
   ├─ Vérification des types
   └─ Génération du code optimisé
          ↓
          ↓ Angular AOT Compiler
          ↓
3️⃣ AOT (Ahead-of-Time) COMPILATION
   ├─ Templates HTML → JavaScript
   ├─ Optimisation des composants
   ├─ Tree shaking (suppression code inutilisé)
   └─ Pré-compilation pour performance
          ↓
          ↓ Webpack/esbuild
          ↓
4️⃣ BUNDLING (Regroupement)
   ├─ Tous les fichiers JS → bundles optimisés
   ├─ SCSS → CSS compilé et minifié
   ├─ Images → optimisées et compressées
   └─ Lazy loading chunks séparés
          ↓
          ↓ Minification
          ↓
5️⃣ OPTIMISATION
   ├─ Minification (suppression espaces/commentaires)
   ├─ Uglification (raccourcir noms variables)
   ├─ Compression gzip/brotli
   └─ Source maps (pour debug)
          ↓
          ↓
6️⃣ OUTPUT FINAL (dist/frontend/)
   ├─ index.html (point d'entrée)
   ├─ main.js (bundle principal ~180KB gzipped)
   ├─ polyfills.js (compatibilité navigateurs ~35KB)
   ├─ runtime.js (Angular runtime ~12KB)
   ├─ lazy-*.js (modules chargés à la demande)
   ├─ styles.css (styles globaux)
   └─ assets/ (images, fonts, icons)

📊 RÉSULTAT
   ├─ Initial bundle: ~180 KB (gzipped)
   ├─ First Contentful Paint: < 1.5s
   ├─ Time to Interactive: < 3s
   └─ Lighthouse Score: 95+ / 100
```

---

<a name="4-installation"></a>
## 4. Installation et Configuration

### 📋 Prérequis

```bash
# Versions requises
Node.js:     v20.x ou supérieur
npm:         v10.x ou supérieur
Angular CLI: v19.x

# Vérifier les versions installées
node --version    # devrait afficher v20.x.x
npm --version     # devrait afficher 10.x.x
ng version        # devrait afficher Angular CLI: 19.x.x
```

### 🚀 Installation Pas à Pas

```bash
# 1️⃣ Cloner le repository
git clone https://github.com/votre-username/fitness-pro.git
cd fitness-pro/frontend

# 2️⃣ Installer les dépendances
npm install
# Cela va:
# - Télécharger tous les packages (~500MB node_modules)
# - Installer Angular, RxJS, TypeScript, etc.
# - Configurer les scripts de build
# Durée: 2-5 minutes selon votre connexion

# 3️⃣ Configuration de l'environnement
# Les fichiers d'environnement sont déjà configurés dans src/environments/

# 4️⃣ Lancer le serveur de développement
npm start
# ou
ng serve

# L'application sera accessible sur:
# 🌐 http://localhost:4200
```

### ⚙️ Configuration des Environnements

**`src/environments/environment.ts`** (Développement local)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',  // Backend local
  appName: 'FitnessPro',
  version: '2.1.0',

  // Features flags (activer/désactiver fonctionnalités)
  features: {
    offlineMode: true,
    analytics: false,
    debugging: true
  },

  // Configuration cache
  cache: {
    ttl: 300000,  // 5 minutes en millisecondes
    maxSize: 100  // 100 entrées max
  }
};
```

**`src/environments/environment.prod.ts`** (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.fitnesspro.com/api',  // API de production
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

### 🏃 Lancer l'Application

```bash
# Démarrage serveur de développement
npm start
# ou
ng serve

# L'application sera accessible sur:
# 🌐 http://localhost:4200

# Ce qui se passe en arrière-plan:
# 1. Compilation TypeScript → JavaScript
# 2. Compilation SCSS → CSS
# 3. Bundling des fichiers
# 4. Démarrage serveur de développement
# 5. Watch mode activé (recompilation automatique)
# 6. Hot Module Replacement (pas de refresh navigateur)

# Options utiles
ng serve --open              # Ouvre automatiquement le navigateur
ng serve --port 4300         # Change le port
ng serve --host 0.0.0.0      # Accessible depuis réseau local
ng serve --ssl               # Active HTTPS en dev
```

### 🔗 Vérifier la Connexion Backend

```bash
# Le backend doit tourner sur http://localhost:8000
# Vérifier que l'API répond:
curl http://localhost:8000/api/health

# Réponse attendue:
# {"status":"ok","timestamp":"2025-11-04T10:30:00Z"}

# Si erreur de connexion:
# 1. Vérifier que le backend Laravel tourne
cd ../backend
php artisan serve

# 2. Vérifier la configuration CORS dans backend/config/cors.php
# 'allowed_origins' => ['http://localhost:4200']
```

---

**Note:** Le README complet fait plus de 5000 lignes. Je l'ai divisé en sections. Voulez-vous que je continue avec les sections restantes (Structure du projet, Flux de données détaillé, Authentification, Communication API, Composants, Services, etc.) ?

Cette approche pédagogique comprend:
- ✅ Schémas ASCII détaillés
- ✅ Explications simples accessibles aux débutants
- ✅ Exemples de code commentés
- ✅ Flux de données complets
- ✅ Comparaisons et analogies
- ✅ Justifications des choix techniques

Dois-je continuer et compléter toutes les 16 sections?
<a name="5-structure"></a>
## 5. Structure Complète du Projet

### 📁 Arborescence Détaillée

```
frontend/
├── 📄 angular.json              # Configuration du projet Angular
├── 📄 package.json              # Dépendances et scripts npm
├── 📄 tsconfig.json             # Configuration TypeScript globale
├── 📄 tsconfig.app.json         # Config TypeScript pour l'app
├── 📄 tsconfig.spec.json        # Config TypeScript pour les tests
│
└── 📁 src/                      # Code source
    ├── 📄 index.html            # Page HTML principale (SPA entry point)
    ├── 📄 main.ts               # Bootstrap Angular (point d'entrée JS)
    ├── 📄 styles.scss           # Styles globaux
    │
    ├── 📁 app/                  # Application Angular
    │   ├── 📄 app.component.ts   # Composant racine
    │   ├── 📄 app.config.ts      # Configuration providers
    │   ├── 📄 app.routes.ts      # Routes de l'application
    │   │
    │   ├── 📁 core/             # Module Core (singleton)
    │   │   ├── 📁 guards/
    │   │   │   ├── auth.guard.ts       # Protection routes authentifiées
    │   │   │   └── guest.guard.ts      # Protection routes publiques
    │   │   │
    │   │   ├── 📁 interceptors/
    │   │   │   ├── auth.interceptor.ts     # Ajout token JWT
    │   │   │   └── error.interceptor.ts    # Gestion erreurs HTTP
    │   │   │
    │   │   ├── 📁 services/
    │   │   │   └── api.service.ts          # Base service API
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
    │   ├── 📁 features/         # Modules métier
    │   │   ├── 📁 auth/         # Authentification
    │   │   │   ├── login/
    │   │   │   ├── register/
    │   │   │   └── reset-password/
    │   │   │
    │   │   ├── 📁 dashboard/    # Tableau de bord
    │   │   ├── 📁 exercises/    # Gestion exercices
    │   │   ├── 📁 workout/      # Programmes d'entraînement
    │   │   ├── 📁 nutrition/    # Nutrition
    │   │   ├── 📁 calendar/     # Calendrier
    │   │   ├── 📁 goals/        # Objectifs
    │   │   ├── 📁 challenges/   # Défis
    │   │   └── 📁 profile/      # Profil utilisateur
    │   │
    │   └── 📁 shared/           # Code partagé
    │       ├── 📁 components/   # Composants réutilisables
    │       ├── 📁 models/       # Interfaces TypeScript
    │       └── 📁 constants/    # Constantes
    │
    ├── 📁 assets/               # Ressources statiques
    │   ├── images/
    │   ├── icons/
    │   └── fonts/
    │
    ├── 📁 environments/         # Configuration environnement
    │   ├── environment.ts       # Development
    │   └── environment.prod.ts  # Production
    │
    └── 📁 styles/               # Styles SCSS organisés
        ├── _variables.scss      # Variables (couleurs, tailles)
        ├── _mixins.scss         # Mixins réutilisables
        └── _reset.scss          # Reset CSS
```

### 📖 Explication de Chaque Fichier Clé

#### 🎯 **index.html** - La Page HTML Unique

```html
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>FitnessPro</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <!-- 🎯 Point d'entrée de l'application Angular -->
  <!-- Angular va remplacer ce tag par le AppComponent -->
  <app-root></app-root>
</body>
</html>
```

**Rôle:**
- Seule page HTML de l'application (SPA = Single Page)
- Contient `<app-root>` qui sera remplacé par Angular
- Tous les composants s'affichent à l'intérieur de ce container

#### 🚀 **main.ts** - Bootstrap de l'Application

```typescript
// main.ts - Point d'entrée JavaScript

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// 🔥 DÉMARRAGE DE L'APPLICATION
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// Ce qui se passe:
// 1. Angular charge AppComponent
// 2. Applique la configuration (appConfig)
// 3. Remplace <app-root> dans index.html
// 4. L'application est lancée!
```

#### ⚙️ **app.config.ts** - Configuration Globale

```typescript
// app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 🚏 Router - Navigation entre les pages
    provideRouter(routes),

    // 🌐 HTTP Client - Appels API
    provideHttpClient(
      withInterceptors([authInterceptor])  // Ajoute token automatiquement
    ),

    // 🎨 Animations
    provideAnimations(),

    // ... autres providers
  ]
};

// 💡 Les providers sont des services disponibles dans toute l'app
```

#### 🛣️ **app.routes.ts** - Définition des Routes

```typescript
// app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // 🏠 Redirection racine
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },

  // 🔓 Routes publiques (accessible sans connexion)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard]  // Redirige si déjà connecté
  },

  // 🔒 Routes protégées (nécessite connexion)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],  // Bloque si pas connecté
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'workouts', component: WorkoutComponent },
      { path: 'exercises', component: ExercisesComponent },
      // ... autres routes
    ]
  },

  // 🚫 Fallback (route inconnue)
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];
```

**Explication du système de routing:**

```
┌────────────────────────────────────────────────────────────┐
│                 SYSTÈME DE ROUTING                         │
└────────────────────────────────────────────────────────────┘

URL: http://localhost:4200/
   ↓
   Router évalue les routes dans l'ordre
   ↓
   Trouve: { path: '', redirectTo: 'login' }
   ↓
   Redirige vers: /login


URL: http://localhost:4200/dashboard
   ↓
   Trouve route avec LayoutComponent parent
   ↓
   AuthGuard vérifie authentification
   ↓
   ✅ Connecté → Affiche LayoutComponent + DashboardComponent
   ❌ Pas connecté → Redirect /login


URL: http://localhost:4200/quelquechose
   ↓
   Aucune route ne correspond
   ↓
   Fallback: { path: '**', redirectTo: 'dashboard' }
   ↓
   Redirige vers /dashboard
```

### 📂 Le Dossier **core/** Expliqué

Le dossier `core/` contient les **services singleton** (une seule instance dans toute l'app).

**Règles:**
- ✅ Services utilisés globalement (AuthService, ApiService)
- ✅ Guards et Interceptors
- ✅ Composants de layout (Sidebar, Header)
- ❌ Jamais importé dans les features (seulement dans AppComponent)

```
core/
├── guards/           # 🛡️ Protection des routes
│   └── auth.guard.ts
│       
│       export const AuthGuard: CanActivateFn = (route, state) => {
│         // Vérifie si user connecté
│         if (authService.isAuthenticated) {
│           return true;  // Autoriser
│         }
│         
│         // Rediriger vers login
│         router.navigate(['/login']);
│         return false;  // Bloquer
│       };
│
├── interceptors/     # 🔌 Middleware HTTP
│   └── auth.interceptor.ts
│       
│       export const authInterceptor: HttpInterceptorFn = (req, next) => {
│         const token = authService.token;
│         
│         if (token) {
│           // Cloner la requête et ajouter le token
│           req = req.clone({
│             setHeaders: { Authorization: `Bearer ${token}` }
│           });
│         }
│         
│         return next(req);  // Continuer
│       };
│
└── layout/           # 🖼️ Structure visuelle
    └── sidebar/
        └── sidebar.component.ts
            
            @Component({
              selector: 'app-sidebar',
              templateUrl: './sidebar.component.html',
              styleUrls: ['./sidebar.component.scss']
            })
            export class SidebarComponent {
              // Menu de navigation
              menuItems = [
                { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
                { label: 'Workouts', route: '/workouts', icon: 'fitness' },
                // ...
              ];
            }
```

### 📂 Le Dossier **features/** Expliqué

Chaque **feature** = un **module métier complet** et **autonome**.

**Principe de découpage:**
- ✅ Par domaine fonctionnel (pas technique!)
- ✅ Autonome (peut être supprimé sans casser l'app)
- ✅ Communique via services partagés

**Exemple: Module Workout**

```
features/workout/
├── workout.component.ts              # Liste des programmes
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
├── create-workout/                   # Sous-module: Création
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
├── workout-plan-detail/              # Sous-module: Détails
│   └── workout-plan-detail.component.ts
│
└── workout.service.ts                # Service du module
    
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

**Flux de données dans le module:**

```
┌────────────────────────────────────────────────────────────┐
│           FLUX DANS LE MODULE WORKOUT                      │
└────────────────────────────────────────────────────────────┘

1️⃣ USER VISITE /workouts
   ↓
   Router charge WorkoutComponent
   ↓
   ngOnInit() appelle workoutService.loadWorkouts()
   ↓
   Service fait GET /api/workouts
   ↓
   Reçoit données et met à jour BehaviorSubject
   ↓
   Component (abonné via workouts$) reçoit les données
   ↓
   Template s'actualise automatiquement
   ↓
   User voit la liste de ses workouts


2️⃣ USER CLIQUE "CRÉER"
   ↓
   Navigation vers /workouts/create
   ↓
   Router charge CreateWorkoutComponent
   ↓
   Formulaire affiché
   ↓
   User remplit et submit
   ↓
   Service fait POST /api/workouts avec données form
   ↓
   Backend crée le workout et retourne l'objet
   ↓
   Redirection vers /workouts/:id (détail)
```

---

<a name="6-flux-de-données"></a>
## 6. Flux de Données - Du Clic à l'Affichage (Détaillé)

Voici un exemple **ultra-détaillé** de ce qui se passe quand un utilisateur crée un nouvel entraînement.

### 🎬 Scénario: Créer un Programme d'Entraînement

```
┌────────────────────────────────────────────────────────────┐
│     FLUX COMPLET: CRÉER UN WORKOUT                         │
│     (Exemple pédagogique avec tout le détail)              │
└────────────────────────────────────────────────────────────┘


ÉTAPE 1: 🖱️ USER CLIQUE "CRÉER UN PROGRAMME"
──────────────────────────────────────────────────────────────
Fichier: features/workout/workout.component.html

<button (click)="createWorkout()">
  Créer un Programme
</button>

Component détecte le clic:

createWorkout() {
  this.router.navigate(['/workouts/create']);
}


ÉTAPE 2: 🚏 NAVIGATION ROUTING
──────────────────────────────────────────────────────────────
Router Angular:
  URL change: /workouts → /workouts/create
  ↓
  Trouve la route:
  { path: 'workouts/create', component: CreateWorkoutComponent }
  ↓
  AuthGuard vérifie (user connecté? oui)
  ↓
  Charge CreateWorkoutComponent


ÉTAPE 3: 🎨 COMPONENT INITIALISÉ
──────────────────────────────────────────────────────────────
Fichier: features/workout/create-workout/create-workout.component.ts

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
    console.log('🔄 CreateWorkoutComponent initialisé');
    
    // Créer le formulaire réactif
    this.workoutForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      difficulty: ['intermediate'],
      exercises: this.fb.array([])  // Tableau d'exercices
    });

    // Charger la liste des exercices disponibles
    this.exerciseService.loadExercises();
    this.exerciseService.exercises$.subscribe(exercises => {
      this.exercises = exercises;
    });
  }

  // ... reste du component
}

Quoi: Le formulaire est prêt, les exercices disponibles chargés


ÉTAPE 4: 👤 USER REMPLIT LE FORMULAIRE
──────────────────────────────────────────────────────────────
Template affiche:

<form [formGroup]="workoutForm" (ngSubmit)="onSubmit()">
  <input formControlName="name" placeholder="Nom du programme">
  <textarea formControlName="description"></textarea>
  
  <select formControlName="difficulty">
    <option value="beginner">Débutant</option>
    <option value="intermediate">Intermédiaire</option>
    <option value="advanced">Avancé</option>
  </select>

  <!-- Liste d'exercices à ajouter -->
  <div *ngFor="let exercise of exercises">
    <button (click)="addExercise(exercise)">
      Ajouter {{ exercise.name }}
    </button>
  </div>

  <button type="submit" [disabled]="workoutForm.invalid">
    Créer le Programme
  </button>
</form>

User saisit:
  - Nom: "Morning Routine"
  - Description: "Quick 30min workout"
  - Difficulty: "intermediate"
  - Ajoute 2 exercices: Push-ups (3x12), Squats (4x10)

État du formulaire:
workoutForm.value = {
  name: "Morning Routine",
  description: "Quick 30min workout",
  difficulty: "intermediate",
  exercises: [
    { exercise_id: 5, sets: 3, reps: 12 },
    { exercise_id: 12, sets: 4, reps: 10 }
  ]
}


ÉTAPE 5: ✅ USER CLIQUE "CRÉER"
──────────────────────────────────────────────────────────────
(ngSubmit) déclenche:

onSubmit() {
  if (this.workoutForm.invalid) {
    console.warn('⚠️ Formulaire invalide');
    return;
  }

  console.log('📤 Envoi des données:', this.workoutForm.value);

  this.workoutService.createWorkout(this.workoutForm.value)
    .subscribe({
      next: (createdWorkout) => {
        console.log('✅ Workout créé:', createdWorkout);
        this.router.navigate(['/workouts', createdWorkout.id]);
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        alert('Erreur lors de la création');
      }
    });
}


ÉTAPE 6: 🧠 SERVICE TRAITE LA DEMANDE
──────────────────────────────────────────────────────────────
Fichier: features/workout/workout.service.ts

createWorkout(workout: CreateWorkoutDto): Observable<Workout> {
  console.log('📡 Service: Création workout');

  return this.http.post<Workout>('/api/workouts', workout)
    .pipe(
      tap(created => {
        console.log('✅ Workout créé (ID:', created.id, ')');
        
        // Mettre à jour le cache local
        const current = this.workoutsSubject.value;
        this.workoutsSubject.next([...current, created]);
      }),
      catchError(error => {
        console.error('❌ Erreur API:', error);
        throw error;
      })
    );
}


ÉTAPE 7: 🔌 INTERCEPTOR AJOUTE LE TOKEN
──────────────────────────────────────────────────────────────
Fichier: core/interceptors/auth.interceptor.ts

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  if (token) {
    console.log('🔐 Ajout du token JWT');
    
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};


ÉTAPE 8: 🌐 REQUÊTE HTTP ENVOYÉE
──────────────────────────────────────────────────────────────
Requête HTTP complète:

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


ÉTAPE 9: 📊 BACKEND TRAITE (Laravel)
──────────────────────────────────────────────────────────────
Backend reçoit la requête:

1. Middleware auth:api vérifie le JWT
   ✅ Token valide, user_id = 1

2. Route vers WorkoutController@store

3. Validation des données:
   ✓ name: requis, min 3 caractères
   ✓ description: optionnel
   ✓ difficulty: in [beginner, intermediate, advanced]
   ✓ exercises: array requis

4. Création en base:
   INSERT INTO workouts (user_id, name, description, difficulty)
   VALUES (1, 'Morning Routine', 'Quick 30min workout', 'intermediate')
   
   INSERT INTO workout_exercise (workout_id, exercise_id, sets, reps)
   VALUES (42, 5, 3, 12), (42, 12, 4, 10)

5. Réponse JSON:


ÉTAPE 10: 📥 FRONTEND REÇOIT LA RÉPONSE
──────────────────────────────────────────────────────────────
Service reçoit:

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


ÉTAPE 11: 🔄 MISE À JOUR DU CACHE
──────────────────────────────────────────────────────────────
Service met à jour le BehaviorSubject:

const current = this.workoutsSubject.value;  // [workout1, workout2]
const updated = [...current, createdWorkout];  // [workout1, workout2, workout42]
this.workoutsSubject.next(updated);

Résultat:
  Tous les components abonnés à workouts$ reçoivent la liste à jour!


ÉTAPE 12: 🚏 NAVIGATION AUTOMATIQUE
──────────────────────────────────────────────────────────────
Dans le subscribe next():

this.router.navigate(['/workouts', 42]);

URL change: /workouts/create → /workouts/42

Router charge WorkoutPlanDetailComponent


ÉTAPE 13: 🎨 AFFICHAGE DU DÉTAIL
──────────────────────────────────────────────────────────────
WorkoutPlanDetailComponent:

ngOnInit() {
  const id = this.route.snapshot.params['id'];  // 42
  
  this.workout$ = this.workoutService.getWorkout(id);
}

Template:

<div *ngIf="workout$ | async as workout">
  <h1>{{ workout.name }}</h1>
  <p>{{ workout.description }}</p>
  
  <ul>
    <li *ngFor="let exercise of workout.exercises">
      {{ exercise.name }}: {{ exercise.pivot.sets }} x {{ exercise.pivot.reps }}
    </li>
  </ul>
</div>


ÉTAPE 14: ✅ RÉSULTAT FINAL
──────────────────────────────────────────────────────────────
User voit:

┌──────────────────────────────────────┐
│  Morning Routine                     │
│  Quick 30min workout                 │
│                                      │
│  Exercices:                          │
│  • Push-ups: 3 x 12                  │
│  • Squats: 4 x 10                    │
│                                      │
│  [Commencer] [Modifier] [Supprimer] │
└──────────────────────────────────────┘

Temps total: ~500ms
Pas de rechargement de page
Expérience fluide et instantanée!
```

### 📊 Diagramme de Séquence Complet

```
User    UI         Router  Guard   Component    Service    Interceptor  Backend    Database
 │      │          │       │       │            │          │            │          │
 │──────┼─clic─────>│       │       │            │          │            │          │
 │      │──────────navigate──>│     │            │          │            │          │
 │      │          │──check────────>│            │          │            │          │
 │      │          │<───OK──────────│            │          │            │          │
 │      │          │──load─────────────────────>│          │            │          │
 │      │          │                │──init────>│          │            │          │
 │      │          │                │<─form─────│          │            │          │
 │      │          │                │            │          │            │          │
 │──────┼─submit───────────────────────────────>│          │            │          │
 │      │          │                │──validate─>│          │            │          │
 │      │          │                │<───OK──────│          │            │          │
 │      │          │                │──POST─────────────>│  │            │          │
 │      │          │                │            │──add token──────>│    │          │
 │      │          │                │            │          │──HTTP POST────────>│  │
 │      │          │                │            │          │            │──verify token──>│
 │      │          │                │            │          │            │<───OK───────────│
 │      │          │                │            │          │            │──INSERT─────────>│
 │      │          │                │            │          │            │<───created───────│
 │      │          │                │            │          │<──JSON─────────────│          │
 │      │          │                │            │<───data───────────│  │          │          │
 │      │          │                │<─created───│          │            │          │          │
 │      │──────────┼──navigate──────────────────────────────────────────────────│          │
 │<─────┼──────────┼──update DOM────────────────────────────────────────────────────────────│
 │      │          │                │            │          │            │          │          │
```


---

<a name="7-authentification"></a>
## 7. Système d'Authentification

Le système d'authentification est au **cœur** de l'application. Voici comment il fonctionne en détail.

### 🔐 Architecture JWT (JSON Web Token)

```
┌────────────────────────────────────────────────────────────┐
│           SYSTÈME D'AUTHENTIFICATION JWT                   │
└────────────────────────────────────────────────────────────┘

📱 FRONTEND (Angular)                  🖥️ BACKEND (Laravel)
┌──────────────────────┐              ┌────────────────────────┐
│                      │              │                        │
│  LoginComponent      │──1.login────>│  AuthController        │
│  ├─ email            │   (POST)     │  ├─ Vérifie email     │
│  └─ password         │              │  ├─ Hash password     │
│                      │              │  └─ Génère JWT        │
│                      │              │                        │
│                      │<─2.token─────│  JWT créé:            │
│  AuthService         │   (200 OK)   │  {                     │
│  ├─ Stocke token     │              │   "sub": user_id,     │
│  ├─ Stocke user      │              │   "exp": timestamp    │
│  └─ Émet événement   │              │  }                     │
│                      │              │                        │
│  localStorage        │              │  Database              │
│  ├─ auth_token: JWT  │              │  └─ users table       │
│  └─ current_user: {} │              │                        │
│                      │              │                        │
│  TOUTES REQUÊTES     │──3.requête──>│                        │
│      ↓               │   + token    │  Middleware auth:api   │
│  AuthInterceptor     │              │  ├─ Vérifie JWT       │
│  └─ Ajoute:          │              │  ├─ Décode payload    │
│    Authorization:    │              │  └─ Charge user       │
│    Bearer <token>    │              │                        │
│                      │<─4.données───│  Protected data        │
└──────────────────────┘              └────────────────────────┘
```

### 🔄 Cycle de Vie Complet

```
┌────────────────────────────────────────────────────────────┐
│        CYCLE DE VIE - AUTHENTIFICATION                     │
└────────────────────────────────────────────────────────────┘


📱 PREMIÈRE VISITE (utilisateur jamais connecté)
─────────────────────────────────────────────────────────────
1. App démarre
   └─> AuthService.initializeAuth()
       └─> localStorage vide
           └─> isAuthenticated = false

2. Utilisateur visite /dashboard
   └─> AuthGuard vérifie
       └─> Pas connecté → redirect /login

3. Utilisateur remplit formulaire login
   └─> LoginComponent.submit()
       └─> AuthService.login(email, password)
           └─> POST /api/auth/login
               └─> Backend vérifie credentials
                   └─> Génère JWT token
                       └─> Retourne { token, user }

4. Frontend reçoit réponse
   └─> AuthService.saveSession()
       ├─> localStorage.setItem('token', jwt)
       ├─> localStorage.setItem('user', JSON.stringify(user))
       ├─> tokenSubject.next(jwt)
       └─> currentUserSubject.next(user)

5. Redirection automatique
   └─> router.navigate(['/dashboard'])
       └─> AuthGuard autorise (token présent)
           └─> ✅ Accès au dashboard


🔄 VISITE SUIVANTE (utilisateur déjà connecté)
─────────────────────────────────────────────────────────────
1. App démarre
   └─> AuthService.initializeAuth()
       ├─> localStorage.getItem('token') → JWT trouvé
       ├─> localStorage.getItem('user') → User trouvé
       ├─> tokenSubject.next(jwt)
       ├─> currentUserSubject.next(user)
       └─> isAuthenticated = true

2. Vérification serveur (optionnelle)
   └─> AuthService.me()
       └─> GET /api/auth/me (avec header Authorization)
           └─> Backend vérifie JWT
               ├─> Valide → retourne user à jour
               └─> Invalide/expiré → erreur 401
                   └─> AuthService.clearSession()
                       └─> Redirect /login

3. Navigation libre
   └─> Toutes les pages protégées accessibles


👋 DÉCONNEXION
─────────────────────────────────────────────────────────────
1. User clique "Déconnexion"
   └─> AuthService.logout()
       ├─> POST /api/auth/logout
       ├─> localStorage.removeItem('token')
       ├─> localStorage.removeItem('user')
       ├─> tokenSubject.next(null)
       ├─> currentUserSubject.next(null)
       └─> router.navigate(['/login'])


⏱️ EXPIRATION DU TOKEN
─────────────────────────────────────────────────────────────
1. User fait une requête après expiration
   └─> AuthInterceptor ajoute token expiré
       └─> Backend retourne 401 Unauthorized
           └─> ErrorInterceptor détecte 401
               └─> AuthService.clearSession()
                   └─> Redirect /login
                   └─> Message: "Session expirée"
```

### 💾 localStorage vs sessionStorage

```typescript
┌────────────────────────────────────────────────────────────┐
│              STOCKAGE DES DONNÉES D'AUTH                   │
└────────────────────────────────────────────────────────────┘

localStorage (utilisé dans FitnessPro)
─────────────────────────────────────────
✅ Persiste après fermeture navigateur
✅ Pas de date d'expiration
✅ User reste connecté entre sessions
⚠️ Vulnérable XSS (atténué par JWT expiration)

Stockage:
  localStorage.setItem('fitness_auth_token', token);
  localStorage.setItem('fitness_current_user', JSON.stringify(user));

Lecture:
  const token = localStorage.getItem('fitness_auth_token');
  const user = JSON.parse(localStorage.getItem('fitness_current_user'));


sessionStorage (alternative)
─────────────────────────────────────────
✅ Plus sécurisé (effacé à la fermeture)
❌ User déconnecté si fermeture onglet
❌ Pas pratique pour UX

Utilisation:
  sessionStorage.setItem('token', token);
```

---

<a name="8-communication-api"></a>
## 8. Communication Frontend-Backend

### 🌐 Architecture de Communication

```
┌────────────────────────────────────────────────────────────┐
│           COMMUNICATION FRONTEND ↔️ BACKEND                 │
└────────────────────────────────────────────────────────────┘

FRONTEND (Angular)                    BACKEND (Laravel)
http://localhost:4200                 http://localhost:8000

┌────────────────────┐              ┌──────────────────────┐
│  Component         │              │  Controller          │
│  └─> Service       │              │  └─> traite requête  │
│         ↓          │              │          ↑           │
│  Service           │              │  Middleware          │
│  └─> HttpClient    │──requête────>│  ├─> auth:api       │
│         ↓          │   HTTP       │  ├─> cors           │
│  Interceptor       │              │  └─> throttle        │
│  ├─> add JWT       │              │          ↓           │
│  └─> handle error  │              │  Route               │
│         ↓          │              │  └─> api.php         │
│  🌐 INTERNET       │──────────────│          ↓           │
│         ↓          │              │  Controller Method   │
│  Service reçoit    │<─réponse─────│  ├─> validation     │
│  └─> update state  │   JSON       │  ├─> logic          │
│         ↓          │              │  └─> response        │
│  Component         │              │          ↓           │
│  └─> update UI     │              │  Database Query      │
└────────────────────┘              └──────────────────────┘
```

### 📡 Types de Requêtes HTTP

```typescript
// ═══════════════════════════════════════════════════════════
// CRUD COMPLET (Create, Read, Update, Delete)
// ═══════════════════════════════════════════════════════════

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private apiUrl = `${environment.apiUrl}/workouts`;

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────
  // 📖 READ - Récupérer des données
  // ──────────────────────────────────────────────────────

  // GET /api/workouts - Liste complète
  getAll(): Observable<Workout[]> {
    return this.http.get<Workout[]>(this.apiUrl);
  }

  // GET /api/workouts/42 - Un workout spécifique
  getById(id: number): Observable<Workout> {
    return this.http.get<Workout>(`${this.apiUrl}/${id}`);
  }

  // GET /api/workouts?difficulty=intermediate - Avec filtres
  getByDifficulty(difficulty: string): Observable<Workout[]> {
    const params = new HttpParams().set('difficulty', difficulty);
    return this.http.get<Workout[]>(this.apiUrl, { params });
  }

  // ──────────────────────────────────────────────────────
  // ✏️ CREATE - Créer nouvelles données
  // ──────────────────────────────────────────────────────

  // POST /api/workouts
  create(workout: CreateWorkoutDto): Observable<Workout> {
    return this.http.post<Workout>(this.apiUrl, workout);
  }

  // ──────────────────────────────────────────────────────
  // 🔄 UPDATE - Modifier données existantes
  // ──────────────────────────────────────────────────────

  // PUT /api/workouts/42 - Remplacement complet
  update(id: number, workout: UpdateWorkoutDto): Observable<Workout> {
    return this.http.put<Workout>(`${this.apiUrl}/${id}`, workout);
  }

  // PATCH /api/workouts/42 - Modification partielle
  partialUpdate(id: number, changes: Partial<Workout>): Observable<Workout> {
    return this.http.patch<Workout>(`${this.apiUrl}/${id}`, changes);
  }

  // ──────────────────────────────────────────────────────
  // 🗑️ DELETE - Supprimer données
  // ──────────────────────────────────────────────────────

  // DELETE /api/workouts/42
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### ⚠️ Gestion des Erreurs

```typescript
// ═══════════════════════════════════════════════════════════
// GESTION ROBUSTE DES ERREURS
// ═══════════════════════════════════════════════════════════

getWorkout(id: number): Observable<Workout> {
  return this.http.get<Workout>(`${this.apiUrl}/${id}`)
    .pipe(
      // 1️⃣ Retry automatique (erreur réseau temporaire)
      retry({
        count: 2,             // Réessayer 2 fois
        delay: 1000,          // Attendre 1s entre tentatives
        resetOnSuccess: true
      }),

      // 2️⃣ Timeout (ne pas attendre indéfiniment)
      timeout(10000),  // 10 secondes max

      // 3️⃣ Logging pour debug
      tap(workout => console.log('✅ Workout chargé:', workout)),

      // 4️⃣ Gestion des erreurs
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Erreur:', error);

        // Gérer selon le type d'erreur
        if (error.status === 404) {
          throw new Error(`Workout ${id} introuvable`);
        } else if (error.status === 401) {
          throw new Error('Session expirée');
        } else if (error.status === 0) {
          throw new Error('Pas de connexion internet');
        } else if (error.status >= 500) {
          throw new Error('Erreur serveur');
        }

        throw new Error('Une erreur est survenue');
      })
    );
}
```

---

<a name="9-composants"></a>
## 9. Composants Principaux Détaillés

### 🧩 Anatomie d'un Composant Angular

Un composant Angular est composé de **3 fichiers** :

```
workout.component/
├── workout.component.ts       # Logique (TypeScript)
├── workout.component.html     # Template (HTML)
└── workout.component.scss     # Styles (SCSS)
```

**Exemple complet:**

```typescript
// workout.component.ts
// ═══════════════════════════════════════════════════════════

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { WorkoutService } from './workout.service';
import { Workout } from '@shared/models/workout.model';

@Component({
  selector: 'app-workout',           // Tag HTML: <app-workout>
  templateUrl: './workout.component.html',
  styleUrls: ['./workout.component.scss']
})
export class WorkoutComponent implements OnInit, OnDestroy {
  
  // ─────────────────────────────────────────────────────────
  // PROPRIÉTÉS (State du composant)
  // ─────────────────────────────────────────────────────────
  
  workouts$!: Observable<Workout[]>;    // Flux de données
  isLoading = false;                    // État chargement
  errorMessage = '';                    // Message d'erreur
  
  private subscription?: Subscription;  // Pour cleanup

  // ─────────────────────────────────────────────────────────
  // CONSTRUCTOR (Injection de dépendances)
  // ─────────────────────────────────────────────────────────
  
  constructor(
    private workoutService: WorkoutService,
    private router: Router
  ) {
    // N'initialisez RIEN ici!
    // Utilisez ngOnInit() à la place
  }

  // ─────────────────────────────────────────────────────────
  // LIFECYCLE HOOKS (Hooks de cycle de vie)
  // ─────────────────────────────────────────────────────────
  
  ngOnInit(): void {
    // ✅ Appelé quand le composant est initialisé
    console.log('🔄 WorkoutComponent initialisé');
    
    // S'abonner au flux de données
    this.workouts$ = this.workoutService.workouts$;
    
    // Charger les données
    this.loadWorkouts();
  }

  ngOnDestroy(): void {
    // ✅ Appelé quand le composant est détruit
    // Nettoyer les subscriptions pour éviter memory leaks
    console.log('🗑️ WorkoutComponent détruit');
    this.subscription?.unsubscribe();
  }

  // ─────────────────────────────────────────────────────────
  // MÉTHODES (Actions du composant)
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
        this.errorMessage = 'Erreur de chargement';
        console.error(error);
      }
    });
  }

  createWorkout(): void {
    this.router.navigate(['/workouts/create']);
  }

  deleteWorkout(id: number): void {
    if (confirm('Supprimer ce programme?')) {
      this.workoutService.delete(id).subscribe({
        next: () => this.loadWorkouts(),
        error: (error) => alert('Erreur de suppression')
      });
    }
  }
}
```

```html
<!-- workout.component.html -->
<!-- ═══════════════════════════════════════════════════════════ -->

<div class="workout-container">
  
  <!-- HEADER -->
  <div class="header">
    <h1>Mes Programmes</h1>
    <button class="btn-primary" (click)="createWorkout()">
      Créer un Programme
    </button>
  </div>

  <!-- LOADING STATE -->
  <div *ngIf="isLoading" class="loading">
    <app-spinner></app-spinner>
    <p>Chargement...</p>
  </div>

  <!-- ERROR STATE -->
  <div *ngIf="errorMessage" class="error">
    {{ errorMessage }}
  </div>

  <!-- DATA DISPLAY -->
  <div *ngIf="!isLoading && !errorMessage" class="workout-list">
    <!-- async pipe: s'abonne automatiquement et unsubscribe -->
    <div *ngFor="let workout of workouts$ | async" class="workout-card">
      <h3>{{ workout.name }}</h3>
      <p>{{ workout.description }}</p>
      
      <div class="workout-meta">
        <span>{{ workout.exercises.length }} exercices</span>
        <span>{{ workout.difficulty }}</span>
      </div>

      <div class="workout-actions">
        <button (click)="viewWorkout(workout.id)">Voir</button>
        <button (click)="startWorkout(workout.id)">Commencer</button>
        <button (click)="deleteWorkout(workout.id)" class="btn-danger">
          Supprimer
        </button>
      </div>
    </div>
  </div>

  <!-- EMPTY STATE -->
  <div *ngIf="(workouts$ | async)?.length === 0" class="empty-state">
    <p>Aucun programme trouvé</p>
    <button (click)="createWorkout()">Créer mon premier programme</button>
  </div>

</div>
```

```scss
// workout.component.scss
// ═══════════════════════════════════════════════════════════

.workout-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h1 {
      font-size: 2rem;
      color: $gray-900;
    }

    .btn-primary {
      @include button-base;
      background: $primary-color;
      color: white;

      &:hover {
        background: darken($primary-color, 10%);
      }
    }
  }

  .workout-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;

    .workout-card {
      @include card;
      
      h3 {
        margin-bottom: 0.5rem;
        color: $gray-800;
      }

      p {
        color: $gray-600;
        margin-bottom: 1rem;
      }

      .workout-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;

        span {
          font-size: 0.875rem;
          color: $gray-500;
        }
      }

      .workout-actions {
        display: flex;
        gap: 0.5rem;

        button {
          flex: 1;
          padding: 0.5rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            transform: translateY(-2px);
          }

          &.btn-danger {
            background: $danger-color;
            color: white;
          }
        }
      }
    }
  }

  .loading,
  .error,
  .empty-state {
    text-align: center;
    padding: 3rem;
  }
}
```

### 📊 Cycle de Vie d'un Composant

```
┌────────────────────────────────────────────────────────────┐
│         LIFECYCLE HOOKS (Hooks de Cycle de Vie)           │
└────────────────────────────────────────────────────────────┘

1️⃣ constructor()
   └─> Injection de dépendances
       ⚠️ NE PAS initialiser de données ici!

2️⃣ ngOnInit()
   └─> ✅ Initialisation du composant
       ├─> Chargement des données
       ├─> Abonnement aux Observables
       └─> Configuration initiale

3️⃣ ngOnChanges()
   └─> Appelé quand @Input() change
       (uniquement si le composant a des inputs)

4️⃣ ngDoCheck()
   └─> Détection de changements custom
       (rarement utilisé, coûteux en performance)

5️⃣ ngAfterViewInit()
   └─> Vue DOM complètement initialisée
       ✅ Accès aux éléments du template

6️⃣ ngAfterContentInit()
   └─> Contenu <ng-content> projeté initialisé

7️⃣ ngOnDestroy()
   └─> ✅ Nettoyage avant destruction
       ├─> Unsubscribe des Observables
       ├─> Annuler timers
       └─> Libérer ressources


⏱️ ORDRE D'EXÉCUTION:
   constructor → ngOnInit → ... → ngOnDestroy
```

### 🔄 Communication entre Composants

```typescript
// ═══════════════════════════════════════════════════════════
// COMMUNICATION PARENT → ENFANT (@Input)
// ═══════════════════════════════════════════════════════════

// parent.component.html
<app-workout-card 
  [workout]="selectedWorkout"
  [showActions]="true">
</app-workout-card>

// workout-card.component.ts (enfant)
@Component({...})
export class WorkoutCardComponent {
  @Input() workout!: Workout;        // Donnée du parent
  @Input() showActions = false;      // Avec valeur par défaut
}


// ═══════════════════════════════════════════════════════════
// COMMUNICATION ENFANT → PARENT (@Output)
// ═══════════════════════════════════════════════════════════

// workout-card.component.ts (enfant)
@Component({...})
export class WorkoutCardComponent {
  @Output() workoutDeleted = new EventEmitter<number>();
  
  deleteWorkout(): void {
    // Émettre l'événement vers le parent
    this.workoutDeleted.emit(this.workout.id);
  }
}

// parent.component.html
<app-workout-card
  [workout]="workout"
  (workoutDeleted)="handleDelete($event)">
</app-workout-card>

// parent.component.ts
handleDelete(workoutId: number): void {
  console.log('Workout supprimé:', workoutId);
  // Traiter la suppression
}


// ═══════════════════════════════════════════════════════════
// COMMUNICATION VIA SERVICE (Recommandé)
// ═══════════════════════════════════════════════════════════

// Meilleur pour données partagées entre plusieurs composants

// Component A
this.workoutService.updateWorkout(workout);

// Component B (reçoit automatiquement via Observable)
this.workouts$ = this.workoutService.workouts$;
```

---

**Note:** READMEFR.md fait maintenant ~2000 lignes. Voulez-vous que je continue avec les sections 10-16 (Services, Routing, Guards, Styling, Build, Dev, FAQ)?


<a name="10-services"></a>
## 10. Services et Gestion d'État

### 🧠 Qu'est-ce qu'un Service?

Un **Service** en Angular est une classe qui contient:
- ✅ La logique métier
- ✅ L'état de l'application (données)
- ✅ Les appels API
- ✅ La logique réutilisable

**Pourquoi utiliser des Services?**
- 🔄 **DRY** (Don't Repeat Yourself) - Code partagé
- 🎯 **Séparation des responsabilités** - Component = UI, Service = Logic
- 💾 **Gestion d'état centralisée** - Single source of truth

### 📦 Pattern BehaviorSubject (État Réactif)

```typescript
// ═══════════════════════════════════════════════════════════
// SERVICE AVEC GESTION D'ÉTAT RÉACTIVE
// ═══════════════════════════════════════════════════════════

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'  // Singleton dans toute l'app
})
export class WorkoutService {

  // ─────────────────────────────────────────────────────────
  // ÉTAT RÉACTIF (BehaviorSubject)
  // ─────────────────────────────────────────────────────────
  
  // 💡 BehaviorSubject = Observable + valeur initiale
  private workoutsSubject = new BehaviorSubject<Workout[]>([]);
  
  // 🔒 Observable public (lecture seule)
  public workouts$ = this.workoutsSubject.asObservable();
  
  // 💡 Pourquoi ce pattern?
  // - workoutsSubject = Privé, permet de modifier (next)
  // - workouts$ = Public, permet seulement de lire (subscribe)
  // - Encapsulation: les components ne peuvent pas modifier directement

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────────────────
  // MÉTHODES PUBLIQUES (API du service)
  // ─────────────────────────────────────────────────────────
  
  /**
   * Charger tous les workouts
   */
  loadWorkouts(): Observable<Workout[]> {
    return this.http.get<Workout[]>('/api/workouts')
      .pipe(
        tap(workouts => {
          // Mettre à jour l'état
          this.workoutsSubject.next(workouts);
          console.log('✅ Workouts chargés:', workouts.length);
        })
      );
  }

  /**
   * Créer un nouveau workout
   */
  createWorkout(workout: CreateWorkoutDto): Observable<Workout> {
    return this.http.post<Workout>('/api/workouts', workout)
      .pipe(
        tap(newWorkout => {
          // Ajouter au tableau existant
          const current = this.workoutsSubject.value;
          this.workoutsSubject.next([...current, newWorkout]);
          console.log('✅ Workout créé:', newWorkout.id);
        })
      );
  }

  /**
   * Mettre à jour un workout
   */
  updateWorkout(id: number, updates: Partial<Workout>): Observable<Workout> {
    return this.http.put<Workout>(`/api/workouts/${id}`, updates)
      .pipe(
        tap(updatedWorkout => {
          // Remplacer dans le tableau
          const current = this.workoutsSubject.value;
          const index = current.findIndex(w => w.id === id);
          
          if (index !== -1) {
            current[index] = updatedWorkout;
            this.workoutsSubject.next([...current]);
          }
          
          console.log('✅ Workout mis à jour:', id);
        })
      );
  }

  /**
   * Supprimer un workout
   */
  deleteWorkout(id: number): Observable<void> {
    return this.http.delete<void>(`/api/workouts/${id}`)
      .pipe(
        tap(() => {
          // Retirer du tableau
          const current = this.workoutsSubject.value;
          const filtered = current.filter(w => w.id !== id);
          this.workoutsSubject.next(filtered);
          console.log('✅ Workout supprimé:', id);
        })
      );
  }

  /**
   * Obtenir un workout par ID
   */
  getWorkout(id: number): Observable<Workout | undefined> {
    // D'abord chercher dans le cache
    const cached = this.workoutsSubject.value.find(w => w.id === id);
    
    if (cached) {
      return of(cached);  // Retour immédiat depuis cache
    }
    
    // Sinon, fetch depuis API
    return this.http.get<Workout>(`/api/workouts/${id}`);
  }
}
```

### 🔄 Utilisation dans un Component

```typescript
// workout.component.ts
@Component({...})
export class WorkoutComponent implements OnInit {
  
  // S'abonner au flux de données
  workouts$ = this.workoutService.workouts$;
  
  constructor(private workoutService: WorkoutService) {}
  
  ngOnInit() {
    // Charger les données
    this.workoutService.loadWorkouts().subscribe();
  }
  
  createWorkout(data: CreateWorkoutDto) {
    this.workoutService.createWorkout(data).subscribe({
      next: (workout) => {
        console.log('Créé:', workout);
        // Pas besoin de mettre à jour manuellement!
        // Le service a déjà mis à jour workouts$
        // Le template se met à jour automatiquement
      }
    });
  }
}
```

```html
<!-- workout.component.html -->
<!-- async pipe: subscribe automatiquement -->
<div *ngFor="let workout of workouts$ | async">
  {{ workout.name }}
</div>
```

### 📊 Flux de Données Réactif

```
┌────────────────────────────────────────────────────────────┐
│         FLUX DE DONNÉES AVEC BEHAVIORSUBJECT              │
└────────────────────────────────────────────────────────────┘

1️⃣ INITIALISATION
   Service créé avec BehaviorSubject([])
   │
   ↓
   Components s'abonnent à workouts$
   │
   ↓
   Reçoivent valeur initiale: []


2️⃣ CHARGEMENT DES DONNÉES
   Component appelle: service.loadWorkouts()
   │
   ↓
   Service fait GET /api/workouts
   │
   ↓
   Reçoit: [workout1, workout2, workout3]
   │
   ↓
   Service fait: workoutsSubject.next([workout1, workout2, workout3])
   │
   ↓
   TOUS les components abonnés reçoivent automatiquement!
   │
   ↓
   Templates se mettent à jour (via async pipe)


3️⃣ AJOUT D'UN WORKOUT
   Component appelle: service.createWorkout(data)
   │
   ↓
   Service fait POST /api/workouts
   │
   ↓
   Reçoit: workout4
   │
   ↓
   Service ajoute au tableau: [...current, workout4]
   │
   ↓
   Service fait: workoutsSubject.next([workout1, ..., workout4])
   │
   ↓
   TOUS les components reçoivent la liste mise à jour!
   │
   ↓
   Aucun code à écrire dans les components!
```

---

<a name="11-routing"></a>
## 11. Routing et Navigation

### 🗺️ Système de Routing

Le **Router** Angular gère la navigation sans rechargement de page.

```typescript
// ═══════════════════════════════════════════════════════════
// CONFIGURATION DES ROUTES (app.routes.ts)
// ════��══════════════════════════════════════════════════════

export const routes: Routes = [
  // Route simple
  { 
    path: 'dashboard', 
    component: DashboardComponent 
  },

  // Route avec paramètre
  { 
    path: 'workouts/:id', 
    component: WorkoutDetailComponent 
  },

  // Route avec enfants (nested routes)
  {
    path: 'workouts',
    component: WorkoutLayoutComponent,
    children: [
      { path: '', component: WorkoutListComponent },
      { path: 'create', component: CreateWorkoutComponent },
      { path: ':id', component: WorkoutDetailComponent },
      { path: ':id/edit', component: EditWorkoutComponent }
    ]
  },

  // Route avec guard
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, AdminGuard]
  },

  // Route avec lazy loading
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component')
      .then(m => m.SettingsComponent)
  },

  // Redirection
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },

  // Wildcard (404)
  { 
    path: '**', 
    component: NotFoundComponent 
  }
];
```

### 🧭 Navigation Programmatique

```typescript
// ═══════════════════════════════════════════════════════════
// NAVIGUER DANS LE CODE
// ═══════════════════════════════════════════════════════════

@Component({...})
export class MyComponent {
  constructor(private router: Router) {}

  // Navigation simple
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Navigation avec paramètres
  viewWorkout(id: number) {
    this.router.navigate(['/workouts', id]);
    // Résultat: /workouts/42
  }

  // Navigation avec query params
  searchWorkouts(term: string) {
    this.router.navigate(['/workouts'], {
      queryParams: { search: term, page: 1 }
    });
    // Résultat: /workouts?search=cardio&page=1
  }

  // Navigation relative
  goToEdit() {
    this.router.navigate(['../edit'], {
      relativeTo: this.route
    });
  }

  // Navigation avec état
  createWorkout() {
    this.router.navigate(['/workouts/create'], {
      state: { returnUrl: this.router.url }
    });
  }
}
```

### 📖 Lire les Paramètres de Route

```typescript
// ═══════════════════════════════════════════════════════════
// RÉCUPÉRER LES PARAMÈTRES
// ═══════════════════════════────────────────────────────────

@Component({...})
export class WorkoutDetailComponent implements OnInit {
  workoutId!: number;
  workout$!: Observable<Workout>;

  constructor(
    private route: ActivatedRoute,
    private workoutService: WorkoutService
  ) {}

  ngOnInit() {
    // ─────────────────────────────────────────────────────
    // MÉTHODE 1: Snapshot (valeur actuelle, non-réactive)
    // ─────────────────────────────────────────────────────
    
    this.workoutId = +this.route.snapshot.params['id'];
    console.log('Workout ID:', this.workoutId);
    
    // ⚠️ Problème: Si on navigue de /workouts/1 vers /workouts/2
    //    sans quitter le component, snapshot ne se met pas à jour!

    // ─────────────────────────────────────────────────────
    // MÉTHODE 2: Observable (réactif, recommandé)
    // ─────────────────────────────────────────────────────
    
    this.route.params.subscribe(params => {
      this.workoutId = +params['id'];
      this.loadWorkout(this.workoutId);
    });
    
    // ✅ Se met à jour automatiquement si params change

    // ─────────────────────────────────────────────────────
    // MÉTHODE 3: Observable avec switchMap (meilleur)
    // ─────────────────────────────────────────────────────
    
    this.workout$ = this.route.params.pipe(
      switchMap(params => {
        const id = +params['id'];
        return this.workoutService.getWorkout(id);
      })
    );
    
    // ✅ Annule automatiquement la requête précédente
    // ✅ Pas besoin de unsubscribe (async pipe le fait)

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

### 🔗 Navigation dans le Template

```html
<!-- ══════════════════════════════════════════════════════ -->
<!-- NAVIGATION AVEC routerLink                             -->
<!-- ══════════════════════════════════════════════════════ -->

<!-- Simple -->
<a routerLink="/dashboard">Dashboard</a>

<!-- Avec paramètres -->
<a [routerLink]="['/workouts', workout.id]">Voir</a>
<!-- Résultat: /workouts/42 -->

<!-- Avec query params -->
<a 
  [routerLink]="['/workouts']"
  [queryParams]="{ search: 'cardio', page: 1 }">
  Chercher
</a>
<!-- Résultat: /workouts?search=cardio&page=1 -->

<!-- Relative -->
<a routerLink="../list">Retour</a>

<!-- Active class -->
<a 
  routerLink="/dashboard" 
  routerLinkActive="active"
  [routerLinkActiveOptions]="{ exact: true }">
  Dashboard
</a>

<!-- Style CSS appliqué quand route active -->
<style>
  a.active {
    color: blue;
    font-weight: bold;
  }
</style>
```

---

<a name="12-guards-interceptors"></a>
## 12. Guards et Interceptors

### 🛡️ Guards (Protection des Routes)

Les **Guards** protègent l'accès aux routes.

```typescript
// ═══════════════════════════════════════════════════════════
// AUTH GUARD - Protection des routes authentifiées
// ═══════════════════════════════════════════════════════════

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard: Vérification pour', state.url);

  // Vérifier si user connecté
  if (authService.isAuthenticated) {
    console.log('✅ AuthGuard: Accès autorisé');
    return true;  // ✅ Autoriser l'accès
  }

  // ❌ Pas connecté, rediriger vers login
  console.warn('🚫 AuthGuard: Accès refusé, redirect login');
  
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }  // Sauvegarder destination
  });
  
  return false;  // ❌ Bloquer l'accès
};

// ─────────────────────────────────────────────────────────
// Utilisation dans les routes
// ─────────────────────────────────────────────────────────

{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]  // ✅ Route protégée
}
```

```typescript
// ═══════════════════════════════════════════════════════════
// GUEST GUARD - Redirection si déjà connecté
// ═══════════════════════════════════════════════════════════

export const GuestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si déjà connecté, rediriger vers dashboard
  if (authService.isAuthenticated) {
    console.log('🔄 GuestGuard: Déjà connecté, redirect dashboard');
    router.navigate(['/dashboard']);
    return false;
  }

  // Pas connecté, autoriser accès à login/register
  return true;
};

// ─────────────────────────────────────────────────────────
// Utilisation
// ─────────────────────────────────────────────────────────

{
  path: 'login',
  component: LoginComponent,
  canActivate: [GuestGuard]  // ✅ Redirect si déjà connecté
}
```

### 🔌 Interceptors (Middleware HTTP)

Les **Interceptors** transforment toutes les requêtes HTTP.

```typescript
// ═══════════════════════════════════════════════════════════
// AUTH INTERCEPTOR - Ajout automatique du token JWT
// ═══════════════════════════════════════════════════════════

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  console.log('🔌 AuthInterceptor:', req.method, req.url);

  // Récupérer le token
  const token = authService.token;

  // Si pas de token, continuer sans modification
  if (!token) {
    console.log('  ⚠️ Pas de token');
    return next(req);
  }

  // Cloner la requête et ajouter le token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('  ✅ Token ajouté');
  
  // Continuer avec la requête modifiée
  return next(authReq);
};

// ─────────────────────────────────────────────────────────
// Configuration dans app.config.ts
// ─────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])  // ✅ Activé globalement
    )
  ]
};

// Maintenant TOUTES les requêtes HTTP auront le token!
```

```typescript
// ═══════════════════════════════════════════════════════════
// ERROR INTERCEPTOR - Gestion globale des erreurs
// ═══════════════════════════════════════════════════════════

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ HTTP Error:', error);

      // Gérer selon le code d'erreur
      switch (error.status) {
        case 401:
          // Token invalide/expiré
          console.warn('🔒 401 Unauthorized - Déconnexion');
          authService.logout();
          router.navigate(['/login']);
          break;

        case 403:
          // Accès interdit
          console.warn('🚫 403 Forbidden');
          router.navigate(['/forbidden']);
          break;

        case 404:
          // Ressource non trouvée
          console.warn('🔍 404 Not Found');
          break;

        case 500:
          // Erreur serveur
          console.error('💥 500 Server Error');
          // Afficher message global
          break;

        case 0:
          // Erreur réseau
          console.error('🌐 Network Error');
          // Afficher message "Pas de connexion"
          break;
      }

      // Re-throw l'erreur pour que les components la gèrent
      return throwError(() => error);
    })
  );
};
```

---

<a name="13-styling"></a>
## 13. Styling et Design System

### 🎨 Organisation SCSS

```
styles/
├── _variables.scss    # Variables (couleurs, tailles)
├── _mixins.scss       # Mixins réutilisables
├── _reset.scss        # Reset CSS
└── _utilities.scss    # Classes utilitaires
```

```scss
// ═══════════════════════════════════════════════════════════
// _variables.scss - Source unique de vérité
// ═══════════════════════════════════════════════════════════

// Couleurs primaires
$primary-color: #21bf73;      // Vert principal
$secondary-color: #8b5cf6;    // Violet
$success-color: #10b981;      // Vert succès
$danger-color: #ef4444;       // Rouge
$warning-color: #f59e0b;      // Orange

// Couleurs de texte
$gray-900: #111827;
$gray-800: #1f2937;
$gray-700: #374151;
$gray-600: #4b5563;
$gray-500: #6b7280;
$gray-400: #9ca3af;
$gray-300: #d1d5db;
$gray-200: #e5e7eb;
$gray-100: #f3f4f6;

// Espacements (base 4px)
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px

// Typographie
$font-family: 'Inter', -apple-system, sans-serif;
$font-size-xs: 0.75rem;    // 12px
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$font-size-xl: 1.25rem;    // 20px
$font-size-2xl: 1.5rem;    // 24px

// Rayons de bordure
$border-radius-sm: 0.375rem;  // 6px
$border-radius: 0.75rem;      // 12px
$border-radius-lg: 1rem;      // 16px

// Ombres
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

// Breakpoints responsive
$breakpoint-sm: 640px;   // Mobile
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Desktop
$breakpoint-xl: 1280px;  // Large desktop
```

```scss
// ═══════════════════════════════════════════════════════════
// _mixins.scss - Styles réutilisables
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

// Mobile-first approach (recommandé)
.container {
  // Styles mobile par défaut
  padding: 1rem;
  
  // Tablet et plus
  @include respond-to($breakpoint-md) {
    padding: 2rem;
  }
  
  // Desktop et plus
  @include respond-to($breakpoint-lg) {
    padding: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}

// Grid responsive
.grid {
  display: grid;
  gap: 1rem;
  
  // Mobile: 1 colonne
  grid-template-columns: 1fr;
  
  // Tablet: 2 colonnes
  @include respond-to($breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  // Desktop: 3 colonnes
  @include respond-to($breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

<a name="14-build-deploiement"></a>
## 14. Build et Déploiement

### 🏗️ Build de Production

```bash
# Build optimisé pour production
ng build

# Ou avec npm
npm run build

# Ce qui se passe:
# 1. Compilation TypeScript → JavaScript
# 2. Compilation SCSS → CSS
# 3. AOT (Ahead-of-Time) compilation
# 4. Tree shaking (suppression code inutilisé)
# 5. Minification
# 6. Compression gzip/brotli
# 7. Génération source maps

# Output dans: dist/frontend/
```

### ▲ Déploiement sur Vercel

```bash
# 1️⃣ Installation Vercel CLI
npm install -g vercel

# 2️⃣ Login
vercel login

# 3️⃣ Déploiement
vercel

# 4️⃣ Production
vercel --prod
```

**Configuration Vercel** (`vercel.json`):

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

### 🔧 Optimisations Build

```json
// angular.json - Configuration build optimisée

{
  "configurations": {
    "production": {
      "optimization": true,          // ✅ Optimisations activées
      "outputHashing": "all",        // ✅ Cache busting
      "sourceMap": false,            // ❌ Pas de source maps
      "namedChunks": false,          // ❌ Chunks anonymes
      "aot": true,                   // ✅ AOT compilation
      "extractLicenses": true,
      "buildOptimizer": true,        // ✅ Build optimizer
      "budgets": [                   // ⚠️ Limites de taille
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

<a name="15-developpement"></a>
## 15. Développement et Bonnes Pratiques

### 📝 Conventions de Nommage

```typescript
// ═══════════════════════════════════════════════════════════
// CONVENTIONS TYPESCRIPT/ANGULAR
// ═══════════════════════════════════════════════════════════

// Fichiers
workout.component.ts          // ✅ kebab-case
workoutService.ts             // ❌ Pas bon
workout-service.ts            // ✅ Correct

// Classes
export class WorkoutComponent  // ✅ PascalCase
export class workoutService    // ❌ Pas bon

// Variables et fonctions
const workoutCount = 10;       // ✅ camelCase
const WorkoutCount = 10;       // ❌ Pas bon

// Constantes
const API_URL = '...';         // ✅ UPPER_SNAKE_CASE
const MAX_RETRIES = 3;         // ✅ Correct

// Interfaces
interface Workout { }          // ✅ PascalCase
interface IWorkout { }         // ❌ Éviter préfixe I

// Observables
workouts$                      // ✅ Suffixe $
workoutsObservable            // ❌ Pas besoin

// Privé
private _count = 0;            // ✅ Préfixe _
private count = 0;             // ✅ Aussi acceptable
```

### ✅ Bonnes Pratiques

```typescript
// ═══════════════════════════════════════════════════════════
// BONNES PRATIQUES ANGULAR
// ═══════════════════════════════════════════════════════════

// ✅ Utiliser async pipe (évite les memory leaks)
<div *ngFor="let workout of workouts$ | async">

// ❌ Éviter subscribe dans le template
<div *ngFor="let workout of workouts">  // Besoin de subscribe manuellement

// ✅ Unsubscribe dans ngOnDestroy
ngOnDestroy() {
  this.subscription.unsubscribe();
}

// ✅ Ou utiliser takeUntil
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

// ✅ Typage fort
getWorkout(id: number): Observable<Workout> {  // ✅ Types explicites
  return this.http.get<Workout>(`/api/workouts/${id}`);
}

// ❌ any est mal
getWorkout(id: any): any {  // ❌ Éviter any
  return this.http.get(`/api/workouts/${id}`);
}

// ✅ Readonly pour propriétés non modifiables
readonly API_URL = 'https://api.com';

// ✅ Services en singleton
@Injectable({ providedIn: 'root' })  // ✅ Singleton
export class WorkoutService { }
```

---

<a name="16-depannage"></a>
## 16. Dépannage et FAQ

### 🐛 Problèmes Courants

#### ❌ Erreur: Cannot GET /api/...

**Cause:** Backend API non démarré ou URL incorrecte

**Solution:**
```bash
# Vérifier que le backend tourne
cd backend
php artisan serve

# Vérifier environment.ts
apiUrl: 'http://localhost:8000/api'
```

#### ❌ CORS Errors

**Cause:** Configuration CORS backend

**Solution:** Vérifier `backend/config/cors.php`:
```php
'allowed_origins' => ['http://localhost:4200'],
```

#### ❌ Token JWT expiré

**Cause:** Session expirée

**Solution:** L'AuthInterceptor gère automatiquement, redirection vers login

#### ❌ Module not found

**Cause:** Import incorrect

**Solution:**
```typescript
// ❌ Mauvais
import { Workout } from '../models/workout';

// ✅ Correct (avec alias @)
import { Workout } from '@shared/models/workout.model';
```

### 💡 Commandes Utiles

```bash
# Démarrer dev server
ng serve

# Build production
ng build

# Lancer les tests
ng test

# Générer component
ng generate component features/my-component

# Générer service
ng generate service core/services/my-service

# Analyser le bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json

# Linter
ng lint
```

### 📚 Ressources

- [Angular Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Angular Style Guide](https://angular.io/guide/styleguide)

---

## 🎉 Conclusion

Vous avez maintenant une compréhension complète du frontend FitnessPro!

**Points clés:**
- ✅ Architecture en couches (Components → Services → API)
- ✅ Gestion d'état réactive avec RxJS
- ✅ Authentification JWT sécurisée
- ✅ Routing et navigation SPA
- ✅ Communication API robuste
- ✅ Design system cohérent
- ✅ Bonnes pratiques Angular

**Prochaines étapes:**
1. Explorer le code source
2. Créer vos premiers composants
3. Expérimenter avec les services
4. Contribuer au projet!

---

**Version:** 2.1.0  
**Dernière mise à jour:** Novembre 2025  
**Auteur:** Yoan Petrov


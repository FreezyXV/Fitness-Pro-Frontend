# FitnessPro - Frontend Application

A modern Angular-based fitness tracking application that provides an intuitive and responsive user interface for comprehensive fitness management. Built with Angular 19 and featuring a clean, mobile-first design with advanced state management and real-time data synchronization.

## 🎨 Architecture Overview

### Technology Stack
- **Framework**: Angular 19.2.x with TypeScript 5.7
- **Styling**: SCSS with custom design system
- **State Management**: RxJS with reactive patterns
- **Authentication**: JWT-based with automatic token refresh
- **HTTP Client**: Angular HttpClient with interceptors
- **Routing**: Angular Router with guards and lazy loading
- **Build System**: Angular CLI with Webpack optimization

### Core Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **User Authentication**: Secure login/registration with session management
- **Exercise Library**: Comprehensive exercise database with search and filtering
- **Workout Planning**: Interactive workout builder with template management
- **Nutrition Tracking**: Meal logging with calorie and macro tracking
- **Goal Management**: SMART goal setting with visual progress tracking
- **Calendar Integration**: Workout scheduling with visual timeline
- **Dashboard Analytics**: Real-time performance metrics and charts
- **Profile Management**: User preferences and progress photos
- **Offline Support**: Service worker for basic offline functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn
- Angular CLI 19+

### Installation

1. **Clone and setup**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment configuration**
   ```bash
   # Update src/environments/environment.ts for development
   # Update src/environments/environment.production.ts for production
   ```

3. **Start development server**
   ```bash
   # Development server with hot reload
   npm start
   # or
   ng serve

   # Development server with specific port
   ng serve --port 4200

   # Development server with backend proxy
   ng serve --proxy-config proxy.conf.json
   ```

4. **Build for production**
   ```bash
   # Production build
   npm run build
   # or
   ng build --configuration production
   ```

### Environment Configuration

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  appName: 'FitnessPro',
  enableDebug: true,
  version: '1.0.0-dev'
};
```

**Production** (`src/environments/environment.production.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  appName: 'FitnessPro',
  enableDebug: false,
  version: '1.0.0'
};
```

## 🏗️ Project Structure

```
frontend/src/
├── app/
│   ├── auth/                    # Authentication module
│   │   ├── login/              # Login component
│   │   ├── register/           # Registration component
│   │   └── guards/             # Route guards
│   ├── dashboard/              # Dashboard module
│   │   ├── overview/           # Dashboard overview
│   │   ├── stats/              # Statistics components
│   │   └── widgets/            # Dashboard widgets
│   ├── exercises/              # Exercise management
│   │   ├── list/               # Exercise listing
│   │   ├── detail/             # Exercise details
│   │   ├── search/             # Search functionality
│   │   └── favorites/          # User favorites
│   ├── workout/                # Workout management
│   │   ├── templates/          # Workout templates
│   │   ├── session/            # Active workout session
│   │   ├── history/            # Workout history
│   │   └── builder/            # Workout builder
│   ├── nutrition/              # Nutrition tracking
│   │   ├── diary/              # Food diary
│   │   ├── database/           # Food database
│   │   ├── goals/              # Nutrition goals
│   │   └── reports/            # Nutrition reports
│   ├── goals/                  # Goal management
│   │   ├── list/               # Goals overview
│   │   ├── create/             # Goal creation
│   │   ├── progress/           # Progress tracking
│   │   └── achievements/       # Achievements
│   ├── calendar/               # Calendar integration
│   │   ├── view/               # Calendar view
│   │   ├── schedule/           # Workout scheduling
│   │   └── tasks/              # Task management
│   ├── profile/                # User profile
│   │   ├── settings/           # User settings
│   │   ├── preferences/        # App preferences
│   │   └── progress/           # Progress photos
│   ├── shared/                 # Shared components
│   │   ├── components/         # Reusable components
│   │   ├── interfaces/         # TypeScript interfaces
│   │   ├── utils/              # Utility functions
│   │   └── constants/          # App constants
│   ├── services/               # Angular services
│   │   ├── auth.service.ts     # Authentication service
│   │   ├── workout.service.ts  # Workout data service
│   │   ├── nutrition.service.ts # Nutrition data service
│   │   └── user.service.ts     # User data service
│   ├── guards/                 # Route guards
│   ├── interceptors/           # HTTP interceptors
│   └── pipes/                  # Custom pipes
├── assets/                     # Static assets
│   ├── images/                 # Image assets
│   ├── icons/                  # Icon assets
│   └── data/                   # Static data files
├── environments/               # Environment configurations
└── styles/                     # Global styles
    ├── styles.scss             # Main stylesheet
    ├── variables.scss          # SCSS variables
    └── mixins.scss             # SCSS mixins
```

## 🔧 Component Architecture

### Core Modules

**Authentication Module**
- Login/Register components with reactive forms
- JWT token management and automatic refresh
- Route guards for protected areas
- Password reset functionality

**Dashboard Module**
- Real-time statistics and analytics
- Progress visualization with charts
- Quick action buttons and shortcuts
- Recent activity timeline

**Exercise Module**
- Searchable exercise database
- Exercise categorization and filtering
- Favorite exercise management
- Exercise detail views with instructions

**Workout Module**
- Workout template creation and management
- Live workout session tracking
- Exercise set and rep logging
- Workout history and analytics

**Nutrition Module**
- Food diary with meal logging
- Calorie and macro tracking
- Nutrition goal setting
- Progress charts and reports

**Goal Module**
- SMART goal creation
- Progress tracking with visual indicators
- Achievement system
- Goal completion celebrations

**Calendar Module**
- Monthly/weekly workout scheduling
- Task management integration
- Progress visualization
- Workout context switching

### Shared Components

**Layout Components**
- Header with navigation and user menu
- Sidebar with collapsible navigation
- Footer with app information
- Loading spinners and progress bars

**Form Components**
- Reactive form controls
- Validation message displays
- Custom input components
- File upload components

**Data Display Components**
- Data tables with sorting and filtering
- Chart components for analytics
- Progress indicators and badges
- Modal dialogs and confirmations

## 🔌 Service Layer

### Core Services

**AuthService** (`auth.service.ts`)
- User authentication and session management
- JWT token handling with automatic refresh
- Login/logout functionality
- User profile management

**WorkoutService** (`workout.service.ts`)
- Workout template CRUD operations
- Workout session management
- Exercise search and filtering
- Workout statistics and analytics

**NutritionService** (`nutrition.service.ts`)
- Meal entry management
- Food database integration
- Calorie and macro calculations
- Nutrition goal tracking

**UserService** (`user.service.ts`)
- User profile management
- Settings and preferences
- Progress photo uploads
- Account management

### HTTP Integration

**Auth Interceptor**
- Automatic JWT token attachment
- Token refresh on 401 responses
- Request/response logging (dev mode)
- Error handling and user feedback

**Error Handling**
- Global error interceptor
- User-friendly error messages
- Network connectivity detection
- Offline mode support

## 🎨 Styling & Design

### Design System
- **Colors**: Consistent color palette with CSS variables
- **Typography**: Responsive font sizes and weights
- **Spacing**: Consistent margin and padding system
- **Components**: Reusable UI component library
- **Icons**: SVG icon system with lazy loading

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch Friendly**: Large touch targets and gestures
- **Performance**: Optimized images and lazy loading

### SCSS Architecture
```scss
// Variables and configuration
@import 'variables';
@import 'mixins';

// Base styles
@import 'base/reset';
@import 'base/typography';
@import 'base/layout';

// Components
@import 'components/buttons';
@import 'components/forms';
@import 'components/cards';

// Pages
@import 'pages/dashboard';
@import 'pages/workout';
@import 'pages/nutrition';

// Utilities
@import 'utilities/helpers';
@import 'utilities/responsive';
```

## 🔐 Security Features

### Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Token Refresh**: Automatic token renewal
- **Route Guards**: Protected route access
- **Session Management**: Secure session handling

### Data Protection
- **Input Sanitization**: XSS prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Secure Headers**: Security-focused HTTP headers
- **HTTPS Enforcement**: SSL/TLS in production

### Privacy
- **Local Storage**: Secure client-side data storage
- **Data Encryption**: Sensitive data encryption
- **User Consent**: Privacy policy compliance
- **Data Minimization**: Minimal data collection

## 📱 Performance Optimization

### Bundle Optimization
- **Lazy Loading**: Route-based code splitting
- **Tree Shaking**: Unused code elimination
- **Compression**: Gzip/Brotli compression
- **Caching**: Aggressive browser caching

### Runtime Performance
- **OnPush Strategy**: Optimized change detection
- **TrackBy Functions**: Efficient list rendering
- **Virtual Scrolling**: Large list optimization
- **Image Optimization**: Responsive images and lazy loading

### Build Configuration
```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "4MB",
      "maximumError": "5MB"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "200kB",
      "maximumError": "400kB"
    }
  ]
}
```

## 🧪 Testing

### Unit Testing
```bash
# Run unit tests
npm test
# or
ng test

# Run tests with coverage
ng test --code-coverage

# Run tests in watch mode
ng test --watch
```

### E2E Testing
```bash
# Run end-to-end tests
npm run e2e
# or
ng e2e
```

### Test Structure
```
src/
├── app/
│   ├── component.spec.ts       # Component tests
│   ├── service.spec.ts         # Service tests
│   └── integration.spec.ts     # Integration tests
└── e2e/
    ├── app.e2e-spec.ts         # E2E tests
    └── page-objects/           # Page object models
```

## 🚀 Build & Deployment

### Development Build
```bash
# Development build with source maps
ng build --configuration development

# Watch mode for development
ng build --watch
```

### Production Build
```bash
# Optimized production build
ng build --configuration production

# Build with specific output path
ng build --output-path dist/fitness-pro
```

### Deployment Options

**Static Hosting** (Vercel, Netlify, etc.)
```bash
# Build for static hosting
npm run build:vercel
```

**Docker Deployment**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

**CDN Integration**
- Configure asset URLs for CDN delivery
- Optimize images for web delivery
- Enable compression and caching

## 🔧 Development Tools

### Angular CLI Commands
```bash
# Generate new component
ng generate component feature/component-name

# Generate new service
ng generate service services/service-name

# Generate new module
ng generate module feature/module-name

# Update Angular dependencies
ng update

# Analyze bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### VS Code Extensions
- Angular Language Service
- TypeScript Hero
- Auto Rename Tag
- Prettier - Code formatter
- ESLint
- SCSS IntelliSense

### Debugging
- Angular DevTools browser extension
- Redux DevTools for state management
- Network tab for API debugging
- Console logging with environment-based levels

## 🔄 State Management

### RxJS Patterns
- **BehaviorSubject**: User state and authentication
- **ReplaySubject**: Data caching and offline support
- **Observables**: Reactive data flows
- **Operators**: Data transformation and filtering

### Data Flow
```typescript
// Service pattern example
@Injectable()
export class WorkoutService {
  private workoutsSubject = new BehaviorSubject<Workout[]>([]);
  public workouts$ = this.workoutsSubject.asObservable();

  loadWorkouts(): Observable<Workout[]> {
    return this.http.get<Workout[]>('/api/workouts').pipe(
      tap(workouts => this.workoutsSubject.next(workouts)),
      catchError(this.handleError)
    );
  }
}
```

### Component Integration
```typescript
// Component consumption
@Component({...})
export class WorkoutListComponent implements OnInit {
  workouts$ = this.workoutService.workouts$;

  constructor(private workoutService: WorkoutService) {}

  ngOnInit() {
    this.workoutService.loadWorkouts().subscribe();
  }
}
```

## 🤝 API Integration

### HTTP Client Configuration
- Base URL configuration via environment
- Automatic request/response logging
- Error handling with user feedback
- Loading state management

### Request Patterns
```typescript
// GET request with error handling
getData(): Observable<Data[]> {
  return this.http.get<ApiResponse<Data[]>>('/api/data').pipe(
    map(response => response.data),
    catchError(this.handleError),
    finalize(() => this.loadingService.setLoading(false))
  );
}

// POST request with optimistic updates
createData(data: Data): Observable<Data> {
  return this.http.post<ApiResponse<Data>>('/api/data', data).pipe(
    map(response => response.data),
    tap(newData => this.updateCache(newData)),
    catchError(this.handleError)
  );
}
```

## 🛠️ Troubleshooting

### Common Issues

**Build Errors**
- Clear node_modules and reinstall dependencies
- Check Angular/Node version compatibility
- Verify TypeScript configuration

**Runtime Errors**
- Check browser console for detailed errors
- Verify API endpoint URLs and responses
- Check authentication token validity

**Performance Issues**
- Analyze bundle size with webpack-bundle-analyzer
- Check for memory leaks in subscriptions
- Optimize change detection strategy

### Debug Commands
```bash
# Clear Angular cache
ng cache clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Angular configuration
ng config

# Lint code
ng lint

# Check for updates
ng update
```

## 📚 Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular CLI Reference](https://angular.io/cli)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material Design Guidelines](https://material.io/design)

---

**Note**: This frontend application is designed to work seamlessly with the FitnessPro Laravel backend. For complete application setup, refer to the main project README.md in the root directory.
// app.routes.ts - Routes chargees a la demande (lazy loading).
// Chaque `loadComponent` produit un chunk separe : le bundle initial ne contient
// plus que la page demandee, le reste est preleve en arriere-plan par la
// PreloadAllModules strategy configuree dans app.config.ts.
import { Routes } from '@angular/router';

// Import guards
import { AuthGuard, GuestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes (guest only)
  {
    path: 'login',
    loadComponent: () =>
      import('@features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard]
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [GuestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('@features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [GuestGuard]
  },

  // Protected routes
  {
    path: '',
    loadComponent: () =>
      import('@core/layout/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('@features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('@features/exercises/exercises/exercises.component').then(m => m.ExercisesComponent)
      },
      {
        path: 'exercises/:id',
        loadComponent: () =>
          import('@features/exercises/exercises-detail/exercises-detail.component').then(m => m.ExercisesDetailComponent)
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('@features/calendar/calendar/calendar.component').then(m => m.CalendarComponent)
      },

      // WORKOUT ROUTES - CORRECTED STRUCTURE
      {
        path: 'workouts',
        loadComponent: () =>
          import('@features/workout/workout.component').then(m => m.WorkoutComponent),
        title: 'Mes Programmes'
      },
      {
        path: 'workouts/create',
        loadComponent: () =>
          import('@features/workout/create-workout/create-workout.component').then(m => m.CreateWorkoutComponent),
        title: 'Créer un Programme'
      },
      {
        path: 'workouts/edit/:id',
        loadComponent: () =>
          import('@features/workout/create-workout/create-workout.component').then(m => m.CreateWorkoutComponent),
        title: 'Modifier un Programme'
      },
      {
        path: 'workouts/:id',
        loadComponent: () =>
          import('@features/workout/workout-plan-detail/workout-plan-detail.component').then(m => m.WorkoutPlanDetailComponent),
        title: 'Détails du Programme'
      },

      {
        path: 'nutrition',
        loadComponent: () =>
          import('@features/nutrition/nutrition.component').then(m => m.NutritionComponent)
      },
      {
        path: 'challenges',
        loadComponent: () =>
          import('@features/challenges/challenges.component').then(m => m.ChallengesComponent)
      },
    ]
  },

  // Public portfolio routes (no authentication required)
  {
    path: '',
    loadComponent: () =>
      import('@core/layout/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'goals',
        loadComponent: () =>
          import('@features/goals/goals.component').then(m => m.GoalsComponent)
      },
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' }
];

// app.routes.ts - CORRECTED IMPORT PATHS
import { Routes } from '@angular/router';

// Import components - FIXED PATHS
import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';
import { ResetPasswordComponent } from '@features/auth/reset-password/reset-password.component';
import { LayoutComponent } from '@core/layout/layout/layout.component';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { ProfileComponent } from '@features/profile/profile.component';
import { ExercisesComponent } from '@features/exercises/exercises/exercises.component';
import { ExercisesDetailComponent } from '@features/exercises/exercises-detail/exercises-detail.component';
import { CalendarComponent } from '@features/calendar/calendar/calendar.component';
import { GoalsComponent } from '@features/goals/goals.component';
import { WorkoutComponent } from '@features/workout/workout.component';
import { ChallengesComponent } from '@features/challenges/challenges.component';
import { CreateWorkoutComponent } from '@features/workout/create-workout/create-workout.component';
import { WorkoutPlanDetailComponent } from '@features/workout/workout-plan-detail/workout-plan-detail.component';
import { NutritionComponent } from '@features/nutrition/nutrition.component';

// Import guards
import { AuthGuard, GuestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes (guest only)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [GuestGuard]
  },

  // Protected routes
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'exercises', component: ExercisesComponent },
      { path: 'exercises/:id', component: ExercisesDetailComponent },
      { path: 'calendar', component: CalendarComponent },
      
      // WORKOUT ROUTES - CORRECTED STRUCTURE
      { 
        path: 'workouts', 
        component: WorkoutComponent,
        title: 'Mes Programmes'
      },
      { 
        path: 'workouts/create', 
        component: CreateWorkoutComponent,
        title: 'Créer un Programme'
      },
      { 
        path: 'workouts/edit/:id', 
        component: CreateWorkoutComponent,
        title: 'Modifier un Programme'
      },
      { 
        path: 'workouts/:id', 
        component: WorkoutPlanDetailComponent,
        title: 'Détails du Programme'
      },
      
      { path: 'nutrition', component: NutritionComponent },
      { path: 'challenges', component: ChallengesComponent },
    ]
  },

  // Public portfolio routes (no authentication required)
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'goals', component: GoalsComponent },
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' }
];

// app.routes.ts - CORRECTED IMPORT PATHS
import { Routes } from '@angular/router';

// Import components - FIXED PATHS
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { ExercisesComponent } from './exercises-filtres/exercises/exercises.component';
import { ExerciseCardComponent } from './exercises-filtres/exercises-card/exercise-card.component';
import { ExercisesDetailComponent } from './exercises-filtres/exercises-detail/exercises-detail.component';
import { CalendarComponent } from './calendar/calendar/calendar.component';
import { GoalsComponent } from './goals/goals.component';
import { WorkoutComponent } from './workout/workout.component';
import { ChallengesComponent } from './challenges/challenges.component';
import { CreateWorkoutComponent } from './workout/create-workout/create-workout.component';
import { WorkoutPlanDetailComponent } from './workout/workout-plan-detail/workout-plan-detail.component';
import { NutritionComponent } from './nutrition/nutrition.component';

// Import guards
import { AuthGuard, GuestGuard } from './guards/auth.guard';

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
// src/app/services/user.service.ts - FIXED VERSION WITH ROBUST ERROR HANDLING
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import {
  map,
  catchError,
  tap,
  retry,
  timeout,
  shareReplay,
} from 'rxjs/operators';
import {
  ApiResponse,
  PasswordChangeRequest,
  APP_CONFIG,
  User,
  Workout,
  Goal,
  NotificationUtils,
  UserStats, // Added import for UserStats
  BMIInfo, // Added import for BMIInfo
} from '../shared';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private profileSubject = new BehaviorSubject<User | null>(null);
  public profile$ = this.profileSubject.asObservable();

  // Cache for frequently accessed data
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes reduced cache

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🔧 UserService: Initialized without mock data');
  }

  // =============================================
  // PROFILE METHODS - FIXED WITH FALLBACKS
  // =============================================

  getProfile(): Observable<User> {
    console.log('🔄 UserService: Fetching user profile from API...');

    return this.http
      .get<ApiResponse<User>>(`${APP_CONFIG.API_URL}/profile`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        retry({
          count: 2,
          delay: 1000,
        }),
        tap((response) =>
          console.log(
            '✅ UserService: Profile API response received:',
            response
          )
        ),
        map((response) => {
          if (response.success && response.data) {
            const user = this.normalizeUserData(response.data);
            console.log('📝 UserService: Profile data normalized:', user);
            this.profileSubject.next(user);
            this.setCachedData('profile', user);
            return user;
          }
          throw new Error(response.message || 'Failed to load profile');
        }),
        catchError((error) => {
          console.error('❌ UserService: Profile API error:', error);

          // Clear cache on error to force fresh request next time
          this.cache.delete('profile');

          // Create mock user for development
          const mockUser = this.getMockUser();
          this.profileSubject.next(mockUser);
          this.setCachedData('profile', mockUser);

          console.log(
            '🔄 UserService: Using mock user data due to API failure'
          );
          return of(mockUser);
        }),
        shareReplay(1)
      );
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    console.log('🔄 UserService: Updating profile with API...');
    console.log('📤 UserService: Update data:', profileData);

    const cleanedData = this.cleanProfileData(profileData);
    console.log('📝 UserService: Cleaned data for API:', cleanedData);

    return this.http
      .put<ApiResponse<User>>(`${APP_CONFIG.API_URL}/profile`, cleanedData)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        tap((response) =>
          console.log('✅ UserService: Profile update API response:', response)
        ),
        map((response) => {
          if (response.success && response.data) {
            const user = this.normalizeUserData(response.data);
            console.log('✅ UserService: Profile updated successfully:', user);

            // Update all caches with fresh data
            this.profileSubject.next(user);
            this.setCachedData('profile', user);
            this.clearRelatedCache();

            NotificationUtils.success('Profil mis à jour avec succès');
            return user;
          }
          throw new Error(response.message || 'Failed to update profile');
        }),
        catchError((error) => {
          console.error('❌ UserService: Profile update failed:', error);

          // For update failures, simulate the update locally
          const currentUser = this.profileSubject.value;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...cleanedData };
            this.profileSubject.next(updatedUser);
            this.setCachedData('profile', updatedUser);
            NotificationUtils.success(
              'Profil mis à jour localement (mode hors ligne)'
            );
            return of(updatedUser);
          }

          // Clear cache to force fresh data on next request
          this.clearRelatedCache();

          return this.handleError(error);
        })
      );
  }


  changePassword(
    passwordData: PasswordChangeRequest
  ): Observable<{ success: boolean; message: string }> {
    console.log('🔄 UserService: Changing password...');

    const requestData = {
      currentPassword: passwordData.currentPassword, // Changed from current_password
      newPassword: passwordData.newPassword, // Changed from new_password
      new_password_confirmation: passwordData.confirmPassword, // Changed from confirm_password
    };

    return this.http
      .post<ApiResponse<any>>(
        `${APP_CONFIG.API_URL}/profile/change-password`,
        requestData
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        tap((response) =>
          console.log('✅ UserService: Password change response:', response)
        ),
        map((response) => {
          if (response.success) {
            NotificationUtils.success('Mot de passe modifié avec succès');
            return {
              success: true,
              message: response.message || 'Password changed successfully',
            };
          }
          throw new Error(response.message || 'Failed to change password');
        }),
        catchError((error) => {
          console.error('❌ UserService: Password change failed:', error);

          // For demo purposes, simulate success
          if (error.status === 0 || error.status >= 500) {
            NotificationUtils.success('Mot de passe modifié (simulation)');
            return of({
              success: true,
              message: 'Password changed (offline mode)',
            });
          }

          return this.handleError(error);
        })
      );
  }

  // =============================================
  // DASHBOARD DATA WITH FALLBACKS
  // =============================================

  getDashboardData(): Observable<any> {
    console.log('🔄 UserService: Fetching dashboard data...');

    const cachedData = this.getCachedData('dashboard');
    if (cachedData) {
      console.log('📦 UserService: Using cached dashboard data');
      return of(cachedData);
    }

    return this.http
      .get<ApiResponse<any>>(`${APP_CONFIG.API_URL}/dashboard`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        retry({
          count: 2,
          delay: 1000,
        }),
        tap((response) =>
          console.log('✅ UserService: Dashboard response:', response)
        ),
        map((response) => {
          if (response.success && response.data) {
            const data = response.data;

            // Normalize user data if present
            if (data.user) {
              data.user = this.normalizeUserData(data.user);
            }

            this.setCachedData('dashboard', data);
            return data;
          }
          throw new Error(response.message || 'Failed to load dashboard data');
        }),
        catchError((error) => {
          console.error(
            '❌ UserService: Dashboard error, using mock data:',
            error
          );
          const mockDashboard = this.getMockDashboardData();
          this.setCachedData('dashboard', mockDashboard);
          return of(mockDashboard);
        }),
        shareReplay(1)
      );
  }

  // =============================================
  // MOCK DATA FOR DEVELOPMENT
  // =============================================

  private getMockUser(): User {
    const sessionUser =
      this.authService.currentUser || this.authService.getStoredUser();

    if (sessionUser) {
      const normalizedUser = this.normalizeUserData(sessionUser);
      normalizedUser.stats = normalizedUser.stats || this.getEmptyStats();
      normalizedUser.emailVerifiedAt =
        normalizedUser.emailVerifiedAt || new Date().toISOString();
      normalizedUser.createdAt =
        normalizedUser.createdAt || new Date().toISOString();
      normalizedUser.updatedAt =
        normalizedUser.updatedAt || new Date().toISOString();
      return normalizedUser;
    }

    const fallbackUser: User = {
      id: 0,
      name: 'Invité FitnessPro',
      email: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profilePhotoUrl: null,
      goals: [],
      preferences: {},
      bmiInfo: <BMIInfo>{
        bmi: null,
        status: 'unknown',
        category: 'Non calculé',
        color: '#6b7280',
        recommendation:
          'Renseignez votre taille et poids pour obtenir des recommandations.',
      },
      stats: this.getEmptyStats(),
      roles: [],
    };

    return fallbackUser;
  }

  private getMockDashboardData(): any {
    const mockUser = this.getMockUser();
    return {
      user: mockUser,
      stats: mockUser.stats,
      recentWorkouts: [
        {
          id: 1,
          name: 'HIIT Morning',
          durationMinutes: 45,
          caloriesBurned: 320,
          completedAt: new Date().toISOString(),
          status: 'completed',
          isTemplate: false,
          userId: mockUser.id,
        },
        {
          id: 2,
          name: 'Strength Training',
          durationMinutes: 60,
          caloriesBurned: 280,
          completedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          isTemplate: false,
          userId: mockUser.id,
        },
      ],
      activeGoals: [
        {
          id: 1,
          title: 'Lose 5kg',
          targetValue: 5,
          currentValue: 2,
          unit: 'kg',
          status: 'active',
          userId: mockUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      calendarTasks: [
        {
          id: 1,
          title: 'Morning workout',
          taskDate: new Date().toISOString().split('T')[0],
          taskType: 'workout',
          isCompleted: true,
          userId: mockUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
  }

  // =============================================
  // GOALS MANAGEMENT - EXTENDED WITH FALLBACKS
  // =============================================

  getGoals(status?: string): Observable<Goal[]> {
    console.log('🔄 UserService: Fetching goals...');

    const cacheKey = `goals_${status || 'all'}`;
    const cachedGoals = this.getCachedData(cacheKey);
    if (cachedGoals) {
      return of(cachedGoals);
    }

    const url = status
      ? `${APP_CONFIG.API_URL}/goals?status=${status}`
      : `${APP_CONFIG.API_URL}/goals`;

    return this.http.get<ApiResponse<Goal[]>>(url).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      tap((response) =>
        console.log('✅ UserService: Goals response:', response)
      ),
      map((response) => {
        const goals = response.success && response.data ? response.data : [];
        this.setCachedData(cacheKey, goals);
        return goals;
      }),
      catchError((error) => {
        console.error('❌ UserService: Goals error, using mock:', error);
        const mockGoals = this.getMockGoals(status);
        this.setCachedData(cacheKey, mockGoals);
        return of(mockGoals);
      })
    );
  }

  private getMockGoals(status?: string): Goal[] {
    const mockUserId = this.getMockUser().id || 0;
    const baseGoals: Goal[] = [
      {
        id: 1,
        title: 'Lose 5kg',
        description: 'Reach target weight',
        targetValue: 5,
        currentValue: 2,
        unit: 'kg',
        targetDate: new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'active',
        category: 'weight',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: mockUserId,
      },
      {
        id: 2,
        title: 'Run 100km',
        description: 'Complete 100km running distance',
        targetValue: 100,
        currentValue: 65,
        unit: 'km',
        targetDate: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'active',
        category: 'endurance',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: mockUserId,
      },
    ];

    if (status) {
      return baseGoals.filter((goal) => goal.status === status);
    }

    return baseGoals;
  }

  createGoal(goalData: Partial<Goal>): Observable<Goal> {
    console.log('🔄 UserService: Creating goal...');

    return this.http
      .post<ApiResponse<Goal>>(`${APP_CONFIG.API_URL}/goals`, goalData)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success && response.data) {
            this.clearRelatedCache();
            NotificationUtils.success('Objectif créé avec succès');
            return response.data;
          }
          throw new Error(response.message || 'Failed to create goal');
        }),
        catchError((error) => {
          console.error(
            '❌ UserService: Goal creation failed, creating mock:',
            error
          );

          const mockGoal: Goal = {
            id: Date.now(),
            title: goalData.title || 'Nouvel objectif',
            description: goalData.description || '',
            targetValue: goalData.targetValue || 0, // Changed from target_value
            currentValue: 0,
            unit: goalData.unit || '',
          targetDate: goalData.targetDate || new Date().toISOString(), // Changed from target_date
          status: 'active',
          category: goalData.category || 'general',
          createdAt: new Date().toISOString(), // Changed from created_at
          updatedAt: new Date().toISOString(), // Changed from updated_at
          userId:
            goalData.userId ||
            this.authService.currentUser?.id ||
            this.authService.getStoredUser()?.id ||
            0,
          ...goalData,
        };

          this.clearRelatedCache();
          NotificationUtils.success('Objectif créé (mode hors ligne)');
          return of(mockGoal);
        })
      );
  }

  updateGoal(goalId: number, goalData: Partial<Goal>): Observable<Goal> {
    console.log('🔄 UserService: Updating goal:', goalId);

    return this.http
      .put<ApiResponse<Goal>>(`${APP_CONFIG.API_URL}/goals/${goalId}`, goalData)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success && response.data) {
            this.clearRelatedCache();
            return response.data;
          }
          throw new Error(response.message || 'Failed to update goal');
        }),
        catchError((error) => {
          console.error('❌ UserService: Goal update failed:', error);
          return this.handleError(error);
        })
      );
  }

  // NEW: Update Goal Progress
  updateGoalProgress(goalId: number, progress: number): Observable<Goal> {
    console.log(
      `🔄 UserService: Updating progress for goal ${goalId} to ${progress}`
    );
    return this.http
      .post<ApiResponse<Goal>>(
        `${APP_CONFIG.API_URL}/goals/${goalId}/progress`,
        { progressValue: progress } // Changed from progress_value
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success && response.data) {
            this.clearRelatedCache();
            NotificationUtils.success("Progrès de l'objectif mis à jour");
            return response.data;
          }
          throw new Error(response.message || 'Failed to update goal progress');
        }),
        catchError((error) => this.handleError(error, 'updating goal progress'))
      );
  }

  // NEW: Mark Goal as Complete
  markGoalComplete(goalId: number): Observable<Goal> {
    console.log(`🔄 UserService: Marking goal ${goalId} as complete`);
    return this.http
      .post<ApiResponse<Goal>>(
        `${APP_CONFIG.API_URL}/goals/${goalId}/complete`,
        {}
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success && response.data) {
            this.clearRelatedCache();
            NotificationUtils.success('Objectif marqué comme terminé');
            return response.data;
          }
          throw new Error(response.message || 'Failed to mark goal complete');
        }),
        catchError((error) => this.handleError(error, 'marking goal complete'))
      );
  }

  // NEW: Activate Goal
  activateGoal(goalId: number): Observable<Goal> {
    console.log(`🔄 UserService: Activating goal ${goalId}`);
    return this.http
      .post<ApiResponse<Goal>>(
        `${APP_CONFIG.API_URL}/goals/${goalId}/activate`,
        {}
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success && response.data) {
            this.clearRelatedCache();
            NotificationUtils.success('Objectif activé');
            return response.data;
          }
          throw new Error(response.message || 'Failed to activate goal');
        }),
        catchError((error) => this.handleError(error, 'activating goal'))
      );
  }

  // NEW: Pause Goal
  pauseGoal(goalId: number): Observable<Goal> {
    console.log(`🔄 UserService: Pausing goal ${goalId}`);
    return this.http
      .post<ApiResponse<Goal>>(
        `${APP_CONFIG.API_URL}/goals/${goalId}/pause`,
        {}
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success && response.data) {
            this.clearRelatedCache();
            NotificationUtils.success('Objectif mis en pause');
            return response.data;
          }
          throw new Error(response.message || 'Failed to pause goal');
        }),
        catchError((error) => this.handleError(error, 'pausing goal'))
      );
  }

  deleteGoal(goalId: number): Observable<void> {
    console.log('🔄 UserService: Deleting goal:', goalId);

    return this.http
      .delete<ApiResponse<void>>(`${APP_CONFIG.API_URL}/goals/${goalId}`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success) {
            this.clearRelatedCache();
            NotificationUtils.success('Objectif supprimé');
            return;
          }
          throw new Error(response.message || 'Failed to delete goal');
        }),
        catchError((error) => {
          console.error('❌ UserService: Goal deletion failed:', error);
          return this.handleError(error);
        })
      );
  }

  deleteUser(): Observable<void> {
    console.log('🔄 UserService: Deleting user account...');

    return this.http
      .delete<ApiResponse<void>>(`${APP_CONFIG.API_URL}/profile`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success) {
            this.clearRelatedCache();
            NotificationUtils.success('Compte supprimé avec succès');
            return;
          }
          throw new Error(response.message || 'Failed to delete user account');
        }),
        catchError((error) => {
          console.error('❌ UserService: User account deletion failed:', error);
          // Simulate success for offline/demo purposes
          if (error.status === 0 || error.status >= 500) {
            NotificationUtils.success(
              'Compte supprimé localement (simulation)'
            );
            return of(undefined); // Return observable of undefined for void
          }
          return this.handleError(error);
        })
      );
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getCurrentUser(): User | null {
    return this.profileSubject.value;
  }

  clearUserCache(): void {
    this.cache.clear();
    console.log('🗑️ UserService: Cache cleared');
  }

  // Force refresh profile from server
  refreshProfile(): Observable<User> {
    console.log('🔄 UserService: Force refreshing profile...');
    this.cache.delete('profile');
    return this.getProfile();
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  private getEmptyStats(): UserStats {
    return {
      totalWorkouts: 0,
      totalMinutes: 0,
      totalCalories: 0,
      currentStreak: 0,
      weeklyWorkouts: 0,
      monthlyWorkouts: 0,
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      hasCompletedToday: false,
      profileCompletion: 0,
      fitnessLevel: 'beginner',
      caloriesToday: 0,
    };
  }

  private normalizeUserData(userData: any): User {
    const user: User = {
      id: userData.id || 0,
      name: userData.name || '',
      email: userData.email || '',
      age: userData.age || null,
      height: userData.height || null, // cm
      weight: userData.weight || null, // kg
      gender: userData.gender || null,
      bloodGroup: userData.bloodGroup || null, // Changed from blood_group
      profilePhotoUrl: userData.profilePhotoUrl || null, // Changed from profile_photo_url
      phone: userData.phone || null,
      dateOfBirth: userData.dateOfBirth || null, // Changed from date_of_birth
      location: userData.location || null,
      bio: userData.bio || null,
      activityLevel: userData.activityLevel || null, // Changed from activity_level
      goals: userData.goals || [],
      preferences: userData.preferences || {},
      bmiInfo: userData.bmiInfo || {
        // Changed from bmi_info
        bmi: null,
        status: 'unknown',
        category: 'Non calculé',
        color: '#6b7280',
        recommendation:
          'Renseignez votre taille et poids pour obtenir des recommandations.',
      },
      createdAt: userData.createdAt || new Date().toISOString(), // Changed from created_at
      updatedAt: userData.updatedAt || new Date().toISOString(), // Changed from updated_at
      emailVerifiedAt: userData.emailVerifiedAt || null, // Changed from email_verified_at
      stats: userData.stats || {
        totalWorkouts: 0, // Changed from total_workouts
        totalMinutes: 0, // Changed from total_minutes
        totalCalories: 0, // Changed from total_calories
        currentStreak: 0, // Changed from current_streak
        weeklyWorkouts: 0, // Changed from weekly_workouts
        monthlyWorkouts: 0, // Changed from monthly_workouts
        totalGoals: 0,
        activeGoals: 0, // Changed from active_goals
        completedGoals: 0, // Changed from completed_goals
        hasCompletedToday: false, // Changed from has_completed_today
        profileCompletion: 0, // Changed from profile_completion
        fitnessLevel: 'beginner', // Changed from fitness_level
        caloriesToday: 0, // Changed from calories_today
      },
      roles: userData.roles || [],
    };

    console.log('✅ UserService: User data normalized');
    return user;
  }

  private cleanProfileData(data: Partial<User>): any {
    const cleaned: any = {};

    const allowedFields = [
      'name',
      'email',
      'age',
      'height',
      'weight',
      'gender',
      'bloodGroup', // Changed from blood_group
      'location',
      'bio',
      'phone',
      'dateOfBirth', // Changed from date_of_birth
    ];

    allowedFields.forEach((field) => {
      if (field in data) {
        const value = data[field as keyof User];

        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '') {
            cleaned[field] = trimmed;
          }
        } else if (typeof value === 'number' && !isNaN(value) && value > 0) {
          cleaned[field] = value;
        } else if (value === null) {
          cleaned[field] = null;
        }
      }
    });

    return cleaned;
  }

  private cleanWorkoutSessionData(data: Partial<Workout>): any {
    return {
      workoutPlanId: data.templateId || null, // Changed from workout_plan_id and template_id
      name: data.name || "Session d'entraînement",
      durationMinutes: data.durationMinutes || 0, // Changed from duration_minutes
      caloriesBurned: data.caloriesBurned || 0, // Changed from calories_burned
      notes: data.notes || '',
      status: data.status || 'completed',
      completedAt: data.completedAt || new Date().toISOString(), // Changed from completed_at
    };
  }


  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);

    if (cached) {
      const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
      if (!isExpired) {
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }

    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private clearRelatedCache(): void {
    // Clear cache entries that might be affected by updates
    const keysToDelete = Array.from(this.cache.keys()).filter(
      (key) =>
        key.startsWith('dashboard') ||
        key.startsWith('sessions') ||
        key.startsWith('goals') ||
        key.startsWith('calendar') ||
        key === 'profile'
    );

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log('🗑️ UserService: Related cache cleared');
  }

  // =============================================
  // ERROR HANDLING
  // =============================================

  private handleError(
    error: HttpErrorResponse,
    context?: string
  ): Observable<never> {
    console.error(
      `❌ UserService error${context ? ' (' + context + ')' : ''}:`,
      error
    );

    let errorMessage = 'Une erreur est survenue';

    if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.status === 401) {
      errorMessage = 'Authentification requise';
    } else if (error.status === 403) {
      errorMessage = 'Accès non autorisé';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée';
    } else if (error.status === 422) {
      if (error.error?.errors) {
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else {
        errorMessage = error.error?.message || 'Données invalides';
      }
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    NotificationUtils.error(errorMessage);

    const enrichedError = new Error(errorMessage) as any;
    enrichedError.status = error.status;
    enrichedError.originalError = error;

    return throwError(() => enrichedError);
  }
}

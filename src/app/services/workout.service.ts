// src/app/services/workout.service.ts - FIXED TYPE ERRORS
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  of,
  throwError,
  timer,
  EMPTY,
} from 'rxjs';
import {
  map,
  catchError,
  tap,
  retry,
  timeout,
  shareReplay,
  finalize,
  switchMap,
} from 'rxjs/operators';
// Removed import for WorkoutContext from workout.model.ts

import {
  APP_CONFIG,
  NotificationUtils,
  Workout,
  WorkoutExercise,
  CreateWorkoutRequest,
  LogWorkoutRequest,
  WorkoutStats,
  ApiResponse,
  WorkoutContext, // Added import for WorkoutContext from app.interfaces.ts
} from '../shared';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private readonly API_BASE = `${APP_CONFIG.API_URL}/workouts`;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // State management
  private workoutTemplatesSubject = new BehaviorSubject<Workout[]>([]);
  private workoutSessionsSubject = new BehaviorSubject<Workout[]>([]);
  private currentTemplateSubject = new BehaviorSubject<Workout | null>(null);
  private workoutStatsSubject = new BehaviorSubject<WorkoutStats | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public workoutTemplates$ = this.workoutTemplatesSubject.asObservable();
  public workoutSessions$ = this.workoutSessionsSubject.asObservable();
  public currentTemplate$ = this.currentTemplateSubject.asObservable();
  public workoutStats$ = this.workoutStatsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Cache
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  private initializeService(): void {
    // Auto-cleanup cache every 10 minutes
    timer(0, 10 * 60 * 1000).subscribe(() => {
      this.cleanupExpiredCache();
    });
  }

  // =============================================
  // WORKOUT TEMPLATES (Plans d'entraînement)
  // =============================================

  getWorkoutTemplates(filters?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): Observable<Workout[]> {
    const cacheKey = this.getCacheKey('templates', filters);

    const cached = this.getCachedData<Workout[]>(cacheKey);
    if (cached) {
      this.workoutTemplatesSubject.next(cached);
      return of(cached);
    }

    this.setLoading(true);

    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() && value !== 'all') {
          params = params.set(key, value);
        }
      });
    }

    return this.http
      .get<ApiResponse<Workout[]>>(`${this.API_BASE}/templates`, { params })
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        retry({
          count: 2,
          delay: (error, retryCount) => timer(1000 * retryCount),
        }),
        switchMap((response) => {
          const templates =
            this.extractDataFromResponse<Workout[]>(response) || [];

          // Auto-seed demo workouts if no templates exist and no filters applied
          if (templates.length === 0 && !filters) {
            return this.seedPortfolioWorkouts().pipe(
              switchMap(() => this.http.get<ApiResponse<Workout[]>>(`${this.API_BASE}/templates`, { params })),
              map((retryResponse) => {
                const retryTemplates = this.extractDataFromResponse<Workout[]>(retryResponse) || [];
                this.workoutTemplatesSubject.next(retryTemplates);
                this.setCachedData(cacheKey, retryTemplates);
                return retryTemplates;
              }),
              catchError(() => {
                this.workoutTemplatesSubject.next(templates);
                this.setCachedData(cacheKey, templates);
                return of(templates);
              })
            );
          }

          this.workoutTemplatesSubject.next(templates);
          this.setCachedData(cacheKey, templates);
          return of(templates);
        }),
        catchError((error) => {
          console.error('Error loading workout templates:', error);

          // If authentication error, try public endpoint for portfolio visitors
          if (error.status === 401) {
            return this.http.get<ApiResponse<Workout[]>>(`${APP_CONFIG.API_URL}/workouts/templates/public`).pipe(
              map((publicResponse) => {
                const publicTemplates = this.extractDataFromResponse<Workout[]>(publicResponse) || [];
                this.workoutTemplatesSubject.next(publicTemplates);
                this.setCachedData(cacheKey, publicTemplates);
                return publicTemplates;
              }),
              catchError(() => {
                this.workoutTemplatesSubject.next([]);
                return of([]);
              })
            );
          }

          this.workoutTemplatesSubject.next([]);
          return of([]);
        }),
        finalize(() => this.setLoading(false))
      );
  }

  getCurrentTemplate(): Observable<Workout | null> {
    const cacheKey = 'current-template';

    const cached = this.getCachedData<Workout>(cacheKey);
    if (cached) {
      this.currentTemplateSubject.next(cached);
      return of(cached);
    }

    return this.http
      .get<ApiResponse<Workout>>(`${this.API_BASE}/templates/current`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const template = this.extractDataFromResponse<Workout>(response);
          if (template) {
            this.currentTemplateSubject.next(template);
            this.setCachedData(cacheKey, template);
          }
          return template;
        }),
        catchError((error) => {
          console.warn('No current template found:', error);
          this.currentTemplateSubject.next(null);
          return of(null);
        })
      );
  }

  getWorkoutTemplate(id: number): Observable<Workout | null> {
    const cacheKey = `template-${id}`;

    const cached = this.getCachedData<Workout>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<ApiResponse<Workout>>(`${this.API_BASE}/templates/${id}`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const template = this.extractDataFromResponse<Workout>(response);
          if (template) {
            this.setCachedData(cacheKey, template);
          }
          return template;
        }),
        catchError((error) => {
          console.error(`Error loading workout template ${id}:`, error);
          return of(null);
        })
      );
  }

  createWorkoutTemplate(
    templateData: CreateWorkoutRequest
  ): Observable<Workout> {
    this.setLoading(true);

    return this.http
      .post<ApiResponse<Workout>>(`${this.API_BASE}/templates`, templateData)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const template = this.extractDataFromResponse<Workout>(response);
          if (template) {
            this.invalidateCache('templates');
            this.refreshTemplates();
            NotificationUtils.success(
              "Programme d'entraînement créé avec succès"
            );
            return template;
          }
          throw new Error('Failed to create workout template');
        }),
        catchError((error) =>
          this.handleError(error, 'creating workout template')
        ),
        finalize(() => this.setLoading(false))
      );
  }

  updateWorkoutTemplate(
    id: number,
    templateData: Partial<CreateWorkoutRequest>
  ): Observable<Workout> {
    this.setLoading(true);

    return this.http
      .put<ApiResponse<Workout>>(
        `${this.API_BASE}/templates/${id}`,
        templateData
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const template = this.extractDataFromResponse<Workout>(response);
          if (template) {
            this.invalidateCache('templates');
            this.invalidateCache(`template-${id}`);
            this.refreshTemplates();
            NotificationUtils.success(
              "Programme d'entraînement modifié avec succès"
            );
            return template;
          }
          throw new Error('Failed to update workout template');
        }),
        catchError((error) =>
          this.handleError(error, 'updating workout template')
        ),
        finalize(() => this.setLoading(false))
      );
  }

  deleteWorkoutTemplate(id: number): Observable<void> {
    this.setLoading(true);

    return this.http
      .delete<ApiResponse<void>>(`${this.API_BASE}/templates/${id}`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success) {
            this.invalidateCache('templates');
            this.invalidateCache(`template-${id}`);
            this.refreshTemplates();
            NotificationUtils.success("Programme d'entraînement supprimé");
            return;
          }
          throw new Error('Failed to delete workout template');
        }),
        catchError((error) =>
          this.handleError(error, 'deleting workout template')
        ),
        finalize(() => this.setLoading(false))
      );
  }

  duplicateWorkoutTemplate(id: number): Observable<Workout> {
    this.setLoading(true);

    return this.http
      .post<ApiResponse<Workout>>(
        `${this.API_BASE}/templates/${id}/duplicate`,
        {}
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const template = this.extractDataFromResponse<Workout>(response);
          if (template) {
            this.invalidateCache('templates');
            this.refreshTemplates();
            NotificationUtils.success("Programme d'entraînement dupliqué");
            return template;
          }
          throw new Error('Failed to duplicate workout template');
        }),
        catchError((error) =>
          this.handleError(error, 'duplicating workout template')
        ),
        finalize(() => this.setLoading(false))
      );
  }

  // =============================================
  // WORKOUT SESSIONS (Sessions d'entraînement)
  // =============================================

  getWorkoutSessions(params?: {
    limit?: number;
    days?: number;
    status?: string;
    template_id?: number;
  }): Observable<Workout[]> {
    const cacheKey = this.getCacheKey('sessions', params);

    const cached = this.getCachedData<Workout[]>(cacheKey);
    if (cached) {
      this.workoutSessionsSubject.next(cached);
      return of(cached);
    }

    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<ApiResponse<Workout[]>>(`${this.API_BASE}/logs`, {
        params: httpParams,
      })
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        retry(2),
        map((response) => {
          const sessions =
            this.extractDataFromResponse<Workout[]>(response) || [];
          this.workoutSessionsSubject.next(sessions);
          this.setCachedData(cacheKey, sessions);
          return sessions;
        }),
        catchError((error) => {
          console.warn('Error loading workout sessions:', error);
          this.workoutSessionsSubject.next([]);
          return of([]);
        })
      );
  }

  getWorkoutSession(id: number): Observable<Workout | null> {
    return this.http
      .get<ApiResponse<Workout>>(`${this.API_BASE}/logs/${id}`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => this.extractDataFromResponse<Workout>(response)),
        catchError((error) => {
          console.error(`Error loading workout session ${id}:`, error);
          return of(null);
        })
      );
  }

  startWorkoutSession(templateId?: number): Observable<Workout> {
    const payload = templateId ? { template_id: templateId } : {};

    return this.http
      .post<ApiResponse<Workout>>(`${this.API_BASE}/start`, payload)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const session = this.extractDataFromResponse<Workout>(response);
          if (session) {
            this.invalidateCache('sessions');
            NotificationUtils.success("Session d'entraînement démarrée");
            return session;
          }
          throw new Error('Failed to start workout session');
        }),
        catchError((error) =>
          this.handleError(error, 'starting workout session')
        )
      );
  }

  completeWorkoutSession(
    sessionId: number,
    sessionData: {
      notes?: string;
      duration_minutes?: number;
      exercises?: any[];
    }
  ): Observable<Workout> {
    return this.http
      .post<ApiResponse<Workout>>(
        `${this.API_BASE}/logs/${sessionId}/complete`,
        sessionData
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const session = this.extractDataFromResponse<Workout>(response);
          if (session) {
            this.invalidateCache('sessions');
            this.refreshSessions();
            NotificationUtils.success("Session d'entraînement terminée");
            return session;
          }
          throw new Error('Failed to complete workout session');
        }),
        catchError((error) =>
          this.handleError(error, 'completing workout session')
        )
      );
  }

  logWorkout(workoutData: LogWorkoutRequest): Observable<Workout> {
    return this.http
      .post<ApiResponse<Workout>>(`${this.API_BASE}/logs`, workoutData)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const session = this.extractDataFromResponse<Workout>(response);
          if (session) {
            this.invalidateCache('sessions');
            this.refreshSessions();
            NotificationUtils.success('Entraînement enregistré');
            return session;
          }
          throw new Error('Failed to log workout');
        }),
        catchError((error) => this.handleError(error, 'logging workout'))
      );
  }

  deleteWorkoutSession(sessionId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.API_BASE}/logs/${sessionId}`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          if (response.success) {
            this.invalidateCache('sessions');
            this.refreshSessions();
            NotificationUtils.success('Session supprimée');
            return;
          }
          throw new Error('Failed to delete workout session');
        }),
        catchError((error) =>
          this.handleError(error, 'deleting workout session')
        )
      );
  }

  // =============================================
  // STATISTICS
  // =============================================

  getWorkoutStats(): Observable<WorkoutStats> {
    const cacheKey = 'workout-stats';

    const cached = this.getCachedData<WorkoutStats>(cacheKey);
    if (cached) {
      this.workoutStatsSubject.next(cached);
      return of(cached);
    }

    return this.http
      .get<ApiResponse<WorkoutStats>>(`${this.API_BASE}/stats`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const stats = this.extractDataFromResponse<WorkoutStats>(response);
          const finalStats = stats || this.getDefaultStats();
          this.workoutStatsSubject.next(finalStats);
          this.setCachedData(cacheKey, finalStats, 60000); // Cache for 1 minute
          return finalStats;
        }),
        catchError((error) => {
          console.warn('Error loading workout stats:', error);
          const defaultStats = this.getDefaultStats();
          this.workoutStatsSubject.next(defaultStats);
          return of(defaultStats);
        })
      );
  }

  getWeeklyStats(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.API_BASE}/stats/weekly`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => this.extractDataFromResponse(response)),
        catchError((error) => {
          console.warn('Error loading weekly stats:', error);
          return of(null);
        })
      );
  }

  getMonthlyStats(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.API_BASE}/stats/monthly`)
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => this.extractDataFromResponse(response)),
        catchError((error) => {
          console.warn('Error loading monthly stats:', error);
          return of(null);
        })
      );
  }

  getConsistencyScore(days: number = 30): Observable<number> {
    return this.http
      .get<ApiResponse<{ consistency_score: number; period_days: number }>>(
        `${this.API_BASE}/stats/consistency`,
        {
          params: { days: days.toString() },
        }
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map((response) => {
          const data = this.extractDataFromResponse(response);
          return data?.consistency_score || 0;
        }),
        catchError((error) => {
          console.warn('Error loading consistency score:', error);
          return of(0);
        })
      );
  }

  // =============================================
  // PORTFOLIO SEEDING
  // =============================================

  private seedPortfolioWorkouts(): Observable<any> {
    return this.http.post(`${APP_CONFIG.API_URL}/workouts-portfolio-seed`, {});
  }

  // =============================================
  // EXERCISES (pour création de workouts)
  // =============================================

  getExercises(filters?: {
    body_part?: string;
    difficulty?: string;
    category?: string;
    search?: string;
  }): Observable<WorkoutExercise[]> {
    const cacheKey = this.getCacheKey('exercises', filters);

    const cached = this.getCachedData<WorkoutExercise[]>(cacheKey);
    if (cached) {
      return of(cached);
    }

    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() && value !== 'all') {
          params = params.set(key, value);
        }
      });
    }

    return this.http
      .get<ApiResponse<WorkoutExercise[]>>(`${APP_CONFIG.API_URL}/exercises`, {
        params,
      })
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        retry(2),
        map((response) => {
          const exercises =
            this.extractDataFromResponse<WorkoutExercise[]>(response) || [];
          this.setCachedData(cacheKey, exercises);
          return exercises;
        }),
        catchError((error) => {
          console.warn('Error loading exercises:', error);
          return of([]);
        })
      );
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private extractDataFromResponse<T>(response: ApiResponse<T>): T | null {
    let data: any = null;

    if (response && response.success && response.data !== undefined) {
      data = response.data;
    } else if (Array.isArray(response)) {
      // Handle direct array responses (e.g., from public endpoints)
      data = response;
    } else if (response && !response.success) {
      console.warn('API response not successful:', response.message);
      return null;
    } else {
      data = response;
    }

    // Transform workout data to match frontend interface
    if (data && (Array.isArray(data) && this.isWorkoutArray(data)) || this.isWorkout(data)) {
      data = this.transformWorkoutData(data);
    }

    return data || null;
  }

  private isWorkout(data: any): boolean {
    return data && typeof data === 'object' && 'name' in data && 'type' in data;
  }

  private isWorkoutArray(data: any[]): boolean {
    return data.length > 0 && this.isWorkout(data[0]);
  }

  private transformWorkoutData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(workout => this.transformSingleWorkout(workout));
    }
    return this.transformSingleWorkout(data);
  }

  private transformSingleWorkout(workout: any): any {
    if (!workout) return workout;

    return {
      ...workout,
      // Map API properties to frontend interface expectations
      category: workout.type || workout.category,
      difficultyLevel: workout.difficulty || workout.difficultyLevel,
      durationMinutes: workout.estimatedDuration || workout.durationMinutes,
      caloriesBurned: workout.estimatedCalories || workout.caloriesBurned,
    };
  }

  private refreshTemplates(): void {
    this.getWorkoutTemplates().subscribe();
    this.getCurrentTemplate().subscribe();
  }

  private refreshSessions(): void {
    this.getWorkoutSessions().subscribe();
  }

  private refreshStats(): void {
    this.getWorkoutStats().subscribe();
  }

  private getDefaultStats(): WorkoutStats {
    return {
      totalWorkouts: 0, // Changed from total_workouts
      totalMinutes: 0, // Changed from total_minutes
      totalCalories: 0, // Changed from total_calories
      currentStreak: 0, // Changed from current_streak
      weeklyWorkouts: 0, // Changed from weekly_workouts
      monthlyWorkouts: 0, // Changed from monthly_workouts
      averageDuration: 0, // Changed from average_duration
      favoriteCategory: 'strength', // Changed from favorite_category
    };
  }

  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  private getCacheKey(prefix: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${prefix}_${btoa(paramsString)}`.substring(0, 50);
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  private setCachedData(key: string, data: any, customDuration?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private invalidateCache(pattern: string): void {
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    });
  }

  // =============================================
  // ERROR HANDLING & LOADING
  // =============================================

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private handleError(error: any, context: string): Observable<never> {
    console.error(`❌ WorkoutService error ${context}:`, error);

    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 422:
          if (error.error?.error?.validation_errors) {
            const validationErrors = Object.values(
              error.error.error.validation_errors
            ).flat();
            errorMessage = validationErrors.join(', ');
          } else if (error.error?.errors) {
            const validationErrors = Object.values(error.error.errors).flat();
            errorMessage = validationErrors.join(', ');
          } else {
            errorMessage = error.error?.message || 'Données invalides';
          }
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}`;
      }
    }

    this.setError(errorMessage);
    NotificationUtils.error(errorMessage);

    return throwError(() => new Error(errorMessage));
  }

  // =============================================
  // PUBLIC GETTERS
  // =============================================

  get currentTemplate(): Workout | null {
    return this.currentTemplateSubject.value;
  }

  get workoutTemplates(): Workout[] {
    return this.workoutTemplatesSubject.value;
  }

  get workoutSessions(): Workout[] {
    return this.workoutSessionsSubject.value;
  }

  get workoutStats(): WorkoutStats | null {
    return this.workoutStatsSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get currentError(): string | null {
    return this.errorSubject.value;
  }

  // =============================================
  // PUBLIC METHODS
  // =============================================

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ WorkoutService cache cleared');
  }

  refreshAllData(): Observable<boolean> {
    return this.getWorkoutTemplates().pipe(
      switchMap(() => this.getWorkoutSessions()),
      switchMap(() => this.getWorkoutStats()),
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Test connectivity
  testConnection(): Observable<boolean> {
    return this.http.get<ApiResponse<any>>(`${APP_CONFIG.API_URL}/test`).pipe(
      timeout(5000),
      map((response) => response.success),
      catchError(() => of(false))
    );
  }

  // Add this method to WorkoutService
  getWorkoutContext(date: string): Observable<WorkoutContext> {
    return this.http
      .get<ApiResponse<WorkoutContext>>(
        `${APP_CONFIG.API_URL}/calendar/workout-context`,
        { params: { date } }
      )
      .pipe(
        timeout(APP_CONFIG.REQUEST_TIMEOUT),
        map(
          (response) =>
            this.extractDataFromResponse<WorkoutContext>(response) || {
              hasWorkoutToday: false,
              workoutType: undefined,
              workoutDuration: undefined,
              estimatedCaloriesBurned: undefined,
              isPreWorkout: undefined,
              isPostWorkout: undefined,
            }
        ),
        catchError((error) => {
          console.error('Error loading workout context:', error);
          return of({
            hasWorkoutToday: false,
            workoutType: undefined,
            workoutDuration: undefined,
            estimatedCaloriesBurned: undefined,
            isPreWorkout: undefined,
            isPostWorkout: undefined,
          });
        })
      );
  }

  // Get debug information
  getDebugInfo(): any {
    return {
      templates_count: this.workoutTemplates.length,
      sessions_count: this.workoutSessions.length,
      stats: this.workoutStats,
      is_loading: this.isLoading,
      current_error: this.currentError,
      cache_size: this.cache.size,
      api_base: this.API_BASE,
    };
  }
}

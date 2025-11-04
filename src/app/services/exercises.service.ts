import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, from } from 'rxjs';
import { map, catchError, tap, finalize, switchMap } from 'rxjs/operators';
import {
  Exercise,
  ExerciseFilters,
  ExerciseStats,
  ApiResponse,
  APP_CONFIG,
} from '@shared';
import { ApiService } from '@core/services/api.service';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ExercisesService {
  private exercisesSubject = new BehaviorSubject<Exercise[]>([]);
  private favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  public readonly API_URL = APP_CONFIG.API_URL;

  public exercises$ = this.exercisesSubject.asObservable();
  public favorites$ = this.favoritesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private api: ApiService) {
    this.loadFavorites();
  }

  // ==============================================================================
  // PUBLIC API
  // ==============================================================================

  getExercises(filters?: ExerciseFilters): Observable<Exercise[]> {
    const cacheKey = this.getCacheKey('exercises', filters);
    const cached = this.getCachedData<Exercise[]>(cacheKey);

    if (cached) {
      this.exercisesSubject.next(cached);
      return of(cached);
    }

    this.setLoading(true);
    this.setError(null);

    const params = this.buildParams(filters);

    return this.api
      .get<ApiResponse<any>>('exercises', { params })
      .pipe(
        map((response) => this.extractExercisesFromResponse(response)),
        switchMap((exercises) => {
          if (exercises.length === 0 && !filters) {
            return this.seedPortfolioData().pipe(
              switchMap(() =>
                this.api
                  .get<ApiResponse<any>>('exercises', { params })
                  .pipe(map((res) => this.extractExercisesFromResponse(res)))
              ),
              catchError(() => of(exercises))
            );
          }
          return of(exercises);
        }),
        tap((exercises) => {
          this.exercisesSubject.next(exercises);
          this.setCachedData(cacheKey, exercises);
        }),
        catchError((error) => this.handleError(error, 'loading exercises')),
        finalize(() => this.setLoading(false))
      );
  }

  getExercise(id: number): Observable<Exercise | null> {
    const cacheKey = this.getCacheKey('exercise', { id });
    const cached = this.getCachedData<Exercise>(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.api.get<ApiResponse<any>>(`exercises/${id}`).pipe(
      map((response) => {
        if (response.success && response.data) {
          const exercise = this.enhanceExercise(response.data);
          this.setCachedData(cacheKey, exercise);
          return exercise;
        }
        return null;
      }),
      catchError((error) => {
        this.handleError(error, 'loading exercise');
        return of(null);
      })
    );
  }

  searchExercises(query: string, limit = 10): Observable<Exercise[]> {
    if (!query.trim()) {
      return of([]);
    }

    const params = {
      q: query.trim(),
      limit: limit.toString(),
    };

    return this.api
      .get<ApiResponse<any>>('exercises/search', { params })
      .pipe(
        map((response) => this.extractExercisesFromResponse(response)),
        catchError((error) => {
          this.handleError(error, 'searching exercises');
          return of([]);
        })
      );
  }

  getBodyParts(): Observable<any[]> {
    return this.getCachedOrFetch<any[]>(
      'body-parts',
      () => this.api.get<ApiResponse<any>>('exercises/body-parts'),
      []
    );
  }

  getCategories(): Observable<any[]> {
    return this.getCachedOrFetch<any[]>(
      'categories',
      () => this.api.get<ApiResponse<any>>('exercises/categories'),
      []
    );
  }

  getStats(): Observable<ExerciseStats | null> {
    return this.getCachedOrFetch<ExerciseStats | null>(
      'stats',
      () => this.api.get<ApiResponse<any>>('exercises/stats'),
      null
    );
  }

  getRelatedExercises(exerciseId: number): Observable<Exercise[]> {
    return this.api
      .get<ApiResponse<any>>(`exercises/${exerciseId}/related`)
      .pipe(
        map((response) => this.extractExercisesFromResponse(response)),
        catchError((error) => {
          console.error('Error loading related exercises:', error);
          return of([]);
        })
      );
  }

  toggleFavorite(exerciseId: number): Observable<boolean> {
    return this.api
      .post<ApiResponse<any>>(`exercises/${exerciseId}/favorite`, {})
      .pipe(
        map((response) => {
          if (response.success) {
            const favorites = new Set(this.favoritesSubject.value);
            if (response.message?.toLowerCase().includes('favorited')) {
              favorites.add(exerciseId);
            } else {
              favorites.delete(exerciseId);
            }
            this.favoritesSubject.next(favorites);
            return favorites.has(exerciseId);
          }
          throw new Error(response.message || 'Failed to toggle favorite');
        }),
        catchError((error) => this.handleError(error, 'toggling favorite'))
      );
  }

  getFavorites(): Set<number> {
    return this.favoritesSubject.value;
  }

  isFavorite(exerciseId: number): boolean {
    return this.favoritesSubject.value.has(exerciseId);
  }

  validateVideoUrl(url: string): Observable<boolean> {
    if (!url) {
      return of(false);
    }

    if (url.startsWith('/assets/ExercicesVideos/')) {
      return of(true);
    }

    return from(fetch(url, { method: 'HEAD' })).pipe(
      map((response) => response.ok),
      catchError(() => of(false))
    );
  }

  testConnection(): Observable<any> {
    const endpoint = `${APP_CONFIG.API_URL}/test`;
    console.log('🔍 Testing API connection to:', endpoint);
    return this.api.get(endpoint).pipe(
      tap((response) => console.log('✅ Connection test successful:', response)),
      catchError((error) => {
        console.error('❌ Connection test failed:', error);
        return throwError(() => error);
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ==============================================================================
  // PRIVATE HELPERS
  // ==============================================================================

  private seedPortfolioData(): Observable<any> {
    console.log('🌱 ExercisesService: Seeding portfolio demo data...');
    return this.api.post('portfolio-seed', {}).pipe(
      tap((response) => console.log('✅ Portfolio seeding response:', response)),
      catchError((error) => {
        console.error('❌ Portfolio seeding failed:', error);
        return of({ success: false, message: 'Seeding failed' });
      })
    );
  }

  private loadFavorites(): void {
    this.api
      .get<ApiResponse<number[]>>('exercises/favorites', {
        cacheKey: 'exercise-favorites',
        cacheTTL: this.CACHE_DURATION,
      })
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.warn('Error loading favorites from API:', error);
          return of([]);
        })
      )
      .subscribe((favorites) => {
        this.favoritesSubject.next(new Set(favorites));
      });
  }

  private buildParams(filters?: ExerciseFilters): Record<string, string> {
    if (!filters) {
      return {};
    }

    const params: Record<string, string> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 'all'
      ) {
        params[key] = value.toString();
      }
    });

    return params;
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private getCachedOrFetch<T>(
    cacheKey: string,
    fetcher: () => Observable<ApiResponse<any>>,
    fallback: T
  ): Observable<T> {
    const cached = this.getCachedData<T>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return fetcher().pipe(
      map((response) => {
        const data = response.success && response.data ? response.data : null;
        this.setCachedData(cacheKey, data ?? fallback);
        return (data ?? fallback) as T;
      }),
      catchError((error) => {
        console.error(`Error loading ${cacheKey}:`, error);
        return of(fallback);
      })
    );
  }

  private extractExercisesFromResponse(response: any): Exercise[] {
    let exercises: Exercise[] = [];

    if (response && response.success && response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        exercises = response.data.data;
      } else if (Array.isArray(response.data)) {
        exercises = response.data;
      } else if (typeof response.data === 'object') {
        exercises = [response.data];
      }
    } else if (Array.isArray(response)) {
      exercises = response;
    } else if (response && Array.isArray(response.data)) {
      exercises = response.data;
    }

    return exercises.map((exercise) => this.enhanceExercise(exercise));
  }

  private enhanceExercise(exercise: Exercise): Exercise {
    return {
      ...exercise,
      videoUrl: this.normalizeVideoUrl(exercise.videoUrl),
      isFavorite: this.isFavorite(exercise.id),
      instructions: exercise.instructions || [],
      tips: exercise.tips || [],
      muscleGroups: exercise.muscleGroups || [],
    };
  }

  private normalizeVideoUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = 'https://fitness-pro-videos.s3.eu-west-3.amazonaws.com/';
    const filename = url.split('/').pop() || url;
    return `${baseUrl}${filename}`;
  }

  getAlternativeVideoUrls(originalUrl: string): string[] {
    if (!originalUrl) {
      return [];
    }
    const normalizedUrl = this.normalizeVideoUrl(originalUrl);
    return [normalizedUrl];
  }

  getVideoMetadata(
    url: string
  ): Observable<{ duration: number; qualities: any[] }> {
    return of({ duration: 0, qualities: [] });
  }

  private handleError(error: any, context: string): Observable<never> {
    console.error(`❌ Error ${context}:`, error);
    const message =
      error?.message || 'Une erreur est survenue, veuillez réessayer.';
    this.setError(message);
    return throwError(() => new Error(message));
  }

  private getCacheKey(prefix: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${prefix}_${btoa(encodeURIComponent(paramsString))}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
      if (!isExpired) {
        return cached.data as T;
      }
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

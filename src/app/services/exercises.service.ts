// src/app/services/exercises.service.ts - VERSION CORRIGÉE ET SIMPLIFIÉE
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, timeout, retry, finalize, switchMap } from 'rxjs/operators';
import {
  Exercise,
  ExerciseFilters,
  ExerciseStats,
  ApiResponse,
  APP_CONFIG,
} from '../shared';

@Injectable({
  providedIn: 'root',
})
export class ExercisesService {
  // Public observables
  private exercisesSubject = new BehaviorSubject<Exercise[]>([]);
  private favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public exercises$ = this.exercisesSubject.asObservable();
  public favorites$ = this.favoritesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Simplified cache
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Make API_URL accessible
  public readonly API_URL = APP_CONFIG.API_URL;

  constructor(private http: HttpClient) {
    this.loadFavorites();
  }

  // ==============================================================================
  // MAIN API METHODS
  // ==============================================================================

  /**
   * Seed demo data for portfolio visitors
   */
  private seedPortfolioData(): Observable<any> {
    console.log('🌱 ExercisesService: Seeding portfolio demo data...');
    return this.http.post(`${this.API_URL}/portfolio-seed`, {}).pipe(
      tap(response => console.log('✅ Portfolio seeding response:', response)),
      catchError(error => {
        console.error('❌ Portfolio seeding failed:', error);
        return of({ success: false, message: 'Seeding failed' });
      })
    );
  }

  /**
   * Get all exercises with optional filters
   */
  getExercises(filters?: ExerciseFilters): Observable<Exercise[]> {
    const cacheKey = this.getCacheKey('exercises', filters);
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      this.exercisesSubject.next(cached);
      return of(cached);
    }

    this.setLoading(true);
    this.setError(null);

    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          value !== 'all'
        ) {
          params = params.set(key, value.toString());
        }
      });
    }

    const url = `${this.API_URL}/exercises`;

    return this.http.get<any>(url, { params }).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => this.extractExercisesFromResponse(response)),
      switchMap((exercises) => {
        // If exercises are empty and no filters applied, try to seed demo data
        if (exercises.length === 0 && !filters) {
          console.log('🌱 No exercises found, attempting to seed demo data...');
          return this.seedPortfolioData().pipe(
            switchMap(() => {
              // After seeding, try to fetch exercises again
              return this.http.get<any>(url, { params }).pipe(
                map((response) => this.extractExercisesFromResponse(response))
              );
            }),
            catchError(() => of(exercises)) // Return original empty array if seeding fails
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

  /**
   * Get a single exercise by ID
   */
  getExercise(id: number): Observable<Exercise | null> {
    const cacheKey = this.getCacheKey('exercise', { id });
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http.get<any>(`${this.API_URL}/exercises/${id}`).pipe(
      timeout(15000),
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

  /**
   * Search exercises
   */
  searchExercises(query: string, limit = 10): Observable<Exercise[]> {
    if (!query.trim()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', query.trim())
      .set('limit', limit.toString());

    return this.http
      .get<any>(`${this.API_URL}/exercises/search`, { params })
      .pipe(
        timeout(15000),
        map((response) => this.extractExercisesFromResponse(response)),
        catchError((error) => {
          this.handleError(error, 'searching exercises');
          return of([]);
        })
      );
  }

  /**
   * Get body parts
   */
  getBodyParts(): Observable<any[]> {
    const cacheKey = 'body-parts';
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http.get<any>(`${this.API_URL}/exercises/body-parts`).pipe(
      timeout(15000),
      map((response) => {
        console.log('Body parts response:', response);
        const data = response.success && response.data ? response.data : [];
        this.setCachedData(cacheKey, data);
        return data;
      }),
      catchError((error) => {
        console.error('Error loading body parts:', error);
        return of([]);
      })
    );
  }

  /**
   * Get categories
   */
  getCategories(): Observable<any[]> {
    const cacheKey = 'categories';
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http.get<any>(`${this.API_URL}/exercises/categories`).pipe(
      timeout(15000),
      map((response) => {
        console.log('Categories response:', response);
        const data = response.success && response.data ? response.data : [];
        this.setCachedData(cacheKey, data);
        return data;
      }),
      catchError((error) => {
        console.error('Error loading categories:', error);
        return of([]);
      })
    );
  }

  /**
   * Get exercise statistics
   */
  getStats(): Observable<ExerciseStats | null> {
    const cacheKey = 'stats';
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return of(cached);
    }

    return this.http.get<any>(`${this.API_URL}/exercises/stats`).pipe(
      timeout(15000),
      map((response) => {
        console.log('Stats response:', response);
        if (response.success && response.data) {
          this.setCachedData(cacheKey, response.data);
          return response.data;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error loading stats:', error);
        return of(null);
      })
    );
  }

  // ==============================================================================
  // FAVORITES MANAGEMENT
  // ==============================================================================

  getFavorites(): Set<number> {
    return this.favoritesSubject.value;
  }

  isFavorite(exerciseId: number): boolean {
    return this.favoritesSubject.value.has(exerciseId);
  }

  toggleFavorite(exerciseId: number): Observable<boolean> {
    return this.http
      .post<ApiResponse<any>>(
        `${this.API_URL}/exercises/${exerciseId}/favorite`,
        {}
      )
      .pipe(
        map((response) => {
          if (response.success) {
            const favorites = new Set(this.favoritesSubject.value);
            if (response.message === 'Exercise favorited') {
              // Assuming backend sends this message
              favorites.add(exerciseId);
            } else {
              favorites.delete(exerciseId);
            }
            this.favoritesSubject.next(favorites);
            return favorites.has(exerciseId);
          }
          throw new Error(response.message || 'Failed to toggle favorite');
        }),
        catchError((error) => {
          console.error('Error toggling favorite:', error);
          return throwError(() => new Error('Failed to toggle favorite'));
        })
      );
  }

  // ==============================================================================
  // VIDEO UTILITIES
  // ==============================================================================

  validateVideoUrl(url: string): Observable<boolean> {
    // For local assets, assume they exist if the URL is properly formatted
    // The browser will handle loading errors gracefully in the video element
    if (url.startsWith('/assets/ExercicesVideos/')) {
      return of(true);
    }
    
    // For external URLs, use a lightweight check
    return this.http.get(url, { 
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map((response) => response.ok),
      catchError((error) => {
        console.log('Video validation failed for:', url, error.status);
        return of(false);
      })
    );
  }

  getVideoMetadata(
    url: string
  ): Observable<{ duration: number; qualities: any[] }> {
    return of({ duration: 0, qualities: [] });
  }

  getRelatedExercises(exerciseId: number): Observable<Exercise[]> {
    return this.http
      .get<any>(`${this.API_URL}/exercises/${exerciseId}/related`)
      .pipe(
        map((response) => this.extractExercisesFromResponse(response)),
        catchError((error) => {
          console.error('Error loading related exercises:', error);
          return of([]);
        })
      );
  }

  /**
   * Get alternative video URLs for fallback
   */
  getAlternativeVideoUrls(originalUrl: string): string[] {
    if (!originalUrl) return [];

    const filename = this.extractFilename(originalUrl);
    const basePath = '/assets/ExercicesVideos/';
    const nameWithoutExt = filename.replace(/\.(mp4|webm|mov)$/i, '');

    const alternatives = [
      originalUrl,
      basePath + filename,
      basePath + filename.toLowerCase(),
      basePath + filename.replace(/\s+/g, '_'),
      basePath + filename.replace(/\s+/g, '-'),
      // Handle existing naming conventions
      basePath + nameWithoutExt.replace(/\s+/g, '-') + '.mp4',
      basePath + nameWithoutExt.replace(/\s+/g, '_') + '.mp4',
      // Handle colons and special characters properly
      basePath + nameWithoutExt.replace(/:/g, '-') + '.mp4',
      basePath + nameWithoutExt.replace(/90:90/g, '90-90') + '.mp4',
      // Handle truncated names (common issue with long filenames)
      basePath + nameWithoutExt.substring(0, 25) + '.mp4',
      // Handle capitalization patterns found in actual files
      basePath + nameWithoutExt.toUpperCase().replace(/\s+/g, '-') + '.mp4',
      // Specific fixes for known patterns
      basePath + nameWithoutExt.replace(/\s+Hip\s+/gi, '-HIP-') + '.mp4',
      basePath +
        nameWithoutExt.replace(
          /Overhead\s+Dumbell\s+Tric/gi,
          'Overhead-Dumbell-Tricep-Extension'
        ) +
        '.mp4',
      // Handle word boundaries and proper capitalization
      basePath + this.titleCase(nameWithoutExt).replace(/\s+/g, '-') + '.mp4',
    ];

    return [...new Set(alternatives)];
  }

  private extractFilename(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('?')[0];
    return filename.includes('.') ? filename : `${filename}.mp4`;
  }

  private titleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    );
  }

  // ==============================================================================
  // UTILITY METHODS
  // ==============================================================================

  testConnection(): Observable<any> {
    console.log('🔍 Testing API connection to:', `${this.API_URL}/test`);
    return this.http.get(`${this.API_URL}/test`).pipe(
      timeout(5000),
      tap((response) =>
        console.log('✅ Connection test successful:', response)
      ),
      catchError((error) => {
        console.error('❌ Connection test failed:', error);
        return throwError(() => error);
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // ==============================================================================
  // PRIVATE METHODS
  // ==============================================================================

  private extractExercisesFromResponse(response: any): Exercise[] {
    console.log('🔄 Extracting exercises from response:', response);

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

    console.log('📊 Extracted exercises count:', exercises.length);
    return exercises.map((exercise) => this.enhanceExercise(exercise));
  }

  private enhanceExercise(exercise: Exercise): Exercise {
    return {
      ...exercise,
      videoUrl: this.normalizeVideoUrl(exercise.videoUrl),
      isFavorite: this.isFavorite(exercise.id),
      instructions: exercise.instructions || [],
      tips: exercise.tips || [],
      muscleGroups: exercise.muscleGroups || [], // Changed from muscle_groups
      equipmentNeeded: exercise.equipmentNeeded,
      estimatedCaloriesPerMinute: exercise.estimatedCaloriesPerMinute,

      // Add appended attributes from backend
      bodyPartLabel: exercise.bodyPartLabel,
      difficultyLabel: exercise.difficultyLabel,
      difficultyColor: exercise.difficultyColor,
      bodyPartInfo: exercise.bodyPartInfo,
      difficultyInfo: exercise.difficultyInfo,

      // Ensure camelCase properties are present if backend sends them
      bodyPart: exercise.bodyPart,
      // videoUrl: exercise.videoUrl, // Already handled above
      // muscleGroups: exercise.muscleGroups, // Already handled above
      // equipmentNeeded: exercise.equipmentNeeded, // Already handled above
      // estimatedCaloriesPerMinute: exercise.estimatedCaloriesPerMinute, // Already handled above
    };
  }

  private normalizeVideoUrl(url?: string): string {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/assets/ExercicesVideos/')) {
      return url;
    }

    // Handle URLs that start with 'assets/' (from database)
    if (url.startsWith('assets/ExercicesVideos/')) {
      return `/${url}`;
    }

    const filename = this.extractFilename(url);
    return `/assets/ExercicesVideos/${filename}`;
  }

  private handleError(
    error: HttpErrorResponse,
    context: string
  ): Observable<never> {
    console.error(`❌ Error ${context}:`, error);

    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage =
            'Impossible de se connecter au serveur. Vérifiez votre connexion.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private getCacheKey(prefix: string, params?: any): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${prefix}_${btoa(encodeURIComponent(paramsString))}`;
  }

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

  private loadFavorites(): void {
    this.http
      .get<ApiResponse<number[]>>(`${this.API_URL}/exercises/favorites`)
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

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  // Additional helper methods
  searchExercisesByName(term: string): Observable<Exercise[]> {
    return this.searchExercises(term);
  }
}

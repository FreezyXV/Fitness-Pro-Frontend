// src/app/exercises-filtres/exercises/exercises.component.ts - Version corrigée
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, merge, timer } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  catchError,
  switchMap,
} from 'rxjs/operators';
import { of } from 'rxjs';

import { ExercisesService } from '@app/services/exercises.service';
import { WorkoutService } from '@app/services/workout.service';
import { UserService } from '@app/services/user.service';
import { ExerciseFilters, Exercise, Workout } from '@shared';
import { ExerciseCardComponent } from '../exercises-card/exercise-card.component';
import { APP_CONFIG, WorkoutUtils, StorageUtils } from '@shared';

interface UIState {
  isLoading: boolean;
  error: string | null;
  hasInteracted: boolean;
  lastUpdateTime: number;
}

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, ExerciseCardComponent],
  templateUrl: './exercises.component.html',
  styleUrls: ['./exercises.component.scss'],
})
export class ExercisesComponent implements OnInit, OnDestroy {
  // =============================================
  // DATA PROPERTIES
  // =============================================
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  favoriteExercises: Exercise[] = [];

  // =============================================
  // UI STATE
  // =============================================
  private uiState = new BehaviorSubject<UIState>({
    isLoading: false,
    error: null,
    hasInteracted: false,
    lastUpdateTime: Date.now(),
  });

  // Reactive state getters
  get isLoading(): boolean {
    return this.uiState.value.isLoading;
  }
  get error(): string | null {
    return this.uiState.value.error;
  }

  viewMode: 'grid' | 'list' = 'grid';

  // =============================================
  // FILTERS
  // =============================================
  filters: ExerciseFilters = {
    search: '',
    bodyPart: '',
    difficulty: '',
    category: '',
    duration: '',
    sortBy: 'name',
    sortDirection: 'asc',
  };

  // =============================================
  // SEARCH
  // =============================================
  searchTerm = '';
  searchSuggestions: string[] = [];
  showSearchSuggestions = false;
  private searchSubject = new Subject<string>();
  private searchCache = new Map<string, string[]>();

  // =============================================
  // CONFIGURATION CORRIGÉE
  // =============================================
  bodyParts = APP_CONFIG.EXERCISE_CONFIG.BODY_PARTS;
  difficulties = APP_CONFIG.EXERCISE_CONFIG.DIFFICULTIES;
  categories = APP_CONFIG.EXERCISE_CONFIG.CATEGORIES;
  durations = APP_CONFIG.EXERCISE_CONFIG.DURATIONS;
  readonly apiUrl = APP_CONFIG.API_URL;


  // =============================================
  // LIFECYCLE
  // =============================================
  private destroy$ = new Subject<void>();
  private refreshTimer$ = new Subject<void>();

  constructor(
    public exercisesService: ExercisesService,
    private workoutService: WorkoutService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadUserPreferences();
    this.loadExercisesWithOptimization();
    this.subscribeToServiceState();
    this.preloadCriticalData();
  }

  ngOnDestroy(): void {
    this.saveUserPreferences();
    this.destroy$.next();
    this.destroy$.complete();
    this.refreshTimer$.next();
    this.refreshTimer$.complete();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.saveUserPreferences();
  }

  // =============================================
  // SETUP METHODS
  // =============================================

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(APP_CONFIG.UI_CONFIG.DEBOUNCE_DELAY),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          if (!searchTerm.trim()) {
            return of([]);
          }

          // Check cache first
          const cached = this.searchCache.get(searchTerm);
          if (cached) {
            return of(cached);
          }

          // Generate suggestions
          return of(this.generateSearchSuggestions(searchTerm));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((suggestions) => {
        this.searchSuggestions = suggestions;
        this.filters.search = this.searchTerm;
        this.applyFiltersWithPerformance();
        this.markUserInteraction();
      });
  }


  // =============================================
  // DATA LOADING WITH OPTIMIZATION
  // =============================================

  private loadExercisesWithOptimization(): void {
    this.updateUIState({ isLoading: true, error: null });

    // Use optimized loading strategy
    const loadStrategy = this.exercises.length === 0 ? 'fresh' : 'cached';

    this.exercisesService
      .getExercises(this.filters)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading exercises:', error);
          this.updateUIState({
            isLoading: false,
            error: 'Erreur lors du chargement des exercices',
          });
          return of([]);
        })
      )
      .subscribe({
        next: (exercises: Exercise[]) => {
          this.exercises = this.optimizeExerciseData(exercises);
          this.applyFiltersWithPerformance();
          this.loadFavorites();
          this.updateUIState({ isLoading: false, error: null });
          this.cdr.markForCheck();
        },
      });
  }

  private optimizeExerciseData(exercises: Exercise[]): Exercise[] {
    return exercises.map((exercise) => ({
      ...exercise,
      // Pre-calculate frequently used properties
      _bodyPartInfo: this.getBodyPartInfo(exercise.bodyPart),
      _difficultyInfo: this.getDifficultyInfo(exercise.difficulty),
      _searchText: this.createSearchText(exercise),
      // Optimize video URL
      video_url: this.exercisesService.getAlternativeVideoUrls(
        exercise.videoUrl || ''
      )[0],
    }));
  }

  private createSearchText(exercise: Exercise): string {
    return [
      exercise.name,
      exercise.description,
      exercise.bodyPart,
      exercise.difficulty,
      exercise.category,
      ...(exercise.muscleGroups || []),
      exercise.equipmentNeeded,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private preloadCriticalData(): void {
    // Preload body parts and stats
    merge(
      this.exercisesService.getBodyParts(),
      this.exercisesService.getStats()
    ).pipe(
      takeUntil(this.destroy$),
      catchError(() => of(null))
    ).subscribe();
  }

  private subscribeToServiceState(): void {
    // Subscribe to loading state
    this.exercisesService.loading$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((loading) => {
        if (loading !== this.isLoading) {
          this.updateUIState({ isLoading: loading });
        }
      });

    // Subscribe to error state
    this.exercisesService.error$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((error) => {
        if (error !== this.error) {
          this.updateUIState({ error });
        }
      });

    // Subscribe to favorites changes
    this.exercisesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFavorites();
      });
  }

  private loadFavorites(): void {
    const favoriteIds = this.exercisesService.getFavorites();
    this.favoriteExercises = this.exercises.filter((ex) =>
      favoriteIds.has(ex.id)
    );
  }

  // =============================================
  // FILTERING WITH PERFORMANCE OPTIMIZATION
  // = Changes made here to ensure compatibility with updated interfaces
  // =============================================

  private applyFiltersWithPerformance(): void {
    let filtered = [...this.exercises];

    // Optimize filtering with early returns and efficient algorithms
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(
        (exercise) =>
          (exercise as any)._searchText?.includes(searchLower) ||
          exercise.name.toLowerCase().includes(searchLower)
      );
    }

    // Use pre-calculated info for faster filtering
    if (this.filters.bodyPart) {
      filtered = filtered.filter(
        (exercise) => exercise.bodyPart === this.filters.bodyPart
      );
    }

    if (this.filters.difficulty) {
      filtered = filtered.filter(
        (exercise) => exercise.difficulty === this.filters.difficulty
      );
    }

    if (this.filters.category) {
      filtered = filtered.filter(
        (exercise) => exercise.category === this.filters.category
      );
    }

    if (this.filters.duration) {
      filtered = this.filterByDuration(filtered);
    }

    // Optimize sorting
    this.sortExercisesOptimized(filtered);

    this.filteredExercises = filtered;

    // Save preferences only if user has interacted
    if (this.uiState.value.hasInteracted) {
      this.saveUserPreferences();
    }

    this.cdr.markForCheck();
  }

  private filterByDuration(exercises: Exercise[]): Exercise[] {
    const durationConfig = this.durations.find(
      (d: { value: string; min?: number; max?: number }) =>
        d.value === this.filters.duration
    );
    if (!durationConfig) return exercises;

    return exercises.filter((exercise) => {
      const duration = exercise.duration || 0;
      if (durationConfig.max) {
        return duration <= durationConfig.max;
      }
      if (durationConfig.min) {
        return duration >= durationConfig.min;
      }
      return true;
    });
  }

  private sortExercisesOptimized(exercises: Exercise[]): void {
    const sortBy = this.filters.sortBy || 'name';
    const direction = this.filters.sortDirection === 'desc' ? -1 : 1;

    // Use pre-calculated sort keys for better performance
    const sortKeyCache = new Map<Exercise, any>();

    exercises.forEach((exercise) => {
      let sortKey: any;

      switch (sortBy) {
        case 'difficulty':
          const diffOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          sortKey = diffOrder[exercise.difficulty as keyof typeof diffOrder];
          break;
        case 'name':
          sortKey = exercise.name.toLowerCase();
          break;
        default:
          // Ensure that the property exists on the Exercise object before accessing it
          sortKey = (exercise as any)[sortBy] || ''; // Using (exercise as any) to allow dynamic access
      }

      sortKeyCache.set(exercise, sortKey);
    });

    exercises.sort((a, b) => {
      const keyA = sortKeyCache.get(a);
      const keyB = sortKeyCache.get(b);

      if (keyA == null) return direction;
      if (keyB == null) return -direction;

      if (typeof keyA === 'string' && typeof keyB === 'string') {
        return keyA.localeCompare(keyB) * direction;
      }

      return (keyA < keyB ? -1 : keyA > keyB ? 1 : 0) * direction;
    });
  }

  // Continuer avec le reste des méthodes inchangées...
  // (Updated only methods that needed fixes based on previous analysis)

  // =============================================
  // UTILITY METHODS (Updated based on previous analysis)
  // =============================================

  getBodyPartInfo(bodyPart: string): any {
    // This method should ideally get info from a centralized config or service, not by finding an exercise
    // For now, keeping the existing logic but noting it could be improved.
    const exerciseWithInfo = this.exercises.find(
      (ex: Exercise) => ex.bodyPart === bodyPart && !!ex.bodyPartInfo
    );
    if (exerciseWithInfo && exerciseWithInfo.bodyPartInfo) {
      return exerciseWithInfo.bodyPartInfo;
    }

    return (
      this.bodyParts.find((bp: { value: string; label: string; icon?: string; color?: string }) => bp.value === bodyPart) || {
        label: bodyPart,
        icon: '💪',
        color: '#gray',
      }
    );
  }

  getDifficultyInfo(difficulty: string): any {
    // This method should ideally get info from a centralized config or service, not by finding an exercise
    // For now, keeping the existing logic but noting it could be improved.
    const exerciseWithInfo = this.exercises.find(
      (ex: Exercise) => ex.difficulty === difficulty && !!ex.difficultyInfo
    );
    if (exerciseWithInfo && exerciseWithInfo.difficultyInfo) {
      return exerciseWithInfo.difficultyInfo;
    }

    return (
      this.difficulties.find((d: { value: string; label: string; icon?: string; color?: string }) => d.value === difficulty) || {
        label: difficulty,
        icon: '⚪',
        color: '#gray',
      }
    );
  }

  // =============================================
  // SEARCH OPTIMIZATION
  // =============================================

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
    this.generateSearchSuggestions(this.searchTerm);
  }

  private generateSearchSuggestions(term: string): string[] {
    if (!term.trim() || term.length < 2) {
      this.searchSuggestions = [];
      return [];
    }

    // Check cache first
    const cached = this.searchCache.get(term);
    if (cached) {
      this.searchSuggestions = cached;
      return cached;
    }

    const termLower = term.toLowerCase();
    const suggestions = new Set<string>();

    // Limit search to improve performance
    const searchLimit = 50;
    let searchCount = 0;

    for (const exercise of this.exercises) {
      if (searchCount >= searchLimit) break;

      // Exercise names
      if (exercise.name.toLowerCase().includes(termLower)) {
        suggestions.add(exercise.name);
        searchCount++;
      }
    }

    // Body parts and difficulties - Updated to use APP_CONFIG directly
    this.bodyParts.forEach((bodyPart) => {
      if (bodyPart.label.toLowerCase().includes(termLower)) {
        suggestions.add(bodyPart.label);
      }
    });

    this.difficulties.forEach((difficulty) => {
      if (difficulty.label.toLowerCase().includes(termLower)) {
        suggestions.add(difficulty.label);
      }
    });

    const result = Array.from(suggestions).slice(0, 6);

    // Cache the result
    this.searchCache.set(term, result);
    this.searchSuggestions = result;

    return result;
  }

  applySuggestion(suggestion: string): void {
    this.searchTerm = suggestion;
    this.showSearchSuggestions = false;
    this.searchSubject.next(suggestion);
    this.markUserInteraction();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filters.search = '';
    this.showSearchSuggestions = false;
    this.applyFiltersWithPerformance();
    this.markUserInteraction();
  }

  // =============================================
  // UI EVENT HANDLERS
  // =============================================

  onFilterChange(): void {
    this.markUserInteraction();
    this.applyFiltersWithPerformance();
  }

  clearAllFilters(): void {
    this.filters = {
      search: '',
      bodyPart: '',
      difficulty: '',
      category: '',
      duration: '',
      sortBy: 'name',
      sortDirection: 'asc',
    };
    this.searchTerm = '';
    this.showSearchSuggestions = false; // Added to clear suggestions on filter clear
    this.markUserInteraction();
    this.applyFiltersWithPerformance();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.bodyPart ||
      this.filters.difficulty ||
      this.filters.category ||
      this.filters.duration
    );
  }

  setViewMode(mode: 'grid' | 'list'): void {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      this.markUserInteraction();
      this.saveUserPreferences();
    }
  }

  // =============================================
  // EXERCISE ACTIONS
  // =============================================

  onFavoriteToggle(exercise: Exercise): void {
    this.exercisesService
      .toggleFavorite(exercise.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isFavorite: boolean) => {
          exercise.isFavorite = isFavorite;
          this.loadFavorites();
          console.log(
            isFavorite ? '❤️ Added to favorites' : '💔 Removed from favorites'
          );
        },
        error: (error: any) => {
          console.error('Error toggling favorite:', error);
          console.error('❌ Error updating favorite status');
        },
      });
  }

  onQuickStart(exercise: Exercise): void {
    this.router.navigate(['/workouts/quick-start'], {
      queryParams: { exerciseId: exercise.id },
    });
  }

  viewExercise(exercise: Exercise): void {
    this.router.navigate(['/exercises', exercise.id]);
  }

  navigateToCreateWorkout(): void {
    this.router.navigate(['/workouts/create']);
  }

  viewFavorites(): void {
    this.filters.search = '';
    this.searchTerm = '';
    this.filteredExercises = [...this.favoriteExercises];
    this.markUserInteraction();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getFavoritesCount(): number {
    return this.favoriteExercises.length;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0
      ? `${hours}h`
      : `${hours}h ${remainingMinutes}min`;
  }

  trackByExercise(index: number, exercise: Exercise): number {
    return exercise.id;
  }

  trackByValue(index: number, item: { value: string }): string {
    return item.value;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }


  // =============================================
  // STATE MANAGEMENT
  // =============================================

  private updateUIState(updates: Partial<UIState>): void {
    const currentState = this.uiState.value;
    const newState = {
      ...currentState,
      ...updates,
      lastUpdateTime: Date.now(),
    };
    this.uiState.next(newState);
  }

  private markUserInteraction(): void {
    this.updateUIState({ hasInteracted: true });
  }

  // =============================================
  // PERSISTENCE
  // =============================================

  private loadUserPreferences(): void {
    try {
      const saved = StorageUtils.getItem<string>(
        APP_CONFIG.STORAGE_KEYS.EXERCISES_FILTERS
      );
      if (saved) {
        const preferences = JSON.parse(saved);
        this.filters = { ...this.filters, ...preferences };
      }

      const viewMode = StorageUtils.getItem<string>(
        APP_CONFIG.STORAGE_KEYS.EXERCISES_VIEW_MODE
      ) as 'grid' | 'list';
      if (viewMode) {
        this.viewMode = viewMode;
      }
    } catch (error) {
      console.warn('Error loading user preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      // Only save if user has interacted to avoid unnecessary writes
      if (!this.uiState.value.hasInteracted) return;

      StorageUtils.setItem(
        APP_CONFIG.STORAGE_KEYS.EXERCISES_FILTERS,
        this.filters
      );
      StorageUtils.setItem(
        APP_CONFIG.STORAGE_KEYS.EXERCISES_VIEW_MODE,
        this.viewMode
      );
    } catch (error) {
      console.warn('Error saving user preferences:', error);
    }
  }

  // =============================================
  // DEBUG AND TESTING
  // =============================================

  testConnection(): void {
    this.exercisesService
      .getExercises(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ API connection successful:', response);
          console.log('✅ Connexion API réussie');
        },
        error: (error) => {
          console.error('❌ API connection failed:', error);
          console.error('❌ Connexion API échouée');
        },
      });
  }

  retryLoad(): void {
    this.updateUIState({ error: null });
    this.loadExercisesWithOptimization();
  }

  refreshExercises(): void {
    this.exercisesService.clearCache();
    this.searchCache.clear();
    this.loadExercisesWithOptimization();
  }
}

// src/app/workout/workout.component.ts - Version Backend Alignée
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkoutPlanCardComponent } from './workout-plan-card/workout-plan-card.component';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, of, timer } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  catchError,
  switchMap,
  finalize,
} from 'rxjs/operators';

import { WorkoutService } from '@app/services/workout.service';
import { UserService } from '@app/services/user.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import {
  APP_CONFIG,
  StorageUtils,
  Workout,
  WorkoutStats,
} from '@shared';

interface WorkoutFilters {
  activeFilter: 'all' | 'strength' | 'cardio' | 'flexibility' | 'hiit';
  activeDifficultyFilter: 'all' | 'beginner' | 'intermediate' | 'advanced';
  sortBy: 'name' | 'duration_minutes' | 'difficulty_level' | 'created_at';
  searchTerm: string;
  showOnlyCustom: boolean;
  showOnlyPublic: boolean;
}

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkoutPlanCardComponent, IconComponent],
  templateUrl: './workout.component.html',
  styleUrls: ['./workout.component.scss'],
})
export class WorkoutComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false })
  searchInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');
  private filterSubject = new BehaviorSubject<WorkoutFilters | null>(null);

  // Core Data
  workoutTemplates: Workout[] = [];
  filteredWorkoutTemplates: Workout[] = [];
  workoutSessions: Workout[] = [];
  workoutStats: WorkoutStats | null = null;
  currentUser: any = null;

  // UI State
  isLoading = false;
  error: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  showAdvancedFilters = false;

  // Filters
  filters: WorkoutFilters = {
    activeFilter: 'all',
    activeDifficultyFilter: 'all',
    sortBy: 'name',
    searchTerm: '',
    showOnlyCustom: false,
    showOnlyPublic: false,
  };

  // Configuration
  readonly categories = [
    { value: 'strength', label: 'Force', icon: '💪', color: '#4CAF50' },
    { value: 'cardio', label: 'Cardio', icon: '❤️', color: '#FF5722' },
    { value: 'hiit', label: 'HIIT', icon: '🔥', color: '#fdba74' },
    {
      value: 'flexibility',
      label: 'Flexibilité',
      icon: '🧘',
      color: '#c4b5fd',
    },
  ];

  readonly difficultyLevels = [
    { value: 'beginner', label: 'Débutant', icon: '🟢', color: '#4CAF50' },
    {
      value: 'intermediate',
      label: 'Intermédiaire',
      icon: '🟡',
      color: '#fdba74',
    },
    { value: 'advanced', label: 'Avancé', icon: '🔴', color: '#fc8181' },
  ];

  readonly sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'duration_minutes', label: 'Durée' },
    { value: 'difficulty_level', label: 'Difficulté' },
    { value: 'created_at', label: 'Date de création' },
  ];

  // Motivational content
  motivationalQuote = '';
  private motivationalQuotes = [
    "La seule mauvaise séance d'entraînement est celle que vous n'avez pas faite.",
    "Votre corps peut le faire. C'est votre tête qu'il faut convaincre.",
    "Les champions s'entraînent, les légendes s'entraînent plus dur.",
    "La douleur est temporaire, l'abandon est permanent.",
    'Chaque expert était autrefois un débutant.',
    "La motivation vous fait commencer, l'habitude vous fait continuer.",
  ];

  constructor(
    private workoutService: WorkoutService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.setupSearchDebounce();
    this.setupFilterDebounce();
    this.loadUserPreferences();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadInitialData();
    this.rotateMotivationalQuote();
  }

  ngOnDestroy(): void {
    this.saveUserPreferences();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @ViewChild('searchInput', { static: false })
  set searchInputRef(element: ElementRef<HTMLInputElement>) {
    if (element) {
      this.searchInput = element;
    }
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeComponent(): void {
    const savedViewMode = StorageUtils.getItem<'grid' | 'list'>(
      'workout_view_mode'
    );
    if (savedViewMode) {
      this.viewMode = savedViewMode;
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filters.searchTerm = term;
        this.applyFilters();
      });
  }

  private setupFilterDebounce(): void {
    this.filterSubject
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe((filters) => {
        if (filters) {
          this.performFiltering(filters);
        }
      });
  }

  private loadUserPreferences(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const preferences = StorageUtils.getItem<any>(
        `user_workout_preferences_${userId}`
      );
      if (preferences) {
        // Only load view mode, not filters to ensure workouts are visible on initial load
        this.viewMode = preferences.viewMode || this.viewMode;
      }
    }
  }

  private saveUserPreferences(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const preferences = {
        filters: this.filters,
        viewMode: this.viewMode,
        lastAccessed: new Date().toISOString(),
      };
      StorageUtils.setItem(`user_workout_preferences_${userId}`, preferences);
    }

    StorageUtils.setItem('workout_view_mode', this.viewMode);
    StorageUtils.setItem('workout_filters', this.filters);
  }

  private getCurrentUserId(): number | null {
    return this.currentUser?.id || null;
  }

  // =============================================
  // DATA LOADING
  // =============================================

  private loadInitialData(): void {
    this.isLoading = true;
    this.error = null;

    this.loadUserData()
      .pipe(
        switchMap(() => this.loadWorkoutData()),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          console.log('✅ All workout data loaded successfully');
          this.applyFilters();
        },
        error: (error) => {
          console.error('❌ Error loading workout data:', error);
          this.handleDataLoadError(error);
        },
      });
  }

  private loadUserData() {
    return this.userService.getProfile().pipe(
      catchError((error) => {
        console.warn('User data not available:', error);
        return of(null);
      }),
      switchMap((user) => {
        this.currentUser = user;
        return of(user);
      })
    );
  }

  private loadWorkoutData() {
    // Load templates, sessions, and stats in parallel
    return this.workoutService.getWorkoutTemplates().pipe(
      switchMap((templates) => {
        this.workoutTemplates = templates || [];
        console.log(
          '📋 Loaded workout templates:',
          this.workoutTemplates.length
        );

        // Load recent sessions
        return this.workoutService.getWorkoutSessions({ limit: 10 });
      }),
      switchMap((sessions) => {
        this.workoutSessions = sessions || [];
        console.log('📊 Loaded workout sessions:', this.workoutSessions.length);

        // Load stats
        return this.workoutService.getWorkoutStats();
      }),
      switchMap((stats) => {
        this.workoutStats = stats;
        console.log('📈 Loaded workout stats:', stats);
        return of(true);
      }),
      catchError((error) => {
        console.error('Error loading workout data:', error);
        return of(false);
      })
    );
  }

  private handleDataLoadError(error: any): void {
    this.error = "Erreur lors du chargement des programmes d'entraînement";
    this.workoutTemplates = [];
    this.applyFilters();
  }


  // =============================================
  // FILTERING & SEARCH
  // =============================================

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  // Panneau de filtres mobile : masque par defaut, ouvert par le bouton
  // flottant "Filtrer", ferme en revalidant (les filtres s'appliquent deja
  // en direct, "Appliquer" ne fait que revenir au resultat).
  showMobileFilters = false;

  openMobileFilters(): void {
    this.showMobileFilters = true;
  }

  closeMobileFilters(): void {
    this.showMobileFilters = false;
  }

  setFilter(filter: string): void {
    this.filters.activeFilter = filter as WorkoutFilters['activeFilter'];
    this.triggerFilterUpdate();
  }

  setDifficultyFilter(difficulty: string): void {
    this.filters.activeDifficultyFilter =
      difficulty as WorkoutFilters['activeDifficultyFilter'];
    this.triggerFilterUpdate();
  }

  setSortBy(sortBy: string): void {
    this.filters.sortBy = sortBy as WorkoutFilters['sortBy'];
    this.triggerFilterUpdate();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  toggleCustomFilter(): void {
    this.filters.showOnlyCustom = !this.filters.showOnlyCustom;
    this.triggerFilterUpdate();
  }

  togglePublicFilter(): void {
    this.filters.showOnlyPublic = !this.filters.showOnlyPublic;
    this.triggerFilterUpdate();
  }

  applyFilters(): void {
    this.triggerFilterUpdate();
  }

  clearFilters(): void {
    this.filters = {
      activeFilter: 'all',
      activeDifficultyFilter: 'all',
      sortBy: 'name',
      searchTerm: '',
      showOnlyCustom: false,
      showOnlyPublic: false,
    };

    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
    }

    this.searchSubject.next('');
    this.triggerFilterUpdate();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.activeFilter !== 'all' ||
      this.filters.activeDifficultyFilter !== 'all' ||
      this.filters.searchTerm.length > 0 ||
      this.filters.showOnlyCustom ||
      this.filters.showOnlyPublic
    );
  }

  private triggerFilterUpdate(): void {
    this.filterSubject.next(this.filters);
  }

  private performFiltering(filters: WorkoutFilters): void {
    console.log('Performing filtering with:', filters);
    let filtered = [...this.workoutTemplates];
    console.log('Initial templates for filtering:', filtered.length);

    // Text search
    if (filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm) ||
          template.description?.toLowerCase().includes(searchTerm)
      );
      console.log('After search filter:', filtered.length);
    }

    // Category filter
    if (filters.activeFilter !== 'all') {
      filtered = filtered.filter(
        (template) => template.category === filters.activeFilter
      );
      console.log('After category filter:', filtered.length);
    }

    // Difficulty filter
    if (filters.activeDifficultyFilter !== 'all') {
      filtered = filtered.filter(
        (template) =>
          template.difficultyLevel === filters.activeDifficultyFilter
      );
      console.log('After difficulty filter:', filtered.length);
    }

    // Custom templates filter
    if (filters.showOnlyCustom) {
      filtered = filtered.filter(
        (template) => template.userId === this.getCurrentUserId()
      );
      console.log('After custom filter:', filtered.length);
    }

    // Public templates filter
    if (filters.showOnlyPublic) {
      filtered = filtered.filter((template) => template.isPublic);
      console.log('After public filter:', filtered.length);
    }

    // Sorting
    this.sortWorkoutTemplates(filtered, filters.sortBy);

    this.filteredWorkoutTemplates = filtered;
    this.cdr.detectChanges();
  }

  private sortWorkoutTemplates(templates: Workout[], sortBy: string): void {
    templates.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty_level':
          const difficultyOrder: { [key: string]: number } = {
            beginner: 1,
            intermediate: 2,
            advanced: 3,
          };
          return (
            (difficultyOrder[
              a.difficultyLevel as keyof typeof difficultyOrder
            ] || 0) -
            (difficultyOrder[
              b.difficultyLevel as keyof typeof difficultyOrder
            ] || 0)
          ); // Added type assertion
        case 'duration_minutes':
          return (
            (a.durationMinutes || a.estimatedDuration || 0) -
            (b.durationMinutes || b.estimatedDuration || 0)
          ); // Changed to estimatedDuration
        case 'created_at':
          return (
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
          );
        default:
          return 0;
      }
    });
  }

  // =============================================
  // UI INTERACTIONS
  // =============================================

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    StorageUtils.setItem('workout_view_mode', mode);
  }

  viewWorkoutTemplate(template: Workout): void {
    console.log('Viewing workout template:', template.name);
    // Navigate to workout detail page
    this.router.navigate(['/workouts', template.id]);
  }

  startWorkoutSession(template: Workout): void {
    console.log('Starting workout session for template:', template.name);

    // Update the template's loading state
    const templateIndex = this.workoutTemplates.findIndex(t => t.id === template.id);
    if (templateIndex !== -1) {
      this.workoutTemplates[templateIndex].isStarting = true;
    }

    this.workoutService
      .startWorkoutSession(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          // Update the template state to show it's started
          if (templateIndex !== -1) {
            this.workoutTemplates[templateIndex].isStarting = false;
            this.workoutTemplates[templateIndex].hasActiveSession = true;
            this.workoutTemplates[templateIndex].sessionId = session.id;
          }

          console.log(`Session démarrée pour ${template.name}`);
          console.log('Session created:', session);

          // Navigate to the workout detail page with the active session
          this.router.navigate(['/workouts', template.id], {
            queryParams: { sessionId: session.id }
          });
        },
        error: (error) => {
          // Reset loading state on error
          if (templateIndex !== -1) {
            this.workoutTemplates[templateIndex].isStarting = false;
          }

          console.error('Erreur lors du démarrage de la session');
          console.error('Start session error:', error);
        },
      });
  }

  editWorkoutTemplate(template: Workout): void {
    console.log('Editing template:', template.name);
    this.router.navigate(['/workouts/edit', template.id]);
  }

  duplicateWorkoutTemplate(template: Workout): void {
    console.log('Duplicating template:', template.name);

    this.workoutService
      .duplicateWorkoutTemplate(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (duplicatedTemplate) => {
          console.log(
            `Programme "${duplicatedTemplate.name}" dupliqué avec succès`
          );
          this.refreshData();
        },
        error: (error) => {
          console.error('Erreur lors de la duplication du programme');
          console.error('Duplicate error:', error);
        },
      });
  }

  deleteWorkoutTemplate(template: Workout): void {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer "${template.name}" ?`
    );
    if (!confirmed) return;

    this.workoutService
      .deleteWorkoutTemplate(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`Programme "${template.name}" supprimé`);
          this.refreshData();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du programme');
          console.error('Delete error:', error);
        },
      });
  }

  addToCalendar(template: Workout): void {
    console.log('Adding template to calendar:', template.name);
    // Navigate to calendar with template pre-selected
    this.router.navigate(['/calendar'], {
      queryParams: {
        action: 'add-workout',
        templateId: template.id,
      },
    });
    console.info(
      `Redirection vers le calendrier pour planifier "${template.name}"`
    );
  }

  activatePlan(template: Workout): void {
    console.log('Activating plan:', template.name);
    // Implement activation logic here
    // For example, navigate to a session start page or mark as active
    console.info(`Plan "${template.name}" activé !`);
  }

  // =============================================
  // NAVIGATION ACTIONS
  // =============================================

  createCustomWorkout(): void {
    console.log('Creating custom workout template');
    this.router.navigate(['/workouts/create']);
  }

  viewWorkoutHistory(): void {
    console.log('Viewing workout session history');
    this.router.navigate(['/workouts/history']);
  }

  viewWorkoutStats(): void {
    console.log('Viewing workout statistics');
    this.router.navigate(['/workouts/stats']);
  }

  refreshData(): void {
    console.log('Refreshing workout data');
    this.loadInitialData();
  }

  retryLoad(): void {
    this.error = null;
    this.loadInitialData();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getFilteredCount(): number {
    return this.filteredWorkoutTemplates.length;
  }

  getTotalCount(): number {
    return this.workoutTemplates.length;
  }

  getDifficultyInfo(difficulty?: string) {
    return (
      this.difficultyLevels.find((d) => d.value === difficulty) ||
      this.difficultyLevels[0]
    );
  }

  getCategoryInfo(category?: string) {
    return (
      this.categories.find((c) => c.value === category) || this.categories[0]
    );
  }

  formatDuration(minutes?: number): string {
    if (!minutes || isNaN(minutes)) return '0 min';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes} min`;
  }

  formatCalories(calories?: number): string {
    if (!calories || isNaN(calories)) return '0 cal';
    return `${calories} cal`;
  }

  isCustomTemplate(template: Workout): boolean {
    return template.userId === this.getCurrentUserId();
  }

  getTemplateAge(template: Workout): string {
    const now = new Date();
    const created = new Date(template.createdAt || '');
    const diffDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  private rotateMotivationalQuote(): void {
    const randomIndex = Math.floor(
      Math.random() * this.motivationalQuotes.length
    );
    this.motivationalQuote = this.motivationalQuotes[randomIndex];

    timer(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.rotateMotivationalQuote();
      });
  }

  // =============================================
  // PERFORMANCE OPTIMIZATIONS
  // =============================================

  trackByWorkoutTemplate(_index: number, template: Workout): number {
    return template.id;
  }

  trackByFilter(_index: number, filter: any): string {
    return filter.value;
  }

  // =============================================
  // ACCESSIBILITY HELPERS
  // =============================================

  getWorkoutTemplateAriaLabel(template: Workout): string {
    const parts = [
      template.name,
      `Difficulté: ${this.getDifficultyInfo(template.difficultyLevel).label}`,
      `Catégorie: ${this.getCategoryInfo(template.category).label}`,
    ];

    const duration = template.durationMinutes || template.estimatedDuration;
    if (duration) {
      parts.push(`Durée: ${this.formatDuration(duration)}`);
    }

    if (template.isPublic) {
      parts.push('Programme public');
    }

    if (this.isCustomTemplate(template)) {
      parts.push('Programme personnalisé');
    }

    return parts.join(', ');
  }

  getFilterAriaLabel(filter: any, isActive: boolean): string {
    return `${filter.label}${isActive ? ', activé' : ''}`;
  }

  // =============================================
  // TESTING METHODS
  // =============================================

  testConnection(): void {
    console.log('🧪 Testing workout service connection...');
    this.workoutService.getWorkoutTemplates().subscribe({
      next: (templates) => {
        console.log('✅ Connection successful, templates:', templates.length);
        console.log(
          `Connexion réussie - ${templates.length} programmes chargés`
        );
      },
      error: (error) => {
        console.error('❌ Connection failed:', error);
        console.error('Échec de la connexion au service');
      },
    });
  }

  clearCache(): void {
    this.workoutService.clearCache();
    console.info('Cache vidé');
  }

  getDebugInfo(): any {
    return {
      templatesCount: this.workoutTemplates.length,
      filteredCount: this.filteredWorkoutTemplates.length,
      sessionsCount: this.workoutSessions.length,
      currentUser: this.currentUser?.email || 'None',
      filters: this.filters,
      viewMode: this.viewMode,
      isLoading: this.isLoading,
      error: this.error,
    };
  }
}

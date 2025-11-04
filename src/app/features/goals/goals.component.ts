// Enhanced Goals Component - TypeScript Implementation
// Optimized and adapted from Challenges UX patterns

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { Subject, BehaviorSubject, interval, of, Observable } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  catchError,
  map,
  startWith,
  switchMap,
  filter,
  take
} from 'rxjs/operators';
import { AuthService } from '@app/services/auth.service';
import { GoalsService } from '@app/services/goals.service';

/* =============================================
   ENHANCED INTERFACES
   ============================================= */

interface Goal {
  id?: number;
  title: string;
  description?: string;
  category?: string;
  unit: string;
  current_value: number;
  target_value: number;
  target_date: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'not-started' | 'active' | 'completed' | 'paused';
  created_at?: string;
  progress_percentage?: number;
  notes?: string;
  is_public?: boolean;
  enable_reminders?: boolean;
  reminder_frequency?: 'daily' | 'weekly' | 'monthly';
  icon?: string;
  milestones?: Milestone[];
  lastUpdateDate?: string; // Corrected type to string
}

interface EnhancedGoal extends Goal {
  daysRemaining?: number;
  isOverdue?: boolean;
  isEndingSoon?: boolean; // Added
  progressPercentage?: number;
  categoryInfo?: CategoryInfo;
  priorityInfo?: PriorityInfo;
  progressColor?: string;
  statusColor?: string;
  isOnFire?: boolean;
  progressTrend?: 'up' | 'down' | 'stable';
  velocityScore?: number;
  showFullDescription?: boolean;
  lastUpdateDate?: string; // Corrected type to string
  recentlyUpdated?: boolean;
}

interface Milestone {
  id: number;
  title: string;
  target_value: number;
  target_date: Date | string;
  is_completed: boolean;
  completed_date?: Date | string;
  description?: string;
  icon?: string;
  priority?: 'low' | 'medium' | 'high';
  reward?: string;
}

interface CategoryInfo {
  value: string;
  label: string;
  icon: string; // Changed from emoji to icon to match challenges
  color: string;
  gradient: string;
}

interface PriorityInfo {
  value: string;
  label: string;
  color: string;
  icon: string;
}

interface StatusFilter {
  value: string;
  label: string;
  icon: string;
}

interface GoalFilters {
  status: 'all' | 'not-started' | 'active' | 'completed' | 'paused';
  category: string;
  priority: 'all' | 'low' | 'medium' | 'high';
  sortBy: 'priority' | 'progress' | 'deadline' | 'created' | 'name';
  searchTerm: string;
}

interface GoalStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  averageProgress: number;
  currentStreak: number;
  completedThisWeek: number;
  completedThisMonth: number;
  motivationScore: number;
}

/* =============================================
   CONFIGURATION CONSTANTS
   ============================================= */

const GOAL_CATEGORIES: CategoryInfo[] = [
  {
    value: 'fitness',
    label: 'Fitness',
    icon: '💪',
    color: '#21BF73',
    gradient: 'linear-gradient(135deg, #21BF73, #1da460)',
  },
  {
    value: 'nutrition',
    label: 'Nutrition',
    icon: '🥗',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    value: 'wellness',
    label: 'Bien-être',
    icon: '🧘‍♀️',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  },
  {
    value: 'cardio',
    label: 'Cardio',
    icon: '🏃‍♂️',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  },
  {
    value: 'strength',
    label: 'Force',
    icon: '⚡',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    value: 'flexibility',
    label: 'Flexibilité',
    icon: '🌿',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    value: 'mental',
    label: 'Mental',
    icon: '🧠',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  },
  {
    value: 'weight',
    label: 'Poids',
    icon: '⚖️',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16, #65a30d)',
  },
];

const PRIORITY_LEVELS: PriorityInfo[] = [
  { value: 'low', label: 'Basse', color: '#10b981', icon: '😌' },
  { value: 'medium', label: 'Moyenne', color: '#f59e0b', icon: '🎯' },
  { value: 'high', label: 'Haute', color: '#ef4444', icon: '🔥' },
];

const STATUS_FILTERS: StatusFilter[] = [
  { value: 'all', label: 'Tous', icon: '📋' },
  { value: 'not-started', label: 'Non commencé', icon: '⏳' },
  { value: 'active', label: 'Actifs', icon: '▶️' },
  { value: 'completed', label: 'Terminés', icon: '✅' },
  { value: 'paused', label: 'En pause', icon: '⏸️' },
];

const STATUS_CONFIG = {
  'not-started': {
    label: 'Non commencé',
    emoji: '⏳',
    color: '#6b7280',
    icon: '',
  },
  active: {
    label: 'Actif',
    emoji: '▶️',
    color: '#21BF73',
    icon: '',
  },
  paused: {
    label: 'En pause',
    emoji: '⏸️',
    color: '#f59e0b',
    icon: '',
  },
  completed: {
    label: 'Terminé',
    emoji: '✅',
    color: '#3b82f6',
    icon: '',
  },
};

/* =============================================
   UTILITY CLASSES
   ============================================= */

class DateUtils {
  static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  static getDaysBetween(date1: Date, date2: Date): number {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

class StorageUtils {
  private static readonly PREFIX = 'goals_app_';

  static setItem<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined') {
        (window as any).goalStorage = (window as any).goalStorage || {};
        (window as any).goalStorage[this.PREFIX + key] = JSON.stringify(value);
      }
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      if (typeof window !== 'undefined' && (window as any).goalStorage) {
        const item = (window as any).goalStorage[this.PREFIX + key];
        return item ? JSON.parse(item) : null;
      }
      return null;
    } catch (error) {
      console.warn('Failed to read from storage:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && (window as any).goalStorage) {
        delete (window as any).goalStorage[this.PREFIX + key];
      }
    } catch (error) {
      console.warn('Failed to remove from storage:', error);
    }
  }
}

/* =============================================
   ENHANCED COMPONENT WITH ANIMATIONS
   ============================================= */

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate(
          '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'translateY(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '0.2s ease-in',
          style({ transform: 'translateY(-20px)', opacity: 0 })
        ),
      ]),
    ]),

    trigger('cardAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate(
          '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'scale(1)', opacity: 1 })
        ),
      ]),
    ]),

    trigger('staggerAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ transform: 'translateY(30px)', opacity: 0 }),
            stagger(100, [
              animate(
                '0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                style({ transform: 'translateY(0)', opacity: 1 })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),

    trigger('modalAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate(
          '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'scale(1)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ transform: 'scale(0.9)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class GoalsComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  loading = false;
  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');
  private autosaveTimer$ = interval(10000);
  private updateProgressSubject = new Subject<{
    goalId: number;
    newValue: number;
  }>();

  // Configuration
  readonly goalCategories = GOAL_CATEGORIES;
  readonly priorityLevels = PRIORITY_LEVELS;
  readonly statusConfig = STATUS_CONFIG;
  readonly statusFilters = STATUS_FILTERS;

  // UI State
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  showSuccessMessage = false;
  showAnalytics = false;
  showGoalDetails = false;
  hasError = false;
  errorMessage = '';
  successMessage = '';
  expandedGoalId: number | null = null;
  quickUpdateValues: { [key: number]: number } = {};
  viewMode: 'grid' | 'list' = 'grid';
  selectedGoals: number[] = [];

  // Individual goal loading states (inspired by challenges)
  goalLoadingStates: { [key: number]: boolean } = {};
  goalActionStates: { [key: number]: 'idle' | 'starting' | 'completing' | 'pausing' | 'resetting' } = {};

  // Data
  goals: EnhancedGoal[] = [];
  filteredGoals: EnhancedGoal[] = [];
  selectedGoal: EnhancedGoal | null = null;
  goalStats: GoalStats = {
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0,
    averageProgress: 0,
    currentStreak: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
    motivationScore: 0,
  };

  // Filters
  filters: GoalFilters = {
    status: 'all',
    category: 'all',
    priority: 'all',
    sortBy: 'priority',
    searchTerm: '',
  };

  // Modal states
  isAddingGoal = false;
  isAddingMilestone = false;
  resetAllGoalsConfirmation = false;
  resetGoalConfirmation = false;
  goalToReset: EnhancedGoal | null = null;

  // Forms
  goalForm!: FormGroup;
  milestoneForm!: FormGroup;
  minDate = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private goalsService: GoalsService,
    private authService: AuthService
  ) {
    this.initializeForms();
    this.loadFiltersFromStorage();
    this.setupSearchDebounce();
    this.setupViewModeFromStorage();
    this.setupAutosave();
    this.setupProgressUpdateDebounce();
  }

  ngOnInit(): void {
    console.log('GoalsComponent initialized');
    this.authService.isInitialized$.pipe(
      filter(isInitialized => isInitialized),
      take(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('AuthService is initialized, loading goals.');
      this.loadGoals();
    });
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.saveFiltersToStorage();
    this.saveViewModeToStorage();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* =============================================
     INITIALIZATION METHODS
     ============================================= */

  private initializeForms(): void {
    this.goalForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
      category: ['fitness', Validators.required],
      priority: ['medium', Validators.required],
      current_value: [0, [Validators.required, Validators.min(0)]],
      target_value: [1, [Validators.required, Validators.min(1)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      target_date: ['', Validators.required],
      notes: ['', Validators.maxLength(1000)],
      is_public: [false],
      enable_reminders: [false],
      reminder_frequency: ['weekly'],
      icon: ['🎯'],
    });

    this.milestoneForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      target_value: [1, [Validators.required, Validators.min(1)]],
      target_date: ['', Validators.required],
      description: ['', Validators.maxLength(200)],
      icon: ['🎯'],
      priority: ['medium'],
      reward: [''],
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filters.searchTerm = term;
        this.applyFilters();
      });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            this.openAddGoal();
            break;
          case 'f':
            event.preventDefault();
            this.focusSearchInput();
            break;
        }
      }

      if (event.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  private setupViewModeFromStorage(): void {
    const storedViewMode = StorageUtils.getItem<'grid' | 'list'>('view_mode');
    if (storedViewMode) {
      this.viewMode = storedViewMode;
    }
  }

  private setupAutosave(): void {
    this.autosaveTimer$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.saveGoalsToStorage();
    });
  }

  private setupProgressUpdateDebounce(): void {
    this.updateProgressSubject
      .pipe(
        debounceTime(500), // Wait for 500ms after the last emission
        distinctUntilChanged(
          (prev, curr) =>
            prev.goalId === curr.goalId && prev.newValue === curr.newValue
        ),
        switchMap(({ goalId, newValue }) => {
          this.loading = true; // Show loading indicator during API call
          return this.goalsService.updateProgress(goalId, newValue).pipe(
            catchError((error) => {
              console.error('Failed to update goal progress:', error);
              this.showNotification(
                '❌ Erreur lors de la mise à jour de la progression: ' +
                  (error.message || 'Erreur inconnue')
              );
              this.loadGoals(); // Reload to revert UI if error
              return of(null);
            }),
            takeUntil(this.destroy$)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((updatedGoal) => {
        if (updatedGoal) {
          const index = this.goals.findIndex((g) => g.id === updatedGoal.id);
          if (index > -1) {
            const enhanced = this.enhanceGoal(updatedGoal);
            enhanced.lastUpdateDate = new Date().toISOString();
            this.goals[index] = enhanced;
            this.applyFilters();
            this.calculateStats();
            this.showNotification('Progression mise à jour avec succès!');

            if (updatedGoal.status === 'completed') {
              this.showNotification('🎉 Félicitations ! Objectif atteint ! 🏆');
            }
          }
        }
        this.loading = false; // Hide loading indicator
        this.cdr.detectChanges();
      });
  }

  /* =============================================
     DATA LOADING AND MANAGEMENT
     ============================================= */

  loadGoals(): void {
    this.isLoading = true;
    this.hasError = false;

    // Load goals from API
    this.goalsService
      .getGoals()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to load goals:', error);
          this.hasError = true;
          this.errorMessage = error.message || 'Failed to load goals';

          // Fallback to stored goals if API fails
          const storedGoals = StorageUtils.getItem<Goal[]>('goals_data');
          if (storedGoals && storedGoals.length > 0) {
            console.log('Falling back to stored goals');
            this.hasError = false;
            return of(storedGoals);
          }

          // Last resort: load mock data for development
          this.loadMockGoals();
          return of([]);
        })
      )
      .subscribe((goals) => {
        if (goals && goals.length > 0) {
          this.goals = this.enhanceGoals(goals);
          this.calculateStats();
          this.applyFilters();

          // Cache goals in storage for offline use
          StorageUtils.setItem('goals_data', goals);
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  private loadMockGoals(): void {
    const mockGoals: Goal[] = [
      {
        id: 1,
        title: "Perdre 10 kg pour l'été",
        description:
          "Atteindre un poids plus sain en adoptant une alimentation équilibrée et une routine d'exercice régulière.",
        category: 'weight',
        unit: 'kg',
        current_value: 0,
        target_value: 10,
        target_date: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        priority: 'high',
        status: 'not-started',
        created_at: new Date(
          Date.now() - 45 * 24 * 60 * 60 * 1000
        ).toISOString(),
        progress_percentage: 0,
        icon: '⚖️',
        notes: 'Focus sur cardio 3x/semaine + alimentation équilibrée.',
        lastUpdateDate: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Courir 150 km ce mois',
        description:
          'Améliorer mon endurance cardiovasculaire en courant régulièrement.',
        category: 'cardio',
        unit: 'km',
        current_value: 120,
        target_value: 150,
        target_date: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0
        ).toISOString(),
        priority: 'medium',
        status: 'active',
        created_at: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString(),
        progress_percentage: 80,
        icon: '🏃‍♂️',
        notes: 'Alterner entre courses lentes et fractionnés.',
        lastUpdateDate: new Date().toISOString(),
      },
      {
        id: 3,
        title: 'Méditer 30 jours consécutifs',
        description:
          'Développer une pratique de méditation quotidienne pour améliorer mon bien-être mental.',
        category: 'mental',
        unit: 'jours',
        current_value: 30,
        target_value: 30,
        target_date: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        priority: 'medium',
        status: 'completed',
        created_at: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        progress_percentage: 100,
        icon: '🧘‍♀️',
        notes: 'Sessions de 10-15 minutes chaque matin.',
        lastUpdateDate: new Date().toISOString(),
      },
      {
        id: 4,
        title: 'Faire 12 000 pas par jour',
        description:
          "Maintenir un niveau d'activité quotidien élevé pour améliorer ma santé cardiovasculaire.",
        category: 'fitness',
        unit: 'jours',
        current_value: 25,
        target_value: 30,
        target_date: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        priority: 'low',
        status: 'active',
        created_at: new Date(
          Date.now() - 25 * 24 * 60 * 60 * 1000
        ).toISOString(),
        progress_percentage: 83,
        icon: '👟',
        notes: 'Utiliser podomètre pour tracking quotidien.',
        lastUpdateDate: new Date().toISOString(),
      },
      {
        id: 5,
        title: 'Développé couché : 100kg',
        description:
          'Passer de 80kg à 100kg au développé couché avec une technique parfaite.',
        category: 'strength',
        unit: 'kg',
        current_value: 92,
        target_value: 100,
        target_date: new Date(
          Date.now() + 45 * 24 * 60 * 60 * 1000
        ).toISOString(),
        priority: 'high',
        status: 'active',
        created_at: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        progress_percentage: 60,
        icon: '⚡',
        notes: 'Programme force 5x5, progression 2.5kg/semaine.',
        lastUpdateDate: new Date().toISOString(),
      },
      {
        id: 6,
        title: 'Programme yoga quotidien',
        description:
          'Intégrer 20 minutes de yoga chaque jour pour améliorer flexibilité et équilibre.',
        category: 'flexibility',
        unit: 'séances',
        current_value: 18,
        target_value: 30,
        target_date: new Date(
          Date.now() + 12 * 24 * 60 * 60 * 1000
        ).toISOString(),
        priority: 'low',
        status: 'paused',
        created_at: new Date(
          Date.now() - 18 * 24 * 60 * 60 * 1000
        ).toISOString(),
        progress_percentage: 60,
        icon: '🌿',
        notes: 'Focus sur positions de base et respiration.',
        lastUpdateDate: new Date().toISOString(),
      },
    ];

    this.goals = this.enhanceGoals(mockGoals);
    this.saveGoalsToStorage();
    this.calculateStats();
    this.applyFilters();
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private enhanceGoals(goals: Goal[]): EnhancedGoal[] {
    return goals.map((goal) => this.enhanceGoal(goal));
  }

  private enhanceGoal(goal: Goal): EnhancedGoal {
    if (!goal.id) {
      goal.id = Date.now(); // Fallback ID for new goals
    }
    const targetDate = new Date(goal.target_date);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isEndingSoon =
      daysRemaining <= 7 && daysRemaining > 0 && goal.status !== 'completed'; // Define 'ending soon' threshold, e.g., 7 days

    // Calculate these values within enhanceGoal
    const progressPercentage = this.calculateProgressPercentage(goal);
    const categoryInfo = this.getCategoryInfo(goal.category || '');
    const priorityInfo = this.getPriorityInfo(goal.priority || '');
    const daysSinceCreated = this.calculateDaysSinceCreated(
      goal.created_at || ''
    );
    const progressTrend = this.calculateProgressTrend(goal);
    const velocityScore = this.calculateVelocityScore(goal);
    const lastUpdateDate = goal.lastUpdateDate
      ? new Date(goal.lastUpdateDate)
      : null;
    const isRecentlyUpdated = lastUpdateDate
      ? now.getTime() - lastUpdateDate.getTime() < 24 * 60 * 60 * 1000
      : false; // Last 24 hours

    return {
      ...goal,
      daysRemaining: Math.max(0, daysRemaining),
      isOverdue: daysRemaining < 0 && goal.status !== 'completed',
      isEndingSoon: isEndingSoon, // Added
      progressPercentage,
      categoryInfo,
      priorityInfo,
      progressColor: this.getProgressColor(progressPercentage, goal.status),
      statusColor:
        this.statusConfig[goal.status as keyof typeof this.statusConfig]
          ?.color || '#6b7280',
      isOnFire: progressPercentage >= 80 && daysSinceCreated >= 7,
      progressTrend,
      velocityScore,
      showFullDescription: false,
      lastUpdateDate: new Date().toISOString(),
      recentlyUpdated: isRecentlyUpdated, // Added
    };
  }

  /* =============================================
     CALCULATION METHODS
     ============================================= */

  private calculateProgressPercentage(goal: Goal): number {
    if (goal.progress_percentage !== undefined) {
      return goal.progress_percentage;
    }
    if (goal.target_value <= 0) return 0;
    return Math.min(
      100,
      Math.round((goal.current_value / goal.target_value) * 100)
    );
  }

  private getProgressColor(progress: number, status: string): string {
    if (status === 'completed') return '#21BF73';
    if (status === 'paused') return '#f59e0b';

    if (progress >= 90) return '#21BF73';
    if (progress >= 70) return '#3b82f6';
    if (progress >= 50) return '#8b5cf6';
    if (progress >= 30) return '#f59e0b';
    return '#ef4444';
  }

  private calculateStats(): void {
    const active = this.goals.filter((g) => g.status === 'active');
    const completed = this.goals.filter((g) => g.status === 'completed');
    const overdue = this.goals.filter((g) => g.isOverdue);

    const avgProgress =
      active.length > 0
        ? active.reduce((sum, g) => sum + (g.progressPercentage || 0), 0) /
          active.length
        : 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const completedThisWeek = completed.filter(
      (g) => g.created_at && new Date(g.created_at) >= oneWeekAgo
    ).length;

    const completedThisMonth = completed.filter(
      (g) => g.created_at && new Date(g.created_at) >= oneMonthAgo
    ).length;

    const currentStreak = Math.min(active.length * 2, 30);
    const motivationScore = Math.round((avgProgress + currentStreak * 2) / 2);

    this.goalStats = {
      total: this.goals.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      averageProgress: Math.round(avgProgress),
      currentStreak,
      completedThisWeek,
      completedThisMonth,
      motivationScore: Math.min(100, motivationScore),
    };
  }

  private calculateDaysSinceCreated(createdAt: string): number {
    if (!createdAt) return 0;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  private calculateProgressTrend(goal: Goal): 'up' | 'down' | 'stable' {
    // Placeholder: Implement actual logic based on historical data if available
    // For now, always return 'stable'
    return 'stable';
  }

  private calculateVelocityScore(goal: Goal): number {
    // Placeholder: Implement actual logic based on progress over time
    // For now, return a dummy value
    return 0;
  }

  calculateSmartIncrement(goal: EnhancedGoal): number {
    const target = goal.target_value;
    if (target <= 10) return 0.1;
    if (target <= 100) return 1;
    if (target <= 1000) return 5;
    return 10;
  }

  /* =============================================
     FILTERING AND SEARCH
     ============================================= */

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchSubject.next(target ? target.value : '');
  }

  clearSearch(): void {
    this.searchSubject.next('');
    this.focusSearchInput();
  }

  clearFilters(): void {
    this.filters = {
      status: 'all',
      category: 'all',
      priority: 'all',
      sortBy: 'priority',
      searchTerm: '',
    };
    this.searchSubject.next('');
    this.applyFilters();
    this.saveFiltersToStorage();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.status !== 'all' ||
      this.filters.category !== 'all' ||
      this.filters.priority !== 'all' ||
      this.filters.searchTerm !== ''
    );
  }

  applyFilters(): void {
    let filtered = [...this.goals];

    // Apply status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter((g) => g.status === this.filters.status);
    }

    // Apply category filter
    if (this.filters.category !== 'all') {
      filtered = filtered.filter((g) => g.category === this.filters.category);
    }

    // Apply priority filter
    if (this.filters.priority !== 'all') {
      filtered = filtered.filter((g) => g.priority === this.filters.priority);
    }

    // Apply search filter
    if (this.filters.searchTerm.trim()) {
      const term = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.title.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term) ||
          g.unit.toLowerCase().includes(term) ||
          g.notes?.toLowerCase().includes(term) ||
          g.icon?.includes(term)
      );
    }

    // Apply sorting
    this.sortGoals(filtered);

    this.filteredGoals = filtered;
    this.cdr.detectChanges();
  }

  private sortGoals(goals: EnhancedGoal[]): void {
    goals.sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          );
        case 'progress':
          return (b.progressPercentage || 0) - (a.progressPercentage || 0);
        case 'deadline':
          return (
            new Date(a.target_date).getTime() -
            new Date(b.target_date).getTime()
          );
        case 'created':
          return (
            new Date(b.created_at || '').getTime() -
            new Date(a.created_at || '').getTime()
          );
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }

  /* =============================================
     GOAL ACTIONS
     ============================================= */

  openGoalDetails(goal: EnhancedGoal): void {
    this.selectedGoal = goal;
    this.showGoalDetails = true;
    this.cdr.detectChanges();
  }

  closeGoalDetails(): void {
    this.showGoalDetails = false;
    this.selectedGoal = null;
    this.cdr.detectChanges();
  }


  startGoal(goal: EnhancedGoal): void {
    if (!goal.id) return;
    
    this.setGoalLoading(goal.id, true);
    this.setGoalActionState(goal.id, 'starting');
    
    this.goalsService
      .activateGoal(goal.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to start goal:', error);
          this.showNotification(
            "❌ Erreur lors du démarrage de l'objectif: " +
              (error.message || 'Erreur inconnue')
          );
          if (goal.id) {
            this.setGoalLoading(goal.id, false);
            this.setGoalActionState(goal.id, 'idle');
          }
          this.loadGoals(); // Reload to revert UI if error
          return of(null);
        })
      )
      .subscribe((updatedGoal) => {
        if (updatedGoal) {
          // Update local goal state immediately
          const index = this.goals.findIndex(g => g.id === goal.id);
          if (index > -1) {
            this.goals[index] = this.enhanceGoal(updatedGoal);
            this.applyFilters();
            this.calculateStats();
          }
          this.showNotification(`▶️ Objectif "${updatedGoal.title}" démarré !`);
        }
        if (goal.id) {
          this.setGoalLoading(goal.id, false);
          this.setGoalActionState(goal.id, 'idle');
        }
      });
  }

  completeGoal(goal: EnhancedGoal): void {
    if (!goal.id) return;
    
    this.setGoalLoading(goal.id, true);
    this.setGoalActionState(goal.id, 'completing');
    
    this.goalsService
      .markComplete(goal.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to complete goal:', error);
          this.showNotification(
            "❌ Erreur lors de la finalisation de l'objectif: " +
              (error.message || 'Erreur inconnue')
          );
          if (goal.id) {
            this.setGoalLoading(goal.id, false);
            this.setGoalActionState(goal.id, 'idle');
          }
          this.loadGoals();
          return of(null);
        })
      )
      .subscribe((updatedGoal) => {
        if (updatedGoal) {
          // Update local goal state immediately
          const index = this.goals.findIndex(g => g.id === goal.id);
          if (index > -1) {
            this.goals[index] = this.enhanceGoal(updatedGoal);
            this.applyFilters();
            this.calculateStats();
          }
          this.showNotification(`🎆 Félicitations ! Objectif "${updatedGoal.title}" accompli !`);
        }
        if (goal.id) {
          this.setGoalLoading(goal.id, false);
          this.setGoalActionState(goal.id, 'idle');
        }
      });
  }

  resetGoal(goal: EnhancedGoal): void {
    if (!confirm(`Êtes-vous sûr de vouloir recommencer l'objectif "${goal.title}" ? Cette action remettra le progrès à zéro et changera le statut en "non commencé".`)) {
      return;
    }
    
    this.directResetGoal(goal);
  }

  directResetGoal(goal: EnhancedGoal): void {
    if (!goal.id) return;
    
    this.setGoalLoading(goal.id, true);
    this.setGoalActionState(goal.id, 'resetting');
    
    // Improved reset approach inspired by challenges component
    // First update goal to reset progress and status
    const resetData = {
      current_value: 0,
      status: 'not-started' as const,
      progress_percentage: 0
    };
    
    this.goalsService
      .updateGoal(goal.id, resetData)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to reset goal:', error);
          this.showNotification(
            "❌ Erreur lors de la réinitialisation de l'objectif: " +
              (error.message || 'Erreur inconnue')
          );
          if (goal.id) {
            this.setGoalLoading(goal.id, false);
            this.setGoalActionState(goal.id, 'idle');
          }
          return of(null);
        })
      )
      .subscribe((resetGoal: Goal | null) => {
        if (resetGoal) {
          // Update local goal data immediately (inspired by challenges pattern)
          const index = this.goals.findIndex(g => g.id === resetGoal.id);
          if (index > -1) {
            // Update the goal with reset values
            const enhancedGoal = this.enhanceGoal({
              ...resetGoal,
              current_value: 0,
              status: 'not-started',
              progress_percentage: 0,
              lastUpdateDate: new Date().toISOString()
            });
            this.goals[index] = enhancedGoal;
            this.applyFilters();
            this.calculateStats();
          }
          
          this.showNotification(
            `🔄 Objectif "${resetGoal.title}" complètement réinitialisé et prêt à recommencer!`
          );
        }
        if (goal.id) {
          this.setGoalLoading(goal.id, false);
          this.setGoalActionState(goal.id, 'idle');
        }
      });
  }

  confirmResetGoal(): void {
    if (!this.goalToReset || this.goalToReset.id === undefined) {
      this.showNotification('❌ Erreur: Objectif à réinitialiser non trouvé.');
      this.closeResetGoalConfirmation();
      return;
    }

    const goal = this.goalToReset;
    this.setGoalLoading(goal.id!, true);
    this.setGoalActionState(goal.id!, 'resetting');
    
    // Use the same improved approach as directResetGoal
    const resetData = {
      current_value: 0,
      status: 'not-started' as const,
      progress_percentage: 0
    };
    
    this.goalsService
      .updateGoal(goal.id!, resetData)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to reset goal:', error);
          this.showNotification(
            "❌ Erreur lors de la réinitialisation de l'objectif: " +
              (error.message || 'Erreur inconnue')
          );
          this.setGoalLoading(goal.id!, false);
          this.setGoalActionState(goal.id!, 'idle');
          this.closeResetGoalConfirmation();
          return of(null);
        })
      )
      .subscribe((resetGoal: Goal | null) => {
        if (resetGoal) {
          // Update local goal data immediately
          const index = this.goals.findIndex(g => g.id === resetGoal.id);
          if (index > -1) {
            const enhancedGoal = this.enhanceGoal({
              ...resetGoal,
              current_value: 0,
              status: 'not-started',
              progress_percentage: 0,
              lastUpdateDate: new Date().toISOString()
            });
            this.goals[index] = enhancedGoal;
            this.applyFilters();
            this.calculateStats();
          }
          
          this.showNotification(
            `🔄 Objectif "${resetGoal.title}" complètement réinitialisé et prêt à recommencer!`
          );
        }
        this.setGoalLoading(goal.id!, false);
        this.setGoalActionState(goal.id!, 'idle');
        this.closeResetGoalConfirmation();
      });
  }

  closeResetGoalConfirmation(): void {
    this.resetGoalConfirmation = false;
    this.goalToReset = null;
    this.cdr.detectChanges();
  }

  private updateGoalInBackend(goal: EnhancedGoal): void {
    if (!goal.id) return;
    this.goalsService.updateGoal(goal.id, goal).subscribe({
      next: (updatedGoal) => {
        const index = this.goals.findIndex((g) => g.id === goal.id);
        if (index > -1) {
          this.goals[index] = this.enhanceGoal(updatedGoal);
          this.applyFilters();
          this.calculateStats();
          this.showNotification('Objectif mis à jour avec succès!');
        }
      },
      error: (error) => {
        console.error('Failed to update goal:', error);
        this.showNotification("Erreur lors de la mise à jour de l'objectif.");
        // Optionally revert the change in the UI
        this.loadGoals();
      },
    });
  }

  toggleGoalStatus(goal: EnhancedGoal): void {
    if (!goal.id) return;

    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    this.setGoalLoading(goal.id, true);
    this.setGoalActionState(goal.id, newStatus === 'active' ? 'starting' : 'pausing');
    
    let statusUpdateObservable: Observable<Goal>; // Explicitly type Observable as Goal

    if (newStatus === 'active') {
      statusUpdateObservable = this.goalsService.activateGoal(goal.id);
    } else {
      statusUpdateObservable = this.goalsService.pauseGoal(goal.id);
    }

    statusUpdateObservable
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to toggle goal status:', error);
          this.showNotification(
            "❌ Erreur lors du changement de statut de l'objectif: " +
              (error.message || 'Erreur inconnue')
          );
          if (goal.id) {
            this.setGoalLoading(goal.id, false);
            this.setGoalActionState(goal.id, 'idle');
          }
          this.loadGoals(); // Reload to revert UI if error
          return of(null);
        })
      )
      .subscribe((updatedGoal: Goal | null) => {
        // Explicitly type updatedGoal as Goal or null
        if (updatedGoal) {
          // Update local goal state immediately
          const index = this.goals.findIndex(g => g.id === goal.id);
          if (index > -1) {
            this.goals[index] = this.enhanceGoal(updatedGoal);
            this.applyFilters();
            this.calculateStats();
          }
          
          const statusIcon =
            this.statusConfig[
              updatedGoal.status as keyof typeof this.statusConfig
            ]?.icon || '';
          const message =
            updatedGoal.status === 'active'
              ? `⚡ Objectif repris ${statusIcon}`
              : `⏸️ Objectif mis en pause ${statusIcon}`;
          this.showNotification(message);
        }
        if (goal.id) {
          this.setGoalLoading(goal.id, false);
          this.setGoalActionState(goal.id, 'idle');
        }
      });
  }

  enableQuickUpdate(goal: EnhancedGoal): void {
    if (goal.id) {
      this.quickUpdateValues[goal.id] = goal.current_value;
      this.cdr.detectChanges();
    }
  }

  cancelQuickUpdate(goal: EnhancedGoal): void {
    if (goal.id) {
      delete this.quickUpdateValues[goal.id];
      this.cdr.detectChanges();
    }
  }

  isQuickUpdateMode(goal: EnhancedGoal): boolean {
    return goal.id ? goal.id in this.quickUpdateValues : false;
  }

  incrementValue(goal: EnhancedGoal): void {
    if (!goal.id) return;
    const current = this.quickUpdateValues[goal.id] ?? goal.current_value;
    const increment = this.calculateSmartIncrement(goal);
    this.quickUpdateValues[goal.id] = parseFloat(
      Math.min(current + increment, goal.target_value).toFixed(2)
    );
  }

  decrementValue(goal: EnhancedGoal): void {
    if (!goal.id) return;
    const current = this.quickUpdateValues[goal.id] ?? goal.current_value;
    const increment = this.calculateSmartIncrement(goal);
    this.quickUpdateValues[goal.id] = parseFloat(
      Math.max(current - increment, 0).toFixed(2)
    );
  }

  isIncrementDisabled(goal: EnhancedGoal): boolean {
    const currentValue = this.quickUpdateValues[goal.id!] ?? goal.current_value;
    return currentValue >= goal.target_value;
  }

  isDecrementDisabled(goal: EnhancedGoal): boolean {
    const currentValue = this.quickUpdateValues[goal.id!] ?? goal.current_value;
    return currentValue <= 0;
  }

  // Add a new method to toggle quick update mode and initialize value
  toggleQuickUpdateMode(goal: EnhancedGoal): void {
    if (goal.id) {
      if (this.isQuickUpdateMode(goal)) {
        this.cancelQuickUpdate(goal);
      } else {
        this.enableQuickUpdate(goal);
      }
    }
  }

  updateGoalProgress(goal: EnhancedGoal): void {
    if (!goal.id) return;
    const newValue = this.quickUpdateValues[goal.id];
    if (newValue == null || newValue < 0 || newValue > goal.target_value) {
      this.showNotification('Valeur invalide');
      return;
    }

    this.updateProgressSubject.next({ goalId: goal.id, newValue });
    // The actual API call and UI update will be handled by the debounced observable
  }

  openEditGoal(goal: EnhancedGoal): void {
    this.isEditMode = true;
    this.selectedGoal = goal;
    this.populateGoalForm(goal);
    this.isAddingGoal = true;
    this.cdr.detectChanges();
  }

  deleteGoal(goal: EnhancedGoal): void {
    const goalIcon = goal.icon || '🎯';
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer "${goal.title}" ${goalIcon} ?`
      )
    )
      return;

    if (!goal.id) return;
    this.loading = true;
    this.goalsService
      .deleteGoal(goal.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Failed to delete goal:', error);
          this.showNotification(
            "❌ Erreur lors de la suppression de l'objectif: " +
              (error.message || 'Erreur inconnue')
          );
          this.loading = false;
          return of(null);
        })
      )
      .subscribe(() => {
        this.showNotification('🗑️ Objectif supprimé');
        // The service's tap operator will update the goalsSubject, triggering UI refresh
        this.loading = false;
      });
  }

  duplicateGoal(goal: EnhancedGoal): void {
    const duplicate: Goal = {
      ...goal,
      id: Date.now(),
      title: `${goal.title} (Copie)`,
      current_value: 0,
      status: 'not-started',
      created_at: new Date().toISOString(),
      progress_percentage: 0,
      milestones: [],
    };

    this.goals.unshift(this.enhanceGoal(duplicate));
    this.calculateStats();
    this.saveGoalsToStorage();
    this.applyFilters();
    this.showNotification('📋 Objectif dupliqué avec succès !');
  }

  shareGoal(goal: EnhancedGoal): void {
    const shareText = `🎯 Mon objectif: ${goal.title}\n📊 Progression: ${goal.progressPercentage}%\n🎯 ${goal.current_value}/${goal.target_value} ${goal.unit}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Objectif: ${goal.title}`,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {
          this.copyToClipboard(shareText);
        });
    } else {
      this.copyToClipboard(shareText);
    }

    this.showNotification('📤 Objectif partagé !');
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  /* =============================================
     MODAL AND FORM MANAGEMENT
     ============================================= */

  openAddGoal(): void {
    this.isEditMode = false;
    this.selectedGoal = null;
    this.resetGoalForm();
    this.isAddingGoal = true;
  }

  closeAddGoal(): void {
    this.isAddingGoal = false;
    this.resetGoalForm();
  }

  openAddMilestone(goal: EnhancedGoal): void {
    this.selectedGoal = goal;
    this.resetMilestoneForm();
    this.isAddingMilestone = true;
  }

  closeAddMilestone(): void {
    this.isAddingMilestone = false;
    this.resetMilestoneForm();
    this.selectedGoal = null;
  }

  closeAllModals(): void {
    this.isAddingGoal = false;
    this.isAddingMilestone = false;
    this.selectedGoal = null;
    this.resetAllGoalsConfirmation = false;
  }

  openResetAllGoalsConfirmation(): void {
    this.resetAllGoalsConfirmation = true;
    this.cdr.detectChanges();
  }

  closeResetAllGoalsConfirmation(): void {
    this.resetAllGoalsConfirmation = false;
    this.cdr.detectChanges();
  }

  confirmResetAllGoals(): void {
    this.loading = true;
    this.goalsService.resetAllGoals().subscribe({
      next: () => {
        this.showNotification('Tous les objectifs ont été réinitialisés.');
        this.loadGoals();
        this.closeResetAllGoalsConfirmation();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to reset all goals:', error);
        this.showNotification(
          'Erreur lors de la réinitialisation des objectifs.'
        );
        this.loading = false;
      },
    });
  }

  saveGoal(): void {
    if (this.goalForm.invalid) {
      this.markFormGroupTouched(this.goalForm);
      this.showNotification('Veuillez corriger les erreurs du formulaire');
      return;
    }

    this.loading = true; // Added loading indicator
    this.isSaving = true;
    const formData = this.goalForm.value;

    // Validate dates
    const startDate = new Date();
    const endDate = new Date(formData.target_date);

    if (endDate <= startDate) {
      this.showNotification(
        "La date de fin doit être postérieure à aujourd'hui"
      );
      this.isSaving = false;
      this.loading = false; // Reset loading on validation error
      return;
    }

    if (this.isEditMode && this.selectedGoal && this.selectedGoal.created_at) {
      const createdAtDate = new Date(this.selectedGoal.created_at);
      // Ensure target_date is not before created_at date when editing
      if (endDate < createdAtDate) {
        this.showNotification(
          "La date d'échéance ne peut pas être antérieure à la date de création de l'objectif"
        );
        this.isSaving = false;
        this.loading = false;
        return;
      }
    }

    // API call using GoalsService
    if (this.isEditMode && this.selectedGoal) {
      // Update existing goal
      this.goalsService
        .updateGoal(this.selectedGoal.id!, formData)
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Failed to update goal:', error);
            this.showNotification(
              "❌ Erreur lors de la modification de l'objectif: " +
                (error.message || 'Erreur inconnue')
            );
            this.isSaving = false;
            this.loading = false; // Reset loading on error
            return of(null);
          })
        )
        .subscribe((updatedGoal) => {
          if (updatedGoal) {
            const index = this.goals.findIndex(
              (g) => g.id === this.selectedGoal!.id
            );
            if (index > -1) {
              this.goals[index] = this.enhanceGoal(updatedGoal);
            }
            this.showNotification('✏️ Objectif modifié avec succès !');
            this.calculateStats();
            this.applyFilters();
            this.closeAddGoal();
          }
          this.isSaving = false;
          this.loading = false; // Reset loading on success
        });
    } else {
      // Create new goal
      const newGoalData = {
        ...formData,
        current_value: formData.current_value || 0,
        status: 'not-started' as const,
      };

      this.goalsService
        .createGoal(newGoalData)
        .pipe(
          takeUntil(this.destroy$),
          catchError((error) => {
            console.error('Failed to create goal:', error);
            this.showNotification(
              "❌ Erreur lors de la création de l'objectif: " +
                (error.message || 'Erreur inconnue')
            );
            this.isSaving = false;
            this.loading = false; // Reset loading on error
            return of(null);
          })
        )
        .subscribe((createdGoal) => {
          if (createdGoal) {
            this.goals.unshift(this.enhanceGoal(createdGoal));
            this.showNotification(
              '🎯 Objectif créé avec succès ! 🎉 Points gagnés !'
            );
            this.calculateStats();
            this.applyFilters();
            this.closeAddGoal();
          }
          this.isSaving = false;
          this.loading = false; // Reset loading on success
        });
    }
  }

  saveMilestone(): void {
    if (this.milestoneForm.invalid || !this.selectedGoal) {
      this.markFormGroupTouched(this.milestoneForm);
      return;
    }

    this.isSaving = true;
    const formData = this.milestoneForm.value;

    const newMilestone: Milestone = {
      id: Date.now(),
      title: formData.title,
      target_value: formData.target_value,
      target_date: new Date(formData.target_date),
      is_completed: false,
      description: formData.description,
      icon: formData.icon || '🎯',
      priority: formData.priority,
      reward: formData.reward,
    };

    this.selectedGoal.milestones = this.selectedGoal.milestones || [];
    this.selectedGoal.milestones.push(newMilestone);

    this.saveGoalsToStorage();
    this.closeAddMilestone();
    this.isSaving = false;
    this.showNotification('🎯 Étape ajoutée avec succès !');
  }

  private resetGoalForm(): void {
    this.goalForm.reset({
      category: 'fitness',
      priority: 'medium',
      current_value: 0,
      target_value: 1,
      is_public: false,
      enable_reminders: false,
      reminder_frequency: 'weekly',
      icon: '🎯',
    });
  }

  private populateGoalForm(goal: EnhancedGoal): void {
    this.goalForm.patchValue({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      current_value: goal.current_value,
      target_value: goal.target_value,
      unit: goal.unit,
      target_date: goal.target_date.split('T')[0],
      notes: goal.notes,
      icon: goal.icon || '🎯',
      is_public: goal.is_public || false,
      enable_reminders: goal.enable_reminders || false,
      reminder_frequency: goal.reminder_frequency || 'weekly',
    });
  }

  private resetMilestoneForm(): void {
    this.milestoneForm.reset({
      target_value: 1,
      icon: '🎯',
      priority: 'medium',
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string | null {
    const field = form.get(fieldName);
    if (!field || !field.errors || !field.touched) return null;

    const errors = field.errors;
    if (errors['required']) return 'Ce champ est requis';
    if (errors['minlength'])
      return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength'])
      return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['min']) return `Valeur minimum: ${errors['min'].min}`;

    return 'Champ invalide';
  }

  /* =============================================
     UI INTERACTION METHODS
     ============================================= */

  toggleGoalExpansion(goal: EnhancedGoal): void {
    this.expandedGoalId =
      this.expandedGoalId === goal.id ? null : goal.id || null;
  }

  toggleDescription(goal: EnhancedGoal): void {
    goal.showFullDescription = !goal.showFullDescription;
  }

  changeViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.saveViewModeToStorage();
  }

  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
  }

  focusSearchInput(): void {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  /* =============================================
     DATA IMPORT/EXPORT
     ============================================= */

  exportGoals(): void {
    if (this.goals.length === 0) return;

    const exportData = {
      goals: this.goals,
      stats: this.goalStats,
      exportDate: new Date().toISOString(),
      version: '2.0.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `mes-objectifs-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(link.href);
    this.showNotification('📥 Objectifs exportés avec succès !');
  }

  importGoals(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        if (importData.goals && Array.isArray(importData.goals)) {
          const importedGoals = importData.goals.map((goal: Goal) => ({
            ...goal,
            id: Date.now() + Math.random(),
            created_at: new Date().toISOString(),
          }));

          this.goals = [...this.goals, ...this.enhanceGoals(importedGoals)];
          this.calculateStats();
          this.saveGoalsToStorage();
          this.applyFilters();
          this.showNotification(
            `📥 ${importedGoals.length} objectif(s) importé(s) avec succès !`
          );
        } else {
          this.showNotification('Format de fichier invalide');
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showNotification("Erreur lors de l'importation");
      }
    };

    reader.readAsText(file);
    input.value = '';
  }

  /* =============================================
     STORAGE METHODS
     ============================================= */

  private saveGoalsToStorage(): void {
    StorageUtils.setItem('goals_data', this.goals);
  }

  private loadFiltersFromStorage(): void {
    const stored = StorageUtils.getItem<GoalFilters>('filters');
    if (stored) {
      this.filters = { ...this.filters, ...stored };
    }
  }

  private saveFiltersToStorage(): void {
    StorageUtils.setItem('filters', this.filters);
  }

  private saveViewModeToStorage(): void {
    StorageUtils.setItem('view_mode', this.viewMode);
  }

  /* =============================================
     INDIVIDUAL GOAL STATE MANAGEMENT (INSPIRED BY CHALLENGES)
     ============================================= */

  setGoalLoading(goalId: number, isLoading: boolean): void {
    this.goalLoadingStates[goalId] = isLoading;
    this.cdr.detectChanges();
  }

  isGoalLoading(goalId: number): boolean {
    return this.goalLoadingStates[goalId] || false;
  }

  setGoalActionState(goalId: number, action: 'idle' | 'starting' | 'completing' | 'pausing' | 'resetting'): void {
    this.goalActionStates[goalId] = action;
    this.cdr.detectChanges();
  }

  getGoalActionState(goalId: number): 'idle' | 'starting' | 'completing' | 'pausing' | 'resetting' {
    return this.goalActionStates[goalId] || 'idle';
  }

  getGoalActionLabel(goalId: number, defaultLabel: string): string {
    const actionState = this.getGoalActionState(goalId);
    switch (actionState) {
      case 'starting': return 'Démarrage...';
      case 'completing': return 'Finalisation...';
      case 'pausing': return 'Pause...';
      case 'resetting': return 'Remise à zéro...';
      default: return defaultLabel;
    }
  }

  /* =============================================
     UTILITY GETTERS
     ============================================= */

  getCategoryInfo(category: string): CategoryInfo {
    return (
      this.goalCategories.find((c) => c.value === category) ||
      this.goalCategories[0]
    );
  }

  getPriorityInfo(priority: string): PriorityInfo {
    return (
      this.priorityLevels.find((p) => p.value === priority) ||
      this.priorityLevels[1]
    );
  }

  getStatusColor(status: string): string {
    return (
      this.statusConfig[status as keyof typeof this.statusConfig]?.color ||
      '#6b7280'
    );
  }

  getStatusLabel(status: string): string {
    return (
      this.statusConfig[status as keyof typeof this.statusConfig]?.label ||
      status
    );
  }

  getStatusIcon(status: string): string {
    return (
      this.statusConfig[status as keyof typeof this.statusConfig]?.icon || '❓'
    );
  }

  formatDate(date: string | Date): string {
    return DateUtils.formatDate(date);
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '➡️';
    }
  }

  getActiveGoalsCount(): number {
    return this.goalStats.active;
  }

  getCompletedGoalsCount(): number {
    return this.goalStats.completed;
  }

  getAverageProgress(): number {
    return this.goalStats.averageProgress;
  }

  getMotivationScore(): number {
    return this.goalStats.motivationScore;
  }

  /* =============================================
     AUTHENTICATION HELPERS
     ============================================= */

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  canModifyGoals(): boolean {
    return this.isAuthenticated;
  }

  navigateToLogin(): void {
    // Navigate to login page
    window.location.href = '/login';
  }

  /* =============================================
     NOTIFICATION SYSTEM
     ============================================= */

  private showNotification(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.showSuccessMessage = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  /* =============================================
     TRACK BY FUNCTIONS
     ============================================= */

  trackByGoal(index: number, goal: EnhancedGoal): number {
    return goal.id || index;
  }

  trackByCategory(index: number, category: CategoryInfo): string {
    return category.value;
  }

  trackByMilestone(index: number, milestone: Milestone): number {
    return milestone.id;
  }
}

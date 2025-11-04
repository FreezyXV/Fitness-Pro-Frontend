// src/app/services/nutrition.service.ts - VERSION CORRIGÉE
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  throwError,
  of,
  timer,
  fromEvent,
  merge,
} from 'rxjs';
import {
  map,
  catchError,
  tap,
  timeout,
  shareReplay,
  debounceTime,
  distinctUntilChanged,
  retry,
  switchMap,
} from 'rxjs/operators';
import {
  Food,
  CustomDiet,
  PlannedMeal,
  DietaryRestriction,
  FoodCategory,
  MealType,
  FOOD_DATABASE,
  PROFESSIONAL_DIETS,
  MEAL_TEMPLATES,
  FoodDatabaseService,
} from '@features/nutrition/food-database';

// ===== INTERFACES POUR LE SERVICE =====
interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  fiber: number;
  sodium: number;
  potassium: number;
  vitaminC: number;
  caloriesBurned?: number;
}

interface MealEntry {
  id: number;
  userId: number;
  foodId: string;
  food?: Food;
  quantity: number;
  mealType: string;
  date: string;
  timestamp: Date;
  calculatedNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium?: number;
    potassium?: number;
    vitaminC?: number;
  };
}

interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalWater: number;
  totalSodium?: number;
  totalPotassium?: number;
  totalVitaminC?: number;
  meals: MealEntry[];
  goals: NutritionGoals;
  completionPercentage: number;
}

interface NutritionInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'achievement' | 'tip';
  category: 'macros' | 'hydration' | 'timing' | 'micronutrients' | 'quality';
  title: string;
  message: string;
  actionable?: string;
  priority: 'low' | 'medium' | 'high';
  scientificBasis?: string;
  isPersonalized: boolean;
  icon?: string;
  timestamp: Date;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  unit: string;
  reward: number;
  status: 'active' | 'completed' | 'expired';
  expiresAt: Date;
  category: 'hydration' | 'macros' | 'quality' | 'consistency';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  category: 'hydration' | 'nutrition' | 'consistency' | 'quality' | 'goals';
  xpReward: number;
}

interface UserProgress {
  level: number;
  xp: number;
  nextLevelXP: number;
  totalPoints: number;
  streak: number;
  badges: string[];
  achievements: Achievement[];
  challenges: Challenge[];
}

interface WorkoutContext {
  hasWorkoutToday: boolean;
  workoutType: string;
  workoutDuration: number;
  estimatedCaloriesBurned: number;
  workoutIntensity: 'light' | 'moderate' | 'intense';
  timeUntilWorkout?: number;
  timeSinceWorkout?: number;
}

interface SearchFilters {
  category?: FoodCategory | null;
  restrictions?: DietaryRestriction[];
  maxCalories?: number | null;
  minProtein?: number | null;
  maxGlycemicIndex?: number | null;
  excludeAllergens?: string[];
  verified?: boolean;
  highProtein?: boolean;
}

export interface UserProfile {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: string;
  goals: string[];
  restrictions: DietaryRestriction[];
  preferences: string[];
  currentCalorieIntake?: number;
  avgProteinIntake?: number;
  trainingDays?: number;
  trainingIntensity?: 'light' | 'moderate' | 'intense';
}

export interface DietPreferencesPayload {
  goals: string[];
  restrictions: DietaryRestriction[];
  activity_level: string;
  target_calories: number;
  preferred_difficulty: 'easy' | 'moderate' | 'hard';
}

interface NutritionAnalytics {
  event: string;
  timestamp: Date;
  data: any;
  userId?: string;
  sessionId: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

@Injectable({
  providedIn: 'root',
})
export class NutritionService {
  private readonly API_BASE_URL = 'http://localhost:8000/api/nutrition';
  private readonly sessionId = this.generateSessionId();

  // ===== SUBJECTS ET OBSERVABLES =====
  private dailyNutritionSubject = new BehaviorSubject<DailyNutrition | null>(
    null
  );
  public dailyNutrition$ = this.dailyNutritionSubject.asObservable();

  private nutritionGoalsSubject = new BehaviorSubject<NutritionGoals | null>(
    null
  );
  public nutritionGoals$ = this.nutritionGoalsSubject.asObservable();

  private insightsSubject = new BehaviorSubject<NutritionInsight[]>([]);
  public insights$ = this.insightsSubject.asObservable();

  private userProgressSubject = new BehaviorSubject<UserProgress | null>(null);
  public userProgress$ = this.userProgressSubject.asObservable();

  private workoutContextSubject = new BehaviorSubject<WorkoutContext | null>(
    null
  );
  public workoutContext$ = this.workoutContextSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // ===== CACHE INTELLIGENT =====
  private intelligentCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes
  private readonly LONG_TTL = 3600000; // 1 heure
  private readonly SHORT_TTL = 60000; // 1 minute

  // ===== ANALYTICS ET OFFLINE =====
  private analyticsBuffer: NutritionAnalytics[] = [];
  private readonly ANALYTICS_BUFFER_SIZE = 50;

  private isOnline$ = merge(
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(distinctUntilChanged(), shareReplay(1));

  private offlineQueue: Array<{ method: string; url: string; data?: any }> = [];

  constructor(private http: HttpClient) {
    this.initializeService();
    this.setupOfflineSupport();
    this.startPeriodicTasks();
  }

  // ===== INITIALISATION =====
  private initializeService(): void {
    this.loadInitialData();
    this.setupRealtimeUpdates();
  }

  private loadInitialData(): void {
    this.setLoading(true);

    Promise.all([
      this.loadDefaultGoals(),
      this.loadTodayNutrition(),
      this.loadUserProgress(),
      this.loadWorkoutContext(),
    ])
      .then(() => {
        this.setLoading(false);
        this.generatePersonalizedInsights();
      })
      .catch((error) => {
        console.error('Erreur initialisation:', error);
        this.setError("Erreur lors de l'initialisation des données");
        this.setLoading(false);
      });
  }

  private setupRealtimeUpdates(): void {
    timer(0, 300000).subscribe(() => {
      if (this.isPageVisible()) {
        this.refreshCurrentData();
      }
    });
  }

  private setupOfflineSupport(): void {
    this.isOnline$.subscribe((isOnline) => {
      if (isOnline && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });
  }

  private startPeriodicTasks(): void {
    timer(0, 3600000).subscribe(() => {
      this.cleanExpiredCache();
    });

    timer(0, 30000).subscribe(() => {
      this.flushAnalytics();
    });
  }

  // ===== MÉTHODES UTILITAIRES =====
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isPageVisible(): boolean {
    return !document.hidden;
  }

  // ===== CACHE =====
  private setCache<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.intelligentCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.intelligentCache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.intelligentCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.intelligentCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.intelligentCache.delete(key);
      }
    }
  }

  // ===== RECHERCHE D'ALIMENTS - CORRECTION DES ERREURS UNDEFINED =====
  searchFoods(
    query: string,
    limit: number = 20,
    filters?: SearchFilters
  ): Observable<Food[]> {
    if (query.length < 2) {
      return of([]);
    }

    const cacheKey = `search_${query}_${limit}_${JSON.stringify(
      filters || {}
    )}`;
    const cached = this.getCache<Food[]>(cacheKey);

    if (cached) {
      this.trackAnalytics('food_search_cache_hit', { query, limit });
      return of(cached);
    }

    // Utiliser la base de données locale d'abord
    return this.getLocalFoodsDatabase(query, limit, filters).pipe(
      tap((foods) => {
        this.setCache(cacheKey, foods, this.DEFAULT_TTL);
        this.trackAnalytics('food_search_success', {
          query,
          resultsCount: foods.length,
          filters,
        });
      }),
      catchError((error) => {
        console.warn('Erreur recherche aliments:', error);
        this.trackAnalytics('food_search_error', {
          query,
          error: error.message,
        });
        return of([]);
      }),
      shareReplay(1)
    );
  }

  searchFoodsAdvanced(
    query: string,
    filters?: SearchFilters
  ): Observable<Food[]> {
    return this.searchFoods(query, 50, filters);
  }

  getFoodsByCategory(category: FoodCategory): Observable<Food[]> {
    const cacheKey = `category_${category}`;
    const cached = this.getCache<Food[]>(cacheKey);

    if (cached) {
      return of(cached);
    }

    const foods = FoodDatabaseService.getFoodsByCategory(category);
    this.setCache(cacheKey, foods, this.LONG_TTL);

    return of(foods);
  }

  suggestSimilarFoods(
    foodId: string,
    restrictions: DietaryRestriction[] = []
  ): Observable<Food[]> {
    const alternatives = FoodDatabaseService.suggestAlternatives(
      foodId,
      restrictions
    );
    return of(alternatives);
  }

  // ===== GESTION DES REPAS =====
  addMealEntry(
    foodId: string,
    quantity: number,
    mealType: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Observable<MealEntry> {
    const food = FoodDatabaseService.getFoodById(foodId);
    if (!food) {
      return throwError(() => new Error('Aliment non trouvé'));
    }

    const nutrition = FoodDatabaseService.calculateNutritionalValues(
      foodId,
      quantity
    );
    if (!nutrition) {
      return throwError(() => new Error('Erreur calcul nutritionnel'));
    }

    const entry: MealEntry = {
      id: Date.now(),
      userId: 1,
      foodId,
      food,
      quantity,
      mealType,
      date,
      timestamp: new Date(),
      calculatedNutrition: {
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        sodium: nutrition.sodium || 0,
        potassium: nutrition.potassium || 0,
        vitaminC: nutrition.vitaminC || 0,
      },
    };

    this.trackAnalytics('meal_entry_added', {
      foodId,
      quantity,
      mealType,
      date,
    });

    // Simuler l'ajout et mettre à jour la nutrition quotidienne
    this.updateDailyNutritionWithEntry(entry);
    this.generatePersonalizedInsights();

    return of(entry);
  }

  removeMealEntry(entryId: number, date: string): Observable<void> {
    this.trackAnalytics('meal_entry_removed', { entryId, date });

    // Simuler la suppression
    this.invalidateNutritionCache(date);
    this.loadDayNutrition(date);
    this.generatePersonalizedInsights();

    return of();
  }

  private updateDailyNutritionWithEntry(entry: MealEntry): void {
    const currentNutrition = this.dailyNutritionSubject.value;
    if (!currentNutrition) return;

    const updatedNutrition: DailyNutrition = {
      ...currentNutrition,
      totalCalories:
        currentNutrition.totalCalories + entry.calculatedNutrition.calories,
      totalProtein:
        currentNutrition.totalProtein + entry.calculatedNutrition.protein,
      totalCarbs: currentNutrition.totalCarbs + entry.calculatedNutrition.carbs,
      totalFat: currentNutrition.totalFat + entry.calculatedNutrition.fat,
      totalFiber: currentNutrition.totalFiber + entry.calculatedNutrition.fiber,
      meals: [...currentNutrition.meals, entry],
    };

    updatedNutrition.completionPercentage =
      this.calculateCompletionPercentage(updatedNutrition);

    this.dailyNutritionSubject.next(updatedNutrition);
    this.setCache(
      `nutrition_${entry.date}`,
      updatedNutrition,
      this.DEFAULT_TTL
    );
  }

  // ===== GAMIFICATION ET PROGRESSION =====
  private loadUserProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      const cached = this.getCache<UserProgress>('user_progress');
      if (cached) {
        this.userProgressSubject.next(cached);
        resolve();
        return;
      }

      const defaultProgress = this.getDefaultUserProgress();
      this.setCache('user_progress', defaultProgress, this.LONG_TTL);
      this.userProgressSubject.next(defaultProgress);
      resolve();
    });
  }

  addXP(amount: number, source: string): Observable<UserProgress> {
    this.trackAnalytics('xp_gained', { amount, source });

    const currentProgress = this.userProgressSubject.value;
    if (!currentProgress) {
      return throwError(() => new Error('Progression non initialisée'));
    }

    const updatedProgress: UserProgress = {
      ...currentProgress,
      xp: currentProgress.xp + amount,
      totalPoints: currentProgress.totalPoints + amount,
    };

    // Vérifier level up
    if (updatedProgress.xp >= updatedProgress.nextLevelXP) {
      updatedProgress.level++;
      updatedProgress.xp -= updatedProgress.nextLevelXP;
      updatedProgress.nextLevelXP = Math.round(
        updatedProgress.nextLevelXP * 1.2
      );

      this.trackAnalytics('level_up', {
        newLevel: updatedProgress.level,
        totalPoints: updatedProgress.totalPoints,
      });
    }

    this.setCache('user_progress', updatedProgress, this.LONG_TTL);
    this.userProgressSubject.next(updatedProgress);

    return of(updatedProgress);
  }

  updateWaterIntake(amount: number): void {
    const currentNutrition = this.dailyNutritionSubject.value;
    if (!currentNutrition) return;

    const updatedNutrition = {
      ...currentNutrition,
      totalWater: currentNutrition.totalWater + amount,
    };

    this.dailyNutritionSubject.next(updatedNutrition);

    // Mettre à jour les défis d'hydratation
    const currentProgress = this.userProgressSubject.value;
    if (currentProgress) {
      const updatedChallenges = currentProgress.challenges.map((challenge) => {
        if (challenge.category === 'hydration') {
          challenge.current = updatedNutrition.totalWater;

          if (
            challenge.current >= challenge.target &&
            challenge.status === 'active'
          ) {
            challenge.status = 'completed';
            this.addXP(
              challenge.reward,
              `challenge_${challenge.id}`
            ).subscribe();
          }
        }
        return challenge;
      });

      this.userProgressSubject.next({
        ...currentProgress,
        challenges: updatedChallenges,
      });
    }

    this.trackAnalytics('water_added', {
      amount,
      total: updatedNutrition.totalWater,
    });
  }

  // ===== CONTEXTE D'ENTRAÎNEMENT =====
  private loadWorkoutContext(): Promise<void> {
    return new Promise((resolve) => {
      const now = new Date();
      const hour = now.getHours();

      const workoutHour = 18;
      const timeUntilWorkout = workoutHour - hour;
      const timeSinceWorkout = hour - workoutHour;

      const context: WorkoutContext = {
        hasWorkoutToday: true,
        workoutType: 'HIIT + Musculation',
        workoutDuration: 60,
        estimatedCaloriesBurned: 450,
        workoutIntensity: 'intense',
        timeUntilWorkout: timeUntilWorkout > 0 ? timeUntilWorkout : undefined,
        timeSinceWorkout:
          timeSinceWorkout > 0 && timeSinceWorkout < 4
            ? timeSinceWorkout
            : undefined,
      };

      this.workoutContextSubject.next(context);
      resolve();
    });
  }

  // ===== INSIGHTS PERSONNALISÉS =====
  generatePersonalizedInsights(): void {
    const currentNutrition = this.dailyNutritionSubject.value;
    const goals = this.nutritionGoalsSubject.value;
    const workoutContext = this.workoutContextSubject.value;

    if (!currentNutrition || !goals) return;

    const insights: NutritionInsight[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Insights basés sur l'hydratation
    this.generateHydrationInsights(insights, currentNutrition, goals, hour);

    // Insights basés sur les macronutriments
    this.generateMacroInsights(insights, currentNutrition, goals, hour);

    // Insights basés sur l'entraînement
    if (workoutContext) {
      this.generateWorkoutInsights(
        insights,
        workoutContext,
        currentNutrition,
        goals
      );
    }

    // Trier par priorité et limiter
    insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.insightsSubject.next(insights.slice(0, 5));
    this.trackAnalytics('insights_generated', { count: insights.length });
  }

  private generateHydrationInsights(
    insights: NutritionInsight[],
    nutrition: DailyNutrition,
    goals: NutritionGoals,
    hour: number
  ): void {
    const hydrationPercentage = (nutrition.totalWater / goals.water) * 100;

    if (hydrationPercentage < 60 && hour > 14) {
      insights.push({
        id: `hydration_${Date.now()}`,
        type: hydrationPercentage < 30 ? 'warning' : 'suggestion',
        category: 'hydration',
        title:
          hydrationPercentage < 30
            ? 'Hydratation critique'
            : "Boost d'hydratation",
        message: `Vous n'avez bu que ${hydrationPercentage.toFixed(
          0
        )}% de votre objectif`,
        actionable: `Buvez ${(goals.water - nutrition.totalWater).toFixed(
          1
        )}L supplémentaires`,
        priority: hydrationPercentage < 30 ? 'high' : 'medium',
        scientificBasis:
          'La déshydratation de 2% réduit les performances de 10-15%',
        isPersonalized: true,
        icon: hydrationPercentage < 30 ? '🚨' : '💧',
        timestamp: new Date(),
      });
    }
  }

  private generateMacroInsights(
    insights: NutritionInsight[],
    nutrition: DailyNutrition,
    goals: NutritionGoals,
    hour: number
  ): void {
    const proteinPercentage = (nutrition.totalProtein / goals.protein) * 100;

    if (proteinPercentage < 70 && hour > 18) {
      insights.push({
        id: `protein_${Date.now()}`,
        type: 'suggestion',
        category: 'macros',
        title: 'Apport protéique à compléter',
        message: 'Vos protéines sont encore faibles pour la journée',
        actionable: `Ajoutez ${(goals.protein - nutrition.totalProtein).toFixed(
          0
        )}g de protéines`,
        priority: 'medium',
        scientificBasis:
          'Répartition optimale des protéines sur la journée pour la synthèse musculaire',
        isPersonalized: true,
        icon: '💪',
        timestamp: new Date(),
      });
    }
  }

  private generateWorkoutInsights(
    insights: NutritionInsight[],
    workout: WorkoutContext,
    nutrition: DailyNutrition,
    goals: NutritionGoals
  ): void {
    if (
      workout.timeUntilWorkout &&
      workout.timeUntilWorkout <= 2 &&
      workout.timeUntilWorkout > 0
    ) {
      insights.push({
        id: `pre_workout_${Date.now()}`,
        type: 'tip',
        category: 'timing',
        title: 'Préparation pré-entraînement',
        message: `Entraînement ${workout.workoutType} dans ${workout.timeUntilWorkout}h`,
        actionable: "Consommez 30-60g de glucides et 500ml d'eau",
        priority: 'high',
        scientificBasis:
          "Les glucides pré-exercice améliorent l'endurance de 15-20%",
        isPersonalized: true,
        icon: '⚡',
        timestamp: new Date(),
      });
    }
  }

  // ===== OBJECTIFS NUTRITIONNELS =====
  updateNutritionGoals(
    goals: Partial<NutritionGoals>
  ): Observable<NutritionGoals> {
    this.trackAnalytics('goals_updated', goals);

    const currentGoals = this.nutritionGoalsSubject.value;
    if (!currentGoals) {
      return throwError(() => new Error('Objectifs non initialisés'));
    }

    const updatedGoals = { ...currentGoals, ...goals };
    this.nutritionGoalsSubject.next(updatedGoals);
    this.setCache('nutrition_goals', updatedGoals, this.LONG_TTL);
    this.generatePersonalizedInsights();

    return of(updatedGoals);
  }

  // ===== DONNÉES JOURNALIÈRES =====
  loadDayNutrition(date: string): void {
    const cached = this.getCache<DailyNutrition>(`nutrition_${date}`);
    if (cached) {
      this.dailyNutritionSubject.next(cached);
      return;
    }

    this.setLoading(true);

    const defaultNutrition = this.getDefaultDailyNutrition(date);
    this.setCache(`nutrition_${date}`, defaultNutrition, this.DEFAULT_TTL);
    this.dailyNutritionSubject.next(defaultNutrition);
    this.setLoading(false);
    this.generatePersonalizedInsights();
  }

  loadTodayNutrition(): void {
    const today = new Date().toISOString().split('T')[0];
    this.loadDayNutrition(today);
  }

  private refreshCurrentData(): void {
    const currentNutrition = this.dailyNutritionSubject.value;
    if (currentNutrition) {
      this.invalidateNutritionCache(currentNutrition.date);
      this.loadDayNutrition(currentNutrition.date);
    }
  }

  private invalidateNutritionCache(date: string): void {
    this.intelligentCache.delete(`nutrition_${date}`);
  }

  private calculateCompletionPercentage(nutrition: DailyNutrition): number {
    const goals = nutrition.goals;
    const caloriePercent = Math.min(
      (nutrition.totalCalories / goals.calories) * 100,
      100
    );
    const proteinPercent = Math.min(
      (nutrition.totalProtein / goals.protein) * 100,
      100
    );
    const waterPercent = Math.min(
      (nutrition.totalWater / goals.water) * 100,
      100
    );

    return Math.round((caloriePercent + proteinPercent + waterPercent) / 3);
  }

  // ===== RÉGIMES ET TEMPLATES =====
  getAllProfessionalDiets(): Observable<CustomDiet[]> {
    return of(PROFESSIONAL_DIETS);
  }

  getMealTemplates(): Observable<PlannedMeal[]> {
    return of(MEAL_TEMPLATES);
  }

  createCustomDiet(dietForm: any): Observable<CustomDiet> {
    const diet: CustomDiet = {
      id: `custom_${Date.now()}`,
      name: dietForm.name,
      description: dietForm.description,
      calorieTarget: dietForm.calorieTarget,
      macroDistribution: {
        carbsPercentage: dietForm.carbsPercentage,
        proteinPercentage: dietForm.proteinPercentage,
        fatPercentage: dietForm.fatPercentage,
        carbs: Math.round(
          (dietForm.calorieTarget * dietForm.carbsPercentage) / 100 / 4
        ),
        protein: Math.round(
          (dietForm.calorieTarget * dietForm.proteinPercentage) / 100 / 4
        ),
        fat: Math.round(
          (dietForm.calorieTarget * dietForm.fatPercentage) / 100 / 9
        ),
      },
      restrictions: dietForm.restrictions,
      objectives: dietForm.objectives,
      difficulty: dietForm.difficulty,
      duration: dietForm.duration,
      mealPlan: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        macroBreakdown: {
          carbsPercentage: dietForm.carbsPercentage,
          proteinPercentage: dietForm.proteinPercentage,
          fatPercentage: dietForm.fatPercentage,
          carbs: Math.round(
            (dietForm.calorieTarget * dietForm.carbsPercentage) / 100 / 4
          ),
          protein: Math.round(
            (dietForm.calorieTarget * dietForm.proteinPercentage) / 100 / 4
          ),
          fat: Math.round(
            (dietForm.calorieTarget * dietForm.fatPercentage) / 100 / 9
          ),
        },
      },
      tags: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return of(diet);
  }

  generatePersonalizedDiet(
    userProfile: DietPreferencesPayload
  ): Observable<CustomDiet> {
    return this.http
      .post<CustomDiet>(`${this.API_BASE_URL}/diet/generate`, userProfile)
      .pipe(
        tap((diet) =>
          this.trackAnalytics('personalized_diet_generated', {
            dietId: diet.id,
            userProfile: userProfile,
          })
        ),
        catchError(this.handleError)
      );
  }

  // ===== ANALYTICS =====
  trackAnalytics(event: string, data: any = {}): void {
    const analytics: NutritionAnalytics = {
      event,
      timestamp: new Date(),
      data,
      sessionId: this.sessionId,
    };

    this.analyticsBuffer.push(analytics);

    if (this.analyticsBuffer.length >= this.ANALYTICS_BUFFER_SIZE) {
      this.flushAnalytics();
    }
  }

  private flushAnalytics(): void {
    if (this.analyticsBuffer.length === 0) return;

    const analyticsToSend = [...this.analyticsBuffer];
    this.analyticsBuffer = [];

    // En production, envoyer au serveur
    console.log('Analytics flushed:', analyticsToSend);
  }

  // ===== SUPPORT OFFLINE =====
  private handleOfflineOperation(
    method: string,
    url: string,
    data?: any
  ): void {
    this.offlineQueue.push({ method, url, data });
  }

  private processOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;

    // Traiter la queue offline
    console.log('Processing offline queue:', this.offlineQueue);
    this.offlineQueue = [];
  }

  // ===== BASE DE DONNÉES LOCALE - CORRECTION DES ERREURS UNDEFINED =====

  getFoodDatabase(): Observable<Food[]> {
    return of(FOOD_DATABASE);
  }

  getProfessionalDiets(): Observable<CustomDiet[]> {
    return of(PROFESSIONAL_DIETS);
  }

  private getLocalFoodsDatabase(
    query: string,
    limit: number,
    filters?: SearchFilters
  ): Observable<Food[]> {
    let filtered = FOOD_DATABASE.filter((food: Food) => {
      const searchText =
        `${food.name} ${food.nameEn} ${food.description}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    // Appliquer les filtres avec vérification des undefined
    if (filters) {
      if (filters.category) {
        filtered = filtered.filter(
          (food: Food) => food.category === filters.category
        );
      }
      if (filters.verified) {
        filtered = filtered.filter((food: Food) => food.verified);
      }
      if (filters.highProtein) {
        filtered = filtered.filter((food: Food) => food.protein > 15);
      }
      // CORRECTION: Vérification des undefined avant utilisation
      if (filters.maxCalories !== null && filters.maxCalories !== undefined) {
        filtered = filtered.filter(
          (food: Food) => food.calories <= filters.maxCalories!
        );
      }
      if (filters.minProtein !== null && filters.minProtein !== undefined) {
        filtered = filtered.filter(
          (food: Food) => food.protein >= filters.minProtein!
        );
      }
      if (filters.restrictions && filters.restrictions.length > 0) {
        filtered = filtered.filter((food: Food) =>
          filters.restrictions!.some((restriction: DietaryRestriction) =>
            food.dietaryRestrictions.includes(restriction)
          )
        );
      }
    }

    return of(filtered.slice(0, limit));
  }

  // ===== DONNÉES PAR DÉFAUT =====
  private loadDefaultGoals(): Promise<void> {
    return new Promise((resolve) => {
      const cached = this.getCache<NutritionGoals>('nutrition_goals');
      if (cached) {
        this.nutritionGoalsSubject.next(cached);
        resolve();
        return;
      }

      const defaultGoals: NutritionGoals = {
        calories: 2200,
        protein: 165,
        carbs: 330,
        fat: 81,
        water: 3.5,
        fiber: 25,
        sodium: 2300,
        potassium: 3500,
        vitaminC: 90,
      };

      this.nutritionGoalsSubject.next(defaultGoals);
      this.setCache('nutrition_goals', defaultGoals, this.LONG_TTL);
      resolve();
    });
  }

  private getDefaultUserProgress(): UserProgress {
    return {
      level: 1,
      xp: 0,
      nextLevelXP: 1000,
      totalPoints: 0,
      streak: 0,
      badges: [],
      achievements: [],
      challenges: [
        {
          id: 'daily_water',
          name: 'Hydratation parfaite',
          description: "Boire 3.5L d'eau aujourd'hui",
          type: 'daily',
          target: 3.5,
          current: 0,
          unit: 'L',
          reward: 50,
          status: 'active',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          category: 'hydration',
        },
        {
          id: 'weekly_protein',
          name: 'Protéine Champion',
          description: "Atteindre l'objectif protéine 5 jours cette semaine",
          type: 'weekly',
          target: 5,
          current: 0,
          unit: 'jours',
          reward: 200,
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          category: 'macros',
        },
      ],
    };
  }

  private getDefaultDailyNutrition(date: string): DailyNutrition {
    const goals = this.nutritionGoalsSubject.value;
    return {
      date,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalWater: 0,
      totalSodium: 0,
      totalPotassium: 0,
      totalVitaminC: 0,
      meals: [],
      goals: goals || {
        calories: 2200,
        protein: 165,
        carbs: 330,
        fat: 81,
        water: 3.5,
        fiber: 25,
        sodium: 2300,
        potassium: 3500,
        vitaminC: 90,
      },
      completionPercentage: 0,
    };
  }

  // ===== GESTION DES ERREURS =====
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';

    if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur';
    }

    this.trackAnalytics('service_error', {
      errorMessage,
      status: error.status,
      url: error.url,
    });

    this.setError(errorMessage);
    console.error('Erreur NutritionService:', error);

    return throwError(() => new Error(errorMessage));
  };

  // ===== MÉTHODES PUBLIQUES ADDITIONNELLES =====
  dispose(): void {
    this.cleanExpiredCache();
    this.flushAnalytics();
  }

  getServiceStats(): any {
    return {
      cacheSize: this.intelligentCache.size,
      analyticsBufferSize: this.analyticsBuffer.length,
      offlineQueueSize: this.offlineQueue.length,
      sessionId: this.sessionId,
    };
  }

  forceSyncData(): Observable<boolean> {
    this.processOfflineQueue();
    this.flushAnalytics();
    this.refreshCurrentData();

    return of(true);
  }
}

// src/app/nutrition/nutrition.component.ts - VERSION CORRIGÉE
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from '@app/pipes/filter.pipe';
import { BarcodeScannerComponent } from '@app/shared/components/barcode-scanner/barcode-scanner.component';

import { Subject, BehaviorSubject, timer } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NutritionService, UserProfile, DietPreferencesPayload } from '@app/services/nutrition.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import {
  Food,
  FoodDatabaseService,
  FOOD_DATABASE,
  PROFESSIONAL_DIETS,
  MEAL_TEMPLATES,
  CustomDiet,
  PlannedMeal,
  PlannedFood,
  MealType,
  DietaryRestriction,
  FoodCategory,
  NutritionalValues,
  MacroDistribution,
  MealPlan,
} from './food-database';
// Types already imported above

// ===== INTERFACES COMPOSANT =====
interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  fiber: number;
  sodium: number;
  potassium: number;
  vitaminC: number;
}

interface MacroGoals extends NutritionData {
  caloriesBurned?: number;
}

interface MealTypeConfig {
  key: string;
  label: string;
  icon: string;
  idealTiming: string;
  description: string;
}

interface FoodEntry {
  id: number;
  food: Food;
  quantity: number;
  mealType: string;
  timestamp: Date;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface WorkoutContext {
  hasWorkoutToday: boolean;
  workoutDuration: number;
  estimatedCaloriesBurned: number;
  workoutType: string;
  isPreWorkout: boolean;
  isPostWorkout: boolean;
}

interface NutritionTip {
  id: string;
  icon: string;
  title: string;
  description: string;
  actionable: string;
  scientificBasis: string;
  priority: 'high' | 'medium' | 'low';
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
  status: 'active' | 'completed';
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
}

interface WeeklyStats {
  goalsAchieved: number;
  waterConsumed: number;
  avgProtein: number;
  avgCalories: number;
}

interface UIState {
  isLoading: boolean;
  error: string | null;
  hasInteracted: boolean;
  lastUpdateTime: number;
}

interface NotificationConfig {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  icon?: string;
}

interface DietCreationForm {
  name: string;
  description: string;
  calorieTarget: number;
  carbsPercentage: number;
  proteinPercentage: number;
  fatPercentage: number;
  restrictions: DietaryRestriction[];
  objectives: string[];
  difficulty: 'facile' | 'modéré' | 'difficile';
  duration?: number;
}

interface SearchFilters {
  category: FoodCategory | null;
  restrictions: DietaryRestriction[];
  maxCalories: number | null;
  minProtein: number | null;
  maxGlycemicIndex?: number | null;
  excludeAllergens?: string[];
}

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe, BarcodeScannerComponent, IconComponent],
  templateUrl: './nutrition.component.html',
  styleUrls: ['./nutrition.component.scss'],
})
export class NutritionComponent implements OnInit, OnDestroy {
  // ===== ÉNUMÉRATIONS EXPOSÉES AU TEMPLATE =====
  FoodCategory = FoodCategory;
  DietaryRestriction = DietaryRestriction;
  MealType = MealType;
  Math = Math;

  // ===== PROPRIÉTÉS PRINCIPALES =====
  activeTab = 'dashboard';
  selectedDate = new Date();
  workoutContext!: WorkoutContext;

  // ===== STATE MANAGEMENT RÉACTIF =====
  private uiState = new BehaviorSubject<UIState>({
    isLoading: false,
    error: null,
    hasInteracted: false,
    lastUpdateTime: Date.now(),
  });

  get isLoading(): boolean {
    return this.uiState.value.isLoading;
  }
  get error(): string | null {
    return this.uiState.value.error;
  }
  get hasInteracted(): boolean {
    return this.uiState.value.hasInteracted;
  }

  // ===== DONNÉES NUTRITIONNELLES =====
  dailyNutrition: NutritionData = {
    calories: 1517,
    protein: 76.4,
    carbs: 156.5,
    fat: 41.7,
    water: 2.2,
    fiber: 8.1,
    sodium: 1850,
    potassium: 2100,
    vitaminC: 75,
  };

  dailyGoals: MacroGoals = {
    calories: 2200,
    protein: 165,
    carbs: 330,
    fat: 81,
    water: 3.5,
    fiber: 25,
    sodium: 2300,
    potassium: 3500,
    vitaminC: 90,
    caloriesBurned: 450,
  };

  // ===== TYPES DE REPAS =====
  mealTypes: MealTypeConfig[] = [
    {
      key: 'breakfast',
      label: 'Petit-déjeuner',
      icon: '🌅',
      idealTiming: '6h-9h',
      description: 'Carburant pour démarrer la journée',
    },
    {
      key: 'pre_workout',
      label: 'Pré-entraînement',
      icon: '⚡',
      idealTiming: '30-60min avant',
      description: 'Énergie rapide pour la performance',
    },
    {
      key: 'lunch',
      label: 'Déjeuner',
      icon: '☀️',
      idealTiming: '12h-14h',
      description: 'Repas principal équilibré',
    },
    {
      key: 'post_workout',
      label: 'Post-entraînement',
      icon: '🔋',
      idealTiming: '30min après',
      description: 'Récupération et reconstruction',
    },
    {
      key: 'dinner',
      label: 'Dîner',
      icon: '🌙',
      idealTiming: '18h-20h',
      description: 'Récupération nocturne',
    },
    {
      key: 'snacks',
      label: 'Collations',
      icon: '🍎',
      idealTiming: 'Variable',
      description: "Maintien des niveaux d'énergie",
    },
  ];

  // ===== NOUVELLE BASE DE DONNÉES D'ALIMENTS =====
  foodDatabase: Food[] = FOOD_DATABASE;
  foodCategories = Object.values(FoodCategory);
  selectedFoodCategory: FoodCategory | null = null;

  // ===== RÉGIMES PROFESSIONNELS ET PERSONNALISÉS =====
  professionalDiets: CustomDiet[] = PROFESSIONAL_DIETS;
  customDiets: CustomDiet[] = [];
  selectedDiet: CustomDiet | null = null;
  currentDiet = 'balanced';

  // Création de régime personnalisé
  showCreateDietModal = false;
  dietCreationForm: DietCreationForm = {
    name: '',
    description: '',
    calorieTarget: 2200,
    carbsPercentage: 50,
    proteinPercentage: 25,
    fatPercentage: 25,
    restrictions: [],
    objectives: [],
    difficulty: 'modéré',
    duration: undefined,
  };

  // ===== TEMPLATES DE REPAS =====
  mealTemplates: PlannedMeal[] = MEAL_TEMPLATES;
  selectedMealTemplate: PlannedMeal | null = null;
  showMealTemplatesModal = false;

  // ===== GAMIFICATION AMÉLIORÉE =====
  userLevel = 12;
  userXP = 2450;
  nextLevelXP = 3000;
  totalPoints = 15680;
  weeklyStreak = 5;

  achievements: Achievement[] = [
    {
      id: 'nutrition_master',
      name: 'Maître Nutritionniste',
      description: "Utiliser la base de données d'aliments 50 fois",
      icon: '🧠',
      rarity: 'epic',
      progress: 32,
      maxProgress: 50,
    },
    {
      id: 'diet_creator',
      name: 'Créateur de Régimes',
      description: 'Créer 3 régimes personnalisés',
      icon: '👨‍🍳',
      rarity: 'rare',
      progress: 1,
      maxProgress: 3,
    },
    {
      id: 'recipe_collector',
      name: 'Collectionneur de Recettes',
      description: 'Sauvegarder 25 recettes favorites',
      icon: '📚',
      rarity: 'common',
      progress: 8,
      maxProgress: 25,
    },
  ];

  activeChallenges: Challenge[] = [
    {
      id: 'explore_foods',
      name: 'Explorateur Culinaire',
      description: 'Découvrir 10 nouveaux aliments cette semaine',
      type: 'weekly',
      target: 10,
      current: 3,
      unit: 'aliments',
      reward: 100,
      status: 'active',
    },
  ];

  // ===== CONSEILS PERSONNALISÉS DYNAMIQUES =====
  personalizedTips: NutritionTip[] = [];

  // ===== STATISTIQUES =====
  weeklyStats: WeeklyStats = {
    goalsAchieved: 85,
    waterConsumed: 24.5,
    avgProtein: 125,
    avgCalories: 2150,
  };

  // ===== RECHERCHE ET REPAS OPTIMISÉS =====
  searchTerm = '';
  searchResults: Food[] = [];

  // ===== SCAN DE CODE-BARRES =====
  /** Ouverture du scanner. Le composant gere lui-meme camera et recherche. */
  showScanner = false;

  selectedFood: Food | null = null;
  quantity = 100;
  recentEntries: FoodEntry[] = [];

  // Cache pour la recherche
  private searchCache = new Map<string, Food[]>();
  private searchSubject = new Subject<string>();

  // Filtres de recherche avancés
  searchFilters: SearchFilters = {
    category: null,
    restrictions: [],
    maxCalories: null,
    minProtein: null,
    maxGlycemicIndex: null,
    excludeAllergens: [],
  };
  showAdvancedFilters = false;

  // ===== HYDRATATION =====
  waterAmounts = [0.25, 0.5, 0.75, 1.0];
  customWaterAmount = 0;

  // ===== MODALES ET UI =====
  showAddFoodModal = false;
  showGoalsModal = false;
  showNutrientDetails = false;
  showAchievementModal = false;
  showFoodDetailsModal = false;
  showDietDetailsModal = false;
  showFoodInfoModal = false;
  selectedAchievement: Achievement | null = null;
  selectedFoodDetails: Food | null = null;
  selectedFoodForInfo: Food | null = null;

  // ===== NOTIFICATIONS - MAINTENANT PUBLIC =====
  notifications: NotificationConfig[] = [];

  // ===== ANALYTICS =====
  private performanceMetrics = {
    loadStartTime: 0,
    renderStartTime: 0,
    interactionCount: 0,
    lastInteractionTime: 0,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private nutritionService: NutritionService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeWorkoutContext();
    this.setupSearchDebounce();
    this.setupPerformanceTracking();
  }

  ngOnInit(): void {
    this.performanceMetrics.loadStartTime = performance.now();
    this.loadInitialData();
    this.startRealTimeUpdates();
    this.updatePersonalizedTips();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveUserPreferences();
    this.logPerformanceMetrics();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.saveUserPreferences();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.handleKeyboardShortcuts(event);
  }

  // ===== INITIALISATION AMÉLIORÉE =====
  private initializeWorkoutContext(): void {
    this.workoutContext = {
      hasWorkoutToday: true,
      workoutDuration: 60,
      estimatedCaloriesBurned: 450,
      workoutType: 'HIIT + Musculation',
      isPreWorkout: this.isWithinTimeWindow(2),
      isPostWorkout: this.isWithinTimeWindow(-0.5),
    };
  }

  private isWithinTimeWindow(hours: number): boolean {
    const now = new Date();
    const workoutTime = new Date();
    workoutTime.setHours(18, 0, 0, 0);

    const diff = (now.getTime() - workoutTime.getTime()) / (1000 * 60 * 60);

    if (hours > 0) {
      return diff >= -hours && diff <= 0;
    } else {
      return diff >= 0 && diff <= Math.abs(hours);
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.performAdvancedSearch(searchTerm);
      });
  }

  private setupPerformanceTracking(): void {
    timer(0, 10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.logPerformanceMetrics();
      });
  }

  private setupKeyboardShortcuts(): void {
    // Sera implémenté dans handleKeyboardShortcuts
  }

  private loadInitialData(): void {
    this.updateUIState({ isLoading: true });

    Promise.all([
      this.loadProfessionalDiets(),
      this.loadCustomDiets(),
      this.loadMealTemplates(),
      this.loadUserPreferences(),
      this.loadRecentEntries(),
    ])
      .then(() => {
        this.updateUIState({ isLoading: false });
        this.generatePersonalizedTips();
      })
      .catch((error) => {
        console.error('Erreur lors du chargement:', error);
        this.updateUIState({
          isLoading: false,
          error: 'Erreur lors du chargement des données',
        });
      });
  }

  private startRealTimeUpdates(): void {
    timer(0, 300000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.hasInteracted) {
          this.updatePersonalizedTips();
          this.checkChallengeProgress();
        }
      });
  }

  // ===== GESTION DE LA BASE DE DONNÉES D'ALIMENTS =====

  openScanner(): void {
    this.showScanner = true;
  }

  closeScanner(): void {
    this.showScanner = false;
  }

  /**
   * Produit reconnu par le scanner. On l'indexe pour que addFoodEntry() puisse
   * le retrouver par son id, puis on l'affiche seul en tete de resultats :
   * apres un scan, l'utilisateur attend UN produit, pas une liste.
   */
  onScannedFood(food: Food): void {
    FoodDatabaseService.registerExternalFood(food);
    this.showScanner = false;
    this.searchResults = [food];
    this.selectedFoodForInfo = food;
    this.cdr.markForCheck();
  }

  /** Vrai pour un aliment issu d'OpenFoodFacts (donnee contributive). */
  isCommunityFood(food: Food): boolean {
    return food.source === 'openfoodfacts';
  }

  searchFoods(): void {
    if (this.searchTerm.trim()) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.searchResults = [];
    }
  }

  private performAdvancedSearch(query: string): void {
    this.nutritionService
      .searchFoodsAdvanced(query, this.searchFilters)
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.trackEvent('advanced_food_search', {
            query,
            filters: this.searchFilters,
            resultsCount: results.length,
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur recherche avancée:', error);
          this.searchResults = [];
        },
      });
  }

  selectFoodCategory(category: FoodCategory): void {
    this.selectedFoodCategory = category;
    this.nutritionService.getFoodsByCategory(category).subscribe({
      next: (foods) => {
        this.searchResults = foods;
        this.trackEvent('category_selected', { category });
        this.cdr.detectChanges();
      },
    });
  }

  showFoodDetails(food: Food): void {
    this.selectedFoodDetails = food;
    this.showFoodDetailsModal = true;
    this.trackEvent('food_details_viewed', { foodId: food.id });
  }

  closeFoodDetailsModal(): void {
    this.showFoodDetailsModal = false;
    this.selectedFoodDetails = null;
  }

  openFoodInfoModal(food: Food): void {
    this.selectedFoodForInfo = food;
    this.showFoodInfoModal = true;
    this.trackEvent('food_info_modal_opened', {
      foodId: food.id,
      foodName: food.name,
    });
  }

  closeFoodInfoModal(): void {
    this.showFoodInfoModal = false;
    this.selectedFoodForInfo = null;
  }

  getFoodNutrientList(
    food: Food
  ): Array<{ name: string; value: number; unit: string; category: string }> {
    return [
      // Macronutriments
      {
        name: 'Calories',
        value: food.calories,
        unit: 'kcal',
        category: 'energy',
      },
      { name: 'Protéines', value: food.protein, unit: 'g', category: 'macro' },
      { name: 'Glucides', value: food.carbs, unit: 'g', category: 'macro' },
      { name: 'Lipides', value: food.fat, unit: 'g', category: 'macro' },
      { name: 'Fibres', value: food.fiber || 0, unit: 'g', category: 'macro' },

      // Minéraux
      {
        name: 'Sodium',
        value: food.sodium || 0,
        unit: 'mg',
        category: 'mineral',
      },
      {
        name: 'Potassium',
        value: food.potassium || 0,
        unit: 'mg',
        category: 'mineral',
      },
      {
        name: 'Calcium',
        value: food.calcium || 0,
        unit: 'mg',
        category: 'mineral',
      },
      { name: 'Fer', value: food.iron || 0, unit: 'mg', category: 'mineral' },
      {
        name: 'Magnésium',
        value: food.magnesium || 0,
        unit: 'mg',
        category: 'mineral',
      },
      { name: 'Zinc', value: food.zinc || 0, unit: 'mg', category: 'mineral' },

      // Vitamines
      {
        name: 'Vitamine C',
        value: food.vitaminC || 0,
        unit: 'mg',
        category: 'vitamin',
      },
      {
        name: 'Vitamine A',
        value: food.vitaminA || 0,
        unit: 'μg',
        category: 'vitamin',
      },
      {
        name: 'Vitamine E',
        value: food.vitaminE || 0,
        unit: 'mg',
        category: 'vitamin',
      },
      {
        name: 'Vitamine K',
        value: food.vitaminK || 0,
        unit: 'μg',
        category: 'vitamin',
      },
      {
        name: 'Folate',
        value: food.folate || 0,
        unit: 'μg',
        category: 'vitamin',
      },
      {
        name: 'Vitamine B6',
        value: food.vitaminB6 || 0,
        unit: 'mg',
        category: 'vitamin',
      },
      {
        name: 'Vitamine B12',
        value: food.vitaminB12 || 0,
        unit: 'μg',
        category: 'vitamin',
      },
    ].filter((nutrient) => nutrient.value > 0);
  }

  /** Renvoie un nom d'icone du jeu de l'application (voir IconName). */
  getNutrientCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      energy: 'bolt',
      macro: 'flame',
      mineral: 'droplet',
      vitamin: 'leaf',
    };
    return icons[category] || 'chart';
  }

  getNutrientCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      energy: 'Énergie',
      macro: 'Macronutriments',
      mineral: 'Minéraux',
      vitamin: 'Vitamines',
    };
    return labels[category] || 'Autres';
  }

  addFoodFromInfoModal(food: Food | null): void {
    if (!food) return;
    this.selectedFood = food;
    this.quantity = 100;
    this.closeFoodInfoModal();
    this.openAddFoodModal();
  }

  // Nutrient categories for template iteration
  nutrientCategories = ['energy', 'macro', 'mineral', 'vitamin'];

  getFilteredNutrients(
    category: string
  ): Array<{ name: string; value: number; unit: string; category: string }> {
    if (!this.selectedFoodForInfo) return [];
    return this.getFoodNutrientList(this.selectedFoodForInfo).filter(
      (n) => n.category === category
    );
  }

  isMainNutrient(name: string): boolean {
    return ['Calories', 'Protéines', 'Glucides', 'Lipides'].includes(name);
  }

  getNutrientClass(name: string): string {
    const classes: { [key: string]: string } = {
      Calories: 'calories',
      Protéines: 'protéines',
      Glucides: 'glucides',
      Lipides: 'lipides',
    };
    return classes[name] || '';
  }

  getNutrientPercentage(value: number): number {
    return Math.min((value / 50) * 100, 100);
  }

  hasAllergens(): boolean {
    return !!(
      this.selectedFoodForInfo?.allergens &&
      this.selectedFoodForInfo.allergens.length > 0
    );
  }

  getAllergens(): string[] {
    return this.selectedFoodForInfo?.allergens || [];
  }

  hasPreparationTips(): boolean {
    return !!(
      this.selectedFoodForInfo?.preparationTips &&
      this.selectedFoodForInfo.preparationTips.length > 0
    );
  }

  getPreparationTips(): string[] {
    return this.selectedFoodForInfo?.preparationTips || [];
  }

  suggestAlternatives(food: Food | null): void {
    if (!food) return;
    this.nutritionService
      .suggestSimilarFoods(food.id, this.searchFilters.restrictions)
      .subscribe({
        next: (alternatives) => {
          this.showNotification({
            message: `${alternatives.length} alternatives trouvées pour ${food.name}`,
            type: 'info',
            duration: 3000,
          });
          // Afficher les alternatives dans la recherche
          this.searchResults = alternatives;
        },
      });
  }

  // ===== GESTION DES RÉGIMES AVANCÉE =====

  private loadProfessionalDiets(): Promise<void> {
    return new Promise((resolve) => {
      this.nutritionService.getAllProfessionalDiets().subscribe({
        next: (diets) => {
          this.professionalDiets = diets;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  private loadCustomDiets(): Promise<void> {
    return new Promise((resolve) => {
      // Charger les régimes personnalisés de l'utilisateur
      // Pour la démo, on utilise un tableau vide
      this.customDiets = [];
      resolve();
    });
  }

  openCreateDietModal(): void {
    this.showCreateDietModal = true;
    this.resetDietCreationForm();
    this.trackEvent('create_diet_modal_opened');
  }

  closeCreateDietModal(): void {
    this.showCreateDietModal = false;
  }

  private resetDietCreationForm(): void {
    this.dietCreationForm = {
      name: '',
      description: '',
      calorieTarget: 2200,
      carbsPercentage: 50,
      proteinPercentage: 25,
      fatPercentage: 25,
      restrictions: [],
      objectives: [],
      difficulty: 'modéré',
      duration: undefined,
    };
  }

  adjustMacroPercentages(): void {
    // Assurer que la somme des macros = 100%
    const total =
      this.dietCreationForm.carbsPercentage +
      this.dietCreationForm.proteinPercentage +
      this.dietCreationForm.fatPercentage;

    if (total !== 100) {
      // Ajuster proportionnellement
      const factor = 100 / total;
      this.dietCreationForm.carbsPercentage = Math.round(
        this.dietCreationForm.carbsPercentage * factor
      );
      this.dietCreationForm.proteinPercentage = Math.round(
        this.dietCreationForm.proteinPercentage * factor
      );
      this.dietCreationForm.fatPercentage = Math.round(
        this.dietCreationForm.fatPercentage * factor
      );
    }
  }

  toggleDietaryRestriction(restriction: DietaryRestriction): void {
    const index = this.dietCreationForm.restrictions.indexOf(restriction);
    if (index > -1) {
      this.dietCreationForm.restrictions.splice(index, 1);
    } else {
      this.dietCreationForm.restrictions.push(restriction);
    }
  }

  toggleObjective(objective: string): void {
    const index = this.dietCreationForm.objectives.indexOf(objective);
    if (index > -1) {
      this.dietCreationForm.objectives.splice(index, 1);
    } else {
      this.dietCreationForm.objectives.push(objective);
    }
  }

  createCustomDiet(): void {
    if (!this.validateDietForm()) {
      return;
    }

    this.nutritionService.createCustomDiet(this.dietCreationForm).subscribe({
      next: (diet) => {
        this.customDiets.push(diet);
        this.closeCreateDietModal();
        this.showNotification({
          message: '🎉 Régime personnalisé créé avec succès !',
          type: 'success',
          duration: 4000,
        });
        this.addXP(100);
        this.trackEvent('custom_diet_created', { dietId: diet.id });
      },
      error: (error) => {
        console.error('Erreur création régime:', error);
        this.showNotification({
          message: '❌ Erreur lors de la création du régime',
          type: 'error',
          duration: 3000,
        });
      },
    });
  }

  generatePersonalizedDiet(): void {
    // Collecter le profil utilisateur et les préférences pour le backend
    const preferencesPayload = {
      // Key fields that the backend's NutritionController->validate() method expects in the $request body
      goals: this.dietCreationForm.objectives,
      restrictions: this.dietCreationForm.restrictions,
      activity_level: 'active', // Renamed to snake_case; this should ideally come from user input
      target_calories: this.dietCreationForm.calorieTarget,
      preferred_difficulty: this.mapDifficultyToBackend(
        this.dietCreationForm.difficulty
      ),
      // Add other optional fields from dietCreationForm if needed and mapped to backend's expectations
      // e.g., time_availability: this.dietCreationForm.timeAvailability,
      // If the backend also uses other user profile attributes for its AI, they might need to be added here
      // or the backend logic needs to fetch them from the authenticated user.
    };

    this.nutritionService
      .generatePersonalizedDiet(preferencesPayload as DietPreferencesPayload)
      .subscribe({
        next: (diet) => {
          this.customDiets.push(diet);
          this.selectedDiet = diet; // Set the newly generated diet as selected
          this.showNotification({
            message: '🤖 Régime personnalisé généré par IA !',
            type: 'success',
            duration: 4000,
          });
          this.addXP(150);
          this.trackEvent('ai_diet_generated', { dietId: diet.id });
        },
        error: (error) => {
          console.error('Erreur génération régime IA:', error);
          this.showNotification({
            message: '❌ Erreur lors de la génération automatique',
            type: 'error',
            duration: 3000,
          });
        },
      });
  }

  private mapDifficultyToBackend(
    difficulty: 'facile' | 'modéré' | 'difficile'
  ): 'easy' | 'moderate' | 'hard' {
    switch (difficulty) {
      case 'facile':
        return 'easy';
      case 'modéré':
        return 'moderate';
      case 'difficile':
        return 'hard';
      default:
        return 'moderate'; // Default to moderate if somehow an invalid value is passed
    }
  }

  selectDiet(diet: CustomDiet): void {
    this.selectedDiet = diet;
    this.showDietDetailsModal = true;

    // Feedback visuel immédiat
    this.showNotification({
      message: `📋 Détails du régime "${diet.name}" chargés`,
      type: 'info',
      duration: 2000,
    });

    this.trackEvent('diet_selected', { dietId: diet.id });
  }

  closeDietDetailsModal(): void {
    this.showDietDetailsModal = false;
    this.selectedDiet = null;
  }

  // Suivi du régime actuel
  currentlyFollowedDiet: CustomDiet | null = null;
  dietStartDate: Date | null = null;
  dietDayCount = 0;
  dietScore = 0;
  dietStreak = 0;

  adoptDiet(diet: CustomDiet): void {
    // Appliquer le régime aux objectifs quotidiens
    this.dailyGoals.calories = diet.calorieTarget;
    this.dailyGoals.protein = diet.mealPlan.macroBreakdown.protein;
    this.dailyGoals.carbs = diet.mealPlan.macroBreakdown.carbs;
    this.dailyGoals.fat = diet.mealPlan.macroBreakdown.fat;

    // Initialiser le suivi du régime
    this.currentlyFollowedDiet = diet;
    this.dietStartDate = new Date();
    this.dietDayCount = 1;
    this.dietScore = 0;
    this.dietStreak = 1;

    // Récompenses pour l'adoption d'un régime
    this.addXP(200);
    this.totalPoints += 50;

    this.showNotification({
      message: `✅ Régime "${diet.name}" adopté ! +200 XP`,
      type: 'success',
      duration: 4000,
    });

    this.closeDietDetailsModal();
    this.trackEvent('diet_adopted', { dietId: diet.id });
  }

  stopDiet(): void {
    if (!this.currentlyFollowedDiet) return;

    const daysFollowed = this.dietDayCount;
    const finalScore = this.dietScore;
    const dietName = this.currentlyFollowedDiet.name;

    // Calculer les récompenses finales
    const finalXP = Math.round(daysFollowed * 50 + finalScore * 10);
    const finalPoints = Math.round(daysFollowed * 25 + finalScore * 5);

    this.addXP(finalXP);
    this.totalPoints += finalPoints;

    // Reset
    this.currentlyFollowedDiet = null;
    this.dietStartDate = null;
    this.dietDayCount = 0;
    this.dietScore = 0;
    this.dietStreak = 0;

    this.showNotification({
      message: `🏁 Régime "${dietName}" terminé ! ${daysFollowed} jours • +${finalXP} XP`,
      type: 'info',
      duration: 5000,
    });

    this.trackEvent('diet_stopped', { dietName, daysFollowed, finalScore });
  }

  calculateDietScore(): number {
    if (!this.currentlyFollowedDiet) return 0;

    // Calculer le score basé sur l'adherence aux objectifs
    const calorieScore = Math.max(
      0,
      100 -
        (Math.abs(this.dailyNutrition.calories - this.dailyGoals.calories) /
          this.dailyGoals.calories) *
          100
    );
    const proteinScore = Math.max(
      0,
      100 -
        (Math.abs(this.dailyNutrition.protein - this.dailyGoals.protein) /
          this.dailyGoals.protein) *
          100
    );
    const carbsScore = Math.max(
      0,
      100 -
        (Math.abs(this.dailyNutrition.carbs - this.dailyGoals.carbs) /
          this.dailyGoals.carbs) *
          100
    );
    const fatScore = Math.max(
      0,
      100 -
        (Math.abs(this.dailyNutrition.fat - this.dailyGoals.fat) /
          this.dailyGoals.fat) *
          100
    );

    const dailyScore = Math.round(
      (calorieScore + proteinScore + carbsScore + fatScore) / 4
    );
    this.dietScore = Math.round(
      (this.dietScore * (this.dietDayCount - 1) + dailyScore) /
        this.dietDayCount
    );

    // Bonus streak
    if (dailyScore >= 80) {
      this.dietStreak++;
      this.addXP(this.dietStreak * 5);
    } else {
      this.dietStreak = 0;
    }

    return dailyScore;
  }

  getDietProgressPercentage(): number {
    if (!this.currentlyFollowedDiet || !this.currentlyFollowedDiet.duration)
      return 0;
    return Math.min(
      (this.dietDayCount / this.currentlyFollowedDiet.duration) * 100,
      100
    );
  }

  previewDiet(diet: CustomDiet): void {
    this.showNotification({
      message: `👁️ Aperçu de "${diet.name}" : ${diet.calorieTarget} cal/jour`,
      type: 'info',
      duration: 3000,
    });
    this.trackEvent('diet_previewed', { dietId: diet.id });
  }

  // ===== GESTION DES TEMPLATES DE REPAS =====

  private loadMealTemplates(): Promise<void> {
    return new Promise((resolve) => {
      this.nutritionService.getMealTemplates().subscribe({
        next: (templates) => {
          this.mealTemplates = templates;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  openMealTemplatesModal(): void {
    this.showMealTemplatesModal = true;
    this.trackEvent('meal_templates_modal_opened');
  }

  closeMealTemplatesModal(): void {
    this.showMealTemplatesModal = false;
    this.selectedMealTemplate = null;
  }

  selectMealTemplate(template: PlannedMeal): void {
    this.selectedMealTemplate = template;
    this.trackEvent('meal_template_selected', { templateId: template.id });
  }

  addMealFromTemplate(template: PlannedMeal): void {
    // Convertir le template en entrées de repas
    template.foods.forEach((plannedFood) => {
      const food = FoodDatabaseService.getFoodById(plannedFood.foodId);
      if (food) {
        this.addFoodEntry(food, plannedFood.quantity, template.type.toString());
      }
    });

    this.closeMealTemplatesModal();
    this.showNotification({
      message: `🍽️ Template "${template.name}" ajouté !`,
      type: 'success',
      duration: 3000,
    });
    this.addXP(50);
  }

  customizeMealTemplate(template: PlannedMeal): void {
    // Ouvrir un modal de personnalisation
    this.selectedMealTemplate = template;
    // Pour la démo, on applique directement
    this.addMealFromTemplate(template);
  }

  // ===== FONCTIONS UTILITAIRES ÉTENDUES =====

  private addFoodEntry(food: Food, quantity: number, mealType: string): void {
    const nutrition = FoodDatabaseService.calculateNutritionalValues(
      food.id,
      quantity
    );
    if (!nutrition) return;

    const entry: FoodEntry = {
      id: Date.now(),
      food: food,
      quantity: quantity,
      mealType: mealType,
      timestamp: new Date(),
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      fiber: nutrition.fiber || 0,
    };

    this.recentEntries.unshift(entry);
    this.updateNutritionWithEntry(entry);
    this.markUserInteraction();
  }

  private updateNutritionWithEntry(entry: FoodEntry): void {
    this.dailyNutrition.calories += entry.calories;
    this.dailyNutrition.protein += entry.protein;
    this.dailyNutrition.carbs += entry.carbs;
    this.dailyNutrition.fat += entry.fat;
    this.dailyNutrition.fiber += entry.fiber;
  }

  /**
   * Libelle FR d'une categorie d'aliment.
   *
   * Le gabarit affichait la valeur brute de l'enum (`nuts_seeds`,
   * `oils_fats`, `herbs_spices`) avec un `text-transform: capitalize` CSS qui
   * ne majuscule que la premiere lettre : les categories a underscore
   * s'affichaient « Nuts_seeds » plutot que d'etre traduites.
   */
  getFoodCategoryLabel(category: FoodCategory | null | undefined): string {
    if (!category) return '';
    const labels: Record<FoodCategory, string> = {
      [FoodCategory.PROTEINS]: 'Protéines',
      [FoodCategory.VEGETABLES]: 'Légumes',
      [FoodCategory.FRUITS]: 'Fruits',
      [FoodCategory.GRAINS]: 'Céréales',
      [FoodCategory.DAIRY]: 'Produits laitiers',
      [FoodCategory.NUTS_SEEDS]: 'Noix et graines',
      [FoodCategory.LEGUMES]: 'Légumineuses',
      [FoodCategory.OILS_FATS]: 'Huiles et matières grasses',
      [FoodCategory.BEVERAGES]: 'Boissons',
      [FoodCategory.HERBS_SPICES]: 'Herbes et épices',
      [FoodCategory.SEAFOOD]: 'Fruits de mer',
      [FoodCategory.SUPPLEMENTS]: 'Compléments',
    };
    return labels[category] || category;
  }

  /** Renvoie un nom d'icone du jeu de l'application (voir IconName). */
  getFoodCategoryIcon(category: FoodCategory): string {
    const icons = {
      [FoodCategory.PROTEINS]: 'flame',
      [FoodCategory.VEGETABLES]: 'leaf',
      [FoodCategory.FRUITS]: 'leaf',
      [FoodCategory.GRAINS]: 'leaf',
      [FoodCategory.DAIRY]: 'droplet',
      [FoodCategory.NUTS_SEEDS]: 'leaf',
      [FoodCategory.LEGUMES]: 'leaf',
      [FoodCategory.OILS_FATS]: 'droplet',
      [FoodCategory.BEVERAGES]: 'droplet',
      [FoodCategory.HERBS_SPICES]: 'leaf',
      [FoodCategory.SEAFOOD]: 'droplet',
      [FoodCategory.SUPPLEMENTS]: 'bolt',
    };
    return icons[category] || '🍽️';
  }

  getDietaryRestrictionLabel(restriction: DietaryRestriction): string {
    const labels = {
      [DietaryRestriction.VEGAN]: 'Végétalien',
      [DietaryRestriction.VEGETARIAN]: 'Végétarien',
      [DietaryRestriction.KETO]: 'Cétogène',
      [DietaryRestriction.PALEO]: 'Paléo',
      [DietaryRestriction.GLUTEN_FREE]: 'Sans gluten',
      [DietaryRestriction.LACTOSE_FREE]: 'Sans lactose',
      [DietaryRestriction.LOW_CARB]: 'Pauvre en glucides',
      [DietaryRestriction.LOW_FAT]: 'Pauvre en lipides',
      [DietaryRestriction.HIGH_PROTEIN]: 'Riche en protéines',
    };
    return labels[restriction] || restriction;
  }

  formatNutrientValue(value: number, unit: string): string {
    if (value < 1 && unit !== 'g') {
      return `${(value * 1000).toFixed(0)}m${unit}`;
    }
    return `${value.toFixed(1)}${unit}`;
  }

  // ===== MÉTHODES EXISTANTES MAINTENUES =====

  setActiveTab(tab: string): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.markUserInteraction();
      this.trackEvent('tab_change', { tab });
      this.cdr.detectChanges();
    }
  }

  previousDay(): void {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    this.changeDate(newDate);
  }

  nextDay(): void {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.changeDate(newDate);
  }

  private changeDate(newDate: Date): void {
    this.selectedDate = newDate;
    this.markUserInteraction();
    this.updatePersonalizedTips();
    this.trackEvent('date_change', { date: newDate.toISOString() });
  }

  canNavigateBack(): boolean {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.selectedDate > thirtyDaysAgo;
  }

  canNavigateForward(): boolean {
    const today = new Date();
    return this.selectedDate < today;
  }

  isToday(): boolean {
    const today = new Date();
    return this.selectedDate.toDateString() === today.toDateString();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getProgressPercentage(current: number, goal: number): number {
    if (!goal || goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100);
  }

  getProgressColor(current: number, goal: number): string {
    const percentage = this.getProgressPercentage(current, goal);

    if (percentage < 25) return '#fc8181';
    if (percentage < 50) return '#fdba74';
    if (percentage < 75) return '#eab308';
    if (percentage < 100) return '#6ee7b7';
    return '#67e8f9';
  }

  getRemainingNutrient(current: number, goal: number): number {
    return Math.max(goal - current, 0);
  }

  addWater(amount: number): void {
    const previousWater = this.dailyNutrition.water;
    this.dailyNutrition.water += amount;

    this.addXP(10);
    this.markUserInteraction();

    if (
      this.dailyNutrition.water >= this.dailyGoals.water &&
      previousWater < this.dailyGoals.water
    ) {
      this.showNotification({
        message: '🎉 Objectif hydratation atteint !',
        type: 'success',
        icon: '💧',
      });
      this.checkChallengeCompletion('hydration');
    }

    this.updatePersonalizedTips();
    this.trackEvent('water_added', {
      amount,
      total: this.dailyNutrition.water,
    });
  }

  addCustomWater(): void {
    if (this.customWaterAmount > 0 && this.customWaterAmount <= 2) {
      this.addWater(this.customWaterAmount);
      this.customWaterAmount = 0;
    }
  }

  selectFood(food: Food): void {
    this.selectedFood = food;
    this.searchResults = [];
    this.quantity = 100;
    this.markUserInteraction();
    this.trackEvent('food_selected', { foodId: food.id, foodName: food.name });
  }

  calculateNutrient(
    nutrient: keyof Food,
    quantity: number = this.quantity
  ): number {
    if (!this.selectedFood || !quantity) return 0;
    const value = this.selectedFood[nutrient] as number;
    return Math.round(((value * quantity) / 100) * 10) / 10;
  }

  calculateCalories(): number {
    return this.calculateNutrient('calories');
  }
  calculateProtein(): number {
    return this.calculateNutrient('protein');
  }
  calculateCarbs(): number {
    return this.calculateNutrient('carbs');
  }
  calculateFat(): number {
    return this.calculateNutrient('fat');
  }
  calculateFiber(): number {
    return this.calculateNutrient('fiber');
  }

  getFilteredEntries(mealKey: string): FoodEntry[] {
    return this.recentEntries.filter((entry) => entry.mealType === mealKey);
  }

  // Ajouter une propriété pour stocker le type de repas sélectionné
  selectedMealType: string = 'lunch';

  addFood(mealType?: string): void {
    if (!this.selectedFood || !this.quantity) return;

    // Utiliser le type de repas passé en paramètre ou celui stocké
    const finalMealType = mealType || this.selectedMealType;

    // Utiliser le service pour ajouter l'aliment
    this.nutritionService
      .addMealEntry(this.selectedFood.id, this.quantity, finalMealType)
      .subscribe({
        next: (entry) => {
          // Mettre à jour les données locales
          const localEntry: FoodEntry = {
            id: entry.id,
            food: this.selectedFood!,
            quantity: this.quantity,
            mealType: finalMealType,
            timestamp: new Date(),
            calories: entry.calculatedNutrition.calories,
            protein: entry.calculatedNutrition.protein,
            carbs: entry.calculatedNutrition.carbs,
            fat: entry.calculatedNutrition.fat,
            fiber: entry.calculatedNutrition.fiber,
          };

          this.recentEntries.unshift(localEntry);
          this.updateNutritionWithEntry(localEntry);

          this.addXP(25);
          this.showNotification({
            message: `✅ ${this.selectedFood!.name} ajouté !`,
            type: 'success',
            duration: 2000,
          });

          this.checkChallengeCompletion('calories');
          this.checkAchievementProgress();

          this.closeAddFoodModal();
          this.updatePersonalizedTips();
          this.markUserInteraction();
          this.trackEvent('food_added', {
            foodId: this.selectedFood!.id,
            mealType: finalMealType,
            calories: this.calculateCalories(),
          });
        },
        error: (error) => {
          console.error('Erreur ajout aliment:', error);
          this.showNotification({
            message: "❌ Erreur lors de l'ajout de l'aliment",
            type: 'error',
            duration: 3000,
          });
        },
      });
  }

  removeEntry(entryId: number): void {
    const entryIndex = this.recentEntries.findIndex(
      (entry) => entry.id === entryId
    );
    if (entryIndex > -1) {
      const entry = this.recentEntries[entryIndex];

      this.dailyNutrition.calories -= entry.calories;
      this.dailyNutrition.protein -= entry.protein;
      this.dailyNutrition.carbs -= entry.carbs;
      this.dailyNutrition.fat -= entry.fat;
      this.dailyNutrition.fiber -= entry.fiber;

      this.recentEntries.splice(entryIndex, 1);

      // Appeler le service pour supprimer côté serveur
      const today = new Date().toISOString().split('T')[0];
      this.nutritionService.removeMealEntry(entryId, today).subscribe();

      this.showNotification({
        message: `🗑️ ${entry.food.name} retiré`,
        type: 'info',
        duration: 2000,
      });

      this.updatePersonalizedTips();
      this.markUserInteraction();
      this.trackEvent('food_removed', { foodId: entry.food.id });
    }
  }

  openAddFoodModal(mealType?: string): void {
    this.showAddFoodModal = true;
    if (mealType) {
      this.selectedMealType = mealType;
    }
    this.resetFoodForm();
    this.markUserInteraction();
    this.trackEvent('add_food_modal_opened', {
      mealType: this.selectedMealType,
    });
  }

  closeAddFoodModal(): void {
    this.showAddFoodModal = false;
    this.resetFoodForm();
  }

  resetFoodForm(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.selectedFood = null;
    this.quantity = 100;
  }

  openGoalsModal(): void {
    this.showGoalsModal = true;
    this.markUserInteraction();
    this.trackEvent('goals_modal_opened');
  }

  closeGoalsModal(): void {
    this.showGoalsModal = false;
  }

  saveGoals(): void {
    this.nutritionService.updateNutritionGoals(this.dailyGoals).subscribe({
      next: (updatedGoals) => {
        this.dailyGoals = { ...this.dailyGoals, ...updatedGoals };
        this.closeGoalsModal();
        this.showNotification({
          message: '✅ Objectifs sauvegardés !',
          type: 'success',
          duration: 2000,
        });
        this.trackEvent('goals_saved');
      },
      error: (error) => {
        console.error('Erreur sauvegarde objectifs:', error);
        this.showNotification({
          message: '❌ Erreur lors de la sauvegarde',
          type: 'error',
          duration: 3000,
        });
      },
    });
  }

  // ===== MÉTHODES PRIVÉES UTILITAIRES =====

  private updatePersonalizedTips(): void {
    // Génération de conseils basée sur les données actuelles
    this.personalizedTips = this.calculatePersonalizedTips();
  }

  private calculatePersonalizedTips(): NutritionTip[] {
    const tips: NutritionTip[] = [];

    // Conseil hydratation
    const hydrationPercentage =
      (this.dailyNutrition.water / this.dailyGoals.water) * 100;
    if (hydrationPercentage < 60) {
      tips.push({
        id: 'hydration_tip',
        icon: '💧',
        title: 'Hydratation insuffisante',
        description: `Vous n'avez bu que ${hydrationPercentage.toFixed(
          0
        )}% de votre objectif`,
        actionable: `Buvez ${(
          this.dailyGoals.water - this.dailyNutrition.water
        ).toFixed(1)}L supplémentaires`,
        scientificBasis:
          "L'hydratation optimise les performances physiques et cognitives",
        priority: 'high',
      });
    }

    return tips.slice(0, 3);
  }

  private addXP(amount: number): void {
    this.userXP += amount;
    if (this.userXP >= this.nextLevelXP) {
      this.levelUp();
    }
    this.trackEvent('xp_gained', { amount, total: this.userXP });
  }

  private levelUp(): void {
    this.userLevel++;
    this.userXP -= this.nextLevelXP;
    this.nextLevelXP = Math.round(this.nextLevelXP * 1.2);
    this.totalPoints += 100;

    this.showNotification({
      message: `🎉 Niveau ${this.userLevel} atteint !`,
      type: 'success',
      duration: 5000,
      icon: '⭐',
    });

    this.trackEvent('level_up', {
      newLevel: this.userLevel,
      totalPoints: this.totalPoints,
    });
  }

  private checkChallengeCompletion(_category: string): void {
    // Vérification et completion des défis
  }

  private checkAchievementProgress(): void {
    // Vérification du progrès des achievements
  }

  private checkChallengeProgress(): void {
    // Vérification périodique des défis
  }

  showAchievementUnlocked(achievement: Achievement): void {
    this.selectedAchievement = achievement;
    this.showAchievementModal = true;
    this.markUserInteraction();
  }

  private showNotification(config: NotificationConfig): void {
    this.notifications.push(config);

    const duration = config.duration || 3000;
    setTimeout(() => {
      const index = this.notifications.indexOf(config);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, duration);

    this.cdr.detectChanges();
  }

  private markUserInteraction(): void {
    this.updateUIState({ hasInteracted: true });
    this.performanceMetrics.interactionCount++;
    this.performanceMetrics.lastInteractionTime = performance.now();
  }

  private updateUIState(updates: Partial<UIState>): void {
    const currentState = this.uiState.value;
    const newState = {
      ...currentState,
      ...updates,
      lastUpdateTime: Date.now(),
    };
    this.uiState.next(newState);
  }

  private trackEvent(event: string, data?: any): void {
    console.log(`📊 Event: ${event}`, data);
  }

  private loadUserPreferences(): Promise<void> {
    return Promise.resolve();
  }

  private saveUserPreferences(): void {
    // Sauvegarde des préférences utilisateur
  }

  private loadRecentEntries(): Promise<void> {
    return Promise.resolve();
  }

  private handleKeyboardShortcuts(_event: KeyboardEvent): void {
    // Gestion des raccourcis clavier
  }

  private logPerformanceMetrics(): void {
    // Logging des métriques de performance
  }

  private generatePersonalizedTips(): void {
    this.updatePersonalizedTips();
  }

  // ===== MÉTHODES MANQUANTES POUR LES MODALES ET FONCTIONNALITÉS =====

  toggleSearchRestriction(restriction: DietaryRestriction): void {
    const index = this.searchFilters.restrictions.indexOf(restriction);
    if (index > -1) {
      this.searchFilters.restrictions.splice(index, 1);
    } else {
      this.searchFilters.restrictions.push(restriction);
    }
    this.searchFoods();
  }

  getFoodNameById(foodId: string): string {
    const food = FoodDatabaseService.getFoodById(foodId);
    return food ? food.name : 'Aliment inconnu';
  }

  /** Renvoie un nom d'icone du jeu de l'application (voir IconName). */
  getMealTypeIcon(mealType: MealType | string): string {
    const icons = {
      [MealType.BREAKFAST]: 'utensils',
      [MealType.MORNING_SNACK]: 'leaf',
      [MealType.LUNCH]: 'utensils',
      [MealType.AFTERNOON_SNACK]: 'leaf',
      [MealType.PRE_WORKOUT]: 'bolt',
      [MealType.POST_WORKOUT]: 'flame',
      [MealType.DINNER]: 'utensils',
      [MealType.EVENING_SNACK]: 'moon',
    };
    return icons[mealType as MealType] || 'utensils';
  }

  getMealTypeLabel(mealType: MealType | string): string {
    const labels = {
      [MealType.BREAKFAST]: 'Petit-déjeuner',
      [MealType.MORNING_SNACK]: 'Collation matinale',
      [MealType.LUNCH]: 'Déjeuner',
      [MealType.AFTERNOON_SNACK]: 'Collation après-midi',
      [MealType.PRE_WORKOUT]: 'Pré-entraînement',
      [MealType.POST_WORKOUT]: 'Post-entraînement',
      [MealType.DINNER]: 'Dîner',
      [MealType.EVENING_SNACK]: 'Collation du soir',
    };
    return labels[mealType as MealType] || 'Repas';
  }

  editCustomDiet(diet: CustomDiet): void {
    // Ouvrir le modal de création avec les données du régime existant
    this.dietCreationForm = {
      name: diet.name,
      description: diet.description,
      calorieTarget: diet.calorieTarget,
      carbsPercentage: diet.macroDistribution.carbsPercentage,
      proteinPercentage: diet.macroDistribution.proteinPercentage,
      fatPercentage: diet.macroDistribution.fatPercentage,
      restrictions: [...diet.restrictions],
      objectives: [...diet.objectives],
      difficulty: diet.difficulty,
      duration: diet.duration,
    };

    this.showCreateDietModal = true;
    this.trackEvent('custom_diet_edit_started', { dietId: diet.id });
  }

  shareCustomDiet(diet: CustomDiet): void {
    // Fonctionnalité de partage (pour une vraie application)
    this.showNotification({
      message: `🔗 Lien de partage copié pour "${diet.name}"`,
      type: 'success',
      duration: 3000,
    });

    this.trackEvent('custom_diet_shared', { dietId: diet.id });
  }

  customizeDiet(diet: CustomDiet): void {
    // Ouvrir l'éditeur de régime avec ce régime comme base
    this.editCustomDiet(diet);
    this.closeDietDetailsModal();
  }

  // ===== MÉTHODES UTILITAIRES POUR LES RÉGIMES =====

  validateDietForm(): boolean {
    if (!this.dietCreationForm.name.trim()) {
      this.showNotification({
        message: '❌ Le nom du régime est requis',
        type: 'error',
        duration: 3000,
      });
      return false;
    }

    if (this.dietCreationForm.objectives.length === 0) {
      this.showNotification({
        message: '❌ Sélectionnez au moins un objectif',
        type: 'warning',
        duration: 3000,
      });
      return false;
    }

    const totalMacros =
      this.dietCreationForm.carbsPercentage +
      this.dietCreationForm.proteinPercentage +
      this.dietCreationForm.fatPercentage;

    if (Math.abs(totalMacros - 100) > 1) {
      this.showNotification({
        message: '❌ La somme des macronutriments doit égaler 100%',
        type: 'error',
        duration: 3000,
      });
      return false;
    }

    return true;
  }
}

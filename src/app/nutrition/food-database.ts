// src/app/nutrition/food-database.ts - VERSION COMPLÈTE AVEC BASE DE DONNÉES CORRIGÉE

export interface NutritionalValues {
    calories: number;        // kcal pour 100g
    protein: number;         // g
    carbs: number;          // g
    fat: number;            // g
    fiber: number;          // g
    sugar: number;          // g
    sodium: number;         // mg
    potassium: number;      // mg
    calcium: number;        // mg
    iron: number;           // mg
    magnesium: number;      // mg
    phosphorus: number;     // mg
    zinc: number;           // mg
    vitaminA: number;       // µg
    vitaminC: number;       // mg
    vitaminD: number;       // µg
    vitaminE: number;       // mg
    vitaminK: number;       // µg
    vitaminB1: number;      // mg (thiamine)
    vitaminB2: number;      // mg (riboflavine)
    vitaminB3: number;      // mg (niacine)
    vitaminB6: number;      // mg
    vitaminB12: number;     // µg
    folate: number;         // µg
    omega3: number;         // g
    omega6: number;         // g
    saturatedFat: number;   // g
    monounsaturatedFat: number; // g
    polyunsaturatedFat: number; // g
}

export interface Food extends NutritionalValues {
    id: string;
    name: string;
    nameEn: string;
    category: FoodCategory;
    subcategory: string;
    description: string;
    cookingMethods: CookingMethod[];
    allergens: Allergen[];
    dietaryRestrictions: DietaryRestriction[];
    glycemicIndex: number;
    season: Season[];
    storageMethod: string;
    preparationTips: string[];
    healthBenefits: string[];
    verified: boolean;
    popularityScore: number;
    imageUrl: string;
    alternativeNames: string[];
    origin: string;
    sustainability: SustainabilityLevel;
    priceRange: PriceRange;
}

export enum FoodCategory {
    PROTEINS = 'proteins',
    VEGETABLES = 'vegetables', 
    FRUITS = 'fruits',
    GRAINS = 'grains',
    DAIRY = 'dairy',
    NUTS_SEEDS = 'nuts_seeds',
    LEGUMES = 'legumes',
    OILS_FATS = 'oils_fats',
    BEVERAGES = 'beverages',
    HERBS_SPICES = 'herbs_spices',
    SEAFOOD = 'seafood',
    SUPPLEMENTS = 'supplements'
}

export enum CookingMethod {
    RAW = 'raw',
    GRILLED = 'grilled',
    BAKED = 'baked',
    BOILED = 'boiled',
    STEAMED = 'steamed',
    FRIED = 'fried',
    SAUTEED = 'sauteed',
    ROASTED = 'roasted'
}

export enum Allergen {
    GLUTEN = 'gluten',
    DAIRY = 'dairy',
    EGGS = 'eggs',
    NUTS = 'nuts',
    SOY = 'soy',
    SHELLFISH = 'shellfish',
    FISH = 'fish',
    SESAME = 'sesame'
}

export enum DietaryRestriction {
    VEGAN = 'vegan',
    VEGETARIAN = 'vegetarian',
    KETO = 'keto',
    PALEO = 'paleo',
    GLUTEN_FREE = 'gluten_free',
    LACTOSE_FREE = 'lactose_free',
    LOW_CARB = 'low_carb',
    LOW_FAT = 'low_fat',
    HIGH_PROTEIN = 'high_protein'
}

export enum Season {
    SPRING = 'spring',
    SUMMER = 'summer',
    AUTUMN = 'autumn',
    WINTER = 'winter',
    ALL_YEAR = 'all_year'
}

export enum SustainabilityLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum PriceRange {
    BUDGET = 'budget',
    MODERATE = 'moderate',
    PREMIUM = 'premium'
}

export enum MealType {
    BREAKFAST = 'breakfast',
    MORNING_SNACK = 'morning_snack',
    LUNCH = 'lunch',
    AFTERNOON_SNACK = 'afternoon_snack',
    PRE_WORKOUT = 'pre_workout',
    POST_WORKOUT = 'post_workout',
    DINNER = 'dinner',
    EVENING_SNACK = 'evening_snack'
}

export interface MacroDistribution {
    carbsPercentage: number;
    proteinPercentage: number;
    fatPercentage: number;
    carbs: number;
    protein: number;
    fat: number;
}

export interface PlannedFood {
    foodId: string;
    quantity: number;
    timing?: string;
}

export interface PlannedMeal {
    id: string;
    name: string;
    type: MealType;
    foods: PlannedFood[];
    description: string;
    totalCalories: number;
    preparationTime: number;
    difficulty: 'facile' | 'modéré' | 'difficile';
    tags: string[];
}

export interface MealPlan {
    breakfast: PlannedMeal[];
    lunch: PlannedMeal[];
    dinner: PlannedMeal[];
    snacks: PlannedMeal[];
    macroBreakdown: MacroDistribution;
}

export interface CustomDiet {
    id: string;
    name: string;
    description: string;
    calorieTarget: number;
    macroDistribution: MacroDistribution;
    restrictions: DietaryRestriction[];
    objectives: string[];
    difficulty: 'facile' | 'modéré' | 'difficile';
    duration?: number;
    mealPlan: MealPlan;
    tags: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// BASE DE DONNÉES COMPLÈTE D'ALIMENTS
export const FOOD_DATABASE: Food[] = [
    // ===== PROTÉINES ANIMALES =====
    {
        id: 'chicken_breast',
        name: 'Blanc de poulet',
        nameEn: 'Chicken breast',
        category: FoodCategory.PROTEINS,
        subcategory: 'Volaille',
        description: 'Viande maigre riche en protéines, idéale pour la construction musculaire',
        calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0,
        sodium: 74, potassium: 256, calcium: 15, iron: 0.9, magnesium: 29,
        phosphorus: 220, zinc: 1, vitaminA: 21, vitaminC: 0, vitaminD: 0.2,
        vitaminE: 0.3, vitaminK: 0.4, vitaminB1: 0.07, vitaminB2: 0.12,
        vitaminB3: 13.7, vitaminB6: 0.6, vitaminB12: 0.3, folate: 4,
        omega3: 0.1, omega6: 0.8, saturatedFat: 1, monounsaturatedFat: 1.2, polyunsaturatedFat: 0.8,
        cookingMethods: [CookingMethod.GRILLED, CookingMethod.BAKED, CookingMethod.SAUTEED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur 2-3 jours, congélateur 6 mois',
        preparationTips: ['Mariner pour plus de saveur', 'Cuire à 75°C à cœur', 'Ne pas surcuire pour éviter la sécheresse'],
        healthBenefits: ['Construction musculaire', 'Réparation tissulaire', 'Satiété longue durée'],
        verified: true, popularityScore: 95, imageUrl: 'assets/Aliments/blanc-de-poulet.jpeg',
        alternativeNames: ['Escalope de poulet', 'Filet de poulet'], origin: 'Élevage',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },
    {
        id: 'salmon_atlantic',
        name: 'Saumon atlantique',
        nameEn: 'Atlantic salmon',
        category: FoodCategory.SEAFOOD,
        subcategory: 'Poisson gras',
        description: 'Poisson riche en oméga-3 et protéines de haute qualité',
        calories: 208, protein: 25.4, carbs: 0, fat: 12.4, fiber: 0, sugar: 0,
        sodium: 59, potassium: 363, calcium: 12, iron: 0.8, magnesium: 29,
        phosphorus: 240, zinc: 0.6, vitaminA: 58, vitaminC: 0, vitaminD: 11,
        vitaminE: 3.5, vitaminK: 0.1, vitaminB1: 0.2, vitaminB2: 0.4,
        vitaminB3: 8.5, vitaminB6: 0.8, vitaminB12: 3.2, folate: 25,
        omega3: 2.3, omega6: 1.1, saturatedFat: 3.1, monounsaturatedFat: 3.8, polyunsaturatedFat: 3.9,
        cookingMethods: [CookingMethod.GRILLED, CookingMethod.BAKED, CookingMethod.RAW],
        allergens: [Allergen.FISH], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.PALEO],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Très frais: 1-2 jours, congélateur 2-3 mois',
        preparationTips: ['Vérifier la fraîcheur', 'Cuisson peau vers le bas en premier', 'Ne pas trop cuire'],
        healthBenefits: ['Santé cardiovasculaire', 'Anti-inflammatoire', 'Santé cérébrale', 'Récupération musculaire'],
        verified: true, popularityScore: 88, imageUrl: 'assets/Aliments/saumon.png',
        alternativeNames: ['Saumon', 'Salmon'], origin: 'Pêche/Élevage',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.PREMIUM
    },
    {
        id: 'eggs_whole',
        name: 'Œufs entiers',
        nameEn: 'Whole eggs',
        category: FoodCategory.PROTEINS,
        subcategory: 'Œufs',
        description: 'Protéine complète avec tous les acides aminés essentiels',
        calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1,
        sodium: 124, potassium: 138, calcium: 56, iron: 1.75, magnesium: 12,
        phosphorus: 198, zinc: 1.3, vitaminA: 540, vitaminC: 0, vitaminD: 2,
        vitaminE: 1.05, vitaminK: 0.3, vitaminB1: 0.04, vitaminB2: 0.46,
        vitaminB3: 0.075, vitaminB6: 0.17, vitaminB12: 0.89, folate: 47,
        omega3: 0.1, omega6: 1.9, saturatedFat: 3.1, monounsaturatedFat: 4.1, polyunsaturatedFat: 1.9,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.FRIED, CookingMethod.BAKED, CookingMethod.RAW],
        allergens: [Allergen.EGGS], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.VEGETARIAN],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur 3-4 semaines',
        preparationTips: ['Test de fraîcheur dans l\'eau', 'Cuisson douce pour texture', 'Température ambiante avant cuisson'],
        healthBenefits: ['Protéine complète', 'Choline pour le cerveau', 'Lutéine pour les yeux'],
        verified: true, popularityScore: 94, imageUrl: 'assets/Aliments/oeuf.png',
        alternativeNames: ['Œuf de poule'], origin: 'Élevage',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },
    // ===== LÉGUMES =====
    {
        id: 'broccoli',
        name: 'Brocoli',
        nameEn: 'Broccoli',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Crucifères',
        description: 'Super-aliment riche en vitamines, minéraux et antioxydants',
        calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.5,
        sodium: 33, potassium: 316, calcium: 47, iron: 0.73, magnesium: 21,
        phosphorus: 66, zinc: 0.41, vitaminA: 623, vitaminC: 89.2, vitaminD: 0,
        vitaminE: 0.78, vitaminK: 101.6, vitaminB1: 0.07, vitaminB2: 0.12,
        vitaminB3: 0.64, vitaminB6: 0.18, vitaminB12: 0, folate: 63,
        omega3: 0.1, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0.1, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.STEAMED, CookingMethod.BOILED, CookingMethod.SAUTEED, CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO],
        glycemicIndex: 10, season: [Season.AUTUMN, Season.WINTER], storageMethod: 'Réfrigérateur 3-5 jours',
        preparationTips: ['Cuisson vapeur pour préserver vitamines', 'Ne pas surcuire', 'Utiliser aussi les tiges'],
        healthBenefits: ['Anti-cancer', 'Détoxification', 'Santé digestive', 'Immunité'],
        verified: true, popularityScore: 91, imageUrl: 'assets/Aliments/brocoli.png',
        alternativeNames: ['Brocolis'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'spinach',
        name: 'Épinards',
        nameEn: 'Spinach',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Légumes feuilles',
        description: 'Légume vert riche en fer, folates et antioxydants',
        calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4,
        sodium: 79, potassium: 558, calcium: 99, iron: 2.7, magnesium: 79,
        phosphorus: 49, zinc: 0.53, vitaminA: 9377, vitaminC: 28.1, vitaminD: 0,
        vitaminE: 2.03, vitaminK: 483, vitaminB1: 0.08, vitaminB2: 0.19,
        vitaminB3: 0.72, vitaminB6: 0.2, vitaminB12: 0, folate: 194,
        omega3: 0.1, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.RAW, CookingMethod.SAUTEED, CookingMethod.STEAMED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO],
        glycemicIndex: 15, season: [Season.SPRING, Season.AUTUMN], storageMethod: 'Réfrigérateur 3-7 jours',
        preparationTips: ['Laver soigneusement', 'Consommer rapidement après achat', 'Cuisson rapide'],
        healthBenefits: ['Riche en fer', 'Santé oculaire', 'Anti-inflammatoire', 'Santé cardiovasculaire'],
        verified: true, popularityScore: 83, imageUrl: 'assets/Aliments/epinard.png',
        alternativeNames: ['Épinard'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    // ===== FRUITS =====
    {
        id: 'banana',
        name: 'Banane',
        nameEn: 'Banana',
        category: FoodCategory.FRUITS,
        subcategory: 'Fruits tropicaux',
        description: 'Fruit énergétique riche en potassium et glucides naturels',
        calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2,
        sodium: 1, potassium: 358, calcium: 5, iron: 0.26, magnesium: 27,
        phosphorus: 22, zinc: 0.15, vitaminA: 64, vitaminC: 8.7, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 0.5, vitaminB1: 0.03, vitaminB2: 0.07,
        vitaminB3: 0.67, vitaminB6: 0.37, vitaminB12: 0, folate: 20,
        omega3: 0, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW, CookingMethod.BAKED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 51, season: [Season.ALL_YEAR], storageMethod: 'Température ambiante jusqu\'à maturité',
        preparationTips: ['Manger mûre pour digestibilité', 'Éviter réfrigération si pas mûre', 'Idéale pré/post workout'],
        healthBenefits: ['Énergie rapide', 'Récupération musculaire', 'Santé cardiaque', 'Régulation transit'],
        verified: true, popularityScore: 98, imageUrl: 'assets/Aliments/banane.png',
        alternativeNames: [], origin: 'Agriculture tropicale',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },
    {
        id: 'avocado',
        name: 'Avocat',
        nameEn: 'Avocado',
        category: FoodCategory.FRUITS,
        subcategory: 'Fruits gras',
        description: 'Fruit gras riche en bonnes graisses et fibres',
        calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, sugar: 0.7,
        sodium: 7, potassium: 485, calcium: 12, iron: 0.55, magnesium: 29,
        phosphorus: 52, zinc: 0.64, vitaminA: 146, vitaminC: 10, vitaminD: 0,
        vitaminE: 2.07, vitaminK: 21, vitaminB1: 0.07, vitaminB2: 0.13,
        vitaminB3: 1.74, vitaminB6: 0.26, vitaminB12: 0, folate: 81,
        omega3: 0.1, omega6: 1.8, saturatedFat: 2.1, monounsaturatedFat: 9.8, polyunsaturatedFat: 1.8,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO],
        glycemicIndex: 15, season: [Season.ALL_YEAR], storageMethod: 'Mûrissement à température ambiante',
        preparationTips: ['Vérifier maturité par pression douce', 'Citron pour éviter oxydation', 'Noyau comestible'],
        healthBenefits: ['Bonnes graisses', 'Satiété', 'Absorption vitamines', 'Santé cardiaque'],
        verified: true, popularityScore: 95, imageUrl: 'assets/Aliments/avocat.png',
        alternativeNames: [], origin: 'Agriculture tropicale',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },
    // ===== CÉRÉALES =====
    {
        id: 'quinoa',
        name: 'Quinoa',
        nameEn: 'Quinoa',
        category: FoodCategory.GRAINS,
        subcategory: 'Pseudo-céréales',
        description: 'Pseudo-céréale complète sans gluten, riche en protéines',
        calories: 368, protein: 14.1, carbs: 64.2, fat: 6.1, fiber: 7, sugar: 0,
        sodium: 5, potassium: 563, calcium: 47, iron: 4.57, magnesium: 197,
        phosphorus: 457, zinc: 3.1, vitaminA: 14, vitaminC: 0, vitaminD: 0,
        vitaminE: 2.44, vitaminK: 0, vitaminB1: 0.36, vitaminB2: 0.32,
        vitaminB3: 1.52, vitaminB6: 0.49, vitaminB12: 0, folate: 184,
        omega3: 0.3, omega6: 2.9, saturatedFat: 0.7, monounsaturatedFat: 1.6, polyunsaturatedFat: 3.3,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.STEAMED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 53, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et frais, plusieurs mois',
        preparationTips: ['Rincer avant cuisson', 'Ratio 1:2 avec eau', 'Griller pour plus de saveur'],
        healthBenefits: ['Protéine complète', 'Sans gluten', 'Riche en minéraux', 'Satiété'],
        verified: true, popularityScore: 88, imageUrl: 'assets/Aliments/quinoa.png',
        alternativeNames: ['Riz des Incas'], origin: 'Agriculture andine',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'oats',
        name: 'Avoine',
        nameEn: 'Oats',
        category: FoodCategory.GRAINS,
        subcategory: 'Céréales',
        description: 'Céréale complète riche en fibres solubles et protéines',
        calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sugar: 0,
        sodium: 2, potassium: 429, calcium: 54, iron: 4.7, magnesium: 177,
        phosphorus: 523, zinc: 4, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.7, vitaminK: 2, vitaminB1: 0.76, vitaminB2: 0.14,
        vitaminB3: 0.96, vitaminB6: 0.12, vitaminB12: 0, folate: 56,
        omega3: 0.1, omega6: 2.4, saturatedFat: 1.2, monounsaturatedFat: 2.2, polyunsaturatedFat: 2.5,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.BAKED, CookingMethod.RAW],
        allergens: [Allergen.GLUTEN], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 55, season: [Season.ALL_YEAR], storageMethod: 'Récipient hermétique, lieu sec',
        preparationTips: ['Trempage overnight pour digestibilité', 'Cuisson lente pour texture', 'Base parfaite pour porridge'],
        healthBenefits: ['Contrôle cholestérol', 'Satiété longue', 'Énergie stable', 'Santé digestive'],
        verified: true, popularityScore: 92, imageUrl: 'assets/Aliments/avoine.png',
        alternativeNames: ['Flocons d\'avoine'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    // ===== NOIX ET GRAINES =====
    {
        id: 'almonds',
        name: 'Amandes',
        nameEn: 'Almonds',
        category: FoodCategory.NUTS_SEEDS,
        subcategory: 'Noix',
        description: 'Noix riche en bonnes graisses, protéines et vitamine E',
        calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugar: 4.4,
        sodium: 1, potassium: 733, calcium: 269, iron: 3.9, magnesium: 270,
        phosphorus: 481, zinc: 3.1, vitaminA: 25, vitaminC: 0, vitaminD: 0,
        vitaminE: 25.6, vitaminK: 0, vitaminB1: 0.21, vitaminB2: 1.1,
        vitaminB3: 4, vitaminB6: 0.14, vitaminB12: 0, folate: 44,
        omega3: 0, omega6: 12.3, saturatedFat: 3.8, monounsaturatedFat: 31.6, polyunsaturatedFat: 12.3,
        cookingMethods: [CookingMethod.RAW, CookingMethod.ROASTED],
        allergens: [Allergen.NUTS], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Récipient hermétique, lieu frais',
        preparationTips: ['Trempage pour digestibilité', 'Grillage léger pour saveur', 'Portion contrôlée'],
        healthBenefits: ['Vitamine E antioxydante', 'Santé cardiaque', 'Satiété', 'Calcium végétal'],
        verified: true, popularityScore: 87, imageUrl: 'assets/Aliments/amande.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },
    // ===== LÉGUMINEUSES =====
    {
        id: 'lentils_red',
        name: 'Lentilles rouges',
        nameEn: 'Red lentils',
        category: FoodCategory.LEGUMES,
        subcategory: 'Légumineuses',
        description: 'Légumineuse riche en protéines végétales et fibres',
        calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, sugar: 1.8,
        sodium: 2, potassium: 369, calcium: 19, iron: 3.3, magnesium: 36,
        phosphorus: 180, zinc: 1.3, vitaminA: 12, vitaminC: 4.5, vitaminD: 0,
        vitaminE: 0.11, vitaminK: 1.7, vitaminB1: 0.17, vitaminB2: 0.07,
        vitaminB3: 1.06, vitaminB6: 0.18, vitaminB12: 0, folate: 181,
        omega3: 0.1, omega6: 0.2, saturatedFat: 0.1, monounsaturatedFat: 0.1, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.STEAMED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 26, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec, plusieurs années',
        preparationTips: ['Pas besoin de trempage', 'Cuisson rapide 15-20min', 'Parfaites pour curry'],
        healthBenefits: ['Protéines végétales', 'Régulation glycémie', 'Santé digestive', 'Fer biodisponible'],
        verified: true, popularityScore: 85, imageUrl: 'assets/Aliments/lentilles.png',
        alternativeNames: ['Lentilles corail'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    
    // ===== PLUS DE PROTÉINES ANIMALES =====
    {
        id: 'beef_lean',
        name: 'Bœuf maigre',
        nameEn: 'Lean beef',
        category: FoodCategory.PROTEINS,
        subcategory: 'Viande rouge',
        description: 'Viande rouge maigre, excellente source de fer héminique et protéines',
        calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0,
        sodium: 72, potassium: 318, calcium: 18, iron: 2.9, magnesium: 21,
        phosphorus: 198, zinc: 4.5, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.4, vitaminK: 1.6, vitaminB1: 0.06, vitaminB2: 0.15,
        vitaminB3: 5.8, vitaminB6: 0.49, vitaminB12: 2.6, folate: 6,
        omega3: 0.1, omega6: 0.4, saturatedFat: 6.2, monounsaturatedFat: 6.8, polyunsaturatedFat: 0.6,
        cookingMethods: [CookingMethod.GRILLED, CookingMethod.ROASTED, CookingMethod.SAUTEED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur 3-5 jours, congélateur 6-12 mois',
        preparationTips: ['Cuire à point pour tendreté', 'Repos après cuisson', 'Découpe contre le grain'],
        healthBenefits: ['Fer héminique biodisponible', 'Zinc pour immunité', 'Créatine naturelle', 'Vitamine B12'],
        verified: true, popularityScore: 89, imageUrl: 'assets/Aliments/viande-crue.png',
        alternativeNames: ['Steak maigre', 'Filet de bœuf'], origin: 'Élevage',
        sustainability: SustainabilityLevel.LOW, priceRange: PriceRange.PREMIUM
    },
    {
        id: 'turkey_breast',
        name: 'Blanc de dinde',
        nameEn: 'Turkey breast',
        category: FoodCategory.PROTEINS,
        subcategory: 'Volaille',
        description: 'Viande blanche très maigre, alternative au poulet',
        calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sugar: 0,
        sodium: 63, potassium: 417, calcium: 4, iron: 1.4, magnesium: 32,
        phosphorus: 230, zinc: 1.7, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 0, vitaminB1: 0.05, vitaminB2: 0.12,
        vitaminB3: 11.8, vitaminB6: 0.8, vitaminB12: 0.31, folate: 5,
        omega3: 0.02, omega6: 0.2, saturatedFat: 0.3, monounsaturatedFat: 0.2, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.GRILLED, CookingMethod.BAKED, CookingMethod.ROASTED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.HIGH_PROTEIN, DietaryRestriction.LOW_FAT],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur 2-3 jours, congélateur 6 mois',
        preparationTips: ['Éviter la surcuisson', 'Marinage recommandé', 'Température interne 74°C'],
        healthBenefits: ['Très faible en gras', 'Sélénium antioxydant', 'Niacine pour métabolisme'],
        verified: true, popularityScore: 87, imageUrl: 'assets/Aliments/blanc-de-dinde.jpeg',
        alternativeNames: ['Escalope de dinde'], origin: 'Élevage',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },
    {
        id: 'tuna_canned',
        name: 'Thon en conserve',
        nameEn: 'Canned tuna',
        category: FoodCategory.SEAFOOD,
        subcategory: 'Conserves de poisson',
        description: 'Poisson en conserve, pratique et riche en protéines',
        calories: 116, protein: 25.5, carbs: 0, fat: 0.8, fiber: 0, sugar: 0,
        sodium: 247, potassium: 267, calcium: 3, iron: 0.8, magnesium: 30,
        phosphorus: 217, zinc: 0.4, vitaminA: 58, vitaminC: 0, vitaminD: 3.9,
        vitaminE: 0.9, vitaminK: 0, vitaminB1: 0.01, vitaminB2: 0.08,
        vitaminB3: 18.1, vitaminB6: 0.9, vitaminB12: 2.2, folate: 3,
        omega3: 0.3, omega6: 0.1, saturatedFat: 0.2, monounsaturatedFat: 0.1, polyunsaturatedFat: 0.4,
        cookingMethods: [CookingMethod.RAW],
        allergens: [Allergen.FISH], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.HIGH_PROTEIN, DietaryRestriction.LOW_FAT],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Température ambiante avant ouverture, réfrigérateur après',
        preparationTips: ['Égoutter avant utilisation', 'Parfait pour salades', 'Vérifier la provenance'],
        healthBenefits: ['Oméga-3 marins', 'Sélénium puissant', 'Pratique et durable'],
        verified: true, popularityScore: 94, imageUrl: 'assets/Aliments/boite-de-thon.png',
        alternativeNames: ['Thon au naturel'], origin: 'Pêche maritime',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },
    {
        id: 'shrimp',
        name: 'Crevettes',
        nameEn: 'Shrimp',
        category: FoodCategory.SEAFOOD,
        subcategory: 'Crustacés',
        description: 'Crustacé faible en calories, riche en protéines et iode',
        calories: 85, protein: 20.1, carbs: 0, fat: 1.1, fiber: 0, sugar: 0,
        sodium: 566, potassium: 182, calcium: 70, iron: 0.5, magnesium: 37,
        phosphorus: 201, zinc: 1.6, vitaminA: 180, vitaminC: 0, vitaminD: 0,
        vitaminE: 1.3, vitaminK: 0.3, vitaminB1: 0.01, vitaminB2: 0.07,
        vitaminB3: 2.3, vitaminB6: 0.1, vitaminB12: 1.3, folate: 18,
        omega3: 0.3, omega6: 0.02, saturatedFat: 0.2, monounsaturatedFat: 0.2, polyunsaturatedFat: 0.5,
        cookingMethods: [CookingMethod.GRILLED, CookingMethod.BOILED, CookingMethod.SAUTEED, CookingMethod.RAW],
        allergens: [Allergen.SHELLFISH], dietaryRestrictions: [DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.HIGH_PROTEIN, DietaryRestriction.LOW_FAT],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Très frais: 1-2 jours, congélateur 3-6 mois',
        preparationTips: ['Cuisson rapide', 'Ne pas décongeler à température ambiante', 'Déveiner si nécessaire'],
        healthBenefits: ['Iode pour thyroïde', 'Astaxanthine antioxydante', 'Faible en calories'],
        verified: true, popularityScore: 86, imageUrl: 'assets/Aliments/crevette.png',
        alternativeNames: ['Gambas'], origin: 'Pêche/Aquaculture',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.PREMIUM
    },

    // ===== PLUS DE LÉGUMES =====
    {
        id: 'carrots',
        name: 'Carottes',
        nameEn: 'Carrots',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Légumes racines',
        description: 'Légume racine riche en bêta-carotène et fibres',
        calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7,
        sodium: 69, potassium: 320, calcium: 33, iron: 0.3, magnesium: 12,
        phosphorus: 35, zinc: 0.2, vitaminA: 16706, vitaminC: 5.9, vitaminD: 0,
        vitaminE: 0.7, vitaminK: 13.2, vitaminB1: 0.07, vitaminB2: 0.06,
        vitaminB3: 0.98, vitaminB6: 0.14, vitaminB12: 0, folate: 19,
        omega3: 0, omega6: 0.1, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW, CookingMethod.STEAMED, CookingMethod.BOILED, CookingMethod.ROASTED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 35, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur 3-4 semaines',
        preparationTips: ['Cuire avec un peu de gras pour absorption vitamine A', 'Ne pas éplucher si bio', 'Râper pour salade'],
        healthBenefits: ['Santé oculaire', 'Antioxydants puissants', 'Fibres prébiotiques', 'Peau saine'],
    
        verified: true, popularityScore: 96, imageUrl: 'assets/Aliments/carottes.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'tomatoes',
        name: 'Tomates',
        nameEn: 'Tomatoes',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Fruits-légumes',
        description: 'Fruit-légume riche en lycopène et vitamine C',
        calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6,
        sodium: 5, potassium: 237, calcium: 10, iron: 0.3, magnesium: 11,
        phosphorus: 24, zinc: 0.2, vitaminA: 833, vitaminC: 13.7, vitaminD: 0,
        vitaminE: 0.5, vitaminK: 7.9, vitaminB1: 0.04, vitaminB2: 0.02,
        vitaminB3: 0.59, vitaminB6: 0.08, vitaminB12: 0, folate: 15,
        omega3: 0, omega6: 0.1, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW, CookingMethod.GRILLED, CookingMethod.ROASTED, CookingMethod.SAUTEED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 10, season: [Season.SUMMER], storageMethod: 'Température ambiante pour mûrissement, réfrigérateur une fois mûres',
        preparationTips: ['Manger avec la peau', 'Cuisson améliore absorption lycopène', 'Choisir bien mûres'],
        healthBenefits: ['Lycopène anti-cancer', 'Santé prostatique', 'Hydratation', 'Santé cardiovasculaire'],
        verified: true, popularityScore: 98, imageUrl: 'assets/Aliments/tomate.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'bell_peppers',
        name: 'Poivrons',
        nameEn: 'Bell peppers',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Légumes fruits',
        description: 'Légume coloré exceptionnellement riche en vitamine C',
        calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.5, sugar: 4.2,
        sodium: 4, potassium: 211, calcium: 7, iron: 0.4, magnesium: 12,
        phosphorus: 26, zinc: 0.3, vitaminA: 3131, vitaminC: 127.7, vitaminD: 0,
        vitaminE: 1.6, vitaminK: 4.9, vitaminB1: 0.05, vitaminB2: 0.09,
        vitaminB3: 0.98, vitaminB6: 0.29, vitaminB12: 0, folate: 46,
        omega3: 0, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.RAW, CookingMethod.GRILLED, CookingMethod.ROASTED, CookingMethod.SAUTEED, CookingMethod.STEAMED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 15, season: [Season.SUMMER, Season.AUTUMN], storageMethod: 'Réfrigérateur 1-2 semaines',
        preparationTips: ['Griller pour peler facilement', 'Rouge plus sucré que vert', 'Retirer graines et membranes'],
        healthBenefits: ['Plus de vitamine C que les agrumes', 'Antioxydants colorés', 'Santé oculaire', 'Immunité'],
        verified: true, popularityScore: 89, imageUrl: 'assets/Aliments/poivrons.png',
        alternativeNames: ['Poivrons doux'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'cauliflower',
        name: 'Chou-fleur',
        nameEn: 'Cauliflower',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Crucifères',
        description: 'Crucifère polyvalent, alternative faible en glucides',
        calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, sugar: 1.9,
        sodium: 30, potassium: 299, calcium: 22, iron: 0.4, magnesium: 15,
        phosphorus: 44, zinc: 0.3, vitaminA: 0, vitaminC: 48.2, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 15.5, vitaminB1: 0.05, vitaminB2: 0.06,
        vitaminB3: 0.51, vitaminB6: 0.18, vitaminB12: 0, folate: 57,
        omega3: 0, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.STEAMED, CookingMethod.ROASTED, CookingMethod.SAUTEED, CookingMethod.RAW, CookingMethod.BOILED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.LOW_CARB],
        glycemicIndex: 15, season: [Season.AUTUMN, Season.WINTER], storageMethod: 'Réfrigérateur 1 semaine',
        preparationTips: ['Utiliser les feuilles', 'Alternative riz/purée', 'Ne pas surcuire'],
        healthBenefits: ['Composés soufrés détox', 'Choline pour cerveau', 'Faible en calories', 'Versatile culinairement'],
        verified: true, popularityScore: 82, imageUrl: 'assets/Aliments/chou-fleur.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'zucchini',
        name: 'Courgettes',
        nameEn: 'Zucchini',
        category: FoodCategory.VEGETABLES,
        subcategory: 'Courges',
        description: 'Courge d\'été très faible en calories, riche en eau',
        calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, sugar: 2.5,
        sodium: 8, potassium: 261, calcium: 16, iron: 0.4, magnesium: 18,
        phosphorus: 38, zinc: 0.3, vitaminA: 200, vitaminC: 17.9, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 4.3, vitaminB1: 0.05, vitaminB2: 0.09,
        vitaminB3: 0.45, vitaminB6: 0.16, vitaminB12: 0, folate: 24,
        omega3: 0, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.GRILLED, CookingMethod.SAUTEED, CookingMethod.BAKED, CookingMethod.STEAMED, CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.LOW_CARB],
        glycemicIndex: 15, season: [Season.SUMMER], storageMethod: 'Réfrigérateur 4-5 jours',
        preparationTips: ['Spiraler en spaghettis', 'Ne pas peler si jeunes', 'Griller pour concentrer saveurs'],
        healthBenefits: ['Très hydratant', 'Faible en calories', 'Fibres douces', 'Substitut pâtes/riz'],
        verified: true, popularityScore: 88, imageUrl: 'assets/Aliments/courgette.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },

    // ===== PLUS DE FRUITS =====
    {
        id: 'apples',
        name: 'Pommes',
        nameEn: 'Apples',
        category: FoodCategory.FRUITS,
        subcategory: 'Fruits à pépins',
        description: 'Fruit populaire riche en fibres et antioxydants',
        calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4,
        sodium: 1, potassium: 107, calcium: 6, iron: 0.1, magnesium: 5,
        phosphorus: 11, zinc: 0, vitaminA: 54, vitaminC: 4.6, vitaminD: 0,
        vitaminE: 0.2, vitaminK: 2.2, vitaminB1: 0.02, vitaminB2: 0.03,
        vitaminB3: 0.09, vitaminB6: 0.04, vitaminB12: 0, folate: 3,
        omega3: 0, omega6: 0.1, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW, CookingMethod.BAKED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 36, season: [Season.AUTUMN], storageMethod: 'Réfrigérateur plusieurs semaines',
        preparationTips: ['Manger avec la peau', 'Citron pour éviter oxydation', 'Choisir fermes'],
        healthBenefits: ['Pectine pour cholestérol', 'Satiété longue durée', 'Santé dentaire', 'Prébiotiques'],
        verified: true, popularityScore: 99, imageUrl: 'assets/Aliments/pomme.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'blueberries',
        name: 'Myrtilles',
        nameEn: 'Blueberries',
        category: FoodCategory.FRUITS,
        subcategory: 'Baies',
        description: 'Super-fruit aux propriétés antioxydantes exceptionnelles',
        calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10,
        sodium: 1, potassium: 77, calcium: 6, iron: 0.3, magnesium: 6,
        phosphorus: 12, zinc: 0.2, vitaminA: 80, vitaminC: 9.7, vitaminD: 0,
        vitaminE: 0.6, vitaminK: 19.3, vitaminB1: 0.04, vitaminB2: 0.04,
        vitaminB3: 0.42, vitaminB6: 0.05, vitaminB12: 0, folate: 6,
        omega3: 0.1, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW, CookingMethod.BAKED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 53, season: [Season.SUMMER], storageMethod: 'Réfrigérateur 1-2 semaines, congélateur 1 an',
        preparationTips: ['Ne pas laver avant stockage', 'Parfaites congelées', 'Ajouter aux smoothies'],
        healthBenefits: ['Anthocyanes neuroprotectrices', 'Mémoire et cognition', 'Anti-inflammatoire puissant', 'Santé cardiovasculaire'],
        verified: true, popularityScore: 91, imageUrl: 'assets/Aliments/myrtille.png',
        alternativeNames: ['Airelles'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'strawberries',
        name: 'Fraises',
        nameEn: 'Strawberries',
        category: FoodCategory.FRUITS,
        subcategory: 'Baies',
        description: 'Baie sucrée très riche en vitamine C et pauvre en calories',
        calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9,
        sodium: 1, potassium: 153, calcium: 16, iron: 0.4, magnesium: 13,
        phosphorus: 24, zinc: 0.1, vitaminA: 12, vitaminC: 58.8, vitaminD: 0,
        vitaminE: 0.3, vitaminK: 2.2, vitaminB1: 0.02, vitaminB2: 0.02,
        vitaminB3: 0.39, vitaminB6: 0.05, vitaminB12: 0, folate: 24,
        omega3: 0.1, omega6: 0.1, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 40, season: [Season.SPRING, Season.SUMMER], storageMethod: 'Réfrigérateur 3-7 jours',
        preparationTips: ['Ne pas laver avant stockage', 'Garder les queues', 'Choisir rouge uniforme'],
        healthBenefits: ['Vitamine C record', 'Élargine acide pour circulation', 'Faible en sucre', 'Antioxydants variés'],
        verified: true, popularityScore: 97, imageUrl: 'assets/Aliments/fraise.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'oranges',
        name: 'Oranges',
        nameEn: 'Oranges',
        category: FoodCategory.FRUITS,
        subcategory: 'Agrumes',
        description: 'Agrume classique, source excellente de vitamine C',
        calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4,
        sodium: 0, potassium: 181, calcium: 40, iron: 0.1, magnesium: 10,
        phosphorus: 14, zinc: 0.1, vitaminA: 225, vitaminC: 53.2, vitaminD: 0,
        vitaminE: 0.2, vitaminK: 0, vitaminB1: 0.09, vitaminB2: 0.04,
        vitaminB3: 0.28, vitaminB6: 0.06, vitaminB12: 0, folate: 40,
        omega3: 0, omega6: 0, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 45, season: [Season.WINTER], storageMethod: 'Température ambiante 1 semaine, réfrigérateur 2-3 semaines',
        preparationTips: ['Choisir lourdes pour leur taille', 'Zeste comestible si bio', 'Jus frais meilleur'],
        healthBenefits: ['Vitamine C immunité', 'Flavonoïdes anti-inflammatoires', 'Fibres solubles', 'Hydratation'],
        verified: true, popularityScore: 95, imageUrl: 'assets/Aliments/orange.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'kiwi',
        name: 'Kiwi',
        nameEn: 'Kiwi fruit',
        category: FoodCategory.FRUITS,
        subcategory: 'Fruits exotiques',
        description: 'Fruit exotique champion de la vitamine C',
        calories: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, sugar: 9,
        sodium: 3, potassium: 312, calcium: 34, iron: 0.3, magnesium: 17,
        phosphorus: 34, zinc: 0.1, vitaminA: 87, vitaminC: 92.7, vitaminD: 0,
        vitaminE: 1.5, vitaminK: 40.3, vitaminB1: 0.03, vitaminB2: 0.03,
        vitaminB3: 0.34, vitaminB6: 0.06, vitaminB12: 0, folate: 25,
        omega3: 0.1, omega6: 0.2, saturatedFat: 0.1, monounsaturatedFat: 0.1, polyunsaturatedFat: 0.3,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 53, season: [Season.AUTUMN, Season.WINTER], storageMethod: 'Mûrissement température ambiante, réfrigérateur si mûr',
        preparationTips: ['Peau comestible si bio', 'Mûr si légèrement mou', 'Actinidine enzyme digestive'],
        healthBenefits: ['Plus de vitamine C qu\'orange', 'Enzymes digestives', 'Potassium pour cœur', 'Fibres prébiotiques'],
        verified: true, popularityScore: 87, imageUrl: 'assets/Aliments/kiwi.png',
        alternativeNames: ['Actinidia'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },

    // ===== PLUS DE CÉRÉALES =====
    {
        id: 'brown_rice',
        name: 'Riz brun',
        nameEn: 'Brown rice',
        category: FoodCategory.GRAINS,
        subcategory: 'Céréales complètes',
        description: 'Riz complet riche en fibres et minéraux',
        calories: 370, protein: 7.9, carbs: 77.2, fat: 2.9, fiber: 3.5, sugar: 0.7,
        sodium: 7, potassium: 223, calcium: 23, iron: 1.5, magnesium: 143,
        phosphorus: 333, zinc: 2, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 1.2, vitaminK: 1.9, vitaminB1: 0.4, vitaminB2: 0.09,
        vitaminB3: 5.1, vitaminB6: 0.51, vitaminB12: 0, folate: 20,
        omega3: 0.1, omega6: 1, saturatedFat: 0.6, monounsaturatedFat: 1.1, polyunsaturatedFat: 1,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.STEAMED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 68, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et frais, plusieurs mois',
        preparationTips: ['Rincer avant cuisson', 'Ratio 1:2.5 avec eau', 'Cuisson plus longue que riz blanc'],
        healthBenefits: ['Fibres pour transit', 'Magnésium pour muscles', 'Énergie stable', 'Son riche en vitamines B'],
        verified: true, popularityScore: 89, imageUrl: 'assets/Aliments/riz-brun.png',
        alternativeNames: ['Riz complet'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },
    {
        id: 'whole_wheat_pasta',
        name: 'Pâtes complètes',
        nameEn: 'Whole wheat pasta',
        category: FoodCategory.GRAINS,
        subcategory: 'Pâtes',
        description: 'Pâtes de blé complet riches en fibres et protéines',
        calories: 348, protein: 14.6, carbs: 71.2, fat: 2.5, fiber: 10.7, sugar: 2.8,
        sodium: 13, potassium: 363, calcium: 40, iron: 3.6, magnesium: 143,
        phosphorus: 258, zinc: 2.8, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 1.4, vitaminK: 0.2, vitaminB1: 0.4, vitaminB2: 0.15,
        vitaminB3: 6.4, vitaminB6: 0.15, vitaminB12: 0, folate: 44,
        omega3: 0.1, omega6: 1.2, saturatedFat: 0.4, monounsaturatedFat: 0.3, polyunsaturatedFat: 1.1,
        cookingMethods: [CookingMethod.BOILED],
        allergens: [Allergen.GLUTEN], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 42, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec, plusieurs années',
        preparationTips: ['Cuisson al dente', 'Eau salée bouillante', 'Ne pas rincer après cuisson'],
        healthBenefits: ['Fibres satiété', 'Index glycémique plus bas', 'Protéines végétales', 'Vitamines B groupe'],
        verified: true, popularityScore: 85, imageUrl: 'assets/Aliments/pates.png',
        alternativeNames: ['Pâtes intégrales'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },

    // ===== PLUS D'OLÉAGINEUX =====
    {
        id: 'walnuts',
        name: 'Noix',
        nameEn: 'Walnuts',
        category: FoodCategory.NUTS_SEEDS,
        subcategory: 'Noix',
        description: 'Noix riche en oméga-3 végétaux et antioxydants',
        calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, sugar: 2.6,
        sodium: 2, potassium: 441, calcium: 98, iron: 2.9, magnesium: 158,
        phosphorus: 346, zinc: 3.1, vitaminA: 20, vitaminC: 1.3, vitaminD: 0,
        vitaminE: 0.7, vitaminK: 2.7, vitaminB1: 0.34, vitaminB2: 0.15,
        vitaminB3: 1.1, vitaminB6: 0.54, vitaminB12: 0, folate: 98,
        omega3: 9.1, omega6: 38, saturatedFat: 6.1, monounsaturatedFat: 8.9, polyunsaturatedFat: 47.2,
        cookingMethods: [CookingMethod.RAW, CookingMethod.ROASTED],
        allergens: [Allergen.NUTS], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO],
        glycemicIndex: 15, season: [Season.AUTUMN], storageMethod: 'Réfrigérateur ou congélateur pour fraîcheur',
        preparationTips: ['Tremper pour digestibilité', '30g portion recommandée', 'Manger avec peau'],
        healthBenefits: ['Oméga-3 ALA pour cœur', 'Santé cérébrale', 'Anti-inflammatoire', 'Manganèse antioxydant'],
        verified: true, popularityScore: 88, imageUrl: 'assets/Aliments/noix.png',
        alternativeNames: ['Noix de Grenoble'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'chia_seeds',
        name: 'Graines de chia',
        nameEn: 'Chia seeds',
        category: FoodCategory.NUTS_SEEDS,
        subcategory: 'Graines',
        description: 'Super-graine riche en oméga-3, fibres et protéines',
        calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, sugar: 0,
        sodium: 16, potassium: 407, calcium: 631, iron: 7.7, magnesium: 335,
        phosphorus: 860, zinc: 4.6, vitaminA: 54, vitaminC: 1.6, vitaminD: 0,
        vitaminE: 0.5, vitaminK: 0, vitaminB1: 0.62, vitaminB2: 0.17,
        vitaminB3: 8.8, vitaminB6: 0, vitaminB12: 0, folate: 49,
        omega3: 17.8, omega6: 5.8, saturatedFat: 3.3, monounsaturatedFat: 2.3, polyunsaturatedFat: 23.7,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 30, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et frais, plusieurs années',
        preparationTips: ['Tremper pour gel mucilagineux', 'Parfait pour puddings', 'Broyer pour meilleure absorption'],
        healthBenefits: ['Fibres solubles satiété', 'Oméga-3 végétaux', 'Calcium biodisponible', 'Hydratation prolongée'],
        verified: true, popularityScore: 92, imageUrl: 'assets/Aliments/chia.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'sunflower_seeds',
        name: 'Graines de tournesol',
        nameEn: 'Sunflower seeds',
        category: FoodCategory.NUTS_SEEDS,
        subcategory: 'Graines',
        description: 'Graines riches en vitamine E et bonnes graisses',
        calories: 584, protein: 20.8, carbs: 20, fat: 51.5, fiber: 8.6, sugar: 2.6,
        sodium: 9, potassium: 645, calcium: 78, iron: 5.2, magnesium: 325,
        phosphorus: 660, zinc: 5, vitaminA: 50, vitaminC: 1.4, vitaminD: 0,
        vitaminE: 35.2, vitaminK: 0, vitaminB1: 1.5, vitaminB2: 0.36,
        vitaminB3: 8.3, vitaminB6: 1.3, vitaminB12: 0, folate: 227,
        omega3: 0.1, omega6: 23.1, saturatedFat: 4.5, monounsaturatedFat: 18.5, polyunsaturatedFat: 23.1,
        cookingMethods: [CookingMethod.RAW, CookingMethod.ROASTED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 35, season: [Season.AUTUMN], storageMethod: 'Récipient hermétique, lieu frais',
        preparationTips: ['Décortiquer avant consommation', 'Griller légèrement pour saveur', 'Ajouter aux salades'],
        healthBenefits: ['Vitamine E antioxydante puissante', 'Magnésium pour muscles', 'Sélénium immunité', 'Bonnes graisses'],
        verified: true, popularityScore: 84, imageUrl: 'assets/Aliments/graines-de-tournesol.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },

    // ===== PLUS DE LÉGUMINEUSES =====
    {
        id: 'chickpeas',
        name: 'Pois chiches',
        nameEn: 'Chickpeas',
        category: FoodCategory.LEGUMES,
        subcategory: 'Légumineuses',
        description: 'Légumineuse polyvalente, base du houmous',
        calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugar: 4.8,
        sodium: 7, potassium: 291, calcium: 49, iron: 2.9, magnesium: 48,
        phosphorus: 168, zinc: 1.5, vitaminA: 27, vitaminC: 1.3, vitaminD: 0,
        vitaminE: 0.4, vitaminK: 4, vitaminB1: 0.12, vitaminB2: 0.06,
        vitaminB3: 0.53, vitaminB6: 0.14, vitaminB12: 0, folate: 172,
        omega3: 0.1, omega6: 1.2, saturatedFat: 0.3, monounsaturatedFat: 0.6, polyunsaturatedFat: 1.2,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.STEAMED, CookingMethod.ROASTED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 28, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec plusieurs années (secs), réfrigérateur 3 jours (cuits)',
        preparationTips: ['Trempage 8-12h', 'Cuisson 1-2h', 'Retirer écume pendant cuisson'],
        healthBenefits: ['Protéines + fibres satiété', 'Folates grossesse', 'Fer végétal', 'Index glycémique bas'],
        verified: true, popularityScore: 90, imageUrl: 'assets/Aliments/pois-chiches.png',
        alternativeNames: ['Garbanzo'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'black_beans',
        name: 'Haricots noirs',
        nameEn: 'Black beans',
        category: FoodCategory.LEGUMES,
        subcategory: 'Légumineuses',
        description: 'Haricots riches en antioxydants et protéines',
        calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fiber: 8.7, sugar: 0.3,
        sodium: 2, potassium: 355, calcium: 27, iron: 2.1, magnesium: 70,
        phosphorus: 140, zinc: 1.1, vitaminA: 6, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 5.5, vitaminB1: 0.24, vitaminB2: 0.06,
        vitaminB3: 0.51, vitaminB6: 0.07, vitaminB12: 0, folate: 149,
        omega3: 0.2, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.3,
        cookingMethods: [CookingMethod.BOILED, CookingMethod.STEAMED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 30, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec plusieurs années (secs), réfrigérateur 3-4 jours (cuits)',
        preparationTips: ['Trempage une nuit', 'Cuisson 1-1.5h', 'Parfaits pour plats mexicains'],
        healthBenefits: ['Anthocyanes antioxydantes', 'Fibres santé digestive', 'Molybdène détox', 'Faible index glycémique'],
        verified: true, popularityScore: 87, imageUrl: 'assets/Aliments/haricots.png',
        alternativeNames: ['Haricots tortue'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },

    // ===== PRODUITS LAITIERS =====
    {
        id: 'greek_yogurt',
        name: 'Yaourt grec',
        nameEn: 'Greek yogurt',
        category: FoodCategory.DAIRY,
        subcategory: 'Yaourts',
        description: 'Yaourt épais et crémeux, très riche en protéines',
        calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.6,
        sodium: 36, potassium: 141, calcium: 110, iron: 0.04, magnesium: 11,
        phosphorus: 135, zinc: 0.52, vitaminA: 27, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.01, vitaminK: 0.2, vitaminB1: 0.04, vitaminB2: 0.27,
        vitaminB3: 0.2, vitaminB6: 0.06, vitaminB12: 0.75, folate: 7,
        omega3: 0, omega6: 0.1, saturatedFat: 0.1, monounsaturatedFat: 0.1, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW],
        allergens: [Allergen.DAIRY], dietaryRestrictions: [DietaryRestriction.VEGETARIAN, DietaryRestriction.KETO, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 11, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur, date limite',
        preparationTips: ['Parfait avec fruits', 'Base pour smoothies', 'Alternative crème fraîche'],
        healthBenefits: ['Probiotiques', 'Protéines complètes', 'Calcium biodisponible', 'Satiété'],
        verified: true, popularityScore: 92, imageUrl: 'assets/Aliments/yaourt.png',
        alternativeNames: ['Yaourt à la grecque'], origin: 'Industrie laitière',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },
    {
        id: 'cottage_cheese',
        name: 'Fromage blanc',
        nameEn: 'Cottage cheese',
        category: FoodCategory.DAIRY,
        subcategory: 'Fromages frais',
        description: 'Fromage frais très riche en protéines et faible en gras',
        calories: 98, protein: 11.1, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7,
        sodium: 364, potassium: 104, calcium: 83, iron: 0.1, magnesium: 8,
        phosphorus: 159, zinc: 0.4, vitaminA: 163, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 0.1, vitaminB1: 0.04, vitaminB2: 0.16,
        vitaminB3: 0.1, vitaminB6: 0.07, vitaminB12: 0.4, folate: 12,
        omega3: 0.1, omega6: 0.1, saturatedFat: 2.7, monounsaturatedFat: 1.2, polyunsaturatedFat: 0.1,
        cookingMethods: [CookingMethod.RAW],
        allergens: [Allergen.DAIRY], dietaryRestrictions: [DietaryRestriction.VEGETARIAN, DietaryRestriction.KETO, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 10, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur, consommer rapidement après ouverture',
        preparationTips: ['Excellent avec fruits', 'Base pour dips', 'Version 0% pour régime'],
        healthBenefits: ['Caséine à diffusion lente', 'Très satiétant', 'Riche en protéines', 'Faible en lactose'],
        verified: true, popularityScore: 86, imageUrl: 'assets/Aliments/fromage-blanc.png',
        alternativeNames: ['Cottage cheese'], origin: 'Industrie laitière',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },
    {
        id: 'milk_skim',
        name: 'Lait écrémé',
        nameEn: 'Skim milk',
        category: FoodCategory.DAIRY,
        subcategory: 'Laits',
        description: 'Lait dégraissé, riche en protéines et calcium',
        calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, sugar: 5,
        sodium: 44, potassium: 150, calcium: 125, iron: 0, magnesium: 11,
        phosphorus: 101, zinc: 0.4, vitaminA: 205, vitaminC: 0, vitaminD: 1.3,
        vitaminE: 0, vitaminK: 0.1, vitaminB1: 0.04, vitaminB2: 0.14,
        vitaminB3: 0.09, vitaminB6: 0.04, vitaminB12: 0.5, folate: 5,
        omega3: 0, omega6: 0, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0,
        cookingMethods: [CookingMethod.RAW],
        allergens: [Allergen.DAIRY], dietaryRestrictions: [DietaryRestriction.VEGETARIAN, DietaryRestriction.LOW_FAT],
        glycemicIndex: 27, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur, respecter date limite',
        preparationTips: ['Parfait pour smoothies', 'Alternative faible en calories', 'Enrichi souvent en vitamines'],
        healthBenefits: ['Calcium biodisponible', 'Protéines complètes', 'Faible en graisses', 'Hydratation'],
        verified: true, popularityScore: 88, imageUrl: 'assets/Aliments/bouteille-de-lait.png',
        alternativeNames: ['Lait 0%'], origin: 'Industrie laitière',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },

    // ===== HUILES ET GRAISSES =====
    {
        id: 'olive_oil_extra_virgin',
        name: 'Huile d\'olive extra vierge',
        nameEn: 'Extra virgin olive oil',
        category: FoodCategory.OILS_FATS,
        subcategory: 'Huiles végétales',
        description: 'Huile premium riche en antioxydants et bonnes graisses',
        calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0,
        sodium: 2, potassium: 1, calcium: 1, iron: 0.6, magnesium: 0,
        phosphorus: 0, zinc: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 14.4, vitaminK: 60.2, vitaminB1: 0, vitaminB2: 0,
        vitaminB3: 0, vitaminB6: 0, vitaminB12: 0, folate: 0,
        omega3: 0.8, omega6: 9.8, saturatedFat: 13.8, monounsaturatedFat: 73, polyunsaturatedFat: 10.5,
        cookingMethods: [CookingMethod.RAW, CookingMethod.SAUTEED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Lieu frais et sombre, à l\'abri de la lumière',
        preparationTips: ['Première pression à froid', 'Ne pas chauffer trop fort', 'Finition sur plats'],
        healthBenefits: ['Polyphénols antioxydants', 'Acide oléique anti-inflammatoire', 'Vitamine E', 'Régime méditerranéen'],
        verified: true, popularityScore: 95, imageUrl: 'assets/Aliments/huile-dolive.png',
        alternativeNames: ['HOVE'], origin: 'Agriculture méditerranéenne',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'coconut_oil',
        name: 'Huile de coco',
        nameEn: 'Coconut oil',
        category: FoodCategory.OILS_FATS,
        subcategory: 'Huiles tropicales',
        description: 'Huile saturée stable à haute température',
        calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0,
        sodium: 0, potassium: 0, calcium: 0, iron: 0, magnesium: 0,
        phosphorus: 0, zinc: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 0.5, vitaminB1: 0, vitaminB2: 0,
        vitaminB3: 0, vitaminB6: 0, vitaminB12: 0, folate: 0,
        omega3: 0, omega6: 1.8, saturatedFat: 86.5, monounsaturatedFat: 5.8, polyunsaturatedFat: 1.8,
        cookingMethods: [CookingMethod.SAUTEED, CookingMethod.BAKED, CookingMethod.FRIED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Température ambiante, solide en dessous de 24°C',
        preparationTips: ['Excellente pour cuisson haute température', 'TCM pour énergie rapide', 'Vierge de préférence'],
        healthBenefits: ['MCT énergie rapide', 'Stable à la cuisson', 'Acide laurique antimicrobien', 'Cétogène friendly'],
        verified: true, popularityScore: 89, imageUrl: 'assets/Aliments/huile-de-noix-de-coco.png',
        alternativeNames: [], origin: 'Agriculture tropicale',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    },
    {
        id: 'avocado_oil',
        name: 'Huile d\'avocat',
        nameEn: 'Avocado oil',
        category: FoodCategory.OILS_FATS,
        subcategory: 'Huiles de fruits',
        description: 'Huile premium avec point de fumée très élevé',
        calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0,
        sodium: 0, potassium: 0, calcium: 0, iron: 0, magnesium: 0,
        phosphorus: 0, zinc: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 23.4, vitaminK: 0, vitaminB1: 0, vitaminB2: 0,
        vitaminB3: 0, vitaminB6: 0, vitaminB12: 0, folate: 0,
        omega3: 1, omega6: 12.5, saturatedFat: 11.6, monounsaturatedFat: 70.6, polyunsaturatedFat: 13.5,
        cookingMethods: [CookingMethod.SAUTEED, CookingMethod.GRILLED, CookingMethod.ROASTED, CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Lieu frais et sombre',
        preparationTips: ['Point de fumée 271°C', 'Excellente pour grillades', 'Goût neutre'],
        healthBenefits: ['Point de fumée très haut', 'Riche en oléique', 'Vitamine E antioxydante', 'Absorption caroténoïdes'],
        verified: true, popularityScore: 85, imageUrl: 'assets/Aliments/huile-avocats.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.PREMIUM
    },

    // ===== BOISSONS =====
    {
        id: 'green_tea',
        name: 'Thé vert',
        nameEn: 'Green tea',
        category: FoodCategory.BEVERAGES,
        subcategory: 'Thés',
        description: 'Boisson antioxydante aux multiples bienfaits santé',
        calories: 2, protein: 0.2, carbs: 0, fat: 0, fiber: 0, sugar: 0,
        sodium: 1, potassium: 27, calcium: 0, iron: 0.02, magnesium: 2,
        phosphorus: 3, zinc: 0.01, vitaminA: 0, vitaminC: 0.3, vitaminD: 0,
        vitaminE: 0, vitaminK: 0, vitaminB1: 0, vitaminB2: 0.06,
        vitaminB3: 0.03, vitaminB6: 0.01, vitaminB12: 0, folate: 5,
        omega3: 0, omega6: 0, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec à l\'abri de la lumière',
        preparationTips: ['Infusion 70-80°C', 'Ne pas surcuire', '2-3 minutes d\'infusion'],
        healthBenefits: ['EGCG antioxydant puissant', 'Métabolisme accru', 'Santé cardiovasculaire', 'Neuroprotection'],
        verified: true, popularityScore: 94, imageUrl: 'assets/Aliments/the-a-la-menthe.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'coffee_black',
        name: 'Café noir',
        nameEn: 'Black coffee',
        category: FoodCategory.BEVERAGES,
        subcategory: 'Cafés',
        description: 'Boisson stimulante riche en antioxydants',
        calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0,
        sodium: 5, potassium: 116, calcium: 2, iron: 0.01, magnesium: 8,
        phosphorus: 3, zinc: 0.05, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 0, vitaminK: 0.1, vitaminB1: 0, vitaminB2: 0.18,
        vitaminB3: 0.7, vitaminB6: 0, vitaminB12: 0, folate: 5,
        omega3: 0, omega6: 0, saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Grains entiers lieu frais et sec',
        preparationTips: ['Fraîchement moulu', 'Eau 90-96°C', 'Ratio 1:15 café:eau'],
        healthBenefits: ['Caféine performance', 'Antioxydants chlorogéniques', 'Métabolisme accru', 'Santé hépatique'],
        verified: true, popularityScore: 98, imageUrl: 'assets/Aliments/tasse-a-cafe.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.BUDGET
    },

    // ===== HERBES ET ÉPICES =====
    {
        id: 'garlic',
        name: 'Ail',
        nameEn: 'Garlic',
        category: FoodCategory.HERBS_SPICES,
        subcategory: 'Aromates',
        description: 'Bulbe aromatique aux propriétés antimicrobiennes',
        calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1,
        sodium: 17, potassium: 401, calcium: 181, iron: 1.7, magnesium: 25,
        phosphorus: 153, zinc: 1.2, vitaminA: 9, vitaminC: 31.2, vitaminD: 0,
        vitaminE: 0.1, vitaminK: 1.7, vitaminB1: 0.2, vitaminB2: 0.11,
        vitaminB3: 0.7, vitaminB6: 1.2, vitaminB12: 0, folate: 3,
        omega3: 0, omega6: 0.2, saturatedFat: 0.1, monounsaturatedFat: 0, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.RAW, CookingMethod.SAUTEED, CookingMethod.ROASTED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 10, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et aéré, éviter réfrigérateur',
        preparationTips: ['Écraser pour libérer allicine', 'Ajouter en fin de cuisson', 'Germe central amovible'],
        healthBenefits: ['Allicine antimicrobienne', 'Santé cardiovasculaire', 'Système immunitaire', 'Propriétés détox'],
        verified: true, popularityScore: 96, imageUrl: 'assets/Aliments/ail.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.BUDGET
    },
    {
        id: 'turmeric',
        name: 'Curcuma',
        nameEn: 'Turmeric',
        category: FoodCategory.HERBS_SPICES,
        subcategory: 'Épices',
        description: 'Épice dorée aux puissantes propriétés anti-inflammatoires',
        calories: 354, protein: 7.8, carbs: 64.9, fat: 10, fiber: 21, sugar: 3.2,
        sodium: 38, potassium: 2525, calcium: 183, iron: 41.4, magnesium: 193,
        phosphorus: 268, zinc: 4.4, vitaminA: 0, vitaminC: 25.9, vitaminD: 0,
        vitaminE: 3.2, vitaminK: 13.4, vitaminB1: 0.15, vitaminB2: 0.23,
        vitaminB3: 5.1, vitaminB6: 1.8, vitaminB12: 0, folate: 7,
        omega3: 0.5, omega6: 1.7, saturatedFat: 3.1, monounsaturatedFat: 1.7, polyunsaturatedFat: 2.2,
        cookingMethods: [CookingMethod.SAUTEED, CookingMethod.BOILED, CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et sombre, conteneur hermétique',
        preparationTips: ['Avec poivre noir pour absorption', 'Dans graisses pour biodisponibilité', 'Frais plus puissant'],
        healthBenefits: ['Curcumine anti-inflammatoire', 'Antioxydant puissant', 'Santé hépatique', 'Neuroprotection'],
        verified: true, popularityScore: 91, imageUrl: 'assets/Aliments/curcuma.png',
        alternativeNames: ['Safran des Indes'], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },
    {
        id: 'ginger',
        name: 'Gingembre',
        nameEn: 'Ginger',
        category: FoodCategory.HERBS_SPICES,
        subcategory: 'Rhizomes',
        description: 'Rhizome piquant aux propriétés digestives et anti-inflammatoires',
        calories: 80, protein: 1.8, carbs: 17.8, fat: 0.8, fiber: 2, sugar: 1.7,
        sodium: 13, potassium: 415, calcium: 16, iron: 0.6, magnesium: 43,
        phosphorus: 34, zinc: 0.3, vitaminA: 0, vitaminC: 5, vitaminD: 0,
        vitaminE: 0.3, vitaminK: 0.1, vitaminB1: 0.03, vitaminB2: 0.03,
        vitaminB3: 0.75, vitaminB6: 0.16, vitaminB12: 0, folate: 11,
        omega3: 0, omega6: 0.2, saturatedFat: 0.2, monounsaturatedFat: 0.2, polyunsaturatedFat: 0.2,
        cookingMethods: [CookingMethod.RAW, CookingMethod.SAUTEED, CookingMethod.BOILED],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.KETO, DietaryRestriction.PALEO, DietaryRestriction.GLUTEN_FREE],
        glycemicIndex: 15, season: [Season.ALL_YEAR], storageMethod: 'Réfrigérateur 3 semaines, congélateur 6 mois',
        preparationTips: ['Peler avant utilisation', 'Râper finement', 'Infuser pour tisane'],
        healthBenefits: ['Gingérol anti-nausée', 'Digestion améliorée', 'Anti-inflammatoire', 'Réchauffant circulation'],
        verified: true, popularityScore: 89, imageUrl: 'assets/Aliments/gingembre.png',
        alternativeNames: [], origin: 'Agriculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.MODERATE
    },

    // ===== SUPPLÉMENTS =====
    {
        id: 'spirulina',
        name: 'Spiruline',
        nameEn: 'Spirulina',
        category: FoodCategory.SUPPLEMENTS,
        subcategory: 'Superaliments',
        description: 'Microalgue exceptionnellement riche en protéines et nutriments',
        calories: 290, protein: 57.5, carbs: 23.9, fat: 7.7, fiber: 3.6, sugar: 3.1,
        sodium: 1048, potassium: 1363, calcium: 120, iron: 28.5, magnesium: 195,
        phosphorus: 118, zinc: 2, vitaminA: 570, vitaminC: 10.1, vitaminD: 0,
        vitaminE: 5, vitaminK: 25.5, vitaminB1: 2.4, vitaminB2: 3.7,
        vitaminB3: 12.8, vitaminB6: 0.4, vitaminB12: 0, folate: 94,
        omega3: 0.8, omega6: 1.3, saturatedFat: 2.7, monounsaturatedFat: 0.7, polyunsaturatedFat: 2.1,
        cookingMethods: [CookingMethod.RAW],
        allergens: [], dietaryRestrictions: [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 0, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et frais, à l\'abri de la lumière',
        preparationTips: ['Commencer par petites doses', 'Mélanger à smoothies', 'Goût prononcé'],
        healthBenefits: ['Protéine complète végétale', 'Phycocyanine antioxydante', 'Fer très biodisponible', 'Détoxification'],
        verified: true, popularityScore: 78, imageUrl: 'assets/Aliments/algue.png',
        alternativeNames: ['Algue bleue'], origin: 'Aquaculture',
        sustainability: SustainabilityLevel.HIGH, priceRange: PriceRange.PREMIUM
    },
    {
        id: 'whey_protein',
        name: 'Protéine de lactosérum',
        nameEn: 'Whey protein',
        category: FoodCategory.SUPPLEMENTS,
        subcategory: 'Poudres protéinées',
        description: 'Protéine en poudre à absorption rapide pour sportifs',
        calories: 400, protein: 80, carbs: 8, fat: 5, fiber: 0, sugar: 4,
        sodium: 120, potassium: 200, calcium: 200, iron: 0.4, magnesium: 40,
        phosphorus: 150, zinc: 1.5, vitaminA: 0, vitaminC: 0, vitaminD: 0,
        vitaminE: 0, vitaminK: 0, vitaminB1: 0.1, vitaminB2: 0.5,
        vitaminB3: 1, vitaminB6: 0.1, vitaminB12: 1.2, folate: 10,
        omega3: 0, omega6: 0.1, saturatedFat: 3, monounsaturatedFat: 1.5, polyunsaturatedFat: 0.5,
        cookingMethods: [CookingMethod.RAW],
        allergens: [Allergen.DAIRY], dietaryRestrictions: [DietaryRestriction.VEGETARIAN, DietaryRestriction.HIGH_PROTEIN],
        glycemicIndex: 15, season: [Season.ALL_YEAR], storageMethod: 'Lieu sec et frais, bien fermé',
        preparationTips: ['Mélanger dans liquide froid', 'Post-workout idéal', '20-30g par portion'],
        healthBenefits: ['Récupération musculaire rapide', 'Synthèse protéique', 'Leucine élevée', 'Biodisponibilité excellente'],
        verified: true, popularityScore: 85, imageUrl: 'assets/Aliments/proteine-de-lactoserum.png',
        alternativeNames: ['Whey'], origin: 'Industrie laitière',
        sustainability: SustainabilityLevel.MEDIUM, priceRange: PriceRange.MODERATE
    }
];

// RÉGIMES PROFESSIONNELS
export const PROFESSIONAL_DIETS: CustomDiet[] = [
    {
        id: 'athletic_performance',
        name: 'Performance Athlétique',
        description: 'Régime optimisé pour les sportifs de haut niveau',
        calorieTarget: 2800,
        macroDistribution: {
            carbsPercentage: 55,
            proteinPercentage: 20,
            fatPercentage: 25,
            carbs: 385,
            protein: 140,
            fat: 78
        },
        restrictions: [DietaryRestriction.HIGH_PROTEIN],
        objectives: ['Performance sportive', 'Récupération optimale', 'Endurance'],
        difficulty: 'difficile',
        duration: 90,
        mealPlan: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
            macroBreakdown: { carbsPercentage: 55, proteinPercentage: 20, fatPercentage: 25, carbs: 385, protein: 140, fat: 78 }
        },
        tags: ['performance', 'athlète', 'endurance'],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'muscle_building',
        name: 'Prise de Masse',
        description: 'Programme nutritionnel pour développer la masse musculaire',
        calorieTarget: 3200,
        macroDistribution: {
            carbsPercentage: 45,
            proteinPercentage: 30,
            fatPercentage: 25,
            carbs: 360,
            protein: 240,
            fat: 89
        },
        restrictions: [DietaryRestriction.HIGH_PROTEIN],
        objectives: ['Prise de masse', 'Construction musculaire', 'Force'],
        difficulty: 'modéré',
        duration: 120,
        mealPlan: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
            macroBreakdown: { carbsPercentage: 45, proteinPercentage: 30, fatPercentage: 25, carbs: 360, protein: 240, fat: 89 }
        },
        tags: ['masse', 'musculation', 'force'],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'fat_loss',
        name: 'Perte de Graisse',
        description: 'Plan nutritionnel pour une perte de poids efficace',
        calorieTarget: 1800,
        macroDistribution: {
            carbsPercentage: 30,
            proteinPercentage: 40,
            fatPercentage: 30,
            carbs: 135,
            protein: 180,
            fat: 60
        },
        restrictions: [DietaryRestriction.HIGH_PROTEIN, DietaryRestriction.LOW_CARB],
        objectives: ['Perte de poids', 'Définition musculaire', 'Santé métabolique'],
        difficulty: 'modéré',
        duration: 84,
        mealPlan: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
            macroBreakdown: { carbsPercentage: 30, proteinPercentage: 40, fatPercentage: 30, carbs: 135, protein: 180, fat: 60 }
        },
        tags: ['perte de poids', 'définition', 'cut'],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// TEMPLATES DE REPAS
export const MEAL_TEMPLATES: PlannedMeal[] = [
    {
        id: 'power_breakfast',
        name: 'Petit-déjeuner Énergique',
        type: MealType.BREAKFAST,
        foods: [
            { foodId: 'oats', quantity: 80 },
            { foodId: 'banana', quantity: 120 },
            { foodId: 'almonds', quantity: 20 }
        ],
        description: 'Démarrez votre journée avec ce petit-déjeuner riche en fibres et protéines',
        totalCalories: 520,
        preparationTime: 10,
        difficulty: 'facile',
        tags: ['énergique', 'fibres', 'protéines']
    },
    {
        id: 'post_workout_meal',
        name: 'Repas Post-Entraînement',
        type: MealType.POST_WORKOUT,
        foods: [
            { foodId: 'chicken_breast', quantity: 150 },
            { foodId: 'quinoa', quantity: 100 },
            { foodId: 'broccoli', quantity: 200 }
        ],
        description: 'Récupération optimale après l\'entraînement',
        totalCalories: 680,
        preparationTime: 25,
        difficulty: 'modéré',
        tags: ['récupération', 'protéines', 'anti-inflammatoire']
    },
    {
        id: 'healthy_lunch',
        name: 'Déjeuner Équilibré',
        type: MealType.LUNCH,
        foods: [
            { foodId: 'salmon_atlantic', quantity: 120 },
            { foodId: 'spinach', quantity: 100 },
            { foodId: 'avocado', quantity: 50 }
        ],
        description: 'Repas complet riche en oméga-3 et nutriments essentiels',
        totalCalories: 410,
        preparationTime: 15,
        difficulty: 'facile',
        tags: ['équilibré', 'oméga-3', 'vitamines']
    }
];

// FONCTIONS UTILITAIRES POUR LA BASE DE DONNÉES
export class FoodDatabaseService {
    
    static getAllFoods(): Food[] {
        return FOOD_DATABASE;
    }

    static getFoodById(id: string): Food | undefined {
        return FOOD_DATABASE.find(food => food.id === id);
    }

    static getFoodsByCategory(category: FoodCategory): Food[] {
        return FOOD_DATABASE.filter(food => food.category === category);
    }

    static getFoodsByDietaryRestriction(restriction: DietaryRestriction): Food[] {
        return FOOD_DATABASE.filter(food => 
            food.dietaryRestrictions.includes(restriction)
        );
    }

    static searchFoods(query: string): Food[] {
        const searchTerms = query.toLowerCase().split(' ');
        return FOOD_DATABASE.filter(food => {
            const searchText = `${food.name} ${food.nameEn} ${food.description} ${food.alternativeNames.join(' ')}`.toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }

    static getFoodsByGlycemicIndex(maxGI: number): Food[] {
        return FOOD_DATABASE.filter(food => food.glycemicIndex <= maxGI);
    }

    static getFoodsBySeason(season: Season): Food[] {
        return FOOD_DATABASE.filter(food => 
            food.season.includes(season) || food.season.includes(Season.ALL_YEAR)
        );
    }

    static getHighProteinFoods(minProtein: number = 15): Food[] {
        return FOOD_DATABASE.filter(food => food.protein >= minProtein)
            .sort((a, b) => b.protein - a.protein);
    }

    static getLowCalorieFoods(maxCalories: number = 100): Food[] {
        return FOOD_DATABASE.filter(food => food.calories <= maxCalories)
            .sort((a, b) => a.calories - b.calories);
    }

    static getFoodsRichInNutrient(nutrient: keyof NutritionalValues, minAmount: number): Food[] {
        return FOOD_DATABASE.filter(food => (food[nutrient] as number) >= minAmount)
            .sort((a, b) => (b[nutrient] as number) - (a[nutrient] as number));
    }

    static calculateNutritionalValues(foodId: string, quantity: number): Partial<NutritionalValues> | null {
        const food = this.getFoodById(foodId);
        if (!food) return null;

        const multiplier = quantity / 100; // Les valeurs sont pour 100g
        
        return {
            calories: Math.round(food.calories * multiplier),
            protein: Math.round((food.protein * multiplier) * 10) / 10,
            carbs: Math.round((food.carbs * multiplier) * 10) / 10,
            fat: Math.round((food.fat * multiplier) * 10) / 10,
            fiber: Math.round((food.fiber * multiplier) * 10) / 10,
            sugar: Math.round((food.sugar * multiplier) * 10) / 10,
            sodium: Math.round(food.sodium * multiplier),
            potassium: Math.round(food.potassium * multiplier),
            calcium: Math.round(food.calcium * multiplier),
            iron: Math.round((food.iron * multiplier) * 100) / 100,
            vitaminC: Math.round((food.vitaminC * multiplier) * 10) / 10,
            omega3: Math.round((food.omega3 * multiplier) * 100) / 100
        };
    }

    static getFoodCompatibility(foodId: string, dietaryRestrictions: DietaryRestriction[]): boolean {
        const food = this.getFoodById(foodId);
        if (!food) return false;

        return dietaryRestrictions.every(restriction => 
            food.dietaryRestrictions.includes(restriction)
        );
    }

    static suggestAlternatives(foodId: string, restrictions: DietaryRestriction[] = []): Food[] {
        const originalFood = this.getFoodById(foodId);
        if (!originalFood) return [];

        return FOOD_DATABASE
            .filter(food => 
                food.id !== foodId &&
                food.category === originalFood.category &&
                (restrictions.length === 0 || this.getFoodCompatibility(food.id, restrictions))
            )
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, 5);
    }
}

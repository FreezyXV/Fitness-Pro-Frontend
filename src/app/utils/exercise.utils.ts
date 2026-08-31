// src/app/utils/exercise.utils.ts - Utilitaires pour les exercices
import { Exercise, ExerciseFilters, ExerciseDifficulty, ExerciseBodyPart } from '@shared';

export class ExerciseUtils {
  
  // Configuration des parties du corps
  static readonly BODY_PARTS = {
    chest: { label: 'Poitrine', icon: 'dumbbell', color: '#ff6384' },
    back: { label: 'Dos', icon: 'dumbbell', color: '#36a2eb' },
    arms: { label: 'Bras', icon: 'dumbbell', color: '#ffce56' },
    legs: { label: 'Jambes', icon: 'dumbbell', color: '#4bc0c0' },
    shoulders: { label: 'Épaules', icon: 'dumbbell', color: '#9966ff' },
    abs: { label: 'Abdominaux', icon: 'flame', color: '#ff9f40' },
    // `core` est l'autre nom employe par le catalogue pour la meme zone.
    core: { label: 'Abdominaux', icon: 'flame', color: '#ff9f40' },
    cardio: { label: 'Cardio', icon: 'flame', color: '#ff6384' },
    mobility: { label: 'Mobilité', icon: 'refresh', color: '#c9cbcf' },
    flexibility: { label: 'Flexibilité', icon: 'refresh', color: '#4bc0c0' }
  };

  // Configuration des niveaux de difficulté
  static readonly DIFFICULTIES = {
    beginner: { label: 'Débutant', icon: 'circle', color: '#4caf50' },
    intermediate: { label: 'Intermédiaire', icon: 'bolt', color: '#ff9800' },
    advanced: { label: 'Avancé', icon: 'flame', color: '#f44336' }
  };

  // Configuration des catégories
  static readonly CATEGORIES = {
    strength: { label: 'Force', icon: 'dumbbell', color: '#ff6384' },
    cardio: { label: 'Cardio', icon: 'flame', color: '#36a2eb' },
    flexibility: { label: 'Flexibilité', icon: 'refresh', color: '#ffce56' },
    hiit: { label: 'HIIT', icon: 'bolt', color: '#9966ff' },
    yoga: { label: 'Yoga', icon: 'moon', color: '#4bc0c0' },
    mobility: { label: 'Mobilité', icon: 'refresh', color: '#c9cbcf' }
  };

  /**
   * Obtient les informations d'une partie du corps
   */
  static getBodyPartInfo(bodyPart: string): { label: string; icon: string; color: string } {
    return this.BODY_PARTS[bodyPart as keyof typeof this.BODY_PARTS] || 
           { label: bodyPart, icon: 'dumbbell', color: '#71717a' };
  }

  /**
   * Obtient les informations d'un niveau de difficulté
   */
  static getDifficultyInfo(difficulty: string): { label: string; icon: string; color: string } {
    return this.DIFFICULTIES[difficulty as keyof typeof this.DIFFICULTIES] || 
           { label: difficulty, icon: 'circle', color: '#71717a' };
  }

  /**
   * Obtient les informations d'une catégorie
   */
  static getCategoryInfo(category: string): { label: string; icon: string; color: string } {
    return this.CATEGORIES[category as keyof typeof this.CATEGORIES] || 
           { label: category, icon: 'dumbbell', color: '#71717a' };
  }

  /**
   * Valide qu'un exercice est complet et valide
   */
  static validateExercise(exercise: Partial<Exercise>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!exercise.name || exercise.name.trim().length === 0) {
      errors.push('Le nom de l\'exercice est requis');
    }

    if (!exercise.bodyPart) {
      errors.push('La partie du corps est requise');
    } else if (!this.BODY_PARTS[exercise.bodyPart as keyof typeof this.BODY_PARTS]) {
      errors.push('Partie du corps invalide');
    }

    if (!exercise.difficulty) {
      errors.push('Le niveau de difficulté est requis');
    } else if (!this.DIFFICULTIES[exercise.difficulty as keyof typeof this.DIFFICULTIES]) {
      errors.push('Niveau de difficulté invalide');
    }

    if (exercise.duration && (exercise.duration < 1 || exercise.duration > 300)) {
      errors.push('La durée doit être entre 1 et 300 minutes');
    }

    if (exercise.estimatedCaloriesPerMinute && exercise.estimatedCaloriesPerMinute < 1) {
      errors.push('Les calories par minute doivent être positives');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Filtre une liste d'exercices selon les critères fournis
   */
  static filterExercises(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
    return exercises.filter(exercise => {
      // Filtre par recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          exercise.name.toLowerCase().includes(searchLower) ||
          exercise.description?.toLowerCase().includes(searchLower) ||
          exercise.bodyPart.toLowerCase().includes(searchLower) ||
          exercise.category?.toLowerCase().includes(searchLower) ||
          exercise.muscleGroups?.some(muscle => 
            muscle.toLowerCase().includes(searchLower)
          );
        
        if (!matchesSearch) return false;
      }

      // Filtre par partie du corps
      if (filters.bodyPart && exercise.bodyPart !== filters.bodyPart) {
        return false;
      }

      // Filtre par difficulté
      if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
        return false;
      }

      // Filtre par catégorie
      if (filters.category && exercise.category !== filters.category) {
        return false;
      }

      // Filtre par durée
      if (filters.duration) {
        const duration = exercise.duration || 0;
        switch (filters.duration) {
          case 'short':
            if (duration > 15) return false;
            break;
          case 'medium':
            if (duration <= 15 || duration > 30) return false;
            break;
          case 'long':
            if (duration <= 30) return false;
            break;
        }
      }

      // Filtre par équipement
      if (filters.equipment) {
        if (filters.equipment === 'none') {
          const equipment = exercise.equipmentNeeded?.toLowerCase() || '';
          if (equipment && equipment !== 'none' && equipment !== 'aucun' && equipment !== '') {
            return false;
          }
        } else {
          if (!exercise.equipmentNeeded?.toLowerCase().includes(filters.equipment.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Trie une liste d'exercices
   */
  static sortExercises(
    exercises: Exercise[], 
    sortBy: string = 'name', 
    direction: 'asc' | 'desc' = 'asc'
  ): Exercise[] {
    const multiplier = direction === 'desc' ? -1 : 1;

    return [...exercises].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          valueA = difficultyOrder[a.difficulty];
          valueB = difficultyOrder[b.difficulty];
          break;
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'duration':
          valueA = a.duration || 0;
          valueB = b.duration || 0;
          break;
        case 'bodyPart':
          valueA = a.bodyPart.toLowerCase();
          valueB = b.bodyPart.toLowerCase();
          break;
        case 'category':
          valueA = (a.category || '').toLowerCase();
          valueB = (b.category || '').toLowerCase();
          break;
        default:
          valueA = a[sortBy as keyof Exercise] || '';
          valueB = b[sortBy as keyof Exercise] || '';
      }

      if (valueA == null) return multiplier;
      if (valueB == null) return -multiplier;

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * multiplier;
      }

      return (valueA < valueB ? -1 : valueA > valueB ? 1 : 0) * multiplier;
    });
  }

  /**
   * Calcule les calories brûlées pour un exercice
   */
  static calculateCaloriesBurned(exercise: Exercise, durationMinutes: number): number {
    if (!exercise.estimatedCaloriesPerMinute || durationMinutes <= 0) {
      return 0;
    }

    return Math.round(exercise.estimatedCaloriesPerMinute * durationMinutes);
  }

  /**
   * Obtient des exercices similaires
   */
  static getSimilarExercises(exercise: Exercise, allExercises: Exercise[], limit: number = 4): Exercise[] {
    return allExercises
      .filter(ex => 
        ex.id !== exercise.id && 
        (ex.bodyPart === exercise.bodyPart || ex.category === exercise.category)
      )
      .sort((a, b) => {
        // Priorité aux exercices de la même partie du corps
        const aBodyPartMatch = a.bodyPart === exercise.bodyPart ? 1 : 0;
        const bBodyPartMatch = b.bodyPart === exercise.bodyPart ? 1 : 0;
        
        if (aBodyPartMatch !== bBodyPartMatch) {
          return bBodyPartMatch - aBodyPartMatch;
        }

        // Ensuite par difficulté similaire
        const aDiffMatch = a.difficulty === exercise.difficulty ? 1 : 0;
        const bDiffMatch = b.difficulty === exercise.difficulty ? 1 : 0;
        
        return bDiffMatch - aDiffMatch;
      })
      .slice(0, limit);
  }

  /**
   * Génère un résumé statistique d'une liste d'exercices
   */
  static generateStats(exercises: Exercise[]) {
    const stats = {
      total: exercises.length,
      byBodyPart: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      withVideo: 0,
      averageDuration: 0,
      totalEstimatedCalories: 0
    };

    let totalDuration = 0;
    let exercisesWithDuration = 0;
    let totalCalories = 0;
    let exercisesWithCalories = 0;

    exercises.forEach(exercise => {
      // Comptage par partie du corps
      stats.byBodyPart[exercise.bodyPart] = (stats.byBodyPart[exercise.bodyPart] || 0) + 1;

      // Comptage par difficulté
      stats.byDifficulty[exercise.difficulty] = (stats.byDifficulty[exercise.difficulty] || 0) + 1;

      // Comptage par catégorie
      if (exercise.category) {
        stats.byCategory[exercise.category] = (stats.byCategory[exercise.category] || 0) + 1;
      }

      // Comptage des vidéos
      if (exercise.videoUrl) {
        stats.withVideo++;
      }

      // Calcul de la durée moyenne
      if (exercise.duration) {
        totalDuration += exercise.duration;
        exercisesWithDuration++;
      }

      // Calcul des calories moyennes
      if (exercise.estimatedCaloriesPerMinute) {
        totalCalories += exercise.estimatedCaloriesPerMinute;
        exercisesWithCalories++;
      }
    });

    stats.averageDuration = exercisesWithDuration > 0 ? Math.round(totalDuration / exercisesWithDuration) : 0;
    stats.totalEstimatedCalories = exercisesWithCalories > 0 ? Math.round(totalCalories / exercisesWithCalories) : 0;

    return stats;
  }

  /**
   * Formate la durée en format lisible
   */
  static formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return '0 min';

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Formate l'équipement requis
   */
  static formatEquipment(equipment?: string): string {
    if (!equipment || equipment.toLowerCase() === 'none' || equipment.toLowerCase() === 'aucun') {
      return 'Aucun équipement';
    }

    return equipment;
  }

  /**
   * Génère des suggestions de recherche
   */
  static generateSearchSuggestions(exercises: Exercise[], query: string, limit: number = 6): string[] {
    if (!query || query.length < 2) return [];

    const queryLower = query.toLowerCase();
    const suggestions = new Set<string>();

    // Noms d'exercices
    exercises.forEach(exercise => {
      if (exercise.name.toLowerCase().includes(queryLower)) {
        suggestions.add(exercise.name);
      }
    });

    // Parties du corps
    Object.entries(this.BODY_PARTS).forEach(([key, value]) => {
      if (value.label.toLowerCase().includes(queryLower)) {
        suggestions.add(value.label);
      }
    });

    // Catégories
    Object.entries(this.CATEGORIES).forEach(([key, value]) => {
      if (value.label.toLowerCase().includes(queryLower)) {
        suggestions.add(value.label);
      }
    });

    // Groupes musculaires
    const muscleGroups = new Set<string>();
    exercises.forEach(exercise => {
      exercise.muscleGroups?.forEach(muscle => {
        if (muscle.toLowerCase().includes(queryLower)) {
          muscleGroups.add(muscle);
        }
      });
    });

    muscleGroups.forEach(muscle => suggestions.add(muscle));

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Crée un plan d'entraînement à partir d'exercices
   */
  static createWorkoutPlan(
    exercises: Exercise[], 
    name: string, 
    targetDuration?: number
  ): {
    name: string;
    exercises: Exercise[];
    estimatedDuration: number;
    estimatedCalories: number;
    difficulty: ExerciseDifficulty;
  } {
    let selectedExercises = [...exercises];
    
    // Si une durée cible est spécifiée, sélectionner les exercices en conséquence
    if (targetDuration) {
      selectedExercises = this.selectExercisesForDuration(exercises, targetDuration);
    }

    const estimatedDuration = selectedExercises.reduce((total, ex) => total + (ex.duration || 0), 0);
    const estimatedCalories = selectedExercises.reduce((total, ex) => 
      total + this.calculateCaloriesBurned(ex, ex.duration || 0), 0
    );

    // Déterminer la difficulté globale
    const difficulties = selectedExercises.map(ex => ex.difficulty);
    const difficultyMode = this.getMostFrequent(difficulties) as ExerciseDifficulty;

    return {
      name,
      exercises: selectedExercises,
      estimatedDuration,
      estimatedCalories,
      difficulty: difficultyMode
    };
  }

  /**
   * Sélectionne des exercices pour atteindre une durée cible
   */
  private static selectExercisesForDuration(exercises: Exercise[], targetDuration: number): Exercise[] {
    const selected: Exercise[] = [];
    let currentDuration = 0;

    // Trier par durée croissante
    const sortedExercises = [...exercises].sort((a, b) => (a.duration || 0) - (b.duration || 0));

    for (const exercise of sortedExercises) {
      const exerciseDuration = exercise.duration || 0;
      if (currentDuration + exerciseDuration <= targetDuration) {
        selected.push(exercise);
        currentDuration += exerciseDuration;
      }

      if (currentDuration >= targetDuration * 0.9) { // 90% de la durée cible
        break;
      }
    }

    return selected;
  }

  /**
   * Trouve l'élément le plus fréquent dans un tableau
   */
  private static getMostFrequent<T>(array: T[]): T | null {
    if (array.length === 0) return null;

    const frequency: Record<string, number> = {};
    let maxCount = 0;
    let mostFrequent: T = array[0];

    array.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
      
      if (frequency[key] > maxCount) {
        maxCount = frequency[key];
        mostFrequent = item;
      }
    });

    return mostFrequent;
  }

  /**
   * Normalise un exercice pour assurer la cohérence des données
   */
  static normalizeExercise(exercise: Partial<Exercise>): Exercise {
    return {
      id: exercise.id || 0,
      name: exercise.name?.trim() || '',
      description: exercise.description?.trim() || '',
      bodyPart: exercise.bodyPart || 'general',
      difficulty: exercise.difficulty || 'beginner',
      duration: exercise.duration && exercise.duration > 0 ? exercise.duration : undefined,
      muscleGroups: Array.isArray(exercise.muscleGroups) ? exercise.muscleGroups : [],
      equipmentNeeded: exercise.equipmentNeeded?.trim() || undefined,
      videoUrl: exercise.videoUrl?.trim() || undefined,
      instructions: Array.isArray(exercise.instructions) ? exercise.instructions : [],
      tips: Array.isArray(exercise.tips) ? exercise.tips : [],
      category: exercise.category?.trim() || undefined,
      estimatedCaloriesPerMinute: exercise.estimatedCaloriesPerMinute && exercise.estimatedCaloriesPerMinute > 0 
        ? exercise.estimatedCaloriesPerMinute 
        : undefined,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      isFavorite: exercise.isFavorite || false
    } as Exercise;
  }

  /**
   * Vérifie si un URL de vidéo est valide
   */
  static isValidVideoUrl(url: string): boolean {
    if (!url) return false;

    // URLs locales (assets)
    if (url.startsWith('/assets/') || url.startsWith('assets/')) {
      return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
    }

    // URLs externes
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Il n'existe plus qu'une URL par exercice : la resolution est centralisee
   * dans exercise-media.ts. Cette methode enumerait des variantes de nom de
   * fichier pour deviner un chemin local, ce qui n'a plus d'objet.
   */
  static generateAlternativeVideoUrls(originalUrl: string): string[] {
    return originalUrl ? [originalUrl] : [];
  }
}

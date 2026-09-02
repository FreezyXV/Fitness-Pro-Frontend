// src/app/shared/index.ts - RE-EXPORTS INTERFACES AND EXPORTS APP_CONFIG/UTILITIES

// ==============================================
// APP CONFIGURATION
// ==============================================
import { environment } from '../../environments/environment';
import type { User } from './models/app.models';

export const APP_CONFIG = {
  APP_NAME: environment.appName,
  API_URL: environment.apiUrl,
  TOKEN_KEY: 'fitness_token',
  USER_KEY: 'fitness_user',
  REFRESH_TOKEN_KEY: 'fitness_refresh_token',
  VERSION: environment.appVersion,

  // Timeouts et retry
  REQUEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // UI Configuration
  UI_CONFIG: {
    DEBOUNCE_DELAY: 300,
    NOTIFICATION_DURATION: 3000,
    AUTO_LOGOUT_TIME: 30 * 60 * 1000, // 30 minutes
  },

  // Storage keys
  STORAGE_KEYS: {
    EXERCISES_FAVORITES: 'exercises_favorites',
    EXERCISES_FILTERS: 'exercises_filters',
    USER_PREFERENCES: 'user_preferences',
    GUEST_MODE: 'is_guest_mode',
  },

  // Exercise Configuration - ICÔNES CORRIGÉES
  // `icon` designe une entree du jeu d'icones de l'application
  // (voir IconName dans shared/components/icon), plus un emoji.
  //
  // Ces tables alimentaient les pastilles de categorie, de difficulte et de
  // zone musculaire affichees sur chaque carte : une grille de douze
  // exercices posait donc douze emoji polychromes — biceps, coeurs, montagne,
  // ronds rouges et verts — sur une interface par ailleurs monochrome. Un
  // rond rouge n'est de surcroit pas une information lisible : il ne dit ni
  // « avance », ni pourquoi, et disparait pour qui ne distingue pas le rouge
  // du vert.
  EXERCISE_CONFIG: {
    BODY_PARTS: [
      { value: 'chest', label: 'Poitrine', icon: 'dumbbell', color: '#ff6384' },
      { value: 'back', label: 'Dos', icon: 'dumbbell', color: '#36a2eb' },
      { value: 'arms', label: 'Bras', icon: 'dumbbell', color: '#ffce56' },
      { value: 'legs', label: 'Jambes', icon: 'dumbbell', color: '#4bc0c0' },
      { value: 'shoulders', label: 'Épaules', icon: 'dumbbell', color: '#9966ff' },
      { value: 'abs', label: 'Abdominaux', icon: 'flame', color: '#ff9f40' },
      // Le catalogue renvoie indifferemment `abs` ou `core` pour la meme
      // zone : sans cette entree, la puce affichait « core » en clair.
      { value: 'core', label: 'Abdominaux', icon: 'flame', color: '#ff9f40' },
      { value: 'cardio', label: 'Cardio', icon: 'flame', color: '#ff6384' },
      { value: 'mobility', label: 'Mobilité', icon: 'refresh', color: '#c9cbcf' },
      {
        value: 'flexibility',
        label: 'Flexibilité',
        icon: 'refresh',
        color: '#a29bfe',
      },
    ],
    DIFFICULTIES: [
      { value: 'beginner', label: 'Débutant', icon: 'circle', color: '#4caf50' },
      {
        value: 'intermediate',
        label: 'Intermédiaire',
        icon: 'bolt',
        color: '#fdba74',
      },
      { value: 'advanced', label: 'Avancé', icon: 'flame', color: '#fc8181' },
    ],
    CATEGORIES: [
      { value: 'strength', label: 'Force', icon: 'dumbbell', color: '#ff6384' },
      { value: 'cardio', label: 'Cardio', icon: 'flame', color: '#36a2eb' },
      {
        value: 'flexibility',
        label: 'Flexibilité',
        icon: 'refresh',
        color: '#ffce56',
      },
      { value: 'hiit', label: 'HIIT', icon: 'bolt', color: '#9966ff' },
      { value: 'yoga', label: 'Yoga', icon: 'moon', color: '#4bc0c0' },
      { value: 'mobility', label: 'Mobilité', icon: 'refresh', color: '#74b9ff' },
    ],
    DURATIONS: [
      { value: 'short', label: '≤ 15 min', min: 5, max: 15 },
      { value: 'medium', label: '16-30 min', min: 15, max: 30 },
      { value: 'long', label: '> 30 min', min: 30 },
    ],
  },

  // Workout Categories - ICÔNES CORRIGÉES
  WORKOUT_CATEGORIES: [
    { value: 'strength', label: 'Force', icon: 'dumbbell', color: '#ff6384' },
    { value: 'cardio', label: 'Cardio', icon: 'flame', color: '#36a2eb' },
    {
      value: 'flexibility',
      label: 'Flexibilité',
      icon: 'refresh',
      color: '#ffce56',
    },
    { value: 'hiit', label: 'HIIT', icon: 'bolt', color: '#9966ff' },
  ],

  DIFFICULTY_LEVELS: [
    { value: 'beginner', label: 'Débutant', color: '#4caf50' },
    { value: 'intermediate', label: 'Intermédiaire', color: '#fdba74' },
    { value: 'advanced', label: 'Avancé', color: '#fc8181' },
  ],

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Video Configuration
  VIDEO_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
};

// ==============================================
// CORE INTERFACES - RE-EXPORTED FROM app.models.ts
// ==============================================
export * from './models/app.models';

// ==============================================
// UTILITY CLASSES
// ==============================================

export class BMIUtils {
  static calculate(height: number, weight: number): number {
    // Validation des entrées
    if (!height || !weight || height <= 0 || weight <= 0) {
      return 0;
    }

    // Vérification des limites réalistes
    if (height < 50 || height > 300) {
      return 0;
    }

    if (weight < 10 || weight > 500) {
      return 0;
    }

    try {
      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      const result = parseFloat(bmi.toFixed(1));

      return result;
    } catch (error) {
      return 0;
    }
  }

  static getStatus(bmi: number): string {
    if (!bmi || bmi === 0 || isNaN(bmi)) return 'Non calculé';

    if (bmi < 18.5) return 'Sous-poids';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Surpoids';
    return 'Obésité';
  }

  static getColor(bmi: number): string {
    // Teintes calibrees pour le fond SOMBRE de l'app : les valeurs
    // precedentes (#a8a8b0, #7ecbff, #fc8181) tombaient entre 3,6:1 et 4,0:1.
    if (!bmi || bmi === 0 || isNaN(bmi)) return '#d4d4d8'; // = $text-secondary, etat neutre

    if (bmi < 18.5) return '#7aa9ff'; // bleu, insuffisance ponderale
    if (bmi < 25) return '#34d399';   // vert, intervalle de reference
    if (bmi < 30) return '#fdba74';   // ambre
    return '#ff7a7a';                 // rouge
  }

  static getPosition(bmi: number): number {
    if (!bmi || bmi === 0 || isNaN(bmi)) return 0;

    // Scale: 15-35 BMI range mapped to 0-100%
    const minBMI = 15;
    const maxBMI = 35;
    const normalizedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));

    const position = ((normalizedBMI - minBMI) / (maxBMI - minBMI)) * 100;
    return Math.round(position);
  }

  static getIdealWeightRange(height: number): { min: number; max: number } {
    if (!height || height <= 0) {
      return { min: 0, max: 0 };
    }

    try {
      const heightM = height / 100;
      const min = Math.round(18.5 * heightM * heightM);
      const max = Math.round(24.9 * heightM * heightM);

      return { min, max };
    } catch (error) {
      return { min: 0, max: 0 };
    }
  }

  static getRecommendation(bmi: number): string {
    if (!bmi || bmi === 0 || isNaN(bmi)) {
      return 'Renseignez votre taille et poids pour obtenir des recommandations.';
    }

    if (bmi < 18.5) {
      return 'Votre IMC indique un sous-poids. Consultez un professionnel de santé pour établir un plan nutritionnel adapté.';
    }
    if (bmi < 25) {
      return 'Votre IMC est dans la normale. Maintenez vos bonnes habitudes alimentaires et votre activité physique !';
    }
    if (bmi < 30) {
      return 'Votre IMC indique un surpoids. Une activité physique régulière et une alimentation équilibrée sont recommandées.';
    }
    return 'Votre IMC indique une obésité. Il est fortement recommandé de consulter un professionnel de santé.';
  }

  static getBMIStatusClass(bmi: number): string {
    const status = BMIUtils.getStatus(bmi);
    return status
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace('souspoids', 'souspoids')
      .replace('surpoids', 'surpoids')
      .replace('obésité', 'obesite')
      .replace('noncalculé', 'noncalcule');
  }

  static getBMIRanges(): Array<{
    label: string;
    range: string;
    color: string;
  }> {
    return [
      { label: 'Sous-poids', range: '< 18.5', color: '#7ecbff' },
      { label: 'Normal', range: '18.5 - 24.9', color: '#d4ff3d' },
      { label: 'Surpoids', range: '25 - 29.9', color: '#fdba74' },
      { label: 'Obésité', range: '≥ 30', color: '#fc8181' },
    ];
  }

  static isCurrentBMIRange(
    bmi: number,
    range: { label: string; range: string; color: string }
  ): boolean {
    if (!bmi || isNaN(bmi)) return false;

    if (range.label === 'Sous-poids') return bmi < 18.5;
    if (range.label === 'Normal') return bmi >= 18.5 && bmi < 25;
    if (range.label === 'Surpoids') return bmi >= 25 && bmi < 30;
    if (range.label === 'Obésité') return bmi >= 30;
    return false;
  }
}

export class DateUtils {
  static formatDate(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Date invalide';
      return d.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  }

  static formatDateTime(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Date invalide';
      return (
        d.toLocaleDateString('fr-FR') +
        ' ' +
        d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (error) {
      return 'Date invalide';
    }
  }

  static getTimeAgo(date: string | Date): string {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Date invalide';

      const now = new Date();
      const diff = now.getTime() - d.getTime();

      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
      if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
      if (minutes > 0)
        return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      return "À l'instant";
    } catch (error) {
      return 'Date invalide';
    }
  }

  static isToday(date: string | Date): boolean {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return false;

      const today = new Date();
      return d.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  }

  static getDaysBetween(
    startDate: string | Date,
    endDate: string | Date
  ): number {
    try {
      const start =
        typeof startDate === 'string' ? new Date(startDate) : startDate;
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  }

  static formatDuration(minutes: number): string {
    if (!minutes || minutes < 0) return '0 min';

    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  }

  static addDays(date: Date, days: number): Date {
    try {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    } catch (error) {
      return new Date();
    }
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    try {
      if (!date1 || !date2) return false;
      if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    } catch (error) {
      return false;
    }
  }
}

export * from '../utils/workout.utils';

export class FormUtils {
  static parseUserName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  }

  static formatUserName(firstName: string, lastName: string): string {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();
    return `${first} ${last}`.trim();
  }

  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return { valid: false, errors: ['Mot de passe requis'], score: 0 };
    }

    if (password.length < 8) errors.push('Au moins 8 caractères');
    else score++;

    if (!/[A-Z]/.test(password)) errors.push('Une majuscule');
    else score++;

    if (!/[a-z]/.test(password)) errors.push('Une minuscule');
    else score++;

    if (!/\d/.test(password)) errors.push('Un chiffre');
    else score++;

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      errors.push('Un caractère spécial');
    else score++;

    return {
      valid: errors.length === 0,
      errors,
      score: Math.max(1, score),
    };
  }

  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  }
}

export class GuestProfileUtils {
  // Persona fictive utilisee pour remplir le profil du compte invite,
  // qui arrive du backend sans donnees personnelles.
  private static readonly BIRTH_DATE = '1997-03-10';

  static applyDefaults(user: User): User {
    if (!user) return user;

    return {
      ...user,
      name: 'Alex Moreau',
      dateOfBirth: user.dateOfBirth || this.BIRTH_DATE,
      age: user.age ?? this.calculateAge(this.BIRTH_DATE),
      gender: user.gender || 'male',
      height: user.height || 178,
      weight: user.weight || 74,
      bloodGroup: user.bloodGroup || 'O+',
      activityLevel: user.activityLevel || 'moderately_active',
      location: user.location || 'Paris, France',
      bio:
        user.bio ||
        'Passionné de fitness, toujours partant pour tester un nouveau programme.',
    };
  }

  private static calculateAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}

export class StorageUtils {
  // Memory fallback for environments where localStorage isn't available
  private static memoryStorage: { [key: string]: string } = {};

  static setItem<T>(key: string, value: T): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        // Fallback to memory storage
        this.memoryStorage[key] = JSON.stringify(value);
      }
    } catch (error) {
      // Try memory storage as fallback
      try {
        this.memoryStorage[key] = JSON.stringify(value);
      } catch (memoryError) {}
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      let item: string | null = null;

      if (this.isLocalStorageAvailable()) {
        item = localStorage.getItem(key);
      } else {
        // Fallback to memory storage
        item = this.memoryStorage[key] || null;
      }

      return item ? JSON.parse(item) : null;
    } catch (error) {
      // Try memory storage as fallback
      try {
        const item = this.memoryStorage[key];
        return item ? JSON.parse(item) : null;
      } catch (memoryError) {
        return null;
      }
    }
  }

  static removeItem(key: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      }
      // Also remove from memory storage
      delete this.memoryStorage[key];
    } catch (error) {
      // At least clear from memory
      delete this.memoryStorage[key];
    }
  }

  static clear(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.clear();
      }
      // Clear memory storage too
      this.memoryStorage = {};
    } catch (error) {
      // At least clear memory
      this.memoryStorage = {};
    }
  }

  static isAvailable(): boolean {
    return this.isLocalStorageAvailable();
  }

  private static isLocalStorageAvailable(): boolean {
    try {
      if (
        typeof window === 'undefined' ||
        typeof localStorage === 'undefined'
      ) {
        return false;
      }

      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getStorageInfo(): {
    type: 'localStorage' | 'memory';
    available: boolean;
    keys: number;
    sizeEstimate?: number;
  } {
    const isLocalStorageAvailable = this.isLocalStorageAvailable();

    if (isLocalStorageAvailable) {
      let keys = 0;
      let sizeEstimate = 0;

      try {
        keys = localStorage.length;
        // Rough size estimate
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            sizeEstimate += key.length + (value?.length || 0);
          }
        }
      } catch (error) {}

      return {
        type: 'localStorage',
        available: true,
        keys,
        sizeEstimate,
      };
    } else {
      return {
        type: 'memory',
        available: true,
        keys: Object.keys(this.memoryStorage).length,
      };
    }
  }

  // Helper method to check if we're using memory storage
  static isUsingMemoryStorage(): boolean {
    return !this.isLocalStorageAvailable();
  }

  // Get all keys from current storage
  static getAllKeys(): string[] {
    if (this.isLocalStorageAvailable()) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } else {
      return Object.keys(this.memoryStorage);
    }
  }

  // Check if a key exists
  static hasItem(key: string): boolean {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(key) !== null;
    } else {
      return key in this.memoryStorage;
    }
  }
}


export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    return FormUtils.validateEmail(email);
  }

  static isValidAge(age: number): boolean {
    return age >= 13 && age <= 120;
  }

  static isValidHeight(height: number): boolean {
    return height >= 100 && height <= 250;
  }

  static isValidWeight(weight: number): boolean {
    return weight >= 30 && weight <= 300;
  }

  static isValidBMI(bmi: number): boolean {
    return bmi > 0 && bmi < 100;
  }
}

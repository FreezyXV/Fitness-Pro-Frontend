// shared/utils/challenge.utils.ts - Enhanced Utility Functions
import {
  Challenge,
  ChallengeDifficulty,
  ChallengeCategory,
  UserChallengeData,
  ChallengeStatus,
  NotificationPayload
} from '@shared';
import { DateUtils } from '@shared';
  
  // =============================================
  // CHALLENGE UTILITIES (Using shared DateUtils)
  // =============================================
  export class ChallengeUtils {
    static calculateProgress(current: number, target: number): number {
      if (target === 0) return 0;
      return Math.min(100, Math.round((current / target) * 100));
    }
  
    static calculatePoints(progress: number, maxPoints: number): number {
      return Math.round((progress / 100) * maxPoints);
    }
  
    static isCompleted(challenge: Challenge): boolean {
      return challenge.status === 'completed' || challenge.currentProgress >= challenge.target;
    }
  
    static canJoin(challenge: Challenge): boolean {
      return challenge.status === 'available' && 
             !challenge.isJoined && 
             !this.isFull(challenge) &&
             !this.isExpired(challenge.endDate);
    }

    static isExpired(endDate: Date | string): boolean {
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      return new Date() > end;
    }

    static getDaysRemaining(endDate: Date | string): number {
      return DateUtils.getDaysBetween(new Date(), endDate);
    }
  
    static isFull(challenge: Challenge): boolean {
      return !!(challenge.maxParticipants && challenge.participants >= challenge.maxParticipants);
    }
  
    static getProgressColor(progress: number): string {
      if (progress < 30) return '#ef4444'; // Red
      if (progress < 70) return '#f59e0b'; // Yellow
      return '#10b981'; // Green
    }
  
    static getProgressGradient(progress: number): string {
      if (progress < 30) {
        return 'linear-gradient(90deg, #ef4444, #f97316)';
      } else if (progress < 70) {
        return 'linear-gradient(90deg, #f59e0b, #eab308)';
      } else {
        return 'linear-gradient(90deg, #10b981, #059669)';
      }
    }
  
    static getDifficultyConfig(difficulty: ChallengeDifficulty) {
      const configs = {
        easy: {
          label: 'Facile',
          emoji: '🟢',
          color: '#10b981',
          description: 'Parfait pour débuter',
          timeCommitment: '15-30 min/jour',
          pointMultiplier: 1
        },
        medium: {
          label: 'Moyen',
          emoji: '🟡',
          color: '#f59e0b',
          description: 'Un défi modéré',
          timeCommitment: '30-60 min/jour',
          pointMultiplier: 1.5
        },
        hard: {
          label: 'Difficile',
          emoji: '🔴',
          color: '#ff7a7a',
          description: 'Pour les plus motivés',
          timeCommitment: '60+ min/jour',
          pointMultiplier: 2
        }
      };
      return configs[difficulty];
    }
  
    static getCategoryConfig(category: ChallengeCategory) {
      const configs = {
        // Ces teintes servent de COULEUR DE TEXTE sur le fond sombre de
        // l'app. Les valeurs Material d'origine (#34a853, #4285f4, #9c27b0,
        // #795548, #607d8b…) sont calibrees pour un fond blanc et tombaient
        // entre 1,9:1 et 3,6:1 ici, sous le seuil AA de 4,5:1. Les teintes
        // sont conservees, seule la luminosite est remontee.
        // `icon` designe une entree du jeu d'icones de l'application.
        fitness: { label: 'Fitness', icon: 'dumbbell', color: '#f28b82' },
        wellness: { label: 'Bien-être', icon: 'moon', color: '#a3d9a5' },
        cardio: { label: 'Cardio', icon: 'flame', color: '#fbbc04' },
        strength: { label: 'Force', icon: 'dumbbell', color: '#5bd47c' },
        nutrition: { label: 'Nutrition', icon: 'utensils', color: '#7aa9ff' },
        mindfulness: { label: 'Méditation', icon: 'bulb', color: '#d17ae0' },
        social: { label: 'Social', icon: 'users', color: '#ffb454' },
        flexibility: { label: 'Souplesse', icon: 'refresh', color: '#ff6f9c' },
        endurance: { label: 'Endurance', icon: 'trending', color: '#c89b86' },
        balance: { label: 'Équilibre', icon: 'target', color: '#9db8c6' }
      };
      return configs[category] || configs.fitness;
    }
  
    static getStatusConfig(status: ChallengeStatus) {
      const configs = {
        draft: { label: 'Brouillon', emoji: '📝', color: '#a8a8b0' },
        available: { label: 'Disponible', emoji: '🚀', color: '#3b82f6' },
        active: { label: 'En cours', emoji: '⚡', color: '#10b981' },
        completed: { label: 'Terminé', emoji: '✅', color: '#a8a8b0' },
        expired: { label: 'Expiré', emoji: '⏰', color: '#ef4444' },
        paused: { label: 'En pause', emoji: '⏸️', color: '#f59e0b' },
        cancelled: { label: 'Annulé', emoji: '❌', color: '#ef4444' }
      };
      return configs[status];
    }
  
    static generateSlug(title: string): string {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
    }
  
    static estimateCompletionTime(challenge: Challenge): string {
      const config = this.getDifficultyConfig(challenge.difficulty);
      const totalDays = challenge.duration;
      const dailyTime = config.timeCommitment;
      
      return `${totalDays} jours • ${dailyTime}`;
    }
  
    static calculateRecommendedPoints(challenge: Challenge): number {
      const basePoints = 50;
      const difficultyMultiplier = this.getDifficultyConfig(challenge.difficulty).pointMultiplier;
      const durationMultiplier = Math.min(challenge.duration / 7, 4); // Max 4x for duration
      
      return Math.round(basePoints * difficultyMultiplier * durationMultiplier);
    }
  
    static validateChallenge(challenge: Partial<Challenge>): { isValid: boolean; errors: string[] } {
      const errors: string[] = [];
  
      if (!challenge.title || challenge.title.length < 3) {
        errors.push('Le titre doit contenir au moins 3 caractères');
      }
  
      if (!challenge.description || challenge.description.length < 10) {
        errors.push('La description doit contenir au moins 10 caractères');
      }
  
      if (!challenge.target || challenge.target <= 0) {
        errors.push('L\'objectif doit être supérieur à 0');
      }
  
      if (challenge.startDate && challenge.endDate) {
        const start = new Date(challenge.startDate);
        const end = new Date(challenge.endDate);
        
        if (end <= start) {
          errors.push('La date de fin doit être postérieure à la date de début');
        }
  
        if (start < new Date()) {
          errors.push('La date de début ne peut pas être dans le passé');
        }
      }
  
      if (challenge.maxParticipants && challenge.maxParticipants < 1) {
        errors.push('Le nombre maximum de participants doit être au moins 1');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }
  
  // =============================================
  // NOTIFICATION UTILITIES
  // =============================================
  export class NotificationUtils {
    private static container: HTMLElement | null = null;
  
    static init(): void {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        `;
        document.body.appendChild(this.container);
      }
    }
  
    static success(message: string, duration: number = 4000): void {
      this.show({ type: 'success', message, duration });
    }
  
    static error(message: string, duration: number = 5000): void {
      this.show({ type: 'error', message, duration });
    }
  
    static warning(message: string, duration: number = 4000): void {
      this.show({ type: 'warning', message, duration });
    }
  
    static info(message: string, duration: number = 3000): void {
      this.show({ type: 'info', message, duration });
    }
  
    /**
     * Bandeau de notification.
     *
     * Il etait construit par `innerHTML` avec une trentaine de proprietes CSS
     * ecrites en dur : degrade vert-emeraude ou rouge selon le type, texte
     * blanc, ombre portee de 30 px, `backdrop-filter`, croix de fermeture en
     * `onclick=""`. C'etait le seul element de l'application a ne suivre
     * aucune de ses conventions — et il s'affiche PAR-DESSUS n'importe quel
     * ecran, donc a cote de la mise en page qu'il contredit.
     *
     * Il est desormais construit par le DOM plutot que par concatenation de
     * chaines : le message vient d'un catalogue interne aujourd'hui, mais
     * `textContent` garantit qu'aucun libelle ne pourra jamais etre interprete
     * comme du balisage.
     */
    private static show(options: { type: string; message: string; duration: number }): void {
      this.init();

      // Couleur d'accent du bandeau, reprise des tokens de statut. Elle ne
      // sert qu'a un liseré : le fond reste la surface sombre des cartes,
      // comme pour les modales.
      const accents: Record<string, string> = {
        success: '#4ade80',
        error: '#f87171',
        warning: '#fbbf24',
        info: '#60a5fa',
      };
      const accent = accents[options.type] ?? accents['info'];

      const notification = document.createElement('div');
      notification.className = `notification notification-${options.type}`;

      const panel = document.createElement('div');
      Object.assign(panel.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '280px',
        maxWidth: '420px',
        padding: '12px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderLeft: `3px solid ${accent}`,
        background: '#141416',
        color: '#f4f4f5',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
        font: '500 0.875rem/1.45 Inter, system-ui, sans-serif',
        pointerEvents: 'auto',
      } as Partial<CSSStyleDeclaration>);

      const text = document.createElement('span');
      text.style.flex = '1';
      text.textContent = options.message;

      const close = document.createElement('button');
      close.type = 'button';
      close.setAttribute('aria-label', 'Fermer la notification');
      Object.assign(close.style, {
        flexShrink: '0',
        width: '22px',
        height: '22px',
        display: 'grid',
        placeItems: 'center',
        padding: '0',
        border: '0',
        borderRadius: '6px',
        background: 'none',
        color: '#a8a8b0',
        fontSize: '16px',
        lineHeight: '1',
        cursor: 'pointer',
      } as Partial<CSSStyleDeclaration>);
      close.textContent = '\u00d7';
      close.addEventListener('click', () => notification.remove());

      panel.append(text, close);
      notification.appendChild(panel);
      this.container!.appendChild(notification);

      setTimeout(() => notification.remove(), options.duration);
    }
  }
  
  // =============================================
  // STORAGE UTILITIES
  // =============================================
  export class StorageUtils {
    static setItem<T>(key: string, value: T): void {
      try {
        const serialized = JSON.stringify({
          data: value,
          timestamp: new Date().toISOString(),
          version: '1.0'
        });
        localStorage.setItem(key, serialized);
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
      }
    }
  
    static getItem<T>(key: string): T | null {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
  
        const parsed = JSON.parse(item);
        
        // Handle legacy data without wrapper
        if (parsed.data !== undefined) {
          return parsed.data;
        }
        
        return parsed;
      } catch (error) {
        console.warn(`Failed to read ${key} from localStorage:`, error);
        return null;
      }
    }
  
    static removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    }
  
    static clear(): void {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  
    static getItemWithExpiry<T>(key: string, expiryHours: number = 24): T | null {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
  
        const parsed = JSON.parse(item);
        const now = new Date();
        const savedTime = new Date(parsed.timestamp);
        const diffHours = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
  
        if (diffHours > expiryHours) {
          localStorage.removeItem(key);
          return null;
        }
  
        return parsed.data;
      } catch (error) {
        console.warn(`Failed to read ${key} with expiry from localStorage:`, error);
        return null;
      }
    }
  
    static setItemWithExpiry<T>(key: string, value: T, expiryHours: number = 24): void {
      try {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + expiryHours);
        
        const serialized = JSON.stringify({
          data: value,
          timestamp: new Date().toISOString(),
          expiry: expiry.toISOString(),
          version: '1.0'
        });
        
        localStorage.setItem(key, serialized);
      } catch (error) {
        console.warn(`Failed to save ${key} with expiry to localStorage:`, error);
      }
    }
  }
  
  // =============================================
  // MATH UTILITIES
  // =============================================
  export class MathUtils {
    static clamp(value: number, min: number, max: number): number {
      return Math.min(Math.max(value, min), max);
    }
  
    static lerp(start: number, end: number, factor: number): number {
      return start + (end - start) * factor;
    }
  
    static roundToDecimals(value: number, decimals: number): number {
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
  
    static randomBetween(min: number, max: number): number {
      return Math.random() * (max - min) + min;
    }
  
    static randomIntBetween(min: number, max: number): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    static average(numbers: number[]): number {
      if (numbers.length === 0) return 0;
      return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
  
    static median(numbers: number[]): number {
      if (numbers.length === 0) return 0;
      const sorted = [...numbers].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      
      if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
      }
      
      return sorted[middle];
    }
  
    static percentile(numbers: number[], percentile: number): number {
      if (numbers.length === 0) return 0;
      const sorted = [...numbers].sort((a, b) => a - b);
      const index = (percentile / 100) * (sorted.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      
      if (lower === upper) {
        return sorted[lower];
      }
      
      return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
    }
  }
  
  // =============================================
  // FORMAT UTILITIES
  // =============================================
  export class FormatUtils {
    static formatNumber(value: number, locale: string = 'fr-FR'): string {
      return new Intl.NumberFormat(locale).format(value);
    }
  
    static formatCurrency(value: number, currency: string = 'EUR', locale: string = 'fr-FR'): string {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(value);
    }
  
    static formatPercentage(value: number, decimals: number = 0, locale: string = 'fr-FR'): string {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    }
  
    static formatDuration(minutes: number): string {
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
  
    static formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - suffix.length) + suffix;
    }
  
    static slugify(text: string): string {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
  
    static capitalizeFirst(text: string): string {
      if (!text) return text;
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
  
    static camelCase(text: string): string {
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
    }
  }
  
  // =============================================
  // VALIDATION UTILITIES
  // =============================================
  export class ValidationUtils {
    static isEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    static isUrl(url: string): boolean {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }
  
    static isPhoneNumber(phone: string): boolean {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
  
    static isStrongPassword(password: string): boolean {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return strongPasswordRegex.test(password);
    }
  
    static isNumeric(value: string): boolean {
      return !isNaN(Number(value)) && !isNaN(parseFloat(value));
    }
  
    static isInteger(value: string | number): boolean {
      return Number.isInteger(Number(value));
    }
  
    static isInRange(value: number, min: number, max: number): boolean {
      return value >= min && value <= max;
    }
  
    static hasMinLength(text: string, minLength: number): boolean {
      return text.length >= minLength;
    }
  
    static hasMaxLength(text: string, maxLength: number): boolean {
      return text.length <= maxLength;
    }
  
    static containsOnlyAlphanumeric(text: string): boolean {
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      return alphanumericRegex.test(text);
    }
  }
  
  // =============================================
  // APP CONFIGURATION
  // =============================================
  export const APP_CONFIG = {
    API: {
      BASE_URL: '/api/v1',
      TIMEOUT: 10000,
      RETRY_ATTEMPTS: 3
    },
    
    STORAGE_KEYS: {
      CHALLENGES: 'fitness_challenges',
      USER_CHALLENGES: 'user_challenges',
      FAVORITES: 'challenge_favorites',
      FILTERS: 'challenge_filters',
      USER_PREFERENCES: 'user_preferences'
    },
    
    LIMITS: {
      MAX_CHALLENGES_PER_USER: 10,
      MAX_TASKS_PER_CHALLENGE: 20,
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      MAX_DESCRIPTION_LENGTH: 500,
      MAX_TITLE_LENGTH: 100,
      MAX_TAGS_PER_CHALLENGE: 10
    },
    
    DEFAULTS: {
      CHALLENGE_DURATION: 7,
      REWARD_POINTS: 100,
      DIFFICULTY: 'easy' as ChallengeDifficulty,
      CATEGORY: 'fitness' as ChallengeCategory,
      MAX_PARTICIPANTS: 1000,
      PAGE_SIZE: 12
    },
    
    THRESHOLDS: {
      ENDING_SOON_DAYS: 3,
      NEW_CHALLENGE_DAYS: 7,
      CACHE_EXPIRY_HOURS: 24
    }
  };

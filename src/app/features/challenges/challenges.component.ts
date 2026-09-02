// src/app/challenges/challenges.component.ts - Enhanced Version
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, BehaviorSubject, timer, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { ChallengesService } from '@app/services/challenges.service';
import { Task, BodyScrollLock } from '@shared';
import { IconComponent } from '@app/shared/components/icon/icon.component';

// Enhanced interfaces
interface EnhancedChallenge {
  id: number;
  name: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  target: number;
  unit: string;
  reward: string;
  rewardPoints: number;
  participantsCount: number;
  participants: number;
  maxParticipants?: number;
  isJoined: boolean;
  isCompleted: boolean;
  currentProgress: number;
  progress: number;
  maxProgress: number;
  image?: string;
  status: string;
  startDate: string;
  endDate: string;
  tasks?: Task[];
  userProgress?: {
    progress: number;
    points: number;
    status: string;
    rank?: number;
    completedTasks?: number;
  };
  daysRemaining?: number;
  isEndingSoon?: boolean;
  difficultyInfo?: any;
  categoryInfo?: any;
}



interface ExtendedLeaderboardEntry {
  id: number;
  name: string;
  avatar?: string;
  points: number;
  progress: number;
  rank: number;
  score: number;
  isCurrentUser?: boolean;
  challengesWon?: number;
  streak?: number;
  badges?: string[];
  totalChallenges?: number;
}

interface ChallengeFilters {
  status: 'all' | 'available' | 'active' | 'completed';
  category: string;
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  sortBy: 'popularity' | 'difficulty' | 'endDate' | 'reward';
  searchTerm: string;
}

interface ChallengeStats {
  active: number;
  completed: number;
  totalPoints: number;
  currentRank: number;
  winRate: number;
  streak: number;
  weeklyPointsGain: number;
  rankChange: number;
}

// Configuration constants
// `icon` designe une entree du jeu d'icones de l'application (IconName).
const CHALLENGE_CATEGORIES = [
  { value: 'fitness', label: 'Fitness', icon: 'dumbbell', color: '#fc8181' },
  { value: 'wellness', label: 'Bien-être', icon: 'moon', color: '#86efac' },
  { value: 'cardio', label: 'Cardio', icon: 'flame', color: '#fdba74' },
  { value: 'strength', label: 'Force', icon: 'dumbbell', color: '#6ee7b7' },
  { value: 'nutrition', label: 'Nutrition', icon: 'utensils', color: '#7ecbff' },
  { value: 'mindfulness', label: 'Méditation', icon: 'bulb', color: '#c4b5fd' },
  { value: 'social', label: 'Social', icon: 'users', color: '#fdba74' }
];

const DIFFICULTY_LEVELS = [
  { value: 'all', label: 'Toutes', emoji: '🌟', color: '#7ecbff' },
  { value: 'easy', label: 'Facile', emoji: '🟢', color: '#86efac' },
  { value: 'medium', label: 'Moyen', emoji: '🟡', color: '#fdba74' },
  { value: 'hard', label: 'Difficile', emoji: '🔴', color: '#fc8181' }
];

const STATUS_CONFIG = {
  available: { label: 'Disponible', emoji: '🚀', color: '#7ecbff', icon: 'fas fa-play-circle' },
  active: { label: 'En cours', emoji: '⚡', color: '#fdba74', icon: 'fas fa-clock' },
  completed: { label: 'Terminé', emoji: '✅', color: '#6ee7b7', icon: 'fas fa-check-circle' },
  expired: { label: 'Expiré', emoji: '⏰', color: '#a8a8b0', icon: 'fas fa-times-circle' }
};

// Utility classes (simplified for standalone component)

class DateUtils {
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  }
}

class StorageUtils {
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  
  static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silent fail
    }
  }
}

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, IconComponent],
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.scss']
})
export class ChallengesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');
  private refreshTimer$ = new Subject<void>();

  // Configuration
  readonly challengeCategories = CHALLENGE_CATEGORIES;
  readonly difficultyLevels = DIFFICULTY_LEVELS;
  readonly statusConfig = STATUS_CONFIG;

  // UI state
  isLoading = false;
  isCreating = false;
  error: string | null = null;

  // Data
  challenges: EnhancedChallenge[] = [];
  filteredChallenges: EnhancedChallenge[] = [];
  leaderboardData: ExtendedLeaderboardEntry[] = [];
  userChallenges: Map<number, any> = new Map();
  
  // Statistics
  challengeStats: ChallengeStats = {
    active: 0,
    completed: 0,
    totalPoints: 0,
    currentRank: 999,
    winRate: 0,
    streak: 0,
    weeklyPointsGain: 0,
    rankChange: 0
  };

  // Filters with persistence
  activeFilter: 'all' | 'available' | 'active' | 'completed' = 'all';
  activeCategoryFilter: string = 'all';
  activeDifficultyFilter: 'all' | 'easy' | 'medium' | 'hard' = 'all';
  sortBy: 'popularity' | 'difficulty' | 'endDate' | 'reward' = 'popularity';

  filters: ChallengeFilters = {
    status: 'all',
    category: 'all',
    difficulty: 'all',
    sortBy: 'popularity',
    searchTerm: ''
  };

  // Modal state
  showCreateModal = false;
  showChallengeDetails = false;
  showLeaderboard = false;
  selectedChallenge: EnhancedChallenge | null = null;

  // Forms
  challengeForm!: FormGroup;

  // User data
  currentUserId = 2; // Mock user ID

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private challengesService: ChallengesService
  ) {
    this.initializeForm();
    this.loadFiltersFromStorage();
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    console.log('ChallengesComponent initialized');
    this.loadChallenges();
    this.loadLeaderboardData();
    this.calculateStats();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.saveFiltersToStorage();
    this.destroy$.next();
    this.destroy$.complete();
    this.refreshTimer$.next();
    this.refreshTimer$.complete();
    BodyScrollLock.unlock();
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeForm(): void {
    this.challengeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: ['fitness', Validators.required],
      difficulty: ['easy', Validators.required],
      target: [1, [Validators.required, Validators.min(1)]],
      unit: ['', [Validators.required, Validators.maxLength(20)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      rewardPoints: [100, [Validators.required, Validators.min(10), Validators.max(1000)]],
      maxParticipants: [null, [Validators.min(1)]],
      isPublic: [true]
    });

    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    this.challengeForm.patchValue({ startDate: today });
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filters.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  private startAutoRefresh(): void {
    // Refresh data every 30 seconds
    timer(30000, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshChallenges();
      });
  }

  // =============================================
  // DATA LOADING
  // =============================================

  private loadChallenges(): void {
    this.isLoading = true;
    this.error = null;

    // Simulate API call with enhanced mock data
    of(this.getBuiltInChallenges())
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading challenges:', error);
          this.error = 'Erreur lors du chargement des défis';
          this.isLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (challenges) => {
          this.challenges = this.enhanceChallenges(challenges);
          this.calculateStats();
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Defis proposes par l'application : du CONTENU, au meme titre qu'un
   * programme d'entrainement predefini. Les champs decrivant l'etat de
   * l'utilisateur partent a zero et n'evoluent que par ses actions.
   */
  private getBuiltInChallenges(): EnhancedChallenge[] {
    const now = new Date();
    const getDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 1,
        name: '30 jours de méditation',
        title: '30 jours de méditation quotidienne',
        description: 'Méditer pendant 10 minutes chaque jour pendant 30 jours pour améliorer votre bien-être mental et réduire le stress',
        category: 'mindfulness',
        difficulty: 'easy',
        duration: 30,
        target: 30,
        unit: 'jours',
        reward: '150 points + Badge Zen Master',
        rewardPoints: 150,
        // Etat utilisateur et communaute remis a zero : cette copie annoncait
        // 2 847 participants et 18 jours de progression a quelqu'un qui
        // ouvrait l'app pour la premiere fois.
        participantsCount: 0,
        participants: 0,
        maxParticipants: undefined,
        isJoined: false,
        isCompleted: false,
        currentProgress: 0,
        progress: 0,
        maxProgress: 30,
        image: '/assets/images/meditation-challenge.jpg',
        status: 'available',
        startDate: now.toISOString(),
        endDate: getDate(12).toISOString(),
        tasks: [
          {
            id: 1,
            title: 'Méditation matinale',
            description: '10 minutes de méditation guidée chaque matin',
            isCompleted: true,
            currentValue: 18,
            targetValue: 30,
            unit: 'séances',
            points: 15
          },
          {
            id: 2,
            title: 'Journal de gratitude',
            description: 'Noter 3 choses pour lesquelles vous êtes reconnaissant',
            isCompleted: false,
            currentValue: 12,
            targetValue: 30,
            unit: 'entrées',
            points: 10
          },
          {
            id: 3,
            title: 'Respiration consciente',
            description: '5 minutes de respiration consciente avant de dormir',
            isCompleted: false,
            currentValue: 15,
            targetValue: 30,
            unit: 'séances',
            points: 10
          }
        ]
      },
      {
        id: 2,
        name: 'Défi pompes ultime',
        title: 'Défi 1000 pompes en 2 semaines',
        description: 'Réalisez 1000 pompes réparties sur 14 jours pour développer votre force et endurance musculaire',
        category: 'strength',
        difficulty: 'medium',
        duration: 14,
        target: 1000,
        unit: 'pompes',
        reward: '300 points + Badge Iron Chest',
        rewardPoints: 300,
        participantsCount: 1256,
        participants: 1256,
        maxParticipants: 2000,
        isJoined: true,
        isCompleted: false,
        currentProgress: 420,
        progress: 420,
        maxProgress: 1000,
        image: '/assets/images/pushup-challenge.jpg',
        status: 'active',
        startDate: getDate(-6).toISOString(),
        endDate: getDate(8).toISOString(),
        tasks: [
          {
            id: 4,
            title: 'Pompes classiques',
            description: 'Séries de pompes traditionnelles',
            isCompleted: false,
            currentValue: 320,
            targetValue: 700,
            unit: 'pompes',
            points: 20
          },
          {
            id: 5,
            title: 'Pompes diamant',
            description: 'Pompes avec les mains en forme de diamant',
            isCompleted: false,
            currentValue: 80,
            targetValue: 200,
            unit: 'pompes',
            points: 15
          },
          {
            id: 6,
            title: 'Pompes inclinées',
            description: 'Pompes avec les pieds surélevés',
            isCompleted: false,
            currentValue: 20,
            targetValue: 100,
            unit: 'pompes',
            points: 10
          }
        ]
      },
      {
        id: 3,
        name: 'Marathon des 10 000 pas',
        title: 'Marcher 10 000 pas pendant 21 jours',
        description: 'Maintenez une activité physique quotidienne en marchant au moins 10 000 pas chaque jour',
        category: 'cardio',
        difficulty: 'easy',
        duration: 21,
        target: 210000,
        unit: 'pas',
        reward: '200 points + Badge Walker',
        rewardPoints: 200,
        participantsCount: 4521,
        participants: 4521,
        maxParticipants: undefined,
        isJoined: false,
        isCompleted: false,
        currentProgress: 0,
        progress: 0,
        maxProgress: 210000,
        image: '/assets/images/walking-challenge.jpg',
        status: 'available',
        startDate: getDate(3).toISOString(),
        endDate: getDate(24).toISOString(),
        tasks: [
          {
            id: 7,
            title: 'Marche quotidienne',
            description: '10 000 pas minimum par jour',
            isCompleted: false,
            currentValue: 0,
            targetValue: 210000,
            unit: 'pas',
            points: 25
          }
        ]
      },
      {
        id: 4,
        name: 'Challenge hydratation',
        title: 'Boire 2 litres d\'eau par jour',
        description: 'Maintenez une hydratation optimale en buvant 2 litres d\'eau pure quotidiennement pendant 14 jours',
        category: 'wellness',
        difficulty: 'easy',
        duration: 14,
        target: 28,
        unit: 'litres',
        reward: '120 points + Badge Hydro Hero',
        rewardPoints: 120,
        participantsCount: 3254,
        participants: 3254,
        maxParticipants: undefined,
        isJoined: false,
        isCompleted: false,
        currentProgress: 0,
        progress: 0,
        maxProgress: 28,
        image: '/assets/images/hydration-challenge.jpg',
        status: 'available',
        startDate: getDate(1).toISOString(),
        endDate: getDate(15).toISOString(),
        tasks: [
          {
            id: 8,
            title: 'Consommation d\'eau',
            description: '2 litres d\'eau pure par jour',
            isCompleted: false,
            currentValue: 0,
            targetValue: 28,
            unit: 'litres',
            points: 15
          }
        ]
      },
      {
        id: 5,
        name: 'Beast Mode HIIT',
        title: 'Entraînement HIIT intensif 5 fois par semaine',
        description: 'Défiez-vous avec des séances HIIT de haute intensité pour brûler un maximum de calories',
        category: 'fitness',
        difficulty: 'hard',
        duration: 28,
        target: 20,
        unit: 'séances',
        reward: '500 points + Badge Beast Mode',
        rewardPoints: 500,
        participantsCount: 782,
        participants: 782,
        maxParticipants: 1000,
        isJoined: false,
        isCompleted: false,
        currentProgress: 0,
        progress: 0,
        maxProgress: 20,
        image: '/assets/images/hiit-challenge.jpg',
        status: 'available',
        startDate: getDate(7).toISOString(),
        endDate: getDate(35).toISOString(),
        tasks: [
          {
            id: 9,
            title: 'Séances HIIT',
            description: 'Entraînements intensifs de 20-30 minutes',
            isCompleted: false,
            currentValue: 0,
            targetValue: 20,
            unit: 'séances',
            points: 30
          }
        ]
      },
      {
        id: 6,
        name: 'Défi alimentation équilibrée',
        title: '21 jours d\'alimentation saine',
        description: 'Adoptez de meilleures habitudes alimentaires avec des repas équilibrés et nutritifs',
        category: 'nutrition',
        difficulty: 'medium',
        duration: 21,
        target: 63,
        unit: 'repas sains',
        reward: '250 points + Badge Healthy Eater',
        rewardPoints: 250,
        participantsCount: 1895,
        participants: 1895,
        maxParticipants: undefined,
        isJoined: true,
        isCompleted: true,
        currentProgress: 63,
        progress: 63,
        maxProgress: 63,
        image: '/assets/images/nutrition-challenge.jpg',
        status: 'completed',
        startDate: getDate(-25).toISOString(),
        endDate: getDate(-4).toISOString(),
        tasks: [
          {
            id: 10,
            title: 'Repas équilibrés',
            description: '3 repas sains par jour',
            isCompleted: true,
            currentValue: 63,
            targetValue: 63,
            unit: 'repas',
            points: 20
          }
        ]
      },
      {
        id: 7,
        name: 'Flexibilité ultime',
        title: 'Améliorer sa souplesse en 30 jours',
        description: 'Séances d\'étirements et de yoga pour gagner en flexibilité et mobilité',
        category: 'wellness',
        difficulty: 'medium',
        duration: 30,
        target: 30,
        unit: 'séances',
        reward: '180 points + Badge Flexible',
        rewardPoints: 180,
        participantsCount: 1647,
        participants: 1647,
        maxParticipants: undefined,
        isJoined: false,
        isCompleted: false,
        currentProgress: 0,
        progress: 0,
        maxProgress: 30,
        image: '/assets/images/flexibility-challenge.jpg',
        status: 'available',
        startDate: getDate(2).toISOString(),
        endDate: getDate(32).toISOString(),
        tasks: [
          {
            id: 11,
            title: 'Étirements quotidiens',
            description: '15 minutes d\'étirements par jour',
            isCompleted: false,
            currentValue: 0,
            targetValue: 30,
            unit: 'séances',
            points: 18
          }
        ]
      },
      {
        id: 8,
        name: 'Team Challenge',
        title: 'Défi d\'équipe - Course virtuelle',
        description: 'Rejoignez une équipe et parcourez ensemble 1000 km en course/marche',
        category: 'social',
        difficulty: 'medium',
        duration: 45,
        target: 1000,
        unit: 'km',
        reward: '400 points + Badge Team Player',
        rewardPoints: 400,
        participantsCount: 2156,
        participants: 2156,
        maxParticipants: 5000,
        isJoined: false,
        isCompleted: false,
        currentProgress: 0,
        progress: 0,
        maxProgress: 1000,
        image: '/assets/images/team-challenge.jpg',
        status: 'available',
        startDate: getDate(5).toISOString(),
        endDate: getDate(50).toISOString(),
        tasks: [
          {
            id: 12,
            title: 'Distance parcourue',
            description: 'Course ou marche comptabilisée',
            isCompleted: false,
            currentValue: 0,
            targetValue: 1000,
            unit: 'km',
            points: 35
          }
        ]
      }
    ];
  }

  private enhanceChallenges(challenges: EnhancedChallenge[]): EnhancedChallenge[] {
    return challenges.map(challenge => this.enhanceChallenge(challenge));
  }

  private enhanceChallenge(challenge: EnhancedChallenge): EnhancedChallenge {
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...challenge,
      userProgress: this.getUserChallengeData(challenge),
      daysRemaining: Math.max(0, daysRemaining),
      isEndingSoon: daysRemaining <= 3 && daysRemaining > 0,
      difficultyInfo: this.getDifficultyInfo(challenge.difficulty),
      categoryInfo: this.getCategoryInfo(challenge.category)
    };
  }

  /**
   * Le classement reste vide tant qu'il n'existe pas de vrais pratiquants a
   * classer. Cette methode remplissait la liste de deux profils inventes
   * ('Sarah Champion', 'Alex Warrior'), dont l'un marque comme etant
   * l'utilisateur courant : l'app attribuait donc a chaque visiteur un
   * palmares qui n'etait pas le sien. L'ecran affiche un etat vide honnete.
   */
  private loadLeaderboardData(): void {
    this.leaderboardData = [];
  }

  private refreshChallenges(): void {
    // Update progress for active challenges
    this.challenges.forEach(challenge => {
      if (challenge.isJoined && challenge.status === 'active') {
        // Simulate progress update
        const increment = Math.floor(Math.random() * 3);
        challenge.currentProgress = Math.min(
          challenge.currentProgress + increment,
          challenge.target
        );
        challenge.progress = challenge.currentProgress;

        // Check if completed
        if (challenge.currentProgress >= challenge.target) {
          challenge.status = 'completed';
          challenge.isCompleted = true;
          console.log(`🎉 Félicitations ! Défi "${challenge.title}" terminé !`);
        }
      }

      // Update days remaining
      const now = new Date();
      const endDate = new Date(challenge.endDate);
      challenge.daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      challenge.isEndingSoon = challenge.daysRemaining <= 3 && challenge.daysRemaining > 0;

      // Check if expired
      if (challenge.daysRemaining === 0 && challenge.status !== 'completed') {
        (challenge as any).status = 'expired';
      }
    });

    this.calculateStats();
    this.applyFilters();
    this.cdr.detectChanges();
  }

  // =============================================
  // STATISTICS
  // =============================================

  private calculateStats(): void {
    const active = this.challenges.filter(c => c.isJoined && c.status === 'active');
    const completed = this.challenges.filter(c => c.isJoined && c.status === 'completed');
    const totalPoints = completed.reduce((sum, c) => sum + c.rewardPoints, 0);
    const currentUser = this.leaderboardData.find(u => u.isCurrentUser);

    this.challengeStats = {
      active: active.length,
      completed: completed.length,
      totalPoints,
      currentRank: currentUser?.rank || 999,
      winRate: this.challenges.filter(c => c.isJoined).length > 0
        ? Math.round((completed.length / this.challenges.filter(c => c.isJoined).length) * 100)
        : 0,
      streak: currentUser?.streak || 0,
      weeklyPointsGain: Math.floor(Math.random() * 150) + 50,
      rankChange: Math.floor(Math.random() * 5) - 2
    };
  }

  getActiveChallengesCount(): number {
    return this.challengeStats.active;
  }

  getCompletedChallengesCount(): number {
    return this.challengeStats.completed;
  }

  getTotalPoints(): number {
    return this.challengeStats.totalPoints;
  }

  getCurrentUserRank(): number {
    return this.challengeStats.currentRank;
  }

  getWeeklyPointsGain(): number {
    return this.challengeStats.weeklyPointsGain;
  }

  getRankChange(): number {
    return this.challengeStats.rankChange;
  }

  getActiveProgress(): number {
    if (this.challengeStats.active === 0) return 0;
    const activeProgress = this.challenges
      .filter(c => c.isJoined && c.status === 'active')
      .reduce((sum, c) => sum + (c.currentProgress / c.target * 100), 0);
    return Math.round(activeProgress / this.challengeStats.active);
  }

  getRecentBadges(): string[] {
    return ['🏆', '🔥', '💪'];
  }

  // =============================================
  // FILTERING & SEARCHING
  // =============================================

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  setFilter(filter: 'all' | 'available' | 'active' | 'completed'): void {
    this.activeFilter = filter;
    this.filters.status = filter;
    this.applyFilters();
    this.saveFiltersToStorage();
  }

  setCategoryFilter(category: string): void {
    this.activeCategoryFilter = category;
    this.filters.category = category;
    this.applyFilters();
    this.saveFiltersToStorage();
  }

  setDifficultyFilter(level: string): void {
    if (level === 'all' || level === 'easy' || level === 'medium' || level === 'hard') {
      this.activeDifficultyFilter = level as 'all' | 'easy' | 'medium' | 'hard';
      this.filters.difficulty = level;
      this.applyFilters();
      this.saveFiltersToStorage();
    }
  }

  setSortBy(sort: string): void {
    if (sort === 'popularity' || sort === 'difficulty' || sort === 'endDate' || sort === 'reward') {
      this.sortBy = sort;
      this.filters.sortBy = sort;
      this.applyFilters();
      this.saveFiltersToStorage();
    }
  }

  // Panneau de filtres mobile : masque par defaut, ouvert par le bouton
  // flottant "Filtrer", ferme en revalidant (les filtres s'appliquent deja
  // en direct, "Appliquer" ne fait que revenir au resultat).
  showMobileFilters = false;

  openMobileFilters(): void {
    this.showMobileFilters = true;
    BodyScrollLock.lock();
  }

  closeMobileFilters(): void {
    this.showMobileFilters = false;
    BodyScrollLock.unlock();
  }

  clearFilters(): void {
    this.activeFilter = 'all';
    this.activeCategoryFilter = 'all';
    this.sortBy = 'popularity';
    this.filters = {
      status: 'all',
      category: 'all',
      difficulty: 'all',
      sortBy: 'popularity',
      searchTerm: ''
    };
    this.searchSubject.next('');
    this.applyFilters();
    this.saveFiltersToStorage();
    console.info('Filtres réinitialisés');
  }

  private applyFilters(): void {
    let filtered = [...this.challenges];

    // Status filter
    if (this.filters.status !== 'all') {
      if (this.filters.status === 'active') {
        filtered = filtered.filter(c => c.isJoined && c.status === 'active');
      } else if (this.filters.status === 'completed') {
        filtered = filtered.filter(c => c.isJoined && c.status === 'completed');
      } else if (this.filters.status === 'available') {
        filtered = filtered.filter(c => !c.isJoined && c.status === 'available');
      }
    }

    // Category filter
    if (this.filters.category !== 'all') {
      filtered = filtered.filter(c => c.category === this.filters.category);
    }

    // Difficulty filter
    if (this.filters.difficulty !== 'all') {
      filtered = filtered.filter(c => c.difficulty === this.filters.difficulty);
    }

    // Search filter
    if (this.filters.searchTerm.trim()) {
      const searchTerm = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm) ||
        c.category.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'popularity':
          return b.participants - a.participants;
        case 'difficulty':
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return diffOrder[b.difficulty as keyof typeof diffOrder] - diffOrder[a.difficulty as keyof typeof diffOrder];
        case 'endDate':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'reward':
          return b.rewardPoints - a.rewardPoints;
        default:
          return 0;
      }
    });

    this.filteredChallenges = filtered;
    this.cdr.detectChanges();
  }

  // =============================================
  // CHALLENGE ACTIONS
  // =============================================

  joinChallenge(challenge: EnhancedChallenge): void {
    if (challenge.isJoined) return;
    
    // Check if max participants reached
    if (challenge.maxParticipants && challenge.participants >= challenge.maxParticipants) {
      console.warn('⚠️ Ce défi a atteint sa capacité maximale');
      return;
    }
    
    challenge.isJoined = true;
    challenge.participants += 1;
    challenge.status = 'active';
    challenge.currentProgress = 0;
    
    // Add to user challenges
    this.userChallenges.set(challenge.id, {
      progress: 0,
      points: 0,
      status: 'active',
      joinedAt: new Date(),
      completedTasks: 0
    });
    
    this.calculateStats();
    this.applyFilters();
    console.log(`🚀 Vous avez rejoint le défi "${challenge.title}" !`);
  }

  leaveChallenge(challenge: EnhancedChallenge): void {
    if (!challenge.isJoined) return;
    
    if (!confirm('Êtes-vous sûr de vouloir abandonner ce défi ? Votre progression sera perdue.')) {
      return;
    }
    
    challenge.isJoined = false;
    challenge.currentProgress = 0;
    challenge.progress = 0;
    challenge.participants = Math.max(0, challenge.participants - 1);
    challenge.status = 'available';
    
    // Remove from user challenges
    this.userChallenges.delete(challenge.id);
    
    this.calculateStats();
    this.applyFilters();
    console.info('💔 Vous avez quitté le défi');
  }

  updateChallengeProgress(challenge: EnhancedChallenge, increment: number = 1): void {
    if (!challenge.isJoined || challenge.status !== 'active') return;
    
    challenge.currentProgress = Math.min(
      challenge.currentProgress + increment,
      challenge.target
    );
    challenge.progress = challenge.currentProgress;
    
    // Update user challenge data
    const userData = this.userChallenges.get(challenge.id);
    if (userData) {
      userData.progress = Math.round((challenge.currentProgress / challenge.target) * 100);
      userData.points = Math.round((userData.progress / 100) * challenge.rewardPoints);
    }
    
    // Check if completed
    if (challenge.currentProgress >= challenge.target) {
      challenge.status = 'completed';
      challenge.isCompleted = true;
      if (userData) {
        userData.status = 'completed';
      }
      console.log(`🎉 Incroyable ! Vous avez terminé le défi "${challenge.title}" !`);
    }
    
    this.calculateStats();
    this.cdr.detectChanges();
  }

  shareChallenge(challenge: EnhancedChallenge): void {
    const shareData = {
      title: `Défi Fitness: ${challenge.title}`,
      text: `${challenge.description}\n\nRejoignez-moi dans ce défi !`,
      url: `${window.location.origin}/challenges/${challenge.id}`
    };
    
    if (navigator.share && navigator.canShare?.(shareData)) {
      navigator.share(shareData)
        .then(() => console.log('📤 Défi partagé avec succès !'))
        .catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareData.url)
        .then(() => console.log('🔗 Lien copié dans le presse-papier !'))
        .catch(() => console.error('❌ Erreur lors de la copie du lien'));
    }
  }

  // =============================================
  // MODAL ACTIONS
  // =============================================

  openChallengeDetails(challenge: EnhancedChallenge): void {
    console.log('Opening challenge details for:', challenge.title);
    console.log('Modal state before:', this.showChallengeDetails);
    
    this.selectedChallenge = challenge;
    this.showChallengeDetails = true;
    
    console.log('Modal state after:', this.showChallengeDetails);
    console.log('Selected challenge:', this.selectedChallenge);
    
    // Force change detection
    this.cdr.detectChanges();
    
    // Debug: Check if modal element exists in DOM after a small delay
    setTimeout(() => {
      const modalElement = document.querySelector('.modal-overlay');
      console.log('Modal element found:', modalElement);
      if (modalElement) {
        const styles = window.getComputedStyle(modalElement);
        console.log('Modal display:', styles.display);
        console.log('Modal z-index:', styles.zIndex);
        console.log('Modal background:', styles.background);
      } else {
        console.error('Modal element not found in DOM!');
      }
    }, 100);
  }

  closeChallengeDetails(): void {
    console.log('Closing challenge details');
    this.showChallengeDetails = false;
    this.selectedChallenge = null;
    this.cdr.detectChanges();
  }

  openLeaderboard(): void {
    this.showLeaderboard = true;
    this.cdr.detectChanges();
  }

  closeLeaderboard(): void {
    this.showLeaderboard = false;
    this.cdr.detectChanges();
  }

  createCustomChallenge(): void {
    this.showCreateModal = true;
    this.challengeForm.reset({
      difficulty: 'easy',
      rewardPoints: 100,
      isPublic: true,
      category: 'fitness'
    });
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.challengeForm.patchValue({ 
      startDate: today,
      endDate: nextWeek
    });
    
    this.cdr.detectChanges();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.challengeForm.reset();
    this.cdr.detectChanges();
  }

  saveChallenge(): void {
    if (this.challengeForm.invalid) {
      this.markFormGroupTouched();
      console.error('❌ Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.isCreating = true;
    const formValue = this.challengeForm.value;
    
    // Validate dates
    const startDate = new Date(formValue.startDate);
    const endDate = new Date(formValue.endDate);
    
    if (endDate <= startDate) {
      console.error('❌ La date de fin doit être postérieure à la date de début');
      this.isCreating = false;
      return;
    }
    
    this.challengesService.createChallenge(formValue).subscribe({
      next: (newChallenge) => {
        this.challenges.unshift(newChallenge);
        this.calculateStats();
        this.applyFilters();
        this.isCreating = false;
        this.closeCreateModal();
        console.log('✨ Défi créé avec succès ! Vous êtes automatiquement inscrit.');
      },
      error: (err) => {
        console.error(`❌ Erreur lors de la création du défi: ${err.message}`);
        this.isCreating = false;
      }
    });
  }

  // =============================================
  // TEMPLATE HELPERS
  // =============================================

  getDifficultyInfo(level: string) {
    return this.difficultyLevels.find(d => d.value === level) || this.difficultyLevels[1];
  }

  getCategoryInfo(category: string) {
    return this.challengeCategories.find(c => c.value === category) || this.challengeCategories[0];
  }

  getStatusEmoji(status: string): string {
    return this.statusConfig[status as keyof typeof this.statusConfig]?.emoji || '❓';
  }

  getStatusLabel(status: string): string {
    return this.statusConfig[status as keyof typeof this.statusConfig]?.label || status;
  }

  isEndingSoon(challenge: EnhancedChallenge): boolean {
    return challenge.isEndingSoon || false;
  }

  isUserInChallenge(challenge: EnhancedChallenge): boolean {
    return challenge.isJoined;
  }

  getUserChallengeData(challenge: EnhancedChallenge): any {
    const userData = this.userChallenges.get(challenge.id);
    if (userData) return userData;
    
    if (!challenge.isJoined) return null;
    
    const progressPct = challenge.target > 0 
      ? Math.round((challenge.currentProgress / challenge.target) * 100) 
      : 0;
    const points = Math.round((progressPct / 100) * challenge.rewardPoints);
    const completedTasks = challenge.tasks ? challenge.tasks.filter(t => t.isCompleted).length : 0;
    
    return {
      progress: progressPct,
      points,
      status: challenge.status,
      rank: this.getCurrentUserRank(),
      completedTasks
    };
  }

  getUserChallengesWon(user: ExtendedLeaderboardEntry): number {
    return user.challengesWon || 0;
  }

  getTopParticipants(): ExtendedLeaderboardEntry[] {
    return this.leaderboardData.slice(0, 5);
  }

  getRankIcon(rank: number): string {
    const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return icons[rank as keyof typeof icons] || '';
  }

  formatDate(date: Date | string): string {
    return DateUtils.formatDate(date);
  }

  getDaysRemaining(date: Date | string): number {
    const endDate = typeof date === 'string' ? new Date(date) : date;
    const msPerDay = 24 * 60 * 60 * 1000;
    const remaining = Math.ceil((endDate.getTime() - Date.now()) / msPerDay);
    return Math.max(0, remaining);
  }

  private getDaysBetween(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.challengeForm.controls).forEach(key => {
      const control = this.challengeForm.get(key);
      control?.markAsTouched();
    });
  }

  // =============================================
  // STORAGE
  // =============================================

  private loadFiltersFromStorage(): void {
    const saved = StorageUtils.getItem<ChallengeFilters>('challenges_filters');
    if (saved) {
      this.filters = { ...this.filters, ...saved };
      this.activeFilter = saved.status;
      this.activeCategoryFilter = saved.category;
      this.sortBy = saved.sortBy;
    }
  }

  private saveFiltersToStorage(): void {
    StorageUtils.setItem('challenges_filters', this.filters);
  }

  // =============================================
  // IMAGE ERROR HANDLERS
  // =============================================

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-challenge.jpg';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-user.png';
  }

  // =============================================
  // TRACK BY FUNCTIONS
  // =============================================

  trackByChallenge(index: number, challenge: EnhancedChallenge): number {
    return challenge.id;
  }

  trackByTask(index: number, task: Task): number | string {
    return task.id || `task-${index}`;
  }

  trackByUser(index: number, user: ExtendedLeaderboardEntry): number {
    return user.id;
  }

  // =============================================
  // NAVIGATION HELPERS
  // =============================================

  navigateToProfile(): void {
    console.log('Navigate to profile');
  }

  viewProgress(): void {
    console.log('Navigate to progress');
  }

  startWorkout(): void {
    console.log('Navigate to workout');
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'available': '#7ecbff',
      'active': '#6ee7b7',
      'completed': '#a8a8b0',
      'expired': '#fc8181',
      'pending': '#fdba74'
    };
    return statusColors[status] || '#a8a8b0';
  }
}

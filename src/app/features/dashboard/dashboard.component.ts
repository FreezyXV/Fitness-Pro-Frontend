// src/app/dashboard/dashboard.component.ts - VERSION AMÉLIORÉE AVEC NOUVELLES FONCTIONNALITÉS
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from '@app/services/auth.service';
import { UserService } from '@app/services/user.service';
import { WorkoutService } from '@app/services/workout.service';
import { User, Workout, Goal, BMIUtils, DateUtils, WorkoutUtils, WorkoutIntensity } from '@shared';
import { MiniCalendarComponent } from '@features/calendar/mini-calendar/mini-calendar.component';
import { IconComponent } from '@app/shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MiniCalendarComponent, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // User data
  user: User | null = null;
  
  // Dashboard data
  recentWorkouts: Workout[] = []; // Changed to Workout[]
  activeGoals: Goal[] = [];
  currentWorkoutPlan: Workout | null = null; // Changed to Workout | null
  
  // Statistics
  totalWorkouts = 0;
  totalMinutes = 0;
  totalCalories = 0;
  caloriesBurnedToday = 0;
  dailyCalorieGoal = 500;
  weeklyWorkouts = 0;
  currentStreak = 0;
  
  // UI state
  isLoading = false;
  error: string | null = null;
  
  // Motivational
  currentQuote = '';
  todaysWorkout: Workout | null = null; // Changed to Workout | null
  nextWorkoutCountdown = '';

  // Math utility for template
  Math = Math;

  private motivationalQuotes = [
    "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
    "Votre corps peut le faire. C'est votre esprit qu'il faut convaincre.",
    "Les champions continuent à jouer jusqu'à ce qu'ils gagnent.",
    "La discipline est le pont entre les objectifs et les réalisations.",
    "Ne limitez pas vos défis, défiez vos limites.",
    "Chaque expert était autrefois un débutant.",
    "La motivation vous fait commencer, l'habitude vous fait continuer.",
    "L'excellence n'est pas un acte, mais une habitude.",
    "Votre seule limite est votre mental.",
    "Aujourd'hui, je vais faire ce que les autres ne veulent pas faire pour avoir demain ce que les autres n'auront pas."
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private workoutService: WorkoutService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🏠 Dashboard initialized with enhanced features');
    this.loadDashboardData();
    this.rotateMotivationalQuote();
    this.setupPerformanceTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =============================================
  // DATA LOADING - ENHANCED VERSION
  // =============================================

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('🔄 Loading enhanced dashboard data...');
    
    // Get user from auth service first
    this.user = this.authService?.currentUser || null;
    
    if (!this.user) {
      console.warn('❌ No user found in auth service, loading from user service...');
      this.loadFromUserService();
      return;
    }

    console.log('✅ User found in auth service:', this.user.name);
    this.loadAdditionalData();
  }

  private loadFromUserService(): void {
    if (this.userService) {
      this.userService.getProfile()
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.warn('User service error, using mock data:', error);
            return of(this.getMockUser());
          })
        )
        .subscribe({
          next: (user) => {
            if (user) {
              console.log('✅ Profil utilisateur mis à jour:', user);
              this.user = user;
              if (this.authService && this.user) {
                this.authService.updateUser(this.user);
              }
              console.log('DEBUG: User loaded from userService.getProfile():', this.user);
              console.log('DEBUG: User dateOfBirth from getProfile():', this.user?.dateOfBirth);
              console.log('DEBUG: User age from getProfile():', this.user?.age);
            }
            this.loadAdditionalData();
          },
          error: (error: any) => {
            console.error('Failed to load user, using mock data:', error);
            this.user = this.getMockUser();
            this.loadAdditionalData();
          }
        });
    } else {
      console.warn('⚠️ UserService not available, using mock data');
      this.user = this.getMockUser();
      this.loadAdditionalData();
    }
  }

  private loadAdditionalData(): void {
    console.log('🔄 Loading additional dashboard data...');

    // Create requests with fallback handling
    const requests: any = {};

    // User service requests
    if (this.workoutService) { // Changed to workoutService
      requests.sessions = this.workoutService.getWorkoutSessions({ limit: 10 }).pipe( // Changed to workoutService
        catchError(error => {
          console.warn('Sessions error:', error);
          return of(this.getMockWorkoutSessions());
        })
      );
    }
      
    if (this.userService) {
      requests.goals = this.userService.getGoals('active').pipe(
        catchError(error => {
          console.warn('Goals error:', error);
          return of(this.getMockGoals());
        })
      );
      
      requests.dashboardStats = this.userService.getDashboardData().pipe(
        catchError(error => {
          console.warn('Dashboard stats error:', error);
          return of(this.getDefaultStats());
        })
      );
    }

    // Workout service requests
    if (this.workoutService) {
      requests.currentPlan = this.workoutService.getCurrentTemplate().pipe(
        catchError(error => {
          console.warn('Current plan error:', error);
          return of(this.getMockWorkoutPlan());
        })
      );
    }

    // If no services available, use mock data immediately
    if (Object.keys(requests).length === 0) {
      console.warn('⚠️ No services available, using enhanced mock data');
      this.loadEnhancedMockData();
      return;
    }

    // Execute requests
    forkJoin(requests).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log('✅ Additional data loaded:', data);
          
          this.recentWorkouts = data.sessions || this.getMockWorkoutSessions();
          this.activeGoals = (data.goals || this.getMockGoals()).slice(0, 5);
          this.currentWorkoutPlan = data.currentPlan || this.getMockWorkoutPlan();
          
          // Update user data if available from dashboard stats
          if (data.dashboardStats?.user) {
            this.updateUserData(data.dashboardStats.user);
          }
          
          if (this.user) {
            this.authService.updateUser(this.user);
          }
          
          // Calculate statistics
          this.calculateEnhancedStats(data.dashboardStats?.stats);
          
          this.isLoading = false;
          this.cdr.detectChanges();
          
          console.log('✅ Enhanced dashboard completely loaded');
        },
        error: (error) => {
          console.error('❌ Error loading additional data:', error);
          this.loadEnhancedMockData();
        }
      });
  }

  private loadEnhancedMockData(): void {
    console.log('📊 Loading enhanced mock dashboard data...');
    
    // Mock user if not available
    if (!this.user) {
      this.user = this.getMockUser();
    }

    // Enhanced mock data
    this.recentWorkouts = this.getEnhancedMockWorkoutSessions();
    this.activeGoals = this.getMockGoals();
    this.currentWorkoutPlan = this.getMockWorkoutPlan();
    this.todaysWorkout = this.currentWorkoutPlan;
    
    // Calculate enhanced stats
    this.calculateEnhancedStats();
    this.isLoading = false;
    this.cdr.detectChanges();
    
    console.log('✅ Enhanced mock dashboard data loaded');
  }

  private updateUserData(newUserData: any): void {
    if (this.user && newUserData) {
      console.log('🔄 Updating user data...');
      console.log('DEBUG: newUserData received in updateUserData:', newUserData);
      this.user = { ...this.user, ...newUserData };
      
      // Calculate age if dateOfBirth is available
      if (typeof this.user!.dateOfBirth === 'string' && this.user!.dateOfBirth) {
        console.log('DEBUG: Calculating age from dateOfBirth:', this.user!.dateOfBirth);
        this.user!.age = this.calculateAge(this.user!.dateOfBirth);
        console.log('DEBUG: Calculated age:', this.user!.age);
      } else {
        console.log('DEBUG: dateOfBirth not available or not a string for age calculation.');
      }

      if (this.authService && this.user) {
        this.authService.updateUser(this.user);
      }
      
      console.log('✅ Données utilisateur mises à jour:', this.user?.name);
      console.log('DEBUG: Final user object after updateUserData:', this.user);
    }
  }

  private calculateEnhancedStats(apiStats?: any): void {
    console.log('🔄 Calculating enhanced statistics...');
    
    if (!this.user) {
      console.warn('⚠️ No user for stats calculation');
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Use API stats if available, otherwise calculate from local data
    if (apiStats) {
      console.log('📊 Using API stats');
      this.totalWorkouts = apiStats.totalWorkouts || 0;
      this.totalMinutes = apiStats.totalMinutes || 0;
      this.totalCalories = apiStats.totalCalories || 0;
      this.currentStreak = apiStats.currentStreak || 0;
      this.weeklyWorkouts = apiStats.weekly_sessions || 0;
    } else if (this.user.stats) {
      console.log('📊 Using user stats');
      this.totalWorkouts = this.user.stats.totalWorkouts || 0;
      this.totalMinutes = this.user.stats.totalMinutes || 0;
      this.totalCalories = this.user.stats.totalCalories || 0;
      this.currentStreak = this.user.stats.currentStreak || 0;
      this.weeklyWorkouts = this.user.stats.weeklyWorkouts || 0;
    } else {
      console.log('📊 Calculating enhanced stats from local data');
      this.totalWorkouts = this.recentWorkouts.filter(w => w.status === 'completed').length;
      this.totalMinutes = this.recentWorkouts
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
      this.totalCalories = this.recentWorkouts
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      this.currentStreak = 5; // Enhanced default value
      
      this.weeklyWorkouts = this.recentWorkouts.filter(w => 
        w.status === 'completed' && 
        w.completedAt && 
        new Date(w.completedAt) >= weekAgo
      ).length;
    }

    // Calculate today's calories with enhanced tracking
    this.caloriesBurnedToday = this.calculateTodaysCalories();
    
    console.log('✅ Enhanced statistics calculated:', {
      totalWorkouts: this.totalWorkouts,
      totalMinutes: this.totalMinutes,
      totalCalories: this.totalCalories,
      currentStreak: this.currentStreak,
      weeklyWorkouts: this.weeklyWorkouts,
      caloriesBurnedToday: this.caloriesBurnedToday,
      averageWorkoutDuration: this.totalWorkouts > 0 ? Math.round(this.totalMinutes / this.totalWorkouts) : 0
    });
  }

  private calculateTodaysCalories(): number {
    const today = new Date().toISOString().split('T')[0];
    const todaysWorkouts = this.recentWorkouts.filter(w => 
      w.status === 'completed' && 
      w.completedAt && 
      w.completedAt.split('T')[0] === today
    );
    
    return todaysWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  }

  private setupPerformanceTracking(): void {
    // Setup performance tracking for enhanced analytics
    console.log('📈 Setting up performance tracking...');
  }

  // =============================================
  // MOCK DATA METHODS (for development and fallback)
  // In a production environment, these should be removed or replaced by a dedicated mock service.
  // =============================================

  private getMockUser(): User {
    return {
      id: 1,
      name: 'Ivan Petrov',
      email: 'ivan@example.com',
      age: 29,
      height: 175,
      weight: 68,
      gender: 'male',
      bloodGroup: null,
      profilePhotoUrl: null,
      phone: null,
      dateOfBirth: null,
      location: null,
      bio: null,
      activityLevel: null,
      goals: [],
      preferences: {},
      bmiInfo: { // Changed to bmiInfo
        bmi: 22.2,
        status: 'normal',
        category: 'Poids normal',
        color: '#6ee7b7',
        recommendation: 'Votre IMC est dans la normale. Maintenez vos bonnes habitudes !'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
      stats: {
        totalWorkouts: 30,
        totalMinutes: 1800,
        totalCalories: 15750,
        currentStreak: 7,
        weeklyWorkouts: 5,
        monthlyWorkouts: 20,
        totalGoals: 8, // Added
        activeGoals: 3,
        completedGoals: 5,
        hasCompletedToday: true,
        profileCompletion: 90,
        fitnessLevel: 'intermediate', // Added
        caloriesToday: 500 // Added
      },
      roles: [],
    };
  }

  private getEnhancedMockWorkoutSessions(): Workout[] { // Changed to Workout[]
    return [
      {
        id: 1,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: 'HIIT Intensif',
        durationMinutes: 35,
        caloriesBurned: 320,
        status: 'completed',
        completedAt: new Date().toISOString(),
        isTemplate: false,
      },
      {
        id: 2,
        userId: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        name: 'Musculation Upper Body',
        durationMinutes: 55,
        caloriesBurned: 280,
        status: 'completed',
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        isTemplate: false,
      },
      {
        id: 3,
        userId: 1,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        name: 'Cardio & Core',
        durationMinutes: 40,
        caloriesBurned: 240,
        status: 'completed',
        completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        isTemplate: false,
      },
      {
        id: 4,
        userId: 1,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        name: 'Yoga Flow',
        durationMinutes: 60,
        caloriesBurned: 180,
        status: 'completed',
        completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        isTemplate: false,
      },
      {
        id: 5,
        userId: 1,
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        name: 'Sprint Training',
        durationMinutes: 25,
        caloriesBurned: 300,
        status: 'completed',
        completedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        isTemplate: false,
      }
    ];
  }

  private getMockWorkoutSessions(): Workout[] { // Changed to Workout[]
    return [
      {
        id: 1,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: 'Entraînement HIIT',
        durationMinutes: 30,
        caloriesBurned: 250,
        status: 'completed',
        completedAt: new Date().toISOString(),
        isTemplate: false,
      },
      {
        id: 2,
        userId: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        name: 'Musculation',
        durationMinutes: 45,
        caloriesBurned: 180,
        status: 'completed',
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        isTemplate: false,
      }
    ];
  }

  private getMockGoals(): Goal[] {
    return [
      {
        id: 1,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: 'Perdre 5kg',
        targetValue: 5,
        currentValue: 3,
        unit: 'kg',
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'active'
      },
      {
        id: 2,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: 'Courir 10km',
        targetValue: 10,
        currentValue: 7,
        unit: 'km',
        targetDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        status: 'active'
      },
      {
        id: 3,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: '100 pompes',
        targetValue: 100,
        currentValue: 65,
        unit: 'pompes',
        targetDate: new Date(Date.now() + 20 * 86400000).toISOString(),
        status: 'active'
      }
    ];
  }

  private getMockWorkoutPlan(): Workout { // Changed to Workout
    return {
      id: 1,
      userId: 1, // Added
      createdAt: new Date().toISOString(), // Added
      updatedAt: new Date().toISOString(), // Added
      name: 'Programme Force & Cardio',
      description: 'Un programme équilibré combinant renforcement musculaire et entraînement cardiovasculaire',
      exercises: [],
      durationMinutes: 50, // Changed from estimated_duration
      caloriesBurned: 350, // Changed from estimated_calories
      difficultyLevel: 'intermediate',
      category: 'strength',
      isTemplate: true, // Added
      isPublic: false, // Added
      isActive: true,
      isCustom: false
    };
  }

  private getDefaultStats(): any {
    return {
      stats: {
        totalWorkouts: 30,
        totalMinutes: 1800,
        totalCalories: 15750,
        currentStreak: 7,
        weekly_sessions: 5,
        monthly_sessions: 20,
        totalGoals: 8, // Added
        activeGoals: 3,
        completed_today: true,
        fitnessLevel: 'intermediate', // Added
        caloriesToday: 500 // Added
      }
    };
  }

  // =============================================
  // BMI CALCULATIONS - ENHANCED VERSION
  // =============================================

  /**
   * Fourchette de poids correspondant a un IMC de 20 a 25 pour la taille de
   * l'utilisateur. Remplace le verdict IMC sur l'accueil : une fourchette
   * informe sans classer, et reste juste pour la plupart des morphologies.
   */
  idealWeightRange(): string {
    const height = this.user?.height;
    if (!height || height < 100) return '-';

    const m = height / 100;
    const low = Math.round(20 * m * m);
    const high = Math.round(25 * m * m);
    return `${low}-${high}`;
  }

  calculateBMI(): string {
    if (!this.user?.height || !this.user?.weight) {
      console.log('⚠️ BMI - Missing data:', { height: this.user?.height, weight: this.user?.weight });
      return '-';
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      console.log('📊 BMI calculated:', bmi, 'for', this.user.height, 'cm and', this.user.weight, 'kg');
      return bmi.toString();
    } catch (error) {
      console.error('❌ BMI calculation error:', error);
      return '-';
    }
  }

  getBMIStatus(): string {
    if (!this.user?.height || !this.user?.weight) {
      return 'Non calculé';
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      return BMIUtils.getStatus(bmi);
    } catch (error) {
      console.error('❌ BMI status error:', error);
      return 'Non calculé';
    }
  }

  getBMIPosition(): number {
    if (!this.user?.height || !this.user?.weight) {
      return 0;
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      return BMIUtils.getPosition(bmi);
    } catch (error) {
      console.error('❌ BMI position error:', error);
      return 0;
    }
  }

  getBMIColor(): string {
    if (!this.user?.height || !this.user?.weight) {
      return '#a8a8b0';
    }
    
    try {
      const bmi = BMIUtils.calculate(this.user.height, this.user.weight);
      return BMIUtils.getColor(bmi);
    } catch (error) {
      console.error('❌ BMI color error:', error);
      return '#a8a8b0';
    }
  }

  // =============================================
  // UI HELPERS - ENHANCED
  // =============================================

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'Bonne nuit';
    if (hour < 12) return 'Bonjour';
    if (hour < 17) return 'Bon après-midi';
    if (hour < 22) return 'Bonsoir';
    return 'Bonne soirée';
  }

  getFirstName(): string {
    if (!this.user?.name) return 'Utilisateur';
    return this.user.name.split(' ')[0];
  }

  getCalorieProgress(): number {
    if (this.dailyCalorieGoal <= 0) return 0;
    return Math.min((this.caloriesBurnedToday / this.dailyCalorieGoal) * 100, 100);
  }

  formatTime(minutes: number): string {
    return DateUtils.formatDuration(minutes);
  }

  formatDate(date: string): string {
    return DateUtils.formatDate(date);
  }

  getTimeAgo(date: string): string {
    return DateUtils.getTimeAgo(date);
  }

  getPerformanceGrowth(): number {
    // Calculate performance growth based on recent workouts
    if (this.recentWorkouts.length < 2) return 0;
    
    const recent = this.recentWorkouts.slice(0, 3);
    const older = this.recentWorkouts.slice(3, 6);
    
    if (older.length === 0) return 25; // Default growth for new users
    
    const recentAvg = recent.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / older.length;
    
    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  }

  private rotateMotivationalQuote(): void {
    const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
    this.currentQuote = this.motivationalQuotes[randomIndex];
    
    // Rotate every 45 seconds for more engagement
    setTimeout(() => this.rotateMotivationalQuote(), 45000);
  }

  // =============================================
  // NAVIGATION ACTIONS - ENHANCED
  // =============================================

  navigateToProfile(): void {
    console.log('🔗 Navigating to profile');
    this.router.navigate(['/profile']);
  }

  startWorkout(): void {
    console.log('🏃 Starting enhanced workout experience');

    if (this.currentWorkoutPlan) {
      // Navigate to workout session with plan
      this.router.navigate(['/workouts'], {
        queryParams: { planId: this.currentWorkoutPlan.id, action: 'start' }
      });
    } else {
      // Navigate to general workouts page
      this.router.navigate(['/workouts']);
    }

    // Show enhanced feedback to user
    console.log('🚀 Redirection vers votre entraînement...');
  }

  viewProgress(): void {
    console.log('📊 Viewing enhanced progress analytics');
    this.router.navigate(['/goals']);
  }

  editProfile(): void {
    console.log('✏️ Editing profile');
    this.router.navigate(['/profile']);
  }

  startTodaysWorkout(): void {
    console.log('🏃 Starting today\'s recommended workout');
    this.startWorkout();
  }

  retryLoad(): void {
    console.log('🔄 Retrying enhanced data load');
    this.loadDashboardData();
  }

  // =============================================
  // ENHANCED QUICK ACTIONS
  // =============================================

  markGoalProgress(goal: Goal, increment: number = 1): void {
    console.log('📈 Marking enhanced goal progress:', goal.title);

    const newValue = Math.min(goal.currentValue + increment, goal.targetValue);

    if (this.userService) {
      this.userService.updateGoalProgress(goal.id!, newValue) // Changed to updateGoalProgress
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedGoal) => {
            const index = this.activeGoals.findIndex(g => g.id === goal.id);
            if (index !== -1) {
              this.activeGoals[index] = updatedGoal;
            }

            // Calculate progress percentage
            const progress = Math.round((newValue / goal.targetValue) * 100);
            console.log(`🎯 Objectif mis à jour: ${progress}% complété`);

            // Check if goal is completed with celebration
            if (newValue >= goal.targetValue) {
              console.log(`🎉 Félicitations ! Objectif "${goal.title}" atteint !`);
              this.celebrateGoalCompletion(goal);
            }
          },
          error: (error) => {
            console.error('Error updating goal:', error);
            console.error('❌ Erreur lors de la mise à jour de l\'objectif');
          }
        });
    } else {
      // Local update if no service
      goal.currentValue = newValue;
      const progress = Math.round((newValue / goal.targetValue) * 100);
      console.log(`🎯 Objectif mis à jour: ${progress}% complété`);

      if (newValue >= goal.targetValue) {
        goal.status = 'completed';
        console.log(`🎉 Félicitations ! Objectif "${goal.title}" atteint !`);
        this.celebrateGoalCompletion(goal);
      }

      this.cdr.detectChanges();
    }
  }

  private celebrateGoalCompletion(goal: Goal): void {
    // Add visual celebration effect
    console.log('🎊 Celebrating goal completion:', goal.title);
    // Could trigger confetti animation or other celebration effects
  }

  quickLogWorkout(): void {
    console.log('📝 Quick logging enhanced workout');
    
    const sessionData: Partial<Workout> = { // Changed to Partial<Workout>
      name: 'Séance Express', // Changed to name
      durationMinutes: 25,
      caloriesBurned: WorkoutUtils.calculateCalories(25, WorkoutIntensity.High, this.user?.weight || 70),
      status: 'completed',
      completedAt: new Date().toISOString(),
      isTemplate: false, // Added
      userId: this.user?.id || 1, // Added
      createdAt: new Date().toISOString(), // Added
      updatedAt: new Date().toISOString(), // Added
    };

    if (this.workoutService) { // Changed to workoutService
      this.workoutService.logWorkout(sessionData as any) // Changed to logWorkout
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (session) => {
            this.recentWorkouts.unshift(session);
            this.calculateEnhancedStats();
            console.log('💪 Séance express enregistrée avec succès !');
          },
          error: (error) => {
            console.error('Error logging workout:', error);
            console.error('❌ Erreur lors de l\'enregistrement');
          }
        });
    } else {
      // Local update if no service
      const mockSession: Workout = { ...sessionData, id: Date.now(), userId: sessionData.userId || 1, name: sessionData.name || 'Séance Express', isTemplate: sessionData.isTemplate || false }; // Changed to Workout
      this.recentWorkouts.unshift(mockSession);
      this.calculateEnhancedStats();
      console.log('💪 Séance express enregistrée avec succès !');
      this.cdr.detectChanges();
    }
  }

  // =============================================
  // PERFORMANCE INSIGHTS
  // =============================================

  getPerformanceInsight(): string {
    const growth = this.getPerformanceGrowth();
    
    if (growth > 20) return 'Progression excellente ! 🚀';
    if (growth > 10) return 'Très bonne progression ! 📈';
    if (growth > 0) return 'Progression constante ! 👍';
    if (growth === 0) return 'Maintenez le rythme ! 💪';
    return 'Concentrez-vous sur la régularité ! 🎯';
  }

  getStreakMessage(): string {
    if (this.currentStreak >= 10) return 'Série légendaire ! 🔥';
    if (this.currentStreak >= 7) return 'Série impressionnante ! ⭐';
    if (this.currentStreak >= 3) return 'Belle série ! 💪';
    if (this.currentStreak >= 1) return 'Bon début ! 👍';
    return 'Commencez votre série ! 🎯';
  }

  // =============================================
  // CALENDAR EVENT HANDLERS
  // =============================================

  onCalendarDaySelected(date: Date): void {
    console.log('📅 Enhanced calendar day selected:', date);
    // Could implement day-specific workout recommendations
  }

  onCalendarActivityClicked(activity: any): void {
    console.log('📅 Enhanced calendar activity clicked:', activity);
    
    if (activity.type === 'workout') {
      this.startWorkout();
    } else if (activity.type === 'goal') {
      this.viewProgress();
    }
  }

  onCalendarScheduleRequested(date: Date): void {
    console.log('📅 Enhanced schedule requested for:', date);
    this.router.navigate(['/calendar'], {
      queryParams: { date: date.toISOString().split('T')[0] }
    });
  }

  // =============================================
  // PERFORMANCE TRACKING
  // =============================================

  trackWorkoutStart(workoutId?: number): void {
    console.log('📊 Tracking workout start:', workoutId);
    // Analytics tracking for workout start
  }

  trackGoalUpdate(goalId: number, progress: number): void {
    console.log('📊 Tracking goal update:', goalId, progress);
    // Analytics tracking for goal progress
  }

  trackDashboardInteraction(action: string, element: string): void {
    console.log('📊 Tracking dashboard interaction:', action, element);
    // Analytics tracking for user interactions
  }

  calculateAge(birthdate: string): number {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

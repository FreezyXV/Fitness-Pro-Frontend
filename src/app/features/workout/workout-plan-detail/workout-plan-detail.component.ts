// src/app/workout/workout-plan-detail/workout-plan-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs'; // Added 'of'
import { takeUntil, switchMap, catchError } from 'rxjs/operators';

import { WorkoutService } from '@app/services/workout.service';
import { Workout,  WorkoutType, WorkoutGoal, WorkoutFrequency, WorkoutIntensity, BodyFocus, Equipment } from '@shared';
import { WorkoutUtils } from '@shared';

@Component({
  selector: 'app-workout-plan-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workout-plan-detail.component.html',
  styleUrls: ['./workout-plan-detail.component.scss'],
})
export class WorkoutPlanDetailComponent implements OnInit, OnDestroy {
  workoutPlan: Workout | null = null; // Changed to Workout | null
  workoutHistory: Workout[] = []; // Changed to Workout[]
  isLoading = true;
  error: string | null = null;
  loadingProgress = 0;

  // UI State
  expandedExercises = new Set<number>();
  allExpanded = false;
  compactView = false;
  isFavorite = false;

  // Workout session state
  isStartingWorkout = false;
  workoutSessionStarted = false;
  currentSessionId: number | null = null;

  // Exercise status tracking: 'not_started' | 'in_progress' | 'completed'
  exerciseStatus = new Map<
    number,
    'not_started' | 'in_progress' | 'completed'
  >();
  currentExerciseIndex: number | null = null;

  private destroy$ = new Subject<void>();

  // Configuration
  readonly difficultyLevels = [
    { value: 'beginner', label: 'Débutant', icon: '🟢', color: '#4CAF50' },
    {
      value: 'intermediate',
      label: 'Intermédiaire',
      icon: '🟡',
      color: '#FF9800',
    },
    { value: 'advanced', label: 'Avancé', icon: '🔴', color: '#F44336' },
  ];

  readonly categories = [
    { value: 'strength', label: 'Force', icon: '💪' },
    { value: 'cardio', label: 'Cardio', icon: '❤️' },
    { value: 'hiit', label: 'HIIT', icon: '🔥' },
    { value: 'flexibility', label: 'Flexibilité', icon: '🧘' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService
  ) {}

  ngOnInit(): void {
    this.loadWorkoutPlan();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWorkoutPlan(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id || isNaN(Number(id))) {
            this.error = 'ID du programme invalide';
            this.isLoading = false;
            return of(null); // Return observable of null for type safety
          }

          this.loadingProgress = 25;
          return this.workoutService.getWorkoutTemplate(Number(id));
        }),
        switchMap((plan: Workout | null) => {
          // Explicitly type plan
          if (!plan) {
            this.error = 'Programme non trouvé';
            this.isLoading = false;
            return of([]); // Return observable of empty array for type safety
          }

          this.workoutPlan = plan;
          this.loadingProgress = 75;

          // Load workout history for this template
          return this.workoutService.getWorkoutSessions({
            template_id: plan.id,
            limit: 10,
          });
        }),
        catchError((error) => {
          console.error('Error loading workout plan:', error);
          this.error = 'Erreur lors du chargement du programme';
          this.isLoading = false;
          return of([]); // Return observable of empty array for type safety
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sessions) => {
          this.workoutHistory = sessions || [];
          this.loadingProgress = 100;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement';
          this.isLoading = false;
        },
      });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/workouts']);
  }

  retry(): void {
    this.error = null;
    this.isLoading = true;
    this.loadWorkoutPlan();
  }

  // Action methods
  startSession(template: Workout): void {
    if (this.isStartingWorkout) return;

    this.isStartingWorkout = true;

    this.workoutService
      .startWorkoutSession(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.isStartingWorkout = false;
          this.workoutSessionStarted = true;
          this.currentSessionId = session.id;

          console.log(`Session démarrée pour ${template.name}`);

          // Initialize exercise status tracking
          template.exercises?.forEach((_, index) => {
            this.exerciseStatus.set(index, 'not_started');
          });

          // Show success feedback
          this.showWorkoutStartedFeedback(template.name);
        },
        error: (error) => {
          this.isStartingWorkout = false;
          console.error('Erreur lors du démarrage de la session');
          console.error('Start session error:', error);
        },
      });
  }

  private showWorkoutStartedFeedback(workoutName: string): void {
    // Visual feedback that workout has started
    const message = `🏋️ Session "${workoutName}" démarrée !`;
    console.log(message);

    // Could add more visual feedback here like changing button states
  }

  editPlan(template: Workout): void {
    this.router.navigate(['/workouts/edit', template.id]);
  }

  duplicatePlan(template: Workout): void {
    this.workoutService
      .duplicateWorkoutTemplate(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (duplicatedTemplate) => {
          console.log(
            `Programme "${duplicatedTemplate.name}" dupliqué`
          );
          this.router.navigate(['/workouts']);
        },
        error: (error) => {
          console.error('Erreur lors de la duplication');
          console.error('Duplicate error:', error);
        },
      });
  }

  addToCalendar(template: Workout): void {
    this.router.navigate(['/calendar'], {
      queryParams: {
        action: 'add-workout',
        templateId: template.id,
      },
    });
  }

  shareWorkoutPlan(): void {
    if (this.workoutPlan) {
      // Implement sharing logic
      console.info('Fonctionnalité de partage à venir');
    }
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    // Implement favorite logic
    console.info(
      this.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris'
    );
  }

  // UI helper methods
  toggleExerciseExpansion(index: number): void {
    if (this.expandedExercises.has(index)) {
      this.expandedExercises.delete(index);
    } else {
      this.expandedExercises.add(index);
    }
  }

  toggleExpandAll(): void {
    this.allExpanded = !this.allExpanded;
    if (this.allExpanded) {
      this.workoutPlan?.exercises?.forEach((_, index) => {
        this.expandedExercises.add(index);
      });
    } else {
      this.expandedExercises.clear();
    }
  }

  toggleCompactView(): void {
    this.compactView = !this.compactView;
  }

  // Helper methods (same as WorkoutPlanCardComponent)
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

  getCategoryIcon(category?: string): string {
    return this.getCategoryInfo(category).icon;
  }

  getWorkoutSessionStatusText(): string {
    if (this.isStartingWorkout) {
      return 'Démarrage...';
    }
    if (this.workoutSessionStarted) {
      return 'Session en cours';
    }
    return 'Démarrer la séance';
  }

  getWorkoutSessionButtonClass(): string {
    if (this.isStartingWorkout) {
      return 'action-btn primary large loading';
    }
    if (this.workoutSessionStarted) {
      return 'action-btn success large active';
    }
    return 'action-btn primary large';
  }

  getCategoryLabel(category?: string): string {
    return this.getCategoryInfo(category).label;
  }

  getDifficultyIcon(difficulty?: string): string {
    return this.getDifficultyInfo(difficulty).icon;
  }

  getDifficultyLabel(difficulty?: string): string {
    return this.getDifficultyInfo(difficulty).label;
  }

  formatDuration(minutes?: number): string {
    // Use the provided minutes parameter first, fallback to workout plan data
    let duration = minutes;

    if (duration === undefined || duration === null) {
      duration = this.workoutPlan?.estimatedDuration || this.workoutPlan?.durationMinutes || 0;
    }

    if (!duration || isNaN(duration) || duration <= 0) return '0 min';

    const hours = Math.floor(duration / 60);
    const remainingMinutes = duration % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${duration} min`;
  }

  formatCalories(calories?: number): string {
    // Use the provided calories parameter first, fallback to workout plan data
    let cals = calories;

    if (cals === undefined || cals === null) {
      cals = this.workoutPlan?.estimatedCalories || this.workoutPlan?.caloriesBurned || 0;
    }

    if (!cals || isNaN(cals) || cals <= 0) return '0 cal';
    return `${cals} cal`;
  }

  formatSeconds(seconds?: number): string {
    if (!seconds || isNaN(seconds)) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    return `${seconds}s`;
  }

  getTotalSets(): number {
    return (
      this.workoutPlan?.exercises?.reduce(
        (total, exercise) => total + (exercise.sets || 0),
        0
      ) || 0
    ); // Added || 0 for exercise.sets
  }

  getTargetMuscles(): string[] {
    const muscles: Set<string> = new Set();
    this.workoutPlan?.exercises?.forEach((exercise) => {
      if (exercise.muscleGroups) {
        exercise.muscleGroups.forEach((muscle: string) => muscles.add(muscle));
      }
    });
    return Array.from(muscles);
  }

  getBodyPartIcon(muscle: string): string {
    const bodyPartIcons: { [key: string]: string } = {
      chest: '🫁',
      back: '🦴',
      arms: '💪',
      legs: '🦵',
      shoulders: '🤲',
      abs: '🎯',
      cardio: '❤️',
      full_body: '🧍',
    };
    return bodyPartIcons[muscle] || '💪';
  }

  getBodyPartLabel(bodyPart: string): string {
    const bodyPartLabels: { [key: string]: string } = {
      chest: 'Poitrine',
      back: 'Dos',
      arms: 'Bras',
      legs: 'Jambes',
      shoulders: 'Épaules',
      abs: 'Abdominaux',
      cardio: 'Cardio',
      full_body: 'Corps entier',
    };
    return bodyPartLabels[bodyPart] || bodyPart;
  }

  getAgeFromDate(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
    return `${Math.floor(diffDays / 30)}mois`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }

  getAverageRating(): number {
    // Implement based on your rating system
    return 0;
  }

  getCompletionRate(): number {
    if (!this.workoutHistory.length) return 0;
    const completed = this.workoutHistory.filter(
      (s) => s.status === 'completed'
    ).length;
    return Math.round((completed / this.workoutHistory.length) * 100);
  }

  viewExerciseDetail(exerciseId: number): void {
    this.router.navigate(['/exercises', exerciseId]);
  }

  startSingleExercise(exercise: any, exerciseIndex: number): void {
    if (!this.workoutSessionStarted) {
      console.warn(
        "Veuillez d'abord démarrer une session d'entraînement"
      );
      return;
    }

    const currentStatus = this.exerciseStatus.get(exerciseIndex);
    if (currentStatus === 'completed') {
      console.info('Cet exercice est déjà terminé');
      return;
    }

    // Set current exercise as in progress
    this.exerciseStatus.set(exerciseIndex, 'in_progress');
    this.currentExerciseIndex = exerciseIndex;

    // Stop any other exercise that might be in progress
    this.exerciseStatus.forEach((status, index) => {
      if (index !== exerciseIndex && status === 'in_progress') {
        this.exerciseStatus.set(index, 'not_started');
      }
    });

    console.log(`🏋️ Exercice "${exercise.name}" en cours !`);
    this.showExerciseStartedFeedback(exercise, exerciseIndex);
  }

  completeExercise(exercise: any, exerciseIndex: number): void {
    const currentStatus = this.exerciseStatus.get(exerciseIndex);

    if (currentStatus !== 'in_progress') {
      console.warn("Vous devez d'abord commencer cet exercice");
      return;
    }

    // Mark exercise as completed
    this.exerciseStatus.set(exerciseIndex, 'completed');
    this.currentExerciseIndex = null;

    console.log(`✅ Exercice "${exercise.name}" terminé !`);

    // Check if all exercises are completed
    this.checkWorkoutCompletion();
  }

  pauseExercise(exercise: any, exerciseIndex: number): void {
    const currentStatus = this.exerciseStatus.get(exerciseIndex);

    if (currentStatus !== 'in_progress') {
      return;
    }

    // Pause the exercise (set back to not started)
    this.exerciseStatus.set(exerciseIndex, 'not_started');
    this.currentExerciseIndex = null;

    console.info(`⏸️ Exercice "${exercise.name}" mis en pause`);
  }

  resetExercise(exercise: any, exerciseIndex: number): void {
    // Reset exercise to not started state
    this.exerciseStatus.set(exerciseIndex, 'not_started');
    if (this.currentExerciseIndex === exerciseIndex) {
      this.currentExerciseIndex = null;
    }

    console.info(`🔄 Exercice "${exercise.name}" réinitialisé`);
  }

  private showExerciseStartedFeedback(
    _exercise: any,
    exerciseIndex: number
  ): void {
    // Visual feedback that exercise has started - handled by CSS classes via getExerciseStatusClass
    // Remove old active classes
    const allExercises = document.querySelectorAll('.exercise-item');
    allExercises.forEach((el) => el.classList.remove('exercise-active'));

    // Add active class to current exercise
    const exerciseElement = document.querySelector(
      `[data-exercise-index="${exerciseIndex}"]`
    );
    if (exerciseElement) {
      exerciseElement.classList.add('exercise-active');
    }
  }

  private checkWorkoutCompletion(): void {
    if (!this.workoutPlan?.exercises) return;

    const totalExercises = this.workoutPlan.exercises.length;
    const completedExercises = Array.from(this.exerciseStatus.values()).filter(
      (status) => status === 'completed'
    ).length;

    if (completedExercises === totalExercises) {
      this.showWorkoutCompletionOption();
    } else {
      const remaining = totalExercises - completedExercises;
      console.info(`Plus que ${remaining} exercice(s) à terminer !`);
    }
  }

  private showWorkoutCompletionOption(): void {
    console.log(
      '🎉 Tous les exercices terminés ! Vous pouvez terminer votre session.'
    );
    // Could show a completion button or modal
  }

  completeWorkoutSession(): void {
    if (!this.currentSessionId) {
      console.error('Aucune session active à terminer');
      return;
    }

    const completionData = {
      notes: "Session terminée depuis l'interface",
      exercises: this.getExerciseCompletionData(),
    };

    this.workoutService
      .completeWorkoutSession(this.currentSessionId, completionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_completedSession) => {
          this.workoutSessionStarted = false;
          this.currentSessionId = null;
          this.currentExerciseIndex = null;
          this.exerciseStatus.clear();

          console.log(
            "🏆 Session d'entraînement terminée avec succès !"
          );

          // Refresh workout history
          this.loadWorkoutPlan();
        },
        error: (error) => {
          console.error(
            'Erreur lors de la finalisation de la session'
          );
          console.error('Complete session error:', error);
        },
      });
  }

  private getExerciseCompletionData(): any[] {
    if (!this.workoutPlan?.exercises) return [];

    return this.workoutPlan.exercises.map((exercise, index) => ({
      exercise_id: exercise.id,
      is_completed: this.exerciseStatus.get(index) === 'completed',
      completed_sets:
        this.exerciseStatus.get(index) === 'completed' ? exercise.sets : 0,
      completed_reps:
        this.exerciseStatus.get(index) === 'completed' ? exercise.reps : 0,
    }));
  }

  getExerciseStatus(
    exerciseIndex: number
  ): 'not_started' | 'in_progress' | 'completed' {
    return this.exerciseStatus.get(exerciseIndex) || 'not_started';
  }

  isExerciseCompleted(exerciseIndex: number): boolean {
    return this.exerciseStatus.get(exerciseIndex) === 'completed';
  }

  isExerciseInProgress(exerciseIndex: number): boolean {
    return this.exerciseStatus.get(exerciseIndex) === 'in_progress';
  }

  isExerciseNotStarted(exerciseIndex: number): boolean {
    return this.exerciseStatus.get(exerciseIndex) === 'not_started';
  }

  editWorkoutPlan(): void {
    if (this.workoutPlan) {
      this.editPlan(this.workoutPlan);
    }
  }

  getProgressPercentage(): number {
    if (!this.workoutPlan?.exercises?.length) return 0;

    const completed = this.getCompletedExercisesCount();
    return Math.round((completed / this.workoutPlan.exercises.length) * 100);
  }

  getExerciseStatusClass(exerciseIndex: number): string {
    const status = this.getExerciseStatus(exerciseIndex);
    switch (status) {
      case 'completed':
        return 'exercise-completed';
      case 'in_progress':
        return 'exercise-in-progress';
      case 'not_started':
      default:
        return 'exercise-not-started';
    }
  }

  getExerciseStatusText(exerciseIndex: number): string {
    const status = this.getExerciseStatus(exerciseIndex);
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'not_started':
      default:
        return 'Pas encore commencé';
    }
  }

  getCompletedExercisesCount(): number {
    return Array.from(this.exerciseStatus.values()).filter(
      (status) => status === 'completed'
    ).length;
  }

  getInProgressExercisesCount(): number {
    return Array.from(this.exerciseStatus.values()).filter(
      (status) => status === 'in_progress'
    ).length;
  }

  getWorkoutBodyFocus(): string {
    if (!this.workoutPlan) return 'N/A';

    const bodyFocus = this.workoutPlan.bodyFocus || this.inferBodyFocusFromExercises();
    return WorkoutUtils.getBodyFocusLabel(bodyFocus as BodyFocus);
  }

  getWorkoutTypeLabel(): string {
    if (!this.workoutPlan) return 'N/A';

    const type = this.workoutPlan.type || this.inferTypeFromCategory();
    return WorkoutUtils.getWorkoutTypeLabel(type as WorkoutType);
  }

  getWorkoutIntensity(): string {
    if (!this.workoutPlan) return 'N/A';

    const intensity = this.workoutPlan.intensity || this.inferIntensityFromDifficulty();
    return WorkoutUtils.getWorkoutIntensityLabel(intensity as WorkoutIntensity);
  }

  getRequiredEquipment(): string {
    if (!this.workoutPlan) return 'Aucun';

    const equipment = this.workoutPlan.equipment || this.inferEquipmentFromExercises();
    return WorkoutUtils.getEquipmentLabel(equipment as Equipment);
  }

  getWorkoutGoal(): string {
    if (!this.workoutPlan) return 'N/A';

    const goal = this.workoutPlan.goal || this.inferGoalFromCategory();
    return WorkoutUtils.getWorkoutGoalLabel(goal as WorkoutGoal);
  }

  getWorkoutFrequency(): string {
    if (!this.workoutPlan) return 'N/A';

    const frequency = this.workoutPlan.frequency || this.inferFrequencyFromDifficulty();
    return WorkoutUtils.getWorkoutFrequencyLabel(frequency as WorkoutFrequency);
  }

  // Helper methods to infer missing data on frontend side as backup
  private inferBodyFocusFromExercises(): BodyFocus {
    if (!this.workoutPlan?.exercises || this.workoutPlan.exercises.length === 0) {
      return BodyFocus.FullBody;
    }

    const bodyParts = this.workoutPlan.exercises
      .map(ex => ex.bodyPart)
      .filter(bp => bp)
      .reduce((acc: string[], bp) => {
        if (!acc.includes(bp)) acc.push(bp);
        return acc;
      }, []);

    if (bodyParts.length >= 4) return BodyFocus.FullBody;

    const upperBodyParts = ['chest', 'back', 'shoulders', 'arms'];
    const lowerBodyParts = ['legs'];
    const coreParts = ['abs'];

    const hasUpperBody = bodyParts.some(bp => upperBodyParts.includes(bp));
    const hasLowerBody = bodyParts.some(bp => lowerBodyParts.includes(bp));
    const hasCore = bodyParts.some(bp => coreParts.includes(bp));

    if (hasUpperBody && hasLowerBody) return BodyFocus.FullBody;
    if (hasUpperBody) return BodyFocus.UpperBody;
    if (hasLowerBody) return BodyFocus.LowerBody;
    if (hasCore) return BodyFocus.Core;

    return BodyFocus.FullBody;
  }

  private inferTypeFromCategory(): WorkoutType {
    if (!this.workoutPlan?.category) return WorkoutType.Custom;

    const categoryToType: Record<string, WorkoutType> = {
      'strength': WorkoutType.Strength,
      'cardio': WorkoutType.Cardio,
      'hiit': WorkoutType.HIIT,
      'flexibility': WorkoutType.Flexibility
    };

    return categoryToType[this.workoutPlan.category] || WorkoutType.Custom;
  }

  private inferIntensityFromDifficulty(): WorkoutIntensity {
    if (!this.workoutPlan?.difficultyLevel) return WorkoutIntensity.Medium;

    const difficultyToIntensity: Record<string, WorkoutIntensity> = {
      'beginner': WorkoutIntensity.Low,
      'intermediate': WorkoutIntensity.Medium,
      'advanced': WorkoutIntensity.High
    };

    return difficultyToIntensity[this.workoutPlan.difficultyLevel] || WorkoutIntensity.Medium;
  }

  private inferEquipmentFromExercises(): Equipment {
    if (!this.workoutPlan?.exercises || this.workoutPlan.exercises.length === 0) {
      return Equipment.None;
    }

    const equipmentNeeded = this.workoutPlan.exercises
      .map(ex => ex.equipmentNeeded)
      .filter(eq => eq !== undefined && eq !== null)
      .reduce((acc: string[], eq) => {
        if (eq && !acc.includes(eq)) acc.push(eq);
        return acc;
      }, []);

    if (equipmentNeeded.length === 0) return Equipment.None;

    const gymEquipment = ['barbell', 'dumbbell', 'machine', 'cable'];
    if (equipmentNeeded.some(eq => gymEquipment.includes(eq))) {
      return Equipment.FullGym;
    }

    if (equipmentNeeded.includes('dumbbell')) return Equipment.Dumbbells;
    if (equipmentNeeded.includes('kettlebell')) return Equipment.Kettlebell;
    if (equipmentNeeded.includes('resistance_band')) return Equipment.ResistanceBands;

    return Equipment.None;
  }

  private inferGoalFromCategory(): WorkoutGoal {
    if (!this.workoutPlan?.category) return WorkoutGoal.Maintenance;

    const categoryToGoal: Record<string, WorkoutGoal> = {
      'strength': WorkoutGoal.StrengthGain,
      'cardio': WorkoutGoal.FatLoss,
      'hiit': WorkoutGoal.FatLoss,
      'flexibility': WorkoutGoal.Maintenance
    };

    return categoryToGoal[this.workoutPlan.category] || WorkoutGoal.Maintenance;
  }

  private inferFrequencyFromDifficulty(): WorkoutFrequency {
    if (!this.workoutPlan?.difficultyLevel) return WorkoutFrequency.Thrice;

    const difficultyToFrequency: Record<string, WorkoutFrequency> = {
      'beginner': WorkoutFrequency.Twice,
      'intermediate': WorkoutFrequency.Thrice,
      'advanced': WorkoutFrequency.FourTimes
    };

    return difficultyToFrequency[this.workoutPlan.difficultyLevel] || WorkoutFrequency.Thrice;
  }
}

// src/app/workout/create-workout.component.ts - FIXED IMPORTS
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// FIXED: Correct import paths
import { WorkoutService } from '@app/services/workout.service';
import {
  WorkoutTemplate,
  WorkoutExercise,
  Exercise,
  CreateWorkoutRequest,
  NotificationUtils,
  StorageUtils,
} from '@shared';

interface ExerciseFilter {
  bodyPart: string;
  difficulty: string;
  search: string;
  category: string;
}

interface WorkoutSummary {
  totalExercises: number;
  estimatedDuration: number;
  estimatedCalories: number;
  totalSets: number;
}

interface WorkoutDraft {
  formData: any;
  selectedExercises: WorkoutExercise[];
  currentStep: number;
  timestamp: string;
}

@Component({
  selector: 'app-create-workout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-workout.component.html',
  styleUrls: ['./create-workout.component.scss'],
})
export class CreateWorkoutComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  private destroy$ = new Subject<void>();

  // Forms
  workoutForm!: FormGroup;

  // Data
  availableExercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selectedExercises: (WorkoutExercise & { name?: string; bodyPart?: string; difficulty?: string })[] = [];

  // UI State
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  currentStep = 1;
  readonly totalSteps = 3;

  // Mode management
  isEditMode = false;
  editingTemplateId: number | null = null;
  originalTemplate: WorkoutTemplate | null = null;

  // Filter state
  exerciseFilter: ExerciseFilter = {
    bodyPart: 'all',
    difficulty: 'all',
    search: '',
    category: 'all',
  };

  // Configuration
  readonly workoutCategories = [
    { value: 'strength', label: 'Force', icon: '💪' },
    { value: 'cardio', label: 'Cardio', icon: '❤️' },
    { value: 'flexibility', label: 'Flexibilité', icon: '🧘' },
    { value: 'hiit', label: 'HIIT', icon: '🔥' },
  ];

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

  readonly bodyParts = [
    { value: 'all', label: 'Tous' },
    { value: 'chest', label: 'Poitrine' },
    { value: 'back', label: 'Dos' },
    { value: 'arms', label: 'Bras' },
    { value: 'legs', label: 'Jambes' },
    { value: 'shoulders', label: 'Épaules' },
    { value: 'abs', label: 'Abdominaux' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'full_body', label: 'Corps entier' },
  ];

  readonly exerciseCategories = [
    { value: 'all', label: 'Toutes' },
    { value: 'strength', label: 'Force' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'flexibility', label: 'Flexibilité' },
    { value: 'balance', label: 'Équilibre' },
  ];

  readonly steps = [
    {
      title: 'Informations de base',
      description: 'Nom, catégorie, difficulté',
    },
    {
      title: 'Sélection des exercices',
      description: 'Choisissez vos exercices',
    },
    {
      title: 'Configuration finale',
      description: 'Séries, répétitions, repos',
    },
  ];

  // Computed properties
  workoutSummary: WorkoutSummary = {
    totalExercises: 0,
    estimatedDuration: 0,
    estimatedCalories: 0,
    totalSets: 0,
  };

  constructor(
    private fb: FormBuilder,
    private workoutService: WorkoutService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkRouteParameters();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Check for existing draft
    window.setTimeout(() => {
      this.loadDraft();
    }, 1000);

    // Setup auto-save interval
    window.setInterval(() => {
      this.autoSave();
    }, 30000); // Auto-save every 30 seconds
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeForm(): void {
    this.workoutForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      category: ['strength', Validators.required],
      difficultyLevel: ['beginner', Validators.required],
      isPublic: [false],
    });
  }

  private checkRouteParameters(): void {
    // Check if we're in edit mode by looking at the route
    const templateId = this.route.snapshot.paramMap.get('id');
    if (templateId) {
      this.isEditMode = true;
      this.editingTemplateId = +templateId;
      this.loadTemplateForEditing(+templateId);
    }
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.error = null;

    // Load exercises
    this.workoutService
      .getExercises()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercises: any) => {
          this.availableExercises = exercises || [];
          this.filterExercises();
          this.isLoading = false;
          console.log('✅ Loaded exercises:', this.availableExercises.length);
        },
        error: (error: any) => {
          console.error('❌ Error loading exercises:', error);
          this.availableExercises = [];
          this.filterExercises();
          this.isLoading = false;
          this.error = 'Erreur lors du chargement des exercices';
        },
      });
  }

  private loadTemplateForEditing(templateId: number): void {
    this.workoutService
      .getWorkoutTemplate(templateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (template: WorkoutTemplate | null) => {
          if (template) {
            this.originalTemplate = template;
            this.populateFormFromTemplate(template);
            this.selectedExercises = (template.exercises || []).map(
              (exercise: Exercise) => ({
                ...exercise,
                workoutId: template.id,
                exerciseId: exercise.id,
                orderIndex: 0,
                sets: 3,
                reps: 10,
                durationSeconds: undefined,
                restTimeSeconds: 60,
                targetWeight: undefined,
                notes: '',
              })
            );
            this.updateWorkoutSummary();
            console.log('✅ Loaded template for editing:', template.name);
          } else {
            this.error = "Programme d'entraînement introuvable";
            this.router.navigate(['/workouts']);
          }
        },
        error: (error: any) => {
          this.error = 'Erreur lors du chargement du programme';
          console.error('Error loading template:', error);
        },
      });
  }

  private populateFormFromTemplate(template: WorkoutTemplate): void {
    this.workoutForm.patchValue({
      name: template.name,
      description: template.description || '',
      category: template.category || 'strength',
      difficultyLevel: template.difficultyLevel || 'beginner',
      isPublic: template.isPublic || false,
    });
  }

  // =============================================
  // EXERCISE MANAGEMENT
  // =============================================

  filterExercises(): void {
    let filtered = [...this.availableExercises];

    if (this.exerciseFilter.bodyPart !== 'all') {
      filtered = filtered.filter(
        (e) => e.bodyPart === this.exerciseFilter.bodyPart
      );
    }

    if (this.exerciseFilter.difficulty !== 'all') {
      filtered = filtered.filter(
        (e) => e.difficulty === this.exerciseFilter.difficulty
      );
    }

    if (this.exerciseFilter.category !== 'all') {
      filtered = filtered.filter(
        (e) => e.category === this.exerciseFilter.category
      );
    }

    if (this.exerciseFilter.search.trim()) {
      const searchTerm = this.exerciseFilter.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchTerm) ||
          false ||
          e.description?.toLowerCase().includes(searchTerm) ||
          false
      );
    }

    this.filteredExercises = filtered.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );

    console.log('Filtered exercises:', this.filteredExercises.length);
  }

  toggleExerciseSelection(exercise: Exercise): void {
    const existingIndex = this.selectedExercises.findIndex(
      (e: WorkoutExercise) => e.exerciseId === exercise.id
    );

    if (existingIndex > -1) {
      this.selectedExercises.splice(existingIndex, 1);
    } else {
      const exerciseWithDefaults: WorkoutExercise & { name?: string; bodyPart?: string; difficulty?: string } = {
        workoutId: this.workoutForm.value.id || 0,
        exerciseId: exercise.id,
        orderIndex: this.selectedExercises.length,
        sets: 3,
        reps: 10,
        durationSeconds: undefined,
        restTimeSeconds: 60,
        targetWeight: undefined,
        notes: '',
        // Include exercise details for template display
        name: exercise.name,
        bodyPart: exercise.bodyPart,
        difficulty: exercise.difficulty,
      };
      this.selectedExercises.push(exerciseWithDefaults);
    }
  }

  isExerciseSelected(exercise: Exercise): boolean {
    return this.selectedExercises.some(
      (e: WorkoutExercise) => e.exerciseId === exercise.id
    );
  }

  updateExerciseConfig(
    index: number,
    field: keyof WorkoutExercise,
    event: Event
  ): void {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseFloat(value);
    if (this.selectedExercises[index]) {
      const updatedExercise = { ...this.selectedExercises[index] };
      switch (field) {
        case 'sets':
        case 'reps':
        case 'durationSeconds':
        case 'restTimeSeconds':
        case 'targetWeight':
          updatedExercise[field] = isNaN(numValue) ? undefined : numValue;
          break;
        case 'notes':
          updatedExercise[field] = value;
          break;
        default:
          break;
      }
      this.selectedExercises[index] = updatedExercise;
    }
  }

  moveExercise(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.selectedExercises.length ||
      toIndex < 0 ||
      toIndex >= this.selectedExercises.length
    ) {
      return;
    }
    const [movedExercise] = this.selectedExercises.splice(fromIndex, 1);
    this.selectedExercises.splice(toIndex, 0, movedExercise);

    this.selectedExercises.forEach((exercise: WorkoutExercise, idx: number) => {
      exercise.orderIndex = idx;
    });
  }

  removeExercise(index: number): void {
    this.selectedExercises.splice(index, 1);
    this.selectedExercises.forEach((exercise: WorkoutExercise, idx: number) => {
      exercise.orderIndex = idx;
    });
  }

  calculateTotalDuration(): number {
    const totalDuration = this.selectedExercises.reduce((total, exercise: WorkoutExercise) => {
      const sets = exercise.sets || 1;
      const exerciseTime = exercise.durationSeconds
        ? exercise.durationSeconds / 60
        : exercise.reps
        ? 2
        : 0;
      const restTime = (exercise.restTimeSeconds || 60) * (sets - 1);
      return total + exerciseTime * sets + restTime / 60;
    }, 0);
    return Math.round(totalDuration);
  }

  buildCreateRequest(): CreateWorkoutRequest {
    return {
      name: this.workoutForm.value.name,
      description: this.workoutForm.value.description,
      category: this.workoutForm.value.category,
      difficultyLevel: this.workoutForm.value.difficultyLevel,
      isPublic: this.workoutForm.value.isPublic || false,
      exercises: this.selectedExercises.map(
        (exercise: WorkoutExercise, index: number) => ({
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          reps: exercise.reps,
          durationSeconds: exercise.durationSeconds || undefined,
          restTimeSeconds: exercise.restTimeSeconds || 60,
          targetWeight: exercise.targetWeight || undefined,
          notes: exercise.notes,
        })
      ),
    };
  }

  private updateWorkoutSummary(): void {
    const exercises = this.selectedExercises;

    this.workoutSummary = {
      totalExercises: exercises.length,
      totalSets: exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0),
      estimatedDuration: this.calculateEstimatedDuration(exercises),
      estimatedCalories: this.calculateEstimatedCalories(exercises),
    };
  }

  private calculateEstimatedDuration(exercises: WorkoutExercise[]): number {
    let totalMinutes = 0;

    exercises.forEach((exercise) => {
      const sets = exercise.sets || 1;
      const restTime = (exercise.restTimeSeconds || 60) * (sets - 1); // Rest between sets

      let exerciseTime = 0;
      if (exercise.durationSeconds) {
        exerciseTime = exercise.durationSeconds * sets;
      } else {
        const reps = exercise.reps || 10;
        exerciseTime = reps * 3 * sets; // 3 seconds per rep average
      }

      totalMinutes += (exerciseTime + restTime) / 60;
    });

    return Math.round(totalMinutes);
  }

  private calculateEstimatedCalories(exercises: WorkoutExercise[]): number {
    const duration = this.calculateEstimatedDuration(exercises);
    const category = this.workoutForm.get('category')?.value || 'strength';

    // Calories per minute by category
    const caloriesPerMinute = {
      strength: 8,
      cardio: 12,
      hiit: 15,
      flexibility: 4,
    };

    return Math.round(
      duration *
        (caloriesPerMinute[category as keyof typeof caloriesPerMinute] || 8)
    );
  }

  // =============================================
  // NAVIGATION & FORM
  // =============================================

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.currentStep === 1 && this.workoutForm.invalid) {
        this.markFormGroupTouched();
        return;
      }
      if (this.currentStep === 2 && this.selectedExercises.length === 0) {
        this.error = 'Veuillez sélectionner au moins un exercice';
        return;
      }
      this.currentStep++;
      this.error = null;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.error = null;
    }
  }

  onSubmit(): void {
    if (this.workoutForm.invalid || this.selectedExercises.length === 0) {
      this.markFormGroupTouched();
      this.error = 'Veuillez corriger les erreurs dans le formulaire';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const workoutData: CreateWorkoutRequest = {
      name: this.workoutForm.value.name,
      description: this.workoutForm.value.description,
      category: this.workoutForm.value.category,
      difficultyLevel: this.workoutForm.value.difficultyLevel,
      isPublic: this.workoutForm.value.isPublic || false,
      exercises: this.selectedExercises.map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        orderIndex: exercise.orderIndex,
        sets: exercise.sets,
        reps: exercise.reps,
        durationSeconds: exercise.durationSeconds || undefined,
        restTimeSeconds: exercise.restTimeSeconds || 60,
        targetWeight: exercise.targetWeight || undefined,
        notes: exercise.notes,
      })),
    };

    const operation$ =
      this.isEditMode && this.editingTemplateId
        ? this.workoutService.updateWorkoutTemplate(
            this.editingTemplateId,
            workoutData
          )
        : this.workoutService.createWorkoutTemplate(workoutData);

    operation$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (template: WorkoutTemplate) => {
        const message = this.isEditMode
          ? 'Programme modifié avec succès !'
          : 'Programme créé avec succès !';

        NotificationUtils.success(message);
        console.log('✅ Workout template saved:', template);

        // Clear draft on successful save
        this.clearDraft();

        // Navigate back to workouts list
        this.router.navigate(['/workouts']);
      },
      error: (err: any) => {
        console.error('❌ Error saving workout template:', err);
        this.error = err.message || 'Erreur lors de la sauvegarde';
        this.isSubmitting = false;
      },
    });
  }

  cancel(): void {
    const hasChanges =
      this.selectedExercises.length > 0 || this.workoutForm.dirty;

    if (hasChanges) {
      const confirmed = confirm(
        'Êtes-vous sûr de vouloir annuler ? Vos modifications seront perdues.'
      );
      if (!confirmed) return;
    }

    this.router.navigate(['/workouts']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.workoutForm.controls).forEach((key) => {
      const control = this.workoutForm.get(key);
      control?.markAsTouched();
    });
  }

  // =============================================
  // DRAFT MANAGEMENT (Auto-save)
  // =============================================

  autoSave(): void {
    if (
      this.selectedExercises.length > 0 &&
      this.workoutForm.get('name')?.value
    ) {
      const draftData: WorkoutDraft = {
        formData: this.workoutForm.value,
        selectedExercises: this.selectedExercises,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString(),
      };

      StorageUtils.setItem('workout_draft', draftData);
      console.log('💾 Auto-saved draft');
    }
  }

  loadDraft(): void {
    const draft = StorageUtils.getItem<WorkoutDraft>('workout_draft');
    if (
      draft &&
      draft.formData &&
      draft.selectedExercises &&
      !this.isEditMode
    ) {
      const shouldLoad = confirm(
        'Un brouillon a été trouvé. Voulez-vous le charger ?'
      );
      if (shouldLoad) {
        this.workoutForm.patchValue(draft.formData);
        this.selectedExercises = draft.selectedExercises || [];
        this.currentStep = draft.currentStep || 1;
        this.updateWorkoutSummary();
        NotificationUtils.info('Brouillon chargé');
      }
    }
  }

  clearDraft(): void {
    StorageUtils.removeItem('workout_draft');
    console.log('🗑️ Draft cleared');
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getFieldError(fieldName: string): string | null {
    const field = this.workoutForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return 'Trop court';
      if (field.errors['maxlength']) return 'Trop long';
      if (field.errors['min']) return 'Valeur trop petite';
      if (field.errors['max']) return 'Valeur trop grande';
    }
    return null;
  }

  getDifficultyInfo(difficulty: string) {
    return this.difficultyLevels.find((d) => d.value === difficulty);
  }

  getBodyPartLabel(bodyPart: string): string {
    const part = this.bodyParts.find((p) => p.value === bodyPart);
    return part?.label || bodyPart;
  }

  getCategoryLabel(category: string): string {
    const cat = this.workoutCategories.find((c) => c.value === category);
    return cat?.label || category;
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
    return `${seconds}s`;
  }

  setExerciseFilter(filter: keyof ExerciseFilter, value: string): void {
    (this.exerciseFilter as any)[filter] = value;
    this.filterExercises();
  }

  resetFilters(): void {
    this.exerciseFilter = {
      bodyPart: 'all',
      difficulty: 'all',
      search: '',
      category: 'all',
    };
    this.filterExercises();
  }

  canProceedToNextStep(): boolean {
    if (this.currentStep === 1) {
      return this.workoutForm.get('name')?.valid ?? false;
    }
    if (this.currentStep === 2) {
      return this.selectedExercises.length > 0;
    }
    return true;
  }

  canCreateWorkout(): boolean {
    return this.workoutForm.valid && this.selectedExercises.length > 0;
  }

  getPageTitle(): string {
    return this.isEditMode ? 'Modifier le programme' : 'Créer un programme';
  }

  clearError(): void {
    this.error = null;
  }

  getCategoryIcon(categoryValue: string): string {
    const category = this.workoutCategories.find(
      (c) => c.value === categoryValue
    );
    return category ? category.icon : '';
  }

  getDifficultyIcon(difficultyValue: string): string {
    const difficulty = this.difficultyLevels.find(
      (d) => d.value === difficultyValue
    );
    return difficulty ? difficulty.icon : '';
  }

  getDifficultyLabel(difficultyValue: string): string {
    const difficulty = this.difficultyLevels.find(
      (d) => d.value === difficultyValue
    );
    return difficulty ? difficulty.label : '';
  }

  // =============================================
  // VALIDATION HELPERS
  // =============================================

  validateExerciseConfig(): string[] {
    const errors: string[] = [];
    this.selectedExercises.forEach((exercise, index) => {
      const exerciseNumber = index + 1;
      if (!exercise.sets || exercise.sets <= 0) {
        errors.push(`Exercice ${exerciseNumber}: nombre de séries requis`);
      }
      // Require either reps or duration for an exercise
      if (!exercise.durationSeconds && (!exercise.reps || exercise.reps <= 0)) {
        errors.push(`Exercice ${exerciseNumber}: répétitions ou durée requise`);
      }
      if (
        exercise.restTimeSeconds === undefined ||
        exercise.restTimeSeconds < 0
      ) {
        errors.push(`Exercice ${exerciseNumber}: temps de repos invalide`);
      }
    });
    return errors;
  }

  // =============================================
  // TESTING METHODS
  // =============================================

  testExerciseAPI(): void {
    console.log('🧪 Testing exercise API...');
    this.workoutService.getExercises().subscribe({
      next: (exercises: WorkoutExercise[]) => {
        console.log('✅ Exercise API working, count:', exercises.length);
        NotificationUtils.success(
          `API fonctionnelle - ${exercises.length} exercices`
        );
      },
      error: (error: any) => {
        console.error('❌ Exercise API failed:', error);
        NotificationUtils.error("Échec de connexion à l'API des exercices");
      },
    });
  }

  getDebugInfo(): any {
    return {
      isEditMode: this.isEditMode,
      editingTemplateId: this.editingTemplateId,
      currentStep: this.currentStep,
      selectedExercisesCount: this.selectedExercises.length,
      availableExercisesCount: this.availableExercises.length,
      filteredExercisesCount: this.filteredExercises.length,
      formValid: this.workoutForm.valid,
      formValue: this.workoutForm.value,
      workoutSummary: this.workoutSummary,
      filters: this.exerciseFilter,
    };
  }
}

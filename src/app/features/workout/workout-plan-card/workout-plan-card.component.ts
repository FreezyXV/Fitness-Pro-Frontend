// src/app/workout/workout-plan-card/workout-plan-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workout, Exercise } from '@shared';
import { IconComponent } from '@app/shared/components/icon/icon.component';

@Component({
  selector: 'app-workout-plan-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './workout-plan-card.component.html',
  styleUrls: ['./workout-plan-card.component.scss'],
})
export class WorkoutPlanCardComponent {
  @Input() plan!: Workout; // Changed to Workout
  @Input() viewMode: 'grid' | 'list' = 'grid';

  // Events for parent component handling
  @Output() viewDetails = new EventEmitter<Workout>(); // Changed to Workout
  @Output() startSession = new EventEmitter<Workout>(); // Changed to Workout
  @Output() editPlan = new EventEmitter<Workout>(); // Changed to Workout
  @Output() duplicatePlan = new EventEmitter<Workout>(); // Changed to Workout
  @Output() addToCalendar = new EventEmitter<Workout>(); // Changed to Workout
  @Output() activatePlan = new EventEmitter<Workout>(); // Changed to Workout

  // Configuration aligned with backend
  // `icon` designe une entree du jeu d'icones (IconName), plus un emoji : un
  // rond vert, un rond jaune et un rond rouge ne se distinguent pas pour qui
  // ne percoit pas ces teintes, et la pastille porte de toute facon deja son
  // libelle en clair.
  readonly difficultyLevels = [
    { value: 'beginner', label: 'Débutant', icon: 'circle', color: '#4CAF50' },
    {
      value: 'intermediate',
      label: 'Intermédiaire',
      icon: 'bolt',
      color: '#fdba74',
    },
    { value: 'advanced', label: 'Avancé', icon: 'flame', color: '#fc8181' },
  ];

  readonly categories = [
    { value: 'strength', label: 'Force', icon: 'dumbbell', color: '#4CAF50' },
    { value: 'cardio', label: 'Cardio', icon: 'flame', color: '#FF5722' },
    { value: 'hiit', label: 'HIIT', icon: 'bolt', color: '#fdba74' },
    {
      value: 'flexibility',
      label: 'Flexibilité',
      icon: 'refresh',
      color: '#c4b5fd',
    },
  ];

  // Event handlers
  navigateToDetail(): void {
    this.viewDetails.emit(this.plan);
  }

  onStartSession(event: Event): void {
    event.stopPropagation();
    this.startSession.emit(this.plan);
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.plan);
  }

  onEditPlan(event: Event): void {
    event.stopPropagation();
    this.editPlan.emit(this.plan);
  }

  onDuplicatePlan(event: Event): void {
    event.stopPropagation();
    this.duplicatePlan.emit(this.plan);
  }

  onAddToCalendar(event: Event): void {
    event.stopPropagation();
    this.addToCalendar.emit(this.plan);
  }

  onActivatePlan(event: Event): void {
    event.stopPropagation();
    this.activatePlan.emit(this.plan);
  }

  // Helper methods
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
    if (!minutes || isNaN(minutes)) return '0 min';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes} min`;
  }

  formatCalories(calories?: number): string {
    if (!calories || isNaN(calories)) return '0 cal';
    return `${calories} cal`;
  }

  getTemplateAge(template: Workout): string {
    const now = new Date();
    const created = new Date(template.createdAt || '');
    if (isNaN(created.getTime())) return 'N/A';

    const diffDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  getTargetMuscles(plan: Workout): string[] {
    const muscles: Set<string> = new Set();
    plan.exercises?.forEach((exercise: Exercise) => {
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
}

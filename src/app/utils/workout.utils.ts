// src/app/utils/workout.utils.ts - Utilitaires pour les programmes d'entraînement
import {
  Workout,
  WorkoutType,
  WorkoutGoal,
  WorkoutFrequency,
  WorkoutIntensity,
  BodyFocus,
  Equipment,
} from '@shared';

export class WorkoutUtils {
  static getWorkoutTypeLabel(type?: WorkoutType): string {
    if (!type) return 'N/A';
    const labels: Record<WorkoutType, string> = {
      [WorkoutType.Strength]: 'Force',
      [WorkoutType.Cardio]: 'Cardio',
      [WorkoutType.HIIT]: 'HIIT',
      [WorkoutType.Flexibility]: 'Flexibilité',
      [WorkoutType.Custom]: 'Personnalisé',
    };
    return labels[type] || 'Inconnu';
  }

  static getWorkoutGoalLabel(goal?: WorkoutGoal): string {
    if (!goal) return 'N/A';
    const labels: Record<WorkoutGoal, string> = {
      [WorkoutGoal.MuscleGain]: 'Prise de masse',
      [WorkoutGoal.FatLoss]: 'Perte de poids',
      [WorkoutGoal.Endurance]: 'Endurance',
      [WorkoutGoal.StrengthGain]: 'Gain de force',
      [WorkoutGoal.Maintenance]: 'Maintien',
    };
    return labels[goal] || 'Inconnu';
  }

  static getWorkoutFrequencyLabel(frequency?: WorkoutFrequency): string {
    if (!frequency) return 'N/A';
    const labels: Record<WorkoutFrequency, string> = {
      [WorkoutFrequency.Once]: '1 fois/semaine',
      [WorkoutFrequency.Twice]: '2 fois/semaine',
      [WorkoutFrequency.Thrice]: '3 fois/semaine',
      [WorkoutFrequency.FourTimes]: '4 fois/semaine',
      [WorkoutFrequency.FiveTimes]: '5 fois/semaine',
      [WorkoutFrequency.SixTimes]: '6 fois/semaine',
      [WorkoutFrequency.Everyday]: 'Tous les jours',
    };
    return labels[frequency] || 'Inconnu';
  }

  static getWorkoutIntensityLabel(intensity?: WorkoutIntensity): string {
    if (!intensity) return 'N/A';
    const labels: Record<WorkoutIntensity, string> = {
      [WorkoutIntensity.Low]: 'Faible',
      [WorkoutIntensity.Medium]: 'Moyenne',
      [WorkoutIntensity.High]: 'Élevée',
    };
    return labels[intensity] || 'Inconnu';
  }

  static getBodyFocusLabel(focus?: BodyFocus): string {
    if (!focus) return 'N/A';
    const labels: Record<BodyFocus, string> = {
      [BodyFocus.FullBody]: 'Corps entier',
      [BodyFocus.UpperBody]: 'Haut du corps',
      [BodyFocus.LowerBody]: 'Bas du corps',
      [BodyFocus.Core]: 'Tronc',
    };
    return labels[focus] || 'Inconnu';
  }

  static getEquipmentLabel(equipment?: Equipment): string {
    if (!equipment) return 'Aucun';
    const labels: Record<Equipment, string> = {
      [Equipment.None]: 'Aucun',
      [Equipment.Dumbbells]: 'Haltères',
      [Equipment.Barbell]: 'Barre',
      [Equipment.Kettlebell]: 'Kettlebell',
      [Equipment.ResistanceBands]: 'Bandes de résistance',
      [Equipment.FullGym]: 'Salle de sport complète',
    };
    return labels[equipment] || 'Inconnu';
  }

  static calculateCalories(durationMinutes: number, intensity: WorkoutIntensity, userWeightKg: number): number {
    if (durationMinutes <= 0 || userWeightKg <= 0) {
      return 0;
    }

    const metValues: Record<WorkoutIntensity, number> = {
      [WorkoutIntensity.Low]: 3.5,
      [WorkoutIntensity.Medium]: 5.0,
      [WorkoutIntensity.High]: 7.0,
    };

    const met = metValues[intensity] || metValues[WorkoutIntensity.Medium];

    // Formula: Calories = duration (min) * MET * 3.5 * weight (kg) / 200
    const caloriesBurned = (durationMinutes * met * 3.5 * userWeightKg) / 200;

    return Math.round(caloriesBurned);
  }
}

// onboarding.service.ts - Profil d'entree et selection du premier programme.
//
// L'inscription ne demandait que nom, email et mot de passe : l'app ne savait
// donc rien de l'utilisateur au premier lancement et ouvrait sur un tableau de
// bord vide. C'est le premier facteur d'abandon d'une app de fitness — toutes
// les references du marche font repondre a quatre ou cinq questions puis
// proposent un programme pret a demarrer.
//
// Les reponses sont stockees localement : elles doivent survivre au mode
// invite et a un backend endormi. Les mesures physiques, elles, remontent au
// profil serveur ou des colonnes existent deja.
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { WorkoutService } from '@app/services/workout.service';
import { Workout } from '@shared';

export type TrainingGoal = 'lose_weight' | 'build_muscle' | 'get_stronger' | 'stay_fit';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'bodyweight' | 'dumbbells' | 'full_gym';

export interface OnboardingProfile {
  goal: TrainingGoal;
  level: TrainingLevel;
  /** Seances par semaine visees. */
  frequency: number;
  equipment: Equipment;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: 'male' | 'female' | 'other' | null;
  completedAt: string;
}

const STORAGE_KEY = 'fitnesspro.onboarding';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly workouts = inject(WorkoutService);

  readonly profile = signal<OnboardingProfile | null>(this.load());

  isComplete(): boolean {
    return this.profile() !== null;
  }

  save(profile: OnboardingProfile): void {
    this.profile.set(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Stockage indisponible (navigation privee) : le parcours reste valide
      // pour la session, il sera simplement represente au prochain lancement.
    }
  }

  /** Permet de refaire le parcours depuis le profil. */
  reset(): void {
    this.profile.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Choisit le programme le plus proche des reponses parmi les modeles
   * existants. On note chaque modele plutot que de filtrer : un filtre strict
   * ne renvoie souvent rien, et proposer "aucun programme" a la fin d'un
   * onboarding est le pire resultat possible.
   */
  suggestProgram(profile: OnboardingProfile): Observable<Workout | null> {
    return this.workouts.getWorkoutTemplates().pipe(
      // Borne courte, volontairement plus stricte que le timeout global de 30 s :
      // le dernier ecran de l'onboarding ne doit jamais rester fige sur
      // "Préparation…". Passe ce delai on affiche l'ecran de fin sans
      // recommandation, ce que le template gere explicitement.
      timeout(6000),
      map((templates) => {
        if (!templates?.length) return null;

        const scored = templates.map((template) => ({
          template,
          score: scoreTemplate(template, profile),
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored[0].template;
      }),
      catchError(() => of(null))
    );
  }

  private load(): OnboardingProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<OnboardingProfile>;
      // Un parcours sans objectif ni niveau est incomplet : on le rejoue.
      return parsed?.goal && parsed?.level ? (parsed as OnboardingProfile) : null;
    } catch {
      return null;
    }
  }
}

/** Correspondance objectif -> categories de programme, par ordre de pertinence. */
const GOAL_CATEGORIES: Record<TrainingGoal, string[]> = {
  lose_weight: ['cardio', 'hiit', 'full_body', 'endurance'],
  build_muscle: ['strength', 'hypertrophy', 'muscle', 'full_body'],
  get_stronger: ['strength', 'powerlifting', 'muscle'],
  stay_fit: ['full_body', 'mobility', 'cardio', 'flexibility'],
};

const LEVEL_ORDER: TrainingLevel[] = ['beginner', 'intermediate', 'advanced'];

function scoreTemplate(template: Workout, profile: OnboardingProfile): number {
  let score = 0;

  // Categorie : le signal le plus fort, l'objectif prime sur le reste.
  const haystack = `${template.category ?? ''} ${template.type ?? ''} ${template.goal ?? ''}`.toLowerCase();
  const wanted = GOAL_CATEGORIES[profile.goal];
  const categoryRank = wanted.findIndex((c) => haystack.includes(c));
  if (categoryRank >= 0) score += 50 - categoryRank * 8;

  // Niveau : l'ecart exact vaut mieux qu'une correspondance binaire, un
  // debutant preferera un programme intermediaire a un programme avance.
  const templateLevel = (template.difficultyLevel ?? '') as TrainingLevel;
  const templateIndex = LEVEL_ORDER.indexOf(templateLevel);
  const profileIndex = LEVEL_ORDER.indexOf(profile.level);
  if (templateIndex >= 0) score += 30 - Math.abs(templateIndex - profileIndex) * 12;

  // Frequence : un programme dont le rythme depasse la disponibilite declaree
  // sera abandonne, on le penalise.
  const templateFrequency = Number(template.frequency ?? 0);
  if (templateFrequency > 0) {
    score += 15 - Math.min(15, Math.abs(templateFrequency - profile.frequency) * 5);
  }

  // Materiel : un programme "full gym" propose a quelqu'un qui s'entraine au
  // poids du corps est inutilisable.
  const equipment = (template.equipment ?? '').toString().toLowerCase();
  if (equipment) {
    if (profile.equipment === 'bodyweight' && /body|poids|aucun|none/.test(equipment)) score += 20;
    else if (profile.equipment === 'dumbbells' && /dumbbell|halter/.test(equipment)) score += 20;
    else if (profile.equipment === 'full_gym') score += 10;
    else if (profile.equipment === 'bodyweight' && /gym|machine|barbell/.test(equipment)) score -= 25;
  }

  return score;
}

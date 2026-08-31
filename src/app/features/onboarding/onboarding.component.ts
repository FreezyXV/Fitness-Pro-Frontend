// onboarding.component.ts - Parcours de premiere ouverture, 5 ecrans.
//
// Une question par ecran, une reponse qui fait avancer : c'est ce qui fait la
// difference entre un formulaire qu'on abandonne et un parcours qu'on termine.
// Les quatre premieres etapes sont a choix unique et enchainent
// automatiquement ; la cinquieme (mesures) est facultative et peut etre sautee,
// parce qu'exiger son poids avant meme d'avoir vu l'app fait fuir.
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Equipment,
  OnboardingProfile,
  OnboardingService,
  TrainingGoal,
  TrainingLevel,
} from '@app/services/onboarding.service';
import { UserService } from '@app/services/user.service';
import { Workout } from '@shared';
import { IconComponent } from '@app/shared/components/icon/icon.component';

interface Choice<T> {
  value: T;
  label: string;
  hint: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
})
export class OnboardingComponent {
  private readonly onboarding = inject(OnboardingService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Page visee avant la redirection par OnboardingGuard. */
  private readonly returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

  /** 0 a 4 pour les questions, 5 pour l'ecran de resultat. */
  readonly step = signal(0);
  readonly totalSteps = 5;

  readonly goal = signal<TrainingGoal | null>(null);
  readonly level = signal<TrainingLevel | null>(null);
  readonly frequency = signal<number | null>(null);
  readonly equipment = signal<Equipment | null>(null);

  readonly age = signal<number | null>(null);
  readonly height = signal<number | null>(null);
  readonly weight = signal<number | null>(null);
  readonly gender = signal<'male' | 'female' | 'other' | null>(null);

  readonly saving = signal(false);
  readonly suggestion = signal<Workout | null>(null);

  /**
   * `step()` est un INDEX (0 pour la premiere question) : la barre restait
   * donc entierement vide en face du compteur « 1/5 », ce qui se lit comme un
   * indicateur casse plutot que comme un debut de parcours. Le compteur
   * affiche `step() + 1` ; la barre suit la meme convention.
   */
  readonly progress = computed(() =>
    Math.round((Math.min(this.step() + 1, this.totalSteps) / this.totalSteps) * 100)
  );

  // ------------------------------------------------------------------ choix

  readonly goals: Choice<TrainingGoal>[] = [
    { value: 'lose_weight',  label: 'Perdre du poids',    hint: 'Dépense calorique et cardio' },
    { value: 'build_muscle', label: 'Prendre du muscle',  hint: 'Volume et hypertrophie' },
    { value: 'get_stronger', label: 'Gagner en force',    hint: 'Charges lourdes, peu de répétitions' },
    { value: 'stay_fit',     label: 'Rester en forme',    hint: 'Entretien général et mobilité' },
  ];

  readonly levels: Choice<TrainingLevel>[] = [
    { value: 'beginner',     label: 'Débutant',     hint: 'Moins de 6 mois de pratique' },
    { value: 'intermediate', label: 'Intermédiaire', hint: 'Entre 6 mois et 2 ans' },
    { value: 'advanced',     label: 'Avancé',       hint: 'Plus de 2 ans, technique maîtrisée' },
  ];

  readonly frequencies: Choice<number>[] = [
    { value: 2, label: '2 séances', hint: 'Par semaine' },
    { value: 3, label: '3 séances', hint: 'Le rythme le plus tenable' },
    { value: 4, label: '4 séances', hint: 'Par semaine' },
    { value: 5, label: '5 et plus', hint: 'Pratique assidue' },
  ];

  readonly equipments: Choice<Equipment>[] = [
    { value: 'bodyweight', label: 'Poids du corps', hint: 'Chez soi, sans matériel' },
    { value: 'dumbbells',  label: 'Haltères',       hint: 'Quelques poids à la maison' },
    { value: 'full_gym',   label: 'Salle complète', hint: 'Machines et barres disponibles' },
  ];

  readonly genders: Choice<'male' | 'female' | 'other'>[] = [
    { value: 'male',   label: 'Homme',       hint: '' },
    { value: 'female', label: 'Femme',       hint: '' },
    { value: 'other',  label: 'Non précisé', hint: '' },
  ];

  // ---------------------------------------------------------------- actions

  chooseGoal(value: TrainingGoal): void      { this.goal.set(value);      this.next(); }
  chooseLevel(value: TrainingLevel): void    { this.level.set(value);     this.next(); }
  chooseFrequency(value: number): void       { this.frequency.set(value); this.next(); }
  chooseEquipment(value: Equipment): void    { this.equipment.set(value); this.next(); }
  chooseGender(value: 'male' | 'female' | 'other'): void { this.gender.set(value); }

  setNumber(signalRef: typeof this.age, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const parsed = raw ? Number(raw) : null;
    signalRef.set(Number.isFinite(parsed as number) ? parsed : null);
  }

  onAge(event: Event): void    { this.setNumber(this.age, event); }
  onHeight(event: Event): void { this.setNumber(this.height, event); }
  onWeight(event: Event): void { this.setNumber(this.weight, event); }

  next(): void {
    // Enchainement automatique apres un choix : evite un "Suivant" superflu.
    if (this.step() < this.totalSteps - 1) {
      this.step.update((s) => s + 1);
    } else {
      this.finish();
    }
  }

  back(): void {
    if (this.step() > 0) this.step.update((s) => s - 1);
  }

  /** L'etape mesures est facultative : on la saute sans rien enregistrer. */
  skipMeasurements(): void {
    this.age.set(null);
    this.height.set(null);
    this.weight.set(null);
    this.gender.set(null);
    this.finish();
  }

  finish(): void {
    if (!this.goal() || !this.level() || !this.frequency() || !this.equipment()) return;

    this.saving.set(true);

    const profile: OnboardingProfile = {
      goal: this.goal()!,
      level: this.level()!,
      frequency: this.frequency()!,
      equipment: this.equipment()!,
      age: this.age(),
      height: this.height(),
      weight: this.weight(),
      gender: this.gender(),
      completedAt: new Date().toISOString(),
    };

    // Enregistrement local d'abord : le parcours est acquis meme si le serveur
    // dort. Sans ca, un backend endormi ferait rejouer l'onboarding a chaque
    // lancement, ce qui serait pire que de ne pas en avoir.
    this.onboarding.save(profile);

    this.pushMeasurementsToProfile(profile);

    this.onboarding.suggestProgram(profile).subscribe((program) => {
      this.suggestion.set(program);
      this.saving.set(false);
      this.step.set(this.totalSteps);
    });
  }

  /**
   * Remontee des mesures vers le profil serveur. En echec on ne bloque rien :
   * l'utilisateur pourra toujours les renseigner depuis son profil.
   */
  private pushMeasurementsToProfile(profile: OnboardingProfile): void {
    const payload: Record<string, unknown> = {};
    if (profile.age !== null) payload['age'] = profile.age;
    if (profile.height !== null) payload['height'] = profile.height;
    if (profile.weight !== null) payload['weight'] = profile.weight;
    if (profile.gender) payload['gender'] = profile.gender;
    payload['activity_level'] = profile.frequency >= 4 ? 'high' : profile.frequency >= 3 ? 'moderate' : 'light';

    if (Object.keys(payload).length === 0) return;

    this.users.updateProfile(payload as any).subscribe({ error: () => {} });
  }

  startSuggested(): void {
    const program = this.suggestion();
    this.router.navigate(program ? ['/workouts', program.id] : ['/workouts']);
  }

  goToDashboard(): void {
    this.router.navigateByUrl(this.returnUrl);
  }

  // ------------------------------------------------------------------ libelle

  stepTitle(): string {
    switch (this.step()) {
      case 0: return 'Quel est ton objectif ?';
      case 1: return 'Où en es-tu ?';
      case 2: return 'Combien de fois par semaine ?';
      case 3: return 'De quel matériel disposes-tu ?';
      case 4: return 'Quelques mesures, pour situer tes progrès';
      default: return 'Tout est prêt';
    }
  }
}

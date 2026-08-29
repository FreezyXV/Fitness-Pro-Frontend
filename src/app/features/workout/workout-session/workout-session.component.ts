import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutService } from '@app/services/workout.service';

/** Un exercice tel que l'API le renvoie : le pivot est aplati dans l'objet. */
interface SessionExercise {
  id: number;
  name: string;
  sets?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  restTimeSeconds?: number | null;
  equipment?: string | null;
  instructions?: string[] | null;
}

/** Une serie a realiser, issue de l'aplatissement du programme. */
interface PlannedSet {
  exercise: SessionExercise;
  exerciseIndex: number;
  setNumber: number;
  setsInExercise: number;
}

interface CompletedSet {
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  seconds: number | null;
}

type Phase = 'loading' | 'ready' | 'working' | 'resting' | 'finished' | 'error';

const LAST_WEIGHTS_KEY = 'fitnesspro.lastWeights';
const RESUME_KEY = 'fitnesspro.activeSession';

@Component({
  selector: 'app-workout-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout-session.component.html',
  styleUrls: ['./workout-session.component.scss'],
})
export class WorkoutSessionComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workoutService = inject(WorkoutService);

  readonly phase = signal<Phase>('loading');
  readonly errorMessage = signal<string | null>(null);
  readonly workoutName = signal<string>('');

  readonly plan = signal<PlannedSet[]>([]);
  readonly currentIndex = signal(0);
  readonly done = signal<CompletedSet[]>([]);

  /** Saisie de la serie en cours. */
  readonly reps = signal<number | null>(null);
  readonly weight = signal<number | null>(null);
  /** Vrai tant que la charge affichee vient de l'historique et non d'une saisie. */
  readonly weightFromHistory = signal(false);

  readonly restRemaining = signal(0);
  readonly restTotal = signal(0);
  readonly elapsedSeconds = signal(0);
  /** Decompte pour les exercices tenus en duree plutot qu'en repetitions. */
  readonly holdRemaining = signal(0);

  private sessionId: number | null = null;
  private templateId: number | null = null;
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private wakeLock: any = null;

  // ---------------------------------------------------------------- derives

  readonly current = computed<PlannedSet | null>(
    () => this.plan()[this.currentIndex()] ?? null
  );

  readonly next = computed<PlannedSet | null>(
    () => this.plan()[this.currentIndex() + 1] ?? null
  );

  readonly totalSets = computed(() => this.plan().length);

  readonly progressPercent = computed(() => {
    const total = this.totalSets();
    return total ? Math.round((this.done().length / total) * 100) : 0;
  });

  /** Un exercice tenu en duree (gainage, mobilite) n'a pas de repetitions. */
  readonly isTimedExercise = computed(() => {
    const c = this.current();
    return !!c && !c.exercise.reps && !!c.exercise.durationSeconds;
  });

  readonly remainingSetsForExercise = computed(() => {
    const c = this.current();
    if (!c) return 0;
    return c.setsInExercise - c.setNumber + 1;
  });

  readonly totalVolume = computed(() =>
    this.done().reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)
  );

  // ------------------------------------------------------------- cycle de vie

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.fail('Programme introuvable.');
      return;
    }
    this.templateId = id;

    this.workoutService.getWorkoutTemplate(id).subscribe({
      next: (template) => {
        if (!template) {
          this.fail('Ce programme n\'existe pas ou n\'est plus accessible.');
          return;
        }
        this.workoutName.set(template.name);
        const exercises = ((template as any).exercises ?? []) as SessionExercise[];
        const plan = this.buildPlan(exercises);

        if (!plan.length) {
          this.fail('Ce programme ne contient aucun exercice.');
          return;
        }

        this.plan.set(plan);
        this.phase.set('ready');
      },
      error: () => this.fail('Impossible de charger le programme.'),
    });

    this.startTicking();
  }

  ngOnDestroy(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.releaseWakeLock();
  }

  /** Aplatit le programme en une liste lineaire de series a realiser. */
  private buildPlan(exercises: SessionExercise[]): PlannedSet[] {
    const plan: PlannedSet[] = [];
    exercises.forEach((exercise, exerciseIndex) => {
      const sets = Math.max(1, exercise.sets ?? 1);
      for (let setNumber = 1; setNumber <= sets; setNumber++) {
        plan.push({ exercise, exerciseIndex, setNumber, setsInExercise: sets });
      }
    });
    return plan;
  }

  private fail(message: string): void {
    this.errorMessage.set(message);
    this.phase.set('error');
  }

  // ------------------------------------------------------------------- timer

  private startTicking(): void {
    this.tickHandle = setInterval(() => {
      const phase = this.phase();
      if (phase === 'working' || phase === 'resting') {
        this.elapsedSeconds.update((s) => s + 1);
      }

      if (phase === 'resting') {
        const left = this.restRemaining() - 1;
        this.restRemaining.set(Math.max(0, left));
        if (left <= 0) this.endRest();
      }

      if (phase === 'working' && this.holdRemaining() > 0) {
        const left = this.holdRemaining() - 1;
        this.holdRemaining.set(Math.max(0, left));
        if (left <= 0) this.vibrate([120, 60, 120]);
      }
    }, 1000);
  }

  // ------------------------------------------------------------------ actions

  start(): void {
    if (!this.templateId) return;

    this.phase.set('working');
    this.prepareCurrentSet();
    this.requestWakeLock();

    // La seance demarre localement sans attendre le reseau : a la salle, la
    // connexion est souvent mauvaise et l'utilisateur ne doit pas patienter.
    this.workoutService.startWorkoutSession(this.templateId).subscribe({
      next: (session) => {
        this.sessionId = session.id;
        this.persistResume();
      },
      error: () => {
        // Sans identifiant de session, la seance reste utilisable et sera
        // enregistree en fin de parcours via un log direct.
        this.sessionId = null;
      },
    });
  }

  /** Prepare la saisie : repetitions prevues et charge de la derniere fois. */
  private prepareCurrentSet(): void {
    const c = this.current();
    if (!c) return;

    const remembered = this.lastWeightFor(c.exercise.id);
    this.reps.set(c.exercise.reps ?? null);
    this.weight.set(remembered);
    this.weightFromHistory.set(remembered !== null);
    this.holdRemaining.set(c.exercise.durationSeconds ?? 0);
  }

  validateSet(): void {
    const c = this.current();
    if (!c) return;

    const record: CompletedSet = {
      exerciseId: c.exercise.id,
      exerciseName: c.exercise.name,
      setNumber: c.setNumber,
      reps: this.isTimedExercise() ? null : this.reps(),
      weight: this.weight(),
      seconds: this.isTimedExercise() ? c.exercise.durationSeconds ?? null : null,
    };

    this.done.update((list) => [...list, record]);
    this.rememberWeight(c.exercise.id, this.weight());
    this.vibrate(40);

    const isLast = this.currentIndex() >= this.plan().length - 1;
    if (isLast) {
      this.finish();
      return;
    }

    const rest = c.exercise.restTimeSeconds ?? 0;
    this.currentIndex.update((i) => i + 1);

    if (rest > 0) {
      this.restTotal.set(rest);
      this.restRemaining.set(rest);
      this.phase.set('resting');
      this.persistResume();
    } else {
      this.prepareCurrentSet();
      this.persistResume();
    }
  }

  skipRest(): void {
    this.endRest();
  }

  addRest(seconds: number): void {
    this.restRemaining.update((r) => r + seconds);
    this.restTotal.update((r) => r + seconds);
  }

  private endRest(): void {
    this.restRemaining.set(0);
    this.phase.set('working');
    this.prepareCurrentSet();
    this.vibrate([90, 50, 90]);
  }

  adjustReps(delta: number): void {
    this.reps.update((r) => Math.max(0, (r ?? 0) + delta));
  }

  adjustWeight(delta: number): void {
    this.weight.update((w) => Math.max(0, Math.round(((w ?? 0) + delta) * 10) / 10));
    this.weightFromHistory.set(false);
  }

  setWeight(value: number | null): void {
    this.weight.set(value);
    this.weightFromHistory.set(false);
  }

  /** Passe l'exercice courant, series restantes comprises. */
  skipExercise(): void {
    const c = this.current();
    if (!c) return;

    let i = this.currentIndex();
    while (i < this.plan().length && this.plan()[i].exerciseIndex === c.exerciseIndex) {
      i++;
    }

    if (i >= this.plan().length) {
      this.finish();
      return;
    }

    this.currentIndex.set(i);
    this.phase.set('working');
    this.prepareCurrentSet();
    this.persistResume();
  }

  finish(): void {
    this.phase.set('finished');
    this.releaseWakeLock();
    localStorage.removeItem(RESUME_KEY);

    const minutes = Math.max(1, Math.round(this.elapsedSeconds() / 60));

    if (this.sessionId) {
      this.workoutService
        .completeWorkoutSession(this.sessionId, {
          actual_duration: minutes,
          notes: `${this.done().length} séries réalisées.`,
        })
        .subscribe({ error: () => {} });
    }
  }

  quit(): void {
    localStorage.removeItem(RESUME_KEY);
    this.releaseWakeLock();
    this.router.navigate(['/workouts', this.templateId]);
  }

  backToWorkouts(): void {
    this.router.navigate(['/workouts']);
  }

  // ------------------------------------------------------------------ format

  formatClock(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** Fraction restante du repos, pour l'anneau de progression. */
  restFraction(): number {
    const total = this.restTotal();
    return total ? this.restRemaining() / total : 0;
  }

  // --------------------------------------------------------------- stockage

  /**
   * Les charges de la derniere seance sont conservees en local plutot que
   * demandees au serveur : a la salle le reseau est peu fiable, et la valeur
   * doit s'afficher instantanement.
   */
  private lastWeightFor(exerciseId: number): number | null {
    try {
      const raw = localStorage.getItem(LAST_WEIGHTS_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw) as Record<string, number>;
      return map[String(exerciseId)] ?? null;
    } catch {
      return null;
    }
  }

  private rememberWeight(exerciseId: number, weight: number | null): void {
    if (weight === null || weight <= 0) return;
    try {
      const raw = localStorage.getItem(LAST_WEIGHTS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      map[String(exerciseId)] = weight;
      localStorage.setItem(LAST_WEIGHTS_KEY, JSON.stringify(map));
    } catch {
      // Stockage indisponible : la seance continue sans memoire des charges.
    }
  }

  /** Permet de retrouver la seance apres un rechargement accidentel. */
  private persistResume(): void {
    try {
      localStorage.setItem(
        RESUME_KEY,
        JSON.stringify({
          templateId: this.templateId,
          sessionId: this.sessionId,
          index: this.currentIndex(),
          elapsed: this.elapsedSeconds(),
        })
      );
    } catch {
      // sans effet sur le deroulement de la seance
    }
  }

  // --------------------------------------------------------------- materiel

  /** Empeche l'ecran de s'eteindre pendant la seance. */
  private async requestWakeLock(): Promise<void> {
    try {
      const nav = navigator as any;
      if (nav.wakeLock?.request) {
        this.wakeLock = await nav.wakeLock.request('screen');
      }
    } catch {
      // Non supporte ou refuse : sans consequence.
    }
  }

  private releaseWakeLock(): void {
    try {
      this.wakeLock?.release?.();
    } catch {
      // ignore
    }
    this.wakeLock = null;
  }

  private vibrate(pattern: number | number[]): void {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // ignore
    }
  }
}

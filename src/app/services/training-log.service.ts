// training-log.service.ts - Historique des series realisees.
//
// Pourquoi un stockage local en plus de l'API : la table pivot
// workout_exercises ne garde qu'UNE ligne par exercice et par seance
// (completed_sets, weight_used). Elle ne peut donc pas exprimer "3 series a
// 60 kg puis une a 65". Or c'est exactement la granularite qu'il faut pour
// tracer une progression de charge honnete et estimer un 1RM.
//
// Le journal local est aussi ce qui rend la progression consultable hors
// ligne et en mode invite, ou aucune ecriture serveur n'a lieu.
import { Injectable, signal } from '@angular/core';

export interface LoggedSet {
  /** Date ISO de validation de la serie. */
  ts: string;
  sessionId: number | null;
  templateId: number | null;
  workoutName: string;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  seconds: number | null;
}

export interface WeeklyVolumePoint {
  /** Lundi de la semaine, a minuit. */
  weekStart: Date;
  volumeKg: number;
  sets: number;
  sessions: number;
}

export interface ExerciseProgressPoint {
  date: Date;
  /** Charge de la serie la plus lourde du jour. */
  topSetWeight: number;
  topSetReps: number;
  /** 1RM estime (Epley) a partir de la meilleure serie du jour. */
  estimatedOneRm: number;
  volumeKg: number;
}

export type ProgressionAction = 'increase' | 'hold' | 'deload' | 'first-time';

export interface LoadSuggestion {
  /** Charge proposee pour la prochaine serie, en kg. null si inconnue. */
  weight: number | null;
  /** Ecart par rapport a la derniere seance, en kg. */
  delta: number;
  action: ProgressionAction;
  /** Phrase courte affichee a l'utilisateur. */
  reason: string;
}

export interface TrackedExercise {
  exerciseId: number;
  exerciseName: string;
  sessions: number;
  lastPerformed: Date;
}

const STORAGE_KEY = 'fitnesspro.trainingLog';

// Plafond volontaire : localStorage tient ~5 Mo. A ~120 octets par serie,
// 20 000 series representent ~2,4 Mo, soit plusieurs annees d'entrainement
// pour un pratiquant assidu. Au-dela on evince les plus anciennes.
const MAX_SETS = 20000;

@Injectable({ providedIn: 'root' })
export class TrainingLogService {
  /** Incremente a chaque ecriture : les vues s'y abonnent pour se recalculer. */
  readonly revision = signal(0);

  private cache: LoggedSet[] | null = null;

  // ------------------------------------------------------------------ ecriture

  /** Enregistre les series d'une seance terminee. */
  appendSets(sets: LoggedSet[]): void {
    if (!sets.length) return;

    const all = this.all().concat(sets);
    // Tri chronologique : les agregations supposent un ordre croissant.
    all.sort((a, b) => a.ts.localeCompare(b.ts));

    const trimmed = all.length > MAX_SETS ? all.slice(all.length - MAX_SETS) : all;
    this.persist(trimmed);
  }

  clear(): void {
    this.persist([]);
  }

  // ------------------------------------------------------------------ lecture

  all(): LoggedSet[] {
    if (this.cache) return this.cache;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.cache = Array.isArray(parsed) ? parsed.filter(isLoggedSet) : [];
    } catch {
      // JSON corrompu : on repart d'un journal vide plutot que de planter la
      // page de progression.
      this.cache = [];
    }
    return this.cache;
  }

  /** Series realisees depuis N jours. */
  since(days: number): LoggedSet[] {
    const floor = Date.now() - days * 86400000;
    return this.all().filter(s => Date.parse(s.ts) >= floor);
  }

  hasData(): boolean {
    return this.all().length > 0;
  }

  // ------------------------------------------------------------- agregations

  /**
   * Volume hebdomadaire (somme des reps x charge). Les semaines sans
   * entrainement sont retournees a zero : un trou dans la courbe est une
   * information, la masquer donnerait une progression faussement lisse.
   */
  weeklyVolume(weeks: number): WeeklyVolumePoint[] {
    const buckets = new Map<number, { volume: number; sets: number; sessions: Set<string> }>();

    const firstWeek = startOfWeek(new Date());
    firstWeek.setDate(firstWeek.getDate() - (weeks - 1) * 7);

    for (let i = 0; i < weeks; i++) {
      const d = new Date(firstWeek);
      d.setDate(d.getDate() + i * 7);
      buckets.set(d.getTime(), { volume: 0, sets: 0, sessions: new Set() });
    }

    for (const set of this.all()) {
      const key = startOfWeek(new Date(set.ts)).getTime();
      const bucket = buckets.get(key);
      if (!bucket) continue; // hors de la fenetre demandee

      bucket.volume += (set.reps ?? 0) * (set.weight ?? 0);
      bucket.sets += 1;
      bucket.sessions.add(set.sessionId != null ? `s${set.sessionId}` : set.ts.slice(0, 10));
    }

    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([time, b]) => ({
        weekStart: new Date(time),
        volumeKg: Math.round(b.volume),
        sets: b.sets,
        sessions: b.sessions.size,
      }));
  }

  /**
   * Progression de charge sur un exercice, un point par jour d'entrainement.
   * On retient la serie la plus lourde du jour : c'est l'indicateur que les
   * pratiquants suivent reellement, et il est robuste aux series de finition
   * effectuees plus leger.
   */
  exerciseProgress(exerciseId: number, days: number): ExerciseProgressPoint[] {
    const floor = Date.now() - days * 86400000;
    const byDay = new Map<string, { top: LoggedSet | null; volume: number }>();

    for (const set of this.all()) {
      if (set.exerciseId !== exerciseId) continue;
      if (Date.parse(set.ts) < floor) continue;
      if (set.weight == null || set.weight <= 0) continue;

      const day = set.ts.slice(0, 10);
      const entry = byDay.get(day) ?? { top: null, volume: 0 };

      entry.volume += (set.reps ?? 0) * set.weight;
      if (!entry.top || set.weight > (entry.top.weight ?? 0)) entry.top = set;

      byDay.set(day, entry);
    }

    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, entry]) => {
        const weight = entry.top!.weight!;
        const reps = entry.top!.reps ?? 1;
        return {
          date: new Date(`${day}T00:00:00`),
          topSetWeight: weight,
          topSetReps: reps,
          estimatedOneRm: estimateOneRm(weight, reps),
          volumeKg: Math.round(entry.volume),
        };
      });
  }

  /** Exercices charges suivis, du plus recent au plus ancien. */
  trackedExercises(): TrackedExercise[] {
    const map = new Map<number, TrackedExercise>();

    for (const set of this.all()) {
      if (set.weight == null || set.weight <= 0) continue;

      const at = new Date(set.ts);
      const existing = map.get(set.exerciseId);

      if (!existing) {
        map.set(set.exerciseId, {
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          sessions: 1,
          lastPerformed: at,
        });
      } else {
        existing.sessions += 1;
        if (at > existing.lastPerformed) existing.lastPerformed = at;
      }
    }

    return [...map.values()].sort(
      (a, b) => b.lastPerformed.getTime() - a.lastPerformed.getTime()
    );
  }

  /**
   * Charge proposee pour la prochaine seance, selon la double progression :
   * on augmente les repetitions dans une fourchette a charge constante, et
   * quand le haut de la fourchette est atteint sur TOUTES les series, on
   * monte la charge et on repart en bas de fourchette.
   *
   * C'est la methode que suivent Hevy et Strong, et c'est ce qui transforme un
   * carnet d'entrainement en boucle d'habitude : l'app dit quoi faire au lieu
   * de se contenter d'enregistrer.
   *
   * @param targetReps  repetitions prevues par le programme (haut de fourchette)
   * @param targetSets  nombre de series prevues
   */
  suggestNextLoad(
    exerciseId: number,
    targetReps: number | null,
    targetSets: number
  ): LoadSuggestion {
    const history = this.all().filter(s => s.exerciseId === exerciseId && s.weight != null);

    if (!history.length) {
      return { weight: null, delta: 0, action: 'first-time',
               reason: 'Première fois : choisis une charge que tu maîtrises.' };
    }

    // Series de la derniere SEANCE, pas les N dernieres series : une seance
    // interrompue ne doit pas etre comparee a une seance complete.
    const lastDay = history[history.length - 1].ts.slice(0, 10);
    const lastSession = history.filter(s => s.ts.slice(0, 10) === lastDay);

    const weight = Math.max(...lastSession.map(s => s.weight ?? 0));
    const step = incrementFor(weight);

    if (!targetReps) {
      return { weight, delta: 0, action: 'hold',
               reason: 'Charge de ta dernière séance.' };
    }

    const atTarget = lastSession.filter(s => (s.reps ?? 0) >= targetReps);
    const completedAll = lastSession.length >= targetSets && atTarget.length >= targetSets;

    if (completedAll) {
      return { weight: weight + step, delta: step, action: 'increase',
               reason: `Toutes tes séries à ${targetReps} reps la dernière fois : +${formatKg(step)} kg.` };
    }

    // Deux seances de suite sous l'objectif : la charge est trop lourde, on
    // deleste de 10 % plutot que de laisser l'utilisateur stagner et arreter.
    const previousDays = [...new Set(history.map(s => s.ts.slice(0, 10)))];
    if (previousDays.length >= 2) {
      const beforeDay = previousDays[previousDays.length - 2];
      const beforeSession = history.filter(s => s.ts.slice(0, 10) === beforeDay);
      const beforeWeight = Math.max(...beforeSession.map(s => s.weight ?? 0));
      const beforeFailed = beforeSession.filter(s => (s.reps ?? 0) >= targetReps).length < targetSets;

      if (beforeFailed && beforeWeight >= weight) {
        const deloaded = roundToStep(weight * 0.9);
        return { weight: deloaded, delta: deloaded - weight, action: 'deload',
                 reason: 'Deux séances sous l\'objectif : on allège de 10 % pour repartir.' };
      }
    }

    const best = Math.max(...lastSession.map(s => s.reps ?? 0));
    return { weight, delta: 0, action: 'hold',
             reason: `Même charge : vise ${targetReps} reps (tu en as fait ${best}).` };
  }

  /** Record de charge sur un exercice, toutes dates confondues. */
  personalRecord(exerciseId: number): { weight: number; reps: number; date: Date } | null {
    let best: LoggedSet | null = null;

    for (const set of this.all()) {
      if (set.exerciseId !== exerciseId || set.weight == null) continue;
      if (!best || set.weight > (best.weight ?? 0)) best = set;
    }

    return best
      ? { weight: best.weight!, reps: best.reps ?? 0, date: new Date(best.ts) }
      : null;
  }

  // ------------------------------------------------------------------ interne

  private persist(sets: LoggedSet[]): void {
    this.cache = sets;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
    } catch {
      // Quota depasse : on garde le cache memoire pour la session en cours
      // plutot que de perdre la seance qui vient d'etre realisee.
    }
    this.revision.update(v => v + 1);
  }
}

/**
 * Increment de charge. Les petits poids progressent par 1 kg, les charges
 * lourdes par 5 : proposer +2,5 kg sur un developpe a 100 kg est trop lent,
 * en proposer autant sur des elevations laterales a 6 kg est irrealiste.
 */
function incrementFor(weight: number): number {
  if (weight < 10) return 1;
  if (weight < 40) return 2.5;
  return 5;
}

/** Arrondi au demi-kilo : c'est le plus petit disque disponible en salle. */
function roundToStep(weight: number): number {
  return Math.round(weight * 2) / 2;
}

function formatKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

/** 1RM estime par la formule d'Epley, bornee a 12 reps ou elle diverge. */
export function estimateOneRm(weight: number, reps: number): number {
  const r = Math.min(Math.max(reps, 1), 12);
  return Math.round(weight * (1 + r / 30));
}

/** Lundi 00:00 de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay() : 0 = dimanche. On ramene au lundi precedent.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function isLoggedSet(value: unknown): value is LoggedSet {
  const v = value as Partial<LoggedSet>;
  return (
    !!v &&
    typeof v.ts === 'string' &&
    typeof v.exerciseId === 'number' &&
    typeof v.exerciseName === 'string'
  );
}

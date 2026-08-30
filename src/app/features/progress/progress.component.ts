// progress.component.ts - Page Progression.
//
// La promesse centrale de l'app est "voir ses progres", mais il n'existait
// aucun ecran pour ca : le dashboard affichait une polyline decorative sans
// axes ni echelle. Cette page repond a trois questions concretes :
//   1. Est-ce que je m'entraine regulierement ?      -> volume hebdomadaire
//   2. Est-ce que je deviens plus fort ?             -> charge par exercice
//   3. Ou en suis-je sur cet exercice precis ?       -> record et 1RM estime
//
// Toutes les valeurs viennent du journal reel (TrainingLogService). Quand il
// est vide, la page le dit : aucune donnee de demonstration n'est fabriquee.
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ChartComponent, ChartPoint } from '@app/shared/components/chart/chart.component';
import {
  TrainingLogService,
  estimateOneRm,
} from '@app/services/training-log.service';

interface PeriodOption {
  label: string;
  weeks: number;
  days: number;
}

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartComponent],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
})
export class ProgressComponent {
  private readonly log = inject(TrainingLogService);

  readonly periods: PeriodOption[] = [
    { label: '4 semaines', weeks: 4, days: 28 },
    { label: '12 semaines', weeks: 12, days: 84 },
    { label: '1 an', weeks: 52, days: 365 },
  ];

  readonly period = signal<PeriodOption>(this.periods[1]);
  readonly selectedExerciseId = signal<number | null>(null);

  /** Le journal expose une revision : la lire rend les calculs reactifs. */
  private readonly rev = this.log.revision;

  readonly hasData = computed(() => {
    this.rev();
    return this.log.hasData();
  });

  // ------------------------------------------------------------------- KPIs

  readonly summary = computed(() => {
    this.rev();
    const sets = this.log.since(this.period().days);

    const volume = sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0);
    const sessions = new Set(
      sets.map(s => (s.sessionId != null ? `s${s.sessionId}` : s.ts.slice(0, 10)))
    ).size;

    return {
      sessions,
      sets: sets.length,
      volumeKg: Math.round(volume),
      // Moyenne par semaine : plus parlante qu'un total brut pour juger
      // sa regularite sur des periodes de longueur differente.
      sessionsPerWeek: sessions
        ? Math.round((sessions / this.period().weeks) * 10) / 10
        : 0,
    };
  });

  // -------------------------------------------------------- volume hebdo

  readonly weeklyVolume = computed<ChartPoint[]>(() => {
    this.rev();
    return this.log.weeklyVolume(this.period().weeks).map(w => ({
      x: w.weekStart,
      y: w.volumeKg,
      label: `Semaine du ${w.weekStart.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })}`,
    }));
  });

  readonly weeklySessions = computed<ChartPoint[]>(() => {
    this.rev();
    return this.log.weeklyVolume(this.period().weeks).map(w => ({
      x: w.weekStart,
      y: w.sessions,
      label: `Semaine du ${w.weekStart.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })}`,
    }));
  });

  // ---------------------------------------------------- charge par exercice

  readonly exercises = computed(() => {
    this.rev();
    return this.log.trackedExercises();
  });

  /** Exercice affiche : celui choisi, sinon le plus recemment travaille. */
  readonly currentExerciseId = computed(() => {
    const explicit = this.selectedExerciseId();
    if (explicit !== null) return explicit;
    return this.exercises()[0]?.exerciseId ?? null;
  });

  readonly currentExerciseName = computed(() => {
    const id = this.currentExerciseId();
    return this.exercises().find(e => e.exerciseId === id)?.exerciseName ?? '';
  });

  readonly loadSeries = computed<ChartPoint[]>(() => {
    this.rev();
    const id = this.currentExerciseId();
    if (id === null) return [];

    return this.log.exerciseProgress(id, this.period().days).map(p => ({
      x: p.date,
      y: p.topSetWeight,
      label: `${p.date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })} — ${p.topSetReps} reps`,
    }));
  });

  readonly oneRmSeries = computed<ChartPoint[]>(() => {
    this.rev();
    const id = this.currentExerciseId();
    if (id === null) return [];

    return this.log.exerciseProgress(id, this.period().days).map(p => ({
      x: p.date,
      y: p.estimatedOneRm,
      label: p.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    }));
  });

  readonly personalRecord = computed(() => {
    this.rev();
    const id = this.currentExerciseId();
    return id === null ? null : this.log.personalRecord(id);
  });

  /** 1RM estime a partir du record : la reference que suivent les pratiquants. */
  readonly recordOneRm = computed(() => {
    const pr = this.personalRecord();
    return pr ? estimateOneRm(pr.weight, pr.reps) : null;
  });

  /**
   * Ecart entre la premiere et la derniere seance de la periode, en kg et en
   * pourcentage. C'est la seule facon de repondre a "est-ce que je progresse"
   * sans faire lire une courbe a l'utilisateur.
   */
  readonly loadTrend = computed(() => {
    const series = this.loadSeries();
    if (series.length < 2) return null;

    const first = series[0].y;
    const last = series[series.length - 1].y;
    const delta = last - first;

    return {
      delta: Math.round(delta * 10) / 10,
      percent: first > 0 ? Math.round((delta / first) * 100) : 0,
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    };
  });

  // ---------------------------------------------------------------- actions

  selectPeriod(option: PeriodOption): void {
    this.period.set(option);
  }

  selectExercise(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedExerciseId.set(value ? Number(value) : null);
  }

  /** Separateur de milliers francais : "36 720", pas "36,720". */
  formatKg(value: number): string {
    return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

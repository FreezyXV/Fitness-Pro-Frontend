import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

import { OnboardingService } from '@app/services/onboarding.service';
import { TrainingLogService } from '@app/services/training-log.service';
import { WorkoutService } from '@app/services/workout.service';
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { Workout } from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly log = inject(TrainingLogService);
  private readonly onboarding = inject(OnboardingService);
  private readonly workouts = inject(WorkoutService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date());

  readonly plan = signal<Workout | null>(null);
  readonly weeklyGoal = computed(() => this.onboarding.profile()?.frequency ?? null);
  private readonly weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
  private readonly fullDateFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  readonly numberFormat = new Intl.NumberFormat('fr-FR');

  readonly weeks = computed(() => {
    this.log.revision();
    return this.log.weeklyVolume(4);
  });

  readonly week = computed(() => this.weeks()[3]);
  readonly maxSessions = computed(() => Math.max(1, ...this.weeks().map(w => w.sessions)));

  readonly latest = computed(() => {
    this.log.revision();
    return this.log.all().at(-1);
  });

  constructor() {
    this.workouts.getCurrentTemplate().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(plan => this.plan.set(plan?.id ? plan : null));
  }

  weekLabel(date: Date): string {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  readonly scheduleDays = computed(() => {
    this.log.revision();
    const today = new Date().toDateString();
    const daysWithSets = new Set(this.log.all().map(set => new Date(set.ts).toDateString()));

    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(this.week().weekStart);
      date.setDate(date.getDate() + offset);
      const key = date.toDateString();

      return {
        name: this.weekdayFormat.format(date),
        date: date.getDate(),
        fullDate: this.fullDateFormat.format(date),
        today: key === today,
        recorded: daysWithSets.has(key),
      };
    });
  });
}

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { WorkoutSessionComponent } from './workout-session.component';
import { WorkoutService } from '@app/services/workout.service';

/** Programme representatif : des series en repetitions et un exercice tenu. */
const TEMPLATE: any = {
  id: 42,
  name: 'Programme Test',
  exercises: [
    { id: 1, name: 'Push-Up', sets: 3, reps: 10, restTimeSeconds: 60 },
    { id: 2, name: 'Prisoner Squat', sets: 2, reps: 8, restTimeSeconds: 90 },
    { id: 3, name: 'Gainage', sets: 1, reps: null, durationSeconds: 45, restTimeSeconds: 0 },
  ],
};

function setup(template: any = TEMPLATE) {
  const workoutService = jasmine.createSpyObj('WorkoutService', [
    'getWorkoutTemplate',
    'startWorkoutSession',
    'completeWorkoutSession',
  ]);
  workoutService.getWorkoutTemplate.and.returnValue(of(template));
  workoutService.startWorkoutSession.and.returnValue(of({ id: 999 }));
  workoutService.completeWorkoutSession.and.returnValue(of({ id: 999 }));

  const router = jasmine.createSpyObj('Router', ['navigate']);

  TestBed.configureTestingModule({
    imports: [WorkoutSessionComponent],
    providers: [
      { provide: WorkoutService, useValue: workoutService },
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => '42' } } },
      },
    ],
  });

  const fixture = TestBed.createComponent(WorkoutSessionComponent);
  const component = fixture.componentInstance;
  component.ngOnInit();
  return { component, workoutService, router, fixture };
}

describe('WorkoutSessionComponent', () => {
  afterEach(() => localStorage.clear());

  it('aplatit le programme en une série par ligne', () => {
    const { component } = setup();
    // 3 + 2 + 1
    expect(component.totalSets()).toBe(6);
    expect(component.phase()).toBe('ready');
  });

  it('refuse un programme sans exercice', () => {
    const { component } = setup({ id: 42, name: 'Vide', exercises: [] });
    expect(component.phase()).toBe('error');
    expect(component.errorMessage()).toContain('aucun exercice');
  });

  it('pré-remplit les répétitions prévues au démarrage', () => {
    const { component } = setup();
    component.start();
    expect(component.phase()).toBe('working');
    expect(component.reps()).toBe(10);
    expect(component.current()?.exercise.name).toBe('Push-Up');
    expect(component.current()?.setNumber).toBe(1);
  });

  it('enchaîne sur le repos après une série validée', () => {
    const { component } = setup();
    component.start();
    component.validateSet();

    expect(component.phase()).toBe('resting');
    expect(component.restRemaining()).toBe(60);
    expect(component.done().length).toBe(1);
    // la série suivante est déjà celle qui sera reprise
    expect(component.current()?.setNumber).toBe(2);
  });

  it('reprend la série suivante quand le repos est écourté', () => {
    const { component } = setup();
    component.start();
    component.validateSet();
    component.skipRest();

    expect(component.phase()).toBe('working');
    expect(component.restRemaining()).toBe(0);
    expect(component.reps()).toBe(10);
  });

  it('mémorise la charge et la repropose sur la série suivante', () => {
    const { component } = setup();
    component.start();
    component.weight.set(40);
    component.validateSet();
    component.skipRest();

    expect(component.weight()).toBe(40);
    expect(component.done()[0].weight).toBe(40);
  });

  it('traite un exercice tenu en durée sans répétitions', () => {
    const { component } = setup();
    component.start();
    // avancer jusqu'au gainage : 3 séries + 2 séries
    for (let i = 0; i < 5; i++) {
      component.validateSet();
      if (component.phase() === 'resting') component.skipRest();
    }

    expect(component.current()?.exercise.name).toBe('Gainage');
    expect(component.isTimedExercise()).toBeTrue();
    expect(component.holdRemaining()).toBe(45);
    expect(component.reps()).toBeNull();
  });

  it('passe toutes les séries restantes d’un exercice', () => {
    const { component } = setup();
    component.start();
    component.skipExercise();

    expect(component.current()?.exercise.name).toBe('Prisoner Squat');
    expect(component.done().length).toBe(0);
  });

  it('termine la séance et envoie la durée au bon champ', () => {
    const { component, workoutService } = setup();
    component.start();
    for (let i = 0; i < 6; i++) {
      component.validateSet();
      if (component.phase() === 'resting') component.skipRest();
    }

    expect(component.phase()).toBe('finished');
    expect(component.done().length).toBe(6);

    const [, payload] = workoutService.completeWorkoutSession.calls.mostRecent().args;
    expect(payload.actual_duration).toBeGreaterThanOrEqual(1);
    expect('duration_minutes' in payload).toBeFalse();
  });

  it('laisse la séance se dérouler si le serveur refuse de la démarrer', () => {
    const { component, workoutService } = setup();
    workoutService.startWorkoutSession.and.returnValue(throwError(() => new Error('offline')));

    component.start();

    // le réseau est mauvais en salle : l'écran doit rester utilisable
    expect(component.phase()).toBe('working');
    expect(component.current()?.exercise.name).toBe('Push-Up');
  });

  it('calcule le volume total soulevé', () => {
    const { component } = setup();
    component.start();
    component.weight.set(50);
    component.reps.set(10);
    component.validateSet();

    expect(component.totalVolume()).toBe(500);
  });

  it('progresse en pourcentage au fil des séries', () => {
    const { component } = setup();
    component.start();
    expect(component.progressPercent()).toBe(0);
    component.validateSet();
    expect(component.progressPercent()).toBe(17); // 1/6
  });
});

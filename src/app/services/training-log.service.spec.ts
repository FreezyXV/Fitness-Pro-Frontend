// Tests de la progression automatique des charges.
//
// C'est la logique qui dit a l'utilisateur quoi soulever : une erreur ici
// propose des charges dangereuses ou fait stagner. Elle merite d'etre couverte.
import { TrainingLogService, LoggedSet, estimateOneRm, startOfWeek } from './training-log.service';

/** Fabrique les series d'une seance, a J-`daysAgo`. */
function session(daysAgo: number, weight: number, reps: number, count = 3): LoggedSet[] {
  const ts = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return Array.from({ length: count }, (_, i) => ({
    ts, sessionId: daysAgo, templateId: 1, workoutName: 'Test',
    exerciseId: 1, exerciseName: 'Développé couché',
    setNumber: i + 1, reps, weight, seconds: null,
  }));
}

describe('TrainingLogService — progression des charges', () => {
  let svc: TrainingLogService;

  beforeEach(() => {
    localStorage.clear();
    svc = new TrainingLogService();
  });

  it('propose de choisir soi-meme la premiere fois', () => {
    const s = svc.suggestNextLoad(1, 8, 3);
    expect(s.action).toBe('first-time');
    expect(s.weight).toBeNull();
  });

  it('augmente la charge quand toutes les series ont atteint l objectif', () => {
    svc.appendSets(session(3, 60, 8));
    const s = svc.suggestNextLoad(1, 8, 3);
    expect(s.action).toBe('increase');
    // 60 kg : increment de 5 kg
    expect(s.weight).toBe(65);
    expect(s.delta).toBe(5);
  });

  it('conserve la charge quand l objectif n est pas atteint', () => {
    svc.appendSets(session(3, 60, 6));
    const s = svc.suggestNextLoad(1, 8, 3);
    expect(s.action).toBe('hold');
    expect(s.weight).toBe(60);
    expect(s.reason).toContain('6');
  });

  it('delest de 10 % apres deux seances sous l objectif', () => {
    svc.appendSets(session(10, 60, 6));
    svc.appendSets(session(3, 60, 6));
    const s = svc.suggestNextLoad(1, 8, 3);
    expect(s.action).toBe('deload');
    expect(s.weight).toBe(54); // 60 * 0.9
  });

  it('adapte l increment a la charge', () => {
    svc.appendSets(session(3, 8, 12));       // charge legere
    expect(svc.suggestNextLoad(1, 12, 3).delta).toBe(1);

    svc.clear();
    svc.appendSets(session(3, 30, 10));      // charge moyenne
    expect(svc.suggestNextLoad(1, 10, 3).delta).toBe(2.5);
  });

  it('ne compte que les series de la derniere seance', () => {
    svc.appendSets(session(20, 50, 8));      // ancienne seance reussie
    svc.appendSets(session(2, 60, 5, 2));    // derniere seance : ratee, 2 series
    const s = svc.suggestNextLoad(1, 8, 3);
    expect(s.weight).toBe(60);
    expect(s.action).not.toBe('increase');
  });

  it('n augmente pas si une serie manque, meme au bon nombre de reps', () => {
    svc.appendSets(session(3, 60, 8, 2));    // 2 series sur 3 prevues
    expect(svc.suggestNextLoad(1, 8, 3).action).toBe('hold');
  });
});

describe('TrainingLogService — agregations', () => {
  let svc: TrainingLogService;
  beforeEach(() => { localStorage.clear(); svc = new TrainingLogService(); });

  it('calcule le volume hebdomadaire et garde les semaines vides', () => {
    svc.appendSets(session(2, 50, 10, 3));   // 3 x 10 x 50 = 1500 kg
    const weeks = svc.weeklyVolume(4);
    expect(weeks.length).toBe(4);
    expect(weeks[weeks.length - 1].volumeKg).toBe(1500);
    expect(weeks[0].volumeKg).toBe(0);
  });

  it('retient la serie la plus lourde du jour', () => {
    const ts = new Date(Date.now() - 2 * 86400000).toISOString();
    svc.appendSets([
      { ts, sessionId: 1, templateId: 1, workoutName: 'T', exerciseId: 1,
        exerciseName: 'DC', setNumber: 1, reps: 8, weight: 60, seconds: null },
      { ts, sessionId: 1, templateId: 1, workoutName: 'T', exerciseId: 1,
        exerciseName: 'DC', setNumber: 2, reps: 5, weight: 70, seconds: null },
    ]);
    const p = svc.exerciseProgress(1, 30);
    expect(p.length).toBe(1);
    expect(p[0].topSetWeight).toBe(70);
    expect(p[0].topSetReps).toBe(5);
  });
});

describe('estimateOneRm', () => {
  it('applique la formule d Epley', () => {
    // 100 kg x 5 reps -> 100 * (1 + 5/30) = 116,67 -> 117
    expect(estimateOneRm(100, 5)).toBe(117);
  });

  it('borne a 12 repetitions, ou la formule diverge', () => {
    expect(estimateOneRm(50, 30)).toBe(estimateOneRm(50, 12));
  });
});

describe('startOfWeek', () => {
  it('renvoie le lundi de la semaine', () => {
    // 30 aout 2026 est un dimanche : le lundi precedent est le 24.
    const monday = startOfWeek(new Date(2026, 7, 30));
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(24);
  });
});

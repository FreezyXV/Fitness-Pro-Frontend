// reminder.service.ts - Rappels de seance.
//
// AVERTISSEMENT DE PLATEFORME, a lire avant de faire evoluer ce fichier :
// une PWA ne peut PAS programmer une notification a heure fixe de facon fiable.
//   - L'API Notification Triggers (showTrigger) n'a jamais ete livree.
//   - Le Web Push exige un serveur d'envoi, absent de ce projet.
//   - periodicSync n'existe que sur les PWA installees sous Chrome/Android,
//     et le navigateur choisit seul quand il declenche.
//
// La strategie est donc le RATTRAPAGE : a chaque ouverture de l'app on regarde
// si un rappel du jour est du et pas encore montre. C'est modeste mais honnete,
// et l'interface ne promet rien de plus. periodicSync est enregistre en bonus
// la ou il existe.
import { Injectable, inject, signal } from '@angular/core';

export interface ReminderSettings {
  enabled: boolean;
  /** Jours ISO : 1 = lundi … 7 = dimanche. */
  days: number[];
  /** Heure locale au format "HH:MM". */
  time: string;
}

const SETTINGS_KEY = 'fitnesspro.reminders';
const LAST_SHOWN_KEY = 'fitnesspro.reminders.lastShown';

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  days: [1, 3, 5],
  time: '18:00',
};

@Injectable({ providedIn: 'root' })
export class ReminderService {
  readonly settings = signal<ReminderSettings>(this.load());
  readonly permission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  readonly supported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator;

  /**
   * Vrai la ou un rappel peut arriver sans que l'app soit ouverte. Sert a
   * afficher le bon message dans les reglages plutot qu'a promettre une
   * fiabilite qui n'existe pas sur iOS.
   */
  readonly backgroundCapable =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PeriodicSyncManager' in window;

  /** A appeler au demarrage : rattrape le rappel du jour s'il est du. */
  async init(): Promise<void> {
    if (!this.supported) return;
    this.permission.set(Notification.permission);

    if (this.settings().enabled && this.permission() === 'granted') {
      await this.registerPeriodicSync();
      this.catchUp();
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.supported) return false;

    const result = await Notification.requestPermission();
    this.permission.set(result);
    return result === 'granted';
  }

  async save(settings: ReminderSettings): Promise<void> {
    if (settings.enabled && this.permission() !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) settings = { ...settings, enabled: false };
    }

    this.settings.set(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    if (settings.enabled) await this.registerPeriodicSync();
  }

  /**
   * Affiche le rappel du jour s'il est du et pas encore montre.
   * La cle "derniere date affichee" evite de re-notifier a chaque navigation.
   */
  catchUp(): void {
    const settings = this.settings();
    if (!settings.enabled || this.permission() !== 'granted') return;

    const now = new Date();
    // getDay() : 0 = dimanche. On ramene a la convention ISO 1..7.
    const isoDay = now.getDay() === 0 ? 7 : now.getDay();
    if (!settings.days.includes(isoDay)) return;

    const [hours, minutes] = settings.time.split(':').map(Number);
    const due = new Date(now);
    due.setHours(hours, minutes, 0, 0);
    if (now < due) return;

    const today = now.toISOString().slice(0, 10);
    if (localStorage.getItem(LAST_SHOWN_KEY) === today) return;

    localStorage.setItem(LAST_SHOWN_KEY, today);
    this.show();
  }

  private async show(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Séance du jour', {
        body: "C'est l'heure de t'entraîner.",
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'workout-reminder',
        data: { url: '/workouts' },
      });
    } catch {
      // Notification refusee par le systeme : sans consequence sur l'app.
    }
  }

  private async registerPeriodicSync(): Promise<void> {
    if (!this.backgroundCapable) return;

    try {
      const registration: any = await navigator.serviceWorker.ready;
      // minInterval est une suggestion : le navigateur reste seul juge.
      await registration.periodicSync?.register('workout-reminder', {
        minInterval: 12 * 60 * 60 * 1000,
      });
    } catch {
      // Permission periodic-background-sync absente : le rattrapage suffit.
    }
  }

  private load(): ReminderSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };

      const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
      return {
        enabled: !!parsed.enabled,
        days: Array.isArray(parsed.days) && parsed.days.length ? parsed.days : DEFAULT_SETTINGS.days,
        time: typeof parsed.time === 'string' ? parsed.time : DEFAULT_SETTINGS.time,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
}

// pwa.service.ts - Cycle de vie de l'application installable.
//
// Trois responsabilites :
//   1. Enregistrer le service worker (donc rendre l'app utilisable hors ligne).
//   2. Detecter qu'une nouvelle version est prete, et laisser l'utilisateur
//      decider quand recharger — recharger sous ses pieds en pleine seance
//      serait pire que le probleme.
//   3. Capter l'evenement d'installation pour proposer "Ajouter a l'accueil"
//      au bon moment plutot que de laisser le navigateur le decider.
import { Injectable, NgZone, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Evenement Chrome, absent des typages standards du DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly zone = inject(NgZone);

  /** Une version plus recente attend d'etre activee. */
  readonly updateReady = signal(false);

  /** L'app peut etre installee sur l'ecran d'accueil. */
  readonly installAvailable = signal(false);

  /** L'app tourne deja en mode installe. */
  readonly isInstalled = signal(
    typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
  );

  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: BeforeInstallPromptEvent | null = null;

  async init(): Promise<void> {
    this.listenForInstallPrompt();

    if (!('serviceWorker' in navigator)) return;

    // En developpement le service worker masquerait les rechargements a chaud
    // et servirait des bundles perimes : on ne l'active qu'en production.
    if (!environment.production) return;

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Un worker deja en attente : l'utilisateur a charge l'app avant que la
      // version precedente ne soit liberee.
      if (this.registration.waiting) this.flagUpdate();

      this.registration.addEventListener('updatefound', () => {
        const installing = this.registration?.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          // controller non nul => ce n'est pas la premiere installation, donc
          // c'est bien une mise a jour et non le demarrage initial.
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            this.flagUpdate();
          }
        });
      });

      // Verification periodique : sans elle, un onglet laisse ouvert plusieurs
      // jours ne verrait jamais les nouvelles versions.
      setInterval(() => this.registration?.update().catch(() => {}), 60 * 60 * 1000);
    } catch {
      // Echec d'enregistrement : l'app reste parfaitement fonctionnelle en
      // ligne, seul le mode hors ligne est perdu. Rien a signaler a l'utilisateur.
    }
  }

  /** Active la version en attente et recharge. Declenche par l'utilisateur. */
  applyUpdate(): void {
    const waiting = this.registration?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }

    // Un seul rechargement, meme si l'evenement se declenche plusieurs fois.
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    waiting.postMessage('SKIP_WAITING');
  }

  dismissUpdate(): void {
    this.updateReady.set(false);
  }

  /** Ouvre la boite d'installation native. Doit suivre un geste utilisateur. */
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) return false;

    await this.installPrompt.prompt();
    const { outcome } = await this.installPrompt.userChoice;

    // L'evenement n'est utilisable qu'une fois.
    this.installPrompt = null;
    this.installAvailable.set(false);

    return outcome === 'accepted';
  }

  private listenForInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Empeche la mini-infobarre de Chrome : on choisit nous-memes le moment.
      event.preventDefault();
      this.zone.run(() => {
        this.installPrompt = event as BeforeInstallPromptEvent;
        this.installAvailable.set(true);
      });
    });

    window.addEventListener('appinstalled', () => {
      this.zone.run(() => {
        this.isInstalled.set(true);
        this.installAvailable.set(false);
      });
    });
  }

  private flagUpdate(): void {
    this.zone.run(() => this.updateReady.set(true));
  }
}

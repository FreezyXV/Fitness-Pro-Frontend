// app.component.ts - VERSION CORRIGÉE
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { AppearanceService } from './core/services/appearance.service';
import { AuthService } from './services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { ReminderService } from './core/services/reminder.service';
import { BackendWakeService, EXPECTED_WAKE_SECONDS } from './core/services/backend-wake.service';
import { ExercisesService } from './services/exercises.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="wake-notice" *ngIf="showWakeNotice() || (wake.failed() && !wake.dismissed() && isOnline)"
           aria-label="État du serveur">
      <div role="status">
        <strong>{{ wake.failed() ? 'Serveur injoignable' : 'Connexion au serveur…' }}</strong>
        <span>{{ wake.failed() ? 'Les fonctions en ligne sont indisponibles.' : 'Les fonctions en ligne peuvent prendre quelques secondes.' }}</span>
      </div>
      <button *ngIf="wake.failed()" type="button" class="banner-action" (click)="wake.retry()">Réessayer</button>
      <button type="button" class="banner-dismiss" (click)="wake.dismiss()" aria-label="Fermer l’avis">×</button>
    </aside>

    <!-- Loading Overlay -->
    <div class="loading-overlay" *ngIf="isLoading">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    </div>

    <!-- Main Router Outlet -->
    <router-outlet></router-outlet>

    <!-- Connection Status -->
    <div class="connection-status" [class.offline]="!isOnline" *ngIf="!isOnline">
      <span>Hors ligne · tes séances restent sur cet appareil</span>
    </div>

    <!-- Mise a jour disponible. On ne recharge jamais sans l'accord de
         l'utilisateur : couper une seance en cours serait inacceptable. -->
    <div class="app-banner" *ngIf="pwa.updateReady()" role="status">
      <span>Une nouvelle version est disponible.</span>
      <button type="button" class="banner-action" (click)="pwa.applyUpdate()">
        Mettre à jour
      </button>
      <button type="button" class="banner-dismiss" (click)="pwa.dismissUpdate()"
              aria-label="Plus tard">✕</button>
    </div>

    <!-- Invite d'installation, proposee seulement quand le navigateur la juge
         pertinente (evenement beforeinstallprompt). -->
    <div class="app-banner install" *ngIf="showInstallBanner()" role="status">
      <span>Installe FitnessPro pour l'utiliser hors ligne à la salle.</span>
      <button type="button" class="banner-action" (click)="install()">Installer</button>
      <button type="button" class="banner-dismiss" (click)="dismissInstall()"
              aria-label="Plus tard">✕</button>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    /* La carte de chargement etait BLANCHE, au milieu d'une application
       entierement sombre : un rectangle eclatant a chaque demarrage.
       Ces styles sont en CSS pur (pas de @use) : Angular ne compile pas les
       styles inline d'un composant en SCSS. Les valeurs reprennent donc a la
       main les tokens de variables.scss (palette "Fonte & Craie"). */
    .loading-spinner {
      background: var(--fp-surface);
      border: 1px solid var(--fp-line);
      color: var(--fp-ink);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid var(--fp-line);
      border-top-color: var(--fp-ink-secondary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Bandeau ambre plein avec du texte BLANC dessus, soit 2,1:1 — et pose
       a 20px du bas, donc par-dessus la barre d'onglets mobile. Il devient une
       pastille sombre a texte colore, placee au-dessus de la barre. */
    .connection-status {
      position: fixed;
      right: 1rem;
      bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 12px);
      z-index: 1000;

      max-width: calc(100vw - 2rem);
      padding: 0.5rem 0.875rem;

      background: var(--fp-surface);
      border: 1px solid var(--fp-line);
      border-radius: 10px;
      color: var(--fp-ink-secondary);
      font-size: 0.8125rem;
    }

    .connection-status.offline {
      border-color: var(--fp-control-line);
      color: var(--fp-ink);
    }

    .app-banner {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      /* Au-dessus de la bottom nav (56px) plus l'encoche gestuelle. */
      bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 12px);
      z-index: 1200;

      display: flex;
      align-items: center;
      gap: 0.75rem;

      width: min(520px, calc(100vw - 2rem));
      padding: 0.75rem 0.75rem 0.75rem 1rem;

      background: var(--fp-surface);
      border: 1px solid var(--fp-line);
      border-radius: 12px;
      color: var(--fp-ink);
      font-size: 0.875rem;
      box-shadow: var(--fp-elevation);
    }

    .app-banner span { flex: 1; }

    .banner-action {
      flex-shrink: 0;
      min-height: 40px;
      padding: 0 0.875rem;
      border: 0;
      border-radius: 6px;
      background: var(--fp-accent);
      color: var(--fp-on-accent);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    .banner-dismiss {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 6px;
      background: none;
      color: var(--fp-ink-secondary);
      font-size: 1rem;
      cursor: pointer;
    }

    .banner-action:focus-visible,
    .banner-dismiss:focus-visible {
      outline: 2px solid var(--fp-green-ink);
      outline-offset: 2px;
    }

    .wake-notice {
      position: fixed;
      z-index: 90;
      right: 16px;
      bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      width: min(410px, calc(100% - 32px));
      padding: 8px 8px 8px 13px;
      border: 1px solid var(--fp-line);
      border-radius: 9px;
      background: var(--fp-surface);
      color: var(--fp-ink);
    }

    .wake-notice div { flex: 1; display: grid; line-height: 1.35; }
    .wake-notice strong { font-size: .85rem; }
    .wake-notice span { color: var(--fp-ink-secondary); font-size: .75rem; }
    .wake-notice .banner-dismiss { flex: none; width: 44px; height: 44px; }

    @media (max-width: 820px) {
      .wake-notice { bottom: calc(70px + env(safe-area-inset-bottom)); }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  title = 'FitnessPro';
  isLoading = false;
  isOnline = navigator.onLine;
  currentRoute = '';

  /** Masquee pour la session apres un refus explicite. */
  private installDismissed = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private exercisesService: ExercisesService,
    public pwa: PwaService,
    private reminders: ReminderService,
    public wake: BackendWakeService
  ) {
    inject(AppearanceService);
    this.setupOnlineStatusMonitoring();

    // Des le constructeur : le reveil du conteneur se deroule alors en
    // parallele du bootstrap Angular au lieu de s'y ajouter.
    this.wake.warm();
  }

  showWakeNotice(): boolean {
    return (
      this.wake.waking() &&
      this.isOnline &&
      !this.wake.dismissed() &&
      this.wake.elapsed() <= EXPECTED_WAKE_SECONDS + 15
    );
  }

  ngOnInit(): void {
    this.trackRouteChanges();
    this.setupLoadingState();
    this.performInitialChecks();

    // Service worker + rattrapage des rappels. Les deux echouent en silence
    // si la plateforme ne les supporte pas : l'app fonctionne sans.
    this.pwa.init();
    this.reminders.init();
  }

  showInstallBanner(): boolean {
    return (
      this.pwa.installAvailable() &&
      !this.pwa.isInstalled() &&
      !this.installDismissed
    );
  }

  install(): void {
    this.pwa.promptInstall();
  }

  dismissInstall(): void {
    this.installDismissed = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private trackRouteChanges(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      setTimeout(() => {
        this.currentRoute = event.url;
      });
    });
  }

  private setupLoadingState(): void {
    // Subscribe to global loading states
    this.exercisesService?.loading$?.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.isLoading = loading;
      });
    });
  }

  private setupOnlineStatusMonitoring(): void {
    window.addEventListener('online', () => {
      setTimeout(() => {
        this.isOnline = true;
        this.performConnectivityCheck();
      });
    });

    window.addEventListener('offline', () => {
      setTimeout(() => {
        this.isOnline = false;
      });
    });
  }

  private performInitialChecks(): void {
    // Test API connection on app start
    this.testApiConnection();
    
    // Check auth status
    this.checkAuthStatus();
  }

  private testApiConnection(): void {
    if (!this.exercisesService?.testConnection) {
      return;
    }

    this.exercisesService.testConnection().subscribe({
      next: () => {
        // Connection successful
      },
      error: (error) => {
        this.showConnectionError();
      }
    });
  }

  private checkAuthStatus(): void {
    // Auth status check completed silently
  }

  private performConnectivityCheck(): void {
    // Perform a quick connectivity test when coming back online
    if (this.exercisesService?.testConnection) {
      this.exercisesService.testConnection();
      this.testApiConnection();
    }
  }

  private showConnectionError(): void {
    if (!this.isOnline) {
      return; // Don't show API error if already offline
    }

    console.error('Impossible de se connecter au serveur');
  }
}

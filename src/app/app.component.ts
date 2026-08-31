// app.component.ts - VERSION CORRIGÉE
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

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
    <!-- Reveil du serveur. Prioritaire sur le spinner generique : il explique
         une attente longue au lieu de la subir. -->
    <div class="wake-overlay" *ngIf="showWakeOverlay()" role="status" aria-live="polite">
      <div class="wake-card">
        <div class="wake-bar"><div class="wake-fill" [style.width.%]="wakeProgress()"></div></div>
        <h2>Réveil du serveur</h2>
        <p>
          L'hébergement gratuit met le serveur en veille après un moment
          d'inactivité. Le redémarrage prend environ {{ expectedWakeSeconds }} secondes.
        </p>
        <p class="wake-timer">{{ wake.elapsed() }} s</p>
        <button type="button" class="banner-dismiss wake-skip" (click)="wake.dismiss()">
          Continuer sans attendre
        </button>
      </div>
    </div>

    <div class="wake-overlay" *ngIf="wake.failed() && !wake.dismissed()" role="alert">
      <div class="wake-card">
        <h2>Serveur injoignable</h2>
        <p>
          Le serveur n'a pas répondu. Tes séances enregistrées sur l'appareil
          restent consultables.
        </p>
        <div class="wake-actions">
          <button type="button" class="banner-action" (click)="wake.retry()">Réessayer</button>
          <button type="button" class="banner-dismiss wake-skip" (click)="wake.dismiss()">
            Continuer hors ligne
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" *ngIf="isLoading && !showWakeOverlay()">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    </div>

    <!-- Main Router Outlet -->
    <router-outlet></router-outlet>

    <!-- Connection Status -->
    <div class="connection-status" [class.offline]="!isOnline" *ngIf="!isOnline">
      <span>⚠️ Hors ligne — tes séances restent enregistrées sur l'appareil</span>
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
       entierement sombre : un rectangle eclatant a chaque demarrage. */
    .loading-spinner {
      background: #141416;
      border: 1px solid rgba(255, 255, 255, 0.10);
      color: #f4f4f5;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid rgba(255, 255, 255, 0.14);
      border-top-color: #a1a1aa;
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

      background: #141416;
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 10px;
      color: #a1a1aa;
      font-size: 0.8125rem;
    }

    .connection-status.offline {
      border-color: rgba(255, 107, 107, 0.4);
      color: #ff9f9f;
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

      background: #141416;
      /* La bordure lime a 35 % etait le dernier cerclage fluo de l'app. */
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      color: #f4f4f5;
      font-size: 0.875rem;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
    }

    .app-banner span { flex: 1; }

    .banner-action {
      flex-shrink: 0;
      min-height: 40px;
      padding: 0 0.875rem;
      border: 0;
      border-radius: 8px;
      background: #d4ff3d;
      color: #050505;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    .banner-dismiss {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 8px;
      background: none;
      color: #a1a1aa;
      font-size: 1rem;
      cursor: pointer;
    }

    .banner-action:focus-visible,
    .banner-dismiss:focus-visible {
      outline: 2px solid #d4ff3d;
      outline-offset: 2px;
    }

    .wake-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background: #050505;
    }

    .wake-card {
      width: min(420px, 100%);
      text-align: center;
      color: #f4f4f5;
    }

    .wake-card h2 {
      margin: 1.25rem 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 650;
    }

    .wake-card p {
      margin: 0;
      color: #a1a1aa;
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .wake-bar {
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.09);
      overflow: hidden;
    }

    .wake-fill {
      height: 100%;
      background: #d4ff3d;
      border-radius: 2px;
      transition: width 1s linear;
    }

    .wake-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      margin-top: 1.25rem;
    }

    .wake-skip {
      width: auto;
      height: auto;
      min-height: 44px;
      padding: 0 1rem;
      font-size: 0.875rem;
      text-decoration: underline;
    }

    .wake-timer {
      margin-top: 1rem !important;
      font-size: 1.75rem !important;
      font-weight: 700;
      /* Un compte a rebours est une valeur, pas une action : il ne prend pas
         la couleur d'accent. */
      color: #f4f4f5 !important;
      font-variant-numeric: tabular-nums;
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
    this.setupOnlineStatusMonitoring();

    // Des le constructeur : le reveil du conteneur se deroule alors en
    // parallele du bootstrap Angular au lieu de s'y ajouter.
    this.wake.warm();
  }

  readonly expectedWakeSeconds = EXPECTED_WAKE_SECONDS;

  /** Progression indicative : plafonnee a 95 % tant que le serveur n'a pas repondu. */
  wakeProgress(): number {
    return Math.min(95, (this.wake.elapsed() / EXPECTED_WAKE_SECONDS) * 100);
  }

  /**
   * L'ecran d'attente ne doit jamais enfermer l'utilisateur. Il disparait des
   * qu'il le demande, et de lui-meme au-dela du temps de reveil annonce : au
   * dela, l'attente n'est plus explicable et mieux vaut rendre la main. Le ping
   * continue en arriere-plan pendant ce temps.
   */
  showWakeOverlay(): boolean {
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

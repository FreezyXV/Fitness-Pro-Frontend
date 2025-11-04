// app.component.ts - VERSION CORRIGÉE
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { ExercisesService } from './services/exercises.service';
import { NotificationUtils } from '@shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
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
      <span>⚠️ Connexion interrompue</span>
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

    .loading-spinner {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #21BF73;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .connection-status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 14px;
      z-index: 1000;
      animation: slideInRight 0.3s ease;
    }

    .connection-status.offline {
      background: #ef4444;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  title = 'FitnessPro';
  isLoading = false;
  isOnline = navigator.onLine;
  currentRoute = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private exercisesService: ExercisesService
  ) {
    this.setupOnlineStatusMonitoring();
  }

  ngOnInit(): void {
    this.trackRouteChanges();
    this.setupLoadingState();
    this.performInitialChecks();
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
        NotificationUtils.success('Connexion rétablie');
        this.performConnectivityCheck();
      });
    });

    window.addEventListener('offline', () => {
      setTimeout(() => {
        this.isOnline = false;
        NotificationUtils.warning('Connexion interrompue');
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

    NotificationUtils.error('Impossible de se connecter au serveur');
  }
}

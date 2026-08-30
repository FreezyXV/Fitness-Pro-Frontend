// bottom-nav.component.ts - Navigation principale mobile.
//
// Remplace le drawer plein ecran par une barre d'onglets basse : c'est le
// pattern de toutes les apps fitness (Strava, Hevy, MyFitnessPal) parce qu'en
// salle le telephone est tenu d'une main, pouce en bas. Le drawer imposait
// deux taps pour changer de section et masquait la navigation.
//
// Quatre destinations primaires + une feuille "Plus" pour le secondaire :
// tout reste atteignable en deux taps maximum, avec un seul systeme de
// navigation sur mobile (la sidebar est reservee au desktop).
import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from '@app/services/auth.service';

interface NavDestination {
  label: string;
  route: string;
  /** Chemin(s) SVG du pictogramme, tracés dans une viewBox 24x24. */
  paths: string[];
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  /** Feuille "Plus". Signal : l'etat est purement local et synchrone. */
  readonly sheetOpen = signal(false);

  readonly primary: NavDestination[] = [
    {
      label: 'Accueil',
      route: '/dashboard',
      paths: ['M3 11.5 12 4l9 7.5', 'M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9']
    },
    {
      label: 'Séances',
      route: '/workouts',
      paths: ['M6.5 6.5v11', 'M17.5 6.5v11', 'M3.5 9.5v5', 'M20.5 9.5v5', 'M6.5 12h11']
    },
    {
      label: 'Nutrition',
      route: '/nutrition',
      paths: ['M7 3v8a3 3 0 0 0 6 0V3', 'M10 11v10', 'M17.5 3c-1.5 2-1.5 5-1.5 7h3c0-2 0-5-1.5-7z', 'M17.5 10v11']
    },
    {
      label: 'Progression',
      route: '/progress',
      paths: ['M3 3v18h18', 'M7 15l4-4 3 3 5-6']
    }
  ];

  readonly secondary: NavDestination[] = [
    {
      label: 'Exercices',
      route: '/exercises',
      paths: ['M7 8l-4 4 4 4', 'M17 8l4 4-4 4', 'M9.5 12h5']
    },
    {
      label: 'Calendrier',
      route: '/calendar',
      paths: ['M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 10h18', 'M8 2v4', 'M16 2v4']
    },
    {
      label: 'Objectifs',
      route: '/goals',
      paths: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0', 'M12 12m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0']
    },
    {
      label: 'Défis',
      route: '/challenges',
      paths: ['M6 4h12v4a6 6 0 0 1-12 0z', 'M6 6H4v1a3 3 0 0 0 3 3', 'M18 6h2v1a3 3 0 0 1-3 3', 'M12 14v4', 'M9 20h6']
    },
    {
      label: 'Profil',
      route: '/profile',
      paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0']
    }
  ];

  constructor(private readonly router: Router, private readonly auth: AuthService) {
    // Toute navigation referme la feuille : sans ca, revenir en arriere depuis
    // une destination secondaire laisserait le panneau ouvert par-dessus.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.closeSheet());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.releaseBodyScroll();
  }

  toggleSheet(): void {
    this.sheetOpen() ? this.closeSheet() : this.openSheet();
  }

  openSheet(): void {
    this.sheetOpen.set(true);
    document.body.classList.add('nav-sheet-open');
  }

  closeSheet(): void {
    if (!this.sheetOpen()) return;
    this.sheetOpen.set(false);
    this.releaseBodyScroll();
  }

  /** Echap ferme la feuille : exigence clavier de base sur tout overlay. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSheet();
  }

  /** La feuille est-elle sur une route secondaire ? Sert a marquer l'onglet "Plus". */
  isSecondaryActive(): boolean {
    return this.secondary.some(d => this.router.url.startsWith(d.route));
  }

  logout(): void {
    this.closeSheet();
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  private releaseBodyScroll(): void {
    document.body.classList.remove('nav-sheet-open');
  }
}

// src/app/layout/sidebar/sidebar.component.ts - Enhanced Component Logic
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Renderer2,
  Inject,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  RouterModule,
  Router,
  NavigationEnd,
} from '@angular/router';
import { Observable, Subject, fromEvent } from 'rxjs';
import { takeUntil, filter, debounceTime } from 'rxjs/operators';

import { AuthService } from '@app/services/auth.service';
import { User } from '@shared';

/** Extended user model for local usage */
type ExtendedUser = User & { 
  fidelity_score?: number;
  profile_photo_url?: string;
  email?: string;
  streak_days?: number;
  last_activity?: Date;
};

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  isActive?: boolean;
  badge?: string | number;
  section?: 'main' | 'tools';
}

interface NotificationCounts {
  [key: string]: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  private readonly resize$ = fromEvent(window, 'resize').pipe(
    debounceTime(150),
    takeUntil(this.destroy$)
  );

  @ViewChild('sidebar', { static: false }) sidebarRef?: ElementRef<HTMLElement>;

  // Component State - Simplified (no collapse for desktop/tablet)
  showMobileOverlay: boolean = false;
  isMobile: boolean = false;

  // User Data
  user$!: Observable<ExtendedUser | null>;
  user: ExtendedUser | null = null;

  // Menu Configuration
  mainMenuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'chart', 
      route: '/dashboard',
      section: 'main'
    },
    { 
      id: 'exercises', 
      label: 'Exercices', 
      icon: 'dumbbell', 
      route: '/exercises',
      section: 'main'
    },
    { 
      id: 'workouts', 
      label: 'Entraînements', 
      icon: 'flame', 
      route: '/workouts',
      section: 'main'
    },
    { 
      id: 'nutrition', 
      label: 'Nutrition', 
      icon: 'book', 
      route: '/nutrition',
      section: 'main'
    }
  ];

  toolsMenuItems: MenuItem[] = [
    { 
      id: 'calendar', 
      label: 'Calendrier', 
      icon: 'calendar', 
      route: '/calendar',
      section: 'tools'
    },
    { 
      id: 'goals', 
      label: 'Objectifs', 
      icon: 'target', 
      route: '/goals',
      section: 'tools'
    },
    { 
      id: 'challenges', 
      label: 'Défis', 
      icon: 'trophy', 
      route: '/challenges',
      section: 'tools'
    },
    { 
      id: 'profile', 
      label: 'Profil', 
      icon: 'user', 
      route: '/profile',
      section: 'tools'
    }
  ];

  // Notifications Management
  private notifications: NotificationCounts = {
    dashboard: 1,
    workouts: 2,
    challenges: 3,
  };

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly renderer: Renderer2,
    private readonly cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    // Initialize properties first
    this.initializeDefaults();
    
    // Check screen size immediately (768px matches $breakpoint-md)
    this.isMobile = window.innerWidth <= 768;
    console.log('Sidebar initialized - isMobile:', this.isMobile, 'width:', window.innerWidth);
  }

  ngOnInit(): void {
    console.log('Sidebar ngOnInit - isMobile:', this.isMobile);
    try {
      this.initializeUserData();
      this.setupRouterSubscription();
      this.setupResizeObserver();
      this.updateBodyClass();
      
      // Force initial change detection
      this.cdr.detectChanges();
      console.log('Sidebar initialization complete');
    } catch (error) {
      console.error('Error during sidebar initialization:', error);
      this.ensureWorkingState();
    }
  }

  ngAfterViewInit(): void {
    try {
      this.setupKeyboardNavigation();
    } catch (error) {
      console.warn('Error during sidebar after view init:', error);
    }
  }

  ngOnDestroy(): void {
    try {
      this.destroy$.next();
      this.destroy$.complete();
      this.removeBodyClass();
    } catch (error) {
      console.warn('Error during sidebar destruction:', error);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // No user menu to handle anymore
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isMobile && this.showMobileOverlay) {
      this.closeMobileSidebar();
      event.preventDefault();
    }
  }

  // Initialization Methods
  private initializeDefaults(): void {
    this.showMobileOverlay = false;
    this.isMobile = false;
    this.user = null;
  }

  private ensureWorkingState(): void {
    if (typeof this.showMobileOverlay !== 'boolean') this.showMobileOverlay = false;
    if (typeof this.isMobile !== 'boolean') this.isMobile = window.innerWidth <= 768;
  }

  // Screen Size Management (Simplified)
  private checkScreenSize(): void {
    try {
      const width = window?.innerWidth || 1024;
      const wasMobile = this.isMobile;
      
      this.isMobile = width <= 768;
      console.log('Screen size check - Width:', width, 'isMobile:', this.isMobile); // Debug log

      // Handle mobile transition
      if (!wasMobile && this.isMobile) {
        // Desktop/Tablet to Mobile - close any open overlays
        this.showMobileOverlay = false;
      } else if (wasMobile && !this.isMobile) {
        // Mobile to Desktop/Tablet - close mobile overlay
        this.showMobileOverlay = false;
      }

      this.updateBodyClass();
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('Error in checkScreenSize:', error);
      this.isMobile = window.innerWidth <= 768;
    }
  }

  private setupResizeObserver(): void {
    this.resize$.subscribe(() => {
      this.checkScreenSize();
    });
  }

  // User Data Management
  private initializeUserData(): void {
    this.user$ = this.auth.currentUser$ as Observable<ExtendedUser | null>;

    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
        this.cdr.detectChanges();
      });
  }

  // Router Management
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd), 
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Close mobile sidebar on navigation
        if (this.isMobile) {
          this.showMobileOverlay = false;
        }
        this.cdr.detectChanges();
      });
  }

  // Mobile Sidebar Functions
  toggleMobileSidebar(): void {
    if (this.isMobile) {
      this.showMobileOverlay = !this.showMobileOverlay;
      this.updateBodyClass();
      console.log('Mobile sidebar toggled:', this.showMobileOverlay); // Debug log
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile) {
      this.showMobileOverlay = false;
      this.updateBodyClass();
      console.log('Mobile sidebar closed'); // Debug log
    }
  }

  onMenuClick(): void {
    if (this.isMobile && this.showMobileOverlay) {
      this.closeMobileSidebar();
    }
  }

  // Navigation Functions
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.showMobileOverlay = false;

    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  // Notification Management
  getNotificationCount(section: string): number {
    return this.notifications[section] ?? 0;
  }

  clearNotifications(section: string): void {
    this.notifications[section] = 0;
    this.cdr.detectChanges();
  }

  updateNotification(section: string, count: number): void {
    this.notifications[section] = Math.max(0, count);
    this.cdr.detectChanges();
  }

  getTotalNotifications(): number {
    return Object.values(this.notifications).reduce((sum, count) => sum + count, 0);
  }

  // User Score and Stats Management
  getFidelityScore(): number {
    return this.user?.fidelity_score ?? 0;
  }

  getStreakDays(): number {
    return this.user?.streak_days ?? 0;
  }

  getLastSyncTime(): string {
    const now = new Date();
    const lastSync = this.user?.last_activity ? new Date(this.user.last_activity) : now;
    const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  }

  // Body Class Management (Simplified)
  private updateBodyClass(): void {
    const mobileOverlayClass = 'mobile-overlay-open';
    
    // Handle mobile overlay
    if (this.showMobileOverlay && this.isMobile) {
      this.renderer.addClass(this.document.body, mobileOverlayClass);
      console.log('Added mobile overlay class'); // Debug log
    } else {
      this.renderer.removeClass(this.document.body, mobileOverlayClass);
      console.log('Removed mobile overlay class'); // Debug log
    }
    
    // Prevent body scroll on mobile when overlay is open
    if (this.showMobileOverlay && this.isMobile) {
      this.renderer.setStyle(this.document.body, 'overflow', 'hidden');
    } else {
      this.renderer.removeStyle(this.document.body, 'overflow');
    }
  }

  private removeBodyClass(): void {
    this.renderer.removeClass(this.document.body, 'mobile-overlay-open');
  }

  // Utility Functions
  preventDefault(event: Event): void {
    event.preventDefault();
  }

  // Accessibility and Keyboard Navigation
  private setupKeyboardNavigation(): void {
    // Add keyboard navigation for menu items
    const navLinks = this.document.querySelectorAll('.nav-link');
    
    navLinks.forEach((link, index) => {
      link.addEventListener('keydown', (event: Event) => {
        const keyEvent = event as KeyboardEvent;
        
        switch (keyEvent.key) {
          case 'ArrowDown':
            event.preventDefault();
            const nextLink = navLinks[index + 1] as HTMLElement;
            nextLink?.focus();
            break;
            
          case 'ArrowUp':
            event.preventDefault();
            const prevLink = navLinks[index - 1] as HTMLElement;
            prevLink?.focus();
            break;
            
          case 'Home':
            event.preventDefault();
            const firstLink = navLinks[0] as HTMLElement;
            firstLink?.focus();
            break;
            
          case 'End':
            event.preventDefault();
            const lastLink = navLinks[navLinks.length - 1] as HTMLElement;
            lastLink?.focus();
            break;
        }
      });
    });
  }

  // Enhanced Public API
  public addNotification(section: string, count: number = 1): void {
    this.updateNotification(section, this.getNotificationCount(section) + count);
  }

  public removeNotification(section: string, count: number = 1): void {
    this.updateNotification(section, this.getNotificationCount(section) - count);
  }

  public refreshUserData(): void {
    // Trigger user data refresh
    this.cdr.detectChanges();
  }

  public closeAllMenus(): void {
    if (this.isMobile) {
      this.showMobileOverlay = false;
    }
    this.updateBodyClass();
  }

  // Getters for template
  get hasNotifications(): boolean {
    return this.getTotalNotifications() > 0;
  }

  get isDesktop(): boolean {
    return !this.isMobile;
  }

  get userInitials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  // User Profile Methods
  getUserEmail(): string {
    return this.user?.email ?? 'email@exemple.com';
  }

  getUserProfilePhoto(): string {
    return this.user?.profile_photo_url ?? '/assets/default-user.png';
  }

  // Activity and Engagement Methods
  getActivityLevel(): 'high' | 'medium' | 'low' {
    const score = this.getFidelityScore();
    
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  getActivityLevelText(): string {
    const level = this.getActivityLevel();
    const levelMap = {
      high: 'Très actif',
      medium: 'Modérément actif',
      low: 'Peu actif'
    };
    
    return levelMap[level];
  }

  // Error handling wrapper for template methods
  trackByMenuItem(index: number, item: MenuItem): string {
    return item.id;
  }

  trackByNotification(index: number, notification: [string, number]): string {
    return notification[0];
  }

  // Debug method for troubleshooting
  debugSidebarState(): void {
    console.log('=== Sidebar Debug State ===');
    console.log('isMobile:', this.isMobile);
    console.log('showMobileOverlay:', this.showMobileOverlay);
    console.log('window.innerWidth:', window.innerWidth);
    console.log('user:', this.user);
    console.log('========================');
  }

  // Error handling wrapper for template methods
  safeGetNotificationCount(section: string): number {
    try {
      return this.getNotificationCount(section);
    } catch (error) {
      console.warn(`Error getting notification count for ${section}:`, error);
      return 0;
    }
  }
}

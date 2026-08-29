//app.component.spec.ts

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ExercisesService } from './services/exercises.service';
import { AuthService } from './services/auth.service';
import { BehaviorSubject, of, throwError } from 'rxjs';

// Mock components for testing
@Component({ template: 'Dashboard' })
class MockDashboardComponent { }

@Component({ template: 'Login' })
class MockLoginComponent { }

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let router: Router;
  let location: Location;
  let exercisesService: jasmine.SpyObj<ExercisesService>;
  let loading$: BehaviorSubject<boolean>;

  beforeEach(async () => {
    // Le composant appelle testConnection() des ngOnInit : sans valeur de
    // retour par defaut, le moindre detectChanges() leve
    // "Cannot read properties of undefined (reading 'subscribe')".
    loading$ = new BehaviorSubject<boolean>(false);
    const exercisesServiceSpy = jasmine.createSpyObj(
      'ExercisesService',
      ['testConnection'],
      { loading$ }
    );
    exercisesServiceSpy.testConnection.and.returnValue(of({ status: 'ok' }));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      isInitialized$: of(true),
      currentUser$: of(null)
    });

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule.withRoutes([
          { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: MockDashboardComponent },
          { path: 'login', component: MockLoginComponent }
        ]),
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ExercisesService, useValue: exercisesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    exercisesService = TestBed.inject(ExercisesService) as jasmine.SpyObj<ExercisesService>;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct title', () => {
    expect(component.title).toBe('FitnessPro');
  });

  it('should initialize app state correctly', () => {
    expect(component.isLoading).toBe(false);
    expect(component.isOnline).toBe(true);
  });

  it('should test API connection on init', () => {
    component.ngOnInit();

    expect(exercisesService.testConnection).toHaveBeenCalled();
  });

  it('should survive an API connection failure', () => {
    // L'echec est traite en interne par showConnectionError() et ne doit
    // jamais remonter jusqu'a faire echouer l'initialisation.
    exercisesService.testConnection.and.returnValue(
      throwError(() => ({ status: 500, message: 'Server error' }))
    );

    expect(() => component.ngOnInit()).not.toThrow();
    expect(component.isOnline).toBe(true);
  });

  it('should track route changes', fakeAsync(() => {
    fixture.detectChanges();

    router.navigate(['/dashboard']);
    tick();

    expect(location.path()).toBe('/dashboard');
    // currentRoute est affecte dans un setTimeout pour eviter
    // ExpressionChangedAfterItHasBeenChecked : il faut laisser tourner la file.
    expect(component.currentRoute).toBe('/dashboard');
  }));

  it('should mirror the service loading state', fakeAsync(() => {
    fixture.detectChanges();

    loading$.next(true);
    tick();
    expect(component.isLoading).toBe(true);

    loading$.next(false);
    tick();
    expect(component.isLoading).toBe(false);
  }));

  it('should show the loading overlay while loading', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.textContent).toContain('Chargement');
  });

  it('should render router outlet', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should show connection status when disconnected', () => {
    component.isOnline = false;
    fixture.detectChanges();

    const connectionStatus = fixture.nativeElement.querySelector('.connection-status');
    expect(connectionStatus).toBeTruthy();
    expect(connectionStatus?.textContent).toContain('Connexion interrompue');
  });

  it('should hide connection status while online', () => {
    component.isOnline = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.connection-status')).toBeNull();
  });
});

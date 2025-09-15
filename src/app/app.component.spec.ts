//app.component.spec.ts

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ExercisesService } from './services/exercises.service';
import { AuthService } from './services/auth.service';
import { of, throwError } from 'rxjs';

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
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const exercisesServiceSpy = jasmine.createSpyObj('ExercisesService', ['testConnection'], {
      loading$: of(false)
    });

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
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct title', () => {
    expect(component.title).toBe('FitnessPro');
  });

  it('should initialize app state correctly', () => {
    expect(component.isLoading).toBe(false);
    expect(component.isConnected).toBe(true);
    expect(component.connectionError).toBe(false);
  });

  it('should test API connection on init', () => {
    exercisesService.testConnection.and.returnValue(of({ status: 'ok' }));
    
    component.ngOnInit();
    
    expect(exercisesService.testConnection).toHaveBeenCalled();
  });

  it('should handle API connection error', () => {
    const error = { status: 500, message: 'Server error' };
    exercisesService.testConnection.and.returnValue(throwError(() => error));
    
    spyOn(console, 'error');
    
    component.ngOnInit();
    
    expect(console.error).toHaveBeenCalledWith('❌ API connection failed:', error);
    expect(component.isConnected).toBe(false);
    expect(component.connectionError).toBe(true);
  });

  it('should track route changes', async () => {
    await router.navigate(['/dashboard']);
    expect(location.path()).toBe('/dashboard');
    expect(component.currentRoute).toBe('/dashboard');
  });

  it('should show loading state during navigation', async () => {
    const navigationPromise = router.navigate(['/dashboard']);
    
    // Loading should be true during navigation
    expect(component.isLoading).toBe(true);
    
    await navigationPromise;
    
    // Loading should be false after navigation
    expect(component.isLoading).toBe(false);
  });

  it('should render router outlet', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should show connection status when disconnected', () => {
    component.isConnected = false;
    component.connectionError = true;
    fixture.detectChanges();
    
    const connectionStatus = fixture.nativeElement.querySelector('.connection-status');
    expect(connectionStatus).toBeTruthy();
    expect(connectionStatus?.textContent).toContain('Connexion perdue');
  });

  it('should show loading indicator when loading', () => {
    component.isLoading = true;
    fixture.detectChanges();
    
    const loadingIndicator = fixture.nativeElement.querySelector('.global-loading');
    expect(loadingIndicator).toBeTruthy();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
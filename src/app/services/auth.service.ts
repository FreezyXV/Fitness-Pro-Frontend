import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, timer, EMPTY, of } from 'rxjs';
import { map, catchError, tap, retry, timeout, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

import { 
  User, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ApiResponse, 
  APP_CONFIG, 
  StorageUtils,
  NotificationUtils
} from '../shared';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // SUBJECTS PUBLICS pour APP_INITIALIZER - CRITIQUE
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public tokenSubject = new BehaviorSubject<string | null>(null);
  public isInitializedSubject = new BehaviorSubject<boolean>(false);
  
  private isLoggingOut = false;
  private autoLogoutTimer: number | undefined;

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public isInitialized$ = this.isInitializedSubject.asObservable();

  // Auto-logout timer is handled by the backend via token expiration and 401 responses.
  // The auth.interceptor will catch 401s and trigger a logout.

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('🔄 AuthService: Service créé');
  }

  // =============================================
  // GETTERS
  // =============================================

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    const hasToken = !!(this.token || this.getStoredToken());
    const hasUser = !!(this.currentUser || this.getStoredUser());
    return hasToken && hasUser;
  }

  get isInitialized(): boolean {
    return this.isInitializedSubject.value;
  }

  // =============================================
  // MÉTHODES PUBLIQUES pour APP_INITIALIZER - CRITIQUE
  // =============================================

  public getStoredToken(): string | null {
    return StorageUtils.getItem<string>(APP_CONFIG.TOKEN_KEY);
  }

  public getStoredUser(): User | null {
    return StorageUtils.getItem<User>(APP_CONFIG.USER_KEY);
  }

  public removeToken(): void {
    console.log('🗑️ AuthService: Removing token');
    StorageUtils.removeItem(APP_CONFIG.TOKEN_KEY);
    this.tokenSubject.next(null);
  }

  // =============================================
  // TOKEN MANAGEMENT PRIVÉ
  // =============================================

  private setToken(token: string): void {
    console.log('🔐 AuthService: Setting new token');
    StorageUtils.setItem(APP_CONFIG.TOKEN_KEY, token);
    this.tokenSubject.next(token);
  }

  // =============================================
  // HTTP HEADERS - CORRIGÉ
  // =============================================

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.token || this.getStoredToken();
    let headers = this.getHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // =============================================
  // AUTHENTICATION METHODS - ROUTES BACKEND CORRECTES
  // =============================================

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔄 AuthService: Attempting login for:', credentials.email);
    
    if (!credentials.email || !credentials.password) {
      return throwError(() => new Error('Email et mot de passe requis'));
    }

    // ROUTE BACKEND CORRECTE: /api/auth/login
    return this.http.post<ApiResponse<AuthResponse>>(
      `${APP_CONFIG.API_URL}/auth/login`,
      {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      },
      { headers: this.getHeaders() }
    ).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      retry({
        count: 1,
        delay: (error) => {
          console.warn('Retrying login after error:', error);
          return timer(1000);
        }
      }),
      tap(response => console.log('✅ AuthService: Login response received')),
      map(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Échec de la connexion');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('🔄 AuthService: Attempting registration for:', userData.email);
    
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return throwError(() => new Error('Tous les champs sont requis'));
    }

    const registrationData = {
      first_name: userData.firstName.trim(),
      last_name: userData.lastName.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      password_confirmation: userData.passwordConfirmation,
      acceptTerms: userData.acceptTerms
    };

    // ROUTE BACKEND CORRECTE: /api/auth/register
    return this.http.post<ApiResponse<AuthResponse>>(
      `${APP_CONFIG.API_URL}/auth/register`,
      registrationData,
      { headers: this.getHeaders() }
    ).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      tap(response => console.log('✅ AuthService: Registration response received')),
      map(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Échec de l\'inscription');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logout(): Observable<any> {
    if (this.isLoggingOut) {
      return EMPTY;
    }

    this.isLoggingOut = true;
    console.log('🔄 AuthService: Logging out user');
    
    const token = this.token || this.getStoredToken();
    if (!token) {
      this.handleLogout();
      return EMPTY;
    }

    return this.http.post<ApiResponse<any>>(
      `${APP_CONFIG.API_URL}/auth/logout`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(5000),
      tap(() => console.log('✅ AuthService: Logout successful')),
      map(response => {
        this.handleLogout();
        return response;
      }),
      catchError((error) => {
        console.warn('⚠️ AuthService: Logout error, clearing session anyway:', error);
        this.handleLogout();
        return of(null);
      }),
      finalize(() => {
        this.isLoggingOut = false;
      })
    );
  }

  // =============================================
  // USER MANAGEMENT
  // =============================================

  updateUser(user: User): void {
    console.log('🔄 AuthService: Updating user data');
    this.currentUserSubject.next(user);
    StorageUtils.setItem(APP_CONFIG.USER_KEY, user);
  }

  me(): Observable<User> {
    console.log('🔄 AuthService: Getting current user info');
    
    const token = this.token || this.getStoredToken();
    if (!token) {
      return throwError(() => new Error('Aucun token d\'authentification'));
    }
    
    return this.http.get<ApiResponse<User>>(
      `${APP_CONFIG.API_URL}/auth/me`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      map(response => {
        if (response.success && response.data) {
          this.updateUser(response.data);
          this.setupAutoLogout();
          return response.data;
        }
        throw new Error(response.message || 'Impossible de récupérer les informations utilisateur');
      }),
      catchError((error) => {
        console.error('❌ AuthService: me() failed:', error);
        
        // Ne vider la session que si c'est vraiment une erreur d'auth
        if (error.status === 401) {
          console.warn('⚠️ AuthService: Token invalide, vidage de la session');
          this.clearSession();
        }
        
        return this.handleError(error);
      })
    );
  }

  refreshUserData(): Observable<User> {
    return this.me();
  }

  // =============================================
  // SESSION MANAGEMENT
  // =============================================

  private handleAuthSuccess(authResponse: AuthResponse): void {
    console.log('✅ AuthService: Authentication successful');
    
    this.setToken(authResponse.token);
    this.updateUser(authResponse.user);
    this.setupAutoLogout();
    
    NotificationUtils.success(`Bienvenue ${authResponse.user.name}!`);
  }

  private handleLogout(): void {
    console.log('🔄 AuthService: Handling logout');
    
    this.clearSession();
    this.clearAutoLogout();
    
    // Only navigate if not already on login page
    if (!this.router.url.includes('/login')) {
      this.router.navigate(['/login']);
    }
    
    NotificationUtils.info('Vous avez été déconnecté');
  }

  private clearSession(): void {
    console.log('🗑️ AuthService: Clearing session');
    
    this.removeToken();
    StorageUtils.removeItem(APP_CONFIG.USER_KEY);
    this.currentUserSubject.next(null);
  }

  // =============================================
  // AUTO-LOGOUT
  // =============================================

  private setupAutoLogout(): void {
    this.clearAutoLogout();
    
    this.autoLogoutTimer = window.setTimeout(() => {
      console.log('⏰ AuthService: Auto-logout triggered');
      NotificationUtils.warning('Session expirée, déconnexion automatique');
      this.handleLogout();
    }, APP_CONFIG.UI_CONFIG.AUTO_LOGOUT_TIME);
  }

  private clearAutoLogout(): void {
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = undefined;
    }
  }

  resetAutoLogoutTimer(): void {
    if (this.isAuthenticated) {
      this.setupAutoLogout();
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  hasRole(role: string): boolean {
    return this.currentUser?.roles?.includes(role) || false;
  }

  hasPermission(permission: string): boolean {
    return true;
  }

  isEmailVerified(): boolean {
    return !!this.currentUser?.emailVerifiedAt;
  }

  canAccessRoute(route: string): boolean {
    if (!this.isAuthenticated) return false;
    
    const restrictedRoutes = ['/admin'];
    if (restrictedRoutes.includes(route)) {
      return this.hasRole('admin');
    }
    
    return true;
  }

  // =============================================
  // ERROR HANDLING
  // =============================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ AuthService error:', error);

    let errorMessage = 'Une erreur est survenue';

    if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    } else if (error.status === 401) {
      errorMessage = 'Identifiants incorrects ou session expirée';
      // Clear invalid session on 401 (except for login attempts)
      if (!error.url?.includes('/auth/login')) {
        this.clearSession();
      }
    } else if (error.status === 403) {
      errorMessage = 'Accès non autorisé';
    } else if (error.status === 404) {
      errorMessage = 'Service non trouvé. Vérifiez la configuration du serveur.';
    } else if (error.status === 422) {
      if (error.error?.errors) {
        const validationErrors: string[] = [];
        for (const field in error.error.errors) {
          if (Array.isArray(error.error.errors[field])) {
            validationErrors.push(...error.error.errors[field]);
          }
        }
        errorMessage = validationErrors.join(', ');
      } else {
        errorMessage = error.error?.message || 'Données invalides';
      }
    } else if (error.status === 429) {
      errorMessage = 'Trop de tentatives. Veuillez patienter avant de réessayer.';
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  // =============================================
  // PASSWORD RESET
  // =============================================

  requestPasswordReset(email: string): Observable<any> {
    console.log('🔄 AuthService: Requesting password reset for:', email);
    return this.http.post<ApiResponse<any>>(
      `${APP_CONFIG.API_URL}/auth/password/email`,
      { email },
      { headers: this.getHeaders() }
    ).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Échec de la demande de réinitialisation');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  resetPassword(token: string, email: string, password: string, passwordConfirmation: string): Observable<any> {
    console.log('🔄 AuthService: Resetting password for:', email);
    return this.http.post<ApiResponse<any>>(
      `${APP_CONFIG.API_URL}/auth/password/reset`,
      {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      },
      { headers: this.getHeaders() }
    ).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Échec de la réinitialisation du mot de passe');
      }),
      catchError(this.handleError.bind(this))
    );
  }

  adminResetPassword(email: string, password: string, passwordConfirmation: string): Observable<any> {
    console.log('🔄 AuthService: Direct password reset for:', email);
    return this.http.post<ApiResponse<any>>(
      `${APP_CONFIG.API_URL}/auth/password/direct-reset`,
      {
        email,
        password,
        password_confirmation: passwordConfirmation
      },
      { headers: this.getHeaders() }
    ).pipe(
      timeout(APP_CONFIG.REQUEST_TIMEOUT),
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Échec de la réinitialisation du mot de passe');
      }),
      catchError(this.handleError.bind(this))
    );
  }
}
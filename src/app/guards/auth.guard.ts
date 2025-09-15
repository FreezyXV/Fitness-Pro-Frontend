// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, timeout, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { APP_CONFIG } from '../shared/index';

// =============================================
// PRODUCTION GUARDS - CORRIGÉS
// =============================================

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('🔍 AuthGuard: Checking authentication for:', state.url);
  
  return checkAuthentication(authService, router, state.url);
};

export const GuestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 GuestGuard: Checking guest access for:', state.url);

  // Wait until service is initialized
  return authService.isInitialized$.pipe(
    filter(isInitialized => isInitialized),
    take(1),
    switchMap(() => {
      if (authService.isAuthenticated) {
        console.log('🔄 GuestGuard: User already authenticated, redirecting to dashboard');
        router.navigate(['/dashboard']);
        return of(false);
      }

      console.log('✅ GuestGuard: User not authenticated, allowing access');
      return of(true);
    }),
    catchError((error) => {
      console.error('❌ GuestGuard: Error during check:', error);
      // En cas d'erreur, permettre l'accès (fail-safe)
      return of(true);
    })
  );
};

// =============================================
// DEVELOPMENT GUARDS (pour tests sans auth)
// =============================================

export const DevAuthGuard: CanActivateFn = (route, state) => {
  console.log('🔄 DevAuthGuard: Allowing access for development -', state.url);
  return true; // Always allow in development
};

export const DevGuestGuard: CanActivateFn = (route, state) => {
  console.log('🔄 DevGuestGuard: Allowing access for development -', state.url);
  return true; // Always allow in development
};

// =============================================
// HELPER FUNCTIONS - AMÉLIORÉES
// =============================================

function checkAuthentication(
  authService: AuthService, 
  router: Router, 
  returnUrl: string
): Observable<boolean> {
  
  // Étape 1: Vérifier si le service est initialisé
  return authService.isInitialized$.pipe(
    filter(isInitialized => isInitialized),
    take(1),
    switchMap(() => {
      return performAuthCheck(authService, router, returnUrl);
    }),
    timeout(15000), // Increased global timeout to 15 seconds
    catchError((error) => {
      console.error('❌ AuthGuard: Authentication check failed:', error);
      redirectToLogin(router, returnUrl);
      return of(false);
    })
  );
}

function performAuthCheck(
  authService: AuthService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  
  // Vérification rapide: token + user en mémoire
  if (authService.token && authService.currentUser) {
    console.log('✅ AuthGuard: User authenticated (memory):', authService.currentUser.name);
    return of(true);
  }

  // Vérification stockage local
  const storedToken = authService.getStoredToken();
  const storedUser = authService.getStoredUser();

  console.log('📦 AuthGuard: Storage check:', {
    hasStoredToken: !!storedToken,
    hasStoredUser: !!storedUser,
    currentToken: !!authService.token,
    currentUser: !!authService.currentUser
  });

  if (storedToken && storedUser) {
    console.log('🔍 AuthGuard: Found stored credentials, verifying...');
    
    try {
      // Restaurer en mémoire
      authService.tokenSubject.next(storedToken);
      authService.currentUserSubject.next(storedUser);
      
      // Vérifier avec le serveur si possible
      return authService.me().pipe(
        timeout(8000), // Increased timeout for the 'me' call
        map(user => {
          if (user) {
            console.log('✅ AuthGuard: Server verification successful:', user.name);
            return true;
          } else {
            console.warn('🚨 AuthGuard: No user data from server');
            clearInvalidAuth(authService);
            redirectToLogin(router, returnUrl);
            return false;
          }
        }),
        catchError(error => {
          console.warn('⚠️ AuthGuard: Server verification failed:', error.message);
          
          // Si c'est une erreur 401 ou 403, le token est invalide. Vider la session.
          if (error.status === 401 || error.status === 403) {
            console.log('🗑️ AuthGuard: Token invalid or expired, clearing session');
            clearInvalidAuth(authService);
            redirectToLogin(router, returnUrl);
            return of(false);
          }
          
          // Si c'est une erreur réseau (status 0) ou une erreur serveur (5xx),
          // on fait confiance à la session en cache pour le mode hors-ligne/dégradé.
          if (error.status === 0 || (error.status >= 500 && error.status <= 599)) {
            console.log('🔄 AuthGuard: Network/Server error, using cached data for resilience.');
            return of(true);
          }

          // Pour les autres erreurs, on déconnecte par sécurité.
          clearInvalidAuth(authService);
          redirectToLogin(router, returnUrl);
          return of(false);
        })
      );
    } catch (error) {
      console.error('❌ AuthGuard: Error restoring stored credentials:', error);
      clearInvalidAuth(authService);
    }
  }

  // Vérifier si on a au moins un token
  if (storedToken && !storedUser) {
    console.log('🔍 AuthGuard: Token exists but no user data, fetching...');
    
    authService.tokenSubject.next(storedToken);
    
    return authService.me().pipe(
      timeout(8000), // Increased timeout
      map(user => {
        if (user) {
          console.log('✅ AuthGuard: User data fetched successfully:', user.name);
          return true;
        } else {
          console.warn('🚨 AuthGuard: No user data received');
          clearInvalidAuth(authService);
redirectToLogin(router, returnUrl);
          return false;
        }
      }),
      catchError(error => {
        console.error('❌ AuthGuard: Failed to fetch user data:', error);
        clearInvalidAuth(authService);
        redirectToLogin(router, returnUrl);
        return of(false);
      })
    );
  }

  // Aucune authentification trouvée
  console.warn('🚨 AuthGuard: No authentication found');
  redirectToLogin(router, returnUrl);
  return of(false);
}

function clearInvalidAuth(authService: AuthService): void {
  console.log('🗑️ AuthGuard: Clearing invalid authentication data');
  authService.removeToken();
  authService.currentUserSubject.next(null);
}

function redirectToLogin(router: Router, returnUrl: string): void {
  // Éviter la redirection si déjà sur la page de login
  if (router.url === '/login' || router.url.includes('/login')) {
    console.log('Already on login page, skipping redirect');
    return;
  }
  
  console.log(`🔄 AuthGuard: Redirecting to login with returnUrl: ${returnUrl}`);
  router.navigate(['/login'], { 
    queryParams: { returnUrl } 
  });
}

// =============================================
// ROLE-BASED GUARDS
// =============================================

export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isInitialized$.pipe(
    filter(isInitialized => isInitialized),
    take(1),
    switchMap(() => {
      if (!authService.isAuthenticated) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      }
      
      if (!authService.hasRole('admin')) {
        console.warn('🚫 AdminGuard: Access denied - user is not admin');
        router.navigate(['/dashboard']);
        return of(false);
      }
      
      return of(true);
    })
  );
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function isAuthenticated(): boolean {
  const authService = inject(AuthService);
  return authService.isAuthenticated;
}

export function getCurrentUser() {
  const authService = inject(AuthService);
  return authService.currentUser;
}

export function hasRole(role: string): boolean {
  const authService = inject(AuthService);
  return authService.hasRole(role);
}

// =============================================
// DEBUGGING HELPERS
// =============================================

export function debugAuthState(): void {
  const authService = inject(AuthService);
  
  console.group('🔍 Auth Debug State');
  console.log('Is Authenticated:', authService.isAuthenticated);
  console.log('Is Initialized:', authService.isInitialized);
  console.log('Current User:', authService.currentUser?.name || 'None');
  console.log('Has Token:', !!authService.token);
  console.log('Stored Token:', !!authService.getStoredToken());
  console.log('Stored User:', !!authService.getStoredUser());
  console.groupEnd();
}
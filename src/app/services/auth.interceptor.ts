// src/app/services/auth.interceptor.ts - VERSION FONCTIONNELLE MISE À JOUR
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { APP_CONFIG, StorageUtils } from '@shared';
import { AuthService } from '@app/services/auth.service';

// Request tracking pour éviter les doublons
const pendingRequests = new Set<string>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Skip interception pour les requêtes non-API
  if (!isApiRequest(req)) {
    return next(req);
  }

  // Générer un ID unique pour traquer la requête
  const requestId = generateRequestId(req);
  pendingRequests.add(requestId);

  // Ajouter les headers d'authentification - CORRIGÉ
  const modifiedReq = addAuthHeaders(req, authService);
  
  return next(modifiedReq).pipe(
    retryWhen(errors => 
      errors.pipe(
        mergeMap((error, index) => {
          // Retry seulement pour les erreurs réseau ET pas d'auth
          if (error.status === 0 && index < 2 && !isAuthRequest(req)) {
            console.log(`🔄 Retry request attempt ${index + 1}`);
            return timer(1000 * (index + 1)); // Exponential backoff
          }
          throw error;
        })
      )
    ),
    catchError((error: HttpErrorResponse) => {
      return handleError(error, req, router, authService);
    }),
    finalize(() => {
      pendingRequests.delete(requestId);
    })
  );
};

// =============================================
// HELPER FUNCTIONS - CORRIGÉES
// =============================================

function isApiRequest(req: any): boolean {
  return req.url.includes('/api/') || req.url.startsWith(APP_CONFIG.API_URL);
}

function isAuthRequest(req: any): boolean {
  return req.url.includes('/auth/login') || 
         req.url.includes('/auth/register') || 
         req.url.includes('/auth/logout') ||
         req.url.includes('/auth/me');
}

function generateRequestId(req: any): string {
  return `${req.method}-${req.url}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function addAuthHeaders(req: any, authService: AuthService): any {
  // Récupérer le token depuis le service - CORRIGÉ
  const token = authService.token || authService.getStoredToken();
  
  const headers: any = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };

  // Ajouter Content-Type seulement si pas déjà défini (pour FormData)
  if (!req.headers.has('Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }

  // Ajouter le token d'authentification si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Adding auth header to request:', req.url);
  } else {
    console.log('⚠️ No token available for request:', req.url);
  }

  return req.clone({
    setHeaders: headers
  });
}

function handleError(error: HttpErrorResponse, req: any, router: Router, authService: AuthService): Observable<never> {
  console.error('🚨 HTTP Error:', {
    status: error.status,
    statusText: error.statusText,
    message: error.message,
    url: req.url,
    method: req.method
  });
  
  // Gestion spécifique par code d'erreur
  switch (error.status) {
    case 401:
      handle401Error(req, router, authService);
      break;
      
    case 403:
      handle403Error();
      break;
      
    case 404:
      handle404Error(req);
      break;
      
    case 422:
      handle422Error(error);
      break;
      
    case 429:
      handle429Error();
      break;
      
    case 500:
    case 502:
    case 503:
    case 504:
      handle5xxError(error);
      break;
      
    case 0:
      handleNetworkError(req);
      break;
      
    default:
      handleGenericError(error);
      break;
  }
  
  return throwError(() => error);
}

function handle401Error(req: any, router: Router, authService: AuthService): void {
  console.log('🔒 401 Unauthorized - Token invalid or expired');
  
  // Ne pas effacer la session pour les requêtes de login/register
  if (isAuthRequest(req)) {
    console.log('Auth request failed, not clearing session');
    return;
  }

  // Effacer les données d'authentification - CORRIGÉ
  console.log('🗑️ Clearing invalid session due to 401');
  clearAuthDataAndRedirect(router, authService);
}

function handle403Error(): void {
  console.log('🚫 403 Forbidden - Access denied');
  console.error('Accès non autorisé à cette ressource');
}

function handle404Error(req: any): void {
  console.log('🔍 404 Not Found:', req.url);
  // Ne pas afficher de notification pour les 404 API de routine
  if (!req.url.includes('/api/exercises') && !req.url.includes('/api/test')) {
    console.error('Ressource non trouvée');
  }
}

function handle422Error(error: HttpErrorResponse): void {
  console.log('📝 422 Validation Error');
  let message = 'Données invalides';

  if (error.error?.message) {
    message = error.error.message;
  } else if (error.error?.errors) {
    const validationErrors = Object.values(error.error.errors).flat();
    message = (validationErrors as string[]).join(', ');
  }

  console.error(message);
}

function handle429Error(): void {
  console.log('⏳ 429 Too Many Requests');
  console.warn('Trop de requêtes. Veuillez patienter...');
}

function handle5xxError(error: HttpErrorResponse): void {
  console.log(`🔧 ${error.status} Server Error`);
  
  const messages: { [key: number]: string } = {
    500: 'Erreur interne du serveur',
    502: 'Passerelle défaillante',
    503: 'Service indisponible',
    504: 'Délai d\'attente dépassé'
  };
  
  const message = messages[error.status] || 'Erreur serveur';
  console.error(`${message}. Veuillez réessayer plus tard.`);
}

function handleNetworkError(req: any): void {
  console.log('🌐 Network Error - No connection');

  // Ne montrer l'erreur que pour les requêtes importantes
  if (isAuthRequest(req) || req.url.includes('/api/dashboard')) {
    console.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }
}

function handleGenericError(error: HttpErrorResponse): void {
  console.log('❓ Generic Error:', error.status);
  console.error('Une erreur inattendue s\'est produite');
}

function clearAuthDataAndRedirect(router: Router, authService: AuthService): void {
  console.log('🗑️ Clearing auth data and redirecting to login');
  
  try {
    // Utiliser le service auth pour nettoyer proprement
    authService.removeToken();
    authService.currentUserSubject.next(null);
    StorageUtils.removeItem(APP_CONFIG.USER_KEY);
    
    // Rediriger vers login seulement si pas déjà sur cette page
    const currentUrl = router.url;
    if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: currentUrl }
      });
    }
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

// =============================================
// UTILITY EXPORTS pour monitoring
// =============================================

export function hasPendingRequests(): boolean {
  return pendingRequests.size > 0;
}

export function getPendingRequestsCount(): number {
  return pendingRequests.size;
}

export function clearPendingRequests(): void {
  pendingRequests.clear();
}

// Debugging helper
export function debugRequest(req: any): void {
  console.group(`🔍 Request Debug: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers.keys());
  console.log('Has Auth Header:', req.headers.has('Authorization'));
  console.log('Content-Type:', req.headers.get('Content-Type'));
  console.log('Is API Request:', isApiRequest(req));
  console.log('Is Auth Request:', isAuthRequest(req));
  console.groupEnd();
}

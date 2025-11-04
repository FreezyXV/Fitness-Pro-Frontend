import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, timeout, retry } from 'rxjs/operators';
import { APP_CONFIG, NotificationUtils } from '@shared';

export interface ApiRequestOptions {
  params?: HttpParams | Record<string, any>;
  headers?: HttpHeaders | Record<string, string>;
  body?: any;
  withCredentials?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

interface CachedResponse<T> {
  expiry: number;
  value: T;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private cache = new Map<string, CachedResponse<any>>();

  constructor(private http: HttpClient) {}

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: any, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  put<T>(path: string, body?: any, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  patch<T>(path: string, body?: any, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.request<T>('DELETE', path, options);
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheByKey(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  private request<T>(
    method: string,
    path: string,
    options: ApiRequestOptions = {}
  ): Observable<T> {
    const url = this.buildUrl(path);
    const { cacheKey, cacheTTL } = options;

    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return of(cached.value as T);
      }
    }

    const httpOptions = this.buildHttpOptions(options);
    const timeoutMs = options.timeout ?? APP_CONFIG.REQUEST_TIMEOUT;
    const retryCount = options.retry ?? 0;
    const retryDelay = options.retryDelay ?? APP_CONFIG.RETRY_DELAY;

    return this.http
      .request<T>(method, url, httpOptions)
      .pipe(
        timeout(timeoutMs),
        retry({ count: retryCount, delay: retryDelay }),
        tap((response) => {
          if (cacheKey) {
            const ttl = cacheTTL ?? 2 * 60 * 1000; // default 2 minutes
            this.cache.set(cacheKey, {
              value: response,
              expiry: Date.now() + ttl,
            });
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = APP_CONFIG.API_URL.replace(/\/$/, '');
    return `${base}/${path.replace(/^\//, '')}`;
  }

  private buildHttpOptions(options: ApiRequestOptions) {
    let params = options.params;

    if (params && !(params instanceof HttpParams)) {
      let httpParams = new HttpParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
      params = httpParams;
    }

    let headers = options.headers;

    if (headers && !(headers instanceof HttpHeaders)) {
      headers = new HttpHeaders(headers);
    }

    const mergedHeaders = headers?.keys().length
      ? headers
      : new HttpHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        });

    return {
      body: options.body,
      params,
      headers: mergedHeaders,
      withCredentials: options.withCredentials ?? false,
    } as const;
  }

  private handleError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const message =
        error.error?.message ||
        error.message ||
        'Une erreur réseau est survenue. Veuillez réessayer.';

      if (error.status >= 500) {
        NotificationUtils.error('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (error.status === 0) {
        NotificationUtils.warning('Problème de connexion réseau.');
      }

      return throwError(() => ({ ...error, message }));
    }

    return throwError(() => error);
  }
}

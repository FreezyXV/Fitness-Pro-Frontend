// Enhanced Goals Service - Complete Frontend-Backend Integration
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, delay } from 'rxjs/operators';
// Environment configuration
const environment = {
  apiUrl: 'http://localhost:8000/api'
};

// Enhanced interfaces matching backend structure
export interface Goal {
  id?: number;
  user_id?: number;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_date: string;
  status: 'not-started' | 'active' | 'completed' | 'paused';
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  created_at?: string;
  updated_at?: string;
  
  // Computed fields from backend
  progress_percentage?: number;
  is_achieved?: boolean;
  days_remaining?: number;
}

export interface GoalStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  averageProgress: number;
  currentStreak: number;
  completedThisWeek: number;
  completedThisMonth: number;
  motivationScore: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked_at?: string;
  progress?: number;
  requirement?: number;
}

export interface UserScore {
  total_points: number;
  current_streak: number;
  goals_completed: number;
  achievements_unlocked: number;
  level: number;
  next_level_points: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoalsService {
  private readonly API_URL = `${environment.apiUrl}/goals`;
  private readonly ACHIEVEMENTS_URL = `${environment.apiUrl}/achievements`;
  
  // State management
  private goalsSubject = new BehaviorSubject<Goal[]>([]);
  private statsSubject = new BehaviorSubject<GoalStats | null>(null);
  private userScoreSubject = new BehaviorSubject<UserScore | null>(null);
  private achievementsSubject = new BehaviorSubject<Achievement[]>([]);
  
  // Public observables
  public goals$ = this.goalsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public userScore$ = this.userScoreSubject.asObservable();
  public achievements$ = this.achievementsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private loadInitialData(): void {
    // Load goals, stats, and achievements on service initialization
    this.getGoals().subscribe();
    this.getUserScore().subscribe();
    this.getAchievements().subscribe();
  }

  // CRUD Operations
  getGoals(filters?: any): Observable<Goal[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.category) params = params.set('category', filters.category);
    
    return this.http.get<{success: boolean, data: Goal[], message: string}>(`${this.API_URL}`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(response => response.data || []),
      tap(goals => {
        this.goalsSubject.next(goals);
        this.calculateStats(goals);
      }),
      catchError(this.handleError)
    );
  }

  getGoal(id: number): Observable<Goal> {
    return this.http.get<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  createGoal(goal: Omit<Goal, 'id'>): Observable<Goal> {
    return this.http.post<{success: boolean, data: Goal, message: string}>(`${this.API_URL}`, goal, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(newGoal => {
        const currentGoals = this.goalsSubject.value;
        this.goalsSubject.next([newGoal, ...currentGoals]);
        this.calculateStats([newGoal, ...currentGoals]);
        this.checkAchievements();
      }),
      catchError(this.handleError)
    );
  }

  updateGoal(id: number, goal: Partial<Goal>): Observable<Goal> {
    return this.http.put<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}`, goal, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(updatedGoal => {
        const currentGoals = this.goalsSubject.value;
        const index = currentGoals.findIndex(g => g.id === id);
        if (index > -1) {
          currentGoals[index] = updatedGoal;
          this.goalsSubject.next([...currentGoals]);
          this.calculateStats(currentGoals);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => {}),
      tap(() => {
        const currentGoals = this.goalsSubject.value.filter(g => g.id !== id);
        this.goalsSubject.next(currentGoals);
        this.calculateStats(currentGoals);
      }),
      catchError(this.handleError)
    );
  }

  // Goal Actions
  updateProgress(id: number, progressValue: number): Observable<Goal> {
    return this.http.post<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}/progress`, {
      progress_value: progressValue
    }, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(updatedGoal => {
        const currentGoals = this.goalsSubject.value;
        const index = currentGoals.findIndex(g => g.id === id);
        if (index > -1) {
          const wasCompleted = currentGoals[index].status === 'completed';
          const nowCompleted = updatedGoal.status === 'completed';
          
          currentGoals[index] = updatedGoal;
          this.goalsSubject.next([...currentGoals]);
          this.calculateStats(currentGoals);
          
          // Check for new achievements and update score if goal was just completed
          if (!wasCompleted && nowCompleted) {
            this.getUserScore().subscribe(); // Refresh user score
            this.checkAchievements();
          }
        }
      }),
      catchError(this.handleError)
    );
  }

  markComplete(id: number): Observable<Goal> {
    return this.http.post<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}/complete`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(updatedGoal => {
        const currentGoals = this.goalsSubject.value;
        const index = currentGoals.findIndex(g => g.id === id);
        if (index > -1) {
          currentGoals[index] = updatedGoal;
          this.goalsSubject.next([...currentGoals]);
          this.calculateStats(currentGoals);
          this.getUserScore().subscribe(); // Refresh user score
          this.checkAchievements();
        }
      }),
      catchError(this.handleError)
    );
  }

  activateGoal(id: number): Observable<Goal> {
    return this.http.post<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}/activate`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(updatedGoal => {
        const currentGoals = this.goalsSubject.value;
        const index = currentGoals.findIndex(g => g.id === id);
        if (index > -1) {
          currentGoals[index] = updatedGoal;
          this.goalsSubject.next([...currentGoals]);
          this.calculateStats(currentGoals);
        }
      }),
      catchError(this.handleError)
    );
  }

  pauseGoal(id: number): Observable<Goal> {
    return this.http.post<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}/pause`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(updatedGoal => {
        const currentGoals = this.goalsSubject.value;
        const index = currentGoals.findIndex(g => g.id === id);
        if (index > -1) {
          currentGoals[index] = updatedGoal;
          this.goalsSubject.next([...currentGoals]);
          this.calculateStats(currentGoals);
        }
      }),
      catchError(this.handleError)
    );
  }

  resetGoalStatus(id: number): Observable<Goal> {
    return this.http.post<{success: boolean, data: Goal, message: string}>(`${this.API_URL}/${id}/reset-status`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(updatedGoal => {
        const currentGoals = this.goalsSubject.value;
        const index = currentGoals.findIndex(g => g.id === id);
        if (index > -1) {
          currentGoals[index] = updatedGoal;
          this.goalsSubject.next([...currentGoals]);
          this.calculateStats(currentGoals);
        }
      }),
      catchError(error => {
        // Fallback: if reset-status endpoint doesn't exist, use update instead
        if (error.status === 404) {
          return this.updateGoal(id, { 
            status: 'not-started',
            current_value: 0,
            progress_percentage: 0
          });
        }
        return throwError(() => error);
      })
    );
  }

  // Scoring and Achievements
  getUserScore(): Observable<UserScore> {
    return this.http.get<{success: boolean, data: UserScore, message: string}>(`${environment.apiUrl}/user/score`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      tap(score => this.userScoreSubject.next(score)),
      catchError(error => {
        console.warn('User score not available:', error);
        // Return default score if endpoint doesn't exist yet
        const defaultScore: UserScore = {
          total_points: 0,
          current_streak: 0,
          goals_completed: 0,
          achievements_unlocked: 0,
          level: 1,
          next_level_points: 100
        };
        this.userScoreSubject.next(defaultScore);
        return of(defaultScore);
      })
    );
  }

  getAchievements(): Observable<Achievement[]> {
    return this.http.get<{success: boolean, data: Achievement[], message: string}>(`${this.ACHIEVEMENTS_URL}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || []),
      tap(achievements => this.achievementsSubject.next(achievements)),
      catchError(error => {
        console.warn('Achievements not available:', error);
        this.achievementsSubject.next([]);
        return throwError(() => new Error('Achievements not available'));
      })
    );
  }

  // Utility methods
  private calculateStats(goals: Goal[]): void {
    const active = goals.filter(g => g.status === 'active');
    const completed = goals.filter(g => g.status === 'completed');
    const overdue = goals.filter(g => this.isOverdue(g));
    
    const avgProgress = active.length > 0
      ? active.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / active.length
      : 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const completedThisWeek = completed.filter(g => 
      g.created_at && new Date(g.created_at) >= oneWeekAgo
    ).length;
    
    const completedThisMonth = completed.filter(g => 
      g.created_at && new Date(g.created_at) >= oneMonthAgo
    ).length;

    const currentStreak = Math.min(active.length * 2, 30);
    const motivationScore = Math.round((avgProgress + (currentStreak * 2)) / 2);

    const stats: GoalStats = {
      total: goals.length,
      active: active.length,
      completed: completed.length,
      overdue: overdue.length,
      averageProgress: Math.round(avgProgress),
      currentStreak,
      completedThisWeek,
      completedThisMonth,
      motivationScore: Math.min(100, motivationScore)
    };

    this.statsSubject.next(stats);
  }

  private isOverdue(goal: Goal): boolean {
    if (!goal.target_date || goal.status === 'completed') return false;
    return new Date(goal.target_date) < new Date() && !goal.is_achieved;
  }

  private checkAchievements(): void {
    // Trigger achievement check on backend
    this.http.post<{success: boolean, data: any}>(`${this.ACHIEVEMENTS_URL}/check`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.warn('Achievement check not available:', error);
        return of(null);
      })
    ).subscribe();
  }

  private handleError(error: any): Observable<never> {
    console.error('GoalsService Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else if (error.status === 401) {
      errorMessage = 'Please log in to continue';
      // Could trigger logout here
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission for this action';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Helper methods for component
  getGoalsValue(): Goal[] {
    return this.goalsSubject.value;
  }

  getStatsValue(): GoalStats | null {
    return this.statsSubject.value;
  }

  getUserScoreValue(): UserScore | null {
    return this.userScoreSubject.value;
  }

  getAchievementsValue(): Achievement[] {
    return this.achievementsSubject.value;
  }

  // Export/Import functionality
  exportGoals(): Observable<Blob> {
    return this.http.get(`${this.API_URL}/export`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  importGoals(file: File): Observable<{success: boolean, message: string, imported_count: number}> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{success: boolean, message: string, imported_count: number}>(`${this.API_URL}/import`, formData, {
      headers: new HttpHeaders({
        'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
      })
    }).pipe(
      tap(() => {
        // Refresh goals after import
        this.getGoals().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  resetAllGoals(): Observable<void> {
    return this.http.post<{success: boolean, message: string}>(`${this.API_URL}/reset-all`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(() => {}),
      tap(() => {
        // After successful reset on backend, refresh goals
        this.getGoals().subscribe();
      }),
      catchError(this.handleError)
    );
  }
}
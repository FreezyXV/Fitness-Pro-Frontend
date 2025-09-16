// src/app/services/calendar.service.ts - FIXED VERSION
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import {
  CalendarTask,
  ApiResponse,
  NotificationUtils,
  APP_CONFIG,
  CalendarEventFilters,
  CalendarStats,
  MonthlyCalendarData,
  WeeklyCalendarData,
  BulkUpdateRequest
} from '../shared';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly apiUrl = APP_CONFIG.API_URL;
  private readonly calendarEndpoint = `${this.apiUrl}/calendar`;

  // State management
  private currentMonthTasksSubject = new BehaviorSubject<CalendarTask[]>([]);
  private calendarStatsSubject = new BehaviorSubject<CalendarStats | null>(
    null
  );
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public currentMonthTasks$ = this.currentMonthTasksSubject.asObservable();
  public calendarStats$ = this.calendarStatsSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Cache for better performance
  private monthlyDataCache = new Map<string, MonthlyCalendarData>();
  private statsCache = new Map<string, CalendarStats>();

  constructor(private http: HttpClient) {}

  // =============================================
  // CRUD OPERATIONS - FIXED ENDPOINTS
  // =============================================

  /**
   * Get monthly tasks via backend monthly route - FIXED
   */
  getMonthlyTasks(monthKey: string): Observable<MonthlyCalendarData> {
    // Use the correct endpoint format that matches backend
    return this.http
      .get<ApiResponse<MonthlyCalendarData>>(
        `${this.calendarEndpoint}/month/${monthKey}`
      )
      .pipe(
        map((response) => response.data || this.getEmptyMonthData(0, 0)),
        catchError((error) => {
          console.error('Error loading monthly tasks:', error);
          return of(this.getEmptyMonthData(0, 0));
        })
      );
  }

  /**
   * Get all calendar tasks with optional filters
   */
  getTasks(filters: CalendarEventFilters = {}): Observable<CalendarTask[]> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http
      .get<ApiResponse<{ data: CalendarTask[] }>>(
        `${this.calendarEndpoint}/tasks`,
        {
          params,
        }
      )
      .pipe(
        map((response) => response.data?.data || []),
        tap((tasks) => {
          console.log('Calendar tasks loaded:', tasks.length);
        }),
        catchError((error) => {
          console.error('Error loading calendar tasks:', error);
          NotificationUtils.error('Erreur lors du chargement des tâches');
          return of([]);
        })
      );
  }

  /**
   * Get a specific calendar task
   */
  getTask(id: number): Observable<CalendarTask | null> {
    return this.http
      .get<ApiResponse<CalendarTask>>(`${this.calendarEndpoint}/tasks/${id}`)
      .pipe(
        map((response) => response.data || null),
        catchError((error) => {
          console.error('Error loading calendar task:', error);
          NotificationUtils.error('Erreur lors du chargement de la tâche');
          return of(null);
        })
      );
  }

  /**
   * Create a new calendar task
   */
  createTask(taskData: Partial<CalendarTask>): Observable<CalendarTask | null> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<ApiResponse<CalendarTask>>(
        `${this.calendarEndpoint}/tasks`,
        taskData
      )
      .pipe(
        map((response) => response.data || null),
        tap((task) => {
          if (task) {
            this.updateCurrentMonthTasks(task, 'create');
            this.invalidateCache();
            NotificationUtils.success('Tâche créée avec succès');
          }
        }),
        catchError((error) => {
          console.error('Error creating calendar task:', error);
          NotificationUtils.error('Erreur lors de la création de la tâche');
          return of(null);
        }),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Update an existing calendar task
   */
  updateTask(
    id: number,
    taskData: Partial<CalendarTask>
  ): Observable<CalendarTask | null> {
    this.isLoadingSubject.next(true);

    return this.http
      .put<ApiResponse<CalendarTask>>(
        `${this.calendarEndpoint}/tasks/${id}`,
        taskData
      )
      .pipe(
        map((response) => response.data || null),
        tap((task) => {
          if (task) {
            this.updateCurrentMonthTasks(task, 'update');
            this.invalidateCache();
            NotificationUtils.success('Tâche mise à jour avec succès');
          }
        }),
        catchError((error) => {
          console.error('Error updating calendar task:', error);
          NotificationUtils.error('Erreur lors de la mise à jour de la tâche');
          return of(null);
        }),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Delete a calendar task
   */
  deleteTask(id: number): Observable<boolean> {
    this.isLoadingSubject.next(true);

    return this.http
      .delete<ApiResponse<void>>(`${this.calendarEndpoint}/tasks/${id}`)
      .pipe(
        map((response) => response.success),
        tap((success) => {
          if (success) {
            this.updateCurrentMonthTasks({ id } as CalendarTask, 'delete');
            this.invalidateCache();
            NotificationUtils.success('Tâche supprimée avec succès');
          }
        }),
        catchError((error) => {
          console.error('Error deleting calendar task:', error);
          NotificationUtils.error('Erreur lors de la suppression de la tâche');
          return of(false);
        }),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  // =============================================
  // SPECIALIZED QUERIES - FIXED ENDPOINTS
  // =============================================

  /**
   * Get tasks for a specific month
   */
  getMonthTasks(year: number, month: number): Observable<MonthlyCalendarData> {
    const cacheKey = `${year}-${month.toString().padStart(2, '0')}`;

    // Check cache first
    if (this.monthlyDataCache.has(cacheKey)) {
      const cachedData = this.monthlyDataCache.get(cacheKey)!;
      this.currentMonthTasksSubject.next(cachedData.tasks);
      return of(cachedData);
    }

    this.isLoadingSubject.next(true);

    return this.http
      .get<ApiResponse<MonthlyCalendarData>>(
        `${this.calendarEndpoint}/month/${cacheKey}`
      )
      .pipe(
        map((response) => response.data || this.getEmptyMonthData(year, month)),
        tap((data) => {
          this.monthlyDataCache.set(cacheKey, data);
          this.currentMonthTasksSubject.next(data.tasks);
          console.log(
            `Monthly data loaded for ${cacheKey}:`,
            data.tasks.length,
            'tasks'
          );
        }),
        catchError((error) => {
          console.error('Error loading monthly tasks:', error);
          NotificationUtils.error(
            'Erreur lors du chargement des tâches du mois'
          );
          return of(this.getEmptyMonthData(year, month));
        }),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Get today's tasks
   */
  getTodayTasks(): Observable<{ tasks: CalendarTask[]; stats: any }> {
    return this.http
      .get<ApiResponse<{ tasks: CalendarTask[]; stats: any }>>(
        `${this.calendarEndpoint}/today`
      )
      .pipe(
        map((response) => response.data || { tasks: [], stats: {} }),
        catchError((error) => {
          console.error("Error loading today's tasks:", error);
          NotificationUtils.error(
            'Erreur lors du chargement des tâches du jour'
          );
          return of({ tasks: [], stats: {} });
        })
      );
  }

  /**
   * Get this week's tasks
   */
  getWeekTasks(): Observable<WeeklyCalendarData> {
    return this.http
      .get<ApiResponse<WeeklyCalendarData>>(`${this.calendarEndpoint}/week`)
      .pipe(
        map((response) => response.data || this.getEmptyWeekData()),
        catchError((error) => {
          console.error('Error loading week tasks:', error);
          NotificationUtils.error(
            'Erreur lors du chargement des tâches de la semaine'
          );
          return of(this.getEmptyWeekData());
        })
      );
  }

  // =============================================
  // TASK ACTIONS - FIXED ENDPOINTS
  // =============================================

  /**
   * Mark a task as completed
   */
  markTaskComplete(id: number): Observable<CalendarTask | null> {
    return this.http
      .post<ApiResponse<CalendarTask>>(
        `${this.calendarEndpoint}/tasks/${id}/complete`,
        {}
      )
      .pipe(
        map((response) => response.data || null),
        tap((task) => {
          if (task) {
            this.updateCurrentMonthTasks(task, 'update');
            this.invalidateStatsCache();
            NotificationUtils.success('Tâche marquée comme terminée');
          }
        }),
        catchError((error) => {
          console.error('Error marking task as complete:', error);
          NotificationUtils.error('Erreur lors du marquage de la tâche');
          return of(null);
        })
      );
  }

  /**
   * Mark a task as incomplete
   */
  markTaskIncomplete(id: number): Observable<CalendarTask | null> {
    return this.http
      .post<ApiResponse<CalendarTask>>(
        `${this.calendarEndpoint}/tasks/${id}/incomplete`,
        {}
      )
      .pipe(
        map((response) => response.data || null),
        tap((task) => {
          if (task) {
            this.updateCurrentMonthTasks(task, 'update');
            this.invalidateStatsCache();
            NotificationUtils.success('Tâche marquée comme non terminée');
          }
        }),
        catchError((error) => {
          console.error('Error marking task as incomplete:', error);
          NotificationUtils.error('Erreur lors du marquage de la tâche');
          return of(null);
        })
      );
  }

  /**
   * Toggle task completion status
   */
  toggleTaskCompletion(task: CalendarTask): Observable<CalendarTask | null> {
    return task.isCompleted
      ? this.markTaskIncomplete(task.id!)
      : this.markTaskComplete(task.id!);
  }

  /**
   * Bulk update tasks
   */
  bulkUpdateTasks(
    request: BulkUpdateRequest
  ): Observable<{ updated_count: number; action: string }> {
    this.isLoadingSubject.next(true);

    return this.http
      .post<ApiResponse<{ updated_count: number; action: string }>>(
        `${this.calendarEndpoint}/tasks/bulk`,
        request
      )
      .pipe(
        map(
          (response) =>
            response.data || { updated_count: 0, action: request.action }
        ),
        tap((result) => {
          this.invalidateCache();
          NotificationUtils.success(
            `${result.updated_count} tâche(s) mise(s) à jour avec succès`
          );
        }),
        catchError((error) => {
          console.error('Error performing bulk update:', error);
          NotificationUtils.error('Erreur lors de la mise à jour en masse');
          return of({ updated_count: 0, action: request.action });
        }),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  // =============================================
  // STATISTICS - FIXED ENDPOINTS
  // =============================================

  /**
   * Get calendar statistics
   */
  getCalendarStats(
    period: 'month' | 'year' | 'all' = 'month'
  ): Observable<CalendarStats> {
    const cacheKey = `stats-${period}`;

    // Check cache first
    if (this.statsCache.has(cacheKey)) {
      const cachedStats = this.statsCache.get(cacheKey)!;
      this.calendarStatsSubject.next(cachedStats);
      return of(cachedStats);
    }

    let params = new HttpParams().set('period', period);

    return this.http
      .get<ApiResponse<CalendarStats>>(`${this.calendarEndpoint}/stats`, {
        params,
      })
      .pipe(
        map((response) => response.data || this.getEmptyStats()),
        tap((stats) => {
          this.statsCache.set(cacheKey, stats);
          this.calendarStatsSubject.next(stats);
        }),
        catchError((error) => {
          console.error('Error loading calendar stats:', error);
          NotificationUtils.error('Erreur lors du chargement des statistiques');
          return of(this.getEmptyStats());
        })
      );
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get task types for filtering
   */
  getTaskTypes(): Array<{
    value: string;
    label: string;
    icon: string;
    color: string;
  }> {
    return [
      { value: 'workout', label: 'Entraînement', icon: '💪', color: '#21BF73' },
      { value: 'goal', label: 'Objectif', icon: '🎯', color: '#667eea' },
      { value: 'rest', label: 'Repos', icon: '😴', color: '#f093fb' },
      { value: 'nutrition', label: 'Nutrition', icon: '🍎', color: '#ff6b35' },
      { value: 'other', label: 'Autre', icon: '📝', color: '#64748b' },
    ];
  }

  /**
   * Get priority levels
   */
  getPriorityLevels(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'high', label: 'Haute', color: '#ef4444' },
      { value: 'medium', label: 'Moyenne', color: '#f59e0b' },
      { value: 'low', label: 'Basse', color: '#10b981' },
    ];
  }

  /**
   * Format task for display
   */
  formatTaskForDisplay(task: CalendarTask): any {
    return {
      ...task,
      formattedDate: new Date(task.taskDate).toLocaleDateString('fr-FR'),
      formattedTime: task.reminderTime
        ? new Date(task.reminderTime).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : null,
      typeLabel:
        this.getTaskTypes().find((t) => t.value === task.taskType)?.label ||
        'Autre',
      typeIcon:
        this.getTaskTypes().find((t) => t.value === task.taskType)?.icon ||
        '📝',
      typeColor:
        this.getTaskTypes().find((t) => t.value === task.taskType)?.color ||
        '#64748b',
      priorityLabel:
        this.getPriorityLevels().find((p) => p.value === task.priority)
          ?.label || 'Moyenne',
      priorityColor:
        this.getPriorityLevels().find((p) => p.value === task.priority)
          ?.color || '#f59e0b',
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.monthlyDataCache.clear();
    this.statsCache.clear();
    console.log('Calendar cache cleared');
  }

  /**
   * Refresh current month data
   */
  refreshCurrentMonth(): Observable<MonthlyCalendarData> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Clear cache for current month
    const cacheKey = `${year}-${month.toString().padStart(2, '0')}`;
    this.monthlyDataCache.delete(cacheKey);

    return this.getMonthTasks(year, month);
  }

  /**
   * Get tasks for date range
   */
  getTasksForDateRange(
    startDate: string,
    endDate: string
  ): Observable<CalendarTask[]> {
    return this.getTasks({
      dateFrom: startDate,
      dateTo: endDate,
    });
  }

  /**
   * Search tasks by title
   */
  searchTasks(query: string): Observable<CalendarTask[]> {
    return this.getTasks().pipe(
      map((tasks) =>
        tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            (task.description &&
              task.description.toLowerCase().includes(query.toLowerCase()))
        )
      )
    );
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  private updateCurrentMonthTasks(
    task: CalendarTask,
    action: 'create' | 'update' | 'delete'
  ): void {
    const currentTasks = this.currentMonthTasksSubject.value;

    switch (action) {
      case 'create':
        this.currentMonthTasksSubject.next([...currentTasks, task]);
        break;

      case 'update':
        const updateIndex = currentTasks.findIndex((t) => t.id === task.id);
        if (updateIndex !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[updateIndex] = task;
          this.currentMonthTasksSubject.next(updatedTasks);
        }
        break;

      case 'delete':
        this.currentMonthTasksSubject.next(
          currentTasks.filter((t) => t.id !== task.id)
        );
        break;
    }
  }

  private invalidateCache(): void {
    this.monthlyDataCache.clear();
    this.statsCache.clear();
  }

  private invalidateStatsCache(): void {
    this.statsCache.clear();
  }

  private getEmptyMonthData(year: number, month: number): MonthlyCalendarData {
    return {
      tasks: [],
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionRate: 0,
        totalWorkouts: 0,
        totalWorkoutHours: 0,
        tasksByType: {
          workout: 0,
          goal: 0,
          rest: 0,
          nutrition: 0,
          other: 0,
        },
        tasksByPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
      },
      month,
      year,
    };
  }

  private getEmptyWeekData(): WeeklyCalendarData {
    return {
      tasks: [],
      tasksByDay: {},
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionRate: 0,
        workouts: 0,
        goals: 0,
        daysWithTasks: 0,
      },
      weekStart: new Date().toISOString().split('T')[0],
      weekEnd: new Date().toISOString().split('T')[0],
    };
  }
  private getEmptyStats(): CalendarStats {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      tasksByType: {
        workout: 0,
        goal: 0,
        rest: 0,
        nutrition: 0,
        other: 0,
      },
      tasksByPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }
}
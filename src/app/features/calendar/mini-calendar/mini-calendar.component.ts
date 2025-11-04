// src/app/calendar/mini-calendar/mini-calendar.component.ts - FIXED VERSION
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, debounceTime } from 'rxjs/operators';

// Import interfaces from shared
import { CalendarTask, Workout, Goal, DateUtils } from '@shared';

interface CalendarActivity {
  id?: number;
  icon: string;
  title: string;
  time?: string;
  duration?: number;
  type: 'workout' | 'goal' | 'rest' | 'nutrition' | 'other';
  completed?: boolean;
  data?: any;
}

interface CalendarDay {
  date: number;
  fullDate: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  hasWorkout: boolean;
  hasGoal: boolean;
  hasRest: boolean;
  workoutCount: number;
  goalCount: number;
  completionRate: number;
  activities: CalendarActivity[];
}

interface DayStats {
  workouts: number;
  calories: number;
  duration: number;
}

@Component({
  selector: 'app-mini-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mini-calendar.component.html',
  styleUrls: ['./mini-calendar.component.scss']
})
export class MiniCalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Inputs and outputs
  @Input() showQuickActions = true;
  @Input() showActivityDetails = true;
  @Input() maxHeight = '400px';
  @Input() highlightToday = true;
  @Output() daySelected = new EventEmitter<Date>();
  @Output() activityClicked = new EventEmitter<CalendarActivity>();
  @Output() scheduleRequested = new EventEmitter<Date>();

  // Calendar state
  currentDate = new Date();
  selectedDay: CalendarDay | null = null;
  calendarDays: CalendarDay[] = [];
  
  // UI state
  isLoading = false;
  isNavigating = false;
  error: string | null = null;
  showMonthPickerModal = false;

  // Data - using mock data since services might not be available
  tasks: CalendarTask[] = [];
  workoutSessions: Workout[] = []; // Changed to Workout[]
  goals: Goal[] = [];

  // Constants
  readonly daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  readonly monthList = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('📅 Mini Calendar initialized');
    this.loadMockCalendarData();
    this.buildCalendar();
    this.selectTodayIfCurrent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Computed properties
  get currentMonth(): string {
    return this.monthList[this.currentDate.getMonth()];
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  // Data loading - FIXED to not depend on external services
  private loadMockCalendarData(): void {
    console.log('📊 Loading mock calendar data...');
    
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const yesterday = new Date(today.getTime() - 86400000);
    
    // Mock calendar tasks
    this.tasks = [
      {
        id: 1,
        userId: 1,
        title: 'Entraînement HIIT',
        taskDate: today.toISOString().split('T')[0],
        taskType: 'workout',
        isCompleted: false,
        reminderTime: '09:00',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      },
      {
        id: 2,
        userId: 1,
        title: 'Objectif: 10000 pas',
        taskDate: tomorrow.toISOString().split('T')[0],
        taskType: 'goal',
        isCompleted: false,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      },
      {
        id: 3,
        userId: 1,
        title: 'Jour de repos',
        taskDate: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0],
        taskType: 'rest',
        isCompleted: false,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      }
    ];

    // Mock workout sessions
    this.workoutSessions = [
      {
        id: 1,
        userId: 1,
        name: 'Musculation',
        durationMinutes: 60,
        caloriesBurned: 350,
        status: 'completed',
        completedAt: yesterday.toISOString(),
        isTemplate: false,
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString()
      },
      {
        id: 2,
        userId: 1,
        name: 'Cardio',
        durationMinutes: 30,
        caloriesBurned: 200,
        status: 'completed',
        completedAt: today.toISOString(),
        isTemplate: false,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      }
    ];

    // Mock goals
    this.goals = [
      {
        id: 1,
        userId: 1,
        title: 'Perdre 5kg',
        targetValue: 5,
        currentValue: 2,
        unit: 'kg',
        targetDate: new Date(today.getTime() + 30 * 86400000).toISOString(),
        status: 'active',
        createdAt: today.toISOString(),
        updatedAt: today.toISOString()
      }
    ];

    this.isLoading = false;
    console.log('✅ Mock calendar data loaded');
  }

  // Calendar building
  private buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - dayOfWeek);
    
    this.calendarDays = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const calendarDay = this.createCalendarDay(date, month, today);
      this.calendarDays.push(calendarDay);
    }

    console.log('📅 Calendar built with', this.calendarDays.length, 'days');
  }

  private createCalendarDay(date: Date, currentMonth: number, today: Date): CalendarDay {
    const activities = this.getActivitiesForDate(date);

    return {
      date: date.getDate(),
      fullDate: new Date(date),
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: DateUtils.isSameDay(date, today),
      isSelected: this.selectedDay ? DateUtils.isSameDay(date, this.selectedDay.fullDate) : false,
      isDisabled: date < new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90),
      hasWorkout: activities.some(a => a.type === 'workout'),
      hasGoal: activities.some(a => a.type === 'goal'),
      hasRest: activities.some(a => a.type === 'rest'),
      workoutCount: activities.filter(a => a.type === 'workout').length,
      goalCount: activities.filter(a => a.type === 'goal').length,
      completionRate: this.calculateCompletionRate(activities),
      activities
    };
  }

  private getActivitiesForDate(date: Date): CalendarActivity[] {
    const activities: CalendarActivity[] = [];
    const dateStr = date.toISOString().split('T')[0];

    // Add calendar tasks
    this.tasks.forEach(task => {
      if (task.taskDate.startsWith(dateStr)) {
        activities.push({
          id: task.id,
          icon: this.getTaskIcon(task.taskType),
          title: task.title,
          time: task.reminderTime,
          type: task.taskType as any,
          completed: task.isCompleted,
          data: task
        });
      }
    });

    // Add workout sessions
    this.workoutSessions.forEach(session => {
      // Ensure completed_at is a string before passing to new Date()
      const sessionDate = new Date(session.completedAt || session.createdAt || '');
      if (DateUtils.isSameDay(sessionDate, date)) {
        activities.push({
          id: session.id,
          icon: '💪',
          title: session.name || 'Workout Session', // Use name property
          duration: session.durationMinutes,
          type: 'workout',
          completed: session.status === 'completed',
          data: session
        });
      }
    });

    // Add goals with target dates
    this.goals.forEach(goal => {
      // Ensure target_date is a string before passing to new Date()
      const targetDate = goal.targetDate ? new Date(goal.targetDate) : new Date();
      if (DateUtils.isSameDay(targetDate, date)) {
        activities.push({
          id: goal.id,
          icon: '🎯',
          title: `Objectif: ${goal.title}`,
          type: 'goal',
          completed: goal.status === 'completed',
          data: goal
        });
      }
    });

    return activities.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }

  private getTaskIcon(taskType: string): string {
    const icons = {
      workout: '💪',
      goal: '🎯',
      rest: '😴',
      nutrition: '🍎',
      reminder: '⏰'
    };
    return icons[taskType as keyof typeof icons] || '📅';
  }

  private calculateCompletionRate(activities: CalendarActivity[]): number {
    if (activities.length === 0) return 0;
    const completed = activities.filter(a => a.completed).length;
    return Math.round((completed / activities.length) * 100);
  }

  // Navigation - FIXED
  previousMonth(): void {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.selectedDay = null;
    
    setTimeout(() => {
      this.buildCalendar();
      this.isNavigating = false;
      this.cdr.detectChanges();
    }, 100);
  }

  nextMonth(): void {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.selectedDay = null;
    
    setTimeout(() => {
      this.buildCalendar();
      this.isNavigating = false;
      this.cdr.detectChanges();
    }, 100);
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDay = null;
    this.buildCalendar();
    
    setTimeout(() => {
      this.selectTodayIfCurrent();
    }, 100);
  }

  private selectTodayIfCurrent(): void {
    if (!this.highlightToday) return;
    
    const today = new Date();
    const todayDay = this.calendarDays.find(day => 
      day.isToday && day.isCurrentMonth
    );
    
    if (todayDay) {
      this.selectDay(todayDay);
    }
  }

  // Day selection
  selectDay(day: CalendarDay): void {
    if (day.isDisabled) return;

    this.calendarDays.forEach(d => d.isSelected = false);
    day.isSelected = true;
    this.selectedDay = day;

    this.daySelected.emit(new Date(day.fullDate));
    this.cdr.detectChanges();
  }

  // Month picker
  showMonthPicker(): void {
    this.showMonthPickerModal = true;
  }

  hideMonthPicker(): void {
    this.showMonthPickerModal = false;
  }

  selectMonth(monthIndex: number): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), monthIndex, 1);
    this.selectedDay = null;
    this.hideMonthPicker();
    this.buildCalendar();
  }

  // Actions
  scheduleWorkout(): void {
    const targetDate = this.selectedDay?.fullDate || new Date();
    this.scheduleRequested.emit(targetDate);
  }

  toggleActivityComplete(activity: CalendarActivity): void {
    if (!activity.id) return;

    activity.completed = !activity.completed;
    
    // Update completion rate for the day
    if (this.selectedDay) {
      this.selectedDay.completionRate = this.calculateCompletionRate(this.selectedDay.activities);
    }

    console.log('📝 Activity completion toggled:', activity.title, activity.completed);
    this.cdr.detectChanges();
  }

  // Utility methods
  hasActivities(day: CalendarDay): boolean {
    return day.hasWorkout || day.hasGoal || day.hasRest;
  }

  isToday(date?: Date): boolean {
    if (!date) return false;
    return DateUtils.isToday(date);
  }

  getDayAriaLabel(day: CalendarDay): string {
    let label = day.fullDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    if (day.isToday) {
      label += ' (aujourd\'hui)';
    }

    if (day.activities.length > 0) {
      label += `, ${day.activities.length} activité${day.activities.length > 1 ? 's' : ''}`;
    }

    return label;
  }

  getSelectedDateText(): string {
    if (!this.selectedDay) return '';
    
    return this.selectedDay.fullDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getDayStats(day: CalendarDay): DayStats {
    let calories = 0;
    let duration = 0;
    const workouts = day.activities.filter(a => a.type === 'workout').length;

    day.activities.forEach(activity => {
      if (activity.type === 'workout' && activity.data) {
        calories += activity.data.calories_burned || 0;
        duration += activity.duration || 0;
      }
    });

    return { workouts, calories, duration };
  }

  retryLoad(): void {
    this.error = null;
    this.loadMockCalendarData();
    this.buildCalendar();
  }

  // Track by functions for performance
  trackByDay(index: number, day: CalendarDay): string {
    return `${day.fullDate.getTime()}-${day.isSelected}-${day.completionRate}`;
  }

  trackByActivity(index: number, activity: CalendarActivity): string {
    return `${activity.id || index}-${activity.type}-${activity.completed}`;
  }
}

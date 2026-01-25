// Enhanced Calendar Component with Improved UX/UI
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations';

// Mock interfaces for standalone functionality
interface CalendarTask {
  id: number | string;
  user_id: number;
  created_at: string;
  updated_at: string;
  title: string;
  task_type: 'workout' | 'goal' | 'rest' | 'nutrition' | 'meal' | 'reminder' | 'other';
  task_date: string;
  reminder_time?: string;
  duration?: number;
  description?: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  workout_plan_id?: number;
}

interface CalendarDay {
  date: Date;
  events: CalendarTask[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  completionPercentage: number;
}

interface MonthStats {
  totalWorkouts: number;
  totalHours: number;
  completionRate: number;
  totalEvents: number;
  completedEvents: number;
}

interface Workout {
  id: number;
  name: string;
  duration_minutes: number;
  difficulty?: string;
}

// Event Type Colors and Icons
const EVENT_META: Record<CalendarTask['task_type'], {
  color: string;
  icon: string;
}> = {
  workout: { color: '#21BF73', icon: '💪' },
  goal: { color: '#667eea', icon: '🎯' },
  rest: { color: '#f093fb', icon: '😴' },
  nutrition: { color: '#ff6b35', icon: '🍎' },
  meal: { color: '#FFD700', icon: '🍽️' },
  reminder: { color: '#8A2BE2', icon: '⏰' },
  other: { color: '#64748b', icon: '📝' }
};


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate(
          '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'scale(1)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ transform: 'scale(0.9)', opacity: 0 })),
      ]),
    ]),
    trigger('overlayAnimation', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', [
        animate('0.4s ease-out')
      ]),
      transition('* => void', [
        animate('0.3s ease-in')
      ])
    ])
  ]
})
export class CalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Calendar state
  currentDate = new Date();
  selectedDate = new Date();
  currentView: 'month' | 'week' | 'day' = 'month';
  
  // Calendar data
  monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  calendarDays: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  
  // UI state
  showEventModal = false;
  isEditingEvent = false;
  currentEvent: CalendarTask | null = null;
  isSaving = false;
  isLoading = false;
  draggedEvent: CalendarTask | null = null;
  
  // Forms
  eventForm!: FormGroup;
  
  // Data
  events: CalendarTask[] = [];
  workoutPlans: Workout[] = [];
  
  // Stats
  monthStats: MonthStats = {
    totalWorkouts: 0,
    totalHours: 0,
    completionRate: 0,
    totalEvents: 0,
    completedEvents: 0
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
    this.generateMockData();
  }

  ngOnInit(): void {
    this.loadData();
    this.buildCalendarViews();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    if (this.showEventModal) {
      this.closeEventModal();
    }
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private initializeForm(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      task_type: ['workout', Validators.required],
      task_date: [this.formatDateForInput(new Date()), Validators.required],
      reminder_time: [''],
      duration: [60, [Validators.min(5), Validators.max(480)]],
      description: [''],
      tags: [[]],
      workout_plan_id: [''],
      priority: ['medium']
    });
  }

  private generateMockData(): void {
    const today = new Date();
    const mockEvents: CalendarTask[] = [
      {
        id: 1,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Entraînement HIIT Matinal',
        task_type: 'workout',
        task_date: today.toISOString().split('T')[0],
        reminder_time: '07:00',
        duration: 45,
        description: 'Séance d\'entraînement haute intensité pour commencer la journée',
        is_completed: false,
        priority: 'high'
      },
      {
        id: 2,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Objectif: 10,000 pas',
        task_type: 'goal',
        task_date: today.toISOString().split('T')[0],
        description: 'Marcher 10,000 pas aujourd\'hui',
        is_completed: true,
        priority: 'medium'
      },
      {
        id: 3,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Musculation - Haut du corps',
        task_type: 'workout',
        task_date: this.addDays(today, 1).toISOString().split('T')[0],
        reminder_time: '18:00',
        duration: 75,
        description: 'Séance de musculation ciblée haut du corps',
        is_completed: false,
        priority: 'high'
      },
      {
        id: 4,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Jour de repos actif',
        task_type: 'rest',
        task_date: this.addDays(today, 2).toISOString().split('T')[0],
        description: 'Récupération active avec étirements et mobilité',
        is_completed: false,
        priority: 'medium'
      },
      {
        id: 5,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Prep meal hebdomadaire',
        task_type: 'nutrition',
        task_date: this.addDays(today, 3).toISOString().split('T')[0],
        reminder_time: '14:00',
        duration: 120,
        description: 'Préparation des repas pour la semaine',
        is_completed: false,
        priority: 'medium'
      },
      {
        id: 6,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Cardio Course',
        task_type: 'workout',
        task_date: this.addDays(today, 4).toISOString().split('T')[0],
        reminder_time: '06:30',
        duration: 30,
        description: 'Course matinale dans le parc',
        is_completed: false,
        priority: 'medium'
      },
      {
        id: 7,
        user_id: 1,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        title: 'Yoga & Étirements',
        task_type: 'rest',
        task_date: this.addDays(today, 5).toISOString().split('T')[0],
        reminder_time: '19:00',
        duration: 45,
        description: 'Séance de yoga pour la détente et la flexibilité',
        is_completed: true,
        priority: 'low'
      }
    ];

    this.events = mockEvents;

    // Mock workout plans
    this.workoutPlans = [
      { id: 1, name: 'HIIT Débutant', duration_minutes: 30, difficulty: 'Facile' },
      { id: 2, name: 'Musculation Full Body', duration_minutes: 60, difficulty: 'Intermédiaire' },
      { id: 3, name: 'Cardio Intensif', duration_minutes: 45, difficulty: 'Difficile' },
      { id: 4, name: 'Yoga Flow', duration_minutes: 30, difficulty: 'Facile' },
      { id: 5, name: 'CrossFit WOD', duration_minutes: 50, difficulty: 'Difficile' }
    ];
  }

  private loadData(): void {
    this.isLoading = true;
    // Simulate API loading
    setTimeout(() => {
      this.calculateStats();
      this.buildCalendarViews();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }

  // =============================================
  // CALENDAR BUILDING
  // =============================================

  private buildCalendarViews(): void {
    this.buildMonthView();
    this.buildWeekView();
  }

  private buildMonthView(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const startDate = new Date(year, month, 1 - startDayOffset);

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      this.calendarDays.push(this.createCalendarDay(date, month));
    }
  }

  private buildWeekView(): void {
    const start = this.getMonday(this.currentDate);
    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      this.weekDays.push(this.createCalendarDay(date, this.currentDate.getMonth()));
    }
  }

  private createCalendarDay(date: Date, currentMonth: number): CalendarDay {
    const events = this.getEventsForDate(date);
    const completionPercentage = this.calculateDayCompletionPercentage(events);

    return {
      date,
      events,
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: this.isSameDate(date, new Date()),
      isSelected: this.isSameDate(date, this.selectedDate),
      completionPercentage
    };
  }

  private getEventsForDate(date: Date): CalendarTask[] {
    return this.events.filter(event => 
      this.isSameDate(new Date(event.task_date), date)
    );
  }

  private calculateDayCompletionPercentage(events: CalendarTask[]): number {
    if (events.length === 0) return 0;
    const completedEvents = events.filter(e => e.is_completed).length;
    return Math.round((completedEvents / events.length) * 100);
  }

  // =============================================
  // NAVIGATION
  // =============================================

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendarViews();
    this.calculateStats();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendarViews();
    this.calculateStats();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.buildCalendarViews();
    this.calculateStats();
  }

  changeView(view: 'month' | 'week' | 'day'): void {
    this.currentView = view;
    this.buildCalendarViews();
  }

  selectDate(day: CalendarDay): void {
    this.selectedDate = new Date(day.date);
    this.buildCalendarViews();
  }

  // =============================================
  // EVENT MANAGEMENT
  // =============================================

  addNewEvent(): void {
    this.isEditingEvent = false;
    this.currentEvent = null;
    this.resetEventForm();
    this.eventForm.patchValue({
      task_date: this.formatDateForInput(this.selectedDate),
      reminder_time: this.getDefaultTime()
    });
    this.showEventModal = true;
  }

  editEvent(event: CalendarTask, e?: Event): void {
    if (e) {
      e.stopPropagation();
    }
    
    this.isEditingEvent = true;
    this.currentEvent = event;
    this.populateEventForm(event);
    this.showEventModal = true;
  }

  saveEvent(): void {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    this.isSaving = true;
    const formValue = this.eventForm.value;
    
    // Simulate API call delay
    setTimeout(() => {
      if (this.isEditingEvent && this.currentEvent) {
        this.updateEvent(formValue);
      } else {
        this.createEvent(formValue);
      }
      
      this.handleSaveSuccess(
        this.isEditingEvent ? 'Événement mis à jour avec succès' : 'Événement créé avec succès'
      );
    }, 800);
  }

  private createEvent(formValue: any): void {
    const newEvent: CalendarTask = {
      id: Date.now(),
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: formValue.title,
      task_type: formValue.task_type,
      task_date: formValue.task_date,
      reminder_time: formValue.reminder_time,
      duration: formValue.duration,
      description: formValue.description,
      is_completed: false,
      priority: formValue.priority,
      tags: formValue.tags || [],
      workout_plan_id: formValue.workout_plan_id
    };

    this.events.push(newEvent);
    this.buildCalendarViews();
    this.calculateStats();
  }

  private updateEvent(formValue: any): void {
    if (this.currentEvent) {
      const index = this.events.findIndex(e => e.id === this.currentEvent!.id);
      if (index !== -1) {
        this.events[index] = {
          ...this.events[index],
          title: formValue.title,
          task_type: formValue.task_type,
          task_date: formValue.task_date,
          reminder_time: formValue.reminder_time,
          duration: formValue.duration,
          description: formValue.description,
          priority: formValue.priority,
          updated_at: new Date().toISOString()
        };

        this.buildCalendarViews();
        this.calculateStats();
      }
    }
  }

  deleteEvent(eventId: number | string): void {
    this.events = this.events.filter(e => e.id !== eventId);
    this.buildCalendarViews();
    this.calculateStats();
  }

  toggleEventComplete(event: CalendarTask, e?: Event): void {
    if (e) {
      e.stopPropagation();
    }

    event.is_completed = !event.is_completed;
    event.updated_at = new Date().toISOString();

    this.buildCalendarViews();
    this.calculateStats();
  }

  closeEventModal(): void {
    this.showEventModal = false;
    this.currentEvent = null;
    this.resetEventForm();
    this.isSaving = false;
  }

  private handleSaveSuccess(message: string): void {
    this.isSaving = false;
    this.closeEventModal();
  }

  // =============================================
  // DRAG AND DROP
  // =============================================

  onDragStart(event: DragEvent, calendarEvent: CalendarTask): void {
    this.draggedEvent = calendarEvent;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, day: CalendarDay): void {
    event.preventDefault();
    
    if (this.draggedEvent && !this.isSameDate(new Date(this.draggedEvent.task_date), day.date)) {
      this.moveEventToDate(this.draggedEvent, day.date);
    }
    
    this.draggedEvent = null;
  }

  private moveEventToDate(event: CalendarTask, newDate: Date): void {
    event.task_date = newDate.toISOString().split('T')[0];
    event.updated_at = new Date().toISOString();

    this.buildCalendarViews();
  }

  createEventAtTime(day: { date: Date }, hour: number): void {
    this.selectedDate = day.date;
    this.eventForm.patchValue({
      task_date: this.formatDateForInput(this.selectedDate),
      reminder_time: `${hour.toString().padStart(2, '0')}:00`
    });
    this.addNewEvent();
  }

  // =============================================
  // STATISTICS
  // =============================================

  private calculateStats(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthEvents = this.events.filter(e => {
      const eventDate = new Date(e.task_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    const workoutEvents = monthEvents.filter(e => e.task_type === 'workout');
    const completedEvents = monthEvents.filter(e => e.is_completed);
    const totalMinutes = workoutEvents.reduce((sum, e) => sum + (e.duration || 0), 0);

    this.monthStats = {
      totalWorkouts: workoutEvents.length,
      totalHours: Math.round(totalMinutes / 60),
      completionRate: monthEvents.length > 0 
        ? Math.round((completedEvents.length / monthEvents.length) * 100)
        : 0,
      totalEvents: monthEvents.length,
      completedEvents: completedEvents.length
    };
  }

  getDayCompletionPercentage(day: CalendarDay): number {
    return day.completionPercentage;
  }

  // =============================================
  // VIEW HELPERS
  // =============================================

  getWeekDays(): CalendarDay[] {
    return this.weekDays;
  }

  getSelectedDateEvents(): CalendarTask[] {
    return this.getEventsForDate(this.selectedDate);
  }

  getCompletedEventsCount(): number {
    return this.getSelectedDateEvents().filter(e => e.is_completed).length;
  }

  getEventsForDayAndHour(hour: number): CalendarTask[] {
    const selectedDateEvents = this.getSelectedDateEvents();
    
    return selectedDateEvents.filter(event => {
      if (!event.reminder_time) return false;
      
      try {
        let eventHour: number;
        
        if (event.reminder_time.includes(':')) {
          eventHour = parseInt(event.reminder_time.split(':')[0], 10);
        } else {
          return false;
        }
        
        return eventHour === hour;
      } catch (error) {
        return false;
      }
    });
  }

  isCurrentHour(hour: number): boolean {
    const now = new Date();
    return now.getHours() === hour && this.isSameDate(now, this.selectedDate);
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  formatSelectedDate(): string {
    return new Intl.DateTimeFormat('fr-FR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(this.selectedDate);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  }

  formatTime(time?: string): string {
    if (!time) return '';
    
    try {
      if (time.includes(':')) {
        return time.substring(0, 5); // Return HH:MM format
      }
      return time;
    } catch (error) {
      return time || '';
    }
  }

  getEventTypeColor(type: CalendarTask['task_type']): string {
    return EVENT_META[type]?.color || '#64748b';
  }

  getEventIcon(type: CalendarTask['task_type']): string {
    return EVENT_META[type]?.icon || '📝';
  }

  // =============================================
  // FORM HELPERS
  // =============================================

  private resetEventForm(): void {
    this.eventForm.reset({
      title: '',
      task_type: 'workout',
      task_date: this.formatDateForInput(this.selectedDate),
      reminder_time: '',
      duration: 60,
      description: '',
      tags: [],
      workout_plan_id: '',
      priority: 'medium'
    });
  }

  private populateEventForm(event: CalendarTask): void {
    this.eventForm.patchValue({
      title: event.title,
      task_type: event.task_type,
      task_date: event.task_date,
      reminder_time: event.reminder_time || '',
      duration: event.duration || 60,
      description: event.description || '',
      tags: event.tags || [],
      workout_plan_id: event.workout_plan_id || '',
      priority: event.priority || 'medium'
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    return d;
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDefaultTime(): string {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    return `${nextHour.toString().padStart(2, '0')}:00`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // =============================================
  // TRACK BY FUNCTIONS
  // =============================================

  trackByDate(index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  trackByEvent(index: number, event: CalendarTask): string | number {
    return event.id;
  }
}
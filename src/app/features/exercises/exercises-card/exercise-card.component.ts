// src/app/exercises-filtres/exercises-detail/exercise-card.component.ts - Enhanced Dashboard Style
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, timer, of } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';

import { Exercise, NotificationUtils, APP_CONFIG } from '@shared';
import { ExercisesService } from '@app/services/exercises.service';

@Component({
  selector: 'app-exercise-card-enhanced',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exercise-card.component.html',
  styleUrls: ['./exercise-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseCardComponent implements OnInit, OnDestroy {
  @Input() exercise!: Exercise;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() showQuickActions = true;
  @Input() showProgress = false;
  
  @Output() favoriteToggle = new EventEmitter<Exercise>();
  
  @Output() addToWorkoutEvent = new EventEmitter<Exercise>();
  @Output() shareExerciseEvent = new EventEmitter<Exercise>();
  @Output() createTimerEvent = new EventEmitter<Exercise>();

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  // Video state
  isPlaying = false;
  videoLoading = false;
  videoError = false;
  currentTime = 0;
  videoDuration = 0;
  showControls = false;
  
  // Enhanced interaction state
  private videoControlsTimeout?: number;
  private pauseTimeout?: number;
  private playPromise?: Promise<void>;
  private currentVideoUrl = '';
  private alternativeUrls: string[] = [];
  private currentUrlIndex = 0;
  private retryCount = 0;
  private maxRetries = 3;
  private destroy$ = new Subject<void>();

  // Performance tracking
  private performanceMetrics = {
    loadStartTime: 0,
    firstPlayTime: 0,
    errorCount: 0,
    retryAttempts: 0
  };

  constructor(
    private exercisesService: ExercisesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeExercise();
    this.setupVideoConfiguration();
    this.trackPerformance();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isPlaying) return;
    
    const target = event.target as HTMLElement;
    const card = target.closest('.exercise-card-enhanced');
    
    if (!card || !card.contains(this.videoElement?.nativeElement || null)) {
      this.pauseVideo();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(): void {
    this.cleanup();
  }

  // ===== INITIALIZATION METHODS =====
  
  private initializeExercise(): void {
    if (!this.exercise) {
      console.error('Exercise data is required');
      return;
    }

    // Initialize exercise state
    this.exercise.isFavorite = this.exercise.isFavorite || this.exercisesService.isFavorite(this.exercise.id);
    
    // Set up performance tracking
    this.performanceMetrics.loadStartTime = performance.now();
    
    console.log('✅ Exercise card initialized:', this.exercise.name);
  }

  private setupVideoConfiguration(): void {
    if (!this.exercise.videoUrl) return;

    this.currentVideoUrl = this.exercise.videoUrl;
    this.alternativeUrls = this.exercisesService.getAlternativeVideoUrls(this.exercise.videoUrl);
    this.currentUrlIndex = 0;
    this.retryCount = 0;
    
    // Preload video metadata with performance tracking
    this.preloadVideoMetadata();
  }

  private trackPerformance(): void {
    // Track component initialization time
    const initTime = performance.now() - this.performanceMetrics.loadStartTime;
    console.log(`📊 Exercise card initialized in ${initTime.toFixed(2)}ms`);
  }

  private cleanup(): void {
    if (this.videoControlsTimeout) {
      clearTimeout(this.videoControlsTimeout);
    }
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
    }
    if (this.isPlaying && this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
    }
  }

  // ===== ENHANCED VIDEO MANAGEMENT =====

  private preloadVideoMetadata(): void {
    if (!this.currentVideoUrl || this.videoError) return;

    console.log('🔄 Preloading video metadata for:', this.exercise.name);

    this.exercisesService.validateVideoUrl(this.currentVideoUrl)
      .pipe(
        takeUntil(this.destroy$),
        retry({
          count: 2,
          delay: (error, retryCount) => {
            console.warn(`Retry ${retryCount} for video validation:`, error);
            return timer(1000 * retryCount);
          }
        }),
        catchError(error => {
          console.warn('Video validation failed:', error);
          return of(false);
        })
      )
      .subscribe({
        next: (isValid) => {
          if (!isValid) {
            this.tryNextAlternativeUrl();
          } else {
            console.log('✅ Video URL validated:', this.currentVideoUrl);
          }
        }
      });
  }

  private tryNextAlternativeUrl(): void {
    this.currentUrlIndex++;
    this.performanceMetrics.retryAttempts++;
    
    if (this.currentUrlIndex < this.alternativeUrls.length) {
      this.currentVideoUrl = this.alternativeUrls[this.currentUrlIndex];
      this.videoError = false;
      
      console.log(`🔄 Trying alternative URL ${this.currentUrlIndex + 1}:`, this.currentVideoUrl);
      
      // Update the video element source if it exists
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.src = this.currentVideoUrl;
      }
      
      // Validate the new URL with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, this.currentUrlIndex), 5000);
      
      timer(retryDelay).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.exercisesService.validateVideoUrl(this.currentVideoUrl)
          .pipe(
            takeUntil(this.destroy$),
            catchError(() => of(false))
          )
          .subscribe({
            next: (isValid) => {
              if (!isValid) {
                this.tryNextAlternativeUrl();
              }
            }
          });
      });
    } else {
      // No more alternatives, mark as error
      this.videoError = true;
      this.videoLoading = false;
      this.performanceMetrics.errorCount++;
      
      console.warn(`❌ All video URLs failed for exercise: ${this.exercise.id}, attempts: ${this.performanceMetrics.retryAttempts}`);
      this.cdr.markForCheck();
    }
  }

  // Enhanced video event handlers
  onVideoLoadStart(): void {
    this.videoLoading = true;
    this.videoError = false;
    this.performanceMetrics.loadStartTime = performance.now();
    this.cdr.markForCheck();
  }

  onVideoLoaded(): void {
    this.videoLoading = false;
    this.videoError = false;
    
    const loadTime = performance.now() - this.performanceMetrics.loadStartTime;
    console.log(`✅ Video loaded in ${loadTime.toFixed(2)}ms:`, this.exercise.name);
    
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      this.videoDuration = video.duration;
      
      this.setupVideoEventListeners(video);
      this.cdr.markForCheck();
      
      // Get metadata from service with enhanced error handling
      this.exercisesService.getVideoMetadata(this.currentVideoUrl)
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.warn('Could not get video metadata:', error);
            return of({ duration: this.videoDuration, qualities: [] });
          })
        )
        .subscribe({
          next: (metadata) => {
            this.videoDuration = metadata.duration || this.videoDuration;
            this.cdr.markForCheck();
          }
        });
    }
  }

  onVideoError(): void {
    this.videoLoading = false;
    this.performanceMetrics.errorCount++;
    
    const errorTime = performance.now() - this.performanceMetrics.loadStartTime;
    console.error(`❌ Video error after ${errorTime.toFixed(2)}ms for:`, this.exercise.id, 'URL:', this.currentVideoUrl);
    
    // Smart retry logic with exponential backoff
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 5000);
      
      console.log(`🔄 Retrying in ${retryDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
      
      timer(retryDelay).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.tryNextAlternativeUrl();
      });
    } else {
      this.tryNextAlternativeUrl();
    }
  }

  onVideoCanPlay(): void {
    this.videoLoading = false;
    this.cdr.markForCheck();
  }

  onVideoWaiting(): void {
    this.videoLoading = true;
    this.cdr.markForCheck();
  }

  onVideoPlaying(): void {
    this.videoLoading = false;
    this.cdr.markForCheck();
  }

  onVideoPlay(): void {
    this.isPlaying = true;
    this.performanceMetrics.firstPlayTime = performance.now();
    this.pauseOtherVideos();
    this.cdr.markForCheck();
  }

  onVideoPause(): void {
    this.isPlaying = false;
    this.cdr.markForCheck();
  }

  onTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.currentTime = video.currentTime;
    this.cdr.markForCheck();
  }

  onMediaClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (!this.currentVideoUrl || this.videoError) return;
    
    if (this.videoElement?.nativeElement) {
      this.toggleVideo();
    }
  }

  toggleVideo(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.videoElement?.nativeElement || this.videoError || this.videoLoading) {
      return;
    }

    const video = this.videoElement.nativeElement;

    try {
      if (this.isPlaying) {
        this.pauseVideo();
      } else {
        this.playVideo();
      }
    } catch (error) {
      console.error('Video control error:', error);
      this.performanceMetrics.errorCount++;
      this.tryNextAlternativeUrl();
    }
  }

  private async playVideo(): Promise<void> {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    
    try {
      // Ensure video source is set
      if (video.src !== this.currentVideoUrl) {
        video.src = this.currentVideoUrl;
      }
      
      // Ensure video is muted for autoplay policies
      video.muted = true;
      video.loop = true;
      
      // Pause any other playing videos
      this.pauseOtherVideos();
      
      // Play the video with enhanced error handling
      this.playPromise = video.play();
      await this.playPromise;
      
      this.isPlaying = true;
      this.showVideoControls();
      this.scheduleHideControls();
      
      this.cdr.markForCheck();
      
    } catch (error) {
      console.error('Error playing video:', error);
      this.performanceMetrics.errorCount++;
      
      // Try alternative URL on play error
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.tryNextAlternativeUrl();
      }
    }
  }

  private pauseVideo(): void {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    video.pause();
    this.isPlaying = false;
    this.showControls = false;
    
    if (this.videoControlsTimeout) {
      clearTimeout(this.videoControlsTimeout);
    }
    
    this.cdr.markForCheck();
  }

  private pauseOtherVideos(): void {
    // Find and pause all other playing videos in the page
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
      if (video !== this.videoElement?.nativeElement && !video.paused) {
        video.pause();
      }
    });
  }

  private showVideoControls(): void {
    this.showControls = true;
    this.cdr.markForCheck();
  }

  private scheduleHideControls(): void {
    if (this.videoControlsTimeout) {
      clearTimeout(this.videoControlsTimeout);
    }
    
    this.videoControlsTimeout = window.setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false;
        this.cdr.markForCheck();
      }
    }, 3000);
  }

  private setupVideoEventListeners(video: HTMLVideoElement): void {
    // Enhanced event listeners with performance tracking
    video.addEventListener('ended', () => {
      this.isPlaying = false;
      this.showControls = false;
      this.currentTime = 0;
      this.cdr.markForCheck();
    });

    video.addEventListener('mouseenter', () => {
      if (this.isPlaying) {
        this.showVideoControls();
      }
    });

    video.addEventListener('mouseleave', () => {
      this.scheduleHideControls();
    });

    video.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleVideo();
    });

    // Enhanced buffering detection
    video.addEventListener('stalled', () => {
      console.warn('Video stalled:', this.exercise.name);
      this.videoLoading = true;
      this.cdr.markForCheck();
    });

    video.addEventListener('progress', () => {
      // Track buffering progress
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const bufferedPercentage = (bufferedEnd / duration) * 100;
          console.log(`📊 Video buffered: ${bufferedPercentage.toFixed(1)}%`);
        }
      }
    });
  }

  // ===== ENHANCED USER ACTIONS =====

  navigateToDetail(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.router.navigate(['/exercises', this.exercise.id]);
  }

  toggleFavorite(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const wasAndFavorite = this.exercise.isFavorite;
    this.exercise.isFavorite = !this.exercise.isFavorite;
    
    this.exercisesService.toggleFavorite(this.exercise.id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error toggling favorite:', error);
          // Revert the change on error
          this.exercise.isFavorite = wasAndFavorite;
          this.showNotification('❌ Erreur lors de la mise à jour des favoris', 'error');
          this.cdr.markForCheck();
          return of(wasAndFavorite);
        })
      )
      .subscribe({
        next: (isFavorite) => {
          this.exercise.isFavorite = isFavorite;
          this.favoriteToggle.emit(this.exercise);
          this.showNotification(
            isFavorite ? '❤️ Ajouté aux favoris' : '💔 Retiré des favoris',
            'success'
          );
          this.cdr.markForCheck();
        }
      });
  }

  

  addToWorkout(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.addToWorkoutEvent.emit(this.exercise);
    this.showNotification('✅ Ajouté au programme d\'entraînement', 'success');
    
    console.log('Adding to workout:', this.exercise.name);
  }

  shareExercise(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const shareData = {
      title: `Exercice: ${this.exercise.name}`,
      text: `Découvrez cet exercice de ${this.getBodyPartLabel(this.exercise.bodyPart)}: ${this.exercise.name}`,
      url: `${window.location.origin}/exercises/${this.exercise.id}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      navigator.share(shareData).then(() => {
        this.shareExerciseEvent.emit(this.exercise);
        this.showNotification('📤 Exercice partagé avec succès', 'success');
      }).catch(error => {
        console.error('Error sharing:', error);
        this.fallbackShare(shareData.url);
      });
    } else {
      this.fallbackShare(shareData.url);
    }
  }

  createTimer(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.createTimerEvent.emit(this.exercise);
    
    // Create a simple timer for this exercise
    const timerDuration = this.exercise.duration || 30;
    this.showNotification(`⏱️ Timer de ${timerDuration} minutes pour ${this.exercise.name}`, 'success');
    
    // Store timer data for a simple timer component
    sessionStorage.setItem('exerciseTimer', JSON.stringify({
      exercise: this.exercise,
      duration: timerDuration * 60, // Convert to seconds
      type: 'exercise_timer'
    }));
    
    // For now, just show a simple notification until we have a timer page
    this.startSimpleTimer(timerDuration * 60);
  }
  
  private startSimpleTimer(seconds: number): void {
    let remainingTime = seconds;
    const exerciseName = this.exercise.name;
    
    this.showNotification(`🚨 Timer démarré - ${exerciseName} (${Math.floor(seconds/60)}min)`, 'info');
    
    const countdown = setInterval(() => {
      remainingTime--;
      
      if (remainingTime <= 0) {
        clearInterval(countdown);
        this.showNotification(`✅ Timer terminé ! Bravo pour ${exerciseName}`, 'success');
        // Play a sound or vibrate if available
        if ('vibrate' in navigator) {
          navigator.vibrate([500, 200, 500]);
        }
      } else if (remainingTime === 10) {
        this.showNotification(`⏰ Plus que 10 secondes !`, 'warning');
      } else if (remainingTime === 30) {
        this.showNotification(`⏰ Plus que 30 secondes !`, 'info');
      }
    }, 1000);
  }

  retryVideoLoad(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.videoError = false;
    this.videoLoading = true;
    this.retryCount = 0;
    this.currentUrlIndex = 0;
    
    if (this.exercise.videoUrl) {
      this.currentVideoUrl = this.exercise.videoUrl;
      this.alternativeUrls = this.exercisesService.getAlternativeVideoUrls(this.exercise.videoUrl);
      
      if (this.videoElement?.nativeElement) {
        const video = this.videoElement.nativeElement;
        video.src = this.currentVideoUrl;
        video.load();
        
        // Add a small delay before retrying
        timer(500).pipe(
          takeUntil(this.destroy$)
        ).subscribe(() => {
          this.preloadVideoMetadata();
        });
      }
    }
    
    this.showNotification('🔄 Rechargement de la vidéo...', 'info');
    this.cdr.markForCheck();
  }

  private fallbackShare(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      this.shareExerciseEvent.emit(this.exercise);
      this.showNotification('📋 Lien copié dans le presse-papier', 'success');
    }).catch(() => {
      this.showNotification('❌ Erreur lors de la copie', 'error');
    });
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    // Use the enhanced notification system from shared utils
    switch (type) {
      case 'success':
        NotificationUtils.success(message);
        break;
      case 'error':
        NotificationUtils.error(message);
        break;
      case 'warning':
        NotificationUtils.warning(message);
        break;
      default:
        NotificationUtils.info(message);
    }
  }

  // ===== ENHANCED UTILITY METHODS AVEC APP_CONFIG =====

  getDifficultyIcon(difficulty: string): string {
    const difficultyInfo = APP_CONFIG.EXERCISE_CONFIG.DIFFICULTIES.find(
      (d: { value: string; icon: string; label: string; color?: string }) => d.value === difficulty
    );
    return difficultyInfo?.icon || '⚪';
  }

  getDifficultyLabel(difficulty: string): string {
    const difficultyInfo = APP_CONFIG.EXERCISE_CONFIG.DIFFICULTIES.find(
      (d: { value: string; label: string }) => d.value === difficulty
    );
    return difficultyInfo?.label || 'Débutant';
  }

  getBodyPartIcon(bodyPart: string): string {
    const bodyPartInfo = APP_CONFIG.EXERCISE_CONFIG.BODY_PARTS.find(
      (bp: { value: string; icon: string }) => bp.value === bodyPart
    );
    return bodyPartInfo?.icon || '💪';
  }

  getBodyPartLabel(bodyPart: string): string {
    const bodyPartInfo = APP_CONFIG.EXERCISE_CONFIG.BODY_PARTS.find(
      (bp: { value: string; label: string }) => bp.value === bodyPart
    );
    return bodyPartInfo?.label || bodyPart;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Enhanced getters with performance optimization
  get currentVideoSrc(): string {
    return this.currentVideoUrl || this.exercise.videoUrl || '';
  }

  get hasVideo(): boolean {
    return !!(this.currentVideoUrl || this.exercise.videoUrl) && !this.videoError;
  }

  // Enhanced performance tracking
  getPerformanceMetrics(): any {
    return {
      ...this.performanceMetrics,
      hasVideo: this.hasVideo,
      videoError: this.videoError,
      currentUrlIndex: this.currentUrlIndex,
      alternativeUrlsCount: this.alternativeUrls.length
    };
  }
}

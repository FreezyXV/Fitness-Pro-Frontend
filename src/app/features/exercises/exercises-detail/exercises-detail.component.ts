// src/app/exercises-filtres/exercises-detail/exercises-detail.component.ts - FIXED VIDEO LOADING
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { posterUrl, videoUrl } from '@app/utils/exercise-media';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, timer, interval, fromEvent, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, retry, delay, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Exercise, ExerciseFilters, APP_CONFIG,  WorkoutUtils, StorageUtils } from '@shared';
import { ExercisesService } from '@app/services/exercises.service';

interface UIState {
  isLoading: boolean;
  error: string | null;
  loadingProgress: number;
  hasInteracted: boolean;
}

interface VideoState {
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  hasError: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
  playbackSpeed: number;
  quality: string;
  isFullscreen: boolean;
}

interface InstructionState {
  currentStep: number;
  autoPlay: boolean;
  progress: number;
  voiceEnabled: boolean;
  speechSupported: boolean;
}

@Component({
  selector: 'app-exercises-detail-modern',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exercises-detail.component.html',
  styleUrls: ['./exercises-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExercisesDetailComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('progressBar') progressBar?: ElementRef<HTMLDivElement>;

  // ===== STATE MANAGEMENT =====
  private uiState = new BehaviorSubject<UIState>({
    isLoading: false,
    error: null,
    loadingProgress: 0,
    hasInteracted: false
  });

  private videoState = new BehaviorSubject<VideoState>({
    isPlaying: false,
    isMuted: false,
    isLoading: false,
    hasError: false,
    currentTime: 0,
    duration: 0,
    showControls: false,
    playbackSpeed: 1,
    quality: 'HD',
    isFullscreen: false
  });

  private instructionState = new BehaviorSubject<InstructionState>({
    currentStep: 0,
    autoPlay: false,
    progress: 0,
    voiceEnabled: false,
    speechSupported: 'speechSynthesis' in window
  });

  // ===== REACTIVE GETTERS =====
  get isLoading(): boolean { return this.uiState.value.isLoading; }
  get error(): string | null { return this.uiState.value.error; }
  get loadingProgress(): number { return this.uiState.value.loadingProgress; }
  
  get isPlaying(): boolean { return this.videoState.value.isPlaying; }
  get isMuted(): boolean { return this.videoState.value.isMuted; }
  get videoLoading(): boolean { return this.videoState.value.isLoading; }
  get videoError(): boolean { return this.videoState.value.hasError; }
  get currentTime(): number { return this.videoState.value.currentTime; }
  get videoDuration(): number { return this.videoState.value.duration; }
  get showControls(): boolean { return this.videoState.value.showControls; }
  get playbackSpeed(): number { return this.videoState.value.playbackSpeed; }
  
  get currentInstructionStep(): number { return this.instructionState.value.currentStep; }
  get autoPlayInstructions(): boolean { return this.instructionState.value.autoPlay; }
  get instructionProgress(): number { return this.instructionState.value.progress; }
  get voiceInstructionsEnabled(): boolean { return this.instructionState.value.voiceEnabled; }
  get speechSynthesisSupported(): boolean { return this.instructionState.value.speechSupported; }

  // ===== DATA PROPERTIES =====
  exercise: Exercise | null = null;
  relatedExercises: Exercise[] = [];
  isFavorite = false;
  
  // ===== VIDEO MANAGEMENT =====
  private currentVideoUrl = '';
  private alternativeUrls: string[] = [];
  private currentUrlIndex = 0;
  private retryCount = 0;
  private maxRetries = 3;
  
  // ===== INSTRUCTIONS =====
  defaultInstructionsList = [
    'Regardez attentivement la vidéo de démonstration pour comprendre le mouvement',
    'Préparez votre espace d\'entraînement et vérifiez l\'équipement nécessaire',
    'Effectuez un échauffement léger pour préparer vos muscles',
    'Adoptez la position de départ en vous concentrant sur votre posture',
    'Exécutez le mouvement lentement en contrôlant chaque phase',
    'Coordonnez votre respiration avec le mouvement',
    'Maintenez une forme correcte tout au long de l\'exercice',
    'Terminez par des étirements appropriés'
  ];

  // ===== TIMERS =====
  private controlsTimeout?: number;
  private instructionTimer?: number;
  private autoPlayTimer?: number;
  
  // ===== LIFECYCLE =====
  private destroy$ = new Subject<void>();
  private exerciseId: number | null = null;

  // ===== PERFORMANCE TRACKING =====
  private performanceMetrics = {
    loadStartTime: 0,
    totalLoadTime: 0,
    videoLoadTime: 0,
    userInteractions: 0,
    videoErrors: 0,
    retryAttempts: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private exercisesService: ExercisesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.performanceMetrics.loadStartTime = performance.now();
    this.initializeComponent();
    this.setupKeyboardShortcuts();
    this.setupStateSubscriptions();
    this.trackUserActivity();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
    this.logPerformanceMetrics();
  }

  // ===== INITIALIZATION =====
  
  private initializeComponent(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.exerciseId = parseInt(id, 10);
      this.loadExercise(this.exerciseId);
    } else {
      this.updateUIState({ error: 'ID d\'exercice invalide' });
    }

    // Watch for route changes
    this.route.params.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(params => {
      const newId = parseInt(params['id'], 10);
      if (newId && newId !== this.exerciseId) {
        this.exerciseId = newId;
        this.cleanup();
        this.loadExercise(newId);
      }
    });
  }

  private setupStateSubscriptions(): void {
    // Log state changes in development
    if (typeof window !== 'undefined' && (window as any).location?.hostname === 'localhost') {
      this.uiState.pipe(takeUntil(this.destroy$)).subscribe(state => {
        console.log('🔄 UI State:', state);
      });
      
      this.videoState.pipe(takeUntil(this.destroy$)).subscribe(state => {
        console.log('🎥 Video State:', state);
      });
    }
  }

  private setupKeyboardShortcuts(): void {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      takeUntil(this.destroy$),
      debounceTime(50)
    ).subscribe(event => this.handleKeyboardEvent(event));
  }

  private trackUserActivity(): void {
    const events = ['click', 'scroll', 'keydown', 'mousemove'];
    events.forEach(eventName => {
      fromEvent(document, eventName).pipe(
        takeUntil(this.destroy$),
        debounceTime(1000)
      ).subscribe(() => {
        this.markUserInteraction();
      });
    });
  }

  private cleanup(): void {
    [this.controlsTimeout, this.instructionTimer, this.autoPlayTimer].forEach(timer => {
      if (timer) clearTimeout(timer);
    });

    if (this.isPlaying && this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
    }

    if (this.speechSynthesisSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    this.saveUserProgress();
  }

  // ===== DATA LOADING =====

  private loadExercise(id: number): void {
    this.updateUIState({ isLoading: true, error: null, loadingProgress: 10 });
    
    this.exercisesService.getExercise(id).pipe(
      takeUntil(this.destroy$),
      map(exercise => {
        this.updateUIState({ loadingProgress: 40 });
        return exercise;
      }),
      switchMap(exercise => {
        if (exercise) {
          this.exercise = exercise;
          this.isFavorite = this.exercisesService.isFavorite(exercise.id);
          this.setupVideo();
          this.loadUserProgress();
          this.updateUIState({ loadingProgress: 70 });
          
          // Load related exercises
          return this.exercisesService.getRelatedExercises(exercise.id);
        }
        throw new Error('Exercise not found');
      }),
      catchError(error => {
        console.error('❌ Error loading exercise:', error);
        this.updateUIState({ error: 'Erreur lors du chargement de l\'exercice' });
        this.loadMockExercise(id);
        return of([]);
      })
    ).subscribe({
      next: (relatedExercises) => {
        this.relatedExercises = relatedExercises;
        this.updateUIState({ 
          isLoading: false, 
          loadingProgress: 100 
        });
        
        // Reset progress after animation
        timer(500).subscribe(() => {
          this.updateUIState({ loadingProgress: 0 });
        });

        this.performanceMetrics.totalLoadTime = performance.now() - this.performanceMetrics.loadStartTime;
        console.log('✅ Exercise loaded successfully:', this.exercise?.name);
      }
    });
  }

  private loadMockExercise(id: number): void {
    this.exercise = {
      id: id,
      name: `90/90 Hip Crossover`,
      description: 'Exercice cardio avec mouvement de crossover pour coordination.',
      bodyPart: 'cardio',
      difficulty: 'intermediate',
      duration: 1,
      videoUrl: '90-90-HIP-CROSSOVER',
      instructions: [
        'Assis, jambes fléchies à 90°',
        'Basculez les jambes d\'un côté à l\'autre',
        'Gardez les épaules au sol',
        'Contrôlez le mouvement'
      ],
      tips: [
        'Mouvement contrôlé',
        'Engagez les abdominaux'
      ],
      muscleGroups: ['Fléchisseurs de hanche', 'Obliques'],
      equipmentNeeded: 'aucun',
      category: 'Cardio',
      estimatedCaloriesPerMinute: 10
    };
    
    this.updateUIState({ error: null });
    this.setupVideo();
  }

  private setupVideo(): void {
    if (!this.exercise?.videoUrl) {
      console.log('❌ No video URL for exercise:', this.exercise?.name);
      return;
    }

    console.log('🎥 Setting up video for:', this.exercise.name, 'URL:', this.exercise.videoUrl);

    this.currentVideoUrl = this.normalizeVideoUrl(this.exercise.videoUrl);
    this.alternativeUrls = this.generateAlternativeUrls(this.currentVideoUrl);
    this.currentUrlIndex = 0;
    this.retryCount = 0;
    
    console.log('   - Current URL:', this.currentVideoUrl);
    console.log('   - Alternative URLs:', this.alternativeUrls);
    
    this.updateVideoState({ isLoading: false, hasError: false });
  }

  /**
   * Pointait vers un bucket S3 inexistant (`NoSuchBucket`), ce qui cassait la
   * lecture de TOUTES les demonstrations. La resolution est desormais
   * centralisee dans exercise-media, avec transcodage a la volee.
   */
  private normalizeVideoUrl(url: string): string {
    return videoUrl(url, 'detail');
  }

  /** Image de premiere frame, affichee avant le chargement de la video. */
  get videoPoster(): string {
    return posterUrl(this.exercise?.videoUrl, 'detail');
  }

  /**
   * Il n'existe plus qu'une URL par exercice. Cette methode enumerait des
   * variantes de nom de fichier (casse, tirets, underscores) pour deviner le
   * bon chemin local : un contournement qui n'a plus d'objet.
   */
  private generateAlternativeUrls(originalUrl: string): string[] {
    return originalUrl ? [originalUrl] : [];
  }

  // ===== STATE MANAGEMENT HELPERS =====

  private updateUIState(updates: Partial<UIState>): void {
    const currentState = this.uiState.value;
    this.uiState.next({ ...currentState, ...updates });
    this.cdr.markForCheck();
  }

  private updateVideoState(updates: Partial<VideoState>): void {
    const currentState = this.videoState.value;
    this.videoState.next({ ...currentState, ...updates });
    this.cdr.markForCheck();
  }

  private updateInstructionState(updates: Partial<InstructionState>): void {
    const currentState = this.instructionState.value;
    this.instructionState.next({ ...currentState, ...updates });
    this.cdr.markForCheck();
  }

  private markUserInteraction(): void {
    this.performanceMetrics.userInteractions++;
    const currentState = this.uiState.value;
    if (!currentState.hasInteracted) {
      this.updateUIState({ hasInteracted: true });
    }
  }

  // ===== KEYBOARD SHORTCUTS =====

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.handleKeyboardEvent(event);
  }

  private handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.exercise || event.target instanceof HTMLInputElement) return;

    this.markUserInteraction();

    // Media controls
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.seekVideo(null, this.currentTime - 10);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.seekVideo(null, this.currentTime + 10);
        break;
      case 'KeyM':
        event.preventDefault();
        this.toggleMute();
        break;
      case 'KeyF':
        event.preventDefault();
        this.toggleFullscreen();
        break;
    }

    // Instruction navigation
    switch (event.code) {
      case 'ArrowUp':
        event.preventDefault();
        this.previousInstruction();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.nextInstruction();
        break;
    }

    // Shortcuts with modifiers
    if (event.ctrlKey || event.metaKey) {
      switch (event.code) {
        case 'KeyS':
          event.preventDefault();
          this.addToWorkoutPlan();
          break;
        case 'KeyF':
          event.preventDefault();
          this.toggleFavorite();
          break;
      }
    }
  }

  // ===== VIDEO CONTROLS =====

  togglePlayPause(): void {
    if (!this.videoElement?.nativeElement || this.videoError) {
      console.log('❌ Cannot toggle video - element missing or error state');
      return;
    }

    if (this.isPlaying) {
      this.pauseVideo();
    } else {
      this.playVideo();
    }
  }

  private async playVideo(): Promise<void> {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    
    try {
      console.log('▶️ Playing video:', this.exercise?.name, 'URL:', this.currentVideoUrl);
      
      this.updateVideoState({ isLoading: true });
      
      if (video.src !== this.currentVideoUrl) {
        console.log('🔄 Setting video source to:', this.currentVideoUrl);
        video.src = this.currentVideoUrl;
        video.load();
      }
      
      video.muted = this.isMuted;
      video.playbackRate = this.playbackSpeed;
      
      await video.play();
      
      this.updateVideoState({ 
        isPlaying: true, 
        isLoading: false,
        showControls: true 
      });
      
      this.scheduleHideControls();
      console.log('✅ Video playing successfully:', this.exercise?.name);
      
    } catch (error: any) {
      console.error('❌ Error playing video:', error);
      this.handleVideoError();
    }
  }

  private pauseVideo(): void {
    if (!this.videoElement?.nativeElement) return;

    this.videoElement.nativeElement.pause();
    this.updateVideoState({ 
      isPlaying: false, 
      showControls: false 
    });
    
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }

    console.log('⏸️ Video paused:', this.exercise?.name);
  }

  toggleMute(): void {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    const newMutedState = !video.muted;
    
    video.muted = newMutedState;
    this.updateVideoState({ isMuted: newMutedState });
  }

  changePlaybackSpeed(): void {
    if (!this.videoElement?.nativeElement) return;

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(this.playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    this.videoElement.nativeElement.playbackRate = nextSpeed;
    this.updateVideoState({ playbackSpeed: nextSpeed });
  }

  toggleFullscreen(): void {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
      this.updateVideoState({ isFullscreen: false });
    } else {
      video.requestFullscreen().catch(console.error);
      this.updateVideoState({ isFullscreen: true });
    }
  }

  restartVideo(): void {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    video.currentTime = 0;
    this.updateVideoState({ currentTime: 0 });
    
    if (!this.isPlaying) {
      this.playVideo();
    }
  }

  seekVideo(event: MouseEvent | null, time?: number): void {
    if (!this.videoElement?.nativeElement || this.videoDuration === 0) return;

    const video = this.videoElement.nativeElement;
    
    if (time !== undefined) {
      const newTime = Math.max(0, Math.min(time, this.videoDuration));
      video.currentTime = newTime;
      this.updateVideoState({ currentTime: newTime });
    } else if (event && this.progressBar?.nativeElement) {
      const progressBar = this.progressBar.nativeElement;
      const rect = progressBar.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * this.videoDuration;
      
      video.currentTime = newTime;
      this.updateVideoState({ currentTime: newTime });
    }
  }

  // ===== VIDEO EVENT HANDLERS =====

  onVideoLoadStart(): void {
    console.log('🔄 Video load start:', this.exercise?.name);
    this.updateVideoState({ isLoading: true, hasError: false });
  }

  onVideoLoaded(): void {
    if (!this.videoElement?.nativeElement) return;
    
    console.log('✅ Video loaded:', this.exercise?.name);
    const video = this.videoElement.nativeElement;
    this.updateVideoState({ 
      isLoading: false, 
      duration: video.duration || 0 
    });
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    console.error('❌ Video error for:', this.exercise?.name, 'URL:', video.src, 'Error:', video.error);
    
    this.performanceMetrics.videoErrors++;
    this.handleVideoError();
  }

  onVideoCanPlay(): void {
    console.log('✅ Video can play:', this.exercise?.name);
    this.updateVideoState({ isLoading: false });
  }

  onVideoWaiting(): void {
    this.updateVideoState({ isLoading: true });
  }

  onVideoPlaying(): void {
    this.updateVideoState({ isLoading: false });
  }

  onVideoPlay(): void {
    this.updateVideoState({ isPlaying: true });
  }

  onVideoPause(): void {
    this.updateVideoState({ isPlaying: false });
  }

  onVideoEnded(): void {
    this.updateVideoState({ 
      isPlaying: false, 
      showControls: false, 
      currentTime: 0 
    });
  }

  onTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.updateVideoState({ currentTime: video.currentTime });
  }

  private handleVideoError(): void {
    this.performanceMetrics.retryAttempts++;
    
    if (this.retryCount < this.maxRetries && this.currentUrlIndex < this.alternativeUrls.length - 1) {
      this.retryCount++;
      console.log(`🔄 Will try next alternative URL (attempt ${this.retryCount}/${this.maxRetries})`);
      
      timer(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.tryNextAlternativeUrl();
      });
    } else {
      this.updateVideoState({ 
        hasError: true, 
        isLoading: false 
      });
    }
  }

  private tryNextAlternativeUrl(): void {
    this.currentUrlIndex++;
    
    if (this.currentUrlIndex < this.alternativeUrls.length) {
      this.currentVideoUrl = this.alternativeUrls[this.currentUrlIndex];
      console.log(`🔄 Trying alternative URL ${this.currentUrlIndex + 1}:`, this.currentVideoUrl);
      
      this.updateVideoState({ hasError: false, isLoading: true });
      
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.src = this.currentVideoUrl;
        this.videoElement.nativeElement.load();
      }
    } else {
      this.updateVideoState({ hasError: true, isLoading: false });
    }
  }

  retryVideo(): void {
    console.log('🔄 Retrying video for:', this.exercise?.name);
    
    this.retryCount = 0;
    this.currentUrlIndex = 0;
    
    if (this.exercise?.videoUrl) {
      this.currentVideoUrl = this.normalizeVideoUrl(this.exercise.videoUrl);
      this.updateVideoState({ hasError: false, isLoading: true });
      
      if (this.videoElement?.nativeElement) {
        const video = this.videoElement.nativeElement;
        video.src = this.currentVideoUrl;
        video.load();
      }
    }
    
    console.info('🔄 Rechargement de la vidéo...');
  }

  showVideoControls(): void {
    this.updateVideoState({ showControls: true });
  }

  scheduleHideControls(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    
    this.controlsTimeout = window.setTimeout(() => {
      if (this.isPlaying) {
        this.updateVideoState({ showControls: false });
      }
    }, 3000);
  }

  // ===== INSTRUCTIONS =====

  getTotalInstructions(): number {
    if (this.exercise?.instructions && this.exercise.instructions.length > 0) {
      return this.exercise.instructions.length;
    }
    return this.defaultInstructionsList.length;
  }

  setCurrentInstructionStep(step: number): void {
    const totalSteps = this.getTotalInstructions();
    const newStep = Math.max(0, Math.min(step, totalSteps - 1));
    
    this.updateInstructionState({ currentStep: newStep });
    
    if (this.voiceInstructionsEnabled) {
      this.speakCurrentInstruction();
    }
    
    this.saveUserProgress();
  }

  nextInstruction(): void {
    if (this.currentInstructionStep < this.getTotalInstructions() - 1) {
      this.setCurrentInstructionStep(this.currentInstructionStep + 1);
    }
  }

  previousInstruction(): void {
    if (this.currentInstructionStep > 0) {
      this.setCurrentInstructionStep(this.currentInstructionStep - 1);
    }
  }

  toggleAutoPlay(): void {
    const newAutoPlay = !this.autoPlayInstructions;
    this.updateInstructionState({ autoPlay: newAutoPlay });
    
    if (newAutoPlay) {
      this.startAutoPlayInstructions();
    } else {
      this.stopAutoPlayInstructions();
    }
    
    this.saveUserProgress();
  }

  private startAutoPlayInstructions(): void {
    const instructionDuration = 5000;
    
    const playNext = () => {
      if (this.currentInstructionStep < this.getTotalInstructions() - 1) {
        this.nextInstruction();
        this.animateInstructionProgress();
        this.autoPlayTimer = window.setTimeout(playNext, instructionDuration);
      } else {
        this.updateInstructionState({ autoPlay: false });
      }
    };
    
    this.animateInstructionProgress();
    this.autoPlayTimer = window.setTimeout(playNext, instructionDuration);
  }

  private stopAutoPlayInstructions(): void {
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
    }
    this.updateInstructionState({ progress: 0 });
  }

  private animateInstructionProgress(): void {
    this.updateInstructionState({ progress: 0 });
    
    const animate = () => {
      const currentProgress = this.instructionProgress;
      const newProgress = currentProgress + 2;
      
      if (newProgress >= 100) {
        this.updateInstructionState({ progress: 100 });
      } else if (this.autoPlayInstructions) {
        this.updateInstructionState({ progress: newProgress });
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  toggleVoiceInstructions(): void {
    const newVoiceEnabled = !this.voiceInstructionsEnabled;
    this.updateInstructionState({ voiceEnabled: newVoiceEnabled });
    
    if (newVoiceEnabled) {
      this.speakCurrentInstruction();
    } else {
      speechSynthesis.cancel();
    }
    
    this.saveUserProgress();
  }

  private speakCurrentInstruction(): void {
    if (!this.speechSynthesisSupported || !this.voiceInstructionsEnabled) return;
    
    speechSynthesis.cancel();
    
    const instructions = this.exercise?.instructions || this.defaultInstructionsList;
    const instruction = instructions[this.currentInstructionStep];
    
    if (instruction) {
      const utterance = new SpeechSynthesisUtterance(instruction);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.lang = 'fr-FR';
      
      speechSynthesis.speak(utterance);
    }
  }

  // ===== USER ACTIONS =====

  toggleFavorite(): void {
    if (!this.exercise) return;
    
    const wasFavorite = this.isFavorite;
    this.isFavorite = !this.isFavorite;
    
    this.exercisesService.toggleFavorite(this.exercise.id).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('❌ Error toggling favorite:', error);
        this.isFavorite = wasFavorite;
        console.error('❌ Erreur lors de la mise à jour des favoris');
        return of(wasFavorite);
      })
    ).subscribe({
      next: (isFavorite) => {
        this.isFavorite = isFavorite;
        console.log(
          isFavorite ? '❤️ Ajouté aux favoris' : '💔 Retiré des favoris'
        );
      }
    });
  }

  shareExercise(): void {
    if (!this.exercise) return;

    const shareData = {
      title: `Exercice: ${this.exercise.name}`,
      text: `Découvrez cet exercice de ${this.getBodyPartLabel(this.exercise.bodyPart)}: ${this.exercise.name}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      navigator.share(shareData).then(() => {
        console.log('📤 Exercice partagé avec succès');
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url).then(() => {
        console.log('📋 Lien copié dans le presse-papier');
      }).catch(() => {
        console.error('❌ Erreur lors de la copie');
      });
    }
  }

  startWorkout(): void {
    if (!this.exercise) return;
    
    // Sauvegarder l'exercice dans le storage pour la session d'entraînement
    const workoutSession = {
      exerciseId: this.exercise.id,
      exerciseName: this.exercise.name,
      startTime: new Date().toISOString(),
      duration: this.exercise.duration || 30,
      instructions: this.exercise.instructions || this.defaultInstructionsList,
      currentStep: 0,
      isActive: true
    };
    
    StorageUtils.setItem('current_workout_session', workoutSession);
    
    console.log('🏃‍♂️ Session d\'entraînement démarrée !');
    
    // Naviguer vers la page workouts existante avec l'exercice en cours
    this.router.navigate(['/workouts'], {
      queryParams: { 
        sessionId: this.exercise.id,
        autoStart: true 
      }
    });
  }

  addToWorkout(): void {
    if (!this.exercise) return;
    
    // Récupérer la liste des exercices sauvegardés
    const savedExercises = StorageUtils.getItem<Exercise[]>('workout_exercises') || [];
    
    // Vérifier si l'exercice n'est pas déjà dans la liste
    const existingIndex = savedExercises.findIndex((ex: Exercise) => ex.id === this.exercise!.id);
    
    if (existingIndex === -1) {
      savedExercises.push(this.exercise);
      StorageUtils.setItem('workout_exercises', savedExercises);
      console.log('✅ Exercice ajouté à votre séance en cours');
    } else {
      console.info('ℹ️ Cet exercice est déjà dans votre séance');
    }
  }

  addToWorkoutPlan(): void {
    if (!this.exercise) return;
    
    // Récupérer les plans d'entraînement sauvegardés
    const savedPlans = StorageUtils.getItem<any[]>('workout_plans') || [];
    
    // Créer un nouveau plan ou ajouter à un plan existant
    const defaultPlan = {
      id: Date.now(),
      name: `Plan avec ${this.exercise.name}`,
      exercises: [this.exercise],
      created_at: new Date().toISOString(),
      estimatedDuration: this.exercise.duration || 30,
      difficulty: this.exercise.difficulty
    };
    
    savedPlans.push(defaultPlan);
    StorageUtils.setItem('workout_plans', savedPlans);
    
    console.log('✅ Plan d\'entraînement créé avec cet exercice');
    
    // Optionnel : naviguer vers create-workout pour éditer le plan
    setTimeout(() => {
      if (window.confirm('Voulez-vous personnaliser ce plan d\'entraînement ?')) {
        this.router.navigate(['/create-workout'], {
          queryParams: { planId: defaultPlan.id }
        });
      }
    }, 1500);
  }

  createCustomTimer(): void {
    if (!this.exercise) return;
    
    // Créer un timer personnalisé intégré
    const duration = window.prompt(
      `Durée du timer pour "${this.exercise.name}" (en minutes):`,
      (this.exercise.duration || 30).toString()
    );
    
    if (duration && !isNaN(parseInt(duration))) {
      const timerMinutes = parseInt(duration);
      const timerSeconds = timerMinutes * 60;
      
      // Créer la session de timer
      const timerSession = {
        exerciseId: this.exercise.id,
        exerciseName: this.exercise.name,
        totalTime: timerSeconds,
        remainingTime: timerSeconds,
        isActive: false,
        startTime: null,
        currentStep: 0,
        instructions: this.exercise.instructions || this.defaultInstructionsList
      };
      
      StorageUtils.setItem('custom_timer_session', timerSession);
      
      console.log(`⏱️ Timer de ${timerMinutes} minutes configuré !`);
      
      // Naviguer vers workouts avec le timer personnalisé
      this.router.navigate(['/workouts'], {
        queryParams: { 
          timerMode: true,
          exerciseId: this.exercise.id,
          duration: timerMinutes
        }
      });
    } else if (duration !== null) {
      console.error('❌ Durée invalide. Veuillez entrer un nombre en minutes.');
    }
  }

  downloadExerciseGuide(): void {
    if (!this.exercise) return;
    
    const guideContent = this.generateExerciseGuide();
    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `guide-${this.exercise.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('📄 Guide de l\'exercice téléchargé');
  }

  navigateToExercise(exerciseId: number): void {
    this.router.navigate(['/exercises', exerciseId]);
  }

  goBack(): void {
    this.saveUserProgress();
    this.location.back();
  }

  retry(): void {
    if (this.exerciseId) {
      this.loadExercise(this.exerciseId);
    }
  }

  // ===== UTILITY METHODS =====

  getDifficultyIcon(difficulty: string): string {
    const icons: Record<string, string> = {
      'beginner': '🟢',
      'intermediate': '🟡',
      'advanced': '🔴'
    };
    return icons[difficulty] || '⚪';
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      'beginner': 'Débutant',
      'intermediate': 'Intermédiaire',
      'advanced': 'Avancé'
    };
    return labels[difficulty] || 'Débutant';
  }

  getBodyPartIcon(bodyPart: string): string {
    const icons: Record<string, string> = {
      'chest': '💪',
      'back': '🏔️',
      'arms': '💪',
      'legs': '🦵',
      'shoulders': '🤲',
      'abs': '🔥',
      'cardio': '❤️',
      'mobility': '🧘',
      'flexibility': '🤸',
      'general': '⚡'
    };
    return icons[bodyPart] || '💪';
  }

  getBodyPartLabel(bodyPart: string): string {
    const labels: Record<string, string> = {
      'chest': 'Poitrine',
      'back': 'Dos',
      'arms': 'Bras',
      'legs': 'Jambes',
      'shoulders': 'Épaules',
      'abs': 'Abdominaux',
      'cardio': 'Cardio',
      'mobility': 'Mobilité',
      'flexibility': 'Flexibilité',
      'general': 'Général'
    };
    return labels[bodyPart] || bodyPart;
  }

  getTipIcon(index: number): string {
    const icons = ['💡', '⚡', '🎯', '🔥', '✨', '💪', '🌟', '⭐', '🚀', '💎'];
    return icons[index % icons.length];
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  get currentVideoSrc(): string {
    return this.currentVideoUrl || this.exercise?.videoUrl || '';
  }

  get hasVideo(): boolean {
    return !!(this.currentVideoUrl || this.exercise?.videoUrl) && !this.videoError;
  }

  // ===== PERSISTENCE =====

  private loadUserProgress(): void {
    if (!this.exercise) return;
    
    const progressKey = `exercise_progress_${this.exercise.id}`;
    const savedProgress = StorageUtils.getItem(progressKey);
    
    if (savedProgress && typeof savedProgress === 'string') {
      try {
        const progress = JSON.parse(savedProgress);
        this.updateInstructionState({
          currentStep: progress.instructionStep || 0,
          autoPlay: progress.autoPlay || false,
          voiceEnabled: progress.voiceEnabled || false
        });
      } catch (error) {
        console.warn('⚠️ Error loading user progress:', error);
      }
    }
  }

  private saveUserProgress(): void {
    if (!this.exercise || !this.uiState.value.hasInteracted) return;
    
    const progressKey = `exercise_progress_${this.exercise.id}`;
    const progress = {
      instructionStep: this.currentInstructionStep,
      autoPlay: this.autoPlayInstructions,
      voiceEnabled: this.voiceInstructionsEnabled,
      completionRate: ((this.currentInstructionStep + 1) / this.getTotalInstructions()) * 100,
      lastVisited: new Date().toISOString()
    };
    
    StorageUtils.setItem(progressKey, JSON.stringify(progress));
  }

  private generateExerciseGuide(): string {
    if (!this.exercise) return '';
    
    const instructions = this.exercise.instructions || this.defaultInstructionsList;
    const tips = this.exercise.tips || [];
    
    return `
GUIDE D'EXERCICE: ${this.exercise.name.toUpperCase()}
${'='.repeat(50)}

INFORMATIONS GÉNÉRALES:
- Zone ciblée: ${this.getBodyPartLabel(this.exercise.bodyPart)}
- Niveau de difficulté: ${this.getDifficultyLabel(this.exercise.difficulty)}
- Durée estimée: ${this.exercise.duration || 'Non spécifiée'} minutes
- Équipement: ${this.exercise.equipmentNeeded || 'Aucun'}

DESCRIPTION:
${this.exercise.description || 'Description non disponible.'}

INSTRUCTIONS DÉTAILLÉES:
${instructions.map((instruction: string, index: number) => `${index + 1}. ${instruction}`).join('\n')}

CONSEILS D'EXPERT:
${tips.map((tip: string) => `• ${tip}`).join('\n')}

MUSCLES CIBLÉS:
${this.exercise.muscleGroups?.join(', ') || 'Non spécifiés'}

CALORIES ESTIMÉES:
${this.exercise.estimatedCaloriesPerMinute ? 
  `Environ ${this.exercise.estimatedCaloriesPerMinute} calories par minute` : 
  'Non spécifiées'}

Généré le ${new Date().toLocaleDateString('fr-FR')} par FitnessPro
    `.trim();
  }

  private logPerformanceMetrics(): void {
    console.log('📊 Exercise Detail Performance:', {
      totalLoadTime: `${this.performanceMetrics.totalLoadTime.toFixed(2)}ms`,
      userInteractions: this.performanceMetrics.userInteractions,
      videoErrors: this.performanceMetrics.videoErrors,
      retryAttempts: this.performanceMetrics.retryAttempts,
      exerciseName: this.exercise?.name || 'Unknown'
    });
  }
}

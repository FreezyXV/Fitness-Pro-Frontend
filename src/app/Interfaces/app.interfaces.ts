// frontend/src/app/Interfaces/app.interfaces.ts - CONSOLIDATED INTERFACES

// =============================================
// CORE INTERFACES (Prioritized from previous updates)
// =============================================

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  bodyPart: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in minutes
  muscleGroups?: string[];
  equipmentNeeded?: string;
  videoUrl?: string;
  instructions?: string[];
  tips?: string[];
  category?: string;
  estimatedCaloriesPerMinute?: number;
  createdAt?: string;
  updatedAt?: string;

  // Appended attributes from backend - now all should be camelCase
  bodyPartLabel?: string;
  difficultyLabel?: string;
  difficultyColor?: string;
  bodyPartInfo?: { value: string; label: string; icon: string };
  difficultyInfo?: { value: string; label: string; color: string };

  // Frontend-specific properties
  isFavorite?: boolean;
  progress?: number;
  stats?: any;

  // Removed compatibility properties as backend now returns camelCase

  // Added from WorkoutExercise pivot data - now all should be camelCase
  sets?: number;
  reps?: number;
  durationSeconds?: number;
  restTimeSeconds?: number;
  targetWeight?: number;
  notes?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt?: string;
  profilePhotoUrl?: string | null;
  avatar?: string; // Added for consistency with mock data
  createdAt: string;
  updatedAt: string;

  // Additional fields from backend User model - now all should be camelCase
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  gender?: string;
  phone?: string | null;
  dateOfBirth?: string | null; // ISO 8601 date string
  location?: string | null;
  bio?: string | null;
  activityLevel?: string | null;
  goals?: string[]; // Assuming this is an array of strings based on backend cast
  bloodGroup?: string | null;
  preferences?: any; // Assuming this can be a flexible object/array;
  level?: number; // Added for consistency with mock data
  totalPoints?: number; // Added for consistency with mock data
  rank?: number; // Added for consistency with mock data
  joinDate?: string; // Added for consistency with mock data

  // Data from getStats() method
  stats?: UserStats;

  // Data from getBmiInfo() method
  bmiInfo?: BMIInfo;
  roles?: string[]; // Added roles to User interface
}

export interface UserStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  currentStreak: number;
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  hasCompletedToday: boolean;
  profileCompletion: number;
  fitnessLevel: string;
  caloriesToday: number;
}

export interface BMIInfo {
  bmi: number | null;
  status:
    | 'underweight'
    | 'normal'
    | 'overweight'
    | 'obese'
    | 'unknown'
    | 'error';
  category: string;
  color: string;
  recommendation: string;
}

export interface Workout {
  id: number;
  userId: number;
  name: string;
  description?: string;
  category?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  bodyFocus?: BodyFocus;
  type?: WorkoutType;
  intensity?: WorkoutIntensity;
  equipment?: Equipment;
  goal?: WorkoutGoal;
  frequency?: WorkoutFrequency;
  isTemplate: boolean;
  templateId?: number; // Only for WorkoutSession, links to its template
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'; // Only for WorkoutSession
  startedAt?: string; // ISO 8601 datetime string
  completedAt?: string; // ISO 8601 datetime string
  durationMinutes?: number;
  caloriesBurned?: number;
  notes?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Appended attributes from backend - now all should be camelCase
  difficultyLabel?: string;
  categoryLabel?: string;
  exerciseCount?: number;
  formattedDuration?: string;
  difficultyInfo?: {
    value: string;
    label: string;
    color: string;
    icon: string;
  };
  categoryInfo?: { value: string; label: string; icon: string; color: string };
  isCustom?: boolean;
  isActive?: boolean;
  estimatedDuration?: number;
  estimatedCalories?: number;
  creatorName?: string;
  usageCount?: number;
  completionRate?: number;
  stats?: {
    // Added stats
    successRate?: number;
    averageDuration?: number;
    totalCompletions?: number;
  };

  // Exercises with flattened pivot data
  exercises?: Exercise[]; // This will contain the pivot data flattened
  orderedExercises?: Exercise[]; // Same as exercises, explicitly named for clarity from backend
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate?: string; // Aligned with backend
  status: 'active' | 'completed' | 'paused';
  category?: string; // Added from backend
  createdAt: string;
  updatedAt: string;

  // Appended attributes from backend - now all should be camelCase
  progressPercentage?: number;
  isAchieved?: boolean;
  daysRemaining?: number;
}

export interface CalendarTask {
  id: number;
  userId: number;
  title: string;
  description?: string;
  taskDate: string; // Aligned with backend
  reminderTime?: string; // Aligned with backend
  taskType:
    | 'workout'
    | 'meal'
    | 'reminder'
    | 'goal'
    | 'rest'
    | 'nutrition'
    | 'other';
  isCompleted: boolean; // Aligned with backend
  workoutPlanId?: number;
  priority?: 'high' | 'medium' | 'low';
  duration?: number; // in minutes
  tags?: string[];
  recurring?: boolean;
  recurringType?: string;
  recurringEndDate?: string; // ISO 8601 date string
  createdAt: string;
  updatedAt: string;

  // Appended attributes from backend - now all should be camelCase
  isToday?: boolean;
  isOverdue?: boolean;
  isFuture?: boolean;
  daysUntil?: number;
  formattedDate?: string;
  formattedTime?: string;
  priorityLabel?: string;
  typeLabel?: string;

  // Keep frontend's 'status' if it's an abstraction, but make it optional
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface WorkoutExercise {
  workoutId: number;
  exerciseId: number;
  orderIndex: number;
  // Planned values
  sets?: number;
  reps?: number;
  durationSeconds?: number;
  restTimeSeconds?: number;
  targetWeight?: number;
  notes?: string;
  // Actual values
  completedSets?: number;
  completedReps?: number;
  actualDurationSeconds?: number;
  weightUsed?: number;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Appended attributes from backend - now all should be camelCase
  completionPercentage?: number;
  isPartiallyCompleted?: boolean;
  formattedDuration?: string;
  formattedRestTime?: string;

  // Exercise details if loaded - now all should be camelCase
  exerciseName?: string;
  exerciseBodyPart?: string;
  exerciseDifficulty?: string;
  exerciseDescription?: string;
  exerciseCategory?: string;
}

export interface UserExerciseProgress {
  id: number; // Assuming an ID for this model
  userId: number;
  exerciseId: number;
  maxWeight?: number;
  maxReps?: number;
  maxDurationSeconds?: number;
  totalSessions?: number;
  totalSets?: number;
  totalReps?: number;
  totalDurationSeconds?: number;
  totalCaloriesBurned?: number;
  currentWeight?: number;
  currentReps?: number;
  currentDurationSeconds?: number;
  lastPerformed?: string; // ISO 8601 date string
  streakDays?: number;
  averageEffortLevel?: number;
  currentDifficultyLevel?: string;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Appended attributes from backend - now all should be camelCase
  averagePerformance?: {
    // Changed from average_performance
    averageWeight: number;
    averageReps: number;
    averageDuration: number;
    averageCalories: number;
  };
  daysSinceLastPerformed?: number;
  consistencyScore?: number;
  maxDurationMinutes?: number;
  totalDurationMinutes?: number;
}

// =============================================
// OTHER INTERFACES (from shared/index.ts)
// =============================================

export interface ExerciseFilters {
  search?: string;
  bodyPart?: string;
  difficulty?: string;
  category?: string;
  duration?: string;
  equipment?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}
export interface ExerciseStats {
  totalExercises: number;
  byBodyPart: Array<{
    bodyPart: string;
    count: number;
  }>;
  byDifficulty: Array<{
    difficulty: string;
    count: number;
  }>;
  withVideos: number;
  avgDuration: number;
}

// WorkoutPlan and WorkoutSession are replaced by Workout interface
// WorkoutTemplate extends Workout (formerly WorkoutPlan)
export interface WorkoutTemplate extends Workout {
  // Additional template-specific properties
  estimatedCalories?: number;
  targetAudience?: string;
  tags?: string[];
  creatorName?: string;
  usageCount?: number;
  completionRate?: number;
  stats?: {
    // Added stats
    successRate?: number;
    averageDuration?: number;
    totalCompletions?: number;
  };
}

export interface CreateWorkoutRequest {
  name: string;
  description?: string;
  category: 'strength' | 'cardio' | 'hiit' | 'flexibility' | string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | string;
  isPublic?: boolean;
  exercises: Array<{
    exerciseId: number;
    orderIndex: number;
    sets?: number;
    reps?: number;
    durationSeconds?: number;
    restTimeSeconds?: number;
    targetWeight?: number;
    notes?: string;
  }>;
}

export interface Milestone {
  id: number;
  goalId?: number;
  title: string;
  description?: string;
  targetValue: number;
  targetDate: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt?: string;
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  points?: number;
}

export interface Challenge {
  id: number;
  name: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  duration: number;
  target: number;
  unit: string;
  reward: string;
  rewardPoints: number;
  participantsCount: number;
  participants: number;
  maxParticipants?: number;
  isJoined: boolean;
  isCompleted: boolean;
  currentProgress: number;
  progress: number;
  maxProgress: number;
  image?: string;
  status:
    | 'draft'
    | 'available'
    | 'active'
    | 'completed'
    | 'expired'
    | 'paused'
    | 'cancelled';
  startDate: string;
  endDate: string;
  tasks: Task[];
  createdAt?: string;
  updatedAt?: string;
  author?: User; // Added for consistency with mock data
  // Enhanced properties
  tags?: string[];
  requirements?: string[];
  isPublic?: boolean;
}

export interface LeaderboardEntry {
  id: number;
  userId?: number;
  userName?: string;
  name: string;
  score: number;
  points: number;
  rank: number;
  profilePictureUrl?: string;
  avatar?: string;
  progress?: number;
  isCurrentUser?: boolean;
  challengesWon?: number;
  streak?: number;
  badges?: string[];
  totalChallenges?: number;
  level?: number;
}

// =============================================
// API INTERFACES (from shared/index.ts)
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number;
    to: number;
    hasMorePages: boolean;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  acceptTerms: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// =============================================
// UI STATE INTERFACES (from shared/index.ts)
// =============================================

export interface WorkoutState {
  currentWorkout: Workout | null; // Changed from WorkoutPlan to Workout
  currentSession: Workout | null; // Changed from WorkoutSession to Workout
  currentExerciseIndex: number;
  isWorkoutActive: boolean;
  isPaused: boolean;
  isRestTime: boolean;
  exerciseTimer: number;
  restTimer: number;
  totalTimer: number;
}

export interface WorkoutFilters {
  activeFilter: 'all' | 'strength' | 'cardio' | 'flexibility' | 'hiit';
  activeDifficultyFilter: 'all' | 'beginner' | 'intermediate' | 'advanced';
  sortBy: 'name' | 'duration' | 'difficulty' | 'calories';
}

// =============================================
// NEW INTERFACES FOR WORKOUT SERVICE
// =============================================

export interface LogWorkoutRequest {
  templateId?: number;
  name: string;
  durationMinutes: number;
  caloriesBurned?: number;
  notes?: string;
  completedAt?: string;
  category?: 'strength' | 'cardio' | 'hiit' | 'flexibility';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  exercises?: {
    exerciseId: number;
    orderIndex?: number;
    sets?: number;
    reps?: number;
    durationSeconds?: number;
    restTimeSeconds?: number;
    targetWeight?: number;
    notes?: string;
  }[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  currentStreak: number;
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  averageDuration: number;
  favoriteCategory: string;
  lastWorkoutDate?: string;
}

// =============================================
// NEW INTERFACES FOR CALENDAR SERVICE
// =============================================

export interface CalendarEventFilters {
  taskType?: string;
  isCompleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
  month?: number;
  year?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface CalendarStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  tasksByType: {
    workout: number;
    goal: number;
    rest: number;
    nutrition: number;
    other: number;
  };
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface MonthlyCalendarData {
  tasks: CalendarTask[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    totalWorkouts: number;
    totalWorkoutHours: number;
    tasksByType: {
      workout: number;
      goal: number;
      rest: number;
      nutrition: number;
      other: number;
    };
    tasksByPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  month: number;
  year: number;
}

export interface WeeklyCalendarData {
  tasks: CalendarTask[];
  tasksByDay: { [key: string]: CalendarTask[] };
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    workouts: number;
    goals: number;
    daysWithTasks: number;
  };
  weekStart: string;
  weekEnd: string;
}

export interface BulkUpdateRequest {
  taskIds: number[];
  action: 'complete' | 'incomplete' | 'delete' | 'update_priority';
  priority?: 'low' | 'medium' | 'high';
}

// =============================================
// UTILITY TYPES (from shared/index.ts)
// =============================================

export type ExerciseBodyPart =
  | 'chest'
  | 'back'
  | 'arms'
  | 'legs'
  | 'shoulders'
  | 'abs'
  | 'cardio'
  | 'mobility';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'hiit'
  | 'yoga';
export type ExerciseSortField =
  | 'name'
  | 'difficulty'
  | 'duration'
  | 'bodyPart'
  | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export enum WorkoutType {
  Strength = 'strength',
  Cardio = 'cardio',
  HIIT = 'hiit',
  Flexibility = 'flexibility',
  Custom = 'custom',
}

export enum WorkoutGoal {
  MuscleGain = 'muscle_gain',
  FatLoss = 'fat_loss',
  Endurance = 'endurance',
  StrengthGain = 'strength_gain',
  Maintenance = 'maintenance',
}

export enum WorkoutFrequency {
  Once = 'once',
  Twice = 'twice',
  Thrice = 'thrice',
  FourTimes = 'four_times',
  FiveTimes = 'five_times',
  SixTimes = 'six_times',
  Everyday = 'everyday',
}

export enum WorkoutIntensity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum BodyFocus {
  FullBody = 'full_body',
  UpperBody = 'upper_body',
  LowerBody = 'lower_body',
  Core = 'core',
}

export enum Equipment {
  None = 'none',
  Dumbbells = 'dumbbells',
  Barbell = 'barbell',
  Kettlebell = 'kettlebell',
  ResistanceBands = 'resistance_bands',
  FullGym = 'full_gym',
}

// Type guards
export function isExercise(obj: any): obj is Exercise {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.bodyPart === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(obj.difficulty)
  );
}

export function isExerciseArray(obj: any): obj is Exercise[] {
  return Array.isArray(obj) && obj.every(isExercise);
}

// =============================================
// CHALLENGE TYPE DEFINITIONS
// =============================================

export type ChallengeCategory =
  | 'fitness'
  | 'wellness'
  | 'cardio'
  | 'strength'
  | 'nutrition'
  | 'mindfulness'
  | 'social'
  | 'flexibility'
  | 'endurance'
  | 'balance';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export type ChallengeStatus =
  | 'draft'
  | 'available'
  | 'active'
  | 'completed'
  | 'expired'
  | 'paused'
  | 'cancelled';

export interface UserChallengeData {
  id: string;
  userId: number;
  challengeId: number;
  progress: number;
  points: number;
  status: 'active' | 'completed' | 'paused' | 'failed' | 'dropped';
  rank?: number;
  completedTasks: number;
  totalTasks: number;
  joinedAt: string;
  lastActivity: string;
  completedAt?: string;
  notes?: string[];
}

export interface ChallengeStatistics {
  totalChallenges: number;
  activeChallenges: number;
  completedChallenges: number;
  draftChallenges: number;
  totalParticipants: number;
  uniqueParticipants: number;
  totalPoints: number;
  averageCompletionRate: number;
  averageDuration: number;
  popularCategories: CategoryStats[];
  weeklyActivity: ActivityData[];
}

export interface CategoryStats {
  category: ChallengeCategory;
  label: string;
  count: number;
  completionRate: number;
  averagePoints: number;
  averageDuration: number;
  popularityTrend: 'rising' | 'stable' | 'declining';
  participantCount: number;
}

export interface ActivityData {
  date: string;
  challengesStarted: number;
  challengesCompleted: number;
  pointsEarned: number;
  activeUsers: number;
  newUsers: number;
}

export interface ChallengeFilter {
  status?: ChallengeStatus | 'all';
  category?: ChallengeCategory | 'all';
  difficulty?: ChallengeDifficulty | 'all';
  searchTerm?: string;
  sortBy?:
    | 'popularity'
    | 'difficulty'
    | 'endDate'
    | 'startDate'
    | 'reward'
    | 'duration'
    | 'created'
    | 'alphabetical'
    | 'participants'
    | 'completionRate';
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  isJoined?: boolean;
  isFavorite?: boolean;
  createdBy?: number;
}

export interface NotificationPayload {
  id: string;
  type:
    | 'challenge_invitation'
    | 'challenge_reminder'
    | 'challenge_completed'
    | 'milestone_achieved'
    | 'rank_changed'
    | 'friend_joined'
    | 'new_achievement'
    | 'system_update'
    | 'maintenance';
  title: string;
  message: string;
  data?: any;
  userId: number;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'challenges' | 'social' | 'achievements' | 'system' | 'updates';
}

// =============================================
// WORKOUT CONTEXT (Moved from workout.model.ts)
// =============================================
export interface WorkoutContext {
  hasWorkoutToday: boolean;
  workoutType?: string;
  workoutDuration?: number;
  estimatedCaloriesBurned?: number;
  isPreWorkout?: boolean;
  isPostWorkout?: boolean;
}

// challenges.service.ts - Enhanced Data Management Service
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';

import {
  Challenge,
  Task,
  User,
  UserChallengeData,
  LeaderboardEntry,
  ChallengeStatistics,
  CategoryStats,
  ActivityData,
  ChallengeFilter,
  ChallengeCategory
} from '../Interfaces/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ChallengesService {
  private challengesSubject = new BehaviorSubject<Challenge[]>([]);
  private userChallengesSubject = new BehaviorSubject<UserChallengeData[]>([]);
  private leaderboardSubject = new BehaviorSubject<LeaderboardEntry[]>([]);
  private statisticsSubject = new BehaviorSubject<ChallengeStatistics | null>(null);

  public challenges$ = this.challengesSubject.asObservable();
  public userChallenges$ = this.userChallengesSubject.asObservable();
  public leaderboard$ = this.leaderboardSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  private readonly STORAGE_KEYS = {
    challenges: 'fitness_challenges',
    userChallenges: 'user_challenges',
    favorites: 'challenge_favorites',
    preferences: 'challenge_preferences'
  };

  constructor() {
    this.loadInitialData();
  }

  // =============================================
  // CHALLENGE MANAGEMENT
  // =============================================

  getChallenges(filter?: ChallengeFilter): Observable<Challenge[]> {
    return this.challenges$.pipe(
      map(challenges => this.applyFilters(challenges, filter))
    );
  }

  getChallengeById(id: number): Observable<Challenge | null> {
    return this.challenges$.pipe(
      map(challenges => challenges.find(c => c.id === id) || null)
    );
  }

  createChallenge(challengeData: Partial<Challenge>): Observable<Challenge> {
    return of(challengeData).pipe(
      delay(1000), // Simulate API delay
      map(data => {
        const newChallenge: Challenge = {
          id: Date.now(),
          name: data.title || '',
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'fitness',
          difficulty: data.difficulty || 'easy',
          duration: this.calculateDuration(data.startDate!, data.endDate!),
          target: data.target || 1,
          unit: data.unit || '',
          reward: `${data.rewardPoints} points`,
          rewardPoints: data.rewardPoints || 100,
          participantsCount: 1,
          participants: 1,
          maxParticipants: data.maxParticipants,
          isJoined: true,
          isCompleted: false,
          currentProgress: 0,
          progress: 0,
          maxProgress: data.target || 1,
          image: '/assets/images/custom-challenge.jpg',
          status: 'active',
          startDate: data.startDate || new Date().toISOString(),
          endDate: data.endDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          tasks: this.generateDefaultTasks(data),
          isPublic: data.isPublic ?? true,
          author: this.getCurrentUser(),
          tags: this.generateTags(data),
          requirements: []
        };

        const currentChallenges = this.challengesSubject.value;
        this.challengesSubject.next([newChallenge, ...currentChallenges]);
        this.saveToStorage();

        return newChallenge;
      }),
      catchError(error => {
        console.error('Error creating challenge:', error);
        return throwError(() => new Error('Failed to create challenge'));
      })
    );
  }

  updateChallenge(id: number, updates: Partial<Challenge>): Observable<Challenge> {
    return this.challenges$.pipe(
      delay(500),
      map(challenges => {
        const index = challenges.findIndex(c => c.id === id);
        if (index === -1) {
          throw new Error('Challenge not found');
        }

        const updatedChallenge = { ...challenges[index], ...updates };
        const updatedChallenges = [...challenges];
        updatedChallenges[index] = updatedChallenge;

        this.challengesSubject.next(updatedChallenges);
        this.saveToStorage();

        return updatedChallenge;
      }),
      catchError(error => {
        console.error('Error updating challenge:', error);
        return throwError(() => new Error('Failed to update challenge'));
      })
    );
  }

  deleteChallenge(id: number): Observable<boolean> {
    return of(true).pipe(
      delay(500),
      map(() => {
        const currentChallenges = this.challengesSubject.value;
        const filteredChallenges = currentChallenges.filter(c => c.id !== id);
        this.challengesSubject.next(filteredChallenges);
        this.saveToStorage();
        return true;
      }),
      catchError(error => {
        console.error('Error deleting challenge:', error);
        return throwError(() => new Error('Failed to delete challenge'));
      })
    );
  }

  // =============================================
  // USER CHALLENGE INTERACTIONS
  // =============================================

  joinChallenge(challengeId: number): Observable<UserChallengeData> {
    return of(challengeId).pipe(
      delay(800),
      map(id => {
        // Update challenge participants
        const challenges = this.challengesSubject.value;
        const challengeIndex = challenges.findIndex(c => c.id === id);
        
        if (challengeIndex === -1) {
          throw new Error('Challenge not found');
        }

        const challenge = challenges[challengeIndex];
        if (challenge.maxParticipants && challenge.participants >= challenge.maxParticipants) {
          throw new Error('Challenge is full');
        }

        // Update challenge
        challenge.participants += 1;
        challenge.isJoined = true;
        challenge.status = 'active';
        challenges[challengeIndex] = challenge;
        this.challengesSubject.next([...challenges]);

        // Create user challenge data
        const userChallengeData: UserChallengeData = {
          id: Date.now().toString(), // Unique ID for the user challenge entry
          userId: this.getCurrentUser().id,
          challengeId: id,
          progress: 0,
          points: 0,
          status: 'active',
          completedTasks: 0,
          totalTasks: challenge.tasks ? challenge.tasks.length : 0,
          joinedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };

        const currentUserChallenges = this.userChallengesSubject.value;
        this.userChallengesSubject.next([...currentUserChallenges, userChallengeData]);
        
        this.saveToStorage();
        return userChallengeData;
      }),
      catchError(error => {
        console.error('Error joining challenge:', error);
        return throwError(() => new Error('Failed to join challenge'));
      })
    );
  }

  leaveChallenge(challengeId: number): Observable<boolean> {
    return of(challengeId).pipe(
      delay(500),
      map(id => {
        // Update challenge participants
        const challenges = this.challengesSubject.value;
        const challengeIndex = challenges.findIndex(c => c.id === id);
        
        if (challengeIndex !== -1) {
          const challenge = challenges[challengeIndex];
          challenge.participants = Math.max(0, challenge.participants - 1);
          challenge.isJoined = false;
          challenge.status = 'available';
          challenge.currentProgress = 0;
          challenge.progress = 0;
          challenges[challengeIndex] = challenge;
          this.challengesSubject.next([...challenges]);
        }

        // Remove user challenge data
        const currentUserChallenges = this.userChallengesSubject.value;
        const filteredUserChallenges = currentUserChallenges.filter(
          uc => uc.challengeId !== id
        );
        this.userChallengesSubject.next(filteredUserChallenges);
        
        this.saveToStorage();
        return true;
      }),
      catchError(error => {
        console.error('Error leaving challenge:', error);
        return throwError(() => new Error('Failed to leave challenge'));
      })
    );
  }

  updateProgress(challengeId: number, progressData: Partial<UserChallengeData>): Observable<UserChallengeData> {
    return of(progressData).pipe(
      delay(300),
      map(data => {
        // Update user challenge data
        const userChallenges = this.userChallengesSubject.value;
        const userChallengeIndex = userChallenges.findIndex(
          uc => uc.challengeId === challengeId && uc.userId === this.getCurrentUser().id
        );

        if (userChallengeIndex === -1) {
          throw new Error('User challenge not found');
        }

        const userChallenge = { 
          ...userChallenges[userChallengeIndex], 
          ...data,
          lastActivity: new Date().toISOString()
        };

        // Check if challenge is completed
        if (userChallenge.progress >= 100) {
          userChallenge.status = 'completed';
          userChallenge.completedAt = new Date().toISOString();
        }

        userChallenges[userChallengeIndex] = userChallenge;
        this.userChallengesSubject.next([...userChallenges]);

        // Update challenge progress
        const challenges = this.challengesSubject.value;
        const challengeIndex = challenges.findIndex(c => c.id === challengeId);
        
        if (challengeIndex !== -1) {
          const challenge = challenges[challengeIndex];
          challenge.currentProgress = Math.round((userChallenge.progress / 100) * challenge.target);
          challenge.progress = challenge.currentProgress;
          
          if (userChallenge.status === 'completed') {
            challenge.isCompleted = true;
            challenge.status = 'completed';
          }
          
          challenges[challengeIndex] = challenge;
          this.challengesSubject.next([...challenges]);
        }

        this.saveToStorage();
        this.updateStatistics();
        
        return userChallenge;
      }),
      catchError(error => {
        console.error('Error updating progress:', error);
        return throwError(() => new Error('Failed to update progress'));
      })
    );
  }

  // =============================================
  // LEADERBOARD & STATISTICS
  // =============================================

  getLeaderboard(challengeId?: number): Observable<LeaderboardEntry[]> {
    return this.leaderboard$.pipe(
      map(leaderboard => {
        if (challengeId) {
          // Filter leaderboard for specific challenge
          return leaderboard.filter(entry => 
            this.userChallengesSubject.value.some(uc => 
              uc.userId === entry.id && uc.challengeId === challengeId
            )
          );
        }
        return leaderboard;
      })
    );
  }

  getStatistics(): Observable<ChallengeStatistics> {
    return this.statistics$.pipe(
      map(stats => {
        if (!stats) {
          return this.calculateStatistics();
        }
        return stats;
      })
    );
  }

  getUserChallengeData(challengeId: number): Observable<UserChallengeData | null> {
    return this.userChallenges$.pipe(
      map(userChallenges => 
        userChallenges.find(uc => 
          uc.challengeId === challengeId && uc.userId === this.getCurrentUser().id
        ) || null
      )
    );
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private loadInitialData(): void {
    // Load from localStorage or generate mock data
    const savedChallenges = this.getFromStorage<Challenge[]>(this.STORAGE_KEYS.challenges);
    const savedUserChallenges = this.getFromStorage<UserChallengeData[]>(this.STORAGE_KEYS.userChallenges);

    this.challengesSubject.next(Array.isArray(savedChallenges) ? savedChallenges : this.generateMockChallenges());
    this.userChallengesSubject.next(Array.isArray(savedUserChallenges) ? savedUserChallenges : []);

    this.leaderboardSubject.next(this.generateMockLeaderboard());
    this.updateStatistics();
  }

  private applyFilters(challenges: Challenge[], filter?: ChallengeFilter): Challenge[] {
    if (!filter) return challenges;

    let filtered = [...challenges];

    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(c => c.status === filter.status);
    }

    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter(c => c.category === filter.category);
    }

    if (filter.difficulty && filter.difficulty !== 'all') {
      filtered = filtered.filter(c => c.difficulty === filter.difficulty);
    }

    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm) ||
        c.category.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (filter.sortBy) {
          case 'popularity':
            comparison = b.participants - a.participants;
            break;
          case 'difficulty':
            const diffOrder = { easy: 1, medium: 2, hard: 3 };
            comparison = diffOrder[b.difficulty] - diffOrder[a.difficulty];
            break;
          case 'endDate':
            comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            break;
          case 'reward':
            comparison = b.rewardPoints - a.rewardPoints;
            break;
          default:
            comparison = 0;
        }

        return filter.sortOrder === 'desc' ? comparison : -comparison;
      });
    }

    return filtered;
  }

  private calculateStatistics(): ChallengeStatistics {
    const challenges = this.challengesSubject.value;
    const userChallenges = this.userChallengesSubject.value;

    const totalChallenges = challenges.length;
    const activeChallenges = challenges.filter(c => c.status === 'active').length;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const totalParticipants = challenges.reduce((sum, c) => sum + c.participants, 0);
    const totalPoints = userChallenges.reduce((sum, uc) => sum + uc.points, 0);
    
    const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

    // Calculate category statistics
    const categoryStats: CategoryStats[] = this.calculateCategoryStats(challenges, userChallenges);

    // Generate weekly activity data
    const weeklyActivity: ActivityData[] = this.generateWeeklyActivity();

    const statistics: ChallengeStatistics = {
      totalChallenges,
      activeChallenges,
      completedChallenges,
      draftChallenges: 0, // Placeholder
      totalParticipants,
      uniqueParticipants: 0, // Placeholder
      totalPoints,
      averageCompletionRate: completionRate,
      averageDuration: 0, // Placeholder
      popularCategories: categoryStats,
      weeklyActivity
    };

    this.statisticsSubject.next(statistics);
    return statistics;
  }

  private calculateCategoryStats(challenges: Challenge[], userChallenges: UserChallengeData[]): CategoryStats[] {
    const categoryMap = new Map<string, { count: number; completed: number; totalPoints: number }>();

    challenges.forEach(challenge => {
      const existing = categoryMap.get(challenge.category) || { count: 0, completed: 0, totalPoints: 0 };
      existing.count++;

      const userChallenge = userChallenges.find(uc => uc.challengeId === challenge.id);
      if (userChallenge) {
        if (userChallenge.status === 'completed') {
          existing.completed++;
        }
        existing.totalPoints += userChallenge.points;
      }

      categoryMap.set(challenge.category, existing);
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category: category as ChallengeCategory,
      label: category, // Placeholder, ideally map to a proper label
      count: stats.count,
      completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
      averagePoints: stats.count > 0 ? stats.totalPoints / stats.count : 0,
      averageDuration: 0, // Placeholder
      popularityTrend: 'stable', // Placeholder
      participantCount: 0 // Placeholder
    }));
  }

  private generateWeeklyActivity(): ActivityData[] {
    const activity: ActivityData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      activity.push({
        date: date.toISOString().split('T')[0],
        challengesStarted: Math.floor(Math.random() * 10) + 1,
        challengesCompleted: Math.floor(Math.random() * 5) + 1,
        pointsEarned: Math.floor(Math.random() * 200) + 50,
        activeUsers: Math.floor(Math.random() * 100) + 10, // Placeholder
        newUsers: Math.floor(Math.random() * 10) + 1 // Placeholder
      });
    }

    return activity;
  }

  private updateStatistics(): void {
    this.calculateStatistics();
  }

  private generateDefaultTasks(challengeData: Partial<Challenge>): Task[] {
    return [
      {
        id: Date.now(),
        title: 'Objectif principal',
        description: `Atteindre ${challengeData.target} ${challengeData.unit}`,
        isCompleted: false,
        currentValue: 0,
        targetValue: challengeData.target || 1,
        unit: challengeData.unit || '',
        points: challengeData.rewardPoints || 100
      }
    ];
  }

  private generateTags(challengeData: Partial<Challenge>): string[] {
    const tags = [challengeData.category || 'fitness', challengeData.difficulty || 'easy'];
    
    if (challengeData.duration && challengeData.duration <= 7) {
      tags.push('court-terme');
    } else if (challengeData.duration && challengeData.duration >= 30) {
      tags.push('long-terme');
    }

    return tags;
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getCurrentUser(): User {
    return {
      id: 2,
      name: 'Alex Warrior',
      email: 'alex@example.com',
      avatar: '/assets/avatars/user2.jpg',
      level: 15,
      totalPoints: 2100,
      rank: 2,
      joinDate: '2024-01-15',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    };
  }

  private generateMockChallenges(): Challenge[] {
    // Return the same mock data structure as before
    const now = new Date();
    const getDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 1,
        name: '30 jours de méditation',
        title: '30 jours de méditation quotidienne',
        description: 'Méditer pendant 10 minutes chaque jour pendant 30 jours pour améliorer votre bien-être mental et réduire le stress',
        category: 'mindfulness',
        difficulty: 'easy',
        duration: 30,
        target: 30,
        unit: 'jours',
        reward: '150 points + Badge Zen Master',
        rewardPoints: 150,
        participantsCount: 2847,
        participants: 2847,
        maxParticipants: undefined,
        isJoined: true,
        isCompleted: false,
        currentProgress: 18,
        progress: 18,
        maxProgress: 30,
        image: '/assets/images/meditation-challenge.jpg',
        status: 'active',
        startDate: getDate(-18).toISOString(),
        endDate: getDate(12).toISOString(),
        createdAt: getDate(-20).toISOString(),
        tasks: [],
        isPublic: true,
        author: this.getCurrentUser(),
        tags: ['mindfulness', 'easy', 'well-being']
      }
      // Add more mock challenges as needed...
    ];
  }

  private generateMockLeaderboard(): LeaderboardEntry[] {
    return [
      {
        id: 1,
        name: 'Sarah Champion',
        avatar: '/assets/avatars/user1.jpg',
        points: 2450,
        progress: 95,
        rank: 1,
        score: 2450,
        challengesWon: 18,
        streak: 67,
        badges: ['🏆', '🔥', '💪', '🧠'],
        totalChallenges: 22,
        level: 20
      },
      {
        id: 2,
        name: 'Alex Warrior',
        avatar: '/assets/avatars/user2.jpg',
        points: 2100,
        progress: 87,
        rank: 2,
        score: 2100,
        isCurrentUser: true,
        challengesWon: 14,
        streak: 45,
        badges: ['🔥', '💪', '🧠'],
        totalChallenges: 18,
        level: 15
      }
      // Add more leaderboard entries...
    ];
  }

  private saveToStorage(): void {
    this.setToStorage(this.STORAGE_KEYS.challenges, this.challengesSubject.value);
    this.setToStorage(this.STORAGE_KEYS.userChallenges, this.userChallengesSubject.value);
  }

  private getFromStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Failed to load ${key} from storage:`, error);
      return null;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to storage:`, error);
    }
  }
}
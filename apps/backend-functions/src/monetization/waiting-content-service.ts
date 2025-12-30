import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import {
  WaitingContentType,
  LanguageLesson,
  CulturalInsight,
  FoodCulture,
  LocalTips,
  MovingChecklist,
  DesignInspiration,
  WaitingContentProgress,
  ACHIEVEMENT_BADGES,
} from '@house-finder/domain';

/**
 * Waiting Content Service
 * Manages engaging content for users while they search for homes
 */
export class WaitingContentService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    this.firestore = admin.firestore();
  }

  /**
   * Get personalized content recommendations
   */
  async getRecommendedContent(
    userId: string,
    limit = 5
  ): Promise<Array<{ type: WaitingContentType; content: any }>> {
    try {
      const userProgress = await this.getUserProgress(userId);
      const userProfile = await this.firestore.collection('users').doc(userId).get();
      const savedSearches = await this.firestore
        .collection('savedSearches')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      // Determine user's target location
      let targetCity: string | undefined;
      let targetCountry: string | undefined;

      if (!savedSearches.empty) {
        const search = savedSearches.docs[0].data();
        targetCity = search.location?.city;
        targetCountry = search.location?.country;
      }

      const recommendations: Array<{ type: WaitingContentType; content: any }> = [];

      // Language lessons (if targeting foreign location)
      if (targetCountry && targetCountry !== 'USA') {
        const lessons = await this.getLanguageLessons(targetCountry, 2);
        lessons.forEach(lesson => {
          recommendations.push({
            type: WaitingContentType.LANGUAGE_LESSON,
            content: lesson,
          });
        });
      }

      // Cultural insights
      if (targetCountry) {
        const insights = await this.getCulturalInsights(targetCountry, targetCity, 2);
        insights.forEach(insight => {
          recommendations.push({
            type: WaitingContentType.CULTURAL_INSIGHT,
            content: insight,
          });
        });
      }

      // Local tips (if city known)
      if (targetCity) {
        const tips = await this.getLocalTips(targetCity, 2);
        tips.forEach(tip => {
          recommendations.push({
            type: WaitingContentType.LOCAL_TIPS,
            content: tip,
          });
        });
      }

      // Moving checklist (always relevant)
      const checklistItems = await this.getMovingChecklist(2);
      checklistItems.forEach(item => {
        recommendations.push({
          type: WaitingContentType.MOVING_TIP,
          content: item,
        });
      });

      // Design inspiration
      const designs = await this.getDesignInspiration(2);
      designs.forEach(design => {
        recommendations.push({
          type: WaitingContentType.DESIGN_INSPIRATION,
          content: design,
        });
      });

      // Shuffle and limit
      return this.shuffleArray(recommendations).slice(0, limit);
    } catch (error) {
      logger.error('Failed to get recommended content', { userId, error });
      return [];
    }
  }

  /**
   * Get language lessons for a country
   */
  async getLanguageLessons(
    country: string,
    limit = 5
  ): Promise<LanguageLesson[]> {
    try {
      const languageMap: Record<string, string> = {
        Germany: 'German',
        Spain: 'Spanish',
        France: 'French',
        Italy: 'Italian',
        Portugal: 'Portuguese',
        Netherlands: 'Dutch',
        // Add more mappings
      };

      const language = languageMap[country];
      if (!language) {
        return [];
      }

      const lessonsSnapshot = await this.firestore
        .collection('waiting_content_language')
        .where('language', '==', language)
        .limit(limit)
        .get();

      return lessonsSnapshot.docs.map(doc => doc.data() as LanguageLesson);
    } catch (error) {
      logger.error('Failed to get language lessons', { country, error });
      return [];
    }
  }

  /**
   * Get cultural insights
   */
  async getCulturalInsights(
    country: string,
    city?: string,
    limit = 5
  ): Promise<CulturalInsight[]> {
    try {
      let query = this.firestore
        .collection('waiting_content_culture')
        .where('country', '==', country);

      if (city) {
        query = query.where('city', '==', city);
      }

      const snapshot = await query.limit(limit).get();
      return snapshot.docs.map(doc => doc.data() as CulturalInsight);
    } catch (error) {
      logger.error('Failed to get cultural insights', { country, error });
      return [];
    }
  }

  /**
   * Get local tips
   */
  async getLocalTips(city: string, limit = 5): Promise<LocalTips[]> {
    try {
      const snapshot = await this.firestore
        .collection('waiting_content_tips')
        .where('city', '==', city)
        .orderBy('upvotes', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as LocalTips);
    } catch (error) {
      logger.error('Failed to get local tips', { city, error });
      return [];
    }
  }

  /**
   * Get moving checklist items
   */
  async getMovingChecklist(limit = 10): Promise<MovingChecklist[]> {
    try {
      const snapshot = await this.firestore
        .collection('waiting_content_moving')
        .orderBy('recommendedWeeksBefore', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as MovingChecklist);
    } catch (error) {
      logger.error('Failed to get moving checklist', { error });
      return [];
    }
  }

  /**
   * Get design inspiration
   */
  async getDesignInspiration(limit = 5): Promise<DesignInspiration[]> {
    try {
      const snapshot = await this.firestore
        .collection('waiting_content_design')
        .orderBy('saves', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data() as DesignInspiration);
    } catch (error) {
      logger.error('Failed to get design inspiration', { error });
      return [];
    }
  }

  /**
   * Complete language lesson
   */
  async completeLesson(userId: string, lessonId: string, score: number): Promise<void> {
    try {
      const progressRef = this.firestore.collection('waiting_content_progress').doc(userId);
      const progressDoc = await progressRef.get();

      const progress = progressDoc.exists
        ? (progressDoc.data() as WaitingContentProgress)
        : {
            userId,
            languagePoints: 0,
            lessonsCompleted: [],
            currentStreak: 0,
            longestStreak: 0,
            articlesRead: [],
            recipiesTried: [],
            tipsBookmarked: [],
            designsSaved: [],
            checklistItems: [],
            totalPoints: 0,
            badges: [],
            favoriteContentTypes: [],
            lastActive: new Date(),
            createdAt: new Date(),
          };

      // Add lesson to completed
      if (!progress.lessonsCompleted.includes(lessonId)) {
        progress.lessonsCompleted.push(lessonId);
        progress.languagePoints += 10;
        progress.totalPoints += 10;

        // Update streak
        const today = new Date().toDateString();
        const lastActive = progress.lastActive.toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActive === yesterday.toDateString()) {
          progress.currentStreak += 1;
        } else if (lastActive !== today) {
          progress.currentStreak = 1;
        }

        progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
        progress.lastActive = new Date();

        // Check for badges
        await this.checkAndAwardBadges(userId, progress);

        // Save progress
        await progressRef.set({
          ...progress,
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      logger.info('Lesson completed', { userId, lessonId, score });
    } catch (error) {
      logger.error('Failed to complete lesson', { userId, lessonId, error });
    }
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<WaitingContentProgress> {
    try {
      const progressDoc = await this.firestore
        .collection('waiting_content_progress')
        .doc(userId)
        .get();

      if (!progressDoc.exists) {
        // Create new progress
        const newProgress: WaitingContentProgress = {
          userId,
          languagePoints: 0,
          lessonsCompleted: [],
          currentStreak: 0,
          longestStreak: 0,
          articlesRead: [],
          recipiesTried: [],
          tipsBookmarked: [],
          designsSaved: [],
          checklistItems: [],
          totalPoints: 0,
          badges: [],
          favoriteContentTypes: [],
          lastActive: new Date(),
          createdAt: new Date(),
        };

        await this.firestore.collection('waiting_content_progress').doc(userId).set({
          ...newProgress,
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return newProgress;
      }

      return progressDoc.data() as WaitingContentProgress;
    } catch (error) {
      logger.error('Failed to get user progress', { userId, error });
      throw error;
    }
  }

  /**
   * Check and award achievement badges
   */
  private async checkAndAwardBadges(
    userId: string,
    progress: WaitingContentProgress
  ): Promise<void> {
    const newBadges: Array<{ id: string; earnedAt: Date }> = [];

    // Polyglot: 10 lessons
    if (progress.lessonsCompleted.length >= 10 && !this.hasBadge(progress, 'polyglot')) {
      newBadges.push({ id: 'polyglot', earnedAt: new Date() });
      progress.totalPoints += ACHIEVEMENT_BADGES.POLYGLOT.points;
    }

    // Cultural Explorer: 20 articles
    if (progress.articlesRead.length >= 20 && !this.hasBadge(progress, 'cultural_explorer')) {
      newBadges.push({ id: 'cultural_explorer', earnedAt: new Date() });
      progress.totalPoints += ACHIEVEMENT_BADGES.CULTURAL_EXPLORER.points;
    }

    // Streak Master: 7-day streak
    if (progress.currentStreak >= 7 && !this.hasBadge(progress, 'streak_master')) {
      newBadges.push({ id: 'streak_master', earnedAt: new Date() });
      progress.totalPoints += ACHIEVEMENT_BADGES.STREAK_MASTER.points;
    }

    // Home Chef: 5 recipes
    if (progress.recipiesTried.length >= 5 && !this.hasBadge(progress, 'home_chef')) {
      newBadges.push({ id: 'home_chef', earnedAt: new Date() });
      progress.totalPoints += ACHIEVEMENT_BADGES.HOME_CHEF.points;
    }

    // Local Expert: 15 bookmarks
    if (progress.tipsBookmarked.length >= 15 && !this.hasBadge(progress, 'local_expert')) {
      newBadges.push({ id: 'local_expert', earnedAt: new Date() });
      progress.totalPoints += ACHIEVEMENT_BADGES.LOCAL_EXPERT.points;
    }

    // Design Guru: 10 designs saved
    if (progress.designsSaved.length >= 10 && !this.hasBadge(progress, 'design_guru')) {
      newBadges.push({ id: 'design_guru', earnedAt: new Date() });
      progress.totalPoints += ACHIEVEMENT_BADGES.DESIGN_GURU.points;
    }

    if (newBadges.length > 0) {
      progress.badges.push(...newBadges);
      logger.info('Badges awarded', { userId, badges: newBadges.map(b => b.id) });
    }
  }

  private hasBadge(progress: WaitingContentProgress, badgeId: string): boolean {
    return progress.badges.some(b => b.id === badgeId);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Singleton instance
export const waitingContentService = new WaitingContentService();

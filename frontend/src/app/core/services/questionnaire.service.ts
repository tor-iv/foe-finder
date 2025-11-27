import { Injectable, inject } from '@angular/core';
import { Question } from '../models/questionnaire.model';
import { Answer } from '../models/response.model';
import { AuthService } from './auth.service';

/**
 * NYC Neighborhood type representing personality match results
 */
export interface NYCNeighborhood {
  id: string;
  name: string;
  description: string;
  traits: string[];
  vibe: string;
}

/**
 * QuestionnaireService - Manages questionnaire questions and responses
 *
 * This service:
 * 1. Provides the list of questions for the quiz
 * 2. Stores responses in localStorage (for now)
 * 3. Calculates NYC neighborhood personality match based on answers
 *
 * The neighborhood calculation uses a simple algorithm that maps answer patterns
 * to different NYC neighborhoods. This is a placeholder that can be refined later.
 */
@Injectable({ providedIn: 'root' })
export class QuestionnaireService {
  private authService = inject(AuthService);

  // Storage key for responses
  private readonly RESPONSES_KEY = 'nemesis_finder_responses';

  /**
   * NYC Neighborhoods with their characteristics
   *
   * Each neighborhood represents a "personality type" based on quiz answers.
   * The mapping considers factors like:
   * - Political stance (questions 1, 4, 6)
   * - Values (questions 2, 7, 9)
   * - Lifestyle preferences (questions 3, 8)
   * - Personal preferences (questions 5, 10)
   */
  private neighborhoods: NYCNeighborhood[] = [
    {
      id: 'williamsburg',
      name: 'Williamsburg',
      description: 'You\'re a creative soul who values authenticity and self-expression. You appreciate both the old and new, mixing vintage finds with cutting-edge trends.',
      traits: ['Creative', 'Trendy', 'Independent', 'Artistic'],
      vibe: 'Artisanal coffee, vinyl records, and rooftop views'
    },
    {
      id: 'upper-east-side',
      name: 'Upper East Side',
      description: 'You appreciate tradition, refinement, and the finer things in life. You value stability and have high standards for quality.',
      traits: ['Traditional', 'Refined', 'Ambitious', 'Cultured'],
      vibe: 'Museum Mile, classic architecture, and elegant brunches'
    },
    {
      id: 'east-village',
      name: 'East Village',
      description: 'You\'re a free spirit who values individuality and isn\'t afraid to challenge conventions. Night owl energy with a rebellious streak.',
      traits: ['Rebellious', 'Artistic', 'Night Owl', 'Eclectic'],
      vibe: 'Live music, dive bars, and late-night pizza'
    },
    {
      id: 'park-slope',
      name: 'Park Slope',
      description: 'You value community, family, and quality of life. Progressive values meet practical living in your world.',
      traits: ['Family-oriented', 'Progressive', 'Foodie', 'Community-minded'],
      vibe: 'Farmers markets, stroller-friendly streets, and co-ops'
    },
    {
      id: 'soho',
      name: 'SoHo',
      description: 'You have an eye for style and appreciate luxury and aesthetics. You\'re drawn to beautiful things and curated experiences.',
      traits: ['Fashion-forward', 'Luxury-loving', 'Aesthetic', 'Trendsetting'],
      vibe: 'Designer boutiques, art galleries, and cobblestone streets'
    },
    {
      id: 'astoria',
      name: 'Astoria',
      description: 'You\'re practical, community-minded, and appreciate diversity. You value genuine connections and good food over flash.',
      traits: ['Diverse', 'Community-minded', 'Practical', 'Food-loving'],
      vibe: 'International cuisines, beer gardens, and neighborhood pride'
    },
    {
      id: 'bushwick',
      name: 'Bushwick',
      description: 'You\'re avant-garde and resourceful, making something from nothing. DIY spirit meets creative ambition.',
      traits: ['Avant-garde', 'Budget-conscious', 'DIY', 'Experimental'],
      vibe: 'Street art, warehouse parties, and creative collectives'
    },
    {
      id: 'financial-district',
      name: 'Financial District',
      description: 'You\'re driven, efficient, and value your time. Career-focused with an appreciation for urban convenience.',
      traits: ['Career-driven', 'Efficient', 'Urban', 'Ambitious'],
      vibe: 'Skyscrapers, power lunches, and waterfront views'
    }
  ];

  /**
   * Sample questionnaire questions
   *
   * Each question uses a 1-7 scale where:
   * 1 = Strongly Disagree
   * 7 = Strongly Agree
   *
   * Questions are designed to reveal personality traits that map to neighborhoods
   */
  private sampleQuestions: Question[] = [
    {
      id: 1,
      text: 'Government should play a major role in regulating businesses',
      category: 'politics',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 1
    },
    {
      id: 2,
      text: 'Traditional family values are essential to society',
      category: 'values',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 2
    },
    {
      id: 3,
      text: 'I prefer spontaneous activities over planned ones',
      category: 'lifestyle',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 3
    },
    {
      id: 4,
      text: 'Environmental protection should be prioritized over economic growth',
      category: 'politics',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 4
    },
    {
      id: 5,
      text: 'I enjoy trying new and exotic foods',
      category: 'preferences',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 5
    },
    {
      id: 6,
      text: 'People should rely more on themselves than on government assistance',
      category: 'politics',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 6
    },
    {
      id: 7,
      text: 'Art and culture are essential parts of a good life',
      category: 'values',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 7
    },
    {
      id: 8,
      text: 'I prefer city living to rural living',
      category: 'lifestyle',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 8
    },
    {
      id: 9,
      text: 'Science and reason should guide most decisions',
      category: 'values',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 9
    },
    {
      id: 10,
      text: 'I enjoy quiet evenings at home more than social gatherings',
      category: 'preferences',
      scaleMinLabel: 'Strongly Disagree',
      scaleMaxLabel: 'Strongly Agree',
      order: 10
    }
  ];

  /**
   * Get all questionnaire questions
   */
  getQuestions(): Question[] {
    return this.sampleQuestions;
  }

  /**
   * Get all NYC neighborhoods
   */
  getNeighborhoods(): NYCNeighborhood[] {
    return this.neighborhoods;
  }

  /**
   * Get a specific neighborhood by ID
   */
  getNeighborhoodById(id: string): NYCNeighborhood | undefined {
    return this.neighborhoods.find(n => n.id === id);
  }

  /**
   * Submit questionnaire response and calculate neighborhood
   *
   * @param answers - Array of question answers with values 1-7
   * @returns The matched NYC neighborhood
   */
  async submitResponse(answers: Answer[]): Promise<NYCNeighborhood> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to submit responses');
    }

    // Store response in localStorage
    const response = {
      userId: user.uid,
      questionnaireId: 'default-v1',
      questionnaireVersion: 1,
      answers: answers,
      submittedAt: new Date().toISOString(),
      source: 'web'
    };

    localStorage.setItem(this.RESPONSES_KEY, JSON.stringify(response));

    // Calculate neighborhood match
    const neighborhood = this.calculateNeighborhood(answers);

    // Store the result
    localStorage.setItem('nemesis_finder_neighborhood', neighborhood.id);

    // Mark questionnaire as complete in auth service
    this.authService.markQuestionnaireComplete();

    return neighborhood;
  }

  /**
   * Get the user's last calculated neighborhood
   */
  getStoredNeighborhood(): NYCNeighborhood | null {
    const neighborhoodId = localStorage.getItem('nemesis_finder_neighborhood');
    if (neighborhoodId) {
      return this.getNeighborhoodById(neighborhoodId) || null;
    }
    return null;
  }

  /**
   * Calculate NYC neighborhood based on quiz answers
   *
   * This is a placeholder algorithm that creates a "personality profile"
   * from the answers and maps it to a neighborhood. The algorithm considers:
   *
   * - Progressive vs Traditional (questions 1, 2, 4, 6)
   * - Artistic vs Practical (questions 3, 7, 9)
   * - Social vs Introverted (questions 5, 8, 10)
   *
   * Each neighborhood has a "profile" and we find the best match.
   *
   * TODO: Refine this algorithm with more sophisticated matching
   */
  calculateNeighborhood(answers: Answer[]): NYCNeighborhood {
    // Create a map of questionId to value for easy lookup
    const answerMap = new Map<number, number>();
    answers.forEach(a => answerMap.set(a.questionId, a.value));

    // Calculate dimension scores (normalized to 0-100)
    // Higher scores indicate more progressive/artistic/social

    // Progressive score: questions 1 (+), 2 (-), 4 (+), 6 (-)
    const progressiveScore = this.normalizeScore([
      answerMap.get(1) || 4,           // Government regulation (+)
      8 - (answerMap.get(2) || 4),     // Traditional values (inverted)
      answerMap.get(4) || 4,           // Environment (+)
      8 - (answerMap.get(6) || 4)      // Self-reliance (inverted)
    ]);

    // Artistic score: questions 3 (+), 7 (+), 9 (-)
    const artisticScore = this.normalizeScore([
      answerMap.get(3) || 4,           // Spontaneous (+)
      answerMap.get(7) || 4,           // Art & culture (+)
      8 - (answerMap.get(9) || 4)      // Science/reason (inverted for artistic)
    ]);

    // Social score: questions 5 (+), 8 (+), 10 (-)
    const socialScore = this.normalizeScore([
      answerMap.get(5) || 4,           // Trying new foods (+)
      answerMap.get(8) || 4,           // City living (+)
      8 - (answerMap.get(10) || 4)     // Quiet evenings (inverted)
    ]);

    // Map scores to neighborhoods
    // Each neighborhood has a profile: [progressive, artistic, social]
    const neighborhoodProfiles: { [key: string]: [number, number, number] } = {
      'williamsburg': [70, 85, 65],      // Progressive, very artistic, moderately social
      'upper-east-side': [30, 50, 60],   // Traditional, moderate art, social
      'east-village': [80, 90, 80],      // Very progressive, very artistic, very social
      'park-slope': [75, 55, 50],        // Progressive, moderate art, family-focused
      'soho': [50, 80, 70],              // Moderate politics, very aesthetic, social
      'astoria': [60, 45, 75],           // Moderate, practical, very social
      'bushwick': [85, 95, 60],          // Very progressive, extremely artistic, moderate social
      'financial-district': [35, 25, 55] // Conservative, practical, moderate social
    };

    // Find closest match using Euclidean distance
    let bestMatch = 'williamsburg';
    let bestDistance = Infinity;

    for (const [id, profile] of Object.entries(neighborhoodProfiles)) {
      const distance = Math.sqrt(
        Math.pow(progressiveScore - profile[0], 2) +
        Math.pow(artisticScore - profile[1], 2) +
        Math.pow(socialScore - profile[2], 2)
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = id;
      }
    }

    return this.getNeighborhoodById(bestMatch) || this.neighborhoods[0];
  }

  /**
   * Normalize an array of 1-7 scores to a single 0-100 value
   */
  private normalizeScore(values: number[]): number {
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    // Convert 1-7 scale to 0-100
    return ((avg - 1) / 6) * 100;
  }

  /**
   * Check if user has completed the questionnaire
   */
  hasUserCompletedQuestionnaire(): boolean {
    return localStorage.getItem(this.RESPONSES_KEY) !== null;
  }
}

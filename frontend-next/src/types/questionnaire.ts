export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  questions: Question[];
}

export interface Question {
  id: number;
  text: string;
  category: 'social' | 'lifestyle' | 'opinions';
  scaleMinLabel: string;
  scaleMaxLabel: string;
  order: number;
}

export interface Answer {
  questionId: number;
  value: number; // 1-7 scale
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  answers: Answer[];
  submittedAt: Date;
}

/**
 * A user's extreme opinion that stands out
 */
export interface HotTake {
  questionId: number;
  questionText: string;
  value: number;
  intensity: number; // How extreme (distance from middle)
  stance: 'strongly_agree' | 'agree' | 'neutral' | 'disagree' | 'strongly_disagree';
}

/**
 * Statistical outlier - opinion that differs from population mean
 */
export interface OutlierAnswer {
  questionId: number;
  questionText: string;
  userValue: number;
  populationMean: number;
  stdDev: number;
  percentileRank: number;
  isTopOutlier: boolean;
  isBottomOutlier: boolean;
  responseCount: number;
}

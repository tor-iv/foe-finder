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
  scaleMinLabel: string;  // e.g., "Strongly Disagree"
  scaleMaxLabel: string;  // e.g., "Strongly Agree"
  order: number;
}

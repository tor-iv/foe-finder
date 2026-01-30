import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { Question, Answer, HotTake } from '@/types';

// Storage keys
const RESPONSES_KEY = 'foe_finder_responses';

// All 30 questions from the Angular app
const QUESTIONS: Question[] = [
  { id: 1, text: 'Typing "..." is more threatening than a period', category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 1 },
  { id: 2, text: "I've screenshot texts to send to the group chat", category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 2 },
  { id: 3, text: 'Couples who share a social media account are hiding something', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 3 },
  { id: 4, text: 'People who back into parking spots are trying too hard', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 4 },
  { id: 5, text: "I've rewatched the same show 5+ times instead of starting something new", category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 5 },
  { id: 6, text: "Watching someone's story without following them is research, not stalking", category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 6 },
  { id: 7, text: "I've rehearsed a conversation in the shower", category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 7 },
  { id: 8, text: "Leaving someone on 'delivered' is a power move", category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 8 },
  { id: 9, text: "I've judged someone's bookshelf", category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 9 },
  { id: 10, text: "People who say 'let's hang soon!' never mean it", category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 10 },
  { id: 11, text: "I've pretended my phone died to avoid a situation", category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 11 },
  { id: 12, text: 'Eating alone in public is underrated', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 12 },
  { id: 13, text: "I've bought something just because the packaging was cute", category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 13 },
  { id: 14, text: 'Main character syndrome is fine actually', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 14 },
  { id: 15, text: 'Read receipts should be illegal', category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 15 },
  { id: 16, text: 'I think about texts I sent 3 years ago', category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 16 },
  { id: 17, text: "I've deleted an app just to avoid someone", category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 17 },
  { id: 18, text: 'Watching TV on 1.5x speed is valid', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 18 },
  { id: 19, text: "I've said 'let's do this again' knowing I never would", category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 19 },
  { id: 20, text: 'Standing at concerts is overrated', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 20 },
  { id: 21, text: 'Dating apps have actually improved dating', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 21 },
  { id: 22, text: "It's okay to end things over text", category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 22 },
  { id: 23, text: 'Going to bed before 11pm is peak adulthood', category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 23 },
  { id: 24, text: 'Voice notes over 30 seconds are inconsiderate', category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 24 },
  { id: 25, text: 'Brunch is just expensive breakfast with permission to drink', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 25 },
  { id: 26, text: 'Therapy speak has ruined normal conversations', category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 26 },
  { id: 27, text: "You should be embarrassed if you can't cook by 25", category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 27 },
  { id: 28, text: 'Remote work is making us worse at being people', category: 'opinions', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 28 },
  { id: 29, text: 'Being single in your late 20s is underrated', category: 'lifestyle', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 29 },
  { id: 30, text: 'LinkedIn is just Facebook for people in denial', category: 'social', scaleMinLabel: 'Strongly Disagree', scaleMaxLabel: 'Strongly Agree', order: 30 },
];

export function useQuestionnaire() {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getQuestions = useCallback(() => QUESTIONS, []);

  const submitResponses = useCallback(
    async (answers: Answer[]): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }

      setIsSubmitting(true);

      try {
        // Format for Supabase
        const responsesData = answers.map((a) => ({
          questionId: a.questionId,
          value: a.value,
        }));

        // Save to Supabase
        const { error } = await supabase
          .from('questionnaire_responses')
          .upsert(
            {
              user_id: user.uid,
              responses: responsesData,
              submitted_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;

        // Save to localStorage as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            RESPONSES_KEY,
            JSON.stringify({
              userId: user.uid,
              answers,
              submittedAt: new Date().toISOString(),
            })
          );
        }

        // Refresh user to update hasCompletedQuestionnaire
        await refreshUser();

        return { success: true };
      } catch (error) {
        console.error('Error submitting questionnaire:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to submit',
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, refreshUser]
  );

  const getStoredResponses = useCallback((): Answer[] | null => {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(RESPONSES_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      return data.answers || null;
    } catch {
      return null;
    }
  }, []);

  const getHotTakes = useCallback((count: number = 3): HotTake[] => {
    const responses = getStoredResponses();
    if (!responses) return [];

    const withExtremeness = responses
      .map((r) => {
        const question = QUESTIONS.find((q) => q.id === r.questionId);
        return {
          questionId: r.questionId,
          questionText: question?.text || '',
          value: r.value,
          intensity: Math.abs(r.value - 4),
          stance: getStance(r.value),
        };
      })
      .filter((r) => r.questionText && r.intensity >= 2);

    withExtremeness.sort((a, b) => b.intensity - a.intensity);

    return withExtremeness.slice(0, count);
  }, [getStoredResponses]);

  const clearResponses = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RESPONSES_KEY);
    }
  }, []);

  return {
    questions: QUESTIONS,
    totalQuestions: QUESTIONS.length,
    getQuestions,
    submitResponses,
    getStoredResponses,
    getHotTakes,
    clearResponses,
    isSubmitting,
  };
}

function getStance(value: number): HotTake['stance'] {
  if (value === 7) return 'strongly_agree';
  if (value === 6) return 'agree';
  if (value === 1) return 'strongly_disagree';
  if (value === 2) return 'disagree';
  return 'neutral';
}

export { QUESTIONS };

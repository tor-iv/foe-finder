import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Question, Answer, HotTake } from '@/types';

// Local cache key — resilience against a dropped connection mid-quiz, not
// the source of truth (the DB is, via /api/questionnaire).
const RESPONSES_KEY = 'foe_finder_responses';

interface RawQuestion {
  id: number;
  text: string;
  category: 'social' | 'lifestyle' | 'opinions';
  sortOrder: number;
}

function toQuestion(raw: RawQuestion): Question {
  return {
    id: raw.id,
    text: raw.text,
    category: raw.category,
    scaleMinLabel: 'Strongly Disagree',
    scaleMaxLabel: 'Strongly Agree',
    order: raw.sortOrder,
  };
}

export function useQuestionnaire() {
  const { user, refreshUser } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/questionnaire');
        if (!res.ok) throw new Error('Failed to load questions');
        const data = await res.json();
        if (!cancelled) {
          setQuestions((data.questions as RawQuestion[]).map(toQuestion));
        }
      } catch (error) {
        console.error('Error loading questionnaire:', error);
      } finally {
        if (!cancelled) setIsLoadingQuestions(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const getQuestions = useCallback(() => questions, [questions]);

  const submitResponses = useCallback(
    async (answers: Answer[]): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Must be logged in' };
      }

      setIsSubmitting(true);

      try {
        const res = await fetch('/api/questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to submit');
        }

        // Cache locally so getHotTakes() works without a round-trip
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

  const getHotTakes = useCallback(
    (count: number = 3): HotTake[] => {
      const responses = getStoredResponses();
      if (!responses) return [];

      const withExtremeness = responses
        .map((r) => {
          const question = questions.find((q) => q.id === r.questionId);
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
    },
    [getStoredResponses, questions]
  );

  const clearResponses = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RESPONSES_KEY);
    }
  }, []);

  return {
    questions,
    totalQuestions: questions.length,
    isLoadingQuestions,
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

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useQuestionnaire } from '@/hooks/use-questionnaire';
import { Answer } from '@/types';
import { questionSlide, springs, fadeInUp } from '@/lib/animations';

export default function QuestionnairePage() {
  const router = useRouter();
  const { questions, submitResponses, isSubmitting } = useQuestionnaire();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [hasInteracted, setHasInteracted] = useState(false);
  const [direction, setDirection] = useState(0);

  // Refs for slider (uncontrolled for Safari performance)
  const sliderRef = useRef<HTMLInputElement>(null);
  const sliderValueRef = useRef(50); // Track value in ref, not state
  const thumbRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canProceed = hasInteracted || answers.has(currentQuestion.id);

  // Convert 0-100 slider to 1-7 scale
  const toScale7 = (value: number) => Math.round((value / 100) * 6) + 1;
  const fromScale7 = (value: number) => ((value - 1) / 6) * 100;

  // Immediate DOM update using transforms only (Safari optimized)
  const updateSliderVisuals = useCallback((value: number) => {
    const containerWidth = containerWidthRef.current;
    const thumbWidth = window.innerWidth >= 768 ? 24 : 32;

    if (thumbRef.current && containerWidth > 0) {
      const px = (value / 100) * containerWidth - thumbWidth / 2;
      thumbRef.current.style.left = '0';
      thumbRef.current.style.transform = `translateX(${px}px) translateY(-50%)`;
    }
    if (fillRef.current) {
      fillRef.current.style.transform = `scaleX(${value / 100})`;
    }
  }, []);

  // Cache container width on mount/resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        containerWidthRef.current = containerRef.current.offsetWidth;
        updateSliderVisuals(sliderValueRef.current);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [updateSliderVisuals]);

  // Sync slider DOM + ref when navigating questions
  const syncSlider = useCallback((value: number, interacted: boolean) => {
    sliderValueRef.current = value;
    if (sliderRef.current) {
      sliderRef.current.value = String(value);
    }
    updateSliderVisuals(value);
    setHasInteracted(interacted);
  }, [updateSliderVisuals]);

  const saveCurrentAnswer = useCallback(() => {
    if (hasInteracted) {
      const scale7Value = toScale7(sliderValueRef.current);
      setAnswers((prev) => new Map(prev).set(currentQuestion.id, scale7Value));
    }
  }, [currentQuestion.id, hasInteracted]);

  const goToNext = useCallback(() => {
    saveCurrentAnswer();
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);

      const nextQuestionId = questions[currentIndex + 1].id;
      const existingAnswer = answers.get(nextQuestionId);
      if (existingAnswer) {
        syncSlider(fromScale7(existingAnswer), true);
      } else {
        syncSlider(50, false);
      }
    }
  }, [currentIndex, questions, answers, saveCurrentAnswer, syncSlider]);

  const goToPrevious = useCallback(() => {
    saveCurrentAnswer();
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);

      const prevQuestionId = questions[currentIndex - 1].id;
      const existingAnswer = answers.get(prevQuestionId);
      if (existingAnswer) {
        syncSlider(fromScale7(existingAnswer), true);
      } else {
        syncSlider(50, false);
      }
    }
  }, [currentIndex, questions, answers, saveCurrentAnswer, syncSlider]);

  const handleSubmit = useCallback(async () => {
    saveCurrentAnswer();

    const finalAnswers: Answer[] = [];
    answers.forEach((value, questionId) => {
      finalAnswers.push({ questionId, value });
    });

    if (hasInteracted && !answers.has(currentQuestion.id)) {
      finalAnswers.push({
        questionId: currentQuestion.id,
        value: toScale7(sliderValueRef.current),
      });
    }

    const result = await submitResponses(finalAnswers);
    if (result.success) {
      router.push('/record-intro');
    }
  }, [
    answers,
    currentQuestion.id,
    hasInteracted,
    saveCurrentAnswer,
    submitResponses,
    router,
  ]);

  // Handle swipe gestures
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 50;
    if (info.offset.x < -threshold && canProceed && !isLastQuestion) {
      goToNext();
    } else if (info.offset.x > threshold && currentIndex > 0) {
      goToPrevious();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Unified Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="win95-panel py-3 px-4"
      >
        <div className="max-w-2xl mx-auto">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display font-black text-base md:text-lg uppercase tracking-wide">
              Opinion Extraction Protocol
            </h1>
            <span className="font-mono font-bold text-sm md:text-base">
              {currentIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-4 md:h-5 border-2 border-win95-darkShadow bg-win95-shadow/30 overflow-hidden">
            <motion.div
              className="h-full bg-foe-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={springs.smooth}
            />
          </div>

          {/* Tagline */}
          <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-2 uppercase tracking-wider">
            Answer honestly • The Algorithm sees all
          </p>
        </div>
      </motion.header>

      {/* Question Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={questionSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              dragListener={false}
              className="win95-panel"
            >
              {/* Question Text - drag enabled here only */}
              <motion.h2
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="text-lg md:text-2xl font-display font-bold text-center mb-6 md:mb-8 leading-relaxed cursor-grab active:cursor-grabbing"
              >
                {currentQuestion.text}
              </motion.h2>

              {/* Slider Container - NO drag interference */}
              <div className="bg-win95-shadow/30 border-2 md:border-[3px] border-win95-darkShadow p-4 md:p-6 mx-0 md:mx-4">
                {/* Scale Labels */}
                <div className="flex justify-between gap-2 md:gap-4 mb-4 md:mb-6">
                  <span className="text-[9px] md:text-sm font-bold uppercase tracking-wide bg-win95-face px-1 py-1 md:px-3 md:py-1.5 border-2 border-win95-darkShadow text-center max-w-[45%] md:max-w-none">
                    {currentQuestion.scaleMinLabel}
                  </span>
                  <span className="text-[9px] md:text-sm font-bold uppercase tracking-wide bg-win95-face px-1 py-1 md:px-3 md:py-1.5 border-2 border-win95-darkShadow text-center max-w-[45%] md:max-w-none">
                    {currentQuestion.scaleMaxLabel}
                  </span>
                </div>

                {/* Custom Slider - Safari optimized */}
                <div
                  ref={containerRef}
                  className="relative h-[42px] md:h-[48px]"
                  style={{ touchAction: 'manipulation', contain: 'layout paint' }}
                >
                  {/* Track Background */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[10px] md:h-[12px] border-2 border-win95-darkShadow bg-win95-face">
                    {/* Track Fill - uses scaleX for GPU-only updates */}
                    <div
                      ref={fillRef}
                      className="absolute left-0 top-0 bottom-0 bg-foe-accent origin-left will-change-transform"
                      style={{ width: '100%', transform: 'scaleX(0.5)' }}
                    />
                  </div>

                  {/* Thumb - uses translateX for GPU-only updates */}
                  <div
                    ref={thumbRef}
                    className="absolute top-1/2 w-8 h-8 md:w-6 md:h-6 bg-foe-accent border-2 md:border-[3px] border-win95-darkShadow outline outline-1 md:outline-2 outline-offset-1 md:outline-offset-2 outline-win95-darkShadow/30 pointer-events-none will-change-transform"
                    style={{ left: '50%', transform: 'translateX(-50%) translateY(-50%)' }}
                  />

                  {/* Native Range Input (uncontrolled for Safari performance) */}
                  <input
                    ref={sliderRef}
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={50}
                    onInput={(e) => {
                      const value = Number(e.currentTarget.value);
                      sliderValueRef.current = value;
                      updateSliderVisuals(value);
                      setHasInteracted(true);
                    }}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    style={{ opacity: 0.0001, WebkitAppearance: 'none' }}
                    aria-label={currentQuestion.text}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            className="flex flex-col sm:flex-row justify-between mt-6 gap-2 sm:gap-4"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="win95-btn px-6 py-3 min-h-[48px] uppercase tracking-wide font-bold disabled:opacity-40 order-2 sm:order-1 w-full sm:w-auto border-2 border-win95-darkShadow bg-win95-shadow/30"
            >
              Previous
            </button>

            {isLastQuestion ? (
              <motion.button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className="win95-btn win95-btn-primary px-8 py-3 min-h-[48px] uppercase tracking-[2px] font-bold disabled:opacity-40 order-1 sm:order-2 w-full sm:w-auto"
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit to the Algorithm'}
              </motion.button>
            ) : (
              <motion.button
                onClick={goToNext}
                disabled={!canProceed}
                className="win95-btn win95-btn-primary px-8 py-3 min-h-[48px] uppercase tracking-[2px] font-bold disabled:opacity-40 order-1 sm:order-2 w-full sm:w-auto"
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

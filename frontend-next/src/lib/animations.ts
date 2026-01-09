import { Variants, Transition } from 'framer-motion';

// ==============================================
// Spring Configurations
// ==============================================

export const springs = {
  // Smooth, natural feeling
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as const,

  // Bouncy, playful
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  } as const,

  // Snappy, responsive
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 25,
  } as const,

  // Gentle, slow
  gentle: {
    type: 'spring',
    stiffness: 150,
    damping: 20,
  } as const,

  // For sliders/dragging
  slider: {
    type: 'spring',
    stiffness: 700,
    damping: 30,
  } as const,
} satisfies Record<string, Transition>;

// ==============================================
// Page Transition Variants
// ==============================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export const pageSlide: Variants = {
  initial: {
    opacity: 0,
    x: 50,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: 0.2 },
  },
};

// ==============================================
// Modal/Dialog Variants
// ==============================================

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const slideUp: Variants = {
  initial: {
    opacity: 0,
    y: '100%',
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.2 },
  },
};

// ==============================================
// Card/Item Variants
// ==============================================

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
};

export const revealCard: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    rotateX: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: springs.bouncy,
  },
};

// ==============================================
// Stagger Container
// ==============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

// ==============================================
// Button Variants
// ==============================================

export const buttonPress = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  transition: springs.snappy,
};

// Win95 button doesn't scale, just changes shadow (handled in CSS)
export const win95ButtonTap = {
  scale: 1,
  transition: { duration: 0 },
};

// ==============================================
// Form Variants
// ==============================================

export const shake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

export const inputFocus: Variants = {
  initial: {
    boxShadow: 'var(--shadow-win95-inset)',
  },
  focus: {
    boxShadow: 'var(--shadow-win95-inset), 0 0 0 2px var(--foe-accent)',
  },
};

// ==============================================
// Progress/Loading Variants
// ==============================================

export const progressFill: Variants = {
  initial: { width: '0%' },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: springs.smooth,
  }),
};

export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const spin = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

// ==============================================
// Questionnaire Specific
// ==============================================

export const questionSlide: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

export const sliderThumb = {
  whileDrag: {
    scale: 1.2,
    transition: springs.snappy,
  },
};

// ==============================================
// Results Page Specific
// ==============================================

export const matchReveal: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      ...springs.bouncy,
      duration: 0.6,
    },
  },
};

export const scoreCountUp: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const hotTakeCard: Variants = {
  initial: {
    opacity: 0,
    x: -50,
    rotateY: -15,
  },
  animate: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: springs.bouncy,
  },
};

// ==============================================
// Audio Recording Specific
// ==============================================

export const micPulse = {
  scale: [1, 1.1, 1],
  boxShadow: [
    '0 0 0 0 rgba(204, 0, 0, 0.4)',
    '0 0 0 20px rgba(204, 0, 0, 0)',
    '0 0 0 0 rgba(204, 0, 0, 0)',
  ],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const waveform: Variants = {
  initial: { scaleY: 0.3 },
  animate: {
    scaleY: [0.3, 1, 0.3],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

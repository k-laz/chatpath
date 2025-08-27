'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingTooltipProps {
  show: boolean;
  onDismiss: () => void;
}

export function OnboardingTooltip({ show, onDismiss }: OnboardingTooltipProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to ChatPath! 🌳",
      content: "This is your first conversation node. Try typing a question or message in the input box below.",
      position: { top: '50%', left: '50%', transform: 'translate(-50%, -150px)' }
    },
    {
      title: "Create Your First Branch",
      content: "After I respond, try selecting any text in my message. A blue branch button will appear - click it to create a new conversation thread!",
      position: { top: '50%', left: '50%', transform: 'translate(-50%, -100px)' }
    }
  ];

  useEffect(() => {
    if (!show) setStep(0);
  }, [show]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 p-6 border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {steps[step].title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {steps[step].content}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === step ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Let's Start!
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Skip
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
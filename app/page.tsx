'use client';

import { useState, useEffect } from 'react';
import { ConversationTree } from '@/components/ConversationTree';
import { BranchButton } from '@/components/BranchButton';
import { OnboardingTooltip } from '@/components/OnboardingTooltip';
import { useConversationTree } from '@/hooks/useConversationTree';

export default function Home() {
  const { resetTree, tree } = useConversationTree();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding for first-time users
    const hasSeenOnboarding = localStorage.getItem('chatpath-onboarding-seen');
    if (!hasSeenOnboarding && tree.nodes.length === 1) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tree.nodes.length]);

  const handleReset = () => {
    if (confirm('Are you sure you want to start a new conversation tree? This will clear all current conversations.')) {
      resetTree();
    }
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('chatpath-onboarding-seen', 'true');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <header className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ChatPath
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conversational Tree Interface
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {tree.nodes.length > 1 ? `${tree.nodes.length} conversations` : 'Select any text to create a branch'}
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
            >
              New Tree
            </button>
          </div>
        </div>
      </header>
      
      <main className="pt-16 w-full h-full">
        <ConversationTree />
        <BranchButton />
        <OnboardingTooltip 
          show={showOnboarding} 
          onDismiss={handleDismissOnboarding} 
        />
      </main>
    </div>
  );
}

"use client";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { OnboardingProvider } from "@/hooks/use-onboarding";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <OnboardingProvider>
        <OnboardingFlow />
      </OnboardingProvider>
    </div>
  );
}

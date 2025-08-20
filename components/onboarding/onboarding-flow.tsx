"use client";

import { useOnboarding } from "@/hooks/use-onboarding";
import { RegistrationStep } from "./steps/registration-step";
import { EmailValidationStep } from "./steps/email-validation-step";
import { AccountTypeStep } from "./steps/account-type-step";
import { MetamapStep } from "./steps/metamap-step";
import { SmsValidationStep } from "./steps/sms-validation-step";
import { PinSetupStep } from "./steps/pin-setup-step";
import { CreditCardStep } from "./steps/credit-card-step";
import { CompletedStep } from "./steps/completed-step";
import { OnboardingHeader } from "./onboarding-header";
import { OnboardingProgress } from "./onboarding-progress";

export function OnboardingFlow() {
  const { currentStep, isHydrated } = useOnboarding();

  console.log(
    "[v0] OnboardingFlow rendering with currentStep:",
    currentStep,
    "isHydrated:",
    isHydrated
  );

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <OnboardingHeader />
        <OnboardingProgress />
        <main className="flex-1 px-4 py-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const renderStep = () => {
    console.log("[v0] renderStep called with currentStep:", currentStep);
    switch (currentStep) {
      case "registration":
        return <RegistrationStep />;
      case "email-validation":
        return <EmailValidationStep />;
      case "account-type":
        return <AccountTypeStep />;
      case "metamap-verification":
        return <MetamapStep />;
      case "sms-validation":
        return <SmsValidationStep />;
      case "pin-setup":
        return <PinSetupStep />;
      case "credit-card":
        return <CreditCardStep />;
      case "completed":
        return <CompletedStep />;
      default:
        return <RegistrationStep />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OnboardingProgress />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">{renderStep()}</div>
      </main>
    </div>
  );
}

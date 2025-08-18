"use client"

import { useOnboarding } from "@/hooks/use-onboarding"
import { cn } from "@/lib/utils"

const steps = [
  { key: "registration", label: "Registro" },
  { key: "email-validation", label: "Email" },
  { key: "account-type", label: "Cuenta" },
  { key: "metamap-verification", label: "ID" },
  { key: "sms-validation", label: "SMS" },
  { key: "pin-setup", label: "PIN" },
  { key: "credit-card", label: "Tarjeta" },
]

export function OnboardingProgress() {
  const { currentStep } = useOnboarding()

  const currentIndex = steps.findIndex((step) => step.key === currentStep)
  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="px-4 py-3 bg-card border-b border-border">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            Paso {currentIndex + 1} de {steps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={cn(
                "text-xs text-center flex-1",
                index <= currentIndex ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/hooks/use-onboarding"

export function OnboardingHeader() {
  const { currentStep, previousStep } = useOnboarding()

  const canGoBack = currentStep !== "registration" && currentStep !== "completed"

  const handleClose = () => {
    // En una app móvil, esto cerraría la vista web
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ action: "close" }))
    } else {
      // Fallback para testing en browser
      window.close()
    }
  }

  return (
    <header className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        {canGoBack && (
          <Button variant="ghost" size="sm" onClick={previousStep} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold">Registro</h1>
      </div>

      <Button variant="ghost" size="sm" onClick={handleClose} className="p-2">
        <X className="h-5 w-5" />
      </Button>
    </header>
  )
}

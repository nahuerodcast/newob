"use client"

import { CheckCircle, Sparkles, CreditCard, Shield, Smartphone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/hooks/use-onboarding"

export function CompletedStep() {
  const { clearOnboarding } = useOnboarding()

  const handleFinish = () => {
    // En una app móvil, esto notificaría a la app nativa
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          action: "onboarding_completed",
          success: true,
        }),
      )
    } else {
      // Fallback para testing en browser
      clearOnboarding()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold">¡Registro completado!</h2>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="text-muted-foreground">Tu cuenta ha sido configurada exitosamente</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <h3 className="font-semibold text-primary mb-4">¡Ya puedes usar la app!</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 text-green-500" />
              <span>Cuenta verificada</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Identidad confirmada</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4 text-green-500" />
              <span>Teléfono verificado</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span>Pago configurado</span>
            </div>
          </div>
        </div>

        <Button onClick={handleFinish} className="w-full" size="lg">
          Comenzar a usar la app
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Gracias por completar el proceso de registro. ¡Bienvenido a nuestra plataforma!
      </div>
    </div>
  )
}

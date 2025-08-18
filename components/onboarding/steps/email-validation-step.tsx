"use client"

import { useEffect, useState } from "react"
import { Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useToast } from "@/hooks/use-toast"

export function EmailValidationStep() {
  const { data, nextStep, apiCall, isLoading } = useOnboarding()
  const [isChecking, setIsChecking] = useState(false)
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const userEmail = data.registration?.email

  // Verificar automáticamente el estado del usuario cada 3 segundos
  useEffect(() => {
    if (!userEmail) return

    const checkEmailValidation = async () => {
      try {
        setIsChecking(true)
        const user = await apiCall(`/user/users/${userEmail}`, "GET")

        if (user.userStatus === "Awaiting_Registration_complete") {
          if (checkInterval) {
            clearInterval(checkInterval)
          }
          toast({
            title: "Email verificado",
            description: "Continuando con el siguiente paso...",
          })
          nextStep()
        }
      } catch (error) {
        console.error("Error checking email validation:", error)
        if (error instanceof Error && !error.message.includes("fetch")) {
          toast({
            variant: "destructive",
            title: "Error de verificación",
            description: "Problema al verificar el email. Intenta manualmente.",
          })
        }
      } finally {
        setIsChecking(false)
      }
    }

    // Verificar inmediatamente
    checkEmailValidation()

    // Configurar verificación automática cada 3 segundos
    const interval = setInterval(checkEmailValidation, 3000)
    setCheckInterval(interval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [userEmail, apiCall, nextStep, checkInterval, toast])

  const handleManualCheck = async () => {
    if (!userEmail) return

    try {
      setIsChecking(true)
      const user = await apiCall(`/user/users/${userEmail}`, "GET")

      if (user.userStatus === "Awaiting_Registration_complete") {
        toast({
          title: "Email verificado",
          description: "Continuando con el siguiente paso...",
        })
        nextStep()
      } else {
        toast({
          title: "Email aún no verificado",
          description: "Revisa tu bandeja de entrada y spam.",
        })
      }
    } catch (error) {
      console.error("Error checking email validation:", error)
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: "No se pudo verificar el estado del email.",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Verifica tu email</h2>
          <p className="text-muted-foreground">Hemos enviado un enlace de verificación a</p>
          <p className="font-medium">{userEmail}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Haz clic en el enlace del email para continuar. La verificación se detectará automáticamente.
        </p>

        {isChecking && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Verificando...
          </div>
        )}

        <Button
          onClick={handleManualCheck}
          variant="outline"
          disabled={isLoading || isChecking}
          className="w-full bg-transparent"
        >
          {isChecking ? "Verificando..." : "Verificar ahora"}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        ¿No recibiste el email? Revisa tu carpeta de spam o contacta soporte.
      </div>
    </div>
  )
}

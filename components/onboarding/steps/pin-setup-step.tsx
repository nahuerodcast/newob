"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Lock, Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOnboarding, type pinSchema } from "@/hooks/use-onboarding"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { z } from "zod"

type PinData = z.infer<typeof pinSchema>

const pinSetupSchema = z
  .object({
    pin: z
      .string()
      .length(4, "El PIN debe tener 4 dígitos")
      .regex(/^\d{4}$/, "Solo números permitidos"),
    confirmPin: z
      .string()
      .length(4, "El PIN debe tener 4 dígitos")
      .regex(/^\d{4}$/, "Solo números permitidos"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "Los PINs no coinciden",
    path: ["confirmPin"],
  })

type PinSetupData = z.infer<typeof pinSetupSchema>

export function PinSetupStep() {
  const { updateStepData, nextStep, apiCall, isLoading, setError, data } = useOnboarding()
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PinSetupData>({
    resolver: zodResolver(pinSetupSchema),
  })

  const pin = watch("pin")
  const confirmPin = watch("confirmPin")

  // Manejar input de PIN con auto-focus
  const handlePinInput = (value: string, field: "pin" | "confirmPin") => {
    // Solo permitir números y máximo 4 dígitos
    const numericValue = value.replace(/\D/g, "").slice(0, 4)
    setValue(field, numericValue)

    // Auto-focus al campo de confirmación cuando el PIN esté completo
    if (field === "pin" && numericValue.length === 4) {
      const confirmInput = document.getElementById("confirmPin")
      confirmInput?.focus()
    }
  }

  const onSubmit = async (formData: PinSetupData) => {
    try {
      setError(null)

      const userEmail = data.step1?.email
      if (!userEmail) {
        throw new Error("Email no encontrado")
      }

      await apiCall(`/v1/user/users/${userEmail}`, "PUT", {
        code: formData.pin,
      })

      const pinData: PinData = {
        pin: formData.pin,
      }

      updateStepData("pin", pinData)

      toast({
        title: "PIN configurado",
        description: "Tu PIN personal ha sido configurado exitosamente.",
      })

      nextStep()
    } catch (error) {
      console.error("PIN setup error:", error)
      toast({
        variant: "destructive",
        title: "Error al configurar PIN",
        description: "No se pudo configurar el PIN. Intenta nuevamente.",
      })
    }
  }

  const getPinStrength = (pinValue: string) => {
    if (!pinValue || pinValue.length < 4) return null

    const hasRepeated = /(.)\1{3}/.test(pinValue) // 1111, 2222, etc.
    const isSequential = /0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(pinValue)
    const isCommon = [
      "0000",
      "1234",
      "4321",
      "1111",
      "2222",
      "3333",
      "4444",
      "5555",
      "6666",
      "7777",
      "8888",
      "9999",
    ].includes(pinValue)

    if (hasRepeated || isSequential || isCommon) {
      return { level: "weak", message: "PIN muy fácil de adivinar" }
    }

    return { level: "good", message: "PIN seguro" }
  }

  const pinStrength = getPinStrength(pin)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Configura tu PIN</h2>
        <p className="text-muted-foreground">Crea un PIN de 4 dígitos para acceder a los vehículos</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN de 4 dígitos</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin || ""}
                onChange={(e) => handlePinInput(e.target.value, "pin")}
                className={cn(
                  "text-center text-2xl tracking-[0.5em] font-mono pr-10",
                  errors.pin ? "border-destructive" : "",
                )}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.pin && <p className="text-sm text-destructive">{errors.pin.message}</p>}

            {pinStrength && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    pinStrength.level === "good" ? "bg-green-500" : "bg-yellow-500",
                  )}
                />
                <span
                  className={cn(
                    pinStrength.level === "good"
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400",
                  )}
                >
                  {pinStrength.message}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirmar PIN</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                type={showConfirmPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={confirmPin || ""}
                onChange={(e) => handlePinInput(e.target.value, "confirmPin")}
                className={cn(
                  "text-center text-2xl tracking-[0.5em] font-mono pr-10",
                  errors.confirmPin ? "border-destructive" : "",
                  confirmPin && confirmPin.length === 4 && pin === confirmPin ? "border-green-500" : "",
                )}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
              >
                {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPin && <p className="text-sm text-destructive">{errors.confirmPin.message}</p>}

            {confirmPin && confirmPin.length === 4 && pin === confirmPin && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span>Los PINs coinciden</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Consejos para un PIN seguro:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Evita secuencias como 1234 o 4321</li>
              <li>• No uses números repetidos como 1111</li>
              <li>• No uses fechas obvias como tu año de nacimiento</li>
              <li>• Memoriza tu PIN, no lo escribas</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !pin || !confirmPin || pin.length !== 4 || confirmPin.length !== 4}
          >
            {isLoading ? "Configurando..." : "Configurar PIN"}
          </Button>
        </div>
      </form>

      <div className="text-xs text-muted-foreground text-center">
        Este PIN será necesario para acceder a los vehículos. Manténlo seguro y no lo compartas.
      </div>
    </div>
  )
}

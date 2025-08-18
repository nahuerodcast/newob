"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Smartphone, MessageSquare, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOnboarding, type smsValidationSchema } from "@/hooks/use-onboarding"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"

type SmsValidationData = z.infer<typeof smsValidationSchema>

const phoneSchema = z.object({
  countryCode: z.string().min(1, "Código de país requerido"),
  phoneNumber: z.string().min(6, "Número de teléfono inválido"),
})

const codeSchema = z.object({
  code: z
    .string()
    .length(6, "El código debe tener 6 dígitos")
    .regex(/^\d{6}$/, "Solo números permitidos"),
})

const countryCodes = [
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
]

export function SmsValidationStep() {
  const { data, updateStepData, nextStep, apiCall, isLoading, setError } = useOnboarding()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [sentToNumber, setSentToNumber] = useState<string>("")
  const [countdown, setCountdown] = useState(0)
  const { toast } = useToast()

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: "+54",
      phoneNumber: "",
    },
  })

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
  })

  // Iniciar countdown para reenvío
  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const onPhoneSubmit = async (phoneData: z.infer<typeof phoneSchema>) => {
    try {
      setError(null)
      const fullPhoneNumber = `${phoneData.countryCode}${phoneData.phoneNumber}`

      const userEmail = data.step1?.email
      if (!userEmail) {
        throw new Error("Email no encontrado")
      }

      console.log("[v0] Sending SMS request to:", `/v1/user/users/${userEmail}?onBoardingStepName=PhoneData`)
      console.log("[v0] SMS request data:", { cellNumber: fullPhoneNumber })

      const response = await apiCall(`/v1/user/users/${userEmail}?onBoardingStepName=PhoneData`, "PUT", {
        cellNumber: fullPhoneNumber,
      })

      console.log("[v0] SMS API response:", response)
      console.log("[v0] SMS API response status: SUCCESS")

      setSentToNumber(fullPhoneNumber)
      setStep("code")
      startCountdown()

      toast({
        title: "SMS enviado",
        description: `Código de verificación enviado a ${fullPhoneNumber}`,
      })
    } catch (error) {
      console.error("[v0] SMS send error details:", error)
      console.log("[v0] SMS API response status: ERROR")
      if (error instanceof Error) {
        console.log("[v0] Error message:", error.message)
      }

      toast({
        variant: "destructive",
        title: "Error al enviar SMS",
        description: "No se pudo enviar el código. Verifica el número e intenta nuevamente.",
      })
    }
  }

  const onCodeSubmit = async (codeData: z.infer<typeof codeSchema>) => {
    try {
      setError(null)

      const userEmail = data.step1?.email
      if (!userEmail) {
        throw new Error("Email no encontrado")
      }

      console.log("[v0] Sending code verification to:", `/v1/user/users/${userEmail}`)
      console.log("[v0] Code verification data:", { code: codeData.code })

      const response = await apiCall(`/v1/user/users/${userEmail}`, "PUT", {
        code: codeData.code,
      })

      console.log("[v0] Code verification response:", response)

      // Guardar datos de validación SMS
      const smsData: SmsValidationData = {
        cellNumber: sentToNumber,
        code: codeData.code,
      }

      updateStepData("smsValidation", smsData)

      toast({
        title: "Teléfono verificado",
        description: "Tu número de teléfono ha sido verificado exitosamente.",
      })

      nextStep()
    } catch (error) {
      console.error("[v0] SMS verification error details:", error)
      if (error instanceof Error) {
        console.log("[v0] Verification error message:", error.message)
      }

      toast({
        variant: "destructive",
        title: "Código incorrecto",
        description: "El código ingresado no es válido. Intenta nuevamente.",
      })
    }
  }

  const resendCode = async () => {
    if (countdown > 0) return

    try {
      const userEmail = data.step1?.email
      if (!userEmail) {
        throw new Error("Email no encontrado")
      }

      console.log("[v0] Resending SMS to:", `/v1/user/users/${userEmail}?onBoardingStepName=PhoneData`)
      console.log("[v0] Resend data:", { cellNumber: sentToNumber })

      const response = await apiCall(`/v1/user/users/${userEmail}?onBoardingStepName=PhoneData`, "PUT", {
        cellNumber: sentToNumber,
      })

      console.log("[v0] Resend SMS response:", response)

      startCountdown()
      toast({
        title: "SMS reenviado",
        description: "Se ha enviado un nuevo código de verificación.",
      })
    } catch (error) {
      console.error("[v0] SMS resend error details:", error)
      if (error instanceof Error) {
        console.log("[v0] Resend error message:", error.message)
      }

      toast({
        variant: "destructive",
        title: "Error al reenviar",
        description: "No se pudo reenviar el código. Intenta nuevamente.",
      })
    }
  }

  const goBackToPhone = () => {
    setStep("phone")
    setSentToNumber("")
    setCountdown(0)
    codeForm.reset()
  }

  if (step === "phone") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Verificar teléfono</h2>
          <p className="text-muted-foreground">Ingresa tu número para recibir un código de verificación</p>
        </div>

        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="countryCode">Código de país</Label>
            <Select
              value={phoneForm.watch("countryCode")}
              onValueChange={(value) => phoneForm.setValue("countryCode", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona código de país" />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.code}</span>
                      <span className="text-muted-foreground">{country.country}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {phoneForm.formState.errors.countryCode && (
              <p className="text-sm text-destructive">{phoneForm.formState.errors.countryCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Número de teléfono</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 py-2 border border-input rounded-md bg-muted text-sm min-w-[80px] justify-center">
                {phoneForm.watch("countryCode")}
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="1123456789"
                {...phoneForm.register("phoneNumber")}
                className={phoneForm.formState.errors.phoneNumber ? "border-destructive flex-1" : "flex-1"}
              />
            </div>
            {phoneForm.formState.errors.phoneNumber && (
              <p className="text-sm text-destructive">{phoneForm.formState.errors.phoneNumber.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar código"}
          </Button>
        </form>

        <div className="text-xs text-muted-foreground text-center">
          Recibirás un SMS con un código de 6 dígitos para verificar tu número.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Ingresa el código</h2>
        <p className="text-muted-foreground">Enviamos un código de 6 dígitos a</p>
        <p className="font-medium">{sentToNumber}</p>
      </div>

      <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código de verificación</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            className={`text-center text-lg tracking-widest ${
              codeForm.formState.errors.code ? "border-destructive" : ""
            }`}
            {...codeForm.register("code")}
            autoComplete="one-time-code"
          />
          {codeForm.formState.errors.code && (
            <p className="text-sm text-destructive">{codeForm.formState.errors.code.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verificando..." : "Verificar código"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={resendCode}
            disabled={countdown > 0 || isLoading}
            className="text-sm"
          >
            {countdown > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reenviar en {countdown}s
              </>
            ) : (
              "Reenviar código"
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button type="button" variant="ghost" onClick={goBackToPhone} className="text-sm text-muted-foreground">
            Cambiar número de teléfono
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        ¿No recibiste el SMS? Revisa que el número sea correcto y que tengas señal.
      </div>
    </div>
  )
}

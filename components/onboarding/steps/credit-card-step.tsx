"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreditCard, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { z } from "zod"

const creditCardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Número de tarjeta requerido")
    .regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, "Formato de tarjeta inválido"),
  expiryMonth: z.string().min(1, "Mes requerido"),
  expiryYear: z.string().min(1, "Año requerido"),
  cvv: z
    .string()
    .min(3, "CVV debe tener al menos 3 dígitos")
    .max(4, "CVV debe tener máximo 4 dígitos")
    .regex(/^\d+$/, "Solo números permitidos"),
  cardholderName: z.string().min(1, "Nombre del titular requerido"),
})

type CreditCardData = z.infer<typeof creditCardSchema>

const months = [
  { value: "01", label: "01 - Enero" },
  { value: "02", label: "02 - Febrero" },
  { value: "03", label: "03 - Marzo" },
  { value: "04", label: "04 - Abril" },
  { value: "05", label: "05 - Mayo" },
  { value: "06", label: "06 - Junio" },
  { value: "07", label: "07 - Julio" },
  { value: "08", label: "08 - Agosto" },
  { value: "09", label: "09 - Septiembre" },
  { value: "10", label: "10 - Octubre" },
  { value: "11", label: "11 - Noviembre" },
  { value: "12", label: "12 - Diciembre" },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => {
  const year = currentYear + i
  return { value: year.toString(), label: year.toString() }
})

export function CreditCardStep() {
  const { updateStepData, nextStep, isLoading, setError } = useOnboarding()
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreditCardData>({
    resolver: zodResolver(creditCardSchema),
  })

  const cardNumber = watch("cardNumber")

  // Formatear número de tarjeta
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  // Detectar tipo de tarjeta
  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "")
    if (/^4/.test(cleanNumber)) return "visa"
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard"
    if (/^3[47]/.test(cleanNumber)) return "amex"
    return "unknown"
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setValue("cardNumber", formatted)
  }

  const onSubmit = async (data: CreditCardData) => {
    try {
      setError(null)
      setProcessing(true)

      // Simular procesamiento de tarjeta de crédito
      // En un entorno real, esto se integraría con Stripe, MercadoPago, etc.
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simular validación exitosa
      const success = Math.random() > 0.1 // 90% de éxito para demo

      if (!success) {
        throw new Error("Tarjeta rechazada")
      }

      updateStepData("creditCardCompleted", true)

      toast({
        title: "Tarjeta agregada exitosamente",
        description: "Tu método de pago ha sido configurado.",
      })

      nextStep()
    } catch (error) {
      console.error("Credit card error:", error)
      toast({
        variant: "destructive",
        title: "Error al procesar tarjeta",
        description: "Verifica los datos de tu tarjeta e intenta nuevamente.",
      })
    } finally {
      setProcessing(false)
    }
  }

  const cardType = getCardType(cardNumber || "")

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Agregar tarjeta</h2>
        <p className="text-muted-foreground">Configura tu método de pago para usar la plataforma</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardholderName">Nombre del titular</Label>
          <Input
            id="cardholderName"
            placeholder="Juan Pérez"
            {...register("cardholderName")}
            className={errors.cardholderName ? "border-destructive" : ""}
            autoComplete="cc-name"
          />
          {errors.cardholderName && <p className="text-sm text-destructive">{errors.cardholderName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Número de tarjeta</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardNumber || ""}
              onChange={handleCardNumberChange}
              className={cn(
                "pr-12",
                errors.cardNumber ? "border-destructive" : "",
                cardType !== "unknown" ? "border-green-500" : "",
              )}
              maxLength={19}
              autoComplete="cc-number"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {cardType === "visa" && (
                <div className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">VISA</div>
              )}
              {cardType === "mastercard" && (
                <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">MC</div>
              )}
              {cardType === "amex" && (
                <div className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">AMEX</div>
              )}
            </div>
          </div>
          {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryMonth">Mes</Label>
            <Select onValueChange={(value) => setValue("expiryMonth", value)}>
              <SelectTrigger className={errors.expiryMonth ? "border-destructive" : ""}>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expiryMonth && <p className="text-sm text-destructive">{errors.expiryMonth.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryYear">Año</Label>
            <Select onValueChange={(value) => setValue("expiryYear", value)}>
              <SelectTrigger className={errors.expiryYear ? "border-destructive" : ""}>
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.expiryYear && <p className="text-sm text-destructive">{errors.expiryYear.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              type="password"
              placeholder="123"
              maxLength={4}
              {...register("cvv")}
              className={errors.cvv ? "border-destructive" : ""}
              autoComplete="cc-csc"
            />
            {errors.cvv && <p className="text-sm text-destructive">{errors.cvv.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Información segura</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Tus datos están protegidos con encriptación de nivel bancario
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || processing}>
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </div>
            ) : (
              "Agregar tarjeta"
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Aceptamos:</span>
          <div className="flex gap-2">
            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">VISA</div>
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">MC</div>
            <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">AMEX</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          No se realizarán cargos hasta que uses el servicio. Puedes cambiar tu método de pago en cualquier momento.
        </p>
      </div>
    </div>
  )
}

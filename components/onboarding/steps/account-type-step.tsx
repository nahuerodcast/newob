"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOnboarding, accountTypeSchema } from "@/hooks/use-onboarding"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { z } from "zod"

type AccountTypeData = z.infer<typeof accountTypeSchema>

const countries = [
  "Argentina",
  "Brasil",
  "Chile",
  "Colombia",
  "México",
  "Perú",
  "Uruguay",
  "Paraguay",
  "Bolivia",
  "Ecuador",
]

const argentinaCities = [
  "Capital Federal",
  "Buenos Aires",
  "Córdoba",
  "Rosario",
  "La Plata",
  "Mar del Plata",
  "Mendoza",
  "Tucumán",
  "Salta",
  "Santa Fe",
]

const billingTypes = ["Consumidor Final", "Responsable Inscripto", "Monotributista"] as const

export function AccountTypeStep() {
  const { data, updateStepData, nextStep, apiCall, isLoading, setError } = useOnboarding()
  const [selectedType, setSelectedType] = useState<"persona" | "empresa" | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AccountTypeData>({
    resolver: zodResolver(accountTypeSchema),
    defaultValues: data.accountType || {},
  })

  const accountType = watch("accountType")

  const onSubmit = async (formData: AccountTypeData) => {
    try {
      setError(null)

      console.log("[v0] Account type data:", data)
      console.log("[v0] Registration data:", data.registration)

      const userEmail = data.step1?.email

      if (!userEmail) {
        console.error("[v0] Email not found in data structure:", data)
        throw new Error("Email no encontrado")
      }

      const apiData: any = {
        nationality: formData.nationality,
        identificationNumber: formData.identificationNumber,
      }

      if (formData.accountType === "empresa") {
        // Solo para empresas se envían todos los datos
        apiData.businessName = formData.businessName
        apiData.individualTaxpayerId = formData.individualTaxpayerId
        apiData.billingType = formData.billingType
        apiData.address = formData.address
        apiData.billingAddress = formData.billingAddress
      }

      console.log("[v0] Sending API data:", apiData)
      console.log("[v0] To endpoint:", `/v1/user/users/${userEmail}`)

      await apiCall(`/v1/user/users/${userEmail}`, "PUT", apiData)

      updateStepData("accountType", formData)
      toast({
        title: "Información guardada",
        description: "Continuando con la verificación de identidad...",
      })
      nextStep()
    } catch (error) {
      console.error("Account type error:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar información",
        description: "Por favor verifica los datos e intenta nuevamente.",
      })
    }
  }

  const handleTypeSelection = (type: "persona" | "empresa") => {
    setSelectedType(type)
    setValue("accountType", type)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Tipo de cuenta</h2>
        <p className="text-muted-foreground">Selecciona el tipo de cuenta que deseas crear</p>
      </div>

      {!accountType && (
        <div className="grid grid-cols-1 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedType === "persona" && "ring-2 ring-primary",
            )}
            onClick={() => handleTypeSelection("persona")}
          >
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Cuenta Personal</h3>
                <p className="text-sm text-muted-foreground">Para uso individual</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedType === "empresa" && "ring-2 ring-primary",
            )}
            onClick={() => handleTypeSelection("empresa")}
          >
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Cuenta Empresarial</h3>
                <p className="text-sm text-muted-foreground">Para empresas y organizaciones</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {accountType && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos comunes */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Nacionalidad</Label>
            <Controller
              name="nationality"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.nationality ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecciona tu nacionalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.nationality && <p className="text-sm text-destructive">{errors.nationality.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="identificationNumber">Número de DNI</Label>
            <Input
              id="identificationNumber"
              placeholder="12345678"
              {...register("identificationNumber")}
              className={errors.identificationNumber ? "border-destructive" : ""}
            />
            {errors.identificationNumber && (
              <p className="text-sm text-destructive">{errors.identificationNumber.message}</p>
            )}
          </div>

          {/* Los demás datos se obtendrán después con Metamap según requerimientos originales */}

          {/* Campos específicos para empresa */}
          {accountType === "empresa" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessName">Razón social</Label>
                <Input
                  id="businessName"
                  placeholder="Mi Empresa S.A."
                  {...register("businessName")}
                  className={errors.businessName ? "border-destructive" : ""}
                />
                {errors.businessName && <p className="text-sm text-destructive">{errors.businessName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="individualTaxpayerId">CUIT</Label>
                <Input
                  id="individualTaxpayerId"
                  placeholder="20-12345678-9"
                  {...register("individualTaxpayerId")}
                  className={errors.individualTaxpayerId ? "border-destructive" : ""}
                />
                {errors.individualTaxpayerId && (
                  <p className="text-sm text-destructive">{errors.individualTaxpayerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingType">Tipo de facturación</Label>
                <Controller
                  name="billingType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.billingType ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecciona tipo de facturación" />
                      </SelectTrigger>
                      <SelectContent>
                        {billingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.billingType && <p className="text-sm text-destructive">{errors.billingType.message}</p>}
              </div>

              {/* Dirección fiscal para empresa */}
              <div className="space-y-4">
                <h3 className="font-semibold">Dirección fiscal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress.country">País</Label>
                    <Controller
                      name="billingAddress.country"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona país" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress.town">Ciudad</Label>
                    <Controller
                      name="billingAddress.town"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {argentinaCities.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress.addressLine">Dirección</Label>
                  <Input
                    id="billingAddress.addressLine"
                    placeholder="Av. Corrientes 1234"
                    {...register("billingAddress.addressLine")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress.postcode">Código postal</Label>
                  <Input id="billingAddress.postcode" placeholder="1234" {...register("billingAddress.postcode")} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setValue("accountType", undefined as any)}
              className="flex-1"
            >
              Cambiar tipo
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Guardando..." : "Continuar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

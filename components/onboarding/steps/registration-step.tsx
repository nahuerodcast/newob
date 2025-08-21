"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboarding, registrationSchema } from "@/hooks/use-onboarding";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";

type RegistrationData = z.infer<typeof registrationSchema>;

export function RegistrationStep() {
  const {
    updateStepData,
    nextStep,
    goToStep,
    apiCall,
    isLoading,
    error,
    setError,
  } = useOnboarding();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isManualVerifying, setIsManualVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
  });

  const acceptTerms = watch("acceptTerms");

  const checkEmailVerification = async (email: string) => {
    try {
      console.log("[v0] Checking email verification for:", email);
      const response = await apiCall(`/v1/user/users/${email}`, "GET");
      console.log("[v0] Full user response:", response);
      console.log("[v0] User status check:", response.userStatus);

      if (response.userStatus === "AWAITING_REGISTRATION_COMPLETE") {
        console.log("[v0] Email verified! Advancing to next step...");
        setIsCheckingEmail(false);

        // Los datos de registro ya se guardaron en onSubmit

        toast({
          title: "Email verificado",
          description: "Tu email ha sido verificado exitosamente.",
        });

        // Avanzar directamente al paso "account-type" (saltar la verificación de email)
        setTimeout(() => {
          console.log(
            "[v0] Email already verified, going directly to account-type step..."
          );
          // Ir directamente al paso "account-type" en lugar de "email-validation"
          goToStep("sms-validation");
        }, 1000);

        return true;
      }
      return false;
    } catch (error) {
      console.error("[v0] Error checking email verification:", error);
      toast({
        variant: "destructive",
        title: "Error verificando email",
        description: `Error: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      });
      return false;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCheckingEmail && userEmail) {
      interval = setInterval(async () => {
        const verified = await checkEmailVerification(userEmail);
        if (verified) {
          clearInterval(interval);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckingEmail, userEmail]);

  const onSubmit = async (data: RegistrationData) => {
    try {
      setError(null);
      await apiCall("/v1/user/users", "POST", {
        userEmail: data.email,
        password: data.password,
      });

      // Guardar los datos de registro en el estado del onboarding
      updateStepData("registration", data);

      // Guardar el email en localStorage para uso posterior en Metamap
      localStorage.setItem("userEmail", data.email);

      setUserEmail(data.email);
      setIsRegistered(true);
      setIsCheckingEmail(true);

      toast({
        title: "Cuenta creada exitosamente",
        description: "Revisa tu email para continuar con la verificación.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Error al crear cuenta",
        description: "Por favor intenta nuevamente o contacta soporte.",
      });
    }
  };

  const openTerms = () => {
    window.open("/terms-and-conditions.pdf", "_blank");
  };

  const openEmailApp = () => {
    const emailDomain = userEmail.split("@")[1];
    let emailUrl = "mailto:";

    if (emailDomain?.includes("gmail")) {
      emailUrl = "https://mail.google.com";
    } else if (
      emailDomain?.includes("outlook") ||
      emailDomain?.includes("hotmail")
    ) {
      emailUrl = "https://outlook.live.com";
    } else if (emailDomain?.includes("yahoo")) {
      emailUrl = "https://mail.yahoo.com";
    }

    window.open(emailUrl, "_blank");
  };

  const handleManualVerification = async () => {
    if (userEmail) {
      console.log("[v0] Manual verification triggered for:", userEmail);
      setIsManualVerifying(true);
      try {
        const verified = await checkEmailVerification(userEmail);
        if (verified) {
          // El checkEmailVerification ya maneja el goToStep
          return;
        }
        // Si no está verificado, mostrar mensaje apropiado
        toast({
          title: "Email aún no verificado",
          description: "Revisa tu bandeja de entrada y spam.",
        });
      } finally {
        setIsManualVerifying(false);
      }
    }
  };

  if (isRegistered) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Verifica tu email</h2>
          <p className="text-muted-foreground">
            Hemos enviado un enlace de verificación a<br />
            <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={openEmailApp}
            className="w-full bg-transparent"
            variant="outline"
          >
            <Mail className="h-4 w-4 mr-2" />
            Abrir email
          </Button>

          <Button
            onClick={handleManualVerification}
            className="w-full"
            disabled={isManualVerifying}
          >
            {isManualVerifying ? "Verificando..." : "Verificar ahora"}
          </Button>

          {(isCheckingEmail || isManualVerifying) && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>
                {isManualVerifying
                  ? "Verificando estado..."
                  : "Verificando automáticamente..."}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-2">
          <p>¿No recibiste el email? Revisa tu carpeta de spam</p>
          <p>
            La verificación se detectará automáticamente cuando hagas clic en el
            enlace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Crear cuenta</h2>
        <p className="text-muted-foreground">
          Completa tus datos para comenzar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña segura"
              {...register("password")}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="referralCode">Código de referido (opcional)</Label>
          <Input
            id="referralCode"
            placeholder="Código de referido"
            {...register("referralCode")}
          />
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="acceptTerms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setValue("acceptTerms", !!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptTerms"
              className="text-sm font-normal leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Acepto los{" "}
              <button
                type="button"
                onClick={openTerms}
                className="text-primary underline inline-flex items-center gap-1"
              >
                términos y condiciones
                <ExternalLink className="h-3 w-3" />
              </button>
            </Label>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
    </div>
  );
}

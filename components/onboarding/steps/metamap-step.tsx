"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useToast } from "@/hooks/use-toast";
import { useMetamapSDK } from "@/hooks/use-metamap-sdk";

// Declarar tipos para Metamap SDK
declare global {
  interface Window {
    MetamapVerification: any;
  }
}

interface MetamapEvent {
  detail: {
    identityId?: string;
    verificationId: string;
    screen?: string;
  } | null;
}

export function MetamapStep() {
  const { updateStepData, nextStep, isLoading, apiCall } = useOnboarding();
  const { isLoaded: metamapLoaded, error: sdkError } = useMetamapSDK();
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "loading" | "started" | "completed" | "error"
  >("idle");
  const [buttonLoading, setButtonLoading] = useState(false);
  const { toast } = useToast();

  // Mostrar error del SDK si existe
  useEffect(() => {
    if (sdkError) {
      toast({
        variant: "destructive",
        title: "Error de carga",
        description: "No se pudo cargar el sistema de verificación.",
      });
      setVerificationStatus("error");
    }
  }, [sdkError, toast]);

  const startVerification = () => {
    if (!window.MetamapVerification) {
      toast({
        variant: "destructive",
        title: "SDK no disponible",
        description:
          "El sistema de verificación no está listo. Intenta nuevamente.",
      });
      return;
    }

    try {
      setButtonLoading(true);
      setVerificationStatus("loading");

      // Obtener el email del usuario desde localStorage
      const userEmail = localStorage.getItem("userEmail");
      console.log("[v0] User email from localStorage:", userEmail);

      // Configuración para Metamap
      const configuration = {
        clientId: process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID || "your_client_id",
        flowId: "619fa0e8ef554d001d186cb9", // Flow ID from requirements
        metadata: { email: userEmail }, // Usar metadata en lugar de identityId
      };

      // Debug: verificar variables de entorno
      console.log(
        "[v0] NEXT_PUBLIC_METAMAP_CLIENT_ID:",
        process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID
      );
      console.log("[v0] Initializing Metamap with config:", configuration);

      const verification = new window.MetamapVerification(configuration);

      // Event listeners
      verification.on("metamap:loaded", () => {
        console.log("[v0] Metamap verification loaded");
      });

      verification.on("metamap:userStartedSdk", ({ detail }: MetamapEvent) => {
        console.log("[v0] User started SDK:", detail);

        // Capturar verificationId inmediatamente desde userStartedSdk
        if (detail) {
          const { verificationId, identityId } = detail;
          console.log("[v0] Captured verificationId:", verificationId);
          console.log("[v0] Captured identityId:", identityId);

          // Guardar verificationId en localStorage para uso posterior
          if (verificationId) {
            localStorage.setItem("metamapVerificationId", verificationId);
          }
          if (identityId) {
            localStorage.setItem("metamapIdentityId", identityId);
          }
        }

        setVerificationStarted(true);
        setVerificationStatus("started");
        setButtonLoading(false);
        toast({
          title: "Verificación iniciada",
          description: "Sigue las instrucciones en pantalla.",
        });
      });

      verification.on(
        "metamap:userFinishedSdk",
        async ({ detail }: MetamapEvent) => {
          console.log("[v0] User finished SDK:", detail);
          setVerificationStatus("completed");

          try {
            // Obtener el email del usuario y verificationId desde localStorage
            const userEmail = localStorage.getItem("userEmail");
            const verificationId = localStorage.getItem(
              "metamapVerificationId"
            );

            console.log("[v0] Sending PUT request with:", {
              userEmail,
              verificationId,
            });

            if (userEmail && verificationId) {
              // Hacer el PUT del usuario con el proofId
              await apiCall(`/v1/user/users/${userEmail}`, "PUT", {
                proofId: {
                  verificationId: verificationId,
                  completed: true,
                },
              });

              console.log("[v0] PUT request successful");

              // Marcar como completado en el estado del onboarding
              updateStepData("metamapCompleted", true);

              toast({
                title: "Verificación completada",
                description: "Tu identidad ha sido verificada exitosamente.",
              });

              // Continuar al siguiente paso después de un breve delay
              setTimeout(() => {
                nextStep();
              }, 2000);
            } else {
              console.error(
                "[v0] Missing userEmail or verificationId for PUT request"
              );
              toast({
                variant: "destructive",
                title: "Error en la verificación",
                description:
                  "No se pudo completar la verificación. Contacta soporte.",
              });
            }
          } catch (error) {
            console.error("[v0] Error in PUT request:", error);
            toast({
              variant: "destructive",
              title: "Error en la verificación",
              description:
                "No se pudo completar la verificación. Contacta soporte.",
            });
          }
        }
      );

      verification.on("metamap:exitedSdk", ({ detail }: MetamapEvent) => {
        console.log("[v0] User exited SDK:", detail);
        setVerificationStatus("idle");
        setVerificationStarted(false);
        toast({
          title: "Verificación cancelada",
          description: "Puedes reintentar cuando estés listo.",
        });
      });

      verification.on("metamap:screen", ({ detail }: MetamapEvent) => {
        console.log("[v0] Screen changed:", detail?.screen);
      });

      // Iniciar la verificación
      verification.start();
    } catch (error) {
      console.error("[v0] Error starting Metamap verification:", error);
      setVerificationStatus("error");
      setButtonLoading(false);
      toast({
        variant: "destructive",
        title: "Error de verificación",
        description: "No se pudo iniciar la verificación. Intenta nuevamente.",
      });
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error":
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Shield className="h-8 w-8 text-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case "loading":
        return "Preparando verificación...";
      case "started":
        return "Verificación en progreso";
      case "completed":
        return "Verificación completada exitosamente";
      case "error":
        return "Error en la verificación";
      default:
        return "Verificación de identidad requerida";
    }
  };

  const getDescription = () => {
    switch (verificationStatus) {
      case "loading":
        return "Estamos preparando el sistema de verificación...";
      case "started":
        return "Sigue las instrucciones en pantalla para completar la verificación de tu identidad.";
      case "completed":
        return "Tu identidad ha sido verificada. Continuando al siguiente paso...";
      case "error":
        return "Hubo un problema con la verificación. Por favor intenta nuevamente.";
      default:
        return "Para continuar, necesitamos verificar tu identidad usando nuestro sistema seguro.";
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          {getStatusIcon()}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Verificación de identidad</h2>
          <p className="text-muted-foreground">{getStatusMessage()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{getDescription()}</p>

        {verificationStatus === "started" && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              La verificación está en progreso. No cierres esta ventana hasta
              completar el proceso.
            </p>
          </div>
        )}

        {verificationStatus === "completed" && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              ¡Excelente! Tu identidad ha sido verificada exitosamente.
            </p>
          </div>
        )}

        {verificationStatus === "error" && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              Hubo un problema con la verificación. Nuestro equipo de soporte
              puede ayudarte si el problema persiste.
            </p>
          </div>
        )}

        {(verificationStatus === "idle" || verificationStatus === "error") && (
          <Button
            onClick={startVerification}
            disabled={!metamapLoaded || isLoading || buttonLoading}
            className="w-full"
          >
            {buttonLoading
              ? "Preparando..."
              : verificationStatus === "error"
              ? "Reintentar verificación"
              : "Iniciar verificación"}
          </Button>
        )}

        {!metamapLoaded && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Cargando sistema de verificación...
          </div>
        )}
      </div>
    </div>
  );
}

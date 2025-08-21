"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";

// Esquemas de validación para cada paso
export const registrationSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "La contraseña debe contener mayúscula, minúscula, número y símbolo"
    ),
  referralCode: z.string().optional(),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, "Debe aceptar los términos y condiciones"),
});

export const accountTypeSchema = z.object({
  accountType: z.enum(["persona", "empresa"]),
  nationality: z.string().min(1, "Nacionalidad requerida"),
  identificationNumber: z.string().min(1, "Número de identificación requerido"),
  // Campos para persona
  name: z.string().optional(),
  surname: z.string().optional(),
  dateOfBirth: z.string().optional(),
  cellNumber: z.string().optional(),
  address: z
    .object({
      country: z.string(),
      town: z.string(),
      addressLine: z.string(),
      postcode: z.string(),
    })
    .optional(),
  // Campos para empresa
  businessName: z.string().optional(),
  individualTaxpayerId: z.string().optional(),
  billingType: z
    .enum(["Consumidor Final", "Responsable Inscripto", "Monotributista"])
    .optional(),
  billingAddress: z
    .object({
      country: z.string(),
      town: z.string(),
      addressLine: z.string(),
      postcode: z.string(),
    })
    .optional(),
});

export const smsValidationSchema = z.object({
  cellNumber: z.string().regex(/^\+\d{10,15}$/, "Formato de teléfono inválido"),
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

export const pinSchema = z.object({
  pin: z
    .string()
    .length(4, "El PIN debe tener 4 dígitos")
    .regex(/^\d{4}$/, "Solo números permitidos"),
});

export type OnboardingStep =
  | "registration"
  | "email-validation"
  | "sms-validation"
  | "account-type"
  | "metamap-verification"
  | "pin-setup"
  | "completed";

export interface OnboardingData {
  registration?: z.infer<typeof registrationSchema>;
  accountType?: z.infer<typeof accountTypeSchema>;
  smsValidation?: z.infer<typeof smsValidationSchema>;
  pin?: z.infer<typeof pinSchema>;
  metamapCompleted?: boolean;
}

const STORAGE_KEY = "onboarding-data";
const STEP_KEY = "onboarding-step";
const TOKEN_KEY = "mubee-access-token";
const TOKEN_EXPIRY_KEY = "mubee-token-expiry";
const REFRESH_TOKEN_KEY = "mubee-refresh-token";

export interface OnboardingContextValue {
  currentStep: OnboardingStep;
  data: OnboardingData;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
  updateStepData: <T extends keyof OnboardingData>(
    step: T,
    stepData: OnboardingData[T]
  ) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  clearOnboarding: () => void;
  apiCall: (
    endpoint: string,
    method?: "GET" | "POST" | "PUT",
    body?: any
  ) => Promise<any>;
  setError: (value: string | null) => void;
  login: () => Promise<string>;
  accessToken: string | null;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("registration");
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrationRef = useRef(false);

  // Hidratar el estado desde localStorage después del montaje (solo una vez)
  useEffect(() => {
    if (hydrationRef.current) {
      console.log("[v0] Hydration already completed, skipping");
      return;
    }

    const performHydration = () => {
      try {
        const savedStep = localStorage.getItem(STEP_KEY);
        console.log("[v0] Hydration - savedStep from localStorage:", savedStep);
        if (savedStep) {
          const initialStep = savedStep as OnboardingStep;
          console.log("[v0] Hydration - setting step to:", initialStep);
          setCurrentStep(initialStep);
        }
        setIsHydrated(true);
        hydrationRef.current = true;
        console.log("[v0] Hydration completed, marked as done");
      } catch (error) {
        console.log("[v0] Hydration - error reading localStorage:", error);
        setIsHydrated(true);
        hydrationRef.current = true;
      }
    };

    const timer = setTimeout(performHydration, 0);

    const safetyTimer = setTimeout(() => {
      if (!hydrationRef.current) {
        console.log("[v0] Safety timeout triggered, forcing hydration");
        setIsHydrated(true);
        hydrationRef.current = true;
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  const [data, setData] = useState<OnboardingData>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : {};
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const persistData = useCallback(
    (newData: OnboardingData, step?: OnboardingStep) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        if (step) {
          console.log("[v0] Persisting step to localStorage:", step);
          console.log(
            "[v0] Stack trace for persistence:",
            new Error().stack?.split("\n").slice(1, 4).join("\n")
          );
          localStorage.setItem(STEP_KEY, step);
          console.log(
            "[v0] Verification - localStorage now contains:",
            localStorage.getItem(STEP_KEY)
          );
        }
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      }
    },
    []
  );

  const updateStepData = useCallback(
    <T extends keyof OnboardingData>(step: T, stepData: OnboardingData[T]) => {
      const newData = { ...data, [step]: stepData };
      setData(newData);
      persistData(newData);
    },
    [data, persistData]
  );

  const nextStep = useCallback(() => {
    console.log("[v0] nextStep called, current step:", currentStep);

    const steps: OnboardingStep[] = [
      "registration",
      "email-validation",
      "sms-validation",
      "account-type",
      "metamap-verification",
      "pin-setup",
      "completed",
    ];

    const currentIndex = steps.indexOf(currentStep);
    console.log("[v0] Current step index:", currentIndex);

    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      console.log("[v0] Moving to next step:", next);

      console.log("[v0] Persisting step to localStorage:", next);
      persistData(data, next);

      console.log("[v0] About to setCurrentStep to:", next);
      setCurrentStep(next);
      console.log("[v0] setCurrentStep called with:", next);

      setTimeout(() => {
        const verifyStep = localStorage.getItem(STEP_KEY);
        console.log(
          "[v0] Verification after nextStep - localStorage contains:",
          verifyStep
        );
        console.log("[v0] Current state after nextStep:", next);
        console.log("[v0] React state should be:", next);
      }, 100);

      console.log("[v0] nextStep completed, should now be:", next);
    } else {
      console.log("[v0] Already at last step, cannot advance");
    }
  }, [currentStep, data, persistData]);

  const previousStep = useCallback(() => {
    const steps: OnboardingStep[] = [
      "registration",
      "email-validation",
      "sms-validation",
      "account-type",
      "metamap-verification",
      "pin-setup",
      "completed",
    ];

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const previous = steps[currentIndex - 1];
      setCurrentStep(previous);
      persistData(data, previous);
    }
  }, [currentStep, data, persistData]);

  const goToStep = useCallback(
    (step: OnboardingStep) => {
      setCurrentStep(step);
      persistData(data, step);
    },
    [data, persistData]
  );

  const clearOnboarding = useCallback(() => {
    setData({});
    setCurrentStep("registration");
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const login = useCallback(async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_MUBEE_API_URL ||
        "https://api.mubee-platform.com";
      const clientSecret = process.env.NEXT_PUBLIC_MUBEE_API_KEY || "";

      const response = await fetch(`${baseUrl}/v1/token/login`, {
        method: "POST",
        headers: {
          "X-Client-Id": "mykeego",
          "X-Client-Secret": clientSecret,
          "X-Tenant-Id": "ranflat-sa",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const tokenData = await response.json();
      const token = tokenData.accessToken;
      const refreshToken = tokenData.refreshToken;
      const expiresIn = tokenData.expiresIn; // seconds
      const expiryTime = Date.now() + expiresIn * 1000;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      setAccessToken(token);

      return token;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  const refreshTokenFunc = useCallback(async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_MUBEE_API_URL ||
        "https://api.mubee-platform.com";
      const clientSecret = process.env.NEXT_PUBLIC_MUBEE_API_KEY || "";
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${baseUrl}/v1/token/refresh-token`, {
        method: "POST",
        headers: {
          "X-Client-Id": "mykeego",
          "X-Client-Secret": clientSecret,
          "X-Tenant-Id": "ranflat-sa",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: "ranflat-sa",
          refreshToken: storedRefreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Refresh token failed: ${response.status}`);
      }

      const tokenData = await response.json();
      const newToken = tokenData.accessToken;
      const newRefreshToken = tokenData.refreshToken;
      const expiresIn = tokenData.expiresIn;
      const expiryTime = Date.now() + expiresIn * 1000;

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      setAccessToken(newToken);

      return newToken;
    } catch (error) {
      console.error("Refresh token error:", error);
      return await login();
    }
  }, [login]);

  const getValidToken = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (storedToken && storedExpiry) {
      const expiryTime = Number.parseInt(storedExpiry);
      const now = Date.now();

      if (now < expiryTime - 300000) {
        setAccessToken(storedToken);
        return storedToken;
      }

      try {
        return await refreshTokenFunc();
      } catch (error) {
        console.error("Refresh failed, doing full login:", error);
        return await login();
      }
    }

    return await login();
  }, [refreshTokenFunc, login]);

  const apiCall = useCallback(
    async (
      endpoint: string,
      method: "GET" | "POST" | "PUT" = "POST",
      body?: any
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_MUBEE_API_URL ||
          "https://api.mubee-platform.com";

        const token = await getValidToken();

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-Id": "ranflat-sa",
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            const newToken = await login();

            const retryResponse = await fetch(`${baseUrl}${endpoint}`, {
              method,
              headers: {
                Authorization: `Bearer ${newToken}`,
                "X-Tenant-Id": "ranflat-sa",
                "Content-Type": "application/json",
              },
              body: body ? JSON.stringify(body) : undefined,
            });

            if (!retryResponse.ok) {
              throw new Error(`API Error: ${retryResponse.status}`);
            }

            return await retryResponse.json();
          }

          throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [getValidToken, login]
  );

  const value: OnboardingContextValue = {
    currentStep,
    data,
    isLoading,
    error,
    isHydrated,
    updateStepData,
    nextStep,
    previousStep,
    goToStep,
    clearOnboarding,
    apiCall,
    setError,
    login,
    accessToken,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding debe usarse dentro de OnboardingProvider");
  }
  return ctx;
}

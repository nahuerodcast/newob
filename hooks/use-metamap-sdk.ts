import { useEffect, useState, useRef } from "react"

declare global {
  interface Window {
    MetamapVerification: any
    __metamapScriptLoaded?: boolean
    __metamapLoadingPromise?: Promise<void>
  }
}

export function useMetamapSDK() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    const loadSDK = async () => {
      // Si ya está cargado, no hacer nada
      if (window.MetamapVerification && window.__metamapScriptLoaded) {
        setIsLoaded(true)
        return
      }

      // Si ya hay una carga en progreso, esperar
      if (window.__metamapLoadingPromise) {
        try {
          await window.__metamapLoadingPromise
          setIsLoaded(true)
          return
        } catch (err) {
          setError("Error al cargar el SDK de Metamap")
          return
        }
      }

      // Crear una promesa para la carga
      const loadingPromise = new Promise<void>((resolve, reject) => {
        // Verificar si ya existe un script en el DOM
        const existingScript = document.querySelector('script[src="https://web-button.metamap.com/button.js"]')
        
        if (existingScript) {
          // Esperar a que el script existente se cargue
          const checkLoaded = () => {
            if (window.MetamapVerification) {
              window.__metamapScriptLoaded = true
              resolve()
            } else {
              setTimeout(checkLoaded, 100)
            }
          }
          
          // Timeout de seguridad
          setTimeout(() => reject(new Error("Timeout esperando script existente")), 10000)
          checkLoaded()
          return
        }

        // Crear y cargar el script
        const script = document.createElement("script")
        script.src = "https://web-button.metamap.com/button.js"
        script.async = true
        script.id = "metamap-script"
        
        script.onload = () => {
          window.__metamapScriptLoaded = true
          resolve()
        }
        
        script.onerror = () => {
          reject(new Error("Error al cargar el script de Metamap"))
        }

        scriptRef.current = script
        document.head.appendChild(script)
      })

      // Guardar la promesa globalmente
      window.__metamapLoadingPromise = loadingPromise

      try {
        await loadingPromise
        setIsLoaded(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
        setIsLoaded(false)
      } finally {
        // Limpiar la promesa global
        delete window.__metamapLoadingPromise
      }
    }

    loadSDK()

    // Cleanup: solo remover el script si lo creamos nosotros
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.remove()
        scriptRef.current = null
      }
    }
  }, [])

  return { isLoaded, error }
}

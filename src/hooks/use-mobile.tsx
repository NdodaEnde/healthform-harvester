
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Add the mobile menu hook
export function useMobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const toggle = React.useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])
  
  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])
  
  return { isOpen, toggle, close }
}

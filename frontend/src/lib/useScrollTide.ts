import { useEffect } from 'react'

export function useScrollTide() {
  useEffect(() => {
    const root = document.documentElement
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (reducedMotion.matches) {
      root.style.setProperty('--tide-y', '0px')
      root.style.setProperty('--tide-y-inverse', '0px')
      return
    }

    let frame = 0

    const update = () => {
      const distance = Math.min(window.scrollY * 0.065, 72)
      root.style.setProperty('--tide-y', `${distance}px`)
      root.style.setProperty('--tide-y-inverse', `${distance * -0.72}px`)
      frame = 0
    }

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== 0) window.cancelAnimationFrame(frame)
      root.style.removeProperty('--tide-y')
      root.style.removeProperty('--tide-y-inverse')
    }
  }, [])
}

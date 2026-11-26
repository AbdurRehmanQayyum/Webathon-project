import type { createBrowserRouter } from 'react-router'

// Cross-fades between pages with the browser's View Transitions API. Changes that stay on
// the same page, such as filters and search text, are left alone.
export function enablePageTransitions(router: ReturnType<typeof createBrowserRouter>) {
  const navigate = router.navigate

  router.navigate = ((...[to, options]: Parameters<typeof navigate>) => {
    if (typeof to === 'number') return navigate(to)
    const path = typeof to === 'string' ? to.split(/[?#]/)[0] : to?.pathname
    const changesPage = Boolean(path) && path !== router.state.location.pathname
    return navigate(
      to,
      changesPage ? { ...options, viewTransition: options?.viewTransition ?? true } : options,
    )
  }) as typeof navigate
}

// Browsers without the API fall back to a simple fade of the incoming page
export const hasViewTransitions = typeof document.startViewTransition === 'function'

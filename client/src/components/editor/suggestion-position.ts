import { shift, size, type Middleware } from '@floating-ui/dom'

const EDGE = 8
const COMFORTABLE_HEIGHT = 240
const MIN_HEIGHT = 96

// Opens above the caret when the space below is tight. Decided from the free space,
// not the list's own height, because the list is resized to fit whichever side wins.
const chooseSide: Middleware = {
  name: 'chooseSide',
  fn({ elements, placement }) {
    const caret = elements.reference.getBoundingClientRect()
    const dialog = elements.floating.closest('[role="dialog"]')?.getBoundingClientRect()
    const visible = window.visualViewport?.height ?? window.innerHeight
    const above = caret.top - Math.max(dialog?.top ?? 0, 0)
    const below = Math.min(dialog?.bottom ?? visible, visible) - caret.bottom
    const side = below < COMFORTABLE_HEIGHT && above > below ? 'top-start' : 'bottom-start'
    return side === placement ? {} : { reset: { placement: side } }
  },
}

// Stays on screen and scrolls inside the free space
export const suggestionMiddleware: Middleware[] = [
  chooseSide,
  shift({ padding: EDGE }),
  size({
    padding: EDGE,
    apply: ({ availableHeight, elements }) =>
      elements.floating.style.setProperty(
        '--suggestion-height',
        `${Math.max(availableHeight, MIN_HEIGHT)}px`,
      ),
  }),
]

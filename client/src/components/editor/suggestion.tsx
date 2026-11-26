import { ReactRenderer } from '@tiptap/react'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import { suggestionMiddleware } from './suggestion-position'
import { SuggestionList, type SuggestionItem, type SuggestionListHandle } from './SuggestionList'

export function suggestionFor(
  char: string,
  items: (query: string) => Promise<SuggestionItem[]>,
): Omit<SuggestionOptions<SuggestionItem>, 'editor'> {
  return {
    char,
    items: ({ query }) => items(query).catch(() => []),
    offset: { mainAxis: 6 },
    // Placement is handled by the middleware, so the default flip is off
    flip: false,
    floatingUi: { strategy: 'fixed', middleware: suggestionMiddleware },
    render: () => {
      let renderer: ReactRenderer<SuggestionListHandle> | null = null
      let unmount: (() => void) | undefined

      const position = (props: SuggestionProps<SuggestionItem>) => {
        unmount?.()
        if (renderer) unmount = props.mount(renderer.element as HTMLElement)
      }

      // Runs before any dialog sees the key, so Escape closes only the list
      const onEscape = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        close()
      }

      const close = () => {
        window.removeEventListener('keydown', onEscape, true)
        unmount?.()
        unmount = undefined
        renderer?.element.remove()
        renderer?.destroy()
        renderer = null
      }

      return {
        onStart: (props) => {
          renderer = new ReactRenderer(SuggestionList, { props, editor: props.editor })
          const element = renderer.element as HTMLElement
          // Out of the page flow from the start, so appending it never shifts the layout
          Object.assign(element.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: '90',
            pointerEvents: 'auto',
          })
          // Inside a dialog the list must belong to it, or clicking it would close the dialog
          const dialog = props.editor.view.dom.closest<HTMLElement>('[role="dialog"]')
          const host = dialog ?? document.body
          host.appendChild(element)
          window.addEventListener('keydown', onEscape, true)
          position(props)
        },
        onUpdate: (props) => {
          renderer?.updateProps(props)
          position(props)
        },
        onKeyDown: ({ event }) => renderer?.ref?.onKeyDown(event) ?? false,
        onExit: close,
      }
    },
  }
}

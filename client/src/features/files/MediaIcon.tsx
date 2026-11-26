import { createElement } from 'react'
import { mediaIcon } from './media'

export function MediaIcon({ contentType, className }: { contentType: string; className: string }) {
  return createElement(mediaIcon({ contentType }), { className, 'aria-hidden': true })
}

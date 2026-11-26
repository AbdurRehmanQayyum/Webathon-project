import Mention from '@tiptap/extension-mention'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'
import type { FieldProps } from '@/components/forms/FormField'
import { cn } from '@/lib/cn'
import { EditorToolbar } from './EditorToolbar'
import { tagSuggestions, userSuggestions } from './sources'
import { suggestionFor } from './suggestion'

interface RichTextEditorProps extends Partial<FieldProps> {
  value: string
  onChange: (html: string) => void
  label: string
  maxLength: number
  placeholder?: string
  compact?: boolean
  autoFocus?: boolean
  onSubmit?: () => void
}

const Hashtag = Mention.extend({ name: 'hashtag' })

export function RichTextEditor({
  value,
  onChange,
  label,
  maxLength,
  placeholder = 'Write here. Use @ to mention and # to tag.',
  compact = false,
  autoFocus = false,
  onSubmit,
  ...field
}: RichTextEditorProps) {
  // Callbacks change between renders; the editor keeps one instance
  const handlers = useRef({ onChange, onSubmit })
  useEffect(() => {
    handlers.current = { onChange, onSubmit }
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
      Mention.configure({ suggestion: suggestionFor('@', userSuggestions) }),
      Hashtag.configure({ suggestion: suggestionFor('#', tagSuggestions) }),
    ],
    content: value,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        ...(field.id ? { id: field.id } : {}),
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        class: cn('rich-content px-3 py-2.5 outline-none', compact ? 'min-h-20' : 'min-h-44'),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && handlers.current.onSubmit) {
          handlers.current.onSubmit()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: current }) =>
      handlers.current.onChange(current.isEmpty ? '' : current.getHTML()),
  })

  const characters = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      (current?.storage.characterCount?.characters() as number | undefined) ?? 0,
  })

  // The owner clears the value after submitting
  useEffect(() => {
    if (editor && value === '' && !editor.isEmpty) editor.commands.clearContent()
  }, [editor, value])

  if (!editor) return null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-control border border-line-strong bg-surface transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-focus/30',
        field['aria-invalid'] && 'border-danger',
      )}
    >
      <EditorToolbar editor={editor} compact={compact} />
      <EditorContent editor={editor} className="max-h-96 overflow-y-auto" />
      {characters > maxLength * 0.8 && (
        <p className="border-t border-line px-3 py-1 text-right text-xs text-muted" aria-live="polite">
          {characters.toLocaleString()} of {maxLength.toLocaleString()}
        </p>
      )}
    </div>
  )
}

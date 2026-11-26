import { useEditorState, type Editor } from '@tiptap/react'
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { popupStyles } from '@/components/ui/input-styles'
import { cn } from '@/lib/cn'

export function EditorToolbar({ editor, compact }: { editor: Editor; compact: boolean }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      strike: current.isActive('strike'),
      heading: current.isActive('heading'),
      bullets: current.isActive('bulletList'),
      numbers: current.isActive('orderedList'),
      quote: current.isActive('blockquote'),
      code: current.isActive('code'),
      codeBlock: current.isActive('codeBlock'),
      link: current.isActive('link'),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()

  const actions = [
    { label: 'Bold', Icon: Bold, active: state.bold, run: () => chain().toggleBold().run(), basic: true },
    { label: 'Italic', Icon: Italic, active: state.italic, run: () => chain().toggleItalic().run(), basic: true },
    { label: 'Underline', Icon: Underline, active: state.underline, run: () => chain().toggleUnderline().run() },
    { label: 'Strikethrough', Icon: Strikethrough, active: state.strike, run: () => chain().toggleStrike().run() },
    { label: 'Heading', Icon: Heading2, active: state.heading, run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: 'Bulleted list', Icon: List, active: state.bullets, run: () => chain().toggleBulletList().run(), basic: true },
    { label: 'Numbered list', Icon: ListOrdered, active: state.numbers, run: () => chain().toggleOrderedList().run() },
    { label: 'Quote', Icon: Quote, active: state.quote, run: () => chain().toggleBlockquote().run() },
    { label: 'Inline code', Icon: Code, active: state.code, run: () => chain().toggleCode().run(), basic: true },
    { label: 'Code block', Icon: SquareCode, active: state.codeBlock, run: () => chain().toggleCodeBlock().run() },
  ].filter((action) => !compact || action.basic)

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1"
    >
      {actions.map(({ label, Icon, active, run }) => (
        <IconButton
          key={label}
          size="icon-sm"
          label={label}
          aria-pressed={active}
          className={cn(active && 'bg-selected')}
          icon={<Icon className="size-4" />}
          onClick={run}
        />
      ))}
      <LinkControl editor={editor} active={state.link} />
      {!compact && (
        <span className="ml-auto flex">
          <IconButton
            size="icon-sm"
            label="Undo"
            disabled={!state.canUndo}
            icon={<Undo2 className="size-4" />}
            onClick={() => chain().undo().run()}
          />
          <IconButton
            size="icon-sm"
            label="Redo"
            disabled={!state.canRedo}
            icon={<Redo2 className="size-4" />}
            onClick={() => chain().redo().run()}
          />
        </span>
      )}
    </div>
  )
}

function LinkControl({ editor, active }: { editor: Editor; active: boolean }) {
  const [isOpen, setOpen] = useState(false)
  const [url, setUrl] = useState('')

  const apply = () => {
    const href = url.trim()
    const chain = editor.chain().focus().extendMarkRange('link')
    if (!href) chain.unsetLink().run()
    else {
      const target = /^https?:\/\//i.test(href) ? href : `https://${href}`
      if (editor.state.selection.empty && !active) {
        chain.insertContent({ type: 'text', text: target, marks: [{ type: 'link', attrs: { href: target } }] }).run()
      } else chain.setLink({ href: target }).run()
    }
    setOpen(false)
  }

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open)
        if (open) setUrl(String(editor.getAttributes('link').href ?? ''))
      }}
    >
      <Popover.Trigger
        type="button"
        aria-label="Link"
        aria-pressed={active}
        className={cn(
          'grid size-8 place-items-center rounded-control text-muted hover:bg-surface-alt hover:text-fg',
          active && 'bg-selected text-selected-fg',
        )}
      >
        <Link2 className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} className={cn(popupStyles, 'flex w-72 gap-2 p-2')}>
          <Input
            aria-label="Web address"
            placeholder="https://"
            value={url}
            autoFocus
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                apply()
              }
            }}
          />
          <Button variant="primary" onClick={apply}>
            Apply
          </Button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

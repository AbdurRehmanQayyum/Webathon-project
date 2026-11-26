import {
  ArrowRight,
  AtSign,
  BellRing,
  CalendarDays,
  Megaphone,
  MessagesSquare,
  Moon,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from '@/app/providers/theme-context'
import { BrandMark } from '@/components/brand/BrandMark'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { InstallButton } from '@/features/pwa/InstallButton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const features: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: UsersRound,
    title: 'Student clubs',
    text: 'Join clubs that match your interests, or propose a new one for the department to approve.',
  },
  {
    Icon: MessagesSquare,
    title: 'Real discussions',
    text: 'Write formatted posts, reply in threads and vote on the answers that help most.',
  },
  {
    Icon: AtSign,
    title: 'Mentions and tags',
    text: 'Bring classmates into a conversation and find related posts through shared tags.',
  },
  {
    Icon: Paperclip,
    title: 'Files and media',
    text: 'Attach notes, slides, images, audio and video, with previews built into every post.',
  },
  {
    Icon: Megaphone,
    title: 'Official announcements',
    text: 'Department notices are clearly marked, so they never get lost among everyday posts.',
  },
  {
    Icon: CalendarDays,
    title: 'Events calendar',
    text: 'See workshops, seminars and competitions in a month view or as an upcoming list.',
  },
  {
    Icon: BellRing,
    title: 'Live notifications',
    text: 'Replies, mentions and department updates arrive while you are using the app.',
  },
  {
    Icon: Sparkles,
    title: 'Suggestions for you',
    text: 'Club recommendations and a personal feed based on what you join, vote on and discuss.',
  },
  {
    Icon: ShieldCheck,
    title: 'Safe by design',
    text: 'Role permissions, club moderation and encrypted storage of written content.',
  },
]

const steps = [
  { title: 'Create your account', text: 'Register with your department details and pick interests.' },
  { title: 'Join your clubs', text: 'Start with the suggestions or browse every active club.' },
  { title: 'Take part', text: 'Ask questions, share resources and keep up with events.' },
]

const highlights = [
  { Icon: UsersRound, label: 'Clubs', position: 'top-2 left-0 sm:left-4' },
  { Icon: Megaphone, label: 'Announcements', position: 'top-16 right-0' },
  { Icon: CalendarDays, label: 'Events', position: 'bottom-16 left-0' },
  { Icon: MessagesSquare, label: 'Discussions', position: 'right-0 bottom-2 sm:right-6' },
]

const section = 'px-4 py-14 sm:px-8 lg:px-16'

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35 },
}

export function LandingPage() {
  useDocumentTitle('Your department, connected')
  const { isDark, setPreference } = useTheme()

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-8 lg:px-16">
          <Logo to="/" />
          <nav aria-label="Page" className="ml-6 hidden gap-5 text-sm font-medium lg:flex">
            <a href="#features" className="text-muted hover:text-fg">
              Features
            </a>
            <a href="#start" className="text-muted hover:text-fg">
              Getting started
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <InstallButton iconOnly />
            <IconButton
              label={isDark ? 'Use light theme' : 'Use dark theme'}
              icon={isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              onClick={() => setPreference(isDark ? 'light' : 'dark')}
            />
            <ButtonLink to="/login">Sign in</ButtonLink>
            <div className="hidden sm:block">
              <ButtonLink to="/register" variant="primary">
                Create account
              </ButtonLink>
            </div>
          </div>
        </div>
      </header>

      <main className="page-content">
        <section className={`${section} grid items-center gap-10 lg:grid-cols-2 lg:py-24`}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm font-semibold text-link">Computer Science Department</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl xl:text-6xl">
              Connect. Collaborate. <span className="text-link">Grow.</span>
            </h1>
            <p className="mt-5 text-lg text-muted">
              Campus Connect brings clubs, discussions, official announcements and events into one
              place, so you always know what is happening around you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/register" variant="primary">
                Create your account
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/login">Sign in</ButtonLink>
              <InstallButton />
            </div>
          </motion.div>

          <div
            aria-hidden="true"
            className="relative mx-auto grid aspect-square w-full max-w-md place-items-center"
          >
            <div className="absolute inset-6 rounded-full border border-line" />
            <div className="absolute inset-16 rounded-full bg-selected" />
            <BrandMark animation="intro" className="relative size-36 sm:size-44" />
            {highlights.map(({ Icon, label, position }, index) => (
              <motion.span
                key={label}
                className={`absolute ${position} inline-flex items-center gap-2 rounded-panel border border-line bg-surface px-3 py-2 text-sm font-medium shadow-pop`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                transition={{
                  opacity: { delay: 0.3 + index * 0.12 },
                  scale: { delay: 0.3 + index * 0.12 },
                  y: { duration: 4, delay: index * 0.5, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <Icon className="size-4 text-link" />
                {label}
              </motion.span>
            ))}
          </div>
        </section>

        <section id="features" className={`${section} scroll-mt-16 border-y border-line bg-surface-alt`}>
          <h2 className="text-2xl font-semibold sm:text-3xl">Everything your community needs</h2>
          <p className="mt-2 text-muted">One account for students, moderators and administrators.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map(({ Icon, title, text }) => (
              <motion.li key={title} {...reveal}>
                <Card className="h-full p-5 transition-colors hover:border-primary">
                  <span className="grid size-11 place-items-center rounded-control bg-selected text-selected-fg">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </Card>
              </motion.li>
            ))}
          </ul>
        </section>

        <section id="start" className={`${section} scroll-mt-16`}>
          <h2 className="text-2xl font-semibold sm:text-3xl">Start in three steps</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.li key={step.title} {...reveal} className="border-t-4 border-primary pt-4">
                <span className="text-sm font-semibold text-link">Step {index + 1}</span>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.text}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section className={section}>
          <div className="grid justify-items-center gap-4 rounded-panel bg-primary px-6 py-12 text-center text-on-primary">
            <h2 className="text-2xl font-semibold sm:text-3xl">Your community is waiting</h2>
            <p>Create an account and find your first club in a couple of minutes.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/register">Create account</ButtonLink>
              <ButtonLink to="/login">I already have one</ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-6 text-sm text-muted sm:px-8 lg:px-16">
        Campus Connect · Community platform for the Computer Science Department
      </footer>
    </div>
  )
}

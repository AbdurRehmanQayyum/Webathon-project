# Design system

## Brand

The mark is two nested arcs forming "CC" with a node in the opening: two communities and the point
that connects them.

| Asset | File |
| --- | --- |
| Logo (animated draw-in) | `client/public/branding/logo.svg` |
| Loader | `client/public/branding/loader.svg` |
| Favicon (adapts to dark tabs) | `client/public/favicon.svg` |
| App icons (source) | `client/public/branding/app-icon*.svg` |
| PNG install icons | `client/public/icons/` (`npm --prefix client run icons`) |

In the app, `BrandMark` has three states: `static`, `intro` (arcs draw in, node pops) and `loading`
(arcs counter-rotate, node pulses). `index.html` shows the loader before React starts, and the tab
icon animates while slower requests run.

## Color

| Brand | Value |
| --- | --- |
| Primary | `#8E1EA2` |
| Secondary | `#C654C3` |
| Accent | `#ED96D7` |
| Soft accent | `#FFC0DE` |

`styles/tokens.css` maps these to semantic tokens for light and dark themes and exposes them to
Tailwind: `bg`, `surface`, `surface-alt`, `fg`, `muted`, `line`, `primary`, `link`, `selected`,
`success`, `warning`, `danger`, `info`. Purple is used for primary actions and selection; pinks stay
accents. Dark theme links use the accent pink for contrast.

## Type, shape and motion

- Inter (bundled variable font) with system fallback.
- Radius: 8px controls, 12px panels. Shadows only on floating surfaces.
- Motion: 100–150ms feedback, 150–250ms transitions, up to 350ms for larger surfaces. Transform and
  opacity are preferred. `prefers-reduced-motion` disables animation.

## Components

| Group | Components |
| --- | --- |
| Forms | `Button`, `ButtonLink`, `IconButton`, `Input`, `Textarea`, `PasswordInput`, `SearchInput`, `Select`, `Checkbox`, `Switch`, `SegmentedControl`, `FormField`, `DatePicker`, `TimePicker`, `Combobox`, `FileUploader`, `ImageUploader` |
| Overlays | `Modal`, `ConfirmDialog`, `Drawer`, `Menu`, `Tooltip`, popovers |
| Navigation | `Sidebar`, `Header`, `MobileNavigation`, `Tabs`, `Pagination`, `Breadcrumb` |
| Feedback | `Alert`, toasts, `BrandLoader`, `Skeleton`, `EmptyState`, `ErrorState` |
| Content | `Card`, `Avatar`, `Badge`, `DataTable`, `PostCard`, `ClubCard`, `AnnouncementCard`, `EventCard`, `EventCalendar`, `VoteControl`, `AttachmentList` |

Radix UI primitives supply keyboard support and focus management for dialogs, menus, selects, tabs
and toggles; all visual styling is original. Icons come from Lucide.

## Layout

- Desktop: collapsible sidebar, top bar, content; the feed adds a context column from 1280px.
- Below 1024px: compact header, bottom navigation and a slide-over drawer. Tables become stacked
  records; dialogs become bottom sheets; the calendar shows markers with an agenda.

## Layout notes

- Pages use the full width. Cards of unequal height are packed with `Masonry`, which keeps reading
  order.
- Sign-in and registration are centred; registration is split into steps.
- Scrollbars follow the theme (`styles/scrollbar.css`); `no-scrollbar` is for swipeable tab strips.
- Time fields use a clock dial that works with pointer, touch and keyboard.

## Motion

| Change | Treatment |
| --- | --- |
| Between pages | View Transitions cross-fade of the content; navigation stays still. Fade-in fallback elsewhere |
| Tabs, filters, sorting, paging | `Reveal` replays when the new data arrives; old results dim meanwhile |
| Loading | Skeletons appear only if a response takes longer than 140 ms |
| Page sections | `stagger-in` |
| Dialogs, drawers, menus, tooltips | Animate in and out |
| Theme switch | Screen cross-fade |

Reduced-motion preferences turn these off.

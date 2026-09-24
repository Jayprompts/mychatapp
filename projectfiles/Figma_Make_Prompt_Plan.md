# Figma Make Prompt Plan — Instant Messaging App

**How to use this:** Paste these prompts **in order, into the same continuous Figma Make session**. Don't start a new file per prompt — Figma Make carries the established style forward only within one ongoing session. Run Prompt 0 first and wait for it to finish before pasting Prompt 1, and so on.

Replace `[App Name]` in every prompt with your actual app name before pasting.

Design direction locked in: Messenger-inspired blue + gradient accents, sleek/rounded/soft style, fully responsive (mobile / tablet / desktop) at the core of every screen, admin panel styled as a distinct dashboard.

---

## Prompt 0 — Design System Foundation

```
Create a design system and style guide for [App Name], a modern real-time
messaging and community app inspired by Facebook Messenger's visual
language — reinterpreted as an original, distinct brand, not a clone of
Messenger's logo or trademarks.

VISUAL STYLE
Clean, soft, rounded, friendly, sleek. Generous whitespace. Soft drop
shadows on cards and modals. Fully rounded (pill-shaped) buttons and
message bubbles. Rounded corners (16–20px) on cards and inputs.

COLOR PALETTE
- Primary: Messenger-inspired blue #0866FF
- Accent gradient: linear gradient from blue #00B2FF to violet/purple
  #B620E0 — used on primary buttons, active states, the send button, and
  the app's logo mark
- Backgrounds: off-white #F7F8FA (app background), white #FFFFFF (cards)
- Text: dark #050505 (primary text), #65676B (secondary text)
- Borders/dividers: #E4E6EB
- Semantic colors: success green #31A24C, warning amber #F7B928, error
  red #FA383E

TYPOGRAPHY
Inter (or system-ui font stack). Type scale:
- H1: 28px, bold
- H2: 22px, semibold
- H3: 18px, semibold
- Body: 15px, regular
- Caption: 13px, regular
- Button label: 15px, semibold

SPACING SCALE
4 / 8 / 12 / 16 / 24 / 32 / 48 px

COMPONENTS TO DESIGN (as a reusable component set on one page)
Primary button (gradient fill), secondary button (outline), text button,
input field (rounded, with focus state), avatar (circular, with an
online-status dot indicator), card, modal/dialog, top navbar, bottom tab
bar (mobile), left sidebar navigation (desktop), unread-count badge/pill,
toast/snackbar, empty-state placeholder, loading skeleton block.

Show every component in its default AND interactive states (hover,
active/pressed, focus, disabled).

RESPONSIVENESS — CORE REQUIREMENT, NOT AN AFTERTHOUGHT
Define how the app's overall navigation shell adapts across three
breakpoints:
- Mobile (<640px): bottom tab bar navigation, single-column full-screen
  views, stacked drill-in navigation
- Tablet (640–1024px): collapsible sidebar or two-column split view
- Desktop (>1024px): persistent left sidebar navigation + multi-column
  layouts (e.g. a list panel and a detail panel side by side)

Deliver this as one Figma page named "Design System" containing: color
swatches, the type scale, the spacing scale, and every component listed
above.
```

---

## Prompt 1 — Auth Screens

```
Using the design system and color palette already established (Messenger
blue + gradient, rounded/soft/sleek style), design the authentication
flow for [App Name] at three responsive breakpoints: mobile (390px),
tablet (834px), and desktop (1440px).

SCREENS (each at all three breakpoints)
1. Welcome/Onboarding — app logo/mark using the blue-to-purple gradient,
   a short tagline, and two buttons: "Log In" and "Create Account"
2. Login — email/username field, password field with a show/hide toggle,
   "Forgot password?" link, gradient primary "Log In" button, a divider,
   then "Continue with Google" and "Continue with GitHub" secondary
   buttons, and a link to Register
3. Register — username, email, password, confirm password fields,
   gradient primary "Create Account" button, the same social login
   options, and a link to Login
4. Forgot Password — a single email field with a "Send reset link"
   gradient button, plus a confirmation state after sending

RESPONSIVE BEHAVIOR
- Mobile: full-screen single-column forms, generous top padding, a fixed
  bottom CTA button
- Tablet: centered card layout (max-width ~480px) on a soft background,
  the form inside a rounded card with a subtle shadow
- Desktop: split-screen layout — left half a branded gradient panel with
  the logo/illustration, right half the form, centered vertically

Show both empty and filled/error states for each form (e.g. invalid
email, password mismatch) using the error red from the design system.
```

---

## Prompt 2 — Chat Screens (the core of the app)

```
Using the same design system (Messenger blue + gradient, rounded/soft
style), design the core chat experience for [App Name] at mobile
(390px), tablet (834px), and desktop (1440px) breakpoints.

SCREENS
1. Chat List (Inbox) — search bar at top, a list of conversations each
   showing avatar (with an online-status green dot), name, last-message
   preview, timestamp, and an unread-count badge (gradient pill). Include
   a "New Message" and "New Community" entry point (floating action
   button on mobile, top-right icon on tablet/desktop)
2. 1-on-1 Chat Screen — top bar with the contact's avatar/name/online
   status and a back button (mobile), a scrollable message thread with
   visually distinct bubbles for sent (gradient-tinted blue, right-
   aligned) vs received (light gray #F0F0F0, left-aligned) messages,
   timestamps, read-receipt checkmarks, and a bottom input bar with a
   text field, emoji icon, attachment icon, and a microphone icon that
   morphs into a gradient "send" button once text is entered
3. Voice Note UI states — (a) idle mic button, (b) actively-recording
   state with a live waveform animation, a timer, and a slide-to-cancel
   gesture hint, (c) a sent voice-note message bubble showing a play
   button, waveform visualization, and duration
4. Group/Community Chat Screen — same structure as the 1-on-1 screen, but
   the top bar shows the community name, a stack of member avatars, and
   member count; each message shows the sender's name above the bubble
   (multiple senders); include a subtle "X people are typing…" indicator

RESPONSIVE BEHAVIOR — this is the core layout of the whole app, model it
after Messenger/Discord's adaptive pattern:
- Mobile: single-column, full-screen views — the chat list and an open
  chat are separate full-screen pages with a back-navigation transition
- Tablet: two-column split — a narrower persistent chat list on the left
  (~320px), the open chat filling the remaining space on the right
- Desktop: three-column layout — a leftmost persistent icon sidebar
  (Chats, Communities, Blog, Profile), a middle chat-list column
  (~360px), and a rightmost open-chat panel filling the remaining space

Include an empty state (no conversations yet, no messages yet) and a
loading skeleton state for the chat list.
```

---

## Prompt 3 — Blog Screens

```
Using the same design system, design the blog/feed feature for
[App Name] at mobile (390px), tablet (834px), and desktop (1440px)
breakpoints.

SCREENS
1. Blog Feed — a vertically scrolling list/grid of post cards, each
   showing a cover image, title, author avatar + name, a short excerpt,
   like count, comment count, and timestamp. Include a top filter/sort
   bar ("Latest", "Most liked")
2. Post Detail — a cover-image banner, title, author info, full body
   content, a like button (gradient fill when active) with its count,
   and a comments section below with a comment input bar
3. Create/Edit Post — a cover-image upload area, title input, a rich-text
   body editor with a basic toolbar (bold/italic/link), and a gradient
   "Publish" button

RESPONSIVE BEHAVIOR
- Mobile: single-column feed, full-width cards, post detail as a
  full-screen page
- Tablet: two-column card grid for the feed
- Desktop: three-column card grid for the feed; show the create-post flow
  as a centered modal rather than a full navigation

Include an empty state ("No posts yet — be the first to share
something") and a loading skeleton state for the feed cards.
```

---

## Prompt 4 — Admin Panel (distinct dashboard style)

```
Design a distinct admin dashboard for [App Name], using the same color
system and typography as the consumer app (Messenger blue + gradient
accents, Inter font, same design tokens), but with a denser, more
utilitarian dashboard visual language appropriate for an internal admin
tool — think Notion/Linear settings-panel style rather than the consumer
app's playful spacing.

SCREENS, at tablet (834px) and desktop (1440px) breakpoints as the
primary targets (see the mobile-degradation note below):

1. Admin Dashboard Home — a left sidebar navigation (Users, Blogs,
   Communities, Roles, Settings), a top bar with the admin's own
   avatar/role badge, and a grid of summary stat cards (Total Users,
   Active Communities, Posts This Week, Pending Reports) using the design
   system's card style
2. User Management — a data table (avatar, username, email, role badge,
   status, joined date, an actions column with suspend/delete/
   change-role icon buttons), a search + filter bar above the table, and
   pagination at the bottom
3. Blog Management — a data table/list of all posts (thumbnail, title,
   author, date, like/comment counts, actions: edit/delete/feature-pin)
4. Community Management — a data table/list of all communities (name,
   member count, admin(s), created date, actions: edit/delete/
   manage-members), plus a "Manage Members" modal showing a member list
   with a role-assignment dropdown per member
5. Role Assignment Screen (Super Admin only) — a list of admin users with
   a dropdown per user to assign one of: Super Admin, Content Moderator,
   Community Manager, User

Use badge/pill components from the design system to visually distinguish
roles by color — e.g. Super Admin in the gradient treatment, Content
Moderator in blue, Community Manager in a secondary accent, User in
neutral gray.

RESPONSIVE BEHAVIOR
- Desktop: full sidebar + data-table layout as described
- Tablet: sidebar collapses to an icon-only rail (expandable on tap);
  tables scroll horizontally within their container if needed
- Mobile (graceful degradation only, not the primary target): sidebar
  becomes a bottom sheet or hamburger drawer; data tables convert to a
  stacked card-per-row layout instead of a horizontal table
```

---

## After the first pass

Once all five prompts have run in the same session, useful follow-ups within that same Figma Make thread:
- `"Generate a dark mode variant of every screen so far, using the same gradient accent but a dark neutral background (#18191A) and adjusted text contrast."`
- `"Show the [specific screen] with 3 example messages/posts/users filled in with realistic placeholder content instead of empty states."`
- `"Add a hover/focus state comparison frame for the primary button and input field."`

If any single screen comes out inconsistent with the rest, re-prompt just that one (e.g. `"Redo the Chat List screen to match the card shadow and spacing used on the Blog Feed screen"`) rather than regenerating the whole batch.

# Figma Make Prompt Plan — Round 2 (Closing the Gaps)

**How to use this:** Paste these into the **same continuous Figma Make session** as before, in order. Each prompt explicitly tells Figma Make to reuse the existing design system (colors, radius scale, Inter font, gradient) and to wire up elements that already exist but currently go nowhere (Profile tab, Explore tab, the ⋮ menu, the emoji/attachment icons, etc.) rather than rebuilding them from scratch.

---

## Prompt 1 — Onboarding Completion, Profile & Account Settings

```
Using the existing design system (colors, radius scale, Inter font, the
#00B2FF→#B620E0 gradient, existing Button/Input/Avatar/Card components),
extend the app with three groups of screens. Match the existing Auth flow
and Chat screens' visual style exactly — same spacing, same rounded
corners, same shadow treatment.

GROUP A — Onboarding completion (extends the existing Auth flow)
1. Email Verification screen — shown right after Register: a "Check your
   email" state with a 6-digit code input (or a "click the link we sent"
   message), a resend-code link, and a countdown before resend is
   available again
2. Add a required "I agree to the Terms of Service and Privacy Policy"
   checkbox to the existing Register screen (currently the terms are just
   text with no explicit consent control) — the Create Account button
   should appear disabled/greyed until checked
3. Profile Setup screen — a one-time step after email verification:
   upload/choose a profile picture (with a default gradient-avatar
   fallback shown), confirm or edit the username, and a "Finish Setup"
   gradient button

GROUP B — Profile screens (this is what the existing "Profile" tab in
both the mobile bottom bar and desktop sidebar should now open — it
currently goes nowhere)
1. My Profile screen — large avatar at top with an edit/camera-icon
   overlay button, display name, username, bio, a stats row (e.g.
   communities joined, posts published), and an "Edit Profile" button
2. Edit Profile screen — editable avatar (tapping it opens the Avatar
   Upload & Crop modal below), display name field, username field, bio
   textarea, save/cancel actions
3. Avatar Upload & Crop modal — a modal with an image drop zone /
   "Choose Photo" button, then a circular crop-and-zoom interface once an
   image is selected, with Cancel and Save buttons
4. Another User's Profile screen (view-only) — same layout as My Profile
   but instead of "Edit Profile" shows "Message" and "..." (more options:
   block, report) buttons

GROUP C — Account & App Settings screen (reachable from the Profile
screen via a gear icon)
A single settings screen with grouped sections:
- Account: change email, change password, blocked users list (list of
  blocked users each with an "Unblock" button)
- Notifications: toggles for message notifications, community
  notifications, email digests
- Privacy: toggle for "who can see my last seen / online status"
- Appearance: a Light/Dark mode toggle (segmented control) — this is the
  entry point for dark mode, the actual dark theme itself comes in a
  later prompt
- Danger zone: "Log out" (with a confirmation modal: "Are you sure you
  want to log out?" / Cancel / Log Out) and "Delete Account" (with a
  stronger confirmation modal requiring the user to type "DELETE" to
  confirm)

RESPONSIVE BEHAVIOR — all screens in this prompt, at mobile (390px),
tablet (834px), desktop (1440px):
- Mobile: full-screen stacked pages with back navigation
- Tablet/Desktop: Settings and Profile render inside the app's existing
  persistent-sidebar shell (same shell as the Chat screens), as a content
  panel to the right of navigation — not a separate full app frame
```

---

## Prompt 2 — Notifications Center & Global Search

```
Using the existing design system, design two additions that plug into
the existing navigation shell (the same sidebar/top-bar/bottom-tab shell
used in the Chat screens).

1. Notification Center — a dropdown panel (desktop/tablet, opens from
   the existing notification bell icon) or a full screen (mobile,
   opens from a bell icon added to the top of the Chats list), showing a
   list of notifications: new message, someone joined your community,
   someone liked/commented on your post, someone mentioned you — each
   with an icon, a short description, a timestamp, and an unread dot.
   Include a "Mark all as read" action and an empty state ("You're all
   caught up").
2. In-app Toast Notification — a small dismissible toast that slides in
   from the top (mobile) or top-right (desktop) showing "New message from
   [Name]: [preview text]" with a gradient accent, used when a message
   arrives while the user is elsewhere in the app. Show it as an overlay
   on top of the Blog Feed screen as an example.
3. Push Notification Permission screen — the standard "Allow
   notifications?" pre-prompt shown once during onboarding, explaining
   why (Never miss a message), with "Not now" and "Allow" buttons.
4. Global Search — a search screen/overlay (triggered from a search icon
   in the top bar) with a single search input and tabbed results below
   it: People, Messages, Posts, Communities — each tab showing a short
   list of matching results in that category, and an empty/no-results
   state.

RESPONSIVE BEHAVIOR: Notification Center is a dropdown on tablet/desktop
and a full screen on mobile. Global Search is a full-screen overlay on
all three breakpoints, with the tab row scrollable horizontally on
mobile if needed.
```

---

## Prompt 3 — Chat Message Interactions

```
Using the existing Chat screens and message-bubble component as the
base, add the interaction layer that's currently missing. Keep the exact
same bubble shapes, colors, and spacing already established.

1. Emoji Picker — a popover/panel (opens from the existing emoji icon in
   the chat input bar) showing emoji organized into category tabs
   (Smileys, Gestures, Hearts, Objects, etc.) with a search bar at the
   top. Anchor it above the input bar.
2. Message Context Menu — the menu that appears on long-press (mobile)
   or right-click (desktop) on a message bubble, showing: React, Reply,
   Copy, Edit (only on your own messages), Forward, Pin, Delete (only on
   your own messages) — as a small rounded popover with icons + labels
3. Reaction Picker — a small horizontal row of quick-react emoji (👍 ❤️ 😂
   😮 😢 🙏) that appears above a message bubble when "React" is chosen
   from the context menu, plus how an added reaction renders attached to
   the bubble (small pill with emoji + count, tappable to see who
   reacted)
4. Reply Preview — show what it looks like when replying to a specific
   message: a compact quoted-message preview bar appears above the chat
   input (with the quoted sender name, quoted text snippet, and an X to
   cancel the reply), and how the sent reply then renders in the thread
   with a small quoted-message reference above the new bubble
5. Edit / Unsend states — show an existing sent message bubble in an
   "editing" state (text becomes an inline editable field with
   Save/Cancel), and how an unsent message renders in the thread
   afterward ("This message was deleted" in muted italic text)
6. Attachment Picker — the menu that opens from the paperclip/attach icon
   in the input bar: Photo/Video, Camera, File, Location — each as an
   icon + label in a small grid popover
7. Image Message Bubble — a new bubble type showing a sent/received photo
   (rounded corners matching the existing bubble radius, with the
   timestamp/read-receipt overlaid at the bottom corner like Messenger
   does), plus a fullscreen Image Viewer/Lightbox state (tapping the
   image opens it fullscreen with a close button and swipe/arrow
   navigation if there are multiple images)
8. Link Preview Card — how a message containing a URL renders: the link
   text plus a card below it showing a preview image, page title, and
   domain, using the existing card style
9. Voice note additions — a microphone-permission-denied state (a small
   inline message: "Microphone access needed to record voice notes" with
   a "Grant Access" button), a visible playback-speed control (1x / 1.5x
   / 2x toggle) on the played voice note bubble, and a draggable scrubber
   dot on the waveform to seek during playback

RESPONSIVE BEHAVIOR: all popovers/pickers anchor near their trigger and
adapt position on mobile vs desktop (e.g. the context menu becomes a
bottom sheet on mobile, a floating popover on desktop). The Image
Lightbox is always fullscreen regardless of breakpoint.
```

---

## Prompt 4 — Conversation Management & Group Info

```
Using the existing Chat screens, add the conversation-level actions and
screens that the current "⋮" (more options) icon in the chat top bar
should open, plus improvements to the chat list itself.

1. Conversation Options Menu — opens from the existing "⋮" icon in the
   chat top bar: Search in Conversation, Mute Notifications, Pin
   Conversation, Archive, Block/Report [User], Clear Chat History, Delete
   Conversation — as a dropdown (desktop) / bottom sheet (mobile)
2. Search-in-Conversation — a search bar that takes over the chat top
   bar, filtering/highlighting matching messages in the thread below,
   with up/down arrows to jump between matches and a match counter
   ("3 of 12")
3. Group/Community Info screen — opens when tapping the group name or
   avatar stack in a group chat's top bar: group photo, name, description,
   member list (each with an online dot and role label if applicable),
   "Add People" button, shared media grid (thumbnails), and a "Leave
   Group" action at the bottom
4. Add People to Chat — a screen/modal with a searchable contact list
   with checkboxes to multi-select people to add, and a confirm button
5. Confirmation modals for the destructive actions above — a shared
   modal pattern: "Delete this conversation? This can't be undone" with
   Cancel / Delete buttons in the error-red color from the design system.
   Reuse this same pattern for Clear Chat History and Leave Group.
6. Chat List enhancements — add a Pinned section (pinned conversations
   shown above the regular list, each with a small pin icon) and an
   Archived Chats screen (a separate list reachable from a link/icon at
   the bottom of the main chat list)

RESPONSIVE BEHAVIOR: Conversation Options Menu and confirmation modals
follow the same dropdown-on-desktop / bottom-sheet-on-mobile pattern as
Prompt 3. Group Info renders as a right-side panel on desktop (alongside
the open chat) and a full-screen page on mobile/tablet.
```

---

## Prompt 5 — Communities: Discover, Create, Join, Manage

```
Using the existing design system and the existing admin-side Community
Management screens as a style reference (but this is the member-facing
side, not admin), design the community screens that the existing
"Explore" and "Groups" navigation tabs should open — both currently lead
nowhere.

1. Discover Communities screen (this is what "Explore" opens) — a
   searchable, browsable grid/list of communities with a cover image,
   name, member count, a short description, and a "Join" button (or
   "Requested" state for private communities pending approval); include
   category filter chips at the top (e.g. Design, Tech, Gaming, Sports)
2. My Communities screen (this is what "Groups" opens) — a list of
   communities the user has already joined, each row showing the
   community avatar, name, latest activity preview, and unread indicator,
   plus a floating "Create Community" button
3. Create Community flow — a short multi-step or single-page form: name,
   description, cover image upload, Public/Private toggle (with a short
   explanation of what Private means — join requests must be approved),
   and a "Create" gradient button
4. Join Request Pending state — shown on a private community's card/page
   after requesting to join: "Request pending approval" with a Cancel
   Request option
5. Community Info & Settings (member-facing) — similar structure to the
   Group Info screen from Prompt 4 but for a full community: cover image,
   name, description, member list with role labels (Owner/Admin/Member),
   an "Invite People" button, and (only if the viewer is the Owner/Admin)
   inline controls to approve/reject pending join requests
6. Invite People flow — a modal with two tabs: "Invite from contacts"
   (searchable list with checkboxes) and "Share invite link" (a
   copyable link with a "Copy Link" button and confirmation toast)

RESPONSIVE BEHAVIOR:
- Mobile: single-column stacked screens, full-screen forms
- Tablet: two-column grid for Discover Communities
- Desktop: three-column grid for Discover Communities; Create Community
  and Invite People render as centered modals rather than full pages
```

---

## Prompt 6 — Blog Enhancements

```
Using the existing Blog screens (Feed, Post Detail, Create Post) as the
base, add the interactions currently missing. Match the existing card,
button, and typography styles exactly.

1. Threaded Comment Replies — show a comment with 1-2 nested replies
   indented beneath it, each reply with its own Like/Reply actions, and
   an inline reply-composer that appears directly under a comment when
   "Reply" is tapped (not a dead button like today)
2. Share Modal — opens from the existing Share action: options to copy
   link (with confirmation toast), share to Twitter/X, share via message
   (deep-links into the app's own chat — show it opening a mini
   conversation picker to send the post as a link inside a chat)
3. Bookmark/Save button — add a bookmark icon to PostCard and PostDetail
   (toggle state, filled vs outline), plus a new "Saved Posts" screen
   reachable from the Profile screen listing all bookmarked posts
4. Report Post/Comment — a small modal with a reason picklist (Spam,
   Harassment, Misinformation, Other) and a submit button, opened from a
   "..." menu on posts and comments
5. Edit/Delete own content — a "..." menu on a post or comment the
   current user authored, showing Edit and Delete (Delete opens the
   shared confirmation-modal pattern from Prompt 4)
6. Image Gallery/Lightbox for posts with multiple images — a horizontal
   scrollable image strip in PostDetail when a post has more than one
   image, tapping any image opens the same fullscreen Lightbox built in
   Prompt 3
7. Working image upload in Create Post — show the cover-image upload
   zone in an actual "image selected" state (thumbnail preview with a
   Replace/Remove option), not just an empty upload prompt

RESPONSIVE BEHAVIOR: Share Modal and Report Modal are centered modals on
tablet/desktop and bottom sheets on mobile. The image gallery strip
scrolls horizontally at all breakpoints.
```

---

## Prompt 7 — Admin Enhancements

```
Using the existing Admin Dashboard screens and its denser
dashboard/data-table visual style, add the missing safety and workflow
screens. Match the existing sidebar, table, and badge components exactly.

1. Confirmation Modals for destructive actions — a shared modal pattern
   (same visual language as the rest of the admin panel: clean, direct,
   error-red for the confirm button) used for: Suspend User, Delete User,
   Delete Post, Delete Community, Remove Member. Each states clearly what
   will happen and cannot be undone.
2. Reports/Moderation Queue screen — a new sidebar item showing a table
   of reported content (post, comment, or message), with columns for
   content preview, reporter, reason, date reported, and action buttons
   (Dismiss, Remove Content, Warn User, Ban User). Include a detail
   drawer/modal that shows the full reported content in context when a
   row is clicked.
3. Audit Log screen — a new sidebar item showing a chronological table of
   admin actions: which admin, what action (e.g. "Suspended user
   @johndoe"), and timestamp — with a filter by admin and by action type
4. Sign Out flow — wire the existing "Sign Out" sidebar item to open a
   confirmation modal ("Are you sure you want to sign out?"), using the
   same confirmation-modal pattern as item 1
5. Admin Account Settings — wire the existing "Settings" sidebar item to
   a screen showing the admin's own profile (name, email, avatar) and a
   change-password form — reuse the same layout approach as the
   consumer-facing Account Settings from Prompt 1, restyled to match the
   admin dashboard's denser visual language
6. Bulk Actions — add row-selection checkboxes to the Users and Blogs
   data tables, with a bulk-action bar that appears above the table once
   1+ rows are selected (e.g. "3 selected — Suspend / Delete / Cancel")

RESPONSIVE BEHAVIOR: Desktop and tablet as the primary targets (matching
the existing admin panel's approach) — modals are centered overlays,
the Reports and Audit Log tables scroll horizontally on tablet if
needed, following the same pattern as the existing Users/Blogs tables.
```

---

## Prompt 8 — Dark Mode & Global States (run this last)

```
This is a final pass across every screen already built in this project
(Auth, Chat, Blog, Admin, Profile, Settings, Notifications, Communities)
— run this only after all previous prompts have completed.

1. Dark Mode — generate a dark theme variant of every existing screen,
   using a dark neutral background (#18191A for the app background,
   #242526 for cards/surfaces), light text (#E4E6EB primary, #B0B3B8
   secondary), the same #00B2FF→#B620E0 gradient accent (it should pop
   even more on dark), and adjusted borders (#3A3B3C). Keep every layout,
   spacing, and component structure identical to the light mode
   version — only colors change. Show at least the Chat List, DM Chat,
   Blog Feed, and Profile screens in dark mode as the representative set.
2. Offline/Network Error State — a slim banner that appears at the top of
   the app ("You're offline — messages will send when you're back
   online") in the warning-amber color from the design system
3. Failed-to-Send Message state — how a message bubble renders when
   sending fails: a small red exclamation icon next to the bubble with a
   "Tap to retry" affordance
4. 404 / Not Found screen — a simple centered illustration + "Page not
   found" message + a gradient "Go back home" button, in the app's
   existing visual style
5. Session Expired modal — "Your session has expired, please log in
   again" with a single "Log In" button that would return the user to
   the Login screen
6. Loading skeleton states for screens that don't have one yet — Post
   Detail (skeleton cover image + text lines), Create Post (skeleton
   form), and each Admin screen's data table (skeleton rows) — matching
   the shimmer skeleton style already used in the Chat List and Blog Feed

RESPONSIVE BEHAVIOR: all of the above at mobile, tablet, and desktop,
consistent with how each equivalent light-mode screen already adapts.
```

---

## After this round

Once all 8 prompts have run, the design should have zero dead-end
navigation (Profile, Explore, Groups, notification bell, chat "⋮" menu,
emoji/attachment icons, admin Settings/Sign Out all lead somewhere real)
and cover every gap flagged in the audit. From here, the remaining work
is visual QA — scroll through every screen at every breakpoint and check
for consistency, rather than adding new screens.

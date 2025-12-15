# Tracks Page and Track Detail Page Design

## Overview

This design introduces two new pages to enable hierarchical curriculum navigation: a Tracks overview page displaying all available learning tracks, and a Track Detail page showing a visual timeline of Arcs and Battles within a selected track. The design leverages existing components and data structures to minimize redundant code while providing an intuitive, educational navigation experience.

---

## Design Goals

1. **Hierarchical Navigation**: Enable users to browse curriculum at the Track level before diving into specific Battles
2. **Visual Progress Tracking**: Display user progress across Tracks, Arcs, and Battles with clear visual feedback
3. **Open Access**: All battles are accessible regardless of completion status, encouraging non-linear exploration
4. **Reuse Existing Components**: Maximize use of existing shadcn/ui components and data structures
5. **Maintain Consistency**: Follow the platform's dark-mode IDE aesthetic and existing design patterns

---

## Page Structure

### Page 1: Tracks Overview (`/tracks`)

A high-level grid displaying all available learning tracks as course cards.

#### Layout

- Grid-based layout similar to existing battle selection page
- Responsive columns: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each track rendered as a distinct card with visual hierarchy

#### Track Card Components

Each track card displays:

| Element               | Purpose                                     | Data Source                                |
| --------------------- | ------------------------------------------- | ------------------------------------------ |
| Track Title           | Primary identifier                          | `Track.title`                              |
| Track Description     | Brief overview of domain                    | `Track.description`                        |
| Primary Skill         | Core competency taught                      | `Track.primarySkill`                       |
| Execution Type Badge  | Visual indicator (code/analysis/hybrid)     | `Track.executionType`                      |
| Supported Tools Icons | Visual representation of available tools    | `Track.supportedTools`                     |
| Progress Indicator    | Percentage or fraction of completed battles | Calculated from `challenge_progress` table |
| Status Badge          | "Active", "Coming Soon", or "Locked"        | Derived from available battles             |

#### Progress Calculation

For each track, calculate completion status:

```
Total Battles in Track = Count of battles where trackId matches
Completed Battles = Count of completed battles in challenge_progress for current user
Progress Percentage = (Completed / Total) × 100
```

#### Visual States

| State              | Condition                               | Visual Treatment                               |
| ------------------ | --------------------------------------- | ---------------------------------------------- |
| Active             | Track has available battles             | Full color, clickable, "Start" CTA             |
| Partially Complete | User completed some but not all battles | Progress bar visible, "Continue" CTA           |
| Completed          | All battles in track completed          | Green checkmark, "Review" CTA                  |
| Coming Soon        | Track exists but has no battles         | Grayed out, "Coming Soon" badge, not clickable |

#### Card Interaction

- Click on card navigates to `/tracks/[trackId]`
- Hover state highlights card with emerald accent (consistent with existing theme)
- Cards for inactive tracks show tooltip explaining unavailability

---

### Page 2: Track Detail Page (`/tracks/[trackId]`)

A vertical timeline view showing Arcs as section headers with Battles as connected nodes within each Arc.

#### Layout Structure

The page consists of three main sections:

1. **Track Header** (top section)
2. **Arc Timeline** (main content area)
3. **Overall Progress Bar** (sticky bottom or top)

#### Track Header

Displays track-level context:

| Element           | Description                          | Data Source                   |
| ----------------- | ------------------------------------ | ----------------------------- |
| Track Title       | Large, prominent heading             | `Track.title`                 |
| Track Description | Expanded description                 | `Track.description`           |
| Primary Skill Tag | Highlighted badge                    | `Track.primarySkill`          |
| Overall Progress  | Visual progress indicator with stats | Calculated from user progress |
| Back Navigation   | Return to tracks overview            | Link to `/tracks`             |

#### Arc Timeline Visualization

The timeline is a vertical flow where:

- **Arcs** serve as section headers/milestones
- **Battles** are nodes connected by vertical lines
- **Progression** flows top-to-bottom, representing learning path

##### Arc Section Header

Each arc displays:

| Component        | Purpose                       | Styling                          |
| ---------------- | ----------------------------- | -------------------------------- |
| Arc Number       | Sequential identifier         | Large, muted number (e.g., "01") |
| Arc Title        | Section name                  | Bold, prominent                  |
| Arc Description  | Mental model explanation      | Secondary text, expandable       |
| Mental Model Tag | Core concept being taught     | Highlighted badge or callout     |
| Arc Progress     | Battles completed in this arc | Small progress indicator         |

##### Battle Node Design

Each battle within an arc displays as a node:

| Element          | Purpose                | Visual Representation                      |
| ---------------- | ---------------------- | ------------------------------------------ |
| Node Container   | Battle card/pill       | Rounded container with border              |
| Battle Title     | Challenge name         | Primary text                               |
| Difficulty Badge | Challenge difficulty   | Reuse existing `DifficultyBadge` component |
| Tech Stack Icons | Technologies used      | Small icon badges                          |
| Status Indicator | Completion state       | Icon or background color                   |
| Connection Line  | Shows progression flow | Vertical line connecting nodes             |

##### Battle Node States

| State       | Visual Treatment                        | Interactivity                          |
| ----------- | --------------------------------------- | -------------------------------------- |
| Not Started | Default styling, normal opacity         | Clickable, navigates to `/battle/[id]` |
| In Progress | Blue/yellow accent, partial indicator   | Clickable, "Continue" indicator        |
| Completed   | Green background/border, checkmark icon | Clickable, "Replay" indicator          |

##### Connection Lines

- Vertical lines connect sequential battles within an arc
- Lines transition color based on completion (gray for not started, green for completed)
- All battles are accessible; lines serve as visual flow indicators only

#### Access Logic

All battles are accessible from the start, allowing users to:

1. **Explore freely**: Jump to any battle regardless of prior completion
2. **Follow recommended path**: Sequential order serves as suggested progression
3. **Skip ahead**: Advanced users can tackle harder challenges immediately
4. **Return anytime**: Completed battles remain accessible for review

The timeline visualization still shows recommended progression order through visual sequencing, but all nodes are interactive.

#### Progress Tracking

Overall track progress displayed as:

- **Progress Bar**: Visual bar showing percentage complete
- **Stats**: "X of Y Battles Completed"
- **Estimated Time**: Optional, based on average completion time

---

## Data Requirements

### Existing Data Structures

The design leverages existing types and data:

| Type                 | Location               | Usage                  |
| -------------------- | ---------------------- | ---------------------- |
| `Track`              | `lib/content/types.ts` | Track metadata         |
| `Arc`                | `lib/content/types.ts` | Arc metadata           |
| `Battle`             | `lib/content/types.ts` | Battle metadata        |
| `challenge_progress` | `lib/db/schema.ts`     | User completion status |

### New Helper Functions Required

To support the pages, the following utility functions will be needed:

| Function                                | Purpose                                   | Return Type                                                |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `getTrackProgress(userId, trackId)`     | Calculate completion percentage for track | `{ completed: number, total: number, percentage: number }` |
| `getArcProgress(userId, arcId)`         | Calculate completion for specific arc     | `{ completed: number, total: number, percentage: number }` |
| `getBattleStatus(userId, battleId)`     | Determine battle state                    | `'not_started' \| 'in_progress' \| 'completed'`            |
| `getBattlesWithStatus(userId, trackId)` | Get all battles for track with status     | `Array<Battle & { status: BattleStatus }>`                 |

### Database Queries

Required queries to fetch user progress:

1. **Get all completed battles for user**:

   - Query `challenge_progress` table
   - Filter by `userId` and `status = 'completed'`
   - Return array of `challengeId`

2. **Get track-specific progress**:

   - Join battles with progress table
   - Filter by `trackId` and `userId`
   - Aggregate completion counts

3. **Get arc-specific progress**:
   - Join battles with progress table
   - Filter by `arcId` and `userId`
   - Aggregate completion counts

---

## Component Reuse Strategy

### Existing Components to Reuse

| Component                                                          | Location                             | Usage in New Pages                            |
| ------------------------------------------------------------------ | ------------------------------------ | --------------------------------------------- |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter` | `components/ui/card.tsx`             | Track cards, Battle nodes                     |
| `Badge`                                                            | `components/ui/badge.tsx`            | Execution type, tech stack, status indicators |
| `DifficultyBadge`                                                  | `components/ui/difficulty-badge.tsx` | Battle difficulty display                     |
| `Button`                                                           | `components/ui/button.tsx`           | Navigation, CTAs                              |
| `LoadingScreen`                                                    | `components/ui/loading-screen.tsx`   | Async data loading states                     |
| `AuthButton`                                                       | `components/auth/AuthButton.tsx`     | User authentication status                    |

### New Components Needed

| Component     | Purpose                            | Props                                                              |
| ------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `TrackCard`   | Display track overview in grid     | `track: Track, progress: ProgressData, status: TrackStatus`        |
| `ArcTimeline` | Render vertical arc timeline       | `arc: Arc, battles: BattleWithStatus[], arcProgress: ProgressData` |
| `BattleNode`  | Individual battle node in timeline | `battle: Battle, status: BattleStatus`                             |
| `ProgressBar` | Reusable progress indicator        | `current: number, total: number, variant?: 'track' \| 'arc'`       |
| `TrackHeader` | Track detail page header           | `track: Track, progress: ProgressData`                             |

---

## Page Routing

### Route Structure

| Route               | Page Component       | Data Loading                                         |
| ------------------- | -------------------- | ---------------------------------------------------- |
| `/tracks`           | Tracks overview page | Fetch all tracks + user progress                     |
| `/tracks/[trackId]` | Track detail page    | Fetch track, arcs, battles + user progress for track |

### Navigation Flow

```
Home (/) → Tracks Overview (/tracks) → Track Detail (/tracks/[trackId]) → Battle (/battle/[id])
```

Users can also access battles directly from the home page (existing behavior remains unchanged).

---

## Visual Design Specifications

### Color Scheme (Consistent with Platform)

| Element         | Color                                    | Usage                          |
| --------------- | ---------------------------------------- | ------------------------------ |
| Background      | `bg-zinc-950`                            | Page background                |
| Card Background | `bg-zinc-900/50`                         | Card containers                |
| Primary Text    | `text-white`                             | Headings, titles               |
| Secondary Text  | `text-zinc-400`                          | Descriptions, metadata         |
| Accent (Active) | `text-emerald-400`, `border-emerald-500` | Active states, completed items |
| Accent (Hover)  | `hover:bg-emerald-500`                   | Interactive elements           |
| Border Default  | `border-zinc-800`                        | Default borders                |
| Border Hover    | `border-zinc-700`                        | Hover state borders            |

### Typography

- **Track Titles**: `text-5xl font-extrabold`
- **Arc Titles**: `text-2xl font-bold`
- **Battle Titles**: `text-xl font-semibold`
- **Descriptions**: `text-sm text-zinc-400`
- **Badges**: `text-xs uppercase tracking-wider`

### Spacing and Layout

- **Page Padding**: `p-8`
- **Max Content Width**: `max-w-6xl mx-auto`
- **Grid Gap**: `gap-6` for track cards
- **Arc Sections**: `mb-12` spacing between arcs
- **Battle Nodes**: `gap-4` vertical spacing

### Animations and Transitions

- **Card Hover**: `transition-all duration-300`
- **Border Color**: `transition-colors`
- **Progress Bar Fill**: Animated width transition
- **Completion Checkmark**: Fade-in animation when battle is completed

---

## User Experience Flows

### Flow 1: New User First Visit

1. User lands on `/tracks` page
2. Sees grid of track cards
3. Only "Frontend Debugging" track shows "Active" status (per current MVP state)
4. User clicks "Frontend Debugging" card
5. Navigates to `/tracks/frontend-debugging`
6. Sees all battles accessible with visual progression order
7. Clicks any battle to start (recommended: first battle)

### Flow 2: Returning User with Progress

1. User lands on `/tracks` page
2. Sees progress indicators on track cards
3. "Frontend Debugging" shows "50% Complete" (example)
4. User clicks track to continue
5. On track detail page, sees:
   - Completed battles with green checkmarks
   - Not started battles with default styling
   - All battles are clickable and accessible
6. User clicks next recommended battle, jumps ahead, or replays completed one

### Flow 3: Non-Linear Exploration

1. User on track detail page
2. Scans timeline and identifies interesting battle
3. Clicks on any battle regardless of position
4. Navigates directly to battle page
5. Can return to timeline and choose different battle

---

## Accessibility Considerations

### Keyboard Navigation

- All interactive elements (cards, buttons, battle nodes) must be keyboard accessible
- Tab order follows visual flow: top to bottom, left to right
- Focus states clearly visible with outline or border change

### Screen Readers

- Semantic HTML structure with proper heading hierarchy
- ARIA labels for progress indicators: `aria-label="3 of 10 battles completed"`
- ARIA labels for battle nodes: `aria-label="Battle: [title], Status: [completed/not started]"`
- Alt text for status icons and completion indicators

### Visual Accessibility

- Sufficient color contrast for text readability
- Status not conveyed by color alone (use icons + text)
- Progress indicators include numerical text alongside visual bar
- Completion state uses checkmark icon + green accent, not color alone

---

## Error States and Edge Cases

### No Battles in Track

When a track has no battles:

- Display "Coming Soon" message
- Show track description and learning objectives
- Provide CTA to return to tracks overview or explore other tracks

### Incomplete User Data

If user is not authenticated:

- Progress indicators show "Sign in to track progress"
- All battles remain accessible (educational content is free)
- Prompt to sign in for progress saving

### Failed Data Loading

- Display loading skeleton during data fetch
- Show error message if data fetch fails
- Provide retry button
- Fallback to showing static track/arc structure without progress data

### Edge Case: All Battles Completed

- Congratulatory message at track header
- All battles show green/completed state
- CTA to explore other tracks or replay battles
- Optional: Achievement badge or certificate

---

## Performance Considerations

### Data Loading Strategy

- **Tracks Page**: Load all track metadata + aggregate progress counts (lightweight query)
- **Track Detail Page**: Load full battle data only for selected track (not all tracks)
- Use React suspense boundaries for progressive loading
- Cache track/arc metadata client-side (infrequently changing data)

### Optimization Techniques

- Lazy load battle details as user scrolls timeline
- Memoize progress calculations to prevent unnecessary re-computation
- Use dynamic imports for page components (code splitting)
- Prefetch adjacent track data on hover for faster navigation

---

## Implementation Phases

### Phase 1: Data Layer

1. Implement helper functions for progress calculation
2. Create database queries for user progress retrieval
3. Add server actions for fetching track/arc data with progress

### Phase 2: Component Development

1. Build `ProgressBar` component
2. Build `TrackCard` component
3. Build `TrackHeader` component
4. Build `BattleNode` component
5. Build `ArcTimeline` component

### Phase 3: Page Implementation

1. Create `/tracks` page with track grid
2. Create `/tracks/[trackId]` dynamic route
3. Integrate data fetching with components
4. Implement loading and error states

### Phase 4: Polish and Interactivity

1. Add hover states and transitions
2. Implement completion status visualization
3. Add tooltips for battle metadata (difficulty, tech stack)
4. Test keyboard navigation and accessibility
5. Optimize performance

---

## Future Enhancements

### Potential Features Beyond MVP

| Feature               | Description                                   | Complexity |
| --------------------- | --------------------------------------------- | ---------- |
| Arc Filtering         | Filter battles by completion status           | Low        |
| Search/Filter Tracks  | Search tracks by skill or technology          | Medium     |
| Track Recommendations | Suggest next track based on completion        | Medium     |
| Detailed Analytics    | Show time spent, common mistakes              | High       |
| Social Features       | Share progress, compare with friends          | High       |
| Achievements          | Unlock badges for completing tracks/arcs      | Medium     |
| Custom Learning Paths | Allow users to create custom battle sequences | High       |

---

## Technical Specifications Summary

### File Structure

```
/app
  /tracks
    page.tsx                    # Tracks overview page
    /[trackId]
      page.tsx                  # Track detail page
/components
  /tracks
    TrackCard.tsx               # Track card component
    TrackHeader.tsx             # Track detail header
    ArcTimeline.tsx             # Arc timeline component
    BattleNode.tsx              # Battle node component
    ProgressBar.tsx             # Progress indicator component
/lib
  /actions
    track-progress.ts           # Server actions for track progress
  /utils
    progress-calculator.ts      # Progress calculation utilities
```

### API Endpoints (Server Actions)

| Action                              | Purpose                                      | Parameters                         | Return Type                   |
| ----------------------------------- | -------------------------------------------- | ---------------------------------- | ----------------------------- |
| `getTracksWithProgress(userId)`     | Fetch all tracks with user progress          | `userId: string`                   | `Array<Track & ProgressData>` |
| `getTrackDetail(trackId, userId)`   | Fetch track with arcs, battles, and progress | `trackId: string, userId: string`  | `TrackDetailData`             |
| `getUserProgress(userId, trackId?)` | Get user progress for all or specific track  | `userId: string, trackId?: string` | `ProgressMap`                 |

### Type Definitions

```
BattleStatus = 'not_started' | 'in_progress' | 'completed'

TrackStatus = 'active' | 'coming_soon' | 'locked'

ProgressData = {
  completed: number
  total: number
  percentage: number
}

BattleWithStatus = Battle & {
  status: BattleStatus
}

TrackDetailData = {
  track: Track
  arcs: Array<Arc & {
    battles: BattleWithStatus[]
    progress: ProgressData
  }>
  overallProgress: ProgressData
}
```

---

## Migration from Current State

### Current State Analysis

- Home page (`/app/page.tsx`) displays flat list of all battles
- No track-based navigation
- Battles accessible without hierarchical context
- Progress tracking exists but not visualized hierarchically

### Migration Strategy

1. **Preserve existing home page**: Keep current battle grid functional for direct access
2. **Add tracks navigation**: Introduce `/tracks` as new entry point
3. **Gradual transition**: Allow users to access battles from both old and new flows
4. **Data migration**: No database changes required (schema already supports hierarchy)
5. **Component extraction**: Extract reusable parts from home page for track pages

### Backward Compatibility

- Existing `/battle/[id]` routes remain unchanged
- Direct links to battles continue to work
- Home page can be repurposed or kept as "Quick Start" view
- No breaking changes to existing user data

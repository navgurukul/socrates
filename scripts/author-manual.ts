/**
 * Hand-authored challenge pipeline — same verify gate, NO model / API key.
 *
 *   pnpm author:manual
 *
 * Define candidates inline below (the same shape the AI would produce). Each is
 * VERIFIED (buggy fails, fixed passes) before it is written + registered, exactly
 * like scripts/author-challenge.ts — only the generate step is removed.
 *
 * Run this ALONE — it appends to generatedRegistry.ts, so no other author process
 * may run concurrently.
 */
import { getArc, getAllBattlesMeta } from "../lib/content/registry";
import { generatedBattles } from "../lib/content/generatedRegistry";
import { scaffoldForTrack, SupportedTrack } from "./authoring/scaffold";
import { Candidate } from "./authoring/generate";
import { verifyCandidate } from "./authoring/verify";
import { emitChallenge } from "./authoring/emit";
import { Difficulty } from "../lib/content/types";

interface ManualBattle {
  arcId: string;
  difficulty: Difficulty;
  candidate: Candidate;
}

// ── Hand-authored battles ───────────────────────────────────────────────────
const battles: ManualBattle[] = manualBattles();
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // Track orders per arc so multiple battles for one arc don't collide.
  const meta = [
    ...getAllBattlesMeta(),
    ...generatedBattles.map((b) => ({ id: b.id, arcId: b.arcId, order: b.order })),
  ];
  const nextOrderFor: Record<string, number> = {};
  const slugTaken = new Set(meta.map((m) => m.id));
  for (const m of meta) {
    nextOrderFor[m.arcId] = Math.max(nextOrderFor[m.arcId] ?? 0, m.order);
  }

  let ok = 0;
  for (const { arcId, difficulty, candidate } of battles) {
    const arc = getArc(arcId);
    if (!arc) {
      console.log(`✗ ${candidate.slug}: unknown arc "${arcId}"`);
      continue;
    }
    if (slugTaken.has(candidate.slug)) {
      console.log(`✗ ${candidate.slug}: slug already exists`);
      continue;
    }

    console.log(`"${candidate.title}" (${candidate.slug}) — verifying...`);
    const scaffold = scaffoldForTrack(
      arc.trackId as SupportedTrack,
      candidate.title,
      candidate.componentName
    );
    const verdict = await verifyCandidate(arc.trackId, scaffold, candidate);
    if (!verdict.ok) {
      console.log(`  ✗ rejected: ${verdict.reason}\n`);
      continue;
    }

    const order = (nextOrderFor[arcId] = (nextOrderFor[arcId] ?? 0) + 1);
    const out = emitChallenge({
      trackId: arc.trackId,
      arcId,
      order,
      difficulty,
      scaffold,
      candidate,
    });
    slugTaken.add(candidate.slug);
    ok++;
    console.log(`  ✓ verified + written: ${out.filePath}\n`);
  }

  console.log(`Done. ${ok}/${battles.length} battle(s) created.`);
}

// All hand-authored candidates live in one function for easy review/extension.
// Already-emitted slugs are skipped automatically (idempotent).
function manualBattles(): ManualBattle[] {
  return [
    raceConditionSearch(),
    optimisticRollbackMissing(),
    staleClosureInterval(),
    listenerLeakDoubleCount(),
    labelInputAssociationBroken(),
    accordionAriaExpandedStale(),
    showPasswordTypeToggle(),
    controlledInputNoOnChange(),
    cartZeroRenderLeak(),
    loadingSpinnerNeverClears(),
    useMemoStaleDeps(),
    // Backend track
    dedupeInflightRequests(),
    lostUpdateReadModifyWrite(),
    nPlusOneUserPosts(),
    idempotentEventProcessing(),
    nPlusOneParallelCounts(),
    forEachAsyncFloatingPromise(),
    overBroadCatchSwallowsError(),
    partialTransferNoRollback(),
    batchInsertNoTransaction(),
    writeThroughCacheStale(),
    ttlCacheNeverExpires(),
  ];
}

/**
 * Production-grade boss battle: async out-of-order response race.
 * A per-keystroke search where a SLOW earlier request resolves AFTER a faster
 * later request, clobbering the newer (correct) results — the classic
 * "last response wins" production incident. Fix: ignore stale responses.
 */
function raceConditionSearch(): ManualBattle {
  const buggyContents = `import React, { useEffect, useState } from 'react'

interface SearchResponse {
  results: string[]
}

export default function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    fetch(\`/api/search?q=\${query}\`)
      .then((res) => res.json() as Promise<SearchResponse>)
      .then((data) => {
        // BUG: no guard against stale responses. A slow request for an older
        // query can resolve after a newer one and overwrite the correct results.
        setResults(data.results)
      })
  }, [query])

  return (
    <div className="container">
      <input
        aria-label="search"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  )
}
`;

  const fixedContents = `import React, { useEffect, useState } from 'react'

interface SearchResponse {
  results: string[]
}

export default function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    let active = true
    fetch(\`/api/search?q=\${query}\`)
      .then((res) => res.json() as Promise<SearchResponse>)
      .then((data) => {
        // Ignore responses from queries that are no longer current.
        if (active) setResults(data.results)
      })
    return () => {
      active = false
    }
  }, [query])

  return (
    <div className="container">
      <input
        aria-label="search"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  )
}
`;

  const testContents = `import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import ProductSearch from './ProductSearch'

afterEach(() => {
  vi.restoreAllMocks()
})

// Deferred promise helper so the test controls resolution order.
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

test('newer query results are not clobbered by a slow older response', async () => {
  const slow = deferred<{ results: string[] }>()

  const fetchMock = vi.fn((url: string) => {
    if (url.includes('q=ab')) {
      // The newer request resolves immediately.
      return Promise.resolve({
        json: () => Promise.resolve({ results: ['ab-result'] }),
      } as Response)
    }
    // The older request (q=a) is slow and resolves later, under our control.
    return Promise.resolve({
      json: () => slow.promise,
    } as Response)
  })
  vi.stubGlobal('fetch', fetchMock)

  render(<ProductSearch />)
  const input = screen.getByLabelText('search')

  // Type the older query, then quickly the newer one.
  fireEvent.change(input, { target: { value: 'a' } })
  fireEvent.change(input, { target: { value: 'ab' } })

  // Newer (fast) response lands first.
  await screen.findByText('ab-result')

  // Now the stale older response finally resolves.
  slow.resolve({ results: ['a-result'] })

  // Give the stale promise a chance to (incorrectly) apply.
  await waitFor(() => {
    expect(screen.getByText('ab-result')).toBeInTheDocument()
  })
  expect(screen.queryByText('a-result')).not.toBeInTheDocument()
})
`;

  return {
    arcId: "production-debugging-boss",
    difficulty: "Hard",
    candidate: {
      componentName: "ProductSearch",
      slug: "search-response-race",
      title: "Search Results Clobbered by Stale Response",
      description: `Severity: High
Component: ProductSearch
Context: ProductSearch fetches results on every change to the query and renders them as a list. Users report that the displayed results sometimes do not match what they typed.

Reproduction:
1. Type a query (e.g. "a"). The request is slow on this connection.
2. Before it returns, refine the query (e.g. "ab"). This request returns quickly and the correct results for "ab" appear.
3. A moment later the list changes to show results for the OLD query "a" instead.

Expected: The list always reflects the most recent query the user typed, regardless of the order in which network responses arrive.`,
      bugConcept:
        "Per-keystroke fetch has no staleness guard, so a slow older response resolves after a newer one and overwrites the correct results (last-response-wins race).",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Boss battle: optimistic UI update with no rollback on failure.
 * The like count increments immediately, but when the POST fails the increment
 * is never undone — the UI shows a "like" that was never persisted.
 */
function optimisticRollbackMissing(): ManualBattle {
  const buggyContents = `import React, { useState } from 'react'

export default function LikeButton() {
  const [likes, setLikes] = useState(0)
  const [failed, setFailed] = useState(false)

  async function handleLike() {
    setFailed(false)
    setLikes((n) => n + 1) // optimistic update
    try {
      const res = await fetch('/api/like', { method: 'POST' })
      if (!res.ok) throw new Error('request failed')
    } catch {
      // BUG: the error is surfaced but the optimistic increment is never rolled
      // back, so a failed like still shows as counted.
      setFailed(true)
    }
  }

  return (
    <div className="container">
      <button className="btn" onClick={handleLike}>
        Like
      </button>
      <span data-testid="like-count">{likes}</span>
      {failed && <p role="alert">Could not save your like.</p>}
    </div>
  )
}
`;

  const fixedContents = `import React, { useState } from 'react'

export default function LikeButton() {
  const [likes, setLikes] = useState(0)
  const [failed, setFailed] = useState(false)

  async function handleLike() {
    setFailed(false)
    setLikes((n) => n + 1) // optimistic update
    try {
      const res = await fetch('/api/like', { method: 'POST' })
      if (!res.ok) throw new Error('request failed')
    } catch {
      // Roll the optimistic update back when the request fails.
      setLikes((n) => n - 1)
      setFailed(true)
    }
  }

  return (
    <div className="container">
      <button className="btn" onClick={handleLike}>
        Like
      </button>
      <span data-testid="like-count">{likes}</span>
      {failed && <p role="alert">Could not save your like.</p>}
    </div>
  )
}
`;

  const testContents = `import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import LikeButton from './LikeButton'

afterEach(() => {
  vi.restoreAllMocks()
})

test('a failed like is rolled back to the original count', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: false } as Response))
  )

  render(<LikeButton />)
  fireEvent.click(screen.getByText('Like'))

  // The failure is surfaced to the user...
  await screen.findByRole('alert')

  // ...and the optimistic increment must be undone (back to 0).
  await waitFor(() => {
    expect(screen.getByTestId('like-count')).toHaveTextContent('0')
  })
})
`;

  return {
    arcId: "production-debugging-boss",
    difficulty: "Hard",
    candidate: {
      componentName: "LikeButton",
      slug: "optimistic-update-no-rollback",
      title: "Failed Like Still Counts",
      description: `Severity: High
Component: LikeButton
Context: LikeButton optimistically increments the visible like count, then persists the like with a POST. Users report likes that "stick" on screen even when the save fails (e.g. offline), so the count no longer matches the server.

Reproduction:
1. Simulate a failing /api/like request (server error or offline).
2. Click "Like". The count increments immediately to 1.
3. The request fails and an error message appears.

Expected: When the save fails, the optimistic increment is undone so the displayed count reflects what was actually persisted.`,
      bugConcept:
        "Optimistic increment is applied before the request, but the catch branch only shows an error and never reverts the count, so failed likes are still counted.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Boss battle: stale closure inside setInterval.
 * The interval callback closes over the initial state, so the timer is frozen
 * at 1 instead of counting up every second.
 */
function staleClosureInterval(): ManualBattle {
  const buggyContents = `import React, { useEffect, useState } from 'react'

export default function SessionTimer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      // BUG: this closes over the initial \`seconds\` (0), so every tick sets the
      // value to 0 + 1. The timer is stuck at 1 instead of incrementing.
      setSeconds(seconds + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="container">
      <span data-testid="seconds">{seconds}</span>
    </div>
  )
}
`;

  const fixedContents = `import React, { useEffect, useState } from 'react'

export default function SessionTimer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      // Use the functional updater so each tick builds on the latest value.
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="container">
      <span data-testid="seconds">{seconds}</span>
    </div>
  )
}
`;

  const testContents = `import { render, screen, act } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import SessionTimer from './SessionTimer'

afterEach(() => {
  vi.useRealTimers()
})

test('the timer counts up each second instead of freezing at 1', () => {
  vi.useFakeTimers()
  render(<SessionTimer />)

  act(() => {
    vi.advanceTimersByTime(3000)
  })

  // Three seconds elapsed => the display must read 3, not 1.
  expect(screen.getByTestId('seconds')).toHaveTextContent('3')
})
`;

  return {
    arcId: "production-debugging-boss",
    difficulty: "Hard",
    candidate: {
      componentName: "SessionTimer",
      slug: "interval-stale-closure-freeze",
      title: "Session Timer Frozen at One Second",
      description: `Severity: Medium
Component: SessionTimer
Context: SessionTimer shows how long the current session has been active, updating once per second from a setInterval. Users report the timer jumps to 1 and then never moves.

Reproduction:
1. Mount SessionTimer.
2. Wait several seconds.
3. Observe the displayed value stays at 1 instead of climbing (2, 3, ...).

Expected: The displayed seconds increase by one every second for as long as the component is mounted.`,
      bugConcept:
        "setInterval callback closes over the initial state value and uses a non-functional setter, so every tick recomputes from 0 and the counter is stuck at 1.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Boss battle: missing effect cleanup leaks event listeners.
 * The effect re-subscribes on every render without removing the old handler,
 * so listeners accumulate and each event is counted multiple times.
 */
function listenerLeakDoubleCount(): ManualBattle {
  const buggyContents = `import React, { useEffect, useState } from 'react'

export default function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handler = () => setCount((c) => c + 1)
    window.addEventListener('notification', handler)
    // BUG: no cleanup. This effect runs after every render and each run adds
    // another listener, so a single event eventually fires the handler many times.
  })

  return (
    <div className="container">
      <span data-testid="count">{count}</span>
    </div>
  )
}
`;

  const fixedContents = `import React, { useEffect, useState } from 'react'

export default function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handler = () => setCount((c) => c + 1)
    window.addEventListener('notification', handler)
    // Remove the previous handler before the next effect run re-subscribes.
    return () => window.removeEventListener('notification', handler)
  })

  return (
    <div className="container">
      <span data-testid="count">{count}</span>
    </div>
  )
}
`;

  const testContents = `import { render, screen, act } from '@testing-library/react'
import { expect, test } from 'vitest'
import NotificationBadge from './NotificationBadge'

test('each notification increments the badge exactly once', () => {
  render(<NotificationBadge />)

  act(() => {
    window.dispatchEvent(new Event('notification'))
  })
  act(() => {
    window.dispatchEvent(new Event('notification'))
  })

  // Two notifications must produce a count of exactly 2; leaked listeners
  // would over-count (3 or more).
  expect(screen.getByTestId('count')).toHaveTextContent('2')
})
`;

  return {
    arcId: "production-debugging-boss",
    difficulty: "Hard",
    candidate: {
      componentName: "NotificationBadge",
      slug: "listener-leak-double-count",
      title: "Notification Badge Over-Counts",
      description: `Severity: High
Component: NotificationBadge
Context: NotificationBadge listens for a global "notification" event and shows how many have arrived. Users report the badge climbs faster than the number of real notifications, and the longer the page is open the worse it gets.

Reproduction:
1. Mount NotificationBadge.
2. Dispatch a "notification" event, then dispatch a second one.
3. Observe the count reads more than 2.

Expected: The count equals the number of notification events dispatched — one increment per event.`,
      bugConcept:
        "Effect re-subscribes a window listener on every render with no cleanup, so handlers accumulate and each event increments the count multiple times.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Browser/DOM battle: label not associated with its input.
 * The label's htmlFor doesn't match the input's id, so clicking the label
 * doesn't focus the field and assistive tech can't pair them.
 */
function labelInputAssociationBroken(): ManualBattle {
  const buggyContents = `import React, { useState } from 'react'

export default function EmailField() {
  const [value, setValue] = useState('')

  return (
    <div className="container">
      <label htmlFor="email">Email</label>
      <input
        // BUG: id does not match the label's htmlFor ("email"), so the label
        // is not associated with this control.
        id="email-address"
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}
`;

  const fixedContents = `import React, { useState } from 'react'

export default function EmailField() {
  const [value, setValue] = useState('')

  return (
    <div className="container">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}
`;

  const testContents = `import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import EmailField from './EmailField'

test('the label is associated with the email input', () => {
  render(<EmailField />)

  // Throws if no control is associated with the "Email" label.
  const input = screen.getByLabelText('Email')
  expect(input).toHaveAttribute('type', 'email')
})
`;

  return {
    arcId: "browser-and-dom",
    difficulty: "Easy",
    candidate: {
      componentName: "EmailField",
      slug: "label-input-association-broken",
      title: "Email Label Not Linked to Its Input",
      description: `Severity: Medium
Component: EmailField
Context: EmailField renders an "Email" label above a text input. Users on screen readers report the field is announced as unlabeled, and clicking the label text does not focus the input.

Reproduction:
1. Render EmailField.
2. Click the "Email" label text.
3. Note the input does not receive focus; assistive tech finds no label for the field.

Expected: The label is programmatically associated with the input so clicking the label focuses it and screen readers announce the field name.`,
      bugConcept:
        "label htmlFor and input id do not match, so the label is not associated with the control (accessibility + click-to-focus break).",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Browser/DOM battle: aria-expanded hardcoded.
 * The disclosure content shows/hides correctly, but aria-expanded is a constant
 * so assistive tech always reports the section as collapsed.
 */
function accordionAriaExpandedStale(): ManualBattle {
  const buggyContents = `import React, { useState } from 'react'

export default function Accordion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="container">
      <button
        className="btn"
        // BUG: aria-expanded is hardcoded to false; it never reflects \`open\`.
        aria-expanded={false}
        onClick={() => setOpen((o) => !o)}
      >
        Details
      </button>
      {open && <div role="region">Account details here</div>}
    </div>
  )
}
`;

  const fixedContents = `import React, { useState } from 'react'

export default function Accordion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="container">
      <button
        className="btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Details
      </button>
      {open && <div role="region">Account details here</div>}
    </div>
  )
}
`;

  const testContents = `import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import Accordion from './Accordion'

test('aria-expanded reflects the open state', () => {
  render(<Accordion />)
  const toggle = screen.getByRole('button', { name: 'Details' })

  expect(toggle).toHaveAttribute('aria-expanded', 'false')

  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
})
`;

  return {
    arcId: "browser-and-dom",
    difficulty: "Medium",
    candidate: {
      componentName: "Accordion",
      slug: "accordion-aria-expanded-stale",
      title: "Accordion Always Reports Collapsed",
      description: `Severity: Medium
Component: Accordion
Context: Accordion shows a "Details" toggle that reveals a content region. Visually it expands and collapses correctly, but screen reader users always hear "collapsed", even after opening it.

Reproduction:
1. Render Accordion and inspect the toggle button's aria-expanded value.
2. Click "Details" to reveal the content.
3. Re-inspect aria-expanded — it still reports the section as collapsed.

Expected: aria-expanded is "true" when the content is visible and "false" when hidden.`,
      bugConcept:
        "aria-expanded is hardcoded to false instead of bound to the open state, so the disclosure's accessible state never updates.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Browser/DOM battle: show-password toggles a class, not the input type.
 * The eye toggle flips a className but leaves type="password", so the value
 * stays masked no matter what.
 */
function showPasswordTypeToggle(): ManualBattle {
  const buggyContents = `import React, { useState } from 'react'

export default function PasswordInput() {
  const [visible, setVisible] = useState(false)

  return (
    <div className="container">
      <input
        aria-label="password"
        // BUG: only a class changes; type stays "password" so it never reveals.
        type="password"
        className={visible ? 'is-visible' : 'is-masked'}
        defaultValue="hunter2"
      />
      <button className="btn" onClick={() => setVisible((v) => !v)}>
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
`;

  const fixedContents = `import React, { useState } from 'react'

export default function PasswordInput() {
  const [visible, setVisible] = useState(false)

  return (
    <div className="container">
      <input
        aria-label="password"
        type={visible ? 'text' : 'password'}
        className={visible ? 'is-visible' : 'is-masked'}
        defaultValue="hunter2"
      />
      <button className="btn" onClick={() => setVisible((v) => !v)}>
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
`;

  const testContents = `import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import PasswordInput from './PasswordInput'

test('toggling reveal switches the input type to text', () => {
  render(<PasswordInput />)
  const input = screen.getByLabelText('password')

  expect(input).toHaveAttribute('type', 'password')

  fireEvent.click(screen.getByText('Show'))
  expect(input).toHaveAttribute('type', 'text')
})
`;

  return {
    arcId: "browser-and-dom",
    difficulty: "Medium",
    candidate: {
      componentName: "PasswordInput",
      slug: "show-password-type-toggle",
      title: "Show Password Button Does Nothing",
      description: `Severity: Medium
Component: PasswordInput
Context: PasswordInput has a "Show"/"Hide" button meant to reveal the masked value. The button label flips, but the characters stay masked as dots.

Reproduction:
1. Render PasswordInput with a value entered.
2. Click "Show". The button label changes to "Hide".
3. The field still renders masked dots instead of the plain text value.

Expected: Clicking "Show" switches the input to plain text so the value is readable, and "Hide" masks it again.`,
      bugConcept:
        "The reveal toggle only swaps a CSS class while the input keeps type=\"password\", so the value is never actually shown.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * React battle: controlled input with no onChange.
 * The input has a value bound to state but no onChange handler, so React keeps
 * resetting it and typing does nothing.
 */
function controlledInputNoOnChange(): ManualBattle {
  const buggyContents = `import React, { useState } from 'react'

export default function NameField() {
  const [name, setName] = useState('')

  return (
    <div className="container">
      <input
        aria-label="name"
        value={name}
        placeholder="Your name"
        // BUG: no onChange — the value is controlled by state that never
        // updates, so React resets the field on every keystroke.
      />
      <p data-testid="greeting">Hello, {name || 'stranger'}</p>
    </div>
  )
}
`;

  const fixedContents = `import React, { useState } from 'react'

export default function NameField() {
  const [name, setName] = useState('')

  return (
    <div className="container">
      <input
        aria-label="name"
        value={name}
        placeholder="Your name"
        onChange={(e) => setName(e.target.value)}
      />
      <p data-testid="greeting">Hello, {name || 'stranger'}</p>
    </div>
  )
}
`;

  const testContents = `import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import NameField from './NameField'

test('typing into the field updates its value and the greeting', () => {
  render(<NameField />)
  const input = screen.getByLabelText('name')

  fireEvent.change(input, { target: { value: 'Ada' } })

  expect(input).toHaveValue('Ada')
  expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, Ada')
})
`;

  return {
    arcId: "react-and-components",
    difficulty: "Easy",
    candidate: {
      componentName: "NameField",
      slug: "controlled-input-no-onchange",
      title: "Name Field Won't Accept Typing",
      description: `Severity: High
Component: NameField
Context: NameField lets a user type their name, which is echoed in a greeting below the input. Users report they cannot type anything into the field.

Reproduction:
1. Render NameField.
2. Click the input and type "Ada".
3. The field stays empty and the greeting keeps saying "Hello, stranger".

Expected: Typing updates the field's value and the greeting reflects what was typed.`,
      bugConcept:
        "Input is controlled (value from state) but has no onChange handler, so React resets it on every keystroke and the value never changes.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * React battle: the `0 && <JSX>` falsy-render leak.
 * An empty cart renders a stray "0" because a number is used as the && guard.
 */
function cartZeroRenderLeak(): ManualBattle {
  const buggyContents = `import React from 'react'

export default function CartBadge({ itemCount = 0 }: { itemCount?: number }) {
  return (
    <div className="container">
      <span>Cart</span>
      {/* BUG: when itemCount is 0, \`0 && ...\` evaluates to 0, which React
          renders as a stray "0" instead of rendering nothing. */}
      {itemCount && <span data-testid="badge">{itemCount}</span>}
    </div>
  )
}
`;

  const fixedContents = `import React from 'react'

export default function CartBadge({ itemCount = 0 }: { itemCount?: number }) {
  return (
    <div className="container">
      <span>Cart</span>
      {itemCount > 0 && <span data-testid="badge">{itemCount}</span>}
    </div>
  )
}
`;

  const testContents = `import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import CartBadge from './CartBadge'

test('an empty cart renders no badge and no stray zero', () => {
  render(<CartBadge itemCount={0} />)

  expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
  // The "0" must not leak into the DOM.
  expect(screen.queryByText('0')).not.toBeInTheDocument()
})

test('a non-empty cart still shows the count', () => {
  render(<CartBadge itemCount={3} />)
  expect(screen.getByTestId('badge')).toHaveTextContent('3')
})
`;

  return {
    arcId: "react-and-components",
    difficulty: "Medium",
    candidate: {
      componentName: "CartBadge",
      slug: "cart-zero-render-leak",
      title: "Empty Cart Shows a Stray Zero",
      description: `Severity: Low
Component: CartBadge
Context: CartBadge shows a count badge next to the word "Cart" when there are items. When the cart is empty, a lone "0" appears next to "Cart" instead of nothing.

Reproduction:
1. Render CartBadge with itemCount set to 0.
2. Observe a stray "0" next to "Cart".

Expected: When the cart is empty, no badge (and no "0") is rendered; the badge only appears when there is at least one item.`,
      bugConcept:
        "Uses a number as the && guard (`itemCount && ...`); when itemCount is 0 React renders the 0 instead of nothing. Guard must be a boolean (itemCount > 0).",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Async battle: loading flag never cleared.
 * The fetch resolves and data is stored, but setLoading(false) is missing, so
 * the spinner shows forever.
 */
function loadingSpinnerNeverClears(): ManualBattle {
  const buggyContents = `import React, { useEffect, useState } from 'react'

export default function UserCard() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        setName(data.name)
        // BUG: loading is never set to false, so the spinner shows forever
        // even after the data has arrived.
      })
  }, [])

  if (loading) return <p data-testid="status">Loading...</p>
  return <p data-testid="status">{name}</p>
}
`;

  const fixedContents = `import React, { useEffect, useState } from 'react'

export default function UserCard() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        setName(data.name)
        setLoading(false)
      })
  }, [])

  if (loading) return <p data-testid="status">Loading...</p>
  return <p data-testid="status">{name}</p>
}
`;

  const testContents = `import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import UserCard from './UserCard'

afterEach(() => {
  vi.restoreAllMocks()
})

test('the spinner is replaced by the data once it loads', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ name: 'Grace' }),
      } as Response)
    )
  )

  render(<UserCard />)
  expect(screen.getByTestId('status')).toHaveTextContent('Loading...')

  // Once the request resolves, the loaded name must replace the spinner.
  await screen.findByText('Grace')
})
`;

  return {
    arcId: "async-network-and-effects",
    difficulty: "Medium",
    candidate: {
      componentName: "UserCard",
      slug: "loading-spinner-never-clears",
      title: "Spinner Never Goes Away",
      description: `Severity: High
Component: UserCard
Context: UserCard fetches a user and shows a "Loading..." spinner until the data arrives. Users report the spinner stays on screen forever even though the network request succeeds.

Reproduction:
1. Render UserCard with a successful /api/user response.
2. Wait for the request to resolve.
3. The component keeps showing "Loading..." and never displays the name.

Expected: When the request resolves, the spinner is replaced by the loaded user's name.`,
      bugConcept:
        "Success handler stores the data but never sets loading to false, so the loading branch renders permanently.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Performance battle: useMemo with an incomplete dependency array.
 * The memoized total omits taxRate from its deps, so changing the tax rate
 * does not recompute the total (stale memoized value).
 */
function useMemoStaleDeps(): ManualBattle {
  const buggyContents = `import React, { useMemo, useState } from 'react'

export default function PriceSummary() {
  const [price] = useState(100)
  const [taxRate, setTaxRate] = useState(0)

  // BUG: deps omit taxRate, so the memoized total never recomputes when the
  // tax rate changes — it stays stuck at the no-tax value.
  const total = useMemo(() => price + price * taxRate, [price])

  return (
    <div className="container">
      <input
        aria-label="tax"
        type="number"
        value={taxRate}
        onChange={(e) => setTaxRate(Number(e.target.value))}
      />
      <span data-testid="total">{total}</span>
    </div>
  )
}
`;

  const fixedContents = `import React, { useMemo, useState } from 'react'

export default function PriceSummary() {
  const [price] = useState(100)
  const [taxRate, setTaxRate] = useState(0)

  const total = useMemo(() => price + price * taxRate, [price, taxRate])

  return (
    <div className="container">
      <input
        aria-label="tax"
        type="number"
        value={taxRate}
        onChange={(e) => setTaxRate(Number(e.target.value))}
      />
      <span data-testid="total">{total}</span>
    </div>
  )
}
`;

  const testContents = `import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import PriceSummary from './PriceSummary'

test('the total recomputes when the tax rate changes', () => {
  render(<PriceSummary />)
  expect(screen.getByTestId('total')).toHaveTextContent('100')

  fireEvent.change(screen.getByLabelText('tax'), { target: { value: '0.1' } })

  // 100 + 100 * 0.1 = 110
  expect(screen.getByTestId('total')).toHaveTextContent('110')
})
`;

  return {
    arcId: "performance-and-memory",
    difficulty: "Medium",
    candidate: {
      componentName: "PriceSummary",
      slug: "usememo-stale-deps",
      title: "Total Ignores Tax Rate Changes",
      description: `Severity: High
Component: PriceSummary
Context: PriceSummary shows an order total that should include tax. Users report that changing the tax rate does not update the displayed total.

Reproduction:
1. Render PriceSummary (total shows the pre-tax amount).
2. Change the tax rate input.
3. The total does not change.

Expected: The total recomputes whenever the tax rate changes and reflects price plus tax.`,
      bugConcept:
        "useMemo dependency array omits taxRate, so the memoized total is never recomputed when the tax rate changes.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["react", "typescript", "vite"],
    },
  };
}

/**
 * Backend / race-conditions battle: no in-flight request dedup.
 * A cache stores only resolved values, so concurrent calls for the same key
 * all miss the cache and each invokes the (expensive) loader.
 */
function dedupeInflightRequests(): ManualBattle {
  const buggyContents = `type Loader<T> = (key: string) => Promise<T>

/**
 * Wraps a loader so repeated lookups for the same key are cached.
 */
export function createCachedLoader<T>(loader: Loader<T>) {
  const cache = new Map<string, T>()

  // BUG: only RESOLVED values are cached. Two concurrent calls for the same key
  // both miss the cache (nothing is stored until the await resolves), so the
  // loader runs once per concurrent caller instead of once per key.
  return async function get(key: string): Promise<T> {
    if (cache.has(key)) return cache.get(key)!
    const value = await loader(key)
    cache.set(key, value)
    return value
  }
}
`;

  const fixedContents = `type Loader<T> = (key: string) => Promise<T>

/**
 * Wraps a loader so repeated lookups for the same key are cached.
 */
export function createCachedLoader<T>(loader: Loader<T>) {
  // Cache the in-flight PROMISE, not just the resolved value, so concurrent
  // callers for the same key share a single loader invocation.
  const cache = new Map<string, Promise<T>>()

  return function get(key: string): Promise<T> {
    const existing = cache.get(key)
    if (existing) return existing
    const promise = loader(key)
    cache.set(key, promise)
    return promise
  }
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { createCachedLoader } from './CachedLoader'

test('concurrent lookups for the same key invoke the loader only once', async () => {
  const loader = vi.fn(async (key: string) => {
    await Promise.resolve() // simulate async work
    return key.toUpperCase()
  })
  const get = createCachedLoader(loader)

  const [a, b] = await Promise.all([get('x'), get('x')])

  expect(a).toBe('X')
  expect(b).toBe('X')
  expect(loader).toHaveBeenCalledTimes(1)
})

test('different keys each invoke the loader', async () => {
  const loader = vi.fn(async (key: string) => key.toUpperCase())
  const get = createCachedLoader(loader)

  await Promise.all([get('a'), get('b')])

  expect(loader).toHaveBeenCalledTimes(2)
})
`;

  return {
    arcId: "race-conditions",
    difficulty: "Medium",
    candidate: {
      componentName: "CachedLoader",
      slug: "dedupe-inflight-requests",
      title: "Cache Stampede on Concurrent Loads",
      description: `Severity: High
Component: createCachedLoader
Context: createCachedLoader wraps an expensive loader (e.g. a DB or API call) so repeated lookups for the same key are served from cache. Under load, monitoring shows the underlying loader firing many times for the same key in the same instant.

Reproduction:
1. Call the wrapped loader twice for the same key at the same time (before the first resolves).
2. Observe the underlying loader runs once per caller instead of once per key.

Expected: Concurrent lookups for the same key share a single loader call; the loader runs at most once per key while a request is in flight.`,
      bugConcept:
        "Cache stores only resolved values, so concurrent callers all miss and each runs the loader. Fix caches the in-flight promise so callers share one invocation.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / race-conditions battle: lost update on read-modify-write.
 * Deposits run concurrently; each reads the balance then writes back read+amount,
 * so interleaved reads all see the same starting value and updates are lost.
 */
function lostUpdateReadModifyWrite(): ManualBattle {
  const buggyContents = `export interface BalanceStore {
  read: () => Promise<number>
  write: (value: number) => Promise<void>
}

/**
 * Applies a series of deposits to a balance store.
 */
export async function applyDeposits(
  store: BalanceStore,
  deposits: number[]
): Promise<void> {
  // BUG: deposits run concurrently. Each does read-then-write, so interleaved
  // reads all observe the same starting balance and later writes clobber earlier
  // ones — classic lost update.
  await Promise.all(
    deposits.map(async (amount) => {
      const current = await store.read()
      await store.write(current + amount)
    })
  )
}
`;

  const fixedContents = `export interface BalanceStore {
  read: () => Promise<number>
  write: (value: number) => Promise<void>
}

/**
 * Applies a series of deposits to a balance store.
 */
export async function applyDeposits(
  store: BalanceStore,
  deposits: number[]
): Promise<void> {
  // Serialize the read-modify-write cycles so each deposit observes the result
  // of the previous one. No two cycles interleave.
  for (const amount of deposits) {
    const current = await store.read()
    await store.write(current + amount)
  }
}
`;

  const testContents = `import { expect, test } from 'vitest'
import { applyDeposits, type BalanceStore } from './Wallet'

function makeStore(initial = 0): BalanceStore & { current: () => number } {
  let value = initial
  return {
    read: async () => {
      await Promise.resolve()
      return value
    },
    write: async (v: number) => {
      await Promise.resolve()
      value = v
    },
    current: () => value,
  }
}

test('all deposits are applied without losing updates', async () => {
  const store = makeStore(0)

  await applyDeposits(store, [10, 20, 30])

  expect(store.current()).toBe(60)
})
`;

  return {
    arcId: "race-conditions",
    difficulty: "Hard",
    candidate: {
      componentName: "Wallet",
      slug: "lost-update-read-modify-write",
      title: "Concurrent Deposits Lose Money",
      description: `Severity: Critical
Component: applyDeposits
Context: applyDeposits applies a batch of deposits to an account balance via a read-modify-write against a store. Reconciliation shows the final balance is lower than the sum of deposits — money goes missing under concurrency.

Reproduction:
1. Apply several deposits, e.g. [10, 20, 30], to a balance starting at 0.
2. The expected final balance is 60.
3. The actual final balance is less (only the last write survives).

Expected: Every deposit is reflected in the final balance regardless of timing; applying [10, 20, 30] to 0 yields 60.`,
      bugConcept:
        "Read-modify-write cycles run concurrently via Promise.all, so reads all see the same starting balance and writes overwrite each other (lost update). Fix serializes the cycles.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / n+1 battle: per-item queries instead of one batched query.
 * getUsersWithPosts loops users and queries posts per user (N+1) rather than
 * fetching all posts in a single batched call.
 */
function nPlusOneUserPosts(): ManualBattle {
  const buggyContents = `export interface Db {
  getUsers: () => Promise<{ id: number; name: string }[]>
  getPostsByUser: (userId: number) => Promise<string[]>
  getPostsByUsers: (userIds: number[]) => Promise<Record<number, string[]>>
}

export interface UserWithPosts {
  id: number
  name: string
  posts: string[]
}

/**
 * Returns every user with their posts attached.
 */
export async function getUsersWithPosts(db: Db): Promise<UserWithPosts[]> {
  const users = await db.getUsers()

  // BUG: N+1 queries — one getPostsByUser call per user. With N users this is
  // 1 + N round trips to the database.
  const result: UserWithPosts[] = []
  for (const user of users) {
    const posts = await db.getPostsByUser(user.id)
    result.push({ ...user, posts })
  }
  return result
}
`;

  const fixedContents = `export interface Db {
  getUsers: () => Promise<{ id: number; name: string }[]>
  getPostsByUser: (userId: number) => Promise<string[]>
  getPostsByUsers: (userIds: number[]) => Promise<Record<number, string[]>>
}

export interface UserWithPosts {
  id: number
  name: string
  posts: string[]
}

/**
 * Returns every user with their posts attached.
 */
export async function getUsersWithPosts(db: Db): Promise<UserWithPosts[]> {
  const users = await db.getUsers()

  // Fetch all posts in a single batched query keyed by user id.
  const postsByUser = await db.getPostsByUsers(users.map((u) => u.id))
  return users.map((user) => ({ ...user, posts: postsByUser[user.id] ?? [] }))
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { getUsersWithPosts, type Db } from './UserService'

test('posts are loaded in one batched query, not one per user', async () => {
  const getPostsByUser = vi.fn(async (id: number) => [\`post-\${id}\`])
  const getPostsByUsers = vi.fn(async (ids: number[]) =>
    Object.fromEntries(ids.map((id) => [id, [\`post-\${id}\`]]))
  )
  const db: Db = {
    getUsers: async () => [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
    ],
    getPostsByUser,
    getPostsByUsers,
  }

  const result = await getUsersWithPosts(db)

  expect(result).toEqual([
    { id: 1, name: 'a', posts: ['post-1'] },
    { id: 2, name: 'b', posts: ['post-2'] },
    { id: 3, name: 'c', posts: ['post-3'] },
  ])
  // The per-user query must not be used; a single batched call replaces it.
  expect(getPostsByUser).not.toHaveBeenCalled()
  expect(getPostsByUsers).toHaveBeenCalledTimes(1)
})
`;

  return {
    arcId: "n-plus-1-queries",
    difficulty: "Medium",
    candidate: {
      componentName: "UserService",
      slug: "n-plus-1-user-posts",
      title: "User List Fires a Query per User",
      description: `Severity: High
Component: getUsersWithPosts
Context: getUsersWithPosts returns all users with their posts attached. As the user count grows, the endpoint slows down dramatically and the database shows a flood of near-identical post queries.

Reproduction:
1. Load the endpoint with N users in the database.
2. Inspect the query log.
3. Observe 1 query for users plus one additional query per user (N+1 total).

Expected: Posts for all users are fetched with a single batched query; total queries stay constant (does not grow per user).`,
      bugConcept:
        "Loops users and awaits getPostsByUser per user (N+1). Fix batches into a single getPostsByUsers call keyed by id.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / race-conditions battle: non-idempotent event processing.
 * The queue is at-least-once, so an event can be redelivered. The processor has
 * no dedup, so a redelivered event applies its effect twice (double-spend).
 */
function idempotentEventProcessing(): ManualBattle {
  const buggyContents = `export interface Ledger {
  credit: (amount: number) => void
}

export interface PaymentEvent {
  id: string
  amount: number
}

/**
 * Builds a processor for payment events arriving from an at-least-once queue.
 */
export function createProcessor(ledger: Ledger) {
  // BUG: no dedup. At-least-once delivery means the same event id can arrive
  // more than once, and each delivery credits the ledger again.
  return function process(event: PaymentEvent) {
    ledger.credit(event.amount)
  }
}
`;

  const fixedContents = `export interface Ledger {
  credit: (amount: number) => void
}

export interface PaymentEvent {
  id: string
  amount: number
}

/**
 * Builds a processor for payment events arriving from an at-least-once queue.
 */
export function createProcessor(ledger: Ledger) {
  const processed = new Set<string>()

  return function process(event: PaymentEvent) {
    // Ignore redeliveries: only the first occurrence of an event id applies.
    if (processed.has(event.id)) return
    processed.add(event.id)
    ledger.credit(event.amount)
  }
}
`;

  const testContents = `import { expect, test } from 'vitest'
import { createProcessor, type Ledger } from './EventProcessor'

function makeLedger() {
  let balance = 0
  const ledger: Ledger = { credit: (amount) => (balance += amount) }
  return { ledger, balance: () => balance }
}

test('a redelivered event is applied only once', () => {
  const { ledger, balance } = makeLedger()
  const process = createProcessor(ledger)
  const event = { id: 'evt-1', amount: 100 }

  process(event)
  process(event) // redelivery from the at-least-once queue

  expect(balance()).toBe(100)
})

test('distinct events are each applied', () => {
  const { ledger, balance } = makeLedger()
  const process = createProcessor(ledger)

  process({ id: 'a', amount: 10 })
  process({ id: 'b', amount: 20 })

  expect(balance()).toBe(30)
})
`;

  return {
    arcId: "race-conditions",
    difficulty: "Medium",
    candidate: {
      componentName: "EventProcessor",
      slug: "idempotent-event-processing",
      title: "Redelivered Payment Charged Twice",
      description: `Severity: Critical
Component: createProcessor
Context: The payment processor consumes events from an at-least-once message queue, which can deliver the same event more than once. Customers report being charged twice for a single payment.

Reproduction:
1. Process a payment event, then process the exact same event again (a redelivery).
2. Inspect the ledger balance.
3. The amount has been credited twice.

Expected: Processing is idempotent — a redelivered event with the same id applies its effect at most once.`,
      bugConcept:
        "Processor has no dedup, so at-least-once redelivery double-applies an event. Fix tracks processed event ids and ignores repeats.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / n+1 battle: per-item count queries hidden behind Promise.all.
 * Parallelism masks that it is still N round trips instead of one grouped query.
 */
function nPlusOneParallelCounts(): ManualBattle {
  const buggyContents = `export interface Catalog {
  getAuthors: () => Promise<{ id: number; name: string }[]>
  countBooksByAuthor: (authorId: number) => Promise<number>
  countBooksGrouped: (authorIds: number[]) => Promise<Record<number, number>>
}

export interface AuthorWithCount {
  id: number
  name: string
  bookCount: number
}

/**
 * Returns each author with how many books they have.
 */
export async function getAuthorsWithCounts(
  catalog: Catalog
): Promise<AuthorWithCount[]> {
  const authors = await catalog.getAuthors()

  // BUG: one count query per author. Promise.all makes it concurrent, which
  // hides the N+1 in latency but still hammers the DB with N round trips.
  return Promise.all(
    authors.map(async (author) => ({
      ...author,
      bookCount: await catalog.countBooksByAuthor(author.id),
    }))
  )
}
`;

  const fixedContents = `export interface Catalog {
  getAuthors: () => Promise<{ id: number; name: string }[]>
  countBooksByAuthor: (authorId: number) => Promise<number>
  countBooksGrouped: (authorIds: number[]) => Promise<Record<number, number>>
}

export interface AuthorWithCount {
  id: number
  name: string
  bookCount: number
}

/**
 * Returns each author with how many books they have.
 */
export async function getAuthorsWithCounts(
  catalog: Catalog
): Promise<AuthorWithCount[]> {
  const authors = await catalog.getAuthors()

  // One grouped query for all authors instead of one per author.
  const counts = await catalog.countBooksGrouped(authors.map((a) => a.id))
  return authors.map((author) => ({
    ...author,
    bookCount: counts[author.id] ?? 0,
  }))
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { getAuthorsWithCounts, type Catalog } from './CatalogService'

test('book counts load via a single grouped query, not one per author', async () => {
  const countBooksByAuthor = vi.fn(async (id: number) => id * 10)
  const countBooksGrouped = vi.fn(async (ids: number[]) =>
    Object.fromEntries(ids.map((id) => [id, id * 10]))
  )
  const catalog: Catalog = {
    getAuthors: async () => [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ],
    countBooksByAuthor,
    countBooksGrouped,
  }

  const result = await getAuthorsWithCounts(catalog)

  expect(result).toEqual([
    { id: 1, name: 'a', bookCount: 10 },
    { id: 2, name: 'b', bookCount: 20 },
  ])
  expect(countBooksByAuthor).not.toHaveBeenCalled()
  expect(countBooksGrouped).toHaveBeenCalledTimes(1)
})
`;

  return {
    arcId: "n-plus-1-queries",
    difficulty: "Medium",
    candidate: {
      componentName: "CatalogService",
      slug: "n-plus-1-parallel-counts",
      title: "Author Counts Hide an N+1",
      description: `Severity: High
Component: getAuthorsWithCounts
Context: getAuthorsWithCounts lists authors with a book count each. It feels fast in development but the database team flags a burst of identical count queries proportional to the number of authors.

Reproduction:
1. Load the endpoint with N authors.
2. Inspect the query log.
3. Observe one count query per author (N), in addition to the authors query.

Expected: Counts are fetched in a single grouped query; total query count stays constant regardless of how many authors there are.`,
      bugConcept:
        "Per-author count query wrapped in Promise.all — concurrent but still N round trips. Fix uses one grouped count query keyed by author id.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / error-handling battle: forEach with an async callback.
 * The promises float — the function resolves before writes finish and any write
 * error becomes an unhandled rejection instead of failing the caller.
 */
function forEachAsyncFloatingPromise(): ManualBattle {
  const buggyContents = `export interface Store {
  put: (item: string) => Promise<void>
}

/**
 * Persists every item to the store.
 */
export async function saveAll(store: Store, items: string[]): Promise<void> {
  // BUG: forEach does not await its async callback, so the put promises float.
  // saveAll resolves immediately and a failed write becomes an unhandled
  // rejection instead of rejecting saveAll.
  items.forEach(async (item) => {
    await store.put(item)
  })
}
`;

  const fixedContents = `export interface Store {
  put: (item: string) => Promise<void>
}

/**
 * Persists every item to the store.
 */
export async function saveAll(store: Store, items: string[]): Promise<void> {
  // Await all writes so saveAll only resolves once they succeed — and rejects
  // if any of them fail.
  await Promise.all(items.map((item) => store.put(item)))
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { saveAll, type Store } from './BatchWriter'

test('saveAll rejects when a write fails', async () => {
  const store: Store = {
    put: vi.fn(async (item: string) => {
      if (item === 'b') throw new Error('disk full')
    }),
  }

  await expect(saveAll(store, ['a', 'b', 'c'])).rejects.toThrow('disk full')
})
`;

  return {
    arcId: "error-handling-and-resilience",
    difficulty: "Medium",
    candidate: {
      componentName: "BatchWriter",
      slug: "foreach-async-floating-promise",
      title: "Batch Save Hides Write Failures",
      description: `Severity: High
Component: saveAll
Context: saveAll persists a batch of items. Callers await it and assume a successful return means everything was written. In production, individual write failures vanish — no error is thrown — yet data is missing afterward.

Reproduction:
1. Call saveAll with a batch where one item's write rejects.
2. Await the returned promise.
3. saveAll resolves successfully even though a write failed.

Expected: If any write fails, saveAll rejects with that error so the caller can handle it.`,
      bugConcept:
        "forEach with an async callback floats the put promises; saveAll resolves before they settle and a rejection goes unhandled. Fix awaits Promise.all of the writes.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / error-handling battle: over-broad catch returns a silent fallback.
 * A transient read failure is swallowed and defaults are returned as if valid,
 * so the caller cannot tell a real failure from "no overrides".
 */
function overBroadCatchSwallowsError(): ManualBattle {
  const buggyContents = `export interface Source {
  read: () => Promise<Record<string, unknown>>
}

/**
 * Loads config from a source, layered over defaults.
 */
export async function loadConfig(
  source: Source,
  defaults: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const config = await source.read()
    return { ...defaults, ...config }
  } catch {
    // BUG: a transient read failure is swallowed and defaults are returned as
    // if they were valid config, so the app silently boots misconfigured.
    return { ...defaults }
  }
}
`;

  const fixedContents = `export interface Source {
  read: () => Promise<Record<string, unknown>>
}

/**
 * Loads config from a source, layered over defaults.
 */
export async function loadConfig(
  source: Source,
  defaults: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Let read failures propagate; the caller decides how to handle them rather
  // than silently booting with defaults.
  const config = await source.read()
  return { ...defaults, ...config }
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { loadConfig, type Source } from './ConfigLoader'

test('a read failure propagates instead of silently using defaults', async () => {
  const source: Source = {
    read: vi.fn(async () => {
      throw new Error('config service unreachable')
    }),
  }

  await expect(loadConfig(source, { timeout: 30 })).rejects.toThrow(
    'config service unreachable'
  )
})

test('loaded config overrides defaults on success', async () => {
  const source: Source = {
    read: vi.fn(async () => ({ timeout: 60 })),
  }

  await expect(
    loadConfig(source, { timeout: 30, retries: 3 })
  ).resolves.toEqual({ timeout: 60, retries: 3 })
})
`;

  return {
    arcId: "error-handling-and-resilience",
    difficulty: "Medium",
    candidate: {
      componentName: "ConfigLoader",
      slug: "over-broad-catch-swallows-error",
      title: "Config Loader Masks Failures as Defaults",
      description: `Severity: High
Component: loadConfig
Context: loadConfig reads configuration overrides from a source and layers them over defaults. When the config service has a transient outage, the app boots "successfully" but runs entirely on defaults, and the outage goes unnoticed until something breaks downstream.

Reproduction:
1. Make the source's read reject (simulate an outage).
2. Call loadConfig.
3. It resolves with the defaults instead of surfacing the failure.

Expected: A read failure propagates to the caller so the outage is visible; defaults are only used as a base layer for successfully-read config, not as a mask for errors.`,
      bugConcept:
        "Over-broad catch swallows any read error and returns defaults as if valid, hiding outages. Fix removes the swallow so failures propagate.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / transactions battle: partial transfer with no rollback.
 * The debit succeeds but the credit fails, and the debit is never compensated,
 * so money vanishes from the source account.
 */
function partialTransferNoRollback(): ManualBattle {
  const buggyContents = `export interface Accounts {
  debit: (id: string, amount: number) => Promise<void>
  credit: (id: string, amount: number) => Promise<void>
}

/**
 * Moves \`amount\` from one account to another.
 */
export async function transfer(
  accounts: Accounts,
  from: string,
  to: string,
  amount: number
): Promise<void> {
  await accounts.debit(from, amount)
  // BUG: if the credit fails, the debit above is never undone, so the money
  // disappears from \`from\` without ever reaching \`to\`.
  await accounts.credit(to, amount)
}
`;

  const fixedContents = `export interface Accounts {
  debit: (id: string, amount: number) => Promise<void>
  credit: (id: string, amount: number) => Promise<void>
}

/**
 * Moves \`amount\` from one account to another.
 */
export async function transfer(
  accounts: Accounts,
  from: string,
  to: string,
  amount: number
): Promise<void> {
  await accounts.debit(from, amount)
  try {
    await accounts.credit(to, amount)
  } catch (err) {
    // Compensate: refund the debit so the transfer is all-or-nothing.
    await accounts.credit(from, amount)
    throw err
  }
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { transfer, type Accounts } from './Bank'

test('a failed credit refunds the debited account', async () => {
  const ops: string[] = []
  const accounts: Accounts = {
    debit: vi.fn(async (id: string) => {
      ops.push(\`debit \${id}\`)
    }),
    credit: vi.fn(async (id: string) => {
      ops.push(\`credit \${id}\`)
      if (id === 'B') throw new Error('account frozen')
    }),
  }

  await expect(transfer(accounts, 'A', 'B', 100)).rejects.toThrow('account frozen')

  // The debit to A must be compensated by a refund.
  expect(ops).toEqual(['debit A', 'credit B', 'credit A'])
})
`;

  return {
    arcId: "data-consistency-and-transactions",
    difficulty: "Hard",
    candidate: {
      componentName: "Bank",
      slug: "partial-transfer-no-rollback",
      title: "Transfer Loses Money on Failure",
      description: `Severity: Critical
Component: transfer
Context: transfer debits one account and credits another. When the credit step fails (e.g. the destination is frozen), reconciliation shows the source was debited but the destination never received the funds — money vanishes.

Reproduction:
1. Attempt a transfer where the credit to the destination fails.
2. The debit from the source has already been applied.
3. The error propagates but the debit is never undone.

Expected: The transfer is all-or-nothing — if the credit fails, the debit is compensated so balances are unchanged.`,
      bugConcept:
        "Debit-then-credit with no compensation: a failed credit leaves the debit applied. Fix refunds the source account on credit failure before rethrowing.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / transactions battle: multi-row insert not wrapped in a transaction.
 * A mid-batch failure leaves earlier rows committed instead of rolling back.
 */
function batchInsertNoTransaction(): ManualBattle {
  const buggyContents = `export interface Db {
  insert: (row: string) => Promise<void>
  transaction: <T>(fn: () => Promise<T>) => Promise<T>
}

/**
 * Inserts every row in the batch.
 */
export async function insertAll(db: Db, rows: string[]): Promise<void> {
  // BUG: rows are inserted one by one outside any transaction, so a failure
  // partway through leaves the earlier rows committed.
  for (const row of rows) {
    await db.insert(row)
  }
}
`;

  const fixedContents = `export interface Db {
  insert: (row: string) => Promise<void>
  transaction: <T>(fn: () => Promise<T>) => Promise<T>
}

/**
 * Inserts every row in the batch.
 */
export async function insertAll(db: Db, rows: string[]): Promise<void> {
  // Wrap the whole batch in a transaction so a mid-batch failure rolls back
  // everything instead of leaving partial data.
  await db.transaction(async () => {
    for (const row of rows) {
      await db.insert(row)
    }
  })
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { insertAll, type Db } from './BatchInsert'

test('the batch is inserted inside a single transaction', async () => {
  const db: Db = {
    insert: vi.fn(async (row: string) => {
      if (row === 'bad') throw new Error('constraint violation')
    }),
    transaction: vi.fn(async (fn) => fn()),
  }

  await expect(insertAll(db, ['ok', 'bad', 'ok2'])).rejects.toThrow(
    'constraint violation'
  )

  // The work must run through the transaction wrapper, not as loose inserts.
  expect(db.transaction).toHaveBeenCalledTimes(1)
})
`;

  return {
    arcId: "data-consistency-and-transactions",
    difficulty: "Medium",
    candidate: {
      componentName: "BatchInsert",
      slug: "batch-insert-no-transaction",
      title: "Partial Batch Insert Left Behind",
      description: `Severity: High
Component: insertAll
Context: insertAll writes a batch of rows. When one row violates a constraint partway through, support finds the earlier rows already persisted while the rest are missing — a half-applied batch.

Reproduction:
1. Insert a batch where a middle row fails validation.
2. The rows before it are already committed.
3. The endpoint errors, but the partial data remains.

Expected: The batch is atomic — a failure anywhere rolls back the entire batch so no partial data is persisted.`,
      bugConcept:
        "Rows inserted in a loop outside any transaction; a mid-batch failure leaves earlier rows committed. Fix wraps the loop in db.transaction.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / caching battle: write-through cache not invalidated.
 * Updates write to the DB but leave the cached copy in place, so reads keep
 * returning the old value.
 */
function writeThroughCacheStale(): ManualBattle {
  const buggyContents = `export interface Db {
  get: (id: string) => Promise<string>
  set: (id: string, value: string) => Promise<void>
}

/**
 * A read-through cache over a key/value store.
 */
export function createUserCache(db: Db) {
  const cache = new Map<string, string>()

  async function get(id: string): Promise<string> {
    if (cache.has(id)) return cache.get(id)!
    const value = await db.get(id)
    cache.set(id, value)
    return value
  }

  async function update(id: string, value: string): Promise<void> {
    await db.set(id, value)
    // BUG: the cache still holds the old value, so subsequent reads are stale.
  }

  return { get, update }
}
`;

  const fixedContents = `export interface Db {
  get: (id: string) => Promise<string>
  set: (id: string, value: string) => Promise<void>
}

/**
 * A read-through cache over a key/value store.
 */
export function createUserCache(db: Db) {
  const cache = new Map<string, string>()

  async function get(id: string): Promise<string> {
    if (cache.has(id)) return cache.get(id)!
    const value = await db.get(id)
    cache.set(id, value)
    return value
  }

  async function update(id: string, value: string): Promise<void> {
    await db.set(id, value)
    // Keep the cache in sync with the write so reads reflect the new value.
    cache.set(id, value)
  }

  return { get, update }
}
`;

  const testContents = `import { expect, test, vi } from 'vitest'
import { createUserCache, type Db } from './UserCache'

test('updating a value invalidates the cached copy', async () => {
  const store = new Map<string, string>([['u1', 'old']])
  const db: Db = {
    get: vi.fn(async (id: string) => store.get(id) ?? ''),
    set: vi.fn(async (id: string, value: string) => {
      store.set(id, value)
    }),
  }
  const cache = createUserCache(db)

  expect(await cache.get('u1')).toBe('old') // populate the cache
  await cache.update('u1', 'new')

  // The next read must reflect the update, not the cached 'old' value.
  expect(await cache.get('u1')).toBe('new')
})
`;

  return {
    arcId: "caching-and-invalidation",
    difficulty: "Medium",
    candidate: {
      componentName: "UserCache",
      slug: "write-through-cache-stale",
      title: "Cache Serves Stale Data After Update",
      description: `Severity: High
Component: createUserCache
Context: createUserCache is a read-through cache over a key/value store. After a value is updated, users keep seeing the old value until the process restarts.

Reproduction:
1. Read a key (populating the cache).
2. Update that key to a new value.
3. Read the key again — it still returns the old value.

Expected: After an update, reads reflect the new value; the write keeps the cache consistent with the store.`,
      bugConcept:
        "update writes to the store but never updates/invalidates the cache, so cached reads stay stale. Fix syncs the cache on write.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

/**
 * Backend / caching battle: TTL never enforced.
 * Cached entries are returned without checking their age, so stale data is
 * served forever even after the TTL has passed.
 */
function ttlCacheNeverExpires(): ManualBattle {
  const buggyContents = `export type Loader = (key: string) => Promise<string>

interface Entry {
  value: string
  storedAt: number
}

/**
 * A cache whose entries are meant to expire after \`ttlMs\`.
 */
export function createTtlCache(loader: Loader, ttlMs: number) {
  const cache = new Map<string, Entry>()

  return async function get(key: string): Promise<string> {
    const entry = cache.get(key)
    // BUG: a cached entry is returned without checking whether it has expired,
    // so values are served forever regardless of the TTL.
    if (entry) return entry.value

    const value = await loader(key)
    cache.set(key, { value, storedAt: Date.now() })
    return value
  }
}
`;

  const fixedContents = `export type Loader = (key: string) => Promise<string>

interface Entry {
  value: string
  storedAt: number
}

/**
 * A cache whose entries expire after \`ttlMs\`.
 */
export function createTtlCache(loader: Loader, ttlMs: number) {
  const cache = new Map<string, Entry>()

  return async function get(key: string): Promise<string> {
    const entry = cache.get(key)
    // Serve the cached value only while it is still within its TTL.
    if (entry && Date.now() - entry.storedAt < ttlMs) return entry.value

    const value = await loader(key)
    cache.set(key, { value, storedAt: Date.now() })
    return value
  }
}
`;

  const testContents = `import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createTtlCache } from './TtlCache'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('an entry older than the TTL is reloaded instead of served stale', async () => {
  let n = 0
  const loader = vi.fn(async () => \`v\${++n}\`)
  const get = createTtlCache(loader, 1000)

  expect(await get('k')).toBe('v1') // fresh load, cached at t=0

  vi.advanceTimersByTime(1500) // move past the 1000ms TTL

  expect(await get('k')).toBe('v2') // expired -> reloaded
  expect(loader).toHaveBeenCalledTimes(2)
})

test('an entry within the TTL is served from cache', async () => {
  let n = 0
  const loader = vi.fn(async () => \`v\${++n}\`)
  const get = createTtlCache(loader, 1000)

  expect(await get('k')).toBe('v1')
  vi.advanceTimersByTime(500) // still within TTL
  expect(await get('k')).toBe('v1')
  expect(loader).toHaveBeenCalledTimes(1)
})
`;

  return {
    arcId: "caching-and-invalidation",
    difficulty: "Medium",
    candidate: {
      componentName: "TtlCache",
      slug: "ttl-cache-never-expires",
      title: "TTL Cache That Never Expires",
      description: `Severity: High
Component: createTtlCache
Context: createTtlCache is meant to cache values for a fixed time-to-live and reload them afterward. In production, values never refresh — the cache serves the first value it ever loaded indefinitely.

Reproduction:
1. Load a key (cached with a TTL of, say, 1000ms).
2. Advance well past the TTL.
3. Read the key again — it still returns the original value and never reloads.

Expected: Once an entry is older than its TTL, the next read reloads it from the source; entries within the TTL are still served from cache.`,
      bugConcept:
        "get returns any cached entry without comparing its age to the TTL, so entries never expire. Fix checks Date.now() - storedAt against ttlMs.",
      buggyContents,
      fixedContents,
      testContents,
      tech: ["typescript", "node", "vitest"],
    },
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

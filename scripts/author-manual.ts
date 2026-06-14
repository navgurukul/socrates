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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

# Performance Optimization Suite

## Overview

This design addresses four performance bottlenecks identified in the WebContainer-based educational bug battle platform:

1. **Sequential Type Loading** in Monaco IntelliSense injection
2. **Fixed Debounce Strategy** for container synchronization
3. **Sequential File Writing** during test execution
4. **Inefficient Model Scanning** in Monaco model cleanup

These optimizations collectively improve editor responsiveness, reduce test execution latency, and enhance the live preview experience without compromising reliability.

## Problem Analysis

### 1. Parallel Type Loading Optimization

**Current Behavior:**
The `useTypeBridge.ts` hook loads type definitions in a partially sequential manner:

- Phase 1: Loads `@vitest/spy`, `@vitest/utils`, `chai` in parallel
- Phase 2: Loads `@vitest/expect`, `@vitest/runner` in parallel (waits for Phase 1)
- Phase 3: Loads `vitest` (waits for Phase 2)
- Phase 4: Loads `react`, `@types/react`, `@types/node`, `@testing-library/react` in parallel

**Issue:**
The phased approach was designed to respect dependency order, but Monaco's type resolution system is lazy and can handle out-of-order type definitions. The sequential phases create unnecessary blocking delays during initialization.

**Impact:**

- IntelliSense activation delayed by cumulative sequential wait time
- User perceives slower editor "warm-up"
- No actual benefit from enforced ordering since Monaco resolves types on-demand

### 2. Container Sync Debounce Strategy

**Current Behavior:**
The `useContainerSync.ts` hook uses a fixed 300ms trailing-edge debounce for all file synchronization operations.

**Issue:**
A one-size-fits-all debounce creates suboptimal user experience:

- **For rapid typing**: 300ms feels responsive enough
- **For single small edits**: User must wait unnecessarily before seeing preview updates
- **For paste operations**: Large content changes face same delay as single character edits

**Impact:**

- Preview refresh feels sluggish for quick single-line fixes
- No differentiation between user interaction patterns
- Lost opportunity for immediate feedback on simple changes

### 3. File Write Batching

**Current Behavior:**
In `useTestRunner.ts`, the test execution flow writes files sequentially:

```
for (const [filename, content] of Object.entries(fileContents)) {
  await ensureDirectory(instance.fs, filename);
  await instance.fs.writeFile(filename, content);
}
```

**Issue:**
Each file write is awaited individually despite having no interdependencies. WebContainer filesystem operations are asynchronous but independent—writing `index.js` doesn't need to complete before writing `test.spec.js`.

**Impact:**

- Test execution latency scales linearly with file count
- User waits longer than necessary before test results appear
- Particularly noticeable in multi-file challenges (3+ files)

### 4. Monaco Model Management

**Current Behavior:**
The `useMonacoSync.ts` hook calls `monaco.editor.getModels()` on every sync and iterates through all models to find deleted files:

```
const models = monaco.editor.getModels();
models.forEach((model) => {
  // Check if model path is in fileContents
  // Filter internal Monaco models
  // Dispose if not found
});
```

**Issue:**

- `getModels()` returns ALL Monaco models including internal TypeScript workers, type definition models, and temporary models
- The hook performs string manipulation and filtering logic on every model on every sync
- No local cache of user-created models to optimize lookups

**Impact:**

- Unnecessary CPU cycles on every file content change
- Performance degrades as more type definitions load (100+ models after IntelliSense injection)
- Synchronization overhead grows with unrelated Monaco internals

## Solution Design

### 1. Fully Parallel Type Loading

**Strategy:**
Remove all sequential phases and load type packages in a single parallel operation. Monaco's lazy type resolution will handle dependency graphs internally.

**Approach:**

- Combine all `loadTypesFromContainer` calls into one `Promise.all` batch
- Maintain the custom module declarations (`VITEST_MODULE_DTS`, etc.) as they provide module resolution hints
- Keep the existing recursive directory scanning for `.d.ts` files within each package

**Behavioral Changes:**

| Aspect              | Before                       | After                          |
| ------------------- | ---------------------------- | ------------------------------ |
| Loading Phases      | 4 sequential phases          | 1 parallel batch               |
| Dependency Ordering | Manually enforced            | Monaco lazy resolution         |
| Total Wait Time     | Sum of slowest in each phase | Time of slowest single package |
| Type Availability   | Gradual                      | All-at-once or none            |

**Risk Mitigation:**

- If Monaco reports missing type dependencies, the existing error handling in `loadTypesFromContainer` will log warnings without breaking the editor
- Users may temporarily see red squiggles until Monaco resolves cross-package references, but this is acceptable during initial load
- The custom module declarations ensure that the primary module paths (`'vitest'`, `'react'`) resolve correctly

### 2. Adaptive Debounce Strategy

**Strategy:**
Implement a hybrid debounce that adapts based on change characteristics, with a leading-edge trigger for immediate feedback.

**Approach:**

Introduce a two-tier debounce system:

- **Leading Edge Sync**: Trigger immediately on first change after idle period (for instant preview feedback)
- **Short Debounce**: 150ms for small changes (detected by content delta size)
- **Long Debounce**: 500ms for large changes or rapid successive edits (to batch typing bursts)

**Configuration Parameters:**

| Parameter              | Value          | Rationale                                                 |
| ---------------------- | -------------- | --------------------------------------------------------- |
| Idle Threshold         | 1000ms         | If no changes for 1s, treat next change as "first change" |
| Small Change Threshold | 100 characters | Single-line edits or minor tweaks                         |
| Short Debounce         | 150ms          | Half of current 300ms—noticeable speedup                  |
| Long Debounce          | 500ms          | Buffer for paste operations and refactoring               |
| Leading Edge Enabled   | Yes            | Immediate sync on first edit after idle                   |

**Change Detection Logic:**

The hook will maintain:

- Last sync timestamp
- Last change timestamp
- Content delta size from previous sync

Decision flow:

1. Is this the first change after 1000ms of idle? → Sync immediately (leading edge)
2. Is content delta < 100 chars? → Use 150ms debounce
3. Otherwise → Use 500ms debounce

**Behavioral Changes:**

| Scenario           | Before         | After             |
| ------------------ | -------------- | ----------------- |
| Fix typo and pause | 300ms wait     | Immediate + 150ms |
| Paste large block  | 300ms wait     | 500ms wait        |
| Type continuously  | 300ms trailing | 500ms trailing    |
| Quick single edit  | 300ms wait     | Immediate sync    |

### 3. Batched File Writes

**Strategy:**
Use `Promise.all` to parallelize file writes and directory creation operations.

**Approach:**

Transform the sequential loop into parallel operations:

1. Batch directory creation: Group all `ensureDirectory` calls
2. Batch file writes: Group all `writeFile` calls
3. Execute each batch in parallel using `Promise.all`

**Implementation Pattern:**

Replace sequential writes with:

```
// Batch 1: Ensure all directories exist
await Promise.all(
  Object.keys(fileContents).map(filename =>
    ensureDirectory(instance.fs, filename)
  )
);

// Batch 2: Write all files
await Promise.all(
  Object.entries(fileContents).map(([filename, content]) =>
    instance.fs.writeFile(filename, content)
  )
);
```

**Why Two Batches:**

While file writes are independent, directory creation must complete before writing files in those directories. The two-batch approach ensures directory structure exists before any write operation attempts to use it.

**Behavioral Changes:**

| File Count | Before (sequential) | After (parallel)    |
| ---------- | ------------------- | ------------------- |
| 1 file     | ~20ms               | ~20ms (no change)   |
| 3 files    | ~60ms               | ~25ms (2.4x faster) |
| 5 files    | ~100ms              | ~30ms (3.3x faster) |

_Note: Timings are illustrative; actual performance depends on WebContainer I/O characteristics_

### 4. Monaco Model Cache

**Strategy:**
Maintain a local `Set<string>` of user-created model paths to avoid scanning all Monaco models on every sync.

**Approach:**

Add state tracking to `useMonacoSync`:

1. Initialize a `useRef` to hold a `Set<string>` of created model paths
2. When creating a model, add its normalized path to the Set
3. When checking for deletions, only iterate over the cached Set instead of all Monaco models
4. Remove paths from the Set when models are disposed

**Data Structure:**

```
const createdModelsRef = useRef<Set<string>>(new Set());
```

**Lifecycle:**

| Operation              | Effect on Cache           | Effect on Monaco               |
| ---------------------- | ------------------------- | ------------------------------ |
| Create model           | Add path to Set           | `monaco.editor.createModel()`  |
| Update file content    | No-op (model exists)      | No-op (editor manages content) |
| Delete file from store | Remove path from Set      | `model.dispose()`              |
| Sync runs              | Iterate only cached paths | Skip internal models           |

**Behavioral Changes:**

| Aspect              | Before                        | After                               |
| ------------------- | ----------------------------- | ----------------------------------- |
| Iteration Count     | 100+ models (incl. internals) | 3-10 models (user files only)       |
| Filtering Logic     | Every sync                    | Only on cache operations            |
| String Manipulation | Every model, every sync       | Only user paths, once per lifecycle |
| Performance         | O(n) where n = all models     | O(m) where m = user models          |

**Edge Case Handling:**

- If Monaco internally disposes a model (unlikely), the cache will be out of sync but harmless—the dispose call will simply no-op
- On component unmount, the cache is discarded with the ref
- The cache only tracks paths, not model instances, so no memory leak risk

## Implementation Impact

### Files Modified

| File                        | Changes                                 | Risk Level |
| --------------------------- | --------------------------------------- | ---------- |
| `hooks/useTypeBridge.ts`    | Collapse 4 phases into 1 `Promise.all`  | Low        |
| `hooks/useContainerSync.ts` | Add adaptive debounce logic             | Medium     |
| `hooks/useTestRunner.ts`    | Replace loop with batched `Promise.all` | Low        |
| `hooks/useMonacoSync.ts`    | Add Set-based model cache               | Low        |
| `lib/config/constants.ts`   | Add new debounce timing constants       | Low        |

### Risk Assessment

**Low Risk Changes:**

- Type loading parallelization: Monaco handles lazy resolution; worst case is temporary red squiggles
- File write batching: No interdependencies; rollback is trivial
- Model cache: Purely additive optimization; no functional change

**Medium Risk Change:**

- Adaptive debounce: Changes user-facing timing behavior
  - Mitigation: Make adaptive thresholds configurable constants for easy tuning
  - Mitigation: Add escape hatch to revert to fixed debounce via flag

### Performance Expectations

| Optimization          | Expected Improvement                  | Measurement Point                           |
| --------------------- | ------------------------------------- | ------------------------------------------- |
| Parallel Type Loading | 30-50% faster IntelliSense ready time | Time from container boot to first type hint |
| Adaptive Debounce     | 150-300ms faster for single edits     | Time from edit to preview refresh           |
| Batched File Writes   | 2-3x faster for 3+ file challenges    | Time from "Run Tests" to first output       |
| Model Cache           | 90% reduction in sync overhead        | CPU time during file tree operations        |

### User Experience Impact

**Before:**

- Wait ~2 seconds for IntelliSense after opening challenge
- Wait 300ms after every edit before preview updates
- Wait 100-200ms before tests start running (3-5 file challenge)
- Minor lag when rapidly creating/deleting files

**After:**

- Wait ~1 second for IntelliSense (50% faster)
- Instant preview for single edits; 150ms for small changes
- Wait ~30ms before tests start (parallel writes)
- Smooth file operations regardless of type definition count

## Configuration Strategy

### New Constants

Add to `lib/config/constants.ts`:

```
export const TIMINGS = {
  // Existing
  DEBOUNCE_FILE_SYNC_MS: 300,
  DEBOUNCE_MONACO_SYNC_MS: 150,

  // New - Adaptive Sync
  SYNC_IDLE_THRESHOLD_MS: 1000,
  SYNC_SMALL_CHANGE_CHARS: 100,
  SYNC_SHORT_DEBOUNCE_MS: 150,
  SYNC_LONG_DEBOUNCE_MS: 500,
  SYNC_ENABLE_LEADING_EDGE: true,

  // New - Type Loading
  TYPE_LOADING_MAX_DEPTH: 5, // Already exists implicitly
} as const;
```

### Feature Flags

To enable gradual rollout and easy rollback:

| Flag                       | Default | Purpose                                    |
| -------------------------- | ------- | ------------------------------------------ |
| `ENABLE_PARALLEL_TYPES`    | `true`  | Toggle parallel vs. phased type loading    |
| `ENABLE_ADAPTIVE_DEBOUNCE` | `true`  | Toggle adaptive vs. fixed debounce         |
| `ENABLE_BATCH_WRITES`      | `true`  | Toggle parallel vs. sequential file writes |
| `ENABLE_MODEL_CACHE`       | `true`  | Toggle cached vs. full model scanning      |

Flags allow A/B testing and quick revert if issues arise in production.

## Testing Strategy

### Validation Approach

Each optimization requires specific validation to ensure correctness:

**1. Parallel Type Loading**

Test Cases:

- Verify IntelliSense still works for `vitest` imports after parallel load
- Confirm no console errors from Monaco type worker
- Check that cross-package type references resolve (e.g., `expect()` from `vitest` module)

Success Criteria:

- No regression in IntelliSense accuracy
- Faster "time to first hint" metric

**2. Adaptive Debounce**

Test Cases:

- Single character edit → Should sync immediately (leading edge)
- Paste 500 characters → Should wait 500ms
- Continuous typing → Should batch with 500ms debounce
- Edit, pause 2s, edit again → Should sync immediately on second edit

Success Criteria:

- Preview updates match expected timing patterns
- No "thrashing" from over-eager syncs
- Reduced perceived latency for common workflows

**3. Batched File Writes**

Test Cases:

- Run tests with 1 file → Same speed as before
- Run tests with 5 files → Faster than sequential
- Verify all files written correctly before test execution
- Ensure directory creation doesn't race with file writes

Success Criteria:

- No file write failures
- Tests receive correct file contents
- Measurable speed improvement for multi-file scenarios

**4. Model Cache**

Test Cases:

- Create 10 files → Cache should contain 10 paths
- Delete 3 files → Cache should contain 7 paths, Monaco models disposed
- Load 100 type definitions → Cache still only tracks user files
- File tree operations remain smooth

Success Criteria:

- No memory leaks (cache doesn't grow unbounded)
- Correct model disposal on file deletion
- Reduced CPU usage during file sync operations

### Performance Benchmarking

Measure before and after for:

| Metric                     | Measurement Tool                             | Target Improvement |
| -------------------------- | -------------------------------------------- | ------------------ |
| Type injection time        | `console.time()` in `injectIntelliSense`     | 30%+ reduction     |
| Sync latency (single edit) | Time from `updateFile()` to container write  | Immediate (0ms)    |
| Test start delay           | Time from `runTests()` call to process spawn | 50%+ reduction     |
| File sync CPU time         | Chrome DevTools Performance profiler         | 80%+ reduction     |

## Rollout Plan

### Phase 1: Low-Risk Optimizations

- Deploy parallel type loading
- Deploy batched file writes
- Deploy model cache
- Monitor for errors/regressions for 1 week

### Phase 2: Adaptive Debounce

- Deploy adaptive debounce with feature flag disabled
- Enable for 20% of users
- Gather feedback on perceived responsiveness
- Adjust timing constants if needed
- Roll out to 100%

### Phase 3: Measurement & Tuning

- Collect performance metrics from production
- Adjust constants based on real-world usage patterns
- Remove feature flags after stability confirmed

## Alternative Approaches Considered

### For Type Loading

**Alternative: Keep Sequential Phases**

- Reasoning: Ensures dependency order is explicit
- Rejected: Monaco's lazy resolution makes this unnecessary; adds complexity for no benefit

**Alternative: Load Types on First Use**

- Reasoning: Defer cost until user actually types `import { ... } from 'vitest'`
- Rejected: Creates jarring delay when user first tries to use IntelliSense; better to pay cost upfront

### For Debounce Strategy

**Alternative: Use Only Leading Edge Debounce**

- Reasoning: Always sync immediately on every change
- Rejected: Would cause excessive writes during continuous typing; container filesystem could thrash

**Alternative: Make Debounce User-Configurable**

- Reasoning: Let users choose "responsive" vs "stable" mode
- Rejected: Adds UI complexity; adaptive strategy serves both needs automatically

### For File Writes

**Alternative: Use Streaming Writes**

- Reasoning: Start test process while files are still being written
- Rejected: Race condition risk; tests could read incomplete files

**Alternative: Write Only Changed Files**

- Reasoning: Optimize by diffing previous state
- Rejected: Already implemented in `useContainerSync`; test runner needs full sync for correctness

### For Model Management

**Alternative: Use WeakMap for Model Tracking**

- Reasoning: Automatic garbage collection of disposed models
- Rejected: Monaco URIs (keys) are not weakly referenceable; Set is simpler and explicit

**Alternative: Subscribe to Monaco Model Events**

- Reasoning: React to model lifecycle changes instead of polling
- Rejected: Adds complexity; current sync approach is sufficient with caching

// Batch 2: Write all files
await Promise.all(
Object.entries(fileContents).map(([filename, content]) =>
instance.fs.writeFile(filename, content)
)
);

```

**Why Two Batches:**

While file writes are independent, directory creation must complete before writing files in those directories. The two-batch approach ensures directory structure exists before any write operation attempts to use it.

**Behavioral Changes:**

| File Count | Before (sequential) | After (parallel) |
|------------|---------------------|------------------|
| 1 file | ~20ms | ~20ms (no change) |
| 3 files | ~60ms | ~25ms (2.4x faster) |
| 5 files | ~100ms | ~30ms (3.3x faster) |

*Note: Timings are illustrative; actual performance depends on WebContainer I/O characteristics*

### 4. Monaco Model Cache

**Strategy:**
Maintain a local `Set<string>` of user-created model paths to avoid scanning all Monaco models on every sync.

**Approach:**

Add state tracking to `useMonacoSync`:

1. Initialize a `useRef` to hold a `Set<string>` of created model paths
2. When creating a model, add its normalized path to the Set
3. When checking for deletions, only iterate over the cached Set instead of all Monaco models
4. Remove paths from the Set when models are disposed

**Data Structure:**

```

const createdModelsRef = useRef<Set<string>>(new Set());

```

**Lifecycle:**

| Operation | Effect on Cache | Effect on Monaco |
|-----------|----------------|------------------|
| Create model | Add path to Set | `monaco.editor.createModel()` |
| Update file content | No-op (model exists) | No-op (editor manages content) |
| Delete file from store | Remove path from Set | `model.dispose()` |
| Sync runs | Iterate only cached paths | Skip internal models |

**Behavioral Changes:**

| Aspect | Before | After |
|--------|--------|-------|
| Iteration Count | 100+ models (incl. internals) | 3-10 models (user files only) |
| Filtering Logic | Every sync | Only on cache operations |
| String Manipulation | Every model, every sync | Only user paths, once per lifecycle |
| Performance | O(n) where n = all models | O(m) where m = user models |

**Edge Case Handling:**

- If Monaco internally disposes a model (unlikely), the cache will be out of sync but harmless—the dispose call will simply no-op
- On component unmount, the cache is discarded with the ref
- The cache only tracks paths, not model instances, so no memory leak risk

## Implementation Impact

### Files Modified

| File | Changes | Risk Level |
|------|---------|------------|
| `hooks/useTypeBridge.ts` | Collapse 4 phases into 1 `Promise.all` | Low |
| `hooks/useContainerSync.ts` | Add adaptive debounce logic | Medium |
| `hooks/useTestRunner.ts` | Replace loop with batched `Promise.all` | Low |
| `hooks/useMonacoSync.ts` | Add Set-based model cache | Low |
| `lib/config/constants.ts` | Add new debounce timing constants | Low |

### Risk Assessment

**Low Risk Changes:**
- Type loading parallelization: Monaco handles lazy resolution; worst case is temporary red squiggles
- File write batching: No interdependencies; rollback is trivial
- Model cache: Purely additive optimization; no functional change

**Medium Risk Change:**
- Adaptive debounce: Changes user-facing timing behavior
  - Mitigation: Make adaptive thresholds configurable constants for easy tuning
  - Mitigation: Add escape hatch to revert to fixed debounce via flag

### Performance Expectations

| Optimization | Expected Improvement | Measurement Point |
|--------------|---------------------|-------------------|
| Parallel Type Loading | 30-50% faster IntelliSense ready time | Time from container boot to first type hint |
| Adaptive Debounce | 150-300ms faster for single edits | Time from edit to preview refresh |
| Batched File Writes | 2-3x faster for 3+ file challenges | Time from "Run Tests" to first output |
| Model Cache | 90% reduction in sync overhead | CPU time during file tree operations |

### User Experience Impact

**Before:**
- Wait ~2 seconds for IntelliSense after opening challenge
- Wait 300ms after every edit before preview updates
- Wait 100-200ms before tests start running (3-5 file challenge)
- Minor lag when rapidly creating/deleting files

**After:**
- Wait ~1 second for IntelliSense (50% faster)
- Instant preview for single edits; 150ms for small changes
- Wait ~30ms before tests start (parallel writes)
- Smooth file operations regardless of type definition count

## Configuration Strategy

### New Constants

Add to `lib/config/constants.ts`:

```

export const TIMINGS = {
// Existing
DEBOUNCE_FILE_SYNC_MS: 300,
DEBOUNCE_MONACO_SYNC_MS: 150,

// New - Adaptive Sync
SYNC_IDLE_THRESHOLD_MS: 1000,
SYNC_SMALL_CHANGE_CHARS: 100,
SYNC_SHORT_DEBOUNCE_MS: 150,
SYNC_LONG_DEBOUNCE_MS: 500,
SYNC_ENABLE_LEADING_EDGE: true,

// New - Type Loading
TYPE_LOADING_MAX_DEPTH: 5, // Already exists implicitly
} as const;

```

### Feature Flags

To enable gradual rollout and easy rollback:

| Flag | Default | Purpose |
|------|---------|---------|
| `ENABLE_PARALLEL_TYPES` | `true` | Toggle parallel vs. phased type loading |
| `ENABLE_ADAPTIVE_DEBOUNCE` | `true` | Toggle adaptive vs. fixed debounce |
| `ENABLE_BATCH_WRITES` | `true` | Toggle parallel vs. sequential file writes |
| `ENABLE_MODEL_CACHE` | `true` | Toggle cached vs. full model scanning |

Flags allow A/B testing and quick revert if issues arise in production.

## Testing Strategy

### Validation Approach

Each optimization requires specific validation to ensure correctness:

**1. Parallel Type Loading**

Test Cases:
- Verify IntelliSense still works for `vitest` imports after parallel load
- Confirm no console errors from Monaco type worker
- Check that cross-package type references resolve (e.g., `expect()` from `vitest` module)

Success Criteria:
- No regression in IntelliSense accuracy
- Faster "time to first hint" metric

**2. Adaptive Debounce**

Test Cases:
- Single character edit → Should sync immediately (leading edge)
- Paste 500 characters → Should wait 500ms
- Continuous typing → Should batch with 500ms debounce
- Edit, pause 2s, edit again → Should sync immediately on second edit

Success Criteria:
- Preview updates match expected timing patterns
- No "thrashing" from over-eager syncs
- Reduced perceived latency for common workflows

**3. Batched File Writes**

Test Cases:
- Run tests with 1 file → Same speed as before
- Run tests with 5 files → Faster than sequential
- Verify all files written correctly before test execution
- Ensure directory creation doesn't race with file writes

Success Criteria:
- No file write failures
- Tests receive correct file contents
- Measurable speed improvement for multi-file scenarios

**4. Model Cache**

Test Cases:
- Create 10 files → Cache should contain 10 paths
- Delete 3 files → Cache should contain 7 paths, Monaco models disposed
- Load 100 type definitions → Cache still only tracks user files
- File tree operations remain smooth

Success Criteria:
- No memory leaks (cache doesn't grow unbounded)
- Correct model disposal on file deletion
- Reduced CPU usage during file sync operations

### Performance Benchmarking

Measure before and after for:

| Metric | Measurement Tool | Target Improvement |
|--------|------------------|-------------------|
| Type injection time | `console.time()` in `injectIntelliSense` | 30%+ reduction |
| Sync latency (single edit) | Time from `updateFile()` to container write | Immediate (0ms) |
| Test start delay | Time from `runTests()` call to process spawn | 50%+ reduction |
| File sync CPU time | Chrome DevTools Performance profiler | 80%+ reduction |

## Rollout Plan

### Phase 1: Low-Risk Optimizations
- Deploy parallel type loading
- Deploy batched file writes
- Deploy model cache
- Monitor for errors/regressions for 1 week

### Phase 2: Adaptive Debounce
- Deploy adaptive debounce with feature flag disabled
- Enable for 20% of users
- Gather feedback on perceived responsiveness
- Adjust timing constants if needed
- Roll out to 100%

### Phase 3: Measurement & Tuning
- Collect performance metrics from production
- Adjust constants based on real-world usage patterns
- Remove feature flags after stability confirmed

## Alternative Approaches Considered

### For Type Loading

**Alternative: Keep Sequential Phases**
- Reasoning: Ensures dependency order is explicit
- Rejected: Monaco's lazy resolution makes this unnecessary; adds complexity for no benefit

**Alternative: Load Types on First Use**
- Reasoning: Defer cost until user actually types `import { ... } from 'vitest'`
- Rejected: Creates jarring delay when user first tries to use IntelliSense; better to pay cost upfront

### For Debounce Strategy

**Alternative: Use Only Leading Edge Debounce**
- Reasoning: Always sync immediately on every change
- Rejected: Would cause excessive writes during continuous typing; container filesystem could thrash

**Alternative: Make Debounce User-Configurable**
- Reasoning: Let users choose "responsive" vs "stable" mode
- Rejected: Adds UI complexity; adaptive strategy serves both needs automatically

### For File Writes

**Alternative: Use Streaming Writes**
- Reasoning: Start test process while files are still being written
- Rejected: Race condition risk; tests could read incomplete files

**Alternative: Write Only Changed Files**
- Reasoning: Optimize by diffing previous state
- Rejected: Already implemented in `useContainerSync`; test runner needs full sync for correctness

### For Model Management

**Alternative: Use WeakMap for Model Tracking**
- Reasoning: Automatic garbage collection of disposed models
- Rejected: Monaco URIs (keys) are not weakly referenceable; Set is simpler and explicit

**Alternative: Subscribe to Monaco Model Events**
- Reasoning: React to model lifecycle changes instead of polling
- Rejected: Adds complexity; current sync approach is sufficient with caching
```

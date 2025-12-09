# Court Store Migration Guide

## Overview

The `useCourtStore` has been enhanced with fetch-if-missing patterns and inflight request guards to prevent duplicate concurrent API requests and improve performance through caching.

## New Features

### 1. Fetch-if-Missing Pattern

The store now implements idempotent, concurrency-safe methods that:
- Return cached data when available
- Perform network requests only when data is missing or explicitly forced
- Prevent duplicate concurrent requests using inflight guards

### 2. New Store Methods

#### `fetchCourtsIfNeeded(options?)`

Fetches courts for a club if not already loaded.

**Parameters:**
- `options.force?: boolean` - Force fetch even if data exists (default: false)
- `options.clubId?: string` - Club ID to fetch courts for

**Returns:** `Promise<Court[]>`

**Behavior:**
- If `!force` and courts exist → returns cached data immediately
- If request already in flight → returns existing promise
- Otherwise → performs new fetch

**Example:**
```typescript
const courts = useCourtStore(state => state.courts);
const fetchCourtsIfNeeded = useCourtStore(state => state.fetchCourtsIfNeeded);

useEffect(() => {
  fetchCourtsIfNeeded({ clubId }).catch(console.error);
}, [fetchCourtsIfNeeded, clubId]);
```

#### `ensureCourtById(courtId, options?)`

Ensures a specific court is loaded by ID.

**Parameters:**
- `courtId: string` - Court ID to fetch
- `options.force?: boolean` - Force fetch even if cached (default: false)
- `options.clubId?: string` - Optional club ID context

**Returns:** `Promise<CourtDetail>`

**Behavior:**
- If `!force` and court exists in cache → returns cached data immediately
- If request already in flight for this court → returns existing promise
- Otherwise → performs new fetch and updates both `courtsById` and `courts`

**Example:**
```typescript
const ensureCourtById = useCourtStore(state => state.ensureCourtById);
const court = useCourtStore(state => state.courtsById[courtId]);

useEffect(() => {
  ensureCourtById(courtId, { clubId }).catch(console.error);
}, [ensureCourtById, courtId, clubId]);
```

#### `invalidateCourts()`

Clears all cached court data and forces fresh fetch on next request.

**Example:**
```typescript
const invalidateCourts = useCourtStore(state => state.invalidateCourts);

// After creating/updating/deleting via other means
invalidateCourts();
```

### 3. New Store State

- `courtsById: Record<string, CourtDetail>` - Cache for individual court details
- `loadingCourts: boolean` - Loading state for court operations
- `courtsError: string | null` - Error state for court operations
- `lastFetchedAt: number | null` - Timestamp of last successful fetch
- `_inflightFetchCourts: Promise<Court[]> | null` - Internal inflight guard
- `_inflightFetchCourtById: Record<string, Promise<CourtDetail>>` - Internal inflight guards per court

## Migration Path

### Before (Direct API Calls)

```typescript
const [courts, setCourts] = useState<Court[]>([]);
const [loading, setLoading] = useState(true);

const fetchCourts = useCallback(async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/clubs/${clubId}/courts`);
    const data = await response.json();
    setCourts(data.courts);
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
}, [clubId]);

useEffect(() => {
  fetchCourts();
}, [fetchCourts]);
```

### After (Using Store)

```typescript
const courts = useCourtStore(state => state.courts);
const loadingCourts = useCourtStore(state => state.loadingCourts);
const fetchCourtsIfNeeded = useCourtStore(state => state.fetchCourtsIfNeeded);

useEffect(() => {
  fetchCourtsIfNeeded({ clubId }).catch(console.error);
}, [fetchCourtsIfNeeded, clubId]);
```

## Pages Migrated

### Completed

1. **Admin Courts Page** (`/admin/clubs/[id]/courts/page.tsx`)
   - Uses `fetchCourtsIfNeeded` for listing courts
   - Uses store's `createCourt`, `updateCourt`, `deleteCourt` methods
   - Automatic cache updates on mutations

2. **Admin Court Detail** (`/admin/clubs/[id]/courts/[courtId]/page.tsx`)
   - Uses `ensureCourtById` for loading court details
   - Uses store's `updateCourt` and `deleteCourt` methods

3. **Admin Court Price Rules** (`/admin/clubs/[id]/courts/[courtId]/price-rules/page.tsx`)
   - Uses `ensureCourtById` to load court context

4. **Player Court Detail** (`/(player)/courts/[courtId]/page.tsx`)
   - Uses `ensureCourtById` for court data

### Not Migrated (By Design)

1. **Admin All Courts Page** (`/admin/courts/page.tsx`)
   - Uses platform-wide `/api/admin/courts` endpoint
   - Requires pagination and advanced filtering
   - Not suitable for basic club-scoped store methods

2. **Player Club Detail** (`/(player)/clubs/[id]/page.tsx`)
   - Only fetches court availability, not court data
   - No migration needed

## Benefits

### 1. Performance

- **Caching**: Prevents unnecessary network requests for already-loaded data
- **Inflight Guards**: Prevents duplicate concurrent requests when multiple components mount simultaneously
- **Reduced Network Traffic**: Minimizes API calls through intelligent caching

### 2. Developer Experience

- **Simpler Code**: Eliminates boilerplate for loading states and error handling
- **Type Safety**: Full TypeScript support with proper types
- **Consistency**: All court data flows through a single source of truth

### 3. User Experience

- **Faster Navigation**: Cached data loads instantly
- **Reduced Latency**: No duplicate requests means faster perceived performance
- **Automatic Updates**: Mutations automatically update the cache

## SSR Considerations

For server-side rendered pages:

```typescript
// Server-side (getServerSideProps or route handler)
const courts = await fetchCourtsFromDatabase();

// Client-side after hydration
useEffect(() => {
  useCourtStore.getState().setCourts(courtsFromServer);
}, [courtsFromServer]);
```

## Testing

The store includes comprehensive tests covering:

- Basic fetch operations
- Concurrent request deduplication
- Cache invalidation
- Force refresh behavior
- Error handling and recovery
- Integration with CRUD operations

**Test Results:**
- 24 existing tests: ✓ All passing
- 17 new inflight/caching tests: ✓ All passing
- **Total: 41 tests passing**

## Best Practices

1. **Use fetchCourtsIfNeeded for lists** - Provides caching and deduplication
2. **Use ensureCourtById for details** - Efficient single-court loading
3. **Call invalidateCourts after external changes** - When courts are modified outside the store
4. **Let mutations update the cache** - createCourt, updateCourt, deleteCourt automatically maintain cache consistency
5. **Don't force refresh unnecessarily** - Let the cache work for you

## Future Enhancements

Potential improvements for future iterations:

1. **TTL-Based Refresh**: Auto-refresh after `lastFetchedAt` exceeds threshold
2. **Pagination Support**: `fetchCourtsPageIfNeeded(page)` for large datasets
3. **Optimistic Updates**: Better UI feedback during mutations
4. **AbortController**: Cancel in-flight requests on unmount
5. **Selective Invalidation**: `invalidateCourt(courtId)` for granular control

## Troubleshooting

### Issue: Data not updating after mutation

**Solution:** The store's CRUD methods automatically update the cache. If you're using external API calls, call `invalidateCourts()` afterward.

### Issue: Multiple network requests on page load

**Solution:** Verify you're using `fetchCourtsIfNeeded` instead of `fetchCourtsByClubId`. The former has inflight protection.

### Issue: Stale data showing

**Solution:** Use `force: true` option or call `invalidateCourts()` to clear the cache.

## Summary

The enhanced court store provides a robust, performant, and developer-friendly way to manage court data across the application. By implementing fetch-if-missing patterns and inflight guards, we've eliminated common issues with duplicate requests and improved overall application performance.

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks so they exist before module-top `vi.mock` calls below.
const mocks = vi.hoisted(() => {
	let currentUrl = new URL('https://example.test/users');
	let currentBrowser = true;
	return {
		setUrl(u: URL): void {
			currentUrl = u;
		},
		setBrowser(b: boolean): void {
			currentBrowser = b;
		},
		readUrl(): URL {
			return currentUrl;
		},
		readBrowser(): boolean {
			return currentBrowser;
		},
		goto: vi.fn()
	};
});

vi.mock('$app/state', () => ({
	page: {
		get url() {
			return mocks.readUrl();
		}
	}
}));

vi.mock('$app/environment', () => ({
	get browser() {
		return mocks.readBrowser();
	}
}));

vi.mock('$app/navigation', () => ({
	goto: mocks.goto
}));

// Import AFTER the mocks above so the binding module reads the mocked APIs.
const { createListBinding } = await import('$lib/app/shared/ui/list/binding');

beforeEach(() => {
	mocks.setUrl(new URL('https://example.test/users'));
	mocks.setBrowser(true);
	mocks.goto.mockReset();
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('createListBinding', () => {
	describe('ownedKeys', () => {
		it('without searchParams: built-ins only', () => {
			const binding = createListBinding();
			expect([...binding.ownedKeys].sort()).toEqual(['page', 'q', 'size', 'sort']);
		});

		it('with searchParams: built-ins ∪ schema keys', () => {
			const binding = createListBinding({
				searchParams: { status: 'string', tier: 'number[]' }
			});
			expect([...binding.ownedKeys].sort()).toEqual([
				'page',
				'q',
				'size',
				'sort',
				'status',
				'tier'
			]);
		});
	});

	describe('resetOnSubmitKeys', () => {
		it('default = {"page"}', () => {
			const binding = createListBinding();
			expect([...binding.resetOnSubmitKeys]).toEqual(['page']);
		});

		it('override with built-in keys', () => {
			const binding = createListBinding({ resetOnSubmit: ['page', 'sort'] });
			expect([...binding.resetOnSubmitKeys].sort()).toEqual(['page', 'sort']);
		});

		it('override with schema keys', () => {
			const binding = createListBinding({
				searchParams: { status: 'string' },
				resetOnSubmit: ['page', 'status']
			});
			expect([...binding.resetOnSubmitKeys].sort()).toEqual(['page', 'status']);
		});
	});

	describe('parse — built-in lenient + clamp', () => {
		it('returns defaults for an empty URL', () => {
			const binding = createListBinding();
			const q = binding.parse(new URL('https://x.test/'));
			expect(q).toEqual({
				page: 0,
				size: 20,
				sort: [],
				q: undefined,
				searchParams: {}
			});
		});

		describe('page', () => {
			it.each([
				['0', 0],
				['1', 1],
				['42', 42]
			])('"%s" → %d', (raw, expected) => {
				const binding = createListBinding();
				const q = binding.parse(new URL(`https://x.test/?page=${raw}`));
				expect(q.page).toBe(expected);
			});

			it.each([['-1'], ['abc'], ['NaN'], ['1.5']])('invalid "%s" → 0 + dev warn', (raw) => {
				const binding = createListBinding();
				const q = binding.parse(new URL(`https://x.test/?page=${raw}`));
				expect(q.page).toBe(0);
				expect(console.warn).toHaveBeenCalled();
			});
		});

		describe('size', () => {
			it.each([
				['1', 1],
				['20', 20],
				['100', 100]
			])('"%s" → %d', (raw, expected) => {
				const binding = createListBinding();
				const q = binding.parse(new URL(`https://x.test/?size=${raw}`));
				expect(q.size).toBe(expected);
			});

			it('size > 100 → clamped to MAX_PAGE_SIZE (100)', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/?size=999'));
				expect(q.size).toBe(100);
				expect(console.warn).toHaveBeenCalled();
			});

			it('size < 1 → DEFAULT_PAGE_SIZE (20)', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/?size=0'));
				expect(q.size).toBe(20);
				expect(console.warn).toHaveBeenCalled();
			});

			it('non-integer "1.5" → DEFAULT_PAGE_SIZE (20)', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/?size=1.5'));
				expect(q.size).toBe(20);
				expect(console.warn).toHaveBeenCalled();
			});
		});

		describe('q', () => {
			it('present → string', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/?q=alice'));
				expect(q.q).toBe('alice');
			});

			it('empty → undefined (not "")', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/?q='));
				expect(q.q).toBeUndefined();
			});

			it('longer than 100 chars → truncated + dev warn', () => {
				const binding = createListBinding();
				const long = 'x'.repeat(150);
				const q = binding.parse(new URL(`https://x.test/?q=${long}`));
				expect(q.q?.length).toBe(100);
				expect(console.warn).toHaveBeenCalled();
			});
		});

		describe('sort', () => {
			it('repeat key → ordered list', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/?sort=name,asc&sort=age,desc'));
				expect(q.sort).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'desc' }
				]);
			});

			it('invalid direction → entry dropped + dev warn', () => {
				const binding = createListBinding();
				const q = binding.parse(
					new URL('https://x.test/?sort=name,asc&sort=age,xxx&sort=createdAt,desc')
				);
				expect(q.sort).toEqual([
					{ field: 'name', direction: 'asc' },
					{ field: 'createdAt', direction: 'desc' }
				]);
				expect(console.warn).toHaveBeenCalled();
			});

			it('absent → []', () => {
				const binding = createListBinding();
				const q = binding.parse(new URL('https://x.test/'));
				expect(q.sort).toEqual([]);
			});
		});
	});

	describe('parse — per-field strict + drop', () => {
		describe("'string'", () => {
			it('?k=v → "v"', () => {
				const b = createListBinding({ searchParams: { k: 'string' } });
				expect(b.parse(new URL('https://x.test/?k=v')).searchParams.k).toBe('v');
			});

			it('?k= (empty) → undefined', () => {
				const b = createListBinding({ searchParams: { k: 'string' } });
				expect(b.parse(new URL('https://x.test/?k=')).searchParams.k).toBeUndefined();
			});

			it('absent → undefined', () => {
				const b = createListBinding({ searchParams: { k: 'string' } });
				expect(b.parse(new URL('https://x.test/')).searchParams.k).toBeUndefined();
			});

			it('repeat (multi → scalar) → first + dev warn', () => {
				const b = createListBinding({ searchParams: { k: 'string' } });
				expect(b.parse(new URL('https://x.test/?k=a&k=b')).searchParams.k).toBe('a');
				expect(console.warn).toHaveBeenCalled();
			});
		});

		describe("'string[]'", () => {
			it('repeat → ordered array', () => {
				const b = createListBinding({ searchParams: { k: 'string[]' } });
				expect(b.parse(new URL('https://x.test/?k=a&k=b')).searchParams.k).toEqual(['a', 'b']);
			});

			it('drops empty entries but keeps the rest', () => {
				const b = createListBinding({ searchParams: { k: 'string[]' } });
				expect(b.parse(new URL('https://x.test/?k=&k=b')).searchParams.k).toEqual(['b']);
			});

			it('absent → []', () => {
				const b = createListBinding({ searchParams: { k: 'string[]' } });
				expect(b.parse(new URL('https://x.test/')).searchParams.k).toEqual([]);
			});
		});

		describe("'number'", () => {
			it.each([
				['?k=42', 42],
				['?k=1.5', 1.5],
				['?k=1.5e2', 150]
			])('"%s" → %d', (query, expected) => {
				const b = createListBinding({ searchParams: { k: 'number' } });
				expect(b.parse(new URL(`https://x.test/${query}`)).searchParams.k).toBe(expected);
			});

			it.each([['?k=abc'], ['?k=NaN'], ['?k=Infinity']])(
				'invalid "%s" → undefined + dev warn',
				(query) => {
					const b = createListBinding({ searchParams: { k: 'number' } });
					expect(b.parse(new URL(`https://x.test/${query}`)).searchParams.k).toBeUndefined();
					expect(console.warn).toHaveBeenCalled();
				}
			);

			it('?k= (empty) → undefined (no warn)', () => {
				const b = createListBinding({ searchParams: { k: 'number' } });
				expect(b.parse(new URL('https://x.test/?k=')).searchParams.k).toBeUndefined();
			});
		});

		describe("'number[]'", () => {
			it('drops invalid entries individually (keeps the rest)', () => {
				const b = createListBinding({ searchParams: { k: 'number[]' } });
				expect(b.parse(new URL('https://x.test/?k=1&k=2&k=abc')).searchParams.k).toEqual([1, 2]);
				expect(console.warn).toHaveBeenCalled();
			});

			it('absent → []', () => {
				const b = createListBinding({ searchParams: { k: 'number[]' } });
				expect(b.parse(new URL('https://x.test/')).searchParams.k).toEqual([]);
			});
		});

		describe("'boolean'", () => {
			it('"true" / "false" only', () => {
				const b = createListBinding({ searchParams: { k: 'boolean' } });
				expect(b.parse(new URL('https://x.test/?k=true')).searchParams.k).toBe(true);
				expect(b.parse(new URL('https://x.test/?k=false')).searchParams.k).toBe(false);
			});

			it.each([['?k=1'], ['?k=0'], ['?k=on'], ['?k=yes']])(
				'rejects "%s" with dev warn → undefined',
				(query) => {
					const b = createListBinding({ searchParams: { k: 'boolean' } });
					expect(b.parse(new URL(`https://x.test/${query}`)).searchParams.k).toBeUndefined();
					expect(console.warn).toHaveBeenCalled();
				}
			);

			it('absent → undefined', () => {
				const b = createListBinding({ searchParams: { k: 'boolean' } });
				expect(b.parse(new URL('https://x.test/')).searchParams.k).toBeUndefined();
			});
		});

		it('preserves unknown URL keys (not in schema) silently — they live in the URL only', () => {
			const b = createListBinding({ searchParams: { k: 'string' } });
			const q = b.parse(new URL('https://x.test/?k=v&theme=dark'));
			// `theme` is not in schema, so it does not appear in searchParams.
			expect(Object.keys(q.searchParams)).toEqual(['k']);
		});
	});

	describe('toBackendQuery', () => {
		it('always sends page and size', () => {
			const b = createListBinding();
			const q = b.parse(new URL('https://x.test/?page=2&size=50'));
			expect(b.toBackendQuery(q)).toEqual({ page: 2, size: 50 });
		});

		it('omits q when undefined or empty', () => {
			const b = createListBinding();
			const q = b.parse(new URL('https://x.test/'));
			expect(b.toBackendQuery(q).q).toBeUndefined();
		});

		it('sends q when present', () => {
			const b = createListBinding();
			const q = b.parse(new URL('https://x.test/?q=alice'));
			expect(b.toBackendQuery(q).q).toBe('alice');
		});

		it('sends sort as `field,dir` strings (repeat-key on wire)', () => {
			const b = createListBinding();
			const q = b.parse(new URL('https://x.test/?sort=name,asc&sort=age,desc'));
			expect(b.toBackendQuery(q).sort).toEqual(['name,asc', 'age,desc']);
		});

		it('omits empty sort array', () => {
			const b = createListBinding();
			const q = b.parse(new URL('https://x.test/'));
			expect(b.toBackendQuery(q).sort).toBeUndefined();
		});

		it('sends searchParams arrays as-is', () => {
			const b = createListBinding({ searchParams: { tier: 'number[]' } });
			const q = b.parse(new URL('https://x.test/?tier=1&tier=2'));
			expect(b.toBackendQuery(q).tier).toEqual([1, 2]);
		});

		it('omits empty arrays in searchParams', () => {
			const b = createListBinding({ searchParams: { tier: 'number[]' } });
			const q = b.parse(new URL('https://x.test/'));
			expect(b.toBackendQuery(q).tier).toBeUndefined();
		});

		it('omits undefined scalars in searchParams', () => {
			const b = createListBinding({ searchParams: { status: 'string' } });
			const q = b.parse(new URL('https://x.test/'));
			expect(b.toBackendQuery(q).status).toBeUndefined();
		});

		it('sends 0 and false as explicit values (not omitted)', () => {
			const b = createListBinding({ searchParams: { n: 'number', flag: 'boolean' } });
			const q = b.parse(new URL('https://x.test/?n=0&flag=false'));
			const wire = b.toBackendQuery(q);
			expect(wire.n).toBe(0);
			expect(wire.flag).toBe(false);
		});
	});

	describe('toUrlSearchParams', () => {
		it('throws under SSR with a helpful message', () => {
			mocks.setBrowser(false);
			const b = createListBinding();
			expect(() => b.toUrlSearchParams({ page: 1 })).toThrow(/client-only/);
		});

		it('preserves non-owned keys from the current URL (e.g., theme, locale)', () => {
			mocks.setUrl(new URL('https://x.test/users?theme=dark&locale=ja'));
			const b = createListBinding();
			const params = b.toUrlSearchParams({ page: 2 });
			expect(params.get('theme')).toBe('dark');
			expect(params.get('locale')).toBe('ja');
			expect(params.get('page')).toBe('2');
		});

		it('preserves multi-value non-owned keys via getAll', () => {
			mocks.setUrl(new URL('https://x.test/?flash=ok&flash=warn'));
			const b = createListBinding();
			const params = b.toUrlSearchParams({});
			expect(params.getAll('flash')).toEqual(['ok', 'warn']);
		});

		it('drops owned keys not present in next (e.g., resets page)', () => {
			mocks.setUrl(new URL('https://x.test/?page=5&size=50&q=foo'));
			const b = createListBinding();
			const params = b.toUrlSearchParams({ size: 50 });
			expect(params.has('page')).toBe(false);
			expect(params.get('size')).toBe('50');
			expect(params.has('q')).toBe(false);
		});

		it('omits size when equal to DEFAULT_PAGE_SIZE (20)', () => {
			const b = createListBinding();
			const params = b.toUrlSearchParams({ size: 20 });
			expect(params.has('size')).toBe(false);
		});

		it('omits page when equal to 0', () => {
			const b = createListBinding();
			const params = b.toUrlSearchParams({ page: 0 });
			expect(params.has('page')).toBe(false);
		});

		it('serializes sort as repeat keys', () => {
			const b = createListBinding();
			const params = b.toUrlSearchParams({
				sort: [
					{ field: 'name', direction: 'asc' },
					{ field: 'age', direction: 'desc' }
				]
			});
			expect(params.getAll('sort')).toEqual(['name,asc', 'age,desc']);
		});

		it('serializes searchParams arrays as repeat keys', () => {
			const b = createListBinding({ searchParams: { tier: 'number[]' } });
			const params = b.toUrlSearchParams({ searchParams: { tier: [1, 2] } });
			expect(params.getAll('tier')).toEqual(['1', '2']);
		});
	});

	describe('createNavigate', () => {
		it('calls goto with the new URL on push by default', () => {
			mocks.setUrl(new URL('https://x.test/users?theme=dark'));
			const b = createListBinding();
			const navigate = b.createNavigate();
			navigate({ page: 2 });
			expect(mocks.goto).toHaveBeenCalledOnce();
			const [url, options] = mocks.goto.mock.calls[0];
			expect((url as URL).toString()).toBe('https://x.test/users?theme=dark&page=2');
			expect(options).toMatchObject({ replaceState: false });
		});

		it('uses replaceState when { replace: true }', () => {
			const b = createListBinding();
			const navigate = b.createNavigate({ replace: true });
			navigate({ page: 3 });
			expect(mocks.goto.mock.calls[0][1]).toMatchObject({ replaceState: true });
		});

		it('auto-resets page to 0 when q changes without explicit page', () => {
			mocks.setUrl(new URL('https://x.test/?page=5'));
			const b = createListBinding();
			const navigate = b.createNavigate();
			navigate({ q: 'alice' });
			const url = mocks.goto.mock.calls[0][0] as URL;
			expect(url.searchParams.has('page')).toBe(false);
			expect(url.searchParams.get('q')).toBe('alice');
		});

		it('auto-resets page to 0 when searchParams changes without explicit page', () => {
			mocks.setUrl(new URL('https://x.test/?page=5'));
			const b = createListBinding({ searchParams: { status: 'string' } });
			const navigate = b.createNavigate();
			navigate({ searchParams: { status: 'active' } });
			const url = mocks.goto.mock.calls[0][0] as URL;
			expect(url.searchParams.has('page')).toBe(false);
			expect(url.searchParams.get('status')).toBe('active');
		});

		it('respects an explicit page even when q or searchParams change', () => {
			mocks.setUrl(new URL('https://x.test/?page=5'));
			const b = createListBinding();
			const navigate = b.createNavigate();
			navigate({ q: 'alice', page: 3 });
			const url = mocks.goto.mock.calls[0][0] as URL;
			expect(url.searchParams.get('page')).toBe('3');
		});
	});

	describe('createDebouncedNavigate', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		it('debounces calls (only the latest fires after delay)', () => {
			const b = createListBinding();
			const navigate = b.createDebouncedNavigate({ delay: 300 });
			navigate({ q: 'a' });
			navigate({ q: 'al' });
			navigate({ q: 'ali' });
			expect(mocks.goto).not.toHaveBeenCalled();
			vi.advanceTimersByTime(300);
			expect(mocks.goto).toHaveBeenCalledOnce();
			const url = mocks.goto.mock.calls[0][0] as URL;
			expect(url.searchParams.get('q')).toBe('ali');
		});

		it('uses replaceState: true and keepFocus: true and noScroll: true', () => {
			const b = createListBinding();
			const navigate = b.createDebouncedNavigate({ delay: 100 });
			navigate({ q: 'hello' });
			vi.advanceTimersByTime(100);
			expect(mocks.goto.mock.calls[0][1]).toMatchObject({
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
		});
	});
});

export type DynastyArena = 'command' | 'players' | 'matchups' | 'power' | 'trade';

export const SUB_TO_ARENA_MAP: Record<string, DynastyArena> = {
  action: 'command',
  roster: 'command',
  diagnostics: 'command',
  analyzer: 'players',
  database: 'players',
  rookies: 'players',
  leaders: 'players',
  crossref: 'players',
  compare: 'players',
  slate: 'matchups',
  simulator: 'matchups',
  rivalries: 'matchups',
  allplay: 'matchups',
  tiers: 'power',
  matrix: 'power',
  records: 'power',
  bounties: 'power',
  studio: 'power',
  architect: 'trade',
  partners: 'trade',
  capital: 'trade',
  ledger: 'trade',
  trends: 'trade',
  autopsy: 'trade',
};

export const DEFAULT_SUB_MAP: Record<DynastyArena, string> = {
  command: 'action',
  players: 'analyzer',
  matchups: 'slate',
  power: 'tiers',
  trade: 'architect',
};

export interface DynastyNavDetail {
  arena: DynastyArena;
  sub: string;
  extraParams?: Record<string, string | number>;
}

/**
 * Retrieves the last saved arena and sub-view from localStorage,
 * falling back to command / action if unset.
 */
export function getSavedDynastyState(): { arena: DynastyArena; sub: string } {
  if (typeof window === 'undefined') {
    return { arena: 'command', sub: 'action' };
  }
  try {
    const savedArena = localStorage.getItem('blindside_active_arena') as DynastyArena | null;
    const arena: DynastyArena = savedArena && DEFAULT_SUB_MAP[savedArena] ? savedArena : 'command';
    const savedSub = localStorage.getItem('blindside_active_sub');
    const sub = savedSub || DEFAULT_SUB_MAP[arena] || 'action';
    return { arena, sub };
  } catch {
    return { arena: 'command', sub: 'action' };
  }
}

/**
 * Navigates to a specific arena and subtab.
 * If currently inside /dynasty-room/, updates the browser URL using window.history.pushState
 * and dispatches a 'dynasty_arena_change' custom event to avoid Next.js App Router static export canonicalUrl reversion.
 * If outside /dynasty-room/, triggers a standard page navigation.
 */
export function navigateDynasty(
  arena: DynastyArena,
  sub?: string,
  extraParams?: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === 'undefined') return;

  const targetSub = sub || DEFAULT_SUB_MAP[arena] || 'action';
  const searchParams = new URLSearchParams();
  searchParams.set('arena', arena);
  searchParams.set('sub', targetSub);

  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, String(v));
      }
    });
  }

  const queryStr = searchParams.toString();
  const targetUrl = `/dynasty-room/?${queryStr}`;

  // Persist user's choice to localStorage
  try {
    localStorage.setItem('blindside_active_arena', arena);
    localStorage.setItem('blindside_active_sub', targetSub);
  } catch (e) {
    console.warn('Failed to save arena to localStorage', e);
  }

  const isDynastyRoom = window.location.pathname.startsWith('/dynasty-room');

  if (isDynastyRoom) {
    // Already in dynasty room: update history directly
    window.history.pushState(
      { arena, sub: targetSub, extraParams },
      '',
      targetUrl
    );

    // Dispatch custom event for instant component state synchronization
    const event = new CustomEvent<DynastyNavDetail>('dynasty_arena_change', {
      detail: {
        arena,
        sub: targetSub,
        extraParams: extraParams as Record<string, string | number> | undefined,
      },
    });
    window.dispatchEvent(event);

    // Smoothly scroll to top if user was scrolled down
    if (window.scrollY > 40) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else {
    // Outside dynasty-room: do a full navigation to the new route
    window.location.assign(targetUrl);
  }
}

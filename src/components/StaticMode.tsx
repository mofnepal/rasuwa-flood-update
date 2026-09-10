'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * `?static=1` freezes every animation so a printed page or an exported PDF shows
 * final figures. A layout never receives searchParams, so the flag is read here.
 */
export function StaticMode() {
  const searchParams = useSearchParams();
  const isStatic = searchParams.get('static') === '1';

  useEffect(() => {
    document.documentElement.classList.toggle('static', isStatic);
  }, [isStatic]);

  return null;
}

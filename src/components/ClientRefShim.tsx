'use client';

export default function ClientRefShim() {
  // This no-op client component forces Next.js to generate a client reference
  // manifest for the segment, avoiding the runtime invariant crash in some
  // deployment environments.
  return null;
}

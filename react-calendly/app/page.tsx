'use client';
import { useEffect } from 'react';

// Arena ships no `use client` directive, so the boundary is this file's: the app mounts itself on `#root` once the page is there.
export default function Page() {
  useEffect(() => {
    void import('../src/Main');
  }, []);
  return <div id="root" />;
}

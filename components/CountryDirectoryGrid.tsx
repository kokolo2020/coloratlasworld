"use client";

import type { MouseEvent, ReactNode } from "react";

export default function CountryDirectoryGrid({ children }: { children: ReactNode }) {
  function openSnapshot(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>("a[data-snapshot-slug]");
    if (!link || !event.currentTarget.contains(link)) return;

    const slug = link.dataset.snapshotSlug;
    if (!slug) return;

    event.preventDefault();
    window.location.assign(`/?country=${encodeURIComponent(slug)}`);
  }

  return <div className="country-directory-grid" onClick={openSnapshot}>{children}</div>;
}

"use client";

export function getAnalyticsSession() {
  if (typeof window === "undefined") return null;
  const visitorId = localStorage.getItem("color-atlas-visitor-id");
  const sessionId = sessionStorage.getItem("color-atlas-session-id");
  return visitorId && sessionId ? { visitorId, sessionId } : null;
}

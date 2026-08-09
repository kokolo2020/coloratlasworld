"use client";

import { useEffect } from "react";

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function VisitorTracker() {
  useEffect(() => {
    const visitorKey = "color-atlas-visitor-id";
    const sessionKey = "color-atlas-session-id";
    let visitorId = localStorage.getItem(visitorKey);
    let sessionId = sessionStorage.getItem(sessionKey);

    if (!visitorId) {
      visitorId = makeId();
      localStorage.setItem(visitorKey, visitorId);
    }
    if (!sessionId) {
      sessionId = makeId();
      sessionStorage.setItem(sessionKey, sessionId);
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorId, sessionId, path: window.location.pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}

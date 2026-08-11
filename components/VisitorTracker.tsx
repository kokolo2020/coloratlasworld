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
    const sessionStartKey = "color-atlas-session-start";
    let visitorId = localStorage.getItem(visitorKey);
    let sessionId = sessionStorage.getItem(sessionKey);
    let sessionStart = Number(sessionStorage.getItem(sessionStartKey));

    if (!visitorId) {
      visitorId = makeId();
      localStorage.setItem(visitorKey, visitorId);
    }
    if (!sessionId) {
      sessionId = makeId();
      sessionStorage.setItem(sessionKey, sessionId);
    }
    if (!sessionStart) {
      sessionStart = Date.now();
      sessionStorage.setItem(sessionStartKey, String(sessionStart));
    }

    const sendVisit = () => {
      const durationSeconds = Math.max(0, Math.round((Date.now() - sessionStart) / 1000));
      void fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitorId, sessionId, path: window.location.pathname, durationSeconds }),
        keepalive: true,
      }).catch(() => undefined);
    };

    sendVisit();
    const timer = window.setInterval(sendVisit, 15000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendVisit();
    };
    window.addEventListener("pagehide", sendVisit);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", sendVisit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sendVisit();
    };
  }, []);

  return null;
}

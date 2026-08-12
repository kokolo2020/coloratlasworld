"use client";

import { ReactNode, useEffect, useState } from "react";

export default function CountryProfileTabs({ children, report }: { children: ReactNode; report?: ReactNode | null }) {
  const [active, setActive] = useState<"basic" | "report">("basic");

  useEffect(() => {
    if (window.location.hash === "#special-report") setActive("report");
  }, []);

  if (!report) return <>{children}</>;

  function selectTab(tab: "basic" | "report") {
    setActive(tab);
    window.history.replaceState(null, "", tab === "report" ? "#special-report" : "#basic-info");
  }

  return (
    <section className="country-tab-shell" id="basic-info">
      <div className="country-tab-bar" role="tablist" aria-label="Country profile views">
        <button type="button" role="tab" aria-selected={active === "basic"} className={active === "basic" ? "active" : ""} onClick={() => selectTab("basic")}>
          <span>01</span> Basic Info
        </button>
        <button type="button" role="tab" aria-selected={active === "report"} className={active === "report" ? "active" : ""} onClick={() => selectTab("report")}>
          <span>02</span> Special Report
        </button>
      </div>

      <div className="country-tab-panel" role="tabpanel" hidden={active !== "basic"}>
        {children}
      </div>
      <div className="country-tab-panel report-panel" role="tabpanel" id="special-report" hidden={active !== "report"}>
        {report}
      </div>
    </section>
  );
}

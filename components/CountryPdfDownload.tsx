"use client";

import { useState } from "react";
import type { CountryPdfData } from "@/lib/country-pdf";

async function fetchAsset(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load PDF asset: ${response.status}`);
  return response.arrayBuffer();
}

export default function CountryPdfDownload({ data }: { data: CountryPdfData }) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");

  async function download() {
    if (status === "working") return;
    setStatus("working");

    try {
      const [{ generateCountryPdf }, regularFont, boldFont, flagPng] = await Promise.all([
        import("@/lib/country-pdf"),
        fetchAsset("/fonts/NotoSans-Regular.ttf"),
        fetchAsset("/fonts/NotoSans-Bold.ttf"),
        fetchAsset(data.flagPngUrl).catch(() => null),
      ]);
      const bytes = await generateCountryPdf(data, { regularFont, boldFont, flagPng });
      const pdfBuffer = new Uint8Array(bytes).buffer;
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `color-atlas-world-${data.slug}-report.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("idle");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <div className="country-pdf-download">
      <button className="pdf-download-button" type="button" onClick={download} disabled={status === "working"}>
        <span className="pdf-download-icon" aria-hidden="true">PDF</span>
        <span>{status === "working" ? "Preparing report..." : "Download free report"}</span>
      </button>
      {status === "error" && <small role="status">The report could not be created. Please try again.</small>}
    </div>
  );
}

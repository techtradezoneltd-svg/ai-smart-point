import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import JSZip from "jszip";

const KARLA = /Karla/i;
const CORMORANT = /Cormorant Garamond/i;

type SurfaceKey =
  | "dialog"
  | "alertdialog"
  | "select"
  | "popover"
  | "tooltip"
  | "dropdown"
  | "sonner";

type Row = {
  surface: string;
  selector: string;
  bodyFont: string;
  headingFont: string;
  bodyOk: boolean;
  headingOk: boolean | null;
  radiusOk: boolean;
  screenshot: string | null;
};

type SurfaceDef = {
  key: SurfaceKey;
  surface: string;
  selector: string;
  headingSelector?: string;
  /** Render delay (ms) after opening — gives Radix portal + animation time to settle. */
  renderDelayMs: number;
};

const surfaces: SurfaceDef[] = [
  { key: "dialog",      surface: "Dialog",       selector: '[data-qa-surface="dialog"]',      headingSelector: '[data-qa-surface="dialog"] [data-qa-heading]',      renderDelayMs: 350 },
  { key: "alertdialog", surface: "AlertDialog",  selector: '[data-qa-surface="alertdialog"]', headingSelector: '[data-qa-surface="alertdialog"] [data-qa-heading]', renderDelayMs: 350 },
  { key: "select",      surface: "Select",       selector: '[data-qa-surface="select"]',                                                                              renderDelayMs: 300 },
  { key: "popover",     surface: "Popover",      selector: '[data-qa-surface="popover"]',     headingSelector: '[data-qa-surface="popover"] [data-qa-heading]',     renderDelayMs: 300 },
  { key: "tooltip",     surface: "Tooltip",      selector: '[data-qa-surface="tooltip"]',                                                                             renderDelayMs: 300 },
  { key: "dropdown",    surface: "DropdownMenu", selector: '[data-qa-surface="dropdown"]',                                                                            renderDelayMs: 300 },
  { key: "sonner",      surface: "Sonner Toast", selector: '[data-sonner-toast]',             headingSelector: '[data-sonner-toast] [data-title]',                  renderDelayMs: 450 },
];

type ScanRun = {
  id: string;
  timestamp: number;
  rows: Row[];
  summary: { total: number; bodyPass: number; headingPass: number; radiusPass: number };
};

const HISTORY_KEY = "pos-font-qa-history";
const MAX_HISTORY = 25;

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const nextFrame = () =>
  new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())));

const waitForElement = async (selector: string, timeoutMs = 1500): Promise<HTMLElement | null> => {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) return el;
    await sleep(50);
  }
  return null;
};

/**
 * Composite a caption banner onto a screenshot data URL highlighting which
 * checks failed (body font, heading font, radius). Returns a new data URL.
 */
const annotateScreenshot = (
  dataUrl: string,
  surface: string,
  failures: string[],
): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const pass = failures.length === 0;
      const bannerH = pass ? 56 : 56 + failures.length * 28;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight + bannerH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, bannerH);
      ctx.fillStyle = pass ? "#15803d" : "#b91c1c";
      ctx.fillRect(0, 0, canvas.width, bannerH);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Karla, system-ui, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(`${pass ? "✓ PASS" : "✗ FAIL"} — ${surface}`, 16, 12);
      if (!pass) {
        ctx.fillStyle = "#ffeb3b";
        ctx.font = "bold 20px Karla, system-ui, sans-serif";
        failures.forEach((f, i) => {
          ctx.fillText(`• ${f}`, 16, 48 + i * 28);
        });
      }
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const computeFailures = (r: {
  bodyOk: boolean;
  headingOk: boolean | null;
  radiusOk: boolean;
  bodyFont: string;
  headingFont: string;
}): string[] => {
  const f: string[] = [];
  if (!r.bodyOk) f.push(`body font (got ${(r.bodyFont.split(",")[0] || "—").trim()})`);
  if (r.headingOk === false) f.push(`heading font (got ${(r.headingFont.split(",")[0] || "—").trim()})`);
  if (!r.radiusOk) f.push("radius ≠ 0");
  return f;
};

const POSFontQA = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [history, setHistory] = useState<ScanRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<string>("");

  // Controlled open state per surface
  const [open, setOpen] = useState<Record<SurfaceKey, boolean>>({
    dialog: false, alertdialog: false, select: false,
    popover: false, tooltip: false, dropdown: false, sonner: false,
  });
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    document.body.classList.add("pos-brutalist-active");
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
    return () => {
      document.body.classList.remove("pos-brutalist-active");
    };
  }, []);

  const persistHistory = (next: ScanRun[]) => {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Could not persist scan history (likely quota).", e);
    }
  };

  const setSurfaceOpen = async (key: SurfaceKey, value: boolean) => {
    setOpen((p) => ({ ...p, [key]: value }));
    await nextFrame();
  };

  const captureSurface = async (def: SurfaceDef): Promise<Row> => {
    let el: HTMLElement | null = null;

    if (def.key === "sonner") {
      // Sonner is fired imperatively, not via controlled state.
      toast("Brutalist toast", {
        description: "Karla body • Cormorant heading expected",
      });
    } else {
      await setSurfaceOpen(def.key, true);
    }

    el = await waitForElement(def.selector, 2000);
    // Extra settle time for animation + font swap.
    await sleep(def.renderDelayMs);
    el = el ?? (document.querySelector(def.selector) as HTMLElement | null);

    if (!el) {
      if (def.key !== "sonner") await setSurfaceOpen(def.key, false);
      return {
        surface: def.surface,
        selector: def.selector,
        bodyFont: "— not mounted —",
        headingFont: "—",
        bodyOk: false,
        headingOk: def.headingSelector ? false : null,
        radiusOk: false,
        screenshot: null,
      };
    }

    const bodyFont = getComputedStyle(el).fontFamily;
    const radiusOk = parseFloat(getComputedStyle(el).borderTopLeftRadius) === 0;
    let headingFont = "—";
    let headingOk: boolean | null = null;
    if (def.headingSelector) {
      const h = document.querySelector(def.headingSelector) as HTMLElement | null;
      if (h) {
        headingFont = getComputedStyle(h).fontFamily;
        headingOk = CORMORANT.test(headingFont);
      } else {
        headingFont = "— heading not found —";
        headingOk = false;
      }
    }

    // Walk up to the portal/root wrapper so the screenshot includes overlay,
    // shadows, footer actions and any sibling layers — not just the inner content node.
    const findCaptureRoot = (node: HTMLElement): HTMLElement => {
      let cur: HTMLElement = node;
      while (
        cur.parentElement &&
        cur.parentElement !== document.body &&
        cur.parentElement !== document.documentElement
      ) {
        cur = cur.parentElement;
      }
      return cur;
    };
    const captureRoot = findCaptureRoot(el);
    const rect = captureRoot.getBoundingClientRect();

    let screenshot: string | null = null;
    try {
      screenshot = await toPng(captureRoot, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: Math.max(1, Math.ceil(rect.width)),
        height: Math.max(1, Math.ceil(rect.height)),
        style: { transform: "none", inset: "0", position: "static" },
      });
    } catch {
      screenshot = null;
    }

    // Deterministic close so the next surface starts from a clean slate.
    if (def.key !== "sonner") {
      await setSurfaceOpen(def.key, false);
      await sleep(200); // close animation
    } else {
      toast.dismiss();
      await sleep(200);
    }

    return {
      surface: def.surface,
      selector: def.selector,
      bodyFont,
      headingFont,
      bodyOk: KARLA.test(bodyFont),
      headingOk,
      radiusOk,
      screenshot,
    };
  };

  const scan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setProgress("Starting…");
    const results: Row[] = [];
    try {
      for (const def of surfaces) {
        setProgress(`Capturing ${def.surface}…`);
        // eslint-disable-next-line no-await-in-loop
        const row = await captureSurface(def);
        results.push(row);
        setRows([...results]);
      }

      const summary = {
        total: results.length,
        bodyPass: results.filter((r) => r.bodyOk).length,
        headingPass: results.filter((r) => r.headingOk === true).length,
        radiusPass: results.filter((r) => r.radiusOk).length,
      };
      const run: ScanRun = {
        id: `run-${Date.now()}`,
        timestamp: Date.now(),
        rows: results,
        summary,
      };
      const next = [run, ...history].slice(0, MAX_HISTORY);
      persistHistory(next);
      setSelectedRunId(run.id);
      setProgress(`Done · ${results.length} surfaces captured`);
    } catch (e) {
      console.error(e);
      setProgress("Scan failed — see console");
    } finally {
      setScanning(false);
    }
  }, [history, scanning]);

  const clearHistory = () => {
    persistHistory([]);
    setSelectedRunId(null);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-font-qa-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const statusLabel = (ok: boolean | null) =>
    ok === null ? "N/A" : ok ? "PASS" : "FAIL";

  const buildReportHtml = (run: ScanRun) => {
    const ts = new Date(run.timestamp).toLocaleString();
    const rowsHtml = run.rows
      .map((r, i) => {
        const img = r.screenshot
          ? `<img src="screenshots/${String(i + 1).padStart(2, "0")}-${slug(r.surface)}.png" alt="${r.surface}" style="max-width:320px;border:2px solid #000" />`
          : `<em>no screenshot</em>`;
        const cell = (ok: boolean | null) => {
          const label = statusLabel(ok);
          const color = ok === null ? "#666" : ok ? "#15803d" : "#b91c1c";
          return `<td style="padding:8px;border:1px solid #000;color:${color};font-weight:700">${label}</td>`;
        };
        return `<tr>
          <td style="padding:8px;border:1px solid #000;font-weight:700">${r.surface}</td>
          <td style="padding:8px;border:1px solid #000;font-family:monospace;font-size:11px">${r.bodyFont}</td>
          ${cell(r.bodyOk)}
          <td style="padding:8px;border:1px solid #000;font-family:monospace;font-size:11px">${r.headingFont}</td>
          ${cell(r.headingOk)}
          ${cell(r.radiusOk)}
          <td style="padding:8px;border:1px solid #000">${img}</td>
        </tr>`;
      })
      .join("");
    return `<!doctype html><html><head><meta charset="utf-8" />
<title>POS Font QA — ${ts}</title>
<style>body{font-family:Karla,system-ui,sans-serif;padding:24px;background:#fff;color:#000}
h1{font-family:'Cormorant Garamond',serif;font-size:32px;margin:0 0 8px}
table{border-collapse:collapse;width:100%;margin-top:16px}
th{padding:8px;border:1px solid #000;background:#ffeb3b;text-align:left;font-family:'Cormorant Garamond',serif}
.summary{margin-top:8px;font-family:monospace}</style></head>
<body>
<h1>POS Font QA Report</h1>
<div>Run: <strong>${ts}</strong></div>
<div class="summary">body ${run.summary.bodyPass}/${run.summary.total} · heading ${run.summary.headingPass}/${run.summary.total} · radius ${run.summary.radiusPass}/${run.summary.total}</div>
<table>
<thead><tr>
<th>Surface</th><th>Body font</th><th>Body</th><th>Heading font</th><th>Heading</th><th>Radius 0</th><th>Evidence</th>
</tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
</body></html>`;
  };

  const exportCurrentRunAsZip = async () => {
    const run =
      (selectedRunId && history.find((r) => r.id === selectedRunId)) ||
      history[0];
    if (!run) return;
    setProgress("Building ZIP…");
    const zip = new JSZip();
    const screenshotsDir = zip.folder("screenshots")!;

    run.rows.forEach((r, i) => {
      if (r.screenshot && r.screenshot.startsWith("data:image/")) {
        const base64 = r.screenshot.split(",")[1];
        const filename = `${String(i + 1).padStart(2, "0")}-${slug(r.surface)}.png`;
        screenshotsDir.file(filename, base64, { base64: true });
      }
    });

    const summaryRows = run.rows.map((r) => ({
      surface: r.surface,
      body: statusLabel(r.bodyOk),
      bodyFont: r.bodyFont,
      heading: statusLabel(r.headingOk),
      headingFont: r.headingFont,
      radiusZero: statusLabel(r.radiusOk),
      hasScreenshot: !!r.screenshot,
    }));

    zip.file("results.json", JSON.stringify({ ...run, rows: summaryRows }, null, 2));
    zip.file(
      "results.csv",
      [
        "surface,body,bodyFont,heading,headingFont,radiusZero,hasScreenshot",
        ...summaryRows.map((r) =>
          [r.surface, r.body, `"${r.bodyFont}"`, r.heading, `"${r.headingFont}"`, r.radiusZero, r.hasScreenshot].join(","),
        ),
      ].join("\n"),
    );
    zip.file("report.html", buildReportHtml(run));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-font-qa-${new Date(run.timestamp).toISOString().replace(/[:.]/g, "-")}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setProgress("ZIP downloaded");
  };

  const diffVsPrevious = (idx: number): string | null => {
    if (idx >= history.length - 1) return null;
    const cur = history[idx].summary;
    const prev = history[idx + 1].summary;
    const deltas: string[] = [];
    if (cur.bodyPass !== prev.bodyPass) deltas.push(`body ${cur.bodyPass - prev.bodyPass > 0 ? "+" : ""}${cur.bodyPass - prev.bodyPass}`);
    if (cur.headingPass !== prev.headingPass) deltas.push(`heading ${cur.headingPass - prev.headingPass > 0 ? "+" : ""}${cur.headingPass - prev.headingPass}`);
    if (cur.radiusPass !== prev.radiusPass) deltas.push(`radius ${cur.radiusPass - prev.radiusPass > 0 ? "+" : ""}${cur.radiusPass - prev.radiusPass}`);
    return deltas.length ? deltas.join(" · ") : "no change";
  };

  const Status = ({ ok }: { ok: boolean | null }) => {
    if (ok === null) return <span className="text-muted-foreground">N/A</span>;
    return ok ? <span className="text-green-600 font-bold">✓ PASS</span> : <span className="text-red-600 font-bold">✗ FAIL</span>;
  };

  return (
    <div className="pos-brutalist min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="border-2 border-foreground p-4 bg-accent">
          <h1 className="text-3xl">POS Font QA</h1>
          <p className="text-sm">
            Click <strong>Run Automated Scan</strong> — each surface is opened deterministically,
            given time to render, captured, then closed before the next.
          </p>
        </header>

        {/* Controls */}
        <section className="flex flex-wrap items-center gap-3">
          <Button onClick={scan} disabled={scanning} className="bg-primary text-primary-foreground">
            {scanning ? "Scanning…" : "Run Automated Scan"}
          </Button>
          {progress && <span className="text-sm font-mono">{progress}</span>}
        </section>

        {/* Surface mounts — controlled, no manual triggers needed */}
        <section className="sr-only" aria-hidden>
          <Dialog open={open.dialog} onOpenChange={(v) => setOpen((p) => ({ ...p, dialog: v }))}>
            <DialogContent data-qa-surface="dialog">
              <DialogHeader>
                <DialogTitle data-qa-heading>Dialog Title</DialogTitle>
                <DialogDescription>Body text inside a Radix Dialog.</DialogDescription>
              </DialogHeader>
              <p>This paragraph should render in Karla.</p>
            </DialogContent>
          </Dialog>

          <AlertDialog open={open.alertdialog} onOpenChange={(v) => setOpen((p) => ({ ...p, alertdialog: v }))}>
            <AlertDialogContent data-qa-surface="alertdialog">
              <AlertDialogHeader>
                <AlertDialogTitle data-qa-heading>Alert Title</AlertDialogTitle>
                <AlertDialogDescription>Confirm body copy in Karla.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Select open={open.select} onOpenChange={(v) => setOpen((p) => ({ ...p, select: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Open Select" />
            </SelectTrigger>
            <SelectContent data-qa-surface="select">
              <SelectItem value="a">Item A</SelectItem>
              <SelectItem value="b">Item B</SelectItem>
              <SelectItem value="c">Item C</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={open.popover} onOpenChange={(v) => setOpen((p) => ({ ...p, popover: v }))}>
            <PopoverTrigger asChild><Button>Popover anchor</Button></PopoverTrigger>
            <PopoverContent data-qa-surface="popover">
              <h3 data-qa-heading className="text-xl">Popover Heading</h3>
              <p>Popover body text in Karla.</p>
            </PopoverContent>
          </Popover>

          <Tooltip open={open.tooltip} onOpenChange={(v) => setOpen((p) => ({ ...p, tooltip: v }))}>
            <TooltipTrigger asChild><Button>Tooltip anchor</Button></TooltipTrigger>
            <TooltipContent data-qa-surface="tooltip">Tooltip text</TooltipContent>
          </Tooltip>

          <DropdownMenu open={open.dropdown} onOpenChange={(v) => setOpen((p) => ({ ...p, dropdown: v }))}>
            <DropdownMenuTrigger asChild><Button>Dropdown anchor</Button></DropdownMenuTrigger>
            <DropdownMenuContent data-qa-surface="dropdown">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>One</DropdownMenuItem>
              <DropdownMenuItem>Two</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        {/* Timeline */}
        <section className="border-2 border-foreground">
          <div className="flex items-center justify-between p-3 border-b-2 border-foreground bg-accent">
            <h2 className="text-2xl">Scan Timeline ({history.length})</h2>
            <div className="flex gap-2">
              <Button
                onClick={exportCurrentRunAsZip}
                disabled={history.length === 0}
                className="bg-primary text-primary-foreground"
              >
                Export ZIP (screenshots + report)
              </Button>
              <Button onClick={exportHistory} disabled={history.length === 0} variant="outline">
                Export JSON
              </Button>
              <Button onClick={clearHistory} disabled={history.length === 0} variant="destructive">
                Clear History
              </Button>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="p-4 text-muted-foreground">No runs yet. Scans are saved automatically.</p>
          ) : (
            <ol className="divide-y-2 divide-foreground">
              {history.map((run, idx) => {
                const delta = diffVsPrevious(idx);
                const isSelected = run.id === selectedRunId;
                const regressed =
                  idx < history.length - 1 &&
                  (run.summary.bodyPass < history[idx + 1].summary.bodyPass ||
                    run.summary.headingPass < history[idx + 1].summary.headingPass ||
                    run.summary.radiusPass < history[idx + 1].summary.radiusPass);
                return (
                  <li
                    key={run.id}
                    className={`p-3 cursor-pointer hover:bg-muted ${isSelected ? "bg-accent" : ""}`}
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold">
                          {new Date(run.timestamp).toLocaleString()}
                          {idx === 0 && <span className="ml-2 text-xs">(latest)</span>}
                        </div>
                        <div className="text-xs font-mono">
                          body {run.summary.bodyPass}/{run.summary.total} · heading{" "}
                          {run.summary.headingPass}/{run.summary.total} · radius{" "}
                          {run.summary.radiusPass}/{run.summary.total}
                        </div>
                      </div>
                      {delta && (
                        <span
                          className={`text-xs font-bold px-2 py-1 border-2 border-foreground ${
                            regressed ? "bg-red-200 text-red-900" : delta === "no change" ? "" : "bg-green-200 text-green-900"
                          }`}
                        >
                          Δ {delta}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Report */}
        <section className="border-2 border-foreground">
          <h2 className="text-2xl p-3 border-b-2 border-foreground bg-accent">
            Report {selectedRunId && history.find((r) => r.id === selectedRunId)
              ? `— ${new Date(history.find((r) => r.id === selectedRunId)!.timestamp).toLocaleString()}`
              : ""}
          </h2>
          {(() => {
            const displayRows =
              selectedRunId && history.find((r) => r.id === selectedRunId)
                ? history.find((r) => r.id === selectedRunId)!.rows
                : rows;
            if (displayRows.length === 0) {
              return (
                <p className="p-4 text-muted-foreground">
                  Click <strong>Run Automated Scan</strong> to capture every surface.
                </p>
              );
            }
            return (
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr className="border-b-2 border-foreground">
                    <th className="text-left p-2">Surface</th>
                    <th className="text-left p-2">Body font</th>
                    <th className="text-left p-2">Body</th>
                    <th className="text-left p-2">Heading font</th>
                    <th className="text-left p-2">Heading</th>
                    <th className="text-left p-2">Radius 0</th>
                    <th className="text-left p-2">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((r) => (
                    <tr key={r.surface} className="border-b border-foreground align-top">
                      <td className="p-2 font-bold">{r.surface}</td>
                      <td className="p-2 font-mono text-xs">{r.bodyFont}</td>
                      <td className="p-2"><Status ok={r.bodyOk} /></td>
                      <td className="p-2 font-mono text-xs">{r.headingFont}</td>
                      <td className="p-2"><Status ok={r.headingOk} /></td>
                      <td className="p-2"><Status ok={r.radiusOk} /></td>
                      <td className="p-2">
                        {r.screenshot ? (
                          <a href={r.screenshot} target="_blank" rel="noreferrer" title="Open full-size">
                            <img
                              src={r.screenshot}
                              alt={`${r.surface} screenshot`}
                              className="max-w-[180px] max-h-[120px] border-2 border-foreground"
                            />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">— none —</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </section>
      </div>
    </div>
  );
};

export default POSFontQA;

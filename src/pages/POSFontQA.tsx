import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
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

const KARLA = /Karla/i;
const CORMORANT = /Cormorant Garamond/i;

type Row = {
  surface: string;
  selector: string;
  bodyFont: string;
  headingFont: string;
  bodyOk: boolean;
  headingOk: boolean | null; // null = N/A
  radiusOk: boolean;
  screenshot: string | null;
};

const surfaces: Array<{
  surface: string;
  selector: string;
  headingSelector?: string; // optional — null means N/A
}> = [
  { surface: "Dialog", selector: '[data-qa-surface="dialog"]', headingSelector: '[data-qa-surface="dialog"] [data-qa-heading]' },
  { surface: "AlertDialog", selector: '[data-qa-surface="alertdialog"]', headingSelector: '[data-qa-surface="alertdialog"] [data-qa-heading]' },
  { surface: "Select", selector: '[data-qa-surface="select"]' },
  { surface: "Popover", selector: '[data-qa-surface="popover"]', headingSelector: '[data-qa-surface="popover"] [data-qa-heading]' },
  { surface: "Tooltip", selector: '[data-qa-surface="tooltip"]' },
  { surface: "DropdownMenu", selector: '[data-qa-surface="dropdown"]' },
  { surface: "Sonner Toast", selector: '[data-sonner-toast]', headingSelector: '[data-sonner-toast] [data-title]' },
];

const POSFontQA = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    document.body.classList.add("pos-brutalist-active");
    return () => {
      document.body.classList.remove("pos-brutalist-active");
    };
  }, []);

  const scan = useCallback(() => {
    const results: Row[] = surfaces.map(({ surface, selector, headingSelector }) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        return {
          surface, selector,
          bodyFont: "— not mounted —",
          headingFont: "—",
          bodyOk: false,
          headingOk: headingSelector ? false : null,
          radiusOk: false,
        };
      }
      const bodyFont = getComputedStyle(el).fontFamily;
      const radiusOk = parseFloat(getComputedStyle(el).borderTopLeftRadius) === 0;
      let headingFont = "—";
      let headingOk: boolean | null = null;
      if (headingSelector) {
        const h = document.querySelector(headingSelector) as HTMLElement | null;
        if (h) {
          headingFont = getComputedStyle(h).fontFamily;
          headingOk = CORMORANT.test(headingFont);
        } else {
          headingFont = "— heading not found —";
          headingOk = false;
        }
      }
      return {
        surface, selector,
        bodyFont,
        headingFont,
        bodyOk: KARLA.test(bodyFont),
        headingOk,
        radiusOk,
      };
    });
    setRows(results);
  }, []);

  const fireToast = () => {
    toast("Brutalist toast", {
      description: "Karla body • Cormorant heading expected",
    });
    setTimeout(scan, 250);
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
            Trigger each portaled surface, then click <strong>Scan</strong>. Surfaces must use{" "}
            <em>Karla</em> for body and <em>Cormorant Garamond</em> for headings.
          </p>
        </header>

        {/* Triggers */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent data-qa-surface="dialog">
              <DialogHeader>
                <DialogTitle data-qa-heading>Dialog Title</DialogTitle>
                <DialogDescription>Body text inside a Radix Dialog.</DialogDescription>
              </DialogHeader>
              <p>This paragraph should render in Karla.</p>
            </DialogContent>
          </Dialog>

          {/* AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Open AlertDialog</Button>
            </AlertDialogTrigger>
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

          {/* Select */}
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Open Select" />
            </SelectTrigger>
            <SelectContent data-qa-surface="select">
              <SelectItem value="a">Item A</SelectItem>
              <SelectItem value="b">Item B</SelectItem>
              <SelectItem value="c">Item C</SelectItem>
            </SelectContent>
          </Select>

          {/* Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button>Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent data-qa-surface="popover">
              <h3 data-qa-heading className="text-xl">Popover Heading</h3>
              <p>Popover body text in Karla.</p>
            </PopoverContent>
          </Popover>

          {/* Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Hover for Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent data-qa-surface="tooltip">Tooltip text</TooltipContent>
          </Tooltip>

          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Open Dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-qa-surface="dropdown">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>One</DropdownMenuItem>
              <DropdownMenuItem>Two</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sonner */}
          <Button onClick={fireToast}>Fire Sonner Toast</Button>

          {/* Scan */}
          <Button onClick={scan} className="bg-primary text-primary-foreground">
            Scan Open Surfaces
          </Button>
        </section>

        {/* Report */}
        <section className="border-2 border-foreground">
          <h2 className="text-2xl p-3 border-b-2 border-foreground bg-accent">Report</h2>
          {rows.length === 0 ? (
            <p className="p-4 text-muted-foreground">
              Open one or more surfaces, then click <strong>Scan Open Surfaces</strong>.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b-2 border-foreground">
                  <th className="text-left p-2">Surface</th>
                  <th className="text-left p-2">Body font</th>
                  <th className="text-left p-2">Body</th>
                  <th className="text-left p-2">Heading font</th>
                  <th className="text-left p-2">Heading</th>
                  <th className="text-left p-2">Radius 0</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.surface} className="border-b border-foreground">
                    <td className="p-2 font-bold">{r.surface}</td>
                    <td className="p-2 font-mono text-xs">{r.bodyFont}</td>
                    <td className="p-2"><Status ok={r.bodyOk} /></td>
                    <td className="p-2 font-mono text-xs">{r.headingFont}</td>
                    <td className="p-2"><Status ok={r.headingOk} /></td>
                    <td className="p-2"><Status ok={r.radiusOk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default POSFontQA;

# POS Typography QA Checklist

Verifies every portaled Radix surface and toast on the `/pos` route uses:
- **Body**: `Karla, system-ui, sans-serif`
- **Headings / display**: `Cormorant Garamond, Georgia, serif` (weight 600, letter-spacing -0.01em)

Typography is enforced globally via `body.pos-brutalist-active` rules in `src/index.css`.
The `pos-brutalist-active` class is toggled in `src/pages/POS.tsx` on mount/unmount.

---

## How to verify (per surface)

For each row below:
1. Open `/pos`.
2. Trigger the surface (see "Trigger").
3. Open DevTools → inspect the rendered element → **Computed → font-family**.
4. Confirm:
   - Body text → `Karla`
   - Headings / `[data-radix-*-title]` / `.text-xl|2xl|3xl` → `Cormorant Garamond`
   - `border-radius: 0` on the surface container

---

## Checklist

| # | Surface | Radix selector | Trigger on /pos | Body = Karla | Headings = Cormorant | Hard edges (radius 0) |
|---|---------|----------------|------------------|--------------|----------------------|-----------------------|
| 1 | **Dialog** | `[role="dialog"]`, `[data-radix-dialog-title]` | Open Pay dialog (F9) | ☐ | ☐ | ☐ |
| 2 | **Dialog** (Hold list) | `[role="dialog"]` | Press F3 (Recall held cart) | ☐ | ☐ | ☐ |
| 3 | **AlertDialog** | `[role="alertdialog"]`, `[data-radix-alert-dialog-title]` | Trigger Clear Cart confirm (Esc) | ☐ | ☐ | ☐ |
| 4 | **Select** | `[role="listbox"]`, `[data-radix-popper-content-wrapper]` | Open any Select (e.g. payment method) | ☐ | ☐ (n/a — list items only) | ☐ |
| 5 | **Popover** | `[data-radix-popper-content-wrapper]` | Open any Popover (date picker etc.) | ☐ | ☐ | ☐ |
| 6 | **Tooltip** | `[role="tooltip"]` | Hover any icon button | ☐ | ☐ (n/a) | ☐ |
| 7 | **DropdownMenu** | `[role="menu"]`, `[data-radix-popper-content-wrapper]` | Open user / overflow menu | ☐ | ☐ (n/a) | ☐ |
| 8 | **Sonner Toast** | `[data-sonner-toaster]`, `[data-sonner-toast]` | Add to cart / save action | ☐ | ☐ | ☐ |

---

## CSS rules backing this checklist (src/index.css)

- `body.pos-brutalist-active [role="dialog"|"alertdialog"|"menu"|"listbox"|"tooltip"], [data-radix-popper-content-wrapper], [data-sonner-toaster], [data-sonner-toast]` (+ `*` descendants) → `font-family: 'Karla'`
- Same scope, headings `h1–h6` + `[data-radix-dialog-title]` + `[data-radix-alert-dialog-title]` + `.text-xl/2xl/3xl` → `font-family: 'Cormorant Garamond' !important`
- Same scope, surface containers → `border-radius: 0 !important`

## Regression guard

If any row fails:
1. Confirm `<body>` has `pos-brutalist-active` while on `/pos` (see `src/pages/POS.tsx` `useEffect`).
2. Confirm the failing selector is covered in the `body.pos-brutalist-active …` blocks in `src/index.css`. Add it if missing.
3. Confirm Google Fonts (`Cormorant Garamond`, `Karla`) load — check `index.html` `<link>` tags and Network tab.

# Validation metric figures

These PNGs power the **Technical documentation** page (`/docs/metrics/...`).

## Bundled placeholders

The repo ships **placeholder** images so the UI never 404s. Replace them with your real Ultralytics exports from the same run as `model/best.pt` (e.g. `runs/segment/train*/` or your `run_ultimate` artifacts):

| File | Typical source |
|------|----------------|
| `box-pr-curve.png` | Validation precision–recall curve |
| `box-p-curve.png` | Box precision vs confidence |
| `box-r-curve.png` | Box recall vs confidence |
| `box-f1-curve.png` | Box F1 vs confidence |
| `confusion-matrix.png` | Confusion matrix |
| `confusion-matrix-normalized.png` | Normalized confusion matrix |

Keep the **same filenames** so `TechnicalDocs.tsx` does not need edits.

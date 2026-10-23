# Preview capability matrix

| Area | Implemented | Remaining |
|---|---|---|
| Reference interface | Header/breadcrumbs/autosave, labelled toolbar, blue/teal stand, view cube/grid/axes, shape library, properties, floating sketch entry, responsive Tools sheet | Raster mockup is a target, not a pixel-identical CAD renderer |
| Shape workflow | 12 solid primitives, click/drag placement with grid preview, multiselect, box-select, transform handles, dimensions, lock/hide, duplicate, mirror, undo/redo | Dedicated elevation/ruler handle, arrays, nonuniform group scaling |
| Geometry | OpenCascade union/cut, logical groups, editable boolean inputs, bounding-box align/distribute, fillet | General shell/chamfer/revolve tools |
| Sketching | XY/XZ/YZ, selected top elevation, rectangle/circle/closed polyline, fixed dimensions, rectangle horizontal/vertical construction, circle diameter, last-segment trim, 1 mm grid, simple profile offset, editable extrusion/cut | General constraint solver/contradiction diagnostics, arbitrary planar face binding, arcs/tangent/concentric constraints, projected geometry and persistent construction guides |
| Projects | Private dashboard, new/open/copy/rename/trash/restore, three starters, server autosave, browser recovery, conflict detection, bounded revisions | Public sharing, thumbnails, general `.cadjson` migration, cross-project links |
| Interchange | Native JSON, STEP, single-mesh STL/OBJ imports; exact CAD STL/STEP plus packaged 3MF exports | BREP, FreeCAD, SVG/DXF/3MF imports, sketch SVG/DXF exports, mesh-to-parametric conversion |
| Printing | Correct A1/A1 mini volumes, bounding size/build-volume/below-plate warnings, explicit slicer download handoff | Automated wall/overhang/component/manifold inspector; printer transmission and slicing |
| Ecosystem | MyAccounts, same-subject My Drive copy/open, suite registry/updater/health/icons, portable native server | Independent service installer, serverless offline reload |

Unavailable operations are disabled with tooltips or described in Help. Parametric dimensions are not advertised as a general solver. Files from external applications preserve only their actual geometry/editability. No physical printer, clean-host or reboot certification is claimed.

Automated acceptance uses an isolated NTFS account store, a real Windows executable and headless Edge. It checks all primitive solids, analytical cut volume (within 0.005 mm³), an exported STL's closed edges and through-hole rays, STEP/3MF contents, dimension regeneration, UI hole subtraction, undo/redo, reload persistence, numeric align, logical grouping, sketch extrusion and A1 mini warnings. Desktop 1672 × 941, tablet 768 × 1024 and phone 390 × 844 screenshots are visually reviewed. A 3MF is validated as an OPC package; an actual slicer roundtrip must be separately recorded before claiming it.

Run `npm ci && npm run build` under `web`, `go test ./...` with `MY3D_TEST_ROOT` and `GOTMPDIR` set to an isolated NTFS folder, and `node scripts/acceptance.mjs` under `web` with `MY3D_QA_EXE` pointing to the built executable. The native acceptance port is 39118; do not use production account stores. Publication receipts identify exactly which checks ran against the final binary.

The loading regression check is `node scripts/loading-acceptance.mjs`, with
`MY3D_QA_EXE`, `MY3D_QA_OUTPUT` and an isolated `MY3D_QA_DATA` directory set.
It runs a native fixture on port 39119 and holds the real CAD worker request:
desktop and phone show a spinner and loading message before geometry arrives,
with selection controls hidden. It also checks the updating indicator over an
existing model, blank projects, cancellation and a subsequent successful load.
Screenshots verify that feedback stays inside the visible phone workplane.

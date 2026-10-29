# Mobile canvas-first layout — 2026-10-29

User reports congested phone UI and authorizes push, release and installation.
Base main d2229af (preview2 source), installed primary Workspace100/My3D preview1.
Do not use live owner identity/projects as fixtures; retain manager and all other apps.

Phone layout now defaults to a full canvas below a six-button transform/undo row.
Bottom Add/Edit/Actions/Projects dock opens one bounded panel in normal layout,
resizing the actual canvas. Add closes after insertion. Edit prioritizes exact
properties; selection and secondary operations live in Actions. Camera tools are
collapsed behind View controls. Floating selection palette, sketch teaser, axis,
desktop mouse hint and multi-select chip are hidden on phones. Desktop retained.
Panel dismissal supports Close, Escape, same dock trigger and focus return.

Visual review enlarged the open sheet and moved selection actions out of Edit so
shape browsing and numeric inputs remain usable. Synthetic native tests cover
360x640, 390x700, 650x844, landscape844x390 and desktop1440x900: panel transitions,
CAD insertion/edit, separate panel/canvas bounds, camera disclosure, no errors or
horizontal overflow. Three existing model unit checks pass. Tests use fresh NTFS
stores and stop their own native/browser processes. Geometry engine unchanged.

Release target preview3, using app-only workspace-update.json. Normal protected
update must verify selected executable hash, retain owner config/credentials and
all other app contracts/package bytes, then check deployed frontend bytes.
No second-PC installation or reboot/mobile hardware test is implied.

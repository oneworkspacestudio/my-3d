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

## Publication and primary deployment

Immutable preview3 source e6d997801f5a5a381dd39b00febc09ac3096a0ce, executable
SHA256 40eb60332af884670ba1055dce77b1ac8f4a810222491737521286c4162138a3.
All ten release assets match local sizes/SHA256; anonymous checksum download and
public update-channel preview3 entry verified. Release:
https://github.com/oneworkspacestudio/my-3d/releases/tag/v0.1.0-preview.3

A concurrent Workspace101 deployment/cleanup held the update lock. We waited,
then used the normal app-only ApplyUpdates path with the 101-compatible updater
(update/distribution code unchanged from100). My3D preview1-to3 recovery backup
verified 56MB, reusing38.3MB and copying17.8MB. Primary now serves preview3 and
its exact tested JS/CSS/worker/WASM/index bytes. Manager and other apps excluded
from selection. Final helper receipt follows recovery cleanup; do not interrupt
that normal cleanup. Tools/receipts: I:/Projects/tooling/my-3d-mobile-20261029.

Screenshot target workspace-2 has not been updated: CUA inventory still reports
local browser use disabled in Work settings. No alternative route was used to
bypass that setting. Native phone hardware/reboot acceptance is not claimed.

Completion supersedes the pending-cleanup note: the normal update returned
success, all apps healthy, latest verified recovery retained. Receipt confirms
Workspace101 and all other app contracts/packages, owner settings, identity and
credentials retained; exact tested preview3 installed. See
`docs/evidence/mobile-installation.json` and the synthetic mobile previews.

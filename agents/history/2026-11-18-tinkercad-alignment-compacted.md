# Tinkercad alignment parity

User requests all Tinkercad alignment features. Standing task instructions
authorize commit, release and channel promotion. This request has no new
installation instruction. Baseline main 6cbc3b4, existing public preview.4.

Implementation adds nine projected alignment dots, hover/focus previews,
selection-bounds or fixed-shape reference, canvas reference picking,
already-aligned disabled controls and touch panel controls. Alignment uses
fresh CAD bounds in the current workplane frame, includes visible holes and
groups, retains locked/reference shapes, and skips no-op undo entries.
Imported triangle geometry now applies stored position/rotation on render so
alignment actually moves it. The existing distribution operation preserves
the endpoint centres. New controls use AUI plus the existing UI adapter.

Relevant evidence starts with Autodesk's 3D glossary and shortcut sheet.
Reference selection is included in the implemented compatibility behavior.
Automated native acceptance uses synthetic NTFS roots only, under
C:/Projects/.cache/my-3d-alignment. Artifacts stay on
I:/Projects/tooling/my-3d-alignment-20261118. No owner projects as fixtures.
Release, exact binary acceptance and channel outcome are recorded below when
completed. Physical touch hardware and a live Tinkercad side-by-side session
are outside the current verification.

## Verification before publication

The exact preview.5 native binary passes eight isolated alignment acceptance
checks. These cover all nine coordinates, preview without source mutation,
canvas-picked locked reference, undo/redo, groups, triangle data, tilted
workplanes, exact imported STEP bounds, delayed geometry rebuild and emulated
phone controls. Desktop and phone screenshots were visually reviewed.
Seven frontend/model tests pass. Go tests and vet pass after creating their
required synthetic test root. No owner data was opened as a fixture.

Preview.5 keeps the existing app route, storage, identity and project schema.

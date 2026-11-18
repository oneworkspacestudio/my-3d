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

## Published and promoted

Preview.5 is public from b434f2c514c7dcad21acce16430746b1b4852a13.
All ten immutable asset sizes and GitHub digests match local release files,
and an anonymous executable download matches the exact tested binary.
Executable SHA256 e6ad193fd1c4f356a598e4f92620fdb07609d5be110a86e0922517b5c9751629.
Release https://github.com/oneworkspacestudio/my-3d/releases/tag/v0.1.0-preview.5.

Workspace channel842f793 promotes preview.5 and the verified legacy component
pin using the supported publisher filter/encoder. Anonymous native updater
checks passed against public Workspace141, public122 and a synthetic older
four-package My 3D layout. Each selected only My 3D and staged/verified the
public package hashes. Existing desktop/touch controls and all five viewport
layout checks also passed against the exact preview.5 executable.

Artifacts and sanitized delivery.json remain under
I:/Projects/tooling/my-3d-alignment-20261118. The two disposable NTFS roots
were removed after verifying their services had stopped. GitHub Actions
remain disabled. This change is available in the public updater; installation
is pending a request for this change.

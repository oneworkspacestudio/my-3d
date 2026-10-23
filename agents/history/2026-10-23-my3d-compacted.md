# My 3D initial delivery

User authorizes implementation from supplied brief/image, responsive layout,
commit/push/releases and local install. This is a new repository, not a fork:
official HumanHub/TweakCAD source404 prevents upstream solver/format verification.
Replicad1.1/OpenCascade WASM supplies real B-Rep geometry; AUI/React/Three display it.
Detailed capability gaps and pinned source/licences: docs/ENGINE.md, ACCEPTANCE.md.
Do not claim general constraints/arcs, all interchange formats or printer control.

Suite module dependency pinned to e3d5cf88ed3d (public codex/my-3d branch), including
my3d-specific worker CSP and suite lifecycle. No absolute go.mod replace. UI build
embeds frontend+WASM+legal Abel font into native Go executable. System Segoe is not
redistributed. Editable JSON source, private content-addressed blobs, SQLite only
metadata, last31 revisions, per-account quotas and conflict protection implemented.

All app Go/API/vet, frontend typecheck/build and suite tests/vet passed. Native
browser checks all12 solids, exact cut volume, closed through-hole STL via rays,
STEP/3MF package geometry, dimension regeneration, UI persistence/cut/undo/align/
group/sketch/180mm guard. Phone overflow passed; visual review found canvas hidden
by sheet and led to actual canvas-height correction. Final binary QA follows.

Artifacts and upstream corresponding-source archives:
I:/Projects/tooling/my-3d-20261023. Synthetic private stores only under
C:/Projects/.cache/my-3d-20261023. Owner is C:/tmp/workspace, catalog67, not the
I:/Workspace location from older suite histories. Never use owner as a fixture.
Current suite source task isolated at tooling/my-3d-20261023/workspace-source;
another chat changes navigation in original checkout, so do not overwrite/stage
its files. On exFAT use per-command safe.directory and core.autocrlf=true when
disabling global Git config; otherwise CRLF files falsely appear modified.

Next: exact final binary native/phone QA, immutable preview1 app publication and
suite72-or-next available version retaining public71 app contracts/bytes, isolated
OIDC/Drive/proxy validation, backed-up owner update selecting only Workspace/My3D,
deployed byte/health checks and fixture cleanup. No clean-host/reboot/physical-
printer/signed-artifact/GitHub Actions claim.

## Publication and integration verified

Public preview1 source d9263861783306232fbd17d8d0908cf8bf2d12f4; all9 assets
match local SHA256/size and a real public binary download. Workspace72 source
3b13a29/public with all147 bundled payloads verified and prior25 app contracts/bytes
retained. Exact native9 checks and real managed6 checks pass, including same-user
Drive roundtrip in a second browser and exported3MF rendered in My Slicer.
Actual phone/tablet visual review and touch input pass.

Owner deployment follows an independently running recovery; it restored owner67,
then our normal Workspace+My3D update acquired the lock and is creating/verifying
its backup. Do not claim installed until tooling owner-installation.json and
health/static-byte checks pass. Owner data was never an identity/Drive fixture.
Suite main combines My3D and independently committed remote-admin work, while
release72 stays at tested3b13a29. Published tags/assets are immutable.

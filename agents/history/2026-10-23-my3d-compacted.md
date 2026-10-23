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

## Delivery complete (supersedes pending deployment notes)

Normal protected owner67-to72 update completed. All25 previous application
contracts and primary package bytes, identity, paths, ports, preferences, existing
OIDC clients and recovery credentials retained. My3D preview1 added;26 app contracts
and25 local/public services all running. Both manager copies and My3D executable
match release digests. Served native frontend, CAD worker and app logo bytes match
the tested assets; public content-addressed suite icon matches its SVG source.
Latest normal recovery backup manifest hash verified. Ordinary files were covered
by the normal verified backup. No owner identity/Drive functional test was used.

Open https://workspace.m8e.co.uk/my3d/. Source/publication/integration/deployment
evidence is docs/evidence/my3d-20261023.json in the suite. Tool receipts include
owner-installation.json and deployment-verification.json. Installer72 remains
357be412e91f5684cc1d2bcae5930aa1dbe646a2b941b84e6fe5ca5d654b3602.
Downloads contains the verified My3D ZIP and full Workspace72 installer after
backup completion. All synthetic services, fixture helpers and observers stopped.

The normal updater removed one obsolete automatic backup after verification and
kept the newest usable recovery. It retained some unfamiliar older files needing
cleanup review; do not delete those or recovery-only data as test artifacts.
Mail's existing external incoming-connectivity warning remains outside CAD scope;
all process health checks pass. No physical printing, clean-host, reboot or signed
artifact claim. General sketch constraints/arcs and several formats remain
unavailable as explicitly documented; this is a functional preview, not full
master-brief completion. Published tags/assets remain immutable.

## Loading feedback follow-up

User reported selection actions floating over a blank workplane during CAD boot.
Geometry has its own initially-busy lifecycle, separate from import/export status.
Viewport shows a centred spinner/loading card until geometry arrives and a compact
updating badge over existing geometry. Context actions require a rendered selected
object and no active operation. Canvas resize exposes its visible height so the
phone card stays above the Tools sheet. Cancellation invalidates even a pending
debounced rebuild. Icons now forward className for spinner styling; reduced-motion
preference keeps the textual status without rotation.

Native isolated Edge loading acceptance passes delayed real worker loading at
1672x941 and 390x844, selected-control gating, compact updating feedback, blank
projects, cancel/restart, no page errors or horizontal overflow. Loading screenshots
visually reviewed; npm unit tests pass. Preparing immutable preview2 and app-only
managed update metadata. Owner has independently advanced to Workspace73; retain
that manager and every other app. Its idle maintenance window currently reports
an unauthenticated GitHub release-check403; do not overwrite that active runtime
or use owner identity/Drive as a fixture. Resume with packaging/publication and a
normal verified backup/update for My3D only, then deployed static-byte verification.

Preview2 is now public at immutable source04a761f; all10 release asset digests and
sizes verified, plus a real public executable download. Exe SHA256:
4e0d02b2dc3b81d4622ed6eeb2d68f6f7c434d2544e8b2c7f0818a8f942f00e9.
workspace-update.json validates all11 app-owned package members for independent
managed updates. Exact released executable passes the loading acceptance above.
Evidence: docs/evidence/loading-preview2.json. A separate concurrent Workspace73
transaction completed during this fix; we waited without interrupting it.

Installation is pending: normal backup/rollback space guard needs about9.35GB
free on C:, currently about6GB. Requested that user free at least3.5GB or supply
another local NTFS backup folder. Do not bypass the guard or remove owner/recovery
backups. Our synthetic loading stores are tiny; other chats own their own caches.
Artifacts/scripts: I:/Projects/tooling/my-3d-loading-20261023. install.py checks
space and complete journal before invoking ApplyLoadingFix.exe built from exact
public73 source. It uses authenticated normal CheckUpdates/ApplyUpdates, verifies
the tested preview2 digest and My3D-only selection, and removes GitHub credential
environment variables before preflight launches any runtime process. No credential
is recorded in receipts. If user supplies another backup folder, adapt helper's
UpdateRequest.BackupRoot and space check first. Once installed, verify all service
health, served frontend hashes and installation.json invariants; update evidence.

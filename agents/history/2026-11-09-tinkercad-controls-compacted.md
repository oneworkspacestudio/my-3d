# Tinkercad controls for My 3D

The requested change covers desktop mouse and keyboard controls and touch gestures.
The [Autodesk shortcut reference](https://images.tinkercad.com/jl5ii4oqrdmc/6TNFVIF89KMN9CPLLH97U0/a847b794b1b579f1529d87863783df8d/Tinkercad_keyboard_shortcuts_2_up.pdf)
defines the desktop mappings. The working tree began clean on main at 4287d1f.

- The viewport separates camera navigation, shape dragging, selection boxes and
  transform handles. A second finger cancels a pending touch edit before
  handing the gesture to pan and pinch. Mobile canvas selection has a visible
  multi-select toggle.
- The editor wires the documented shortcuts to its camera, transforms, shape
  properties, clipboard and undo history. Bundle, union and exact OpenCascade
  intersection use the existing editable group representation. Intersection
  validates the solid before saving the project edit. Design notes are optional
  version 1 project data, validated on both the client and server.
- Workplanes, a ruler origin and the shape plane are session tools. Cruise uses
  click-to-place. Rotation and scaling use the existing My 3D toolbar modes and
  handles. The clipboard is local to the open editor.
- The production frontend build, three model unit tests, Go tests and Go vet
  passed. The isolated native Edge acceptance in
  `web/scripts/controls-acceptance.mjs` passed desktop orbit, pan, zoom, marquee,
  movement, repeat duplication, grouping, intersection, workplane, note and
  ruler checks, and emulated phone tap, multi-select, orbit, drag, pan/pinch and
  cancellation. Physical touch hardware and live Tinkercad were outside this QA.
- The source change is local. Public release, managed upgrade and owner
  installation verification remain pending. The preview binary is under
  `I:/Projects/tooling/my-3d-controls-20261109`. Use the established protected
  app-only managed update path for future authorized delivery.

The final native binary also passed the existing mobile layout acceptance at
five viewport sizes. CSS sizes the canvas with the mobile sheet immediately
while ResizeObserver updates the WebGL drawing buffer. Synthetic services were
stopped and the verified disposable NTFS fixture root was removed.

## Release and primary installation

Preview.4 source 214d29997f52f0514fc83fbbdcf09649bf44ce86 was pushed to main.
The exact native binary passed desktop and emulated touch controls, all five
viewport layout checks and the frontend model tests. The ten published asset
sizes and digests were verified, including an anonymous executable download.
Executable SHA256 4b4a963472ba7f62fe3d630140bcbc5912f3a010dfd74716ff17995b673301f8.
The release is at
https://github.com/oneworkspacestudio/my-3d/releases/tag/v0.1.0-preview.4.

Workspace channel commit cb9aacf promotes the verified app manifest and legacy
component pin. The ordinary unauthenticated updater selected only My 3D from
the public index and verified the managed packages. GitHub Actions are disabled.

The primary PC upgraded My 3D from preview.3 to preview.4 through the protected
app-only update on Workspace preview.122. The completion receipt confirms
unchanged owner configuration, identity, credentials and all unrelated app
contracts/packages. Local health, executable digest and all eight served
frontend assets match the release. The normal updater verified a 56.4 MB
recovery copy and retained it. It retired one older automatic copy and kept
other files requiring cleanup attention.

Sanitized receipts are under I:/Projects/tooling/my-3d-controls-20261109.
Both disposable NTFS fixture roots were removed after their services stopped.

My Cinema returned HTTP 503 during restart and still timed out after the
supported Workspace startup retry. Its installed package and configuration
were retained. My 3D passed its health check, and the update completed.
Mail retained its incoming Internet connection notice.

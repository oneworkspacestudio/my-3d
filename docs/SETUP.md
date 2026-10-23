# Getting started

Choose My 3D in One Workspace setup or add it through Updates. Open it from your Workspace apps and sign in with MyAccounts. Projects are private to the authenticated issuer and subject. Browser recovery copies are partitioned by account.

For standalone use, extract the release ZIP. Run:

```powershell
.\My3D.exe --data C:\MyWorkspace\Data\My3D
```

Use the one-time owner setup link printed by the application. The default listener is `127.0.0.1:9018`. `--listen`, `--origin`, `--no-browser`, `--version`, `--help`, encrypted `--backup` and `--restore` are available. Public access is through Workspace's HTTPS gateway. The app deliberately refuses an unrestricted listener. Standalone local users and managed MyAccounts sessions use the established Workspace apphost.

Click a shape or drag it onto the grid. Select an object to edit Size, Position or Rotation in millimetres. Shift-click, Shift-drag, Ctrl+A or Multi-select selects several objects. Move/Rotate/Scale display handles. Arrow keys move 1 mm; Shift moves 10 mm. Use H for Hole, Ctrl+G for Group, Ctrl+D for Duplicate, Ctrl+Z/Ctrl+Y for Undo/Redo.

Group opens logical grouping or exact union; if a selected item is a hole it cuts the selected solids. Original sources remain in Advanced and undo history. Align uses CAD bounding boxes. Hidden objects can be restored in Advanced. Dimensioned rectangle/circle/polyline sketches extrude on XY/XZ/YZ; change dimensions or extrusion depth to regenerate.

The phone layout uses a Tools bottom sheet, single-tap shapes and numeric controls. One finger orbits; two fingers pan/zoom. Precise pointer handles are easier on desktop. Hide Tools to expand the canvas.

Print exports use millimetres. A1 mini is 180 × 180 × 180 mm; A1 is 256 × 256 × 256 mm. Download STL/3MF, then open it in Bambu Studio or My Slicer. No printer command is sent. Review walls, supports, scale and mesh integrity in the slicer.

Autosave writes an editable content-addressed project blob, SQLite metadata and the last 31 revision references. No duplicate project bodies are stored in SQLite. Per-account limits are 500 projects, 16 MiB per submitted project, 2 GiB of retained revision bytes, 200 visible/source roots and 400 nested source objects. Obsolete unreferenced blobs are pruned after saves. Trash is recoverable and counts toward quotas.

Local recovery retains edits when the server is unreachable. Reconnect to retry saving; a newer server revision causes an explicit conflict, with a recovery download/new-project choice. Offline refresh without the server is not supported. Export native `.my3d.json` for independent backups; use Workspace backups for the whole application. My Drive integration writes a new, timestamped file in your permitted source root and imports `.my3d.json` copies from that root. Drive must already be connected to the same MyAccounts subject. No admin token or public-sharing mechanism is used.

For a Windows background lifecycle, use One Workspace's existing startup/service controller. There is no independent My3D Windows service installer. Removing the application from Workspace retains its private projects, consistent with the suite lifecycle.

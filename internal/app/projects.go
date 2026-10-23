package app

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/oneworkspacestudio/one-workspace/pkg/apphost"
	"io"
	"math"
	"net/http"
	"os"
	"regexp"
	"sync"
	"time"
)

type App struct {
	H  *apphost.Host
	mu sync.Mutex
}
type Project struct {
	ID       string          `json:"id"`
	Name     string          `json:"name"`
	Revision int             `json:"revision"`
	Updated  string          `json:"updated"`
	Trash    bool            `json:"trash"`
	Scene    json.RawMessage `json:"scene,omitempty"`
}

var safeID = regexp.MustCompile(`^[a-zA-Z0-9-]{1,64}$`)
var color = regexp.MustCompile(`^#[a-fA-F0-9]{6}$`)

func New(h *apphost.Host) (*App, error) {
	a := &App{H: h}
	if e := h.Migrate(1, `CREATE TABLE projects(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,revision INTEGER NOT NULL,updated TEXT NOT NULL,trash INTEGER NOT NULL DEFAULT 0,blob TEXT NOT NULL);CREATE INDEX project_owner ON projects(owner);CREATE TABLE revisions(project TEXT NOT NULL REFERENCES projects(id),revision INTEGER NOT NULL,blob TEXT NOT NULL,size INTEGER NOT NULL,PRIMARY KEY(project,revision));`); e != nil {
		return nil, e
	}
	h.Mux.HandleFunc("GET /api/projects", h.Require(a.list))
	h.Mux.HandleFunc("GET /api/projects/{id}", h.Require(a.get))
	h.Mux.HandleFunc("POST /api/projects", h.Require(a.save))
	return a, nil
}
func (a *App) Run(ctx context.Context) error { <-ctx.Done(); return nil }
func (a *App) list(w http.ResponseWriter, r *http.Request) {
	rows, e := a.H.DB.Query("SELECT id,name,revision,updated,trash FROM projects WHERE owner=? ORDER BY updated DESC LIMIT 500", apphost.Current(r).User.ID)
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	defer rows.Close()
	out := []Project{}
	for rows.Next() {
		var p Project
		if e = rows.Scan(&p.ID, &p.Name, &p.Revision, &p.Updated, &p.Trash); e != nil {
			a.H.DBError(w, e)
			return
		}
		out = append(out, p)
	}
	if e = rows.Err(); e != nil {
		a.H.DBError(w, e)
		return
	}
	apphost.JSON(w, 200, out)
}
func (a *App) get(w http.ResponseWriter, r *http.Request) {
	var p Project
	var blob string
	e := a.H.DB.QueryRow("SELECT id,name,revision,updated,trash,blob FROM projects WHERE id=? AND owner=?", r.PathValue("id"), apphost.Current(r).User.ID).Scan(&p.ID, &p.Name, &p.Revision, &p.Updated, &p.Trash, &blob)
	if e != nil {
		apphost.Problem(w, 404, "Project not found")
		return
	}
	path, e := a.H.BlobPath(blob)
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	f, e := os.Open(path)
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	defer f.Close()
	p.Scene, e = io.ReadAll(io.LimitReader(f, 16<<20))
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	apphost.JSON(w, 200, p)
}

type sourceObject struct {
	ID, Kind, Color string
	Size, Pos, Rot  []float64
	Children        []json.RawMessage
	Points          [][]float64
	Text            string
}

func validateScene(raw []byte) error {
	var s struct {
		Schema  int
		Units   string
		Objects []json.RawMessage
	}
	if json.Unmarshal(raw, &s) != nil || s.Schema != 1 || s.Units != "mm" || len(s.Objects) > 200 {
		return errors.New("Invalid My 3D version 1 project")
	}
	count := 0
	var visit func(json.RawMessage, int) error
	visit = func(raw json.RawMessage, depth int) error {
		count++
		if count > 400 || depth > 20 {
			return errors.New("Project complexity limit exceeded")
		}
		var o sourceObject
		if json.Unmarshal(raw, &o) != nil || !safeID.MatchString(o.ID) || !color.MatchString(o.Color) || len(o.Text) > 240 || len(o.Points) > 500 {
			return errors.New("Invalid geometric object")
		}
		kinds := map[string]bool{"box": true, "rounded": true, "cylinder": true, "sphere": true, "cone": true, "tube": true, "polygon": true, "star": true, "heart": true, "wedge": true, "frame": true, "text": true, "sketch": true, "boolean": true, "group": true, "mesh": true, "import": true}
		if !kinds[o.Kind] {
			return errors.New("Unsupported geometric object")
		}
		for i, a := range [][]float64{o.Size, o.Pos, o.Rot} {
			if len(a) != 3 {
				return errors.New("Invalid coordinates")
			}
			for _, v := range a {
				if math.IsNaN(v) || math.IsInf(v, 0) || math.Abs(v) > 10000 || i == 0 && v < .01 {
					return errors.New("Dimensions must be finite and between 0.01 and 10000 mm")
				}
			}
		}
		for _, p := range o.Points {
			if len(p) != 2 {
				return errors.New("Invalid sketch vertex")
			}
			for _, v := range p {
				if math.Abs(v) > 10000 || math.IsNaN(v) || math.IsInf(v, 0) {
					return errors.New("Invalid sketch coordinate")
				}
			}
		}
		for _, child := range o.Children {
			if e := visit(child, depth+1); e != nil {
				return e
			}
		}
		return nil
	}
	for _, o := range s.Objects {
		if e := visit(o, 0); e != nil {
			return e
		}
	}
	return nil
}
func (a *App) save(w http.ResponseWriter, r *http.Request) {
	a.mu.Lock()
	defer a.mu.Unlock()
	var p Project
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 16<<20))
	if d.Decode(&p) != nil || !safeID.MatchString(p.ID) || len(p.Name) < 1 || len(p.Name) > 160 {
		apphost.Problem(w, 400, "Invalid project (16 MiB maximum)")
		return
	}
	var extra any
	if d.Decode(&extra) != io.EOF {
		apphost.Problem(w, 400, "Only one project is accepted")
		return
	}
	if e := validateScene(p.Scene); e != nil {
		apphost.Problem(w, 400, e.Error())
		return
	}
	owner := apphost.Current(r).User.ID
	var rev int
	var existingOwner string
	e := a.H.DB.QueryRow("SELECT owner,revision FROM projects WHERE id=?", p.ID).Scan(&existingOwner, &rev)
	if e != nil && e != sql.ErrNoRows {
		a.H.DBError(w, e)
		return
	}
	if e == nil && existingOwner != owner {
		apphost.Problem(w, 404, "Project not found")
		return
	}
	if p.Revision != rev {
		apphost.Problem(w, 409, "This project changed in another window. Export your local copy before reopening the saved version.")
		return
	}
	var used int64
	var count int
	if e = a.H.DB.QueryRow("SELECT COALESCE(SUM(r.size),0) FROM revisions r JOIN projects p ON r.project=p.id WHERE p.owner=?", owner).Scan(&used); e != nil {
		a.H.DBError(w, e)
		return
	}
	if used+int64(len(p.Scene)) > 2<<30 {
		apphost.Problem(w, 413, "2 GiB project revision quota reached. Export a backup and contact the host administrator.")
		return
	}
	if e = a.H.DB.QueryRow("SELECT COUNT(*) FROM projects WHERE owner=?", owner).Scan(&count); e != nil {
		a.H.DBError(w, e)
		return
	}
	if count >= 500 && rev == 0 {
		apphost.Problem(w, 413, "500 project limit reached")
		return
	}
	blob, size, e := a.H.PutBlob(bytes.NewReader(p.Scene), 16<<20)
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	p.Revision = rev + 1
	p.Updated = time.Now().UTC().Format(time.RFC3339Nano)
	tx, e := a.H.DB.Begin()
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	defer tx.Rollback()
	_, e = tx.Exec("INSERT INTO projects VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,revision=excluded.revision,updated=excluded.updated,trash=excluded.trash,blob=excluded.blob", p.ID, owner, p.Name, p.Revision, p.Updated, p.Trash, blob)
	if e == nil {
		_, e = tx.Exec("INSERT INTO revisions VALUES(?,?,?,?)", p.ID, p.Revision, blob, size)
	}
	if e == nil {
		_, e = tx.Exec("DELETE FROM revisions WHERE project=? AND revision < ?", p.ID, p.Revision-30)
	}
	if e == nil {
		e = tx.Commit()
	}
	if e != nil {
		a.H.DBError(w, e)
		return
	}
	entries, _ := os.ReadDir(a.H.Config.Data + "/objects")
	for _, entry := range entries {
		if entry.IsDir() || len(entry.Name()) != 64 {
			continue
		}
		var refs int
		if a.H.DB.QueryRow("SELECT (SELECT COUNT(*) FROM revisions WHERE blob=?)+(SELECT COUNT(*) FROM projects WHERE blob=?)", entry.Name(), entry.Name()).Scan(&refs) == nil && refs == 0 {
			if path, e := a.H.BlobPath(entry.Name()); e == nil {
				os.Remove(path)
			}
		}
	}
	p.Scene = nil
	apphost.JSON(w, 200, p)
}

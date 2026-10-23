package app

import (
	"bytes"
	"encoding/json"
	"github.com/oneworkspacestudio/one-workspace/pkg/apphost"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

const scene = `{"schema":1,"units":"mm","objects":[{"id":"box1","kind":"box","color":"#ff0000","size":[80,50,20],"pos":[0,0,0],"rot":[0,0,0]}]}`

func TestValidation(t *testing.T) {
	if e := validateScene([]byte(scene)); e != nil {
		t.Fatal(e)
	}
	for _, bad := range []string{strings.Replace(scene, "80,50,20", "-1,50,20", 1), strings.Replace(scene, `"box"`, `"eval"`, 1), strings.Replace(scene, `"mm"`, `"in"`, 1), strings.Replace(scene, "80,50,20", "999999,50,20", 1)} {
		if validateScene([]byte(bad)) == nil {
			t.Fatal("unsafe geometry accepted")
		}
	}
}
func TestPrivateProjectsAndConflict(t *testing.T) {
	root := os.Getenv("MY3D_TEST_ROOT")
	if root == "" {
		t.Skip("Set MY3D_TEST_ROOT to a synthetic NTFS folder")
	}
	data, e := os.MkdirTemp(root, "api-")
	if e != nil {
		t.Fatal(e)
	}
	h, e := apphost.New(apphost.Config{ID: "my3d", Name: "My 3D", Version: "test", Data: data, Listen: "127.0.0.1:39118", Origin: "http://localhost:39118"}, nil)
	if e != nil {
		t.Fatal(e)
	}
	defer h.Close()
	if _, e = New(h); e != nil {
		t.Fatal(e)
	}
	if e = h.Bootstrap("qa@example.test", "Synthetic-only-9324!"); e != nil {
		t.Fatal(e)
	}
	server := httptest.NewServer(h.Handler())
	defer server.Close()
	call := func(method, path, body, cookie, csrf string) (int, []byte, *http.Response) {
		req, _ := http.NewRequest(method, server.URL+path, strings.NewReader(body))
		req.Host = "localhost:39118"
		req.Header.Set("Origin", "http://localhost:39118")
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Cookie", cookie)
		req.Header.Set("X-CSRF-Token", csrf)
		r, e := server.Client().Do(req)
		if e != nil {
			t.Fatal(e)
		}
		defer r.Body.Close()
		var b bytes.Buffer
		b.ReadFrom(r.Body)
		return r.StatusCode, b.Bytes(), r
	}
	code, _, login := call("POST", "/api/login", `{"email":"qa@example.test","password":"Synthetic-only-9324!"}`, "", "")
	if code != 200 {
		t.Fatal(code)
	}
	cookie := login.Cookies()[0].String()
	_, b, _ := call("GET", "/api/me", "", cookie, "")
	var session apphost.Session
	json.Unmarshal(b, &session)
	p := Project{ID: "project1", Name: "Private", Scene: json.RawMessage(scene)}
	raw, _ := json.Marshal(p)
	if c, _, _ := call("POST", "/api/projects", string(raw), cookie, ""); c != 403 {
		t.Fatal("CSRF bypass", c)
	}
	if c, b, _ := call("POST", "/api/projects", string(raw), cookie, session.CSRF); c != 200 {
		t.Fatal(c, string(b))
	}
	if c, _, _ := call("POST", "/api/projects", string(raw), cookie, session.CSRF); c != 409 {
		t.Fatal("stale write accepted", c)
	}
	if c, b, _ := call("GET", "/api/projects/project1", "", cookie, ""); c != 200 || !bytes.Contains(b, []byte("80,50,20")) {
		t.Fatal("precision lost", c, string(b))
	}
	if c, _, _ := call("GET", "/api/projects/project1", "", "", ""); c != 401 {
		t.Fatal("anonymous read", c)
	}
	_, e = h.DB.Exec("UPDATE projects SET owner='different-user' WHERE id='project1'")
	if e != nil {
		t.Fatal(e)
	}
	if c, _, _ := call("GET", "/api/projects/project1", "", cookie, ""); c != 404 {
		t.Fatal("cross-account read", c)
	}
	if c, _, _ := call("POST", "/api/projects", string(raw), cookie, session.CSRF); c != 404 {
		t.Fatal("cross-account write", c)
	}
}

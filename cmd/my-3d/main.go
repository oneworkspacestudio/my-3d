package main

import (
	"github.com/oneworkspacestudio/my-3d/internal/app"
	"github.com/oneworkspacestudio/my-3d/internal/webui"
	"github.com/oneworkspacestudio/one-workspace/pkg/apphost"
	"os"
)

var version = "0.1.0-preview.1"

func main() {
	if e := apphost.Main(apphost.Config{ID: "my3d", Name: "My 3D", Version: version, Listen: "127.0.0.1:9018"}, webui.Files(), func(h *apphost.Host) (apphost.Application, error) { return app.New(h) }); e != nil {
		apphost.Report(e)
		os.Exit(1)
	}
}

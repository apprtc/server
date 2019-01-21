package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/rakyll/statik/fs"

	_ "github.com/apprtc/webapp/statik" // TODO: Replace with the absolute import path
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w,
		"Hi, This is an example of https service in golang!")
}

func main() {
	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.StripPrefix("/", http.FileServer(statikFS)))
	// http.ListenAndServe(":9191", nil)
	http.ListenAndServeTLS(":9090", "server.crt",
		"server.key", nil)
}

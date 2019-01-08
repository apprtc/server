
package signalsvc

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/apprtc/server/channelling"

	"github.com/gorilla/mux"
)

func sandboxHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	// NOTE(longsleep): origin_scheme is window.location.protocol (eg. https:, http:).
	originURL, err := url.Parse(fmt.Sprintf("%s//%s", vars["origin_scheme"], vars["origin_host"]))
	if err != nil || originURL.Scheme == "" || originURL.Host == "" {
		http.Error(w, "Invalid origin path", http.StatusBadRequest)
		return
	}
	origin := fmt.Sprintf("%s://%s", originURL.Scheme, originURL.Host)

	handleSandboxView(vars["sandbox"], origin, w, r)
}

func handleSandboxView(sandbox string, origin string, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=UTF-8")
	w.Header().Set("Expires", "-1")
	w.Header().Set("Cache-Control", "private, max-age=0")

	sandboxTemplateName := fmt.Sprintf("%s_sandbox.html", sandbox)

	// Prepare context to deliver to HTML..
	if t := templates.Lookup(sandboxTemplateName); t != nil {

		// CSP support for sandboxes.
		var csp string
		switch sandbox {
		case "odfcanvas":
			csp = fmt.Sprintf("default-src 'none'; script-src %s; img-src data: blob:; style-src 'unsafe-inline'", origin)
		case "pdfcanvas":
			csp = fmt.Sprintf("default-src 'none'; script-src %s 'unsafe-eval'; img-src 'self' data: blob:; style-src 'unsafe-inline'", origin)
		default:
			csp = "default-src 'none'"
		}
		w.Header().Set("Content-Security-Policy", csp)

		// Prepare context to deliver to HTML..
		context := &channelling.Context{Cfg: config, Origin: origin, Csp: true}
		err := t.Execute(w, &context)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

	} else {
		http.Error(w, "404 Unknown Sandbox", http.StatusNotFound)
	}
}

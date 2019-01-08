
package signalsvc

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
)

func wellKnownHandler(w http.ResponseWriter, r *http.Request) {
	// Detect if the request was made with SSL.
	ssl := r.TLS != nil
	scheme := "http"
	proto, ok := r.Header["X-Forwarded-Proto"]
	if ok {
		ssl = proto[0] == "https"
	}
	if ssl {
		scheme = "https"
	}

	// Construct our URL.
	url := url.URL{
		Scheme: scheme,
		Host:   r.Host,
		Path:   strings.TrimSuffix(config.B, "/"),
	}
	doc := &map[string]string{
		"spreed-webrtc_endpoint": url.String(),
	}
	data, err := json.MarshalIndent(doc, "", "  ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

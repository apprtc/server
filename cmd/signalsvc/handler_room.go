package signalsvc

import (
	"fmt"
	"html/template"
	"net/http"

	"github.com/apprtc/server/channelling"

	"github.com/gorilla/mux"
)

func roomHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	handleRoomView(vars["room"], w, r)
}

var mainPage *template.Template
var tmplMain = `
<%define "mainPage"%>
<!doctype html>
<html class="no-js wf-loading" <%if.Csp%> ng-csp
<%end%>>

<head>
	<title>
		<%.Cfg.Title%>
	</title>
	<meta name="fragment" content="!">
	<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="mobile-web-app-capable" content="yes">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="referrer" content="no-referrer">
	<base href="<%.Cfg.B%>">
	<link rel="stylesheet" type="text/css" href="../static/css/main.css">

	<script id="globalcontext" type="application/json"><%$%></script>
	<script src="../static/js/libs/EBML.js"></script>
</head>

<body style="background-color:#000; overflow-x: hidden; overflow-y: hidden;">
    <ui></ui>
    <script data-main="<%.Cfg.S%>/js/<%.App%>" data-plugin="<%.Cfg.Plugin%>" src="<%.Cfg.S%>/js/libs/require/require.js"></script>
</body>

</html>
<%end%>
`

func init() {
	// Load templates.
	mainPage = template.New("mainPage")
	mainPage.Delims("<%", "%>")
	mainPage, err := mainPage.Parse(tmplMain)
	if err != nil {
		fmt.Println("error=", err)
	}

	fmt.Println("main name=", mainPage.Name())
}

func handleRoomView(room string, w http.ResponseWriter, r *http.Request) {
	var err error

	w.Header().Set("Content-Type", "text/html; charset=UTF-8")
	w.Header().Set("Expires", "-1")
	w.Header().Set("Cache-Control", "private, max-age=0")

	csp := false

	if config.ContentSecurityPolicy != "" {
		w.Header().Set("Content-Security-Policy", config.ContentSecurityPolicy)
		csp = true
	}
	if config.ContentSecurityPolicyReportOnly != "" {
		w.Header().Set("Content-Security-Policy-Report-Only", config.ContentSecurityPolicyReportOnly)
		csp = true
	}

	scheme := "http"

	// Detect if the request was made with SSL.
	ssl := r.TLS != nil
	proto, ok := r.Header["X-Forwarded-Proto"]
	if ok {
		ssl = proto[0] == "https"
		scheme = "https"
	}

	// Get languages from request.
	langs := getRequestLanguages(r, []string{})
	if len(langs) == 0 {
		langs = append(langs, "en")
	}

	// Prepare context to deliver to HTML..
	context := &channelling.Context{
		Cfg:       config,
		App:       "main",
		Host:      r.Host,
		Scheme:    scheme,
		Ssl:       ssl,
		Csp:       csp,
		Languages: langs,
		Room:      room,
		S:         config.S,
	}

	// Get URL parameters.
	r.ParseForm()

	// Render mainPage template.
	err = mainPage.Execute(w, context)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

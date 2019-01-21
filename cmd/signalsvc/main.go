package signalsvc

import (
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/apprtc/server/channelling"
	"github.com/apprtc/server/channelling/api"
	"github.com/apprtc/server/channelling/server"
	"github.com/apprtc/server/natsconnection"

	"github.com/apprtc/server/httputils"
	"github.com/apprtc/server/phoenix"
	"github.com/apprtc/server/sloth"

	_ "github.com/apprtc/server/cmd/statik" // TODO: Replace with the absolute import path
	"github.com/rakyll/statik/fs"

	"github.com/gorilla/mux"
)

var version = "unreleased"
var defaultConfig = "./server.conf"

var templates *template.Template
var config *channelling.Config

func runner(runtime phoenix.Runtime) error {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)

	rootFolder, err := runtime.GetString("http", "root")
	if err != nil {
		cwd, err2 := os.Getwd()
		if err2 != nil {
			return fmt.Errorf("Error while getting current directory: %s", err)
		}
		rootFolder = cwd
	}

	if !httputils.HasDirPath(rootFolder) {
		return fmt.Errorf("Configured root '%s' is not a directory.", rootFolder)
	}

	statsEnabled, err := runtime.GetBool("http", "stats")
	if err != nil {
		statsEnabled = false
	}

	pipelinesEnabled, err := runtime.GetBool("app", "pipelinesEnabled")
	if err != nil {
		pipelinesEnabled = false
	}

	var sessionSecret []byte
	sessionSecretString, err := runtime.GetString("app", "sessionSecret")
	if err != nil {
		return fmt.Errorf("No sessionSecret in config file.")
	}
	sessionSecret, err = hex.DecodeString(sessionSecretString)
	if err != nil {
		log.Println("Warning: sessionSecret value is not a hex encoded", err)
		sessionSecret = []byte(sessionSecretString)
	}
	if len(sessionSecret) < 32 {
		return fmt.Errorf("Length of sessionSecret must be at least 32 bytes.")
	}

	if len(sessionSecret) < 32 {
		log.Printf("Weak sessionSecret (only %d bytes). It is recommended to use a key with 32 or 64 bytes.\n", len(sessionSecret))
	}

	var encryptionSecret []byte
	encryptionSecretString, err := runtime.GetString("app", "encryptionSecret")
	if err != nil {
		return fmt.Errorf("No encryptionSecret in config file.")
	}
	encryptionSecret, err = hex.DecodeString(encryptionSecretString)
	if err != nil {
		log.Println("Warning: encryptionSecret value is not a hex encoded", err)
		encryptionSecret = []byte(encryptionSecretString)
	}
	switch l := len(encryptionSecret); {
	case l == 16:
	case l == 24:
	case l == 32:
	default:
		return fmt.Errorf("Length of encryptionSecret must be exactly 16, 24 or 32 bytes to select AES-128, AES-192 or AES-256.")
	}

	var turnSecret []byte
	turnSecretString, err := runtime.GetString("app", "turnSecret")
	if err == nil {
		turnSecret = []byte(turnSecretString)
	}

	serverRealm, err := runtime.GetString("app", "serverRealm")
	if err != nil {
		serverRealm = "local"
	}

	// Create token provider.
	tokenFile, err := runtime.GetString("app", "tokenFile")
	if err == nil {
		if !httputils.HasFilePath(path.Clean(tokenFile)) {
			return fmt.Errorf("Unable to find token file at %s", tokenFile)
		}
	}

	var tokenProvider channelling.TokenProvider
	if tokenFile != "" {
		log.Printf("Using token authorization from %s\n", tokenFile)
		tokenProvider = channelling.TokenFileProvider(tokenFile)
	}

	// Nats pub/sub supports.
	natsChannellingTrigger, _ := runtime.GetBool("nats", "channelling_trigger")
	natsChannellingTriggerSubject, _ := runtime.GetString("nats", "channelling_trigger_subject")
	if natsURL, err := runtime.GetString("nats", "url"); err == nil {
		if natsURL != "" {
			natsconnection.DefaultURL = natsURL
		}
	}
	if natsEstablishTimeout, err := runtime.GetInt("nats", "establishTimeout"); err == nil {
		if natsEstablishTimeout != 0 {
			natsconnection.DefaultEstablishTimeout = time.Duration(natsEstablishTimeout) * time.Second
		}
	}
	natsClientId, _ := runtime.GetString("nats", "client_id")

	// Load remaining configuration items.
	config, err = server.NewConfig(runtime, tokenProvider != nil)
	if err != nil {
		return err
	}

	// Load templates.
	templates = template.New("")
	templates.Delims("<%", "%>")

	// Load html templates folder
	err = filepath.Walk(path.Join(rootFolder, "html"), func(path string, info os.FileInfo, err error) error {
		if err == nil {
			if strings.HasSuffix(path, ".html") {
				_, err = templates.ParseFiles(path)
				if err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("Failed to load templates: %s", err)
	}

	// Define incoming channeling API limit it byte. Larger messages will be discarded.
	incomingCodecLimit := 1024 * 1024 // 1MB

	// Create realm string from config.
	computedRealm := fmt.Sprintf("%s.%s", serverRealm, config.Token)

	// Create router.
	router := mux.NewRouter()
	r := router.PathPrefix(config.B).Subrouter().StrictSlash(true)

	// HTTP listener support.
	if _, err = runtime.GetString("http", "listen"); err == nil {
		runtime.DefaultHTTPHandler(r)
	}

	// Native HTTPS listener support.
	if _, err = runtime.GetString("https", "listen"); err == nil {
		// Setup TLS.
		tlsConfig, err := runtime.TLSConfig()
		if err != nil {
			return fmt.Errorf("TLS configuration error: %s", err)
		}
		// Explicitly set random to use.
		tlsConfig.Rand = rand.Reader
		log.Println("Native TLS configuration intialized")
		runtime.DefaultHTTPSHandler(r)
	}

	// Prepare services.
	apiConsumer := channelling.NewChannellingAPIConsumer()
	buddyImages := channelling.NewImageCache()
	codec := channelling.NewCodec(incomingCodecLimit)
	roomManager := channelling.NewRoomManager(config, codec)
	hub := channelling.NewHub(config, sessionSecret, encryptionSecret, turnSecret, codec)
	tickets := channelling.NewTickets(sessionSecret, encryptionSecret, computedRealm)
	sessionManager := channelling.NewSessionManager(config, tickets, hub, roomManager, roomManager, buddyImages, sessionSecret)
	statsManager := channelling.NewStatsManager(hub, roomManager, sessionManager)
	busManager := channelling.NewBusManager(apiConsumer, natsClientId, natsChannellingTrigger, natsChannellingTriggerSubject)
	pipelineManager := channelling.NewPipelineManager(busManager, sessionManager, sessionManager, sessionManager)
	if err := roomManager.SetBusManager(busManager); err != nil {
		return err
	}

	// Create API.
	channellingAPI := api.New(config, roomManager, tickets, sessionManager, statsManager, hub, hub, hub, busManager, pipelineManager)
	apiConsumer.SetChannellingAPI(channellingAPI)

	// Start bus.
	busManager.Start()

	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}

	statikFS.Open(".")
	// Add handlers.
	r.HandleFunc("/", httputils.MakeGzipHandler(mainHandler))

	// if os.Getenv("webrtc-debug") == "1" {
	r.Handle("/static/{path:.*}", http.StripPrefix(config.B, httputils.FileStaticServer(http.Dir(rootFolder))))
	// } else {
	// 	r.Handle("/static/{path:.*}", http.StripPrefix(config.B, httputils.FileStaticServer(statikFS)))
	// }

	// Add RESTful API end points.
	rest := sloth.NewAPI()
	rest.SetMux(r.PathPrefix("/api/v1/").Subrouter())
	rest.AddResource(&server.Rooms{}, "/rooms")
	rest.AddResource(config, "/config")
	rest.AddResourceWithWrapper(&server.Tokens{tokenProvider}, httputils.MakeGzipHandler, "/tokens")

	var users *server.Users
	if config.UsersEnabled {
		// Create Users handler.
		users = server.NewUsers(hub, tickets, sessionManager, config.UsersMode, serverRealm, runtime)
		rest.AddResource(&server.Sessions{tickets, hub, users}, "/sessions/{id}/")
		if config.UsersAllowRegistration {
			rest.AddResource(users, "/users")
		}
	}
	if statsEnabled {
		rest.AddResourceWithWrapper(&server.Stats{statsManager}, httputils.MakeGzipHandler, "/stats")
		log.Println("Stats are enabled!")
	}
	if pipelinesEnabled {
		pipelineManager.Start()
		rest.AddResource(&server.Pipelines{pipelineManager, channellingAPI}, "/pipelines/{id}")
		log.Println("Pipelines API is enabled!")
	}

	// Finally add websocket handler.
	r.Handle("/ws", makeWSHandler(statsManager, sessionManager, codec, channellingAPI, users))

	// Simple room handler.
	r.HandleFunc("/{room}", httputils.MakeGzipHandler(roomHandler))

	// Map everything else to a room when it is a GET.
	rooms := r.PathPrefix("/").Methods("GET").Subrouter()
	rooms.HandleFunc("/{room:.*}", httputils.MakeGzipHandler(roomHandler))

	return runtime.Start()
}

func boot() error {
	defaultConfigPath := flag.String("dc", "", "Default configuration file.")
	configPath := flag.String("c", defaultConfig, "Configuration file.")
	overrideConfigPath := flag.String("oc", "", "Override configuration file.")
	logPath := flag.String("l", "", "Log file, defaults to stderr.")
	showVersion := flag.Bool("v", false, "Display version number and exit.")
	memprofile := flag.String("memprofile", "", "Write memory profile to this file.")
	cpuprofile := flag.String("cpuprofile", "", "Write cpu profile to file.")
	showHelp := flag.Bool("h", false, "Show this usage information and exit.")
	flag.Parse()

	if *showHelp {
		flag.Usage()
		return nil
	} else if *showVersion {
		fmt.Printf("Version %s\n", version)
		return nil
	}

	return phoenix.NewServer("server", version).
		DefaultConfig(defaultConfigPath).
		Config(configPath).
		OverrideConfig(overrideConfigPath).
		Log(logPath).
		CpuProfile(cpuprofile).
		MemProfile(memprofile).
		Run(runner)
}

func main() {
	if boot() != nil {
		os.Exit(-1)
	}
}

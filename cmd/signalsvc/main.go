package signalsvc

import (
	"crypto/rand"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/apprtc/server/channelling"
	"github.com/apprtc/server/channelling/api"
	"github.com/apprtc/server/channelling/server"
	"github.com/rakyll/statik/fs"

	"github.com/apprtc/server/httputils"
	"github.com/apprtc/server/phoenix"

	"github.com/gorilla/mux"

	_ "github.com/apprtc/server/cmd/statik"
)

var version = "0.1"
var defaultConfig = "./server.conf"

var config *channelling.Config

func runner(runtime phoenix.Runtime) error {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	var err error

	sessionSecret := []byte("the-default-secret-do-not-keep-me")
	encryptionSecret := []byte("tne-default-encryption-block-key")

	var turnSecret []byte
	serverRealm := "local"

	// Load remaining configuration items.
	config, err = server.NewConfig(runtime, false)
	if err != nil {
		return err
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
	codec := channelling.NewCodec(incomingCodecLimit)
	roomManager := channelling.NewRoomManager(config, codec)
	hub := channelling.NewHub(config, sessionSecret, encryptionSecret, turnSecret, codec)
	tickets := channelling.NewTickets(sessionSecret, encryptionSecret, computedRealm)
	sessionManager := channelling.NewSessionManager(config, tickets, hub, roomManager, roomManager, sessionSecret)
	statsManager := channelling.NewStatsManager(hub, roomManager, sessionManager)
	busManager := channelling.NewBusManager(apiConsumer, "", false, "")
	pipelineManager := channelling.NewPipelineManager(busManager, sessionManager, sessionManager, sessionManager)
	if err := roomManager.SetBusManager(busManager); err != nil {
		return err
	}

	// Create API.
	channellingAPI := api.New(config, roomManager, tickets, sessionManager, statsManager, hub, busManager, pipelineManager)
	apiConsumer.SetChannellingAPI(channellingAPI)

	// Start bus.
	busManager.Start()

	// Add handlers.
	r.HandleFunc("/", httputils.MakeGzipHandler(mainHandler))

	statikFS, err := fs.New()
	if err != nil {
		log.Fatal(err)
	}
	r.Handle("/static/{path:.*}", http.StripPrefix(config.B, httputils.FileStaticServer(statikFS)))

	// Finally add websocket handler.
	r.Handle("/ws", makeWSHandler(statsManager, sessionManager, codec, channellingAPI))

	// Simple room handler.
	r.HandleFunc("/{room}", httputils.MakeGzipHandler(roomHandler))

	// Map everything else to a room when it is a GET.
	rooms := r.PathPrefix("/").Methods("GET").Subrouter()
	rooms.HandleFunc("/{room:.*}", httputils.MakeGzipHandler(roomHandler))

	return runtime.Start()
}

func boot() error {
	configPath := flag.String("c", defaultConfig, "Configuration file.")
	logPath := flag.String("l", "", "Log file, defaults to stderr.")

	return phoenix.NewServer("server", version).
		Config(configPath).
		Log(logPath).
		Run(runner)
}

func main() {
	if boot() != nil {
		os.Exit(-1)
	}
}

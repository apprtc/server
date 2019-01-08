package signalsvc

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/go-apps/pkg/core"
	"github.com/gorilla/websocket"
)

type SignalServer struct {
	core.ApplicationTask

	notifications chan []string
	ip            string
	port          int
}

var ws = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	connMux     = new(sync.Mutex)
	connections []*websocket.Conn
)

func (server *SignalServer) Exec() {
	server.ApplicationTask.Exec()
	fmt.Println("SignalServer exec.")

	main()

	fmt.Println("SignalServer exec end.\n")
}

func (server *SignalServer) Close() {
	server.ApplicationTask.Close()
	fmt.Println("SignalServer Close.")

	if server.notifications != nil {
		close(server.notifications)
	}

	fmt.Println("SignalServer Close end.")
}

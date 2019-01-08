package stunsvc

import (
	"fmt"

	"github.com/go-apps/pkg/core"
	"github.com/pions/pkg/stun"
	"github.com/pions/turn"
)

type MyTurnServer struct {
}

func (m *MyTurnServer) AuthenticateRequest(username string, srcAddr *stun.TransportAddr) (password string, ok bool) {
	return "password", true
}

type StunServer struct {
	core.ApplicationTask

	notifications chan []string
	ip            string
	port          int
}

func (server *StunServer) Exec() {
	fmt.Println("StunServer exec.")

	server.ApplicationTask.Exec()

	m := &MyTurnServer{}

	realm := ""

	turn.Start(turn.StartArguments{
		Server:  m,
		Realm:   realm,
		UDPPort: server.port,
	})

	fmt.Println("StunServer exec end.\n")
}

func (server *StunServer) Close() {
	server.ApplicationTask.Close()
	fmt.Println("StunServer Close.")
	close(server.notifications)
	fmt.Println("StunServer Close end.")
}

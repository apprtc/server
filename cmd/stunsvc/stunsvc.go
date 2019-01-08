package stunsvc

import (
	"github.com/go-apps/pkg/core"
)

func NewStunServer(ip string, port int) core.IApplicationTask {

	s := new(StunServer)
	s.ApplicationTask.NeedRestart = true
	s.ip = ip
	s.port = port

	s.notifications = make(chan []string)

	return s
}

package signalsvc

import (
	"github.com/go-apps/pkg/core"
)

func NewSignalServer(ip string, port int) core.IApplicationTask {

	s := new(SignalServer)
	s.ApplicationTask.NeedRestart = true
	s.ip = ip
	s.port = port

	s.notifications = make(chan []string)

	return s
}

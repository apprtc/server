package main

import (
	"flag"

	"github.com/apprtc/server/cmd/signalsvc"
	"github.com/apprtc/server/cmd/stunsvc"
	"github.com/go-apps/pkg/core"
)

var (
	signalIp   string
	signalPort int
	stunIp     string
	stunPort   int
)

func init() {
	signalIp = "0.0.0.0"
	signalPort = 55070
	stunIp = "0.0.0.0"
	stunPort = 55071
}

func Main() {
	flag.Parse()

	signalServer := signalsvc.NewSignalServer(signalIp, signalPort)
	core.CoreApplication().AddTask(signalServer)

	stunServer := stunsvc.NewStunServer(stunIp, stunPort)
	core.CoreApplication().AddTask(stunServer)
}

func main() {
	core.CoreApplication().Initialize("Focusteach.Ltd", "Focusteach")

	core.Run(Main)
}

package api

import (
	"log"

	"github.com/apprtc/server/channelling"
)

const (
	maxConferenceSize = 100
	apiVersion        = 1.4 // Keep this in sync with CHANNELING-API docs.Hand
)

type channellingAPI struct {
	RoomStatusManager channelling.RoomStatusManager
	SessionEncoder    channelling.SessionEncoder
	SessionManager    channelling.SessionManager
	StatsCounter      channelling.StatsCounter
	Unicaster         channelling.Unicaster
	BusManager        channelling.BusManager
	PipelineManager   channelling.PipelineManager
	config            *channelling.Config
}

// New creates and initializes a new ChannellingAPI using
// various other services for initialization. It is intended to handle
// incoming and outgoing channeling API events from clients.
func New(config *channelling.Config,
	roomStatus channelling.RoomStatusManager,
	sessionEncoder channelling.SessionEncoder,
	sessionManager channelling.SessionManager,
	statsCounter channelling.StatsCounter,
	unicaster channelling.Unicaster,
	busManager channelling.BusManager,
	pipelineManager channelling.PipelineManager) channelling.ChannellingAPI {
	return &channellingAPI{
		roomStatus,
		sessionEncoder,
		sessionManager,
		statsCounter,
		unicaster,
		busManager,
		pipelineManager,
		config,
	}
}

func (api *channellingAPI) OnConnect(client *channelling.Client, session *channelling.Session) (interface{}, error) {
	api.Unicaster.OnConnect(client, session)
	self, err := api.HandleSelf(session)

	return self, err
}

func (api *channellingAPI) OnDisconnect(client *channelling.Client, session *channelling.Session) {
	api.Unicaster.OnDisconnect(client, session)

}

func (api *channellingAPI) OnIncoming(sender channelling.Sender, session *channelling.Session, msg *channelling.DataIncoming) (interface{}, error) {
	var pipeline *channelling.Pipeline
	switch msg.Type {
	case "Self":
		return api.HandleSelf(session)
	case "Hello":
		if msg.Hello == nil {
			return nil, channelling.NewDataError("bad_request", "message did not contain Hello")
		}

		return api.HandleHello(session, msg.Hello, sender)
	case "Offer":
		if msg.Offer == nil || msg.Offer.Offer == nil {
			log.Println("Received invalid offer message.", msg)
			break
		}

		session.Unicast(msg.Offer.To, msg.Offer, pipeline)
	case "Candidate":
		if msg.Candidate == nil || msg.Candidate.Candidate == nil {
			log.Println("Received invalid candidate message.", msg)
			break
		}

		pipeline = api.PipelineManager.GetPipeline(channelling.PipelineNamespaceCall, sender, session, msg.Candidate.To)
		session.Unicast(msg.Candidate.To, msg.Candidate, pipeline)
	case "Answer":
		if msg.Answer == nil || msg.Answer.Answer == nil {
			log.Println("Received invalid answer message.", msg)
			break
		}

		session.Unicast(msg.Answer.To, msg.Answer, pipeline)
	case "Bye":
		if msg.Bye == nil {
			log.Println("Received invalid bye message.", msg)
			break
		}
		pipeline = api.PipelineManager.GetPipeline(channelling.PipelineNamespaceCall, sender, session, msg.Bye.To)

		session.Unicast(msg.Bye.To, msg.Bye, pipeline)
		if pipeline != nil {
			pipeline.Close()
		}
	case "Status":
		if msg.Status == nil {
			log.Println("Received invalid status message.", msg)
			break
		}

		//log.Println("Status", msg.Status)
		session.Update(&channelling.SessionUpdate{Types: []string{"Status"}, Status: msg.Status.Status})
		session.BroadcastStatus()
	case "Alive":
		return msg.Alive, nil
	case "Room":
		if msg.Room == nil {
			return nil, channelling.NewDataError("bad_request", "message did not contain Room")
		}

		return api.HandleRoom(session, msg.Room)
	case "Leave":
		if err := api.HandleLeave(session); err != nil {
			return nil, err
		}
		return nil, nil
	default:
		log.Println("OnText unhandled message type", msg.Type)
	}

	return nil, nil
}

func (api *channellingAPI) OnIncomingProcessed(sender channelling.Sender, session *channelling.Session, msg *channelling.DataIncoming, reply interface{}, err error) {
	switch msg.Type {
	case "Hello":
		api.HelloProcessed(sender, session, msg, reply, err)
	}
}

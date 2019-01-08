package api

import (
	"log"
	"time"

	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleChat(session *channelling.Session, chat *channelling.DataChat) {
	// TODO(longsleep): Limit sent chat messages per incoming connection.
	msg := chat.Chat
	to := chat.To

	if !msg.NoEcho {
		session.Unicast(session.Id, chat, nil)
	}
	msg.Time = time.Now().Format(time.RFC3339)
	if to == "" {
		// TODO(longsleep): Check if chat broadcast is allowed.
		if session.Hello {
			api.StatsCounter.CountBroadcastChat()
			session.Broadcast(chat)
		}
	} else {
		if msg.Status != nil {
			if msg.Status.ContactRequest != nil {
				if !api.config.WithModule("contacts") {
					return
				}
				if err := api.ContactManager.ContactrequestHandler(session, to, msg.Status.ContactRequest); err != nil {
					log.Println("Ignoring invalid contact request.", err)
					return
				}
				msg.Status.ContactRequest.Userid = session.Userid()
			}
		} else {
			api.StatsCounter.CountUnicastChat()
		}

		session.Unicast(to, chat, nil)
		if msg.Mid != "" {
			// Send out delivery confirmation status chat message.
			session.Unicast(session.Id, &channelling.DataChat{To: to, Type: "Chat", Chat: &channelling.DataChatMessage{Mid: msg.Mid, Status: &channelling.DataChatStatus{State: "sent"}}}, nil)
		}
	}
}

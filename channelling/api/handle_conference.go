package api

import (
	"log"

	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleConference(session *channelling.Session, conference *channelling.DataConference) {
	if room, ok := api.RoomStatusManager.Get(session.Roomid); ok && room.GetType() == channelling.RoomTypeConference {
		log.Println("Refusing client-side conference update for server-managed conferences.")
		return
	}

	// Check conference maximum size.
	if len(conference.Conference) > maxConferenceSize {
		log.Println("Refusing to create conference above limit.", len(conference.Conference))
		return
	}

	// Send conference update to anyone.
	for _, id := range conference.Conference {
		if id != session.Id {
			session.Unicast(id, conference, nil)
		}
	}
}

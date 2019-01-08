package api

import (
	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleUsers(session *channelling.Session) (sessions *channelling.DataSessions, err error) {
	if session.Hello {
		sessions = &channelling.DataSessions{Type: "Users", Users: api.RoomStatusManager.RoomUsers(session)}
	} else {
		err = channelling.NewDataError("not_in_room", "Cannot list users without a current room")
	}

	return
}

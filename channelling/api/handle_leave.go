package api

import (
	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleLeave(session *channelling.Session) error {
	session.LeaveRoom()

	return nil
}

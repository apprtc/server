package api

import (
	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleRoom(session *channelling.Session, room *channelling.DataRoom) (*channelling.DataRoom, error) {
	room, err := api.RoomStatusManager.UpdateRoom(session, room)
	if err == nil {
		session.Broadcast(room)
	}

	return room, err
}

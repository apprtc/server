package api

import (
	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleHello(session *channelling.Session, hello *channelling.DataHello, sender channelling.Sender) (*channelling.DataWelcome, error) {
	// TODO(longsleep): Filter room id and user agent.
	session.Update(&channelling.SessionUpdate{Types: []string{"Ua"}, Ua: hello.Ua})

	// Compatibily for old clients.
	roomName := hello.Name
	if roomName == "" {
		roomName = hello.Id
	}

	room, err := session.JoinRoom(roomName, hello.Type, hello.Credentials, sender)
	if err != nil {
		return nil, err
	}

	return &channelling.DataWelcome{
		Type:  "Welcome",
		Room:  room,
		Users: api.RoomStatusManager.RoomUsers(session),
	}, nil
}

func (api *channellingAPI) HelloProcessed(sender channelling.Sender, session *channelling.Session, msg *channelling.DataIncoming, reply interface{}, err error) {

}

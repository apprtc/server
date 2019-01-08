

package channelling

import (
	"testing"

	"github.com/apprtc/server/channelling"
)

func NewTestRoomManager() (RoomManager, *Config) {
	config := &Config{
		RoomTypeDefault: channelling.RoomTypeRoom,
	}
	return NewRoomManager(config, nil), config
}

func Test_RoomManager_JoinRoom_ReturnsAnErrorForUnauthenticatedSessionsWhenCreationRequiresAnAccount(t *testing.T) {
	roomManager, config := NewTestRoomManager()
	config.UsersEnabled = true
	config.AuthorizeRoomCreation = true

	unauthenticatedSession := &Session{}
	_, err := roomManager.JoinRoom(channelling.RoomTypeRoom+":foo", "foo", channelling.RoomTypeRoom, nil, unauthenticatedSession, false, nil)
	assertDataError(t, err, "room_join_requires_account")

	authenticatedSession := &Session{userid: "9870457"}
	_, err = roomManager.JoinRoom(channelling.RoomTypeRoom+":foo", "foo", channelling.RoomTypeRoom, nil, authenticatedSession, true, nil)
	if err != nil {
		t.Fatalf("Unexpected error %v joining room while authenticated", err)
	}

	_, err = roomManager.JoinRoom(channelling.RoomTypeRoom+":foo", "foo", channelling.RoomTypeRoom, nil, unauthenticatedSession, false, nil)
	if err != nil {
		t.Fatalf("Unexpected error %v joining room while unauthenticated", err)
	}
}

func Test_RoomManager_JoinRoom_ReturnsAnErrorForUnauthenticatedSessionsWhenJoinRequiresAnAccount(t *testing.T) {
	roomManager, config := NewTestRoomManager()
	config.UsersEnabled = true
	config.AuthorizeRoomJoin = true

	unauthenticatedSession := &Session{}
	_, err := roomManager.JoinRoom(channelling.RoomTypeRoom+":foo", "foo", channelling.RoomTypeRoom, nil, unauthenticatedSession, false, nil)
	assertDataError(t, err, "room_join_requires_account")

	authenticatedSession := &Session{userid: "9870457"}
	_, err = roomManager.JoinRoom(channelling.RoomTypeRoom+":foo", "foo", channelling.RoomTypeRoom, nil, authenticatedSession, true, nil)
	if err != nil {
		t.Fatalf("Unexpected error %v joining room while authenticated", err)
	}

	_, err = roomManager.JoinRoom(channelling.RoomTypeRoom+":foo", "foo", channelling.RoomTypeRoom, nil, unauthenticatedSession, false, nil)
	assertDataError(t, err, "room_join_requires_account")
}

func Test_RoomManager_UpdateRoom_ReturnsAnErrorIfNoRoomHasBeenJoined(t *testing.T) {
	roomManager, _ := NewTestRoomManager()
	_, err := roomManager.UpdateRoom(&Session{}, nil)

	assertDataError(t, err, "not_in_room")
}

func Test_RoomManager_UpdateRoom_ReturnsAnErrorIfUpdatingAnUnjoinedRoom(t *testing.T) {
	roomManager, _ := NewTestRoomManager()
	session := &Session{Hello: true, Roomid: channelling.RoomTypeRoom + ":foo"}
	_, err := roomManager.UpdateRoom(session, &DataRoom{Name: "bar"})
	assertDataError(t, err, "not_in_room")
}

func Test_RoomManager_UpdateRoom_ReturnsACorrectlyTypedDocument(t *testing.T) {
	roomManager, _ := NewTestRoomManager()
	session := &Session{Hello: true, Roomid: channelling.RoomTypeRoom + ":foo"}
	room, err := roomManager.UpdateRoom(session, &DataRoom{Name: "foo"})
	if err != nil {
		t.Fatalf("Unexpected error %v updating room", err)
	}

	if room.Type != channelling.RoomTypeRoom {
		t.Errorf("Expected document type to be %s, but was %v", channelling.RoomTypeRoom, room.Type)
	}
}

func Test_RoomManager_TypeThroughNats(t *testing.T) {
	theRoomManager, _ := NewTestRoomManager()
	rm := theRoomManager.(*roomManager)
	if rt := rm.getConfiguredRoomType("foo"); rt != channelling.RoomTypeRoom {
		t.Errorf("Expected room type to be %s, but was %v", channelling.RoomTypeRoom, rt)
	}
	rm.setNatsRoomType(&roomTypeMessage{Path: "foo", Type: "Conference"})
	if rt := rm.getConfiguredRoomType("foo"); rt != "Conference" {
		t.Errorf("Expected room type to be %s, but was %v", "Conference", rt)
	}
	rm.setNatsRoomType(&roomTypeMessage{Path: "foo", Type: ""})
	if rt := rm.getConfiguredRoomType("foo"); rt != channelling.RoomTypeRoom {
		t.Errorf("Expected room type to be %s, but was %v", channelling.RoomTypeRoom, rt)
	}
}

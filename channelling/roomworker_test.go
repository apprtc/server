

package channelling

import (
	"testing"

	"github.com/apprtc/server/channelling"
)

const (
	testRoomID   string = channelling.RoomTypeRoom + ":a-room-name"
	testRoomName string = "a-room-name"
	testRoomType string = channelling.RoomTypeRoom
)

func NewTestRoomWorker() RoomWorker {
	worker := NewRoomWorker(&roomManager{Config: &Config{}}, testRoomID, testRoomName, testRoomType, nil)
	go worker.Start()
	return worker
}

func NewTestRoomWorkerWithPIN(t *testing.T) (RoomWorker, string) {
	pin := "asdf"
	worker := NewRoomWorker(&roomManager{Config: &Config{}}, testRoomID, testRoomName, testRoomType, &DataRoomCredentials{PIN: pin})
	go worker.Start()
	return worker, pin
}

func Test_RoomWorker_Join_SucceedsWhenNoCredentialsAreRequired(t *testing.T) {
	worker := NewTestRoomWorker()

	_, err := worker.Join(nil, &Session{}, nil)
	if err != nil {
		t.Fatalf("Unexpected error %v", err)
	}

	if userCount := len(worker.GetUsers()); userCount != 1 {
		t.Errorf("Expected join to have been accepted but room contains %d users", userCount)
	}
}

func Test_RoomWorker_Join_FailsIfCredentialsAreGivenWhenUnneeded(t *testing.T) {
	worker := NewTestRoomWorker()

	_, err := worker.Join(&DataRoomCredentials{}, &Session{}, nil)

	assertDataError(t, err, "authorization_not_required")
	if userCount := len(worker.GetUsers()); userCount != 0 {
		t.Errorf("Expected join to have been rejected but room contains %d users", userCount)
	}
}

func Test_RoomWorker_Join_FailsIfNoCredentialsAreGiven(t *testing.T) {
	worker, _ := NewTestRoomWorkerWithPIN(t)

	_, err := worker.Join(nil, &Session{}, nil)

	assertDataError(t, err, "authorization_required")
	if userCount := len(worker.GetUsers()); userCount != 0 {
		t.Errorf("Expected join to have been rejected but room contains %d users", userCount)
	}
}

func Test_RoomWorker_Join_FailsIfIncorrectCredentialsAreGiven(t *testing.T) {
	worker, _ := NewTestRoomWorkerWithPIN(t)

	_, err := worker.Join(&DataRoomCredentials{PIN: "adfs"}, &Session{}, nil)

	assertDataError(t, err, "invalid_credentials")
	if userCount := len(worker.GetUsers()); userCount != 0 {
		t.Errorf("Expected join to have been rejected but room contains %d users", userCount)
	}
}

func Test_RoomWorker_Join_SucceedsWhenTheCorrectPINIsGiven(t *testing.T) {
	worker, pin := NewTestRoomWorkerWithPIN(t)

	if _, err := worker.Join(&DataRoomCredentials{PIN: pin}, &Session{}, nil); err != nil {
		t.Fatalf("Unexpected error %v", err)
	}

	if len(worker.GetUsers()) < 1 {
		t.Error("Expected join to have been accepted but room contains no users")
	}
}

func Test_RoomWorker_Update_AllowsClearingCredentials(t *testing.T) {
	worker, _ := NewTestRoomWorkerWithPIN(t)

	if err := worker.Update(&DataRoom{Credentials: &DataRoomCredentials{PIN: ""}}); err != nil {
		t.Fatalf("Failed to update room: %v", err)
	}

	_, err := worker.Join(&DataRoomCredentials{}, &Session{}, nil)
	assertDataError(t, err, "authorization_not_required")
}

func Test_RoomWorker_Update_RetainsCredentialsWhenOtherPropertiesAreUpdated(t *testing.T) {
	worker, pin := NewTestRoomWorkerWithPIN(t)

	if err := worker.Update(&DataRoom{}); err != nil {
		t.Fatalf("Failed to update room: %v", err)
	}

	if _, err := worker.Join(&DataRoomCredentials{PIN: pin}, &Session{}, nil); err != nil {
		t.Fatalf("Unexpected error joining room %v", err)
	}
}

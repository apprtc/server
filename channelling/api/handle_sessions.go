package api

import (
	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleSessions(session *channelling.Session, sessions *channelling.DataSessionsRequest) (*channelling.DataSessions, error) {
	switch sessions.Type {
	case "contact":
		if !api.config.WithModule("contacts") {
			return nil, channelling.NewDataError("contacts_not_enabled", "incoming contacts session request with contacts disabled")
		}
		userID, err := api.ContactManager.GetContactID(session, sessions.Token)
		if err != nil {
			return nil, err
		}
		return &channelling.DataSessions{
			Type:     "Sessions",
			Users:    api.SessionManager.GetUserSessions(session, userID),
			Sessions: sessions,
		}, nil
	case "session":
		id, err := session.DecodeAttestation(sessions.Token)
		if err != nil {
			return nil, channelling.NewDataError("bad_attestation", err.Error())
		}
		session, ok := api.Unicaster.GetSession(id)
		if !ok {
			return nil, channelling.NewDataError("no_such_session", "cannot retrieve session")
		}
		return &channelling.DataSessions{
			Type:     "Sessions",
			Users:    []*channelling.DataSession{session.Data()},
			Sessions: sessions,
		}, nil
	default:
		return nil, channelling.NewDataError("bad_request", "unknown sessions request type")
	}
}

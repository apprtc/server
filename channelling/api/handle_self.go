package api

import (
	"log"

	"github.com/apprtc/server/channelling"
)

func (api *channellingAPI) HandleSelf(session *channelling.Session) (*channelling.DataSelf, error) {
	token, err := api.SessionEncoder.EncodeSessionToken(session)
	if err != nil {
		log.Println("Error in OnRegister", err)
		return nil, err
	}

	log.Println("Created new session token", len(token), token)
	self := &channelling.DataSelf{
		Type:       "Self",
		Id:         session.Id,
		Sid:        session.Sid,
		Userid:     session.Userid(),
		Suserid:    api.SessionEncoder.EncodeSessionUserID(session),
		Token:      token,
		Version:    api.config.Version,
		ApiVersion: apiVersion,
	}

	return self, nil
}

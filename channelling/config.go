package channelling

import (
	"net/http"
	"regexp"
)

type Config struct {
	Title                           string                    // Title
	Ver                             string                    `json:"-"` // Version (not exported to Javascript)
	S                               string                    // Static URL prefix with version
	B                               string                    // Base URL
	Token                           string                    // Server token
	Renegotiation                   bool                      // Renegotiation flag
	Tokens                          bool                      // True when we got a tokens file
	Version                         string                    // Server version number
	DefaultRoomEnabled              bool                      // Flag if default room ("") is enable
	GlobalRoomID                    string                    `json:"-"` // Id of the global room (not exported to Javascript)
	ContentSecurityPolicy           string                    `json:"-"` // HTML content security policy
	ContentSecurityPolicyReportOnly string                    `json:"-"` // HTML content security policy in report only mode
	RoomTypeDefault                 string                    `json:"-"` // New rooms default to this type
	RoomTypes                       map[*regexp.Regexp]string `json:"-"` // Map of regular expression -> room type
}

func (config *Config) Get(request *http.Request) (int, interface{}, http.Header) {
	return 200, config, http.Header{"Content-Type": {"application/json; charset=utf-8"}}
}

package server

import (
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/apprtc/server/channelling"

	"github.com/apprtc/server/phoenix"
)

const (
	defaultRoomType = channelling.RoomTypeRoom
)

var (
	knownRoomTypes = map[string]bool{
		channelling.RoomTypeConference: true,
	}
)

func NewConfig(container phoenix.Container, tokens bool) (*channelling.Config, error) {
	ver := container.GetStringDefault("app", "ver", "")

	version := container.Version()
	if version != "unreleased" {
		ver = fmt.Sprintf("%s%s", ver, strings.Replace(version, ".", "", -1))
	} else {
		ts := fmt.Sprintf("%d", time.Now().Unix())
		if ver == "" {
			ver = ts
		}
		version = fmt.Sprintf("unreleased.%s", ts)
	}

	// Read base path from config and make sure it ends with a slash.
	basePath := container.GetStringDefault("http", "basePath", "/")
	if !strings.HasSuffix(basePath, "/") {
		basePath = fmt.Sprintf("%s/", basePath)
	}
	if basePath != "/" {
		container.Printf("Using '%s' base base path.", basePath)
	}

	//TODO(longsleep): When we have a database, generate this once from random source and store it.
	serverToken := container.GetStringDefault("app", "serverToken", "i-did-not-change-the-public-token-boo")

	stunURIsString := container.GetStringDefault("app", "stunURIs", "")
	stunURIs := strings.Split(stunURIsString, " ")
	trimAndRemoveDuplicates(&stunURIs)

	turnURIsString := container.GetStringDefault("app", "turnURIs", "")
	turnURIs := strings.Split(turnURIsString, " ")
	trimAndRemoveDuplicates(&turnURIs)

	// Get enabled modules.
	modulesTable := map[string]bool{
		"screensharing": true,
		"youtube":       true,
		"presentation":  true,
		"contacts":      true,
	}
	modules := []string{}
	for module := range modulesTable {
		if container.GetBoolDefault("modules", module, true) {
			modules = append(modules, module)
		} else {
			modulesTable[module] = false
		}
	}
	log.Println("Enabled modules:", modules)

	roomTypes := make(map[*regexp.Regexp]string)
	if options, _ := container.GetOptions("roomtypes"); len(options) > 0 {
		for _, option := range options {
			rt := container.GetStringDefault("roomtypes", option, "")
			if len(rt) == 0 {
				continue
			}

			if rt != defaultRoomType {
				if !knownRoomTypes[rt] {
					return nil, fmt.Errorf("Unsupported room type '%s' with expression %s", rt, option)
				}

				re, err := regexp.Compile(option)
				if err != nil {
					return nil, fmt.Errorf("Invalid regular expression '%s' for type %s: %s", option, rt, err)
				}

				roomTypes[re] = rt
			}
			log.Printf("Using room type %s for %s\n", rt, option)
		}
	}

	return &channelling.Config{
		Title:                           container.GetStringDefault("app", "title", "Spreed WebRTC"),
		Ver:                             ver,
		S:                               fmt.Sprintf("static/ver=%s", ver),
		B:                               basePath,
		Token:                           serverToken,
		Renegotiation:                   container.GetBoolDefault("app", "renegotiation", false),
		StunURIs:                        stunURIs,
		TurnURIs:                        turnURIs,
		Tokens:                          tokens,
		Version:                         version,
		UsersEnabled:                    container.GetBoolDefault("users", "enabled", false),
		UsersAllowRegistration:          container.GetBoolDefault("users", "allowRegistration", false),
		UsersMode:                       container.GetStringDefault("users", "mode", ""),
		DefaultRoomEnabled:              container.GetBoolDefault("app", "defaultRoomEnabled", true),
		Plugin:                          container.GetStringDefault("app", "plugin", ""),
		AuthorizeRoomCreation:           container.GetBoolDefault("app", "authorizeRoomCreation", false),
		AuthorizeRoomJoin:               container.GetBoolDefault("app", "authorizeRoomJoin", false),
		Modules:                         modules,
		ModulesTable:                    modulesTable,
		GlobalRoomID:                    container.GetStringDefault("app", "globalRoom", ""),
		ContentSecurityPolicy:           container.GetStringDefault("app", "contentSecurityPolicy", ""),
		ContentSecurityPolicyReportOnly: container.GetStringDefault("app", "contentSecurityPolicyReportOnly", ""),
		RoomTypeDefault:                 defaultRoomType,
		RoomTypes:                       roomTypes,
	}, nil
}

// Helper function to clean up string arrays.
func trimAndRemoveDuplicates(data *[]string) {
	found := make(map[string]bool)
	j := 0
	for i, x := range *data {
		x = strings.TrimSpace(x)
		if len(x) > 0 && !found[x] {
			found[x] = true
			(*data)[j] = (*data)[i]
			j++
		}
	}
	*data = (*data)[:j]
}

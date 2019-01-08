

package server

import (
	"fmt"
	"net/http"

	"github.com/apprtc/server/randomstring"
)

type Room struct {
	Name string `json:"name"`
	Url  string `json:"url"`
}

type Rooms struct {
}

func (rooms *Rooms) Post(request *http.Request) (int, interface{}, http.Header) {

	name := randomstring.NewRandomString(11)
	return 200, &Room{name, fmt.Sprintf("/%s", name)}, http.Header{"Content-Type": {"application/json"}}

}

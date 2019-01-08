package signalsvc

import (
	"net/http"
)

func mainHandler(w http.ResponseWriter, r *http.Request) {
	handleRoomView("", w, r)
}

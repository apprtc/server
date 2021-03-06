

package channelling

type SessionToken struct {
	Id     string // Public session id.
	Sid    string // Secret session id.
	Userid string // Public user id.
	Nonce  string `json:"Nonce,omitempty"` // User autentication nonce.
}

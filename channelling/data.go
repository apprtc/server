package channelling

type DataError struct {
	Type    string
	Code    string
	Message string
}

func NewDataError(code, message string) error {
	return &DataError{"Error", code, message}
}

func (err *DataError) Error() string {
	return err.Message
}

type DataRoomCredentials struct {
	PIN string
}

type DataHello struct {
	Version     string
	Ua          string
	Id          string // Compatibility with old clients.
	Name        string // Room name.
	Type        string // Room type.
	Credentials *DataRoomCredentials
}

type DataWelcome struct {
	Type  string
	Room  *DataRoom
	Users []*DataSession
}

type DataRoom struct {
	Type        string // Room type.
	Name        string // Room name.
	Credentials *DataRoomCredentials
}

type DataOffer struct {
	Type  string
	To    string
	Offer map[string]interface{}
}

type DataCandidate struct {
	Type      string
	To        string
	Candidate interface{}
}

type DataAnswer struct {
	Type   string
	To     string
	Answer map[string]interface{}
}

type DataSelf struct {
	Type       string
	Id         string
	Sid        string
	Userid     string
	Suserid    string
	Token      string
	Version    string  // Server version.
	ApiVersion float64 // Server channelling API version.
	Turn       *DataTurn
	Stun       []string
}

type DataTurn struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	Ttl      int      `json:"ttl"`
	Urls     []string `json:"urls"`
}

type DataSession struct {
	Type    string
	Id      string
	Userid  string      `json:",omitempty"`
	Ua      string      `json:",omitempty"`
	Token   string      `json:",omitempty"`
	Version string      `json:",omitempty"`
	Rev     uint64      `json:",omitempty"`
	Prio    int         `json:",omitempty"`
	Status  interface{} `json:",omitempty"`
	stamp   int64
}

type DataUser struct {
	Id       string
	Sessions int
}

type DataBye struct {
	Type string
	To   string
	Bye  interface{}
}

type DataStatus struct {
	Type   string
	Status interface{}
}

type DataAutoCall struct {
	Id   string
	Type string
}

type DataIncoming struct {
	Type      string
	Hello     *DataHello     `json:",omitempty"`
	Offer     *DataOffer     `json:",omitempty"`
	Candidate *DataCandidate `json:",omitempty"`
	Answer    *DataAnswer    `json:",omitempty"`
	Bye       *DataBye       `json:",omitempty"`
	Status    *DataStatus    `json:",omitempty"`
	Alive     *DataAlive     `json:",omitempty"`
	Sessions  *DataSessions  `json:",omitempty"`
	Room      *DataRoom      `json:",omitempty"`
	Iid       string         `json:",omitempty"`
}

type DataOutgoing struct {
	Data interface{} `json:",omitempty"`
	From string      `json:",omitempty"`
	To   string      `json:",omitempty"`
	Iid  string      `json:",omitempty"`
	A    string      `json:",omitempty"`
}

type DataSessions struct {
	Type     string
	Sessions *DataSessionsRequest `json:",omitempty"`
	Users    []*DataSession
}

type DataSessionsRequest struct {
	Token string
	Type  string
}

type DataAlive struct {
	Type  string
	Alive uint64
}

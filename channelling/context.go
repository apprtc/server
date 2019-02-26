package channelling

type Context struct {
	App    string // Main client script
	Cfg    *Config
	Host   string
	Ssl    bool
	Room   string `json:"-"`
	Scheme string `json:"-"`
	Origin string `json:",omitempty"`
	S      string `json:",omitempty"`
}

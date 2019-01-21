package channelling

type Context struct {
	App       string // Main client script
	Cfg       *Config
	Host      string
	Ssl       bool
	Csp       bool
	Languages []string
	Room      string `json:"-"`
	Scheme    string `json:"-"`
	Origin    string `json:",omitempty"`
	S         string `json:",omitempty"`
}

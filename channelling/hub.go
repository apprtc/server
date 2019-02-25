package channelling

import (
	"fmt"
	"log"
	"sync"
)

const (
	turnTTL = 3600 // XXX(longsleep): Add to config file.
)

type Hub interface {
	ClientStats
	Unicaster
}

type hub struct {
	OutgoingEncoder
	clients    map[string]*Client
	config     *Config
	turnSecret []byte
	mutex      sync.RWMutex
}

func NewHub(config *Config, sessionSecret, encryptionSecret, turnSecret []byte, encoder OutgoingEncoder) Hub {
	h := &hub{
		OutgoingEncoder: encoder,
		clients:         make(map[string]*Client),
		config:          config,
		turnSecret:      turnSecret,
	}

	return h
}

func (h *hub) ClientInfo(details bool) (clientCount int, sessions map[string]*DataSession, connections map[string]string) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	clientCount = len(h.clients)
	if details {
		sessions = make(map[string]*DataSession)
		for id, client := range h.clients {
			sessions[id] = client.Session().Data()
		}

		connections = make(map[string]string)
		for id, client := range h.clients {
			connections[fmt.Sprintf("%d", client.Index())] = id
		}
	}

	return
}

func (h *hub) GetSession(id string) (session *Session, ok bool) {
	var client *Client
	client, ok = h.GetClient(id)
	if ok {
		session = client.Session()
	}

	return
}

func (h *hub) OnConnect(client *Client, session *Session) {
	h.mutex.Lock()
	log.Printf("Created client %d with id %s\n", client.Index(), session.Id)
	// Register connection or replace existing one.
	if ec, ok := h.clients[session.Id]; ok {
		// Clean up old client at the end outside the hub lock.
		defer client.ReplaceAndClose(ec)
	}
	h.clients[session.Id] = client
	h.mutex.Unlock()
}

func (h *hub) OnDisconnect(client *Client, session *Session) {
	h.mutex.Lock()
	if ec, ok := h.clients[session.Id]; ok {
		if ec == client {
			log.Printf("Cleaning up client %d for session id %s\n", ec.Index(), session.Id)
			delete(h.clients, session.Id)
		} else {
			log.Printf("Not cleaning up session %s as client %d was replaced with %d\n", session.Id, client.Index(), ec.Index())
		}
	}
	h.mutex.Unlock()
}

func (h *hub) GetClient(sessionID string) (client *Client, ok bool) {
	h.mutex.RLock()
	client, ok = h.clients[sessionID]
	h.mutex.RUnlock()

	return
}

func (h *hub) Unicast(to string, outgoing *DataOutgoing, pipeline *Pipeline) {
	client, ok := h.GetClient(to)
	if pipeline != nil {
		if complete := pipeline.FlushOutgoing(h, client, to, outgoing); complete {
			return
		}
	}
	if !ok {
		log.Println("Unicast To not found", to)
		return
	}
	if message, err := h.EncodeOutgoing(outgoing); err == nil {
		client.Send(message)
		message.Decref()
	}
}

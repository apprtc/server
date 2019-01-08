

package channelling

import (
	"log"

	"github.com/apprtc/server/buffercache"
)

type Sender interface {
	Index() uint64
	Send(buffercache.Buffer)
}

type Client struct {
	Connection
	Codec
	ChannellingAPI ChannellingAPI
	session        *Session
}

func NewClient(codec Codec, api ChannellingAPI, session *Session) *Client {
	return &Client{
		Codec:          codec,
		ChannellingAPI: api,
		session:        session,
	}
}

func (client *Client) OnConnect(conn Connection) {
	client.Connection = conn
	if reply, err := client.ChannellingAPI.OnConnect(client, client.session); err == nil {
		client.reply("", reply)
	} else {
		log.Println("OnConnect error", err)
	}
}

func (client *Client) OnDisconnect() {
	client.session.Close()
	client.ChannellingAPI.OnDisconnect(client, client.session)
}

func (client *Client) OnText(b buffercache.Buffer) {
	incoming, err := client.Codec.DecodeIncoming(b)
	if err != nil {
		log.Println("OnText error while processing incoming message", err)
		return
	}

	var reply interface{}
	if reply, err = client.ChannellingAPI.OnIncoming(client, client.session, incoming); err != nil {
		client.reply(incoming.Iid, err)
	} else if reply != nil {
		client.reply(incoming.Iid, reply)
	}
	client.ChannellingAPI.OnIncomingProcessed(client, client.session, incoming, reply, err)
}

func (client *Client) reply(iid string, m interface{}) {
	outgoing := &DataOutgoing{From: client.session.Id, Iid: iid, Data: m}
	if b, err := client.Codec.EncodeOutgoing(outgoing); err == nil {
		client.Connection.Send(b)
		b.Decref()
	}
}

func (client *Client) Session() *Session {
	return client.session
}

func (client *Client) ReplaceAndClose(oldClient *Client) {
	oldSession := oldClient.Session()
	client.session.Replace(oldSession)
	go func() {
		// Close old session and client in another go routine,
		// to avoid blocking the new client if the old one hangs or
		// whatever.
		log.Printf("Closing obsolete client %d (replaced with %d) with id %s\n", oldClient.Index(), client.Index(), oldSession.Id)
		oldSession.Close()
		oldClient.Close()
	}()
}

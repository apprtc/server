package channelling

import (
	"fmt"
	"time"
)

// A BusManager provides the API to interact with a bus.
type BusManager interface {
	ChannellingAPIConsumer
	Start()
	Publish(subject string, v interface{}) error
	Request(subject string, v interface{}, vPtr interface{}, timeout time.Duration) error
	Trigger(name, from, payload string, data interface{}, pipeline *Pipeline) error
	Subscribe(subject string) error
	BindRecvChan(subject string, channel interface{}) error
	BindSendChan(subject string, channel interface{}) error
	PrefixSubject(string) string
	CreateSink(string) Sink
}

// A BusTrigger is a container to serialize trigger events
// for the bus backend.
type BusTrigger struct {
	Id       string
	Name     string
	From     string
	Payload  string      `json:",omitempty"`
	Data     interface{} `json:",omitempty"`
	Pipeline string      `json:",omitempty"`
}

// BusSubjectTrigger returns the bus subject for trigger payloads.
func BusSubjectTrigger(prefix, suffix string) string {
	return fmt.Sprintf("%s.%s", prefix, suffix)
}

// NewBusManager creates and initializes a new BusMager with the
// provided flags for NATS support. It is intended to connect the
// backend bus with a easy to use API to send and receive bus data.
func NewBusManager(apiConsumer ChannellingAPIConsumer, id string, useNats bool, subjectPrefix string) BusManager {
	var b BusManager

	b = &noopBus{apiConsumer, id}

	return b
}

type noopBus struct {
	ChannellingAPIConsumer
	id string
}

func (bus *noopBus) Start() {
	// noop
}

func (bus *noopBus) Publish(subject string, v interface{}) error {
	return nil
}

func (bus *noopBus) Request(subject string, v interface{}, vPtr interface{}, timeout time.Duration) error {
	return nil
}

func (bus *noopBus) Trigger(name, from, payload string, data interface{}, pipeline *Pipeline) error {
	return nil
}

func (bus *noopBus) PrefixSubject(subject string) string {
	return subject
}

func (bus *noopBus) BindRecvChan(subject string, channel interface{}) error {
	return nil
}

func (bus *noopBus) BindSendChan(subject string, channel interface{}) error {
	return nil
}

func (bus *noopBus) Subscribe(subject string) error {
	return nil
}

func (bus *noopBus) CreateSink(id string) Sink {
	return nil
}

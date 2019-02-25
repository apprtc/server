package channelling

// Sink connects a Pipeline with end points in both directions by
// getting attached to a Pipeline.
type Sink interface {
	// Write sends outgoing data on the sink
	Write(*DataSinkOutgoing) error
	Enabled() bool
	Close()
	Export() *DataSink
	BindRecvChan(channel interface{}) error
}

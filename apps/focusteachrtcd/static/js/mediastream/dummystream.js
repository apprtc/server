

"use strict";
define([], function() {

	// Dummy stream implementation.
	var DummyStream = function(id) {
		this.id = id ? id : "defaultDummyStream";
	};
	DummyStream.prototype.stop = function() {};
	DummyStream.prototype.getAudioTracks = function() { return [] };
	DummyStream.prototype.getVideoTracks = function() { return [] };
	DummyStream.not = function(stream) {
		// Helper to test if stream is a dummy.
		return !stream || stream.stop !== DummyStream.prototype.stop;
	};
	DummyStream.is = function(stream) {
		return stream && stream.stop === DummyStream.prototype.stop;
	};

	return DummyStream;

});
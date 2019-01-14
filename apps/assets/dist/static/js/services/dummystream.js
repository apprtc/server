

"use strict";
define([
	'mediastream/dummystream'
], function(DummyStream) {
	return [function() {
		return DummyStream;
	}];
});

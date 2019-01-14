

"use strict";
define(['mediastream/usermedia'], function(UserMedia) {

	// userMedia
	return [function() {

		// Public api.
		return {
			getUserMedia: UserMedia.getUserMedia,
			stopUserMediaStream: UserMedia.stopUserMediaStream
		}

	}];

});
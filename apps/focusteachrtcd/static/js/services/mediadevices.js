

"use strict";
define(['webrtc.adapter'], function() {

	// mediaDevices
	return ["$window", function($window) {
		return $window.navigator.mediaDevices;
	}];

});
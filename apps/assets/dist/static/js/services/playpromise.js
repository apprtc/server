

"use strict";
define(["underscore"], function(_) {
	function noopThen() {
		// Automatic playback started.
	}
	function noopCatch(error) {
		// Automatic playback failed.
	}

	// playPromise
	return function() {
		return function(elem, thenFunc, catchFunc) {
			// Starting with Chome 50 play() returns a promise.
			// https://developers.google.com/web/updates/2016/03/play-returns-promise
			var playPromise = elem.play()
			if (playPromise !== undefined) {
				if (!thenFunc) {
					thenFunc = noopThen;
				}
				if (!catchFunc) {
					catchFunc = noopCatch;
				}
				playPromise.then(thenFunc).catch(catchFunc);
			} else {
				if (thenFunc) {
					_.defer(thenFunc);
				}
			}
			return playPromise;
		}
	};
});

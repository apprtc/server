

"use strict";
define(["underscore", "rAF"], function(_) {

	// animationFrame
	return ["$window", function($window) {

		var requestAnimationFrame = $window.requestAnimationFrame;
		var registry = [];

		var caller;
		var runner;
		var timer;
		var worker;
		var animationFrame;

		caller = function(f) {
			f();
		};
		runner = function(c) {
			registry.forEach(caller);
			requestAnimationFrame(worker)
		}
		timer = $window.setTimeout;
		worker = function() {
			timer(runner, 100);
		};

		// Public api.
		animationFrame = {
			register: function(f) {
				registry.push(f);
			}
		};

		// Auto start worker.
		_.defer(worker);

		return animationFrame;

	}];

});

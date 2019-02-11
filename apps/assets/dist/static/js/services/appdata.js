

"use strict";
define(["jquery"], function($) {

	// appData.e events:
	// Subscribe these events with appData.e.on(eventname, function() {}).
	//
	// - selfReceived(event, self)
	//     self (object) : Self document as received from API.
	//
	// Other appData properties:
	//
	// - language (string) : ISO language code of active language.
	// - id (string)       : Random string generated on app startup.
	// - flags (map)       : Flag table.

	// appData
	return ["$window", function($window) {

		var service = this;

		service.e = $({});
		service.data = null;
		service.flags = {
			resurrect: null
		};


		service.get = function() {
			return service.data;
		};
		service.set = function(d) {
			service.data = d;
			return d;
		};
		return service;

	}];

});



"use strict";
define([], function() {

	// enrichMessage
	return ["$filter", function($filter) {

		var linky = $filter("linky");
		var enrichMessage = {
			url: function(s) {
				s = linky(s);
				s = s.replace(/<a/g, '<a rel="external"');
				return s;
			},
			multiline: function(s) {
				s = s.replace(/\r\n/g, "<br/>");
				s = s.replace(/\n/g, "<br/>");
				s = s.replace(/&#10;/g, "<br/>"); // Also supported quoted newlines.
				return s;
			},
			all: function(s) {
				s = enrichMessage.url(s);
				s = enrichMessage.multiline(s);
				return s;
			}
		};
		return enrichMessage;

	}];

});

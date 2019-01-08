

"use strict";
define(["angular"], function(angular) {

	// dialogs
	return ["$window", "$modal", "$templateCache", "translation", function($window, $modal, $templateCache, translation) {

		return {

			create: function(url, controller, data, opts) {

				return $modal.open({
					templateUrl: url,
					controller: controller,
					keyboard : opts.kb === undefined ? true : opts.kb,
					backdrop : opts.bd === undefined ? true : opts.bd,
					windowClass: opts.wc,
					size: opts.ws,
					resolve: {
						data: function() {
							return data;
						}
					}
				});

			}

		}

	}];

});

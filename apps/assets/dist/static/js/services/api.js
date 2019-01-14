

"use strict";
define([
	'mediastream/api'
], function(Api) {
	return ["globalContext", "connector", function(context, connector) {
		return new Api(context.Cfg.Version, connector);
	}];
});

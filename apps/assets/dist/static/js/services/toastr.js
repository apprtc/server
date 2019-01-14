

"use strict";
define(['toastr'], function(toastr) {

	// toastr
	return [function() {

		// set default options
		toastr.options = {
			"debug": false,
			"positionClass": "toast-bottom-right",
			"onclick": null,
			"showMethod": "show",
			"hideMethod": "hide",
			"timeOut": 0,
			"extendedTimeOut": 0,
			"closeButton": true
		}

		return toastr;

	}];

});

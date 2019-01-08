

"use strict";
define(['text!partials/defaultdialog.html'], function(defaultDialogTemplate) {

	// defautlDialog
	return [function() {

		return {
			restrict: "AC",
			replace: true,
			transclude: true,
			template: defaultDialogTemplate
		}

	}];

});

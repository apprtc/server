

"use strict";
define([], function() {

	// UsersettingsController
	return ["$scope", "$element", "mediaStream", "safeApply", "$window", function($scope, $element, mediaStream, safeApply, $window) {

		$scope.withUsersForget = true;

		this.registerUserid = function(event) {

			var successHandler = function(data) {
				console.info("Created new userid:", data.userid);
				// If the server provided us a nonce, we can do everthing on our own.
				mediaStream.users.store(data);
				$scope.loadedUserlogin = true;
				safeApply($scope);
				// Directly authenticate ourselves with the provided nonce.
				mediaStream.api.requestAuthentication(data.userid, data.nonce);
				delete data.nonce;
			};

			var form = null;
			if (event && event.target) {
				form = event.target.form;
			}

			console.log("No userid - creating one ...");
			mediaStream.users.register(form, function(data) {
				if (data.nonce) {
					successHandler(data);
				} else {
					// No nonce received. So this means something we cannot do on our own.
					// Make are GET request and retrieve nonce that way and let the
					// browser/server do the rest.
					mediaStream.users.authorize(data, successHandler, function(data, status) {
						console.error("Failed to get nonce after create", status, data);
					});
				}
			}, function(data, status) {
				console.error("Failed to create userid", status, data);
			});

		};

		this.forgetUserid = function() {
			mediaStream.users.forget();
			mediaStream.webrtc.doHangup("forgetUserid");
			$window.setTimeout(function() {
				mediaStream.connector.forgetAndReconnect();
			}, 0);
		};

	}];

});

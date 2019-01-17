

"use strict";
define([
	'require',
	'jquery',
	'underscore',
	'angular',
	'modernizr',
	'moment',

	'services/services',
	'directives/directives',
	'filters/filters',
	'controllers/controllers',

	'ui-bootstrap',
	'angular-sanitize',
	'angular-animate',
	'angular-humanize',
	'angular-route',

], function(require, $, _, angular, modernizr, moment, services, directives, filters, controllers) {

	// Simple and fast split based URL query parser based on location.search. We require this before the
	// angular App is bootstrap to control initialization parameters like translation based on URL parameters.
	var urlQuery = (function() {
		return (function(a) {
			if (a === "") {
				return {};
			}
			var b = {};
			for (var i = 0; i < a.length; ++i) {
				var p = a[i].split('=');
				if (p.length != 2) {
					continue;
				}
				b[p[0]] = window.decodeURIComponent(p[1].replace(/\+/g, " "));
			}
			return b;
		})(window.location.search.substr(1).split("&"));
	}());

	// Base application config shared during initialization.
	var appConfig = {};

	var create = function(ms, launcher) {
		var modules = ['ui.bootstrap', 'ngSanitize', 'ngAnimate', 'ngHumanize', 'ngRoute'];
		if (ms && ms.length) {
			_.each(ms, function(module) {
				modules.push(module);
			});
		}

		var app = angular.module('app', modules);
		services.initialize(app);
		directives.initialize(app);
		filters.initialize(app);
		controllers.initialize(app);

		app.config(["$compileProvider", "$locationProvider", "$routeProvider", function($compileProvider, $locationProvider, $routeProvider) {
			// Allow angular to use filesystem: hrefs which would else be prefixed with unsafe:.
			$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|filesystem|blob):/);
			$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|filesystem|blob):|data:image\//);
			// Setup routing
			$routeProvider.when("/:room*", {});
			// Use HTML5 routing.
			$locationProvider.html5Mode(true);
		}]);

		app.run(["$rootScope", "$timeout", "mediaStream", "continueConnector", function($rootScope, $timeout, mediaStream, continueConnector) {
			console.log("Initializing ...");
			var initialize = continueConnector.defer();
			mediaStream.initialize($rootScope);
			$timeout(function() {
				console.log("Initializing complete.")
				initialize.resolve();
			}, 0);
		}]);

		app.directive("spreedWebrtc", [function() {
			return {
				restrict: "A",
				scope: false,
				controller: "AppController"
			}
		}]);

		// app.directive("uiLogo", ["globalContext", function(globalContext) {
		// 	return {
		// 		restrict: "A",
		// 		link: function($scope, $element, $attrs) {
		// 			$attrs.$set("title", globalContext.Cfg.Title || "");
		// 		}
		// 	}
		// }]);

		return app;

	};

	// Our client side API version as float. This value is incremented on
	// breaking changes to plugins can check on it.
	var apiversion = 1.1;

	var initialize = function(app, launcher) {

		var deferred = launcher.$q.defer();

		var globalContext = JSON.parse(document.getElementById("globalcontext").innerHTML);
		if (!globalContext.Cfg.Version) {
            globalContext.Cfg.Version = "unknown";
        }
		app.constant("globalContext", globalContext);

		// Configure language.
		var lang = (function() {

			var lang = "en";
			var wanted = [];
			var addLanguage = function(l) {
				wanted.push(l);
				if (l.indexOf("-") != -1) {
					wanted.push(l.split("-")[0]);
				}
			};

			// Get from storage.
			if (modernizr.localstorage) {
				var lsl = localStorage.getItem("mediastream-language");
				if (lsl && lsl !== "undefined") {
					wanted.push(lsl);
				}
			}


			// Storage at DOM.
			var html = document.getElementsByTagName("html")[0];
			html.setAttribute("lang", "zh-CN");

			return lang;

		}());
		console.info("Selected language: "+lang);

		// Set momemt language.
		moment.lang(lang);
	};

	return {
		create: create,
		initialize: initialize,
		query: urlQuery,
		config: appConfig,
		apiversion: apiversion
	};

});

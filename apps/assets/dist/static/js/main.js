

"use strict";
require.config({
	waitSeconds: 300,
	paths: {
		// Major libraries
		"text": "libs/require/text",
		"jquery": 'libs/jquery/jquery.min',
		"underscore": 'libs/lodash.min', // alternative to underscore
		"modernizr": 'libs/modernizr',
		'webrtc.adapter': 'libs/webrtc.adapter',
		'RecordRTC': 'libs/RecordRTC',
		'angular': 'libs/angular/angular.min',
		'ui-bootstrap': 'libs/angular/ui-bootstrap-tpls.min',
		'angular-sanitize': 'libs/angular/angular-sanitize.min',
		'angular-animate': 'libs/angular/angular-animate.min',
		'angular-route': 'libs/angular/angular-route.min',

		'partials': '../partials',
	},
	shim: {
		'modernizr': {
			exports: 'Modernizr'
		},
		'underscore': {
			exports: '_'
		},
		'angular': {
			deps: ['jquery'],
			exports: 'angular'
		},
		'ui-bootstrap': {
			deps: ['angular']
		},
		'angular-sanitize': {
			deps: ['angular'],
			exports: 'angular'
		},
		'angular-animate': {
			deps: ['angular'],
			exports: 'angular'
		}
	}
});


(function () {
	var debugDefault = window.location.href.match(/(\?|&)debug($|&|=)/);
	// Overwrite console to not log stuff per default.
	// Write debug(true) in console to enable or start with ?debug parameter.
	window.consoleBackup = null;
	window.debug = function (flag) {
		if (!flag) {
			if (window.consoleBackup === null) {
				window.consoleBackup = window.console;
			}
			window.console = {
				log: function () { },
				info: function () { },
				warn: function () { },
				error: function () { },
				debug: function () { },
				trace: function () { }
			}
		} else {
			if (window.consoleBackup) {
				window.console = window.consoleBackup;
			}
		}
	};
	window.debug(debugDefault && true);
}());

require.onError = (function () {
	return function (err) {
		if (err.requireType === "timeout" || err.requireType === "scripterror") {
			console.error("Error while loading " + err.requireType, err.requireModules);
		} else {
			throw err;
		}
	};
}());



define([
	'jquery',
	'underscore',
	'angular',
	'require',
	'base'], function ($, _, angular, require) {


		var launcherApp = angular.module('launcherApp', []);
		launcherApp.run(["$q", "$window", "$http", function ($q, $window, $http) {

			// Dynamic app loader with plugin support.
			var load = ['app'];
			_.each($window.document.getElementsByTagName('script'), function (script) {
				var dataPlugin = script.getAttribute('data-plugin');
				if (dataPlugin) {
					load.push(dataPlugin);
				}
			});

			require(load, function (App) {

				// All other arguments are plugins.
				var args = Array.prototype.slice.call(arguments, 1);

				// Prepare our promised based initialization.
				var promises = [];
				var loading = $q.defer();
				promises.push(loading.promise);

				// Add Angular modules from plugins.
				var modules = [];
				_.each(args, function (plugin) {
					if (plugin && plugin.module) {
						plugin.module(modules);
					}
				});

				// External plugin support.
				var externalPlugin;
				if ($window.externalPlugin) {
					externalPlugin = $window.externalPlugin($, _, angular, App);
					if (externalPlugin && externalPlugin.module) {
						externalPlugin.module(modules);
					}
				}

				// Launcher helper API.
				var launcher = {
					$q: $q,
					$http: $http
				};

				// Create Angular app.
				var app = App.create(modules, launcher);

				// Helper function to initialize with deferreds.
				var initialize = function (obj) {
					if (obj && obj.initialize) {
						var result = obj.initialize(app, launcher);
						if (result && result.then) {
							// If we got a promise add it to our wait queue.
							promises.push(result);
						}
					}
				};

				// Wait until dom is ready before we initialize.
				angular.element(document).ready(function () {

					// Init base application.
					initialize(App);

					// Init plugins.
					_.each(args, function (plugin) {
						initialize(plugin);
					});

					// Init external plugin.
					if (externalPlugin) {
						initialize(externalPlugin);
					}

					// Resolve the base loader.
					loading.resolve();

					// Wait for all others to complete and then boostrap the main app.
					$q.all(promises).then(function () {
						console.log("Bootstrapping ...");
						angular.bootstrap(document.body, ['app'], {
							strictDi: true
						});
					});

				});

			});

		}]);

		// Bootstrap our launcher app.
		console.log("Launching ...");
		angular.bootstrap(null, ['launcherApp'], {
			strictDi: true
		});

	});

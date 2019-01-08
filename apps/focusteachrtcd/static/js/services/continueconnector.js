

"use strict";
define(['underscore'], function(_) {

	// Helper class to kill of old defers.
	var Caller = function(ref) {
		this.ref = ref;
	};
	Caller.prototype.disable = function() {
		this.ref = null;
	}
	Caller.prototype.resolve = function(value) {
		if (this.ref) {
			_.bind(this.ref.resolve, this.ref)(value);
		}
	};
	Caller.prototype.reject = function(reason) {
		if (this.ref) {
			_.bind(this.ref.reject, this.ref)(reason);
		}
	};
	Caller.prototype.notify = function(value) {
		if (this.ref) {
			_.bind(this.ref.notify, this.ref)(value);
		}
	};

	// continueConnector
	return ["$q", function($q) {

		var ContinueConnector = function() {
			this.deferred = $q.defer();
			this.promises = [];
			this.thens = [];
			this.current = null;
		};

		ContinueConnector.prototype.add = function(promise) {

			this.promises.push(promise);
			this.refresh();

		};

		ContinueConnector.prototype.remove = function(promise) {

			this.promises = _.without(this.promises, promise);
			this.refresh();

		};

		ContinueConnector.prototype.refresh = function() {

			// Disable old ones.
			if (this.current) {
				this.current.disable();
			}
			// Prepare caller.
			var current = this.current = new Caller(this);
			// Create new promise for all registered promises.
			var all = $q.all(this.promises);
			all.then(_.bind(current.resolve, current), _.bind(current.reject, current), _.bind(current.notify, current));
		};

		ContinueConnector.prototype.defer = function() {
			var deferred = $q.defer();
			this.add(deferred.promise);
			return deferred;
		};

		ContinueConnector.prototype.resolve = function(value) {
			//console.log("Continue connector resolved", arguments);
			this.deferred.resolve(value);
		};

		ContinueConnector.prototype.reject = function(reason) {
			this.deferred.reject(reason);
		};

		ContinueConnector.prototype.notify = function(value) {
			this.deferred.notify(value);
		};

		ContinueConnector.prototype.then = function(successCallback, errorCallback, notifyCallback) {
			this.thens.push(arguments);
			return this.deferred.promise.then(successCallback, errorCallback, notifyCallback);
		};

		ContinueConnector.prototype.reset = function() {
			this.deferred = $q.defer();
			var p = this.deferred.promise;
			_.each(this.thens, function(args) {
				p.then.apply(p, args);
			});
			this.refresh();
		};

		return new ContinueConnector();

	}];

});



"use strict";
define(["modernizr"], function(Modernizr) {

	// localStorage
	return ["$window", function($window) {

		// PersistentStorage (c)2015 struktur AG. MIT license.
		var PersistentStorage = function(prefix) {
			this.prefix = prefix ? prefix : "ps";
			this.isPersistentStorage = true;
		};
		PersistentStorage.prototype.setItem = function(key, data) {
			var name = this.prefix+"_"+key;
			$window.document.cookie = name + "=" + data + "; path=/";
		};
		PersistentStorage.prototype.getItem = function(key) {
			var name = this.prefix+"_"+key+"=";
			var ca = $window.document.cookie.split(';');
			for (var i=0; i<ca.length; i++) {
				var c = ca[i].trim();
				if (c.indexOf(name) === 0) {
					return c.substring(name.length, c.length);
				}
			}
			return null;
		};
		PersistentStorage.prototype.removeItem = function(key) {
			var name = this.prefix+"_"+key;
			$window.document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
		};

		var storage;
		if (Modernizr.localstorage) {
			storage = $window.localStorage;
		} else {
			storage = new PersistentStorage();
		}

		// public API.
		return {
			setItem: function(key, data) {
				return storage.setItem(key, data);
			},
			getItem: function(key) {
				return storage.getItem(key);
			},
			removeItem: function(key) {
				return storage.removeItem(key);
			}
		}

	}];

});

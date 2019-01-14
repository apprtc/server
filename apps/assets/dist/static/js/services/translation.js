

"use strict";
define(["jed", "underscore"], function(Jed, _) {

	var TranslationScope = function(service, context, domain) {

		var i18n = service.i18n;

		// _
		this._ = _.bind(function() {
			if (domain && context) {
				return _.bind(function(singular) {
					var vars = Array.prototype.slice.call(arguments, 1);
					var r = i18n.translate(singular).onDomain(domain).withContext(context);
					return r.fetch.apply(r, vars);
				}, this);
			} else if (domain) {
				return _.bind(function(singular) {
					var vars = Array.prototype.slice.call(arguments, 1);
					var r = i18n.translate(singular).onDomain(domain);
					return r.fetch.apply(r, vars);
				}, this);
			} else if (context) {
				return _.bind(function(singular) {
					var vars = Array.prototype.slice.call(arguments, 1);
					var r = i18n.translate(singular).withContext(context);
					return r.fetch.apply(r, vars);
				}, this);
			} else {
				return _.bind(function(singular) {
					var vars = Array.prototype.slice.call(arguments, 1);
					var r = i18n.translate(singular);
					return r.fetch.apply(r, vars);
				}, this);
			}
		}, this)();

		// _n
		this._n = _.bind(function() {
			if (domain && context) {
				return _.bind(function(singular, plural) {
					var vars = Array.prototype.slice.call(arguments, 2);
					var r = i18n.translate(singular).onDomain(domain).withContext(context).ifPlural(vars[0], plural);
					return r.fetch.apply(r, vars);
				});
			} else if (domain) {
				return _.bind(function(singular, plural) {
					var vars = Array.prototype.slice.call(arguments, 2);
					var r = i18n.translate(singular).onDomain(domain).ifPlural(vars[0], plural);
					return r.fetch.apply(r, vars);
				});
			} else if (context) {
				return _.bind(function(singular, plural) {
					var vars = Array.prototype.slice.call(arguments, 2);
					var r = i18n.translate(singular).withContext(context).ifPlural(vars[0], plural);
					return r.fetch.apply(r, vars);
				});
			} else {
				return _.bind(function(singular, plural) {
					var vars = Array.prototype.slice.call(arguments, 2);
					var r = i18n.translate(singular).ifPlural(vars[0], plural);
					return r.fetch.apply(r, vars);
				})
			}
		}, this)();

	};

	var TranslationService = function(translationData) {
		this.i18n = new Jed(translationData);
		var ts = new TranslationScope(this);
		this._ = _.bind(ts._, ts);
		this._n = _.bind(ts._n, ts);
	};

	TranslationService.prototype.inject = function(obj, context, domain) {
		// Inject our functions into objects.
		var ts = new TranslationScope(this, context, domain);
		obj._ = _.bind(ts._, ts);
		obj._n = _.bind(ts._n, ts);
		//console.log("Injected translation service", ts, obj);
		return obj;
	};

	return ["translationData", function(translationData) {
		var translationService = new TranslationService(translationData);
		return translationService;
	}];

});

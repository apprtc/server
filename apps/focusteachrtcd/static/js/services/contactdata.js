

"use strict";
define(['underscore', 'jquery'], function(_, $) {

	// contactData
	return [function() {

		var contacts = {};
		var users = {};
		var count = 0;

		var contactData = {
			clear: function(cb) {
				_.each(users, _.bind(function(idx, userid) {
					var contact = contacts[idx];
					if (cb && contact) {
						cb(contact);
					}
					this.remove(userid);
				}, this));
				count = 0;
			},
			addByRequest: function(request, status) {
				//console.log("addByRequest", request, status);
				var userid = request.Userid;
				var token = request.Token;
				var id;
				if (users.hasOwnProperty(userid)) {
					// Existing contact. Replace it.
					id = users[userid];
				} else {
					id = String(count++);
					users[userid] = id;
				}
				var contact = contacts[id] = {
					Id: "contact-"+id,
					Userid: userid,
					Token: token,
					Status: null
				}
				return contact;
			},
			addByData: function(data) {
				//console.log("addByData", data.Userid, data);
				var userid = data.Userid;
				var id;
				if (users.hasOwnProperty(userid)) {
					id = users[userid];
				} else {
					id = String(count++);
					users[userid] = id;
				}
				var contact = contacts[id] = data;
				contact.Id = id;
				return contact;
			},
			get: function(userid) {
				if (users.hasOwnProperty(userid)) {
					var id = users[userid];
					return contacts[id];
				}
				return null;
			},
			remove: function(userid) {
				if (users.hasOwnProperty(userid)) {
					var id = users[userid];
					delete contacts[id];
				}
				delete users[userid];
			},
			getById: function(id) {
				if (id.indexOf("contact-") === 0) {
					id = id.substr(8);
				}
				if (contacts.hasOwnProperty(id)) {
					return contacts[id];
				}
				return null;
			},
			getAll: function() {
				return _.values(contacts);
			}
		};

		return contactData;

	}];

});

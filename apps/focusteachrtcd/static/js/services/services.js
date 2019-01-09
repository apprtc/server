

"use strict";
define([
	'underscore',

	'services/desktopnotify',
	'services/playsound',
	'services/safeapply',
	'services/connector',
	'services/api',
	'services/webrtc',
	'services/mediastream',
	'services/appdata',
	'services/buddydata',
	'services/buddylist',
	'services/buddypicture',
	'services/enrichmessage',
	'services/safemessage',
	'services/alertify',
	'services/toastr',
	'services/visibility',
	'services/translation',
	'services/mediasources',
	'services/fileupload',
	'services/filedownload',
	'services/filedata',
	'services/filetransfer',
	'services/safedisplayname',
	'services/randomgen',
	'services/fastscroll',
	'services/videowaiter',
	'services/videolayout',
	'services/contactdata',
	'services/contacts',
	'services/buddysession',
	'services/localstorage',
	'services/animationframe',
	'services/dialogs',
	'services/continueconnector',
	'services/chromeextension',
	'services/usersettingsdata',
	'services/localstatus',
	'services/rooms',
	'services/resturl',
	'services/roompin',
	'services/constraints',
	'services/modules',
	'services/mediadevices',
	'services/dummystream',
	'services/usermedia',
	'services/playpromise'], function(_,
desktopNotify,
playSound,
safeApply,
connector,
api,
webrtc,
mediaStream,
appData,
buddyData,
buddyList,
buddyPicture,
enrichMessage,
safeMessage,
alertify,
toastr,
visibility,
translation,
mediaSources,
fileUpload,
fileDownload,
fileData,
fileTransfer,
safeDisplayName,
randomGen,
fastScroll,
videoWaiter,
videoLayout,
contactData,
contacts,
buddySession,
localStorage,
animationFrame,
dialogs,
continueConnector,
chromeExtension,
userSettingsData,
localStatus,
rooms,
restURL,
roompin,
constraints,
modules,
mediaDevices,
dummyStream,
userMedia,
playPromise) {

	var services = {
		desktopNotify: desktopNotify,
		playSound: playSound,
		safeApply: safeApply,
		connector: connector,
		api: api,
		webrtc: webrtc,
		mediaStream: mediaStream,
		appData: appData,
		buddyData: buddyData,
		buddyList: buddyList,
		buddyPicture: buddyPicture,
		enrichMessage: enrichMessage,
		safeMessage: safeMessage,
		alertify: alertify,
		toastr: toastr,
		visibility: visibility,
		translation: translation,
		mediaSources: mediaSources,
		fileUpload: fileUpload,
		fileDownload: fileDownload,
		fileData: fileData,
		fileTransfer: fileTransfer,
		safeDisplayName: safeDisplayName,
		randomGen: randomGen,
		fastScroll: fastScroll,
		videoWaiter: videoWaiter,
		videoLayout: videoLayout,
		contactData: contactData,
		contacts: contacts,
		buddySession: buddySession,
		localStorage: localStorage,
		animationFrame: animationFrame,
		dialogs: dialogs,
		continueConnector: continueConnector,
		chromeExtension: chromeExtension,
		userSettingsData: userSettingsData,
		localStatus: localStatus,
		rooms: rooms,
		restURL: restURL,
		roompin: roompin,
		constraints: constraints,
		modules: modules,
		mediaDevices: mediaDevices,
		dummyStream: dummyStream,
		userMedia: userMedia,
		playPromise: playPromise
	};

	var initialize = function(angModule) {
		_.each(services, function(service, name) {
			angModule.factory(name, service);
		});
	};

	return {
		initialize: initialize
	};

});

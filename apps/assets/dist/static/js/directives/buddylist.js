

"use strict";
define(['underscore'], function (_, template) {

	// buddyList
	return ["api", "webrtc", function (api, webrtc) {

		//console.log("buddyList directive");

		var controller = ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {		
			api.e.on("received.users", function (event, data) {
				console.log('received.users:', data);
				var selfId = $scope.id;

				for (let index = 0; index < data.length; index++) {
					const p = data[index];

					if (p.Id !== selfId) {
						// 对聊天室内的第一个好友进行自动呼叫
						webrtc.doCall(p.Id);
						break;
					}	
				}
				$scope.$apply();
			});
		}];

		return {
			restrict: 'E',
			replace: true,
			scope: true,
			controller: controller
		}

	}];

});

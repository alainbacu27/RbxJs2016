const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v2/stream-notifications/unread-count', (req, res) => {
            res.json({
                "unreadNotifications": 0,
                "statusMessage": null
            });
        });

        app.get("/notifications/abort", (req, res) => {
            app.json({})
        });

        app.get("/v2/push-notifications/chrome-manifest", (req, res) => {
            res.json({
                "name": "Roblox",
                "gcm_sender_id": "100155320909"
            });
        });

        app.get("/v2/notifications/get-settings", (req, res) => {
            res.json({
                "notificationBandSettings": [{
                    "notificationSourceType": "Test",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "Test",
                    "receiverDestinationType": "MobilePush",
                    "isEnabled": true,
                    "isOverridable": false,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": [{
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1225142274,
                        "isEnabled": true,
                        "isSetByReceiver": false
                    }, {
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1369865291,
                        "isEnabled": true,
                        "isSetByReceiver": false
                    }]
                }, {
                    "notificationSourceType": "Test",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": false,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "FriendRequestReceived",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "FriendRequestReceived",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "FriendRequestReceived",
                    "receiverDestinationType": "MobilePush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": [{
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1225142274,
                        "isEnabled": false,
                        "isSetByReceiver": false
                    }, {
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1369865291,
                        "isEnabled": false,
                        "isSetByReceiver": false
                    }]
                }, {
                    "notificationSourceType": "FriendRequestAccepted",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "FriendRequestAccepted",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": false,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "FriendRequestAccepted",
                    "receiverDestinationType": "MobilePush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": [{
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1225142274,
                        "isEnabled": false,
                        "isSetByReceiver": false
                    }, {
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1369865291,
                        "isEnabled": false,
                        "isSetByReceiver": false
                    }]
                }, {
                    "notificationSourceType": "ChatNewMessage",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "ChatNewMessage",
                    "receiverDestinationType": "MobilePush",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": [{
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1225142274,
                        "isEnabled": true,
                        "isSetByReceiver": false
                    }, {
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1369865291,
                        "isEnabled": true,
                        "isSetByReceiver": false
                    }]
                }, {
                    "notificationSourceType": "PrivateMessageReceived",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "PrivateMessageReceived",
                    "receiverDestinationType": "MobilePush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": [{
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1225142274,
                        "isEnabled": false,
                        "isSetByReceiver": false
                    }, {
                        "name": "Android on Android: high-end phone",
                        "platform": "AndroidNative",
                        "destinationId": 1369865291,
                        "isEnabled": false,
                        "isSetByReceiver": false
                    }]
                }, {
                    "notificationSourceType": "PrivateMessageReceived",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "UserAddedToPrivateServerWhiteList",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": false,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "TeamCreateInvite",
                    "receiverDestinationType": "DesktopPush",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "GameUpdate",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "DeveloperMetricsAvailable",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }, {
                    "notificationSourceType": "GroupJoinRequestAccepted",
                    "receiverDestinationType": "NotificationStream",
                    "isEnabled": true,
                    "isOverridable": true,
                    "isSetByReceiver": false,
                    "pushNotificationDestinationPreferences": []
                }],
                "optedOutNotificationSourceTypes": [],
                "optedOutReceiverDestinationTypes": []
            });
        });
    }
}
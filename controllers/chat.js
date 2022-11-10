const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v2/get-unread-conversation-count", (req, res) => {
            res.json({
                "count": 0
            })
        });

        app.post("/v2/start-one-to-one-conversation", (req, res) => {
            const participantUserId = req.body.participantUserId;

        });

        app.post("/v2/send-message", db.requireAuth, async (req, res) => {
            const conversationId = parseInt(req.body.conversationId);
            const message = req.body.message;
            const sent = await db.sendChatMessage(req.user.userid, conversationId, message);
            if (!sent){
                res.json({
                    "content": message,
                    "filteredForReceivers": false,
                    "messageId": sent.id,
                    "sent": db.unixToDate(sent.created).toLocaleString(),
                    "messageType": "PlainText",
                    "resultType": "Failed",
                    "statusMessage": "Failed to send the message"
                });
                return;
            }
            res.json({
                "content": message,
                "filteredForReceivers": false,
                "messageId": sent.id,
                "sent": db.unixToDate(sent.created).toLocaleString(),
                "messageType": "PlainText",
                "resultType": "Success",
                "statusMessage": "Successfully sent the message"
            });
        });

        app.get("/v2/multi-get-latest-messages", db.requireAuth, async (req, res) => {
            console.log(req.query);
            const friendsTmp = await db.getFriends(req.user.userid);
            let friends = [];
            for (let i = 0; i < friendsTmp.length; i++){
                friends.push(friendsTmp[i].userid);
            }
            const conversationIds = req.query.conversationIds ? req.query.conversationIds.split(",") : friends;
            const pageSize = parseInt(req.query.pageSize);
            if (pageSize < 1 || pageSize > 100) {
                res.status(400).json({
                    "error": "Invalid page size"
                });
                return;
            }
            let response = [];
            for (let i = 0; i < conversationIds.length; i++) {
                const conversationId = typeof conversationIds[i] == "string" ? parseInt(conversationIds[i]) : conversationIds[i];
                const messages = await db.getChatMessages(req.user.userid, conversationId, pageSize);
                let formattedMessages = [];
                for (let j = 0; j < messages.length; j++) {
                    const message = messages[j];
                    formattedMessages.push({
                        "id": message.id,
                        "senderType": message.senderType,
                        "sent": db.unixToDate(message.created).toLocaleString(),
                        "read": false,
                        "messageType": "PlainText",
                        "decorators": [""],
                        "senderTargetId": message.userid,
                        "content": message.content
                    });
                }
                response.push({
                    "conversationId": conversationId,
                    "chatMessages": formattedMessages
                });
            }
        });

        app.get("/v2/get-messages", (req, res) => {
            const conversationId = req.query.conversationId;
            const pageSize = parseInt(req.query.pageSize);
            res.json([]);
        });

        app.get("/v2/chat-settings", (req, res) => {
            res.json({
                "chatEnabled": true,
                "isActiveChatUser": false,
                "isConnectTabEnabled": true
            });
        });

        app.get("/v2/metadata", (req, res) => {
            res.json({
                "isChatEnabledByPrivacySetting": 1,
                "languageForPrivacySettingUnavailable": "Chat is currently unavailable",
                "maxConversationTitleLength": 150,
                "numberOfMembersForPartyChrome": 6,
                "partyChromeDisplayTimeStampInterval": 300000,
                "signalRDisconnectionResponseInMilliseconds": 3000,
                "typingInChatFromSenderThrottleMs": 5000,
                "typingInChatForReceiverExpirationMs": 8000,
                "relativeValueToRecordUiPerformance": 0.0,
                "isChatDataFromLocalStorageEnabled": false,
                "chatDataFromLocalStorageExpirationSeconds": 30,
                "isUsingCacheToLoadFriendsInfoEnabled": false,
                "cachedDataFromLocalStorageExpirationMS": 30000,
                "senderTypesForUnknownMessageTypeError": ["User"],
                "isInvalidMessageTypeFallbackEnabled": false,
                "isRespectingMessageTypeEnabled": true,
                "validMessageTypesWhiteList": ["PlainText", "Link"],
                "shouldRespectConversationHasUnreadMessageToMarkAsRead": true,
                "isAliasChatForClientSideEnabled": true,
                "isPlayTogetherForGameCardsEnabled": true,
                "isRoactChatEnabled": true
            });
        });

        app.post("/v2/start-cloud-edit-conversation", db.requireAuth2, (req, res) => {
            if (!req.user) {
                res.status(401).json({});
                return;
            }
            const placeId = parseInt(req.body.placeId);
            res.json({
                "conversation": {
                    "id": 1,
                    "title": req.user.userid,
                    "initiator": {
                        "type": "User",
                        "targetId": req.user.userid,
                        "name": req.user.username,
                        "displayName": req.user.username
                    },
                    "hasUnreadMessages": null,
                    "participants": [{
                        "type": "User",
                        "targetId": req.user.userid,
                        "name": req.user.username,
                        "displayName": req.user.username
                    }],
                    "conversationType": "CloudEditConversation",
                    "conversationTitle": {
                        "titleForViewer": req.user.username,
                        "isDefaultTitle": true
                    },
                    "lastUpdated": "2022-06-01T20:30:46.1236683Z",
                    "conversationUniverse": null
                },
                "rejectedParticipants": null,
                "resultType": "Success",
                "statusMessage": "Success"
            });
        });

        app.post("/v2/add-to-conversation", (req, res) => {
            const participantUserIds = req.body.participantUserIds;
            const conversationId = parseInt(req.body.conversationId);
            res.json({
                "conversationId": conversationId,
                "rejectedParticipants": [],
                "resultType": "Success",
                "statusMessage": "Successfully added the users to the conversation"
            });
        });

        app.post("/v2/mark-as-read", (req, res) => {
            const conversationId = parseInt(req.body.conversationId);
            res.json({
                "resultType": "Success"
            });
        });

        app.get("/v2/get-messages", (req, res) => {
            const conversationId = parseInt(req.query.conversationId);
            const pageSize = parseInt(req.query.pageSize);
            res.json([]);
        });

        app.get("/v2/get-user-conversations", db.requireAuth, (req, res) => {
            const pageNumber = req.query.pageNumber;
            const pageSize = req.query.pageSize;
            res.json([
                /*
                        {
                                "id": 1,
                                "title": "joey",
                                "initiator": {
                                    "type": "User",
                                    "targetId": 2,
                                    "name": "Builderman",
                                    "displayName": "Builderman"
                                },
                                "hasUnreadMessages": false,
                                "participants": [{
                                    "type": "User",
                                    "targetId": req.user.userid,
                                    "name": req.user.username,
                                    "displayName": req.user.username
                                }, {
                                    "type": "User",
                                    "targetId": 2,
                                    "name": "Builderman",
                                    "displayName": "Builderman"
                                }],
                                "conversationType": "OneToOneConversation",
                                "conversationTitle": {
                                    "titleForViewer": "Builderman",
                                    "isDefaultTitle": true
                                },
                                "lastUpdated": "2022-05-13T09:46:19.317Z",
                                "conversationUniverse": null
                            }
                        */
            ]);
        });
    }
}
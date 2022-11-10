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

        app.get("/v2/chat-settings", (req, res) => {
            res.json({
                "chatEnabled": true,
                "isActiveChatUser": false,
                "isConnectTabEnabled": true
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
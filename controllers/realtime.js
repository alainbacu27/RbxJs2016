const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/notifications/negotiate', (req, res) => {
            res.json({
                "Url": "/notifications",
                "ConnectionToken": "FF==",
                "ConnectionId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "KeepAliveTimeout": 20.0,
                "DisconnectTimeout": 30.0,
                "ConnectionTimeout": 110.0,
                "TryWebSockets": true,
                "ProtocolVersion": "1.5",
                "TransportConnectTimeout": 5.0,
                "LongPollDelay": 0.0
            });
        });

        app.get('/notifications/start', (req, res) => {
            res.json({
                "Response": "started"
            });
        });

        app.get('/notifications/connect', (req, res) => {
            res.json({});
        });

        app.get('/notifications/abort', (req, res) => {
            res.json({
                "Response": "aborted"
            });
        });

        app.post('/notifications/abort', (req, res) => {
            res.json({
                "Response": "aborted"
            });
        });

        app.get('/client-status', db.requireAuth, async (req, res) => {
            res.send(await db.getUserLaunchStatus2(req.user.userid));
        });
    }
}
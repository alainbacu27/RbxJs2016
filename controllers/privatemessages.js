const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/messages/unread/count', (req, res) => {
            res.json({
                "count": 0 // TODO: Implement private messaging system.
            });
        });

        app.get("/v1/announcements/metadata", (req, res) => {
            res.json({
                "numOfAnnouncements": 0
            })
        });

        app.get("/v1/messages", (req, res) => {
            const messageTab = req.query.messageTab;
            const pageNumber = parseInt(req.query.pageNumber);
            const pageSize = parseInt(req.query.pageSize);
            res.json({
                "collection": [],
                "totalCollectionSize": 0,
                "totalPages": 1,
                "pageNumber": pageNumber
            })
        });

        app.get("/v1/announcements", (req, res) => {
            res.json({
                "collection": [],
                "totalCollectionSize": 0
            });
        });
    }
}
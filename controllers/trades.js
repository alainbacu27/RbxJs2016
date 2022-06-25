const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/trades/inbound/count', (req, res) => {
            res.json({
                "count": 0 // TODO: Implement trading system.
            });
        });

        app.get("/v1/trades/inbound", (req, res) => {
            const sortOrder = req.query.sortOrder;
            const limit = parseInt(req.query.limit);
            const cursor = req.query.cursor;
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });

        app.post("/v1/trades/expire-outdated", (req, res) => {
            res.json({});
        });

        app.get("/v1/trades/outbound", (req, res) => {
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit);
            const sortOrder = req.query.sortOrder || "Desc";
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });
        
        app.get("/v1/trades/completed", (req, res) => {
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit);
            const sortOrder = req.query.sortOrder || "Desc";
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });
        
        app.get("/v1/trades/inactive", (req, res) => {
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit);
            const sortOrder = req.query.sortOrder || "Desc";
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });
    }
}
const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v2/assets/:itemid/owners", (req, res) => {
            const limit = req.query.limit || 10;
            res.json({
                "errors": [{
                    "code": 2,
                    "message": "You do not have permission to view the owners of this asset.",
                    "userFacingMessage": "Something went wrong"
                }]
            });
        });

        app.get("/v2/users/:userid/inventory", (req, res) => {
            const assetTypes = req.query.assetTypes || "";
            const cursor = req.query.cursor || "";
            const limit = parseInt(req.query.limit) || 50;
            const sortOrder = req.query.sortOrder || "Desc";
            const userId = parseInt(req.params.userId);
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });

        app.get("/v2/users/:userid/inventory/:itemtype", (req, res) => {
            const assetTypes = req.query.assetTypes || "";
            const cursor = req.query.cursor || "";
            const limit = parseInt(req.query.limit) || 50;
            const sortOrder = req.query.sortOrder || "Desc";
            const userId = parseInt(req.params.userId);
            const itemtype = parseInt(req.params.itemtype);
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });
    }
}
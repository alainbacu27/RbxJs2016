const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v1/player-policies-client", (req, res) => {
            res.json({
                "isSubjectToChinaPolicies": false,
                "arePaidRandomItemsRestricted": false,
                "isPaidItemTradingAllowed": true,
                "allowedExternalLinkReferences": ["Discord", "YouTube", "Twitch", "Facebook"]
            });
        });

        app.post("/v1/autolocalization/games/:gameid/autolocalizationtable", (req, res) => {
            res.json({})
        });

        app.get("/v1/source-language/games/:gameid", (req, res) => {
            res.json({
                "name": null,
                "nativeName": null,
                "languageCode": null
            });
        });

        app.get("/v1/automatic-translation/games/:gameid/feature-status", (req, res) => {
            res.json({})
        });

        app.get("/games/:gameid/automatic-translation-status", (req, res) => {
            res.json({});
        });
    }
}
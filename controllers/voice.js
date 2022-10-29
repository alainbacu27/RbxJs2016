const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/settings', (req, res) => {
            res.json({
                "isVoiceEnabled": false,
                "isUserOptIn": false,
                "isUserEligible": false,
                "isBanned": false,
                "bannedUntil": null,
                "canVerifyAgeForVoice": true,
                "isVerifiedForVoice": false,
                "denialReason": 7,
                "isOptInDisabled": false
            });
        });

        app.get("/v1/settings/verify/show-age-verification-overlay/:userid", (req, res) => {
            const userid = parseInt(req.params.userid);
            const placeId = parseInt(req.query.placeId);
            res.json({
                "showAgeVerificationOverlay": false,
                "showVoiceOptInOverlay": false,
                "universePlaceVoiceEnabledSettings": {
                    "isUniverseEnabledForVoice": false,
                    "isPlaceEnabledForVoice": false,
                    "reasons": ["Could not fetch Spatial Voice settings, please try again later", "Could not fetch Spatial Voice settings, please try again later"]
                },
                "voiceSettings": null
            });
        });

        app.get("/v1/settings/universe/1", (req, res) => {
            res.json({
                "isUniverseEnabledForVoice": false
            })
        });
    }
}
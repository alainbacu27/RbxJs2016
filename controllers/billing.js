const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/parental-controls/get-settings', (req, res) => {
            res.json({
                "spendNotificationSetting": "NotificationsOnlyOnThresholdPassed",
                "monthlySpendLimitCurrencyType": "USD",
                "parentalSpendControlsCutOffAge": 13,
                "isMonthlySpendLimitSettingEnabledForUser": false,
                "isSpendNotificationSettingEnabledForUser": false,
                "canUserDisableMonthlySpendLimit": true,
                "maxMonthlySpendLimit": 10000.0
            });
        });
        app.get("/v1/developer-exchange-metadata", (req, res) => {
            res.json({
                "redirectUrl": null,
                "emailIsVerified": true,
                "minRobuxToCashOut": "999,999,999", // "50,000"
                "canProceedToCashout": false,
                "hasCurrencyOperationError": false,
                "currencyOperationErrorMessage": null,
                "robloxDevExHelpFullUrl": "https://en.help.rbx2016.nl/hc/en-us/articles/203314100"
            });
        });

        app.get("/v1/gamecard/redeem/metadata", (req, res) => {
            res.json({
                "isGiftCardUpsellEnabled": false,
                "pinPlaceholder": null,
                "isSinglePageEnabled": true
            });
        });

        app.get("/v1/credit", (req, res) => {
            res.json({
                "balance": 0.0000,
                "robuxAmount": 0,
                "canRedeemCreditForRobux": false
            });
        });

        app.post("/v1/gamecard/redeem", db.requireAuth, (req, res) => {
            const pinCode = req.body.pinCode;
            res.status(401).send();
        });
    }
}
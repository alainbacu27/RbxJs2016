const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/users/:user/currency', db.requireAuth2, (req, res) => {
            if (db.getSiteConfig().backend.robuxServiceEnabled == false) {
                res.status(400).json({
                    "errors": [{
                        "code": 1,
                        "message": "The robux service is disabled.",
                        "userFacingMessage": "Something went wrong"
                    }]
                });
                return;
            }
            const userid = parseInt(req.params.user);
            if (typeof req.user !== "undefined" && req.user.inviteKey != "" && req.user.userid == userid && !req.user.banned && user.inviteKey != "") {
                res.json({
                    "robux": req.user.robux
                });
            } else {
                res.status(400).json({
                    "errors": [{
                        "code": 1,
                        "message": "The user is invalid.",
                        "userFacingMessage": "Something went wrong"
                    }]
                });
            }
        });

        app.get("/v1/developer-exchange/info", db.requireAuth, (req, res) => {
            res.json({
                "hasCurrencyOperationError": !db.getSiteConfig().shared.devex.enabled,
                "currencyOperationErrorMessage": db.getSiteConfig().shared.devex.enabled ? "DevEx Disabled." : "",
                "showOnlyExchangeRates": db.getSiteConfig().shared.devex.showOnlyExchangeRates,
                "emailIsVerified": false,
                "isImbursementBlacklistUser": false,
                "canProceedToCashout": req.user.robux >= db.getSiteConfig().shared.devex.minRobuxToCashOut && db.getSiteConfig().shared.devex.enabled,
                "showProgressBar": db.getSiteConfig().shared.devex.showProgressBar,
                "percentRobux": req.user.robux / db.getSiteConfig().shared.devex.minRobuxToCashOut,
                "minRobuxToCashOut": db.getSiteConfig().shared.devex.minRobuxToCashOut, // 50000
                "maxRobuxCanCashOut": db.getSiteConfig().shared.devex.maxRobuxToCashOut, // 600000000
                "lastImbursementStatus": null,
                "lastImbursementSubmissionDate": null,
                "conversionPercent": db.getSiteConfig().shared.devex.conversionRate // 0.0035
            });
        });

        app.get("/v2/users/:userid/transaction-types", (req, res) => {
            res.json(db.getSiteConfig().frontend.transactionTypes);
        });

        app.get("/v2/users/:userid/transaction-totals", (req, res) => {
            res.json({
                "salesTotal": 0,
                "purchasesTotal": 0,
                "affiliateSalesTotal": 0,
                "groupPayoutsTotal": 0,
                "currencyPurchasesTotal": 0,
                "premiumStipendsTotal": 0,
                "tradeSystemEarningsTotal": 0,
                "tradeSystemCostsTotal": 0,
                "premiumPayoutsTotal": 0,
                "groupPremiumPayoutsTotal": 0,
                "adSpendTotal": 0,
                "developerExchangeTotal": 0,
                "pendingRobuxTotal": 0,
                "incomingRobuxTotal": 0,
                "outgoingRobuxTotal": 0,
                "individualToGroupTotal": 0,
                "csAdjustmentTotal": 0
            });
        });

        app.get("/v2/assets/:targetid/details", async (req, res) => {
            if (db.getSiteConfig().backend.productInfoEnabled == false) {
                req.status(404).render("404", await db.getBlankTemplateData());
                return;
            }
            const targetId = parseInt(req.params.targetid);
            const game = await db.getGame(targetId);
            if (game) {
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || creator.inviteKey == "") {
                    res.status(404).json({});
                    return;
                }
                res.json({
                    "TargetId": game.gameid,
                    "ProductType": null,
                    "AssetId": game.gameid,
                    "ProductId": 0,
                    "Name": game.gamename,
                    "Description": game.description,
                    "AssetTypeId": 9,
                    "Creator": {
                        "Id": creator.userid,
                        "Name": creator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": 1
                    },
                    "IconImageAssetId": game.gameid,
                    "Created": db.unixToDate(game.created).toISOString(),
                    "Updated": db.unixToDate(game.updated).toISOString(),
                    "PriceInRobux": null,
                    "PriceInTickets": null,
                    "Sales": 0,
                    "IsNew": false,
                    "IsForSale": false,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0,
                    "SaleAvailabilityLocations": null
                })
            }
        });

        app.post("/v1/purchases/products/:prodctid", async (req, res) => {
            if (db.getSiteConfig().backend.productInfoEnabled2 == false) {
                req.status(404).render("404", await db.getBlankTemplateData());
                return;
            }
            const productId = parseInt(req.params.prodctid);
            const expectedCurrency = parseInt(req.body.expectedCurrency);
            const expectedPrice = parseInt(req.body.expectedPrice);
            const expectedSellerId = parseInt(req.body.expectedSellerId);
            if (typeof req.headers["x-csrf-token"] !== "undefined") {
                if (req.headers["x-csrf-token"].length == 128) {
                    const user = await db.getUserByCsrfToken(req.headers["x-csrf-token"]);
                    if (user) {
                        res.json({
                            "purchased": false,
                            "reason": "NotForSale",
                            "productId": 1,
                            "statusCode": 500,
                            "title": "Item Not For Sale",
                            "errorMsg": "This item is not for sale.",
                            "showDivId": "TransactionFailureView",
                            "shortfallPrice": -user.robux,
                            "balanceAfterSale": user.robux,
                            "expectedPrice": expectedPrice,
                            "currency": 1,
                            "price": 0,
                            "assetId": productId
                        });
                        return;
                    }
                }
            }
            res.status(401).json({
                "errors": [{
                    "code": 0,
                    "message": "Authorization has been denied for this request."
                }]
            });
        });
    }
}
const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v1/users/:user/subscriptions", db.requireAuth, (req, res) => {
            const user = req.params.user;
            if (parseInt(user) != req.user.userid) {
                res.status(401).send();
                return;
            }
            res.json({
                "errorCode": 20,
                "errorMessage": "Subscription Not found for user",
                "subscriptionProductModel": null
            });
        });

        app.get("/v1/products", (req, res) => {
            if (db.getSiteConfig().shared.pages.robuxPurchasesVisible == false) {
                res.status(400).send();
                return;
            }
            res.json({
                "products": [{
                    "productId": 470,
                    "premiumFeatureId": 495,
                    "mobileProductId": "com.roblox.robloxmobile.Premium400Robux",
                    "robuxAmount": 400,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 4.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 400 Robux",
                    "name": "Premium 400 Robux"
                }, {
                    "productId": 471,
                    "premiumFeatureId": 496,
                    "mobileProductId": "com.roblox.robloxmobile.Premium800Robux",
                    "robuxAmount": 800,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 9.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 800 Robux",
                    "name": "Premium 800 Robux"
                }, {
                    "productId": 472,
                    "premiumFeatureId": 497,
                    "mobileProductId": "com.roblox.robloxmobile.Premium1700Robux",
                    "robuxAmount": 1700,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 19.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 1700 Robux",
                    "name": "Premium 1700 Robux"
                }, {
                    "productId": 473,
                    "premiumFeatureId": 498,
                    "mobileProductId": "com.roblox.robloxmobile.Premium4500Robux",
                    "robuxAmount": 4500,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 49.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 4500 Robux",
                    "name": "Premium 4500 Robux"
                }, {
                    "productId": 474,
                    "premiumFeatureId": 499,
                    "mobileProductId": "com.roblox.robloxmobile.Premium10000Robux",
                    "robuxAmount": 10000,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 99.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 10000 Robux",
                    "name": "Premium 10000 Robux"
                }, {
                    "productId": 475,
                    "premiumFeatureId": 500,
                    "mobileProductId": "com.roblox.robloxmobile.Premium440Subscribed2",
                    "robuxAmount": 440,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": true,
                    "price": {
                        "amount": 4.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 440 Subscribed",
                    "name": "Premium 440 Subscribed"
                }, {
                    "productId": 476,
                    "premiumFeatureId": 501,
                    "mobileProductId": "com.roblox.robloxmobile.Premium880Subscribed",
                    "robuxAmount": 880,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": true,
                    "price": {
                        "amount": 9.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 880 Subscribed",
                    "name": "Premium 880 Subscribed"
                }, {
                    "productId": 477,
                    "premiumFeatureId": 502,
                    "mobileProductId": "com.roblox.robloxmobile.Premium1870Subscribed",
                    "robuxAmount": 1870,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": true,
                    "price": {
                        "amount": 19.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 1870 Subscribed",
                    "name": "Premium 1870 Subscribed"
                }, {
                    "productId": 478,
                    "premiumFeatureId": 503,
                    "mobileProductId": "com.roblox.robloxmobile.Premium4950Subscribed",
                    "robuxAmount": 4950,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": true,
                    "price": {
                        "amount": 49.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 4950 Subscribed",
                    "name": "Premium 4950 Subscribed"
                }, {
                    "productId": 479,
                    "premiumFeatureId": 504,
                    "mobileProductId": "com.roblox.robloxmobile.Premium11000Subscribed",
                    "robuxAmount": 11000,
                    "premiumFeatureTypeName": "Robux",
                    "isSubscriptionOnly": true,
                    "price": {
                        "amount": 99.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Premium 11000 Subscribed",
                    "name": "Premium 11000 Subscribed"
                }, {
                    "productId": 480,
                    "premiumFeatureId": 505,
                    "mobileProductId": "com.roblox.robloxmobile.RobloxPremium450",
                    "robuxAmount": 450,
                    "premiumFeatureTypeName": "Subscription",
                    "subscriptionTypeName": "RobloxPremium450",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 4.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Roblox Premium 450",
                    "name": "Roblox Premium 450"
                }, {
                    "productId": 481,
                    "premiumFeatureId": 506,
                    "mobileProductId": "com.roblox.robloxmobile.RobloxPremium1000",
                    "robuxAmount": 1000,
                    "premiumFeatureTypeName": "Subscription",
                    "subscriptionTypeName": "RobloxPremium1000",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 9.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Roblox Premium 1000",
                    "name": "Roblox Premium 1000"
                }, {
                    "productId": 482,
                    "premiumFeatureId": 507,
                    "mobileProductId": "com.roblox.robloxmobile.RobloxPremium2200",
                    "robuxAmount": 2200,
                    "premiumFeatureTypeName": "Subscription",
                    "subscriptionTypeName": "RobloxPremium2200",
                    "isSubscriptionOnly": false,
                    "price": {
                        "amount": 19.9900,
                        "usdAmount": 0.0,
                        "currency": {
                            "id": 1,
                            "currencyType": 0,
                            "currencyName": "United States dollar",
                            "currencySymbol": "$"
                        }
                    },
                    "description": "Roblox Premium 2200",
                    "name": "Roblox Premium 2200"
                }]
            });
        });
    }
}
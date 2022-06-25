const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const bcrypt = require("bcryptjs");

module.exports = {
    init: (app, db) => {
        app.get('/v1/email', db.requireAuth, (req, res) => {
            res.json({
                "emailAddress": db.censorEmail(req.user.email),
                "verified": req.user.emailverified,
                "canBypassPasswordForEmailUpdate": false
            });
        });

        app.get("/v1/themes/user", db.requireAuth, async (req, res) => {
            res.json({
                "themeType": req.user.theme
            });
        });

        app.patch("/v1/themes/user", db.requireAuth, async (req, res) => {
            const themeType = req.body.themeType;
            if (themeType != "Light" && themeType != "Dark") {
                res.status(400).send({})
                return;
            }
            await db.setUserProperty(req.user.userid, "theme", themeType);
            res.json({});
        });

        app.get("/v1/themes/types", (req, res) => {
            res.json({
                "data": db.getSiteConfig().frontend.themes
            });
        });

        app.get("/v1/gender", db.requireAuth, (req, res) => {
            if (db.getSiteConfig().shared.users.gendersEnabled == false) {
                res.json({
                    "gender": 2
                });
                return;
            }
            res.json({
                "gender": req.user.gender + 1
            })
        })

        app.post("/v1/gender", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.gendersEnabled == false) {
                res.status(400).json({});
                return;
            }
            const gender = req.body.gender - 1;
            if (gender != 1 && gender != 2 && gender != 0) {
                res.status(400).send({})
                return;
            }
            await db.setUserProperty(req.user.userid, "gender", gender);
            res.json({});
        });

        app.get("/v1/birthdate", db.requireAuth, (req, res) => {
            const date = new Date(req.user.birthday * 1000);
            res.json({
                "birthMonth": date.getMonth(),
                "birthDay": date.getDate(),
                "birthYear": date.getFullYear()
            });
        });

        app.post("/v1/birthdate", db.requireAuth, async (req, res) => {
            const birthDay = req.body.birthDay;
            const birthMonth = req.body.birthMonth;
            const birthYear = req.body.birthYear;
            const password = req.body.password;
            if (birthDay < 0 || birthDay > 31 || birthMonth < 0 || birthMonth > 12 || birthYear < 0 || birthYear > new Date().getFullYear()) {
                res.status(400).send({})
                return;
            }
            const bd = new Date(birthYear, birthMonth, birthDay);
            if ((Date.now() - bd) < (4102 * 10 ** 8)) {
                if (db.getSiteConfig().shared.users.canBeUnder13 == false) {
                    res.status(400).send({})
                    return;
                }
                if (!bcrypt.compareSync(password, req.user.password)) {
                    res.status(401).send({})
                    return;
                }
            }
            await db.setUserProperty(req.user.userid, "birthday", Math.floor(bd / 1000));
            res.json({});
        });


        app.get("/v1/account/settings/metadata", (req, res) => {
            res.json({
                "IsAccountsRestrictionsSpamBugFixEnabled": true,
                "MaximumParentalControlsMonthlySpendLimitInUSD": 10000,
                "IsParentalMonthlyLimitInUIEnabled": true,
                "IsParentalNotificationSettingsInUIEnabled": true
            });
        });

        app.post("/v1/description", db.requireAuth, async (req, res) => {
            const description = req.body.description;
            if (description.length > 500) {
                res.status(400).send({});
                return;
            }
            await db.setUserProperty(req.user.userid, "description", description);
            res.json({
                "description": description
            });
        });
    }
}
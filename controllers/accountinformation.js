const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const bcrypt = require('bcryptjs');

module.exports = {
    init: (app, db) => {
        app.get("/v1/users/:userid/roblox-badges", db.requireAuth2, async (req, res) => {
            /*
            {
                "id": 6,
                "name": "Homestead",
                "description": "The homestead badge is earned by having your personal place visited 100 times. People who achieve this have demonstrated their ability to build cool things that other Robloxians were interested enough in to check out. Get a jump-start on earning this reward by inviting people to come visit your place.",
                "imageUrl": "https://images.roblox.com/b66bc601e2256546c5dd6188fce7a8d1.png"
            }, {
                "id": 7,
                "name": "Bricksmith",
                "description": "The Bricksmith badge is earned by having a popular personal place. Once your place has been visited 1000 times, you will receive this award. Robloxians with Bricksmith badges are accomplished builders who were able to create a place that people wanted to explore a thousand times. They no doubt know a thing or two about putting bricks together.",
                "imageUrl": "https://images.roblox.com/49f3d30f5c16a1c25ea0f97ea8ef150e.png"
            }, {
                "id": 3,
                "name": "Combat Initiation",
                "description": "This badge was granted when a user scored 10 victories in experiences that use classic combat scripts. It was retired Summer 2015 and is no longer attainable.",
                "imageUrl": "https://images.roblox.com/8d77254fc1e6d904fd3ded29dfca28cb.png"
            }, {
                "id": 12,
                "name": "Veteran",
                "description": "This badge recognizes members who have visited Roblox for one year or more. They are stalwart community members who have stuck with us over countless releases, and have helped shape Roblox into the experience that it is today. These medalists are the true steel, the core of the Robloxian history ... and its future.",
                "imageUrl": "https://images.roblox.com/b7e6cabb5a1600d813f5843f37181fa3.png"
            }, {
                "id": 4,
                "name": "Warrior",
                "description": "This badge was granted when a user scored 100 or more victories in experiences that use classic combat scripts. It was retired Summer 2015 and is no longer attainable.",
                "imageUrl": "https://images.roblox.com/0a010c31a8b482731114810590553be3.png"
            }, {
                "id": 2,
                "name": "Friendship",
                "description": "This badge is given to members who have embraced the Roblox community and have made at least 20 friends. People who have this badge are good people to know and can probably help you out if you are having trouble.",
                "imageUrl": "https://images.roblox.com/5eb20917cf530583e2641c0e1f7ba95e.png"
            }, {
                "id": 5,
                "name": "Bloxxer",
                "description": "This badge was granted when a user scored at least 250 victories, and fewer than 250 wipeouts, in experiences that use classic combat scripts. It was retired Summer 2015 and is no longer attainable.",
                "imageUrl": "https://images.roblox.com/139a7b3acfeb0b881b93a40134766048.png"
            }, {
                "id": 8,
                "name": "Inviter",
                "description": "This badge was awarded during the Inviter Program, which ran from 2009 to 2013. It has been retired and is no longer attainable.",
                "imageUrl": "https://images.roblox.com/01044aca1d917eb20bfbdc5e25af1294.png"
            }, {
                "id": 1,
                "name": "Administrator",
                "description": "This badge identifies an account as belonging to a Roblox administrator. Only official Roblox administrators will possess this badge. If someone claims to be an admin, but does not have this badge, they are potentially trying to mislead you. If this happens, please report abuse and we will delete the imposter's account.",
                "imageUrl": "https://images.roblox.com/def12ef9c8501334987a642eb11b7c91.png"
            }, {
                "id": 18,
                "name": "Welcome To The Club",
                "description": "This badge is awarded to users who have ever belonged to the illustrious Builders Club. These people are part of a long tradition of Roblox greatness.",
                "imageUrl": "https://images.roblox.com/6c2a598114231066a386fa716ac099c4.png"
            }, {
                "id": 17,
                "name": "Official Model Maker",
                "description": "This badge is awarded to members whose creations are so awesome, Roblox endorsed them. Owners of this badge probably have great scripting and building skills.",
                "imageUrl": "https://images.roblox.com/45710972c9c8d556805f8bee89389648.png"
            }
            */
            let badges = [];
            const userid = parseInt(req.params.userid);
            const user = await db.getUser(userid);
            if (!user || user.banned) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            if (user.isAdmin) {
                badges.push({
                    "id": 1,
                    "name": "Administrator",
                    "description": "This badge identifies an account as belonging to a Roblox administrator. Only official Roblox administrators will possess this badge. If someone claims to be an admin, but does not have this badge, they are potentially trying to mislead you. If this happens, please report abuse and we will delete the imposter's account.",
                    "imageUrl": "https://images.roblox.com/def12ef9c8501334987a642eb11b7c91.png"
                });
            }
            res.json(badges);
        })

        app.get('/v1/metadata', (req, res) => {
            res.json({
                "isAllowedNotificationsEndpointDisabled": true,
                "isAccountSettingsPolicyEnabled": true,
                "isPhoneNumberEnabled": false,
                "MaxUserDescriptionLength": 1000,
                "isUserDescriptionEnabled": true,
                "isUserBlockEndpointsUpdated": false,
                "isIDVerificationEnabled": false,
                "isPasswordRequiredForAgingDown": true,
                "homePageUpsellCardVariation": null
            });
        });

        app.get("/v1/phone", (req, res) => {
            res.json({
                "countryCode": null,
                "prefix": null,
                "phone": null,
                "isVerified": false,
                "verificationCodeLength": 6,
                "canBypassPasswordForPhoneUpdate": false
            });
        });

        app.get("/v1/email", db.requireAuth, (req, res) => {
            res.json({
                "emailAddress": req.email,
                "verified": true,
                "canBypassPasswordForEmailUpdate": false
            });
        });

        app.get("/v1/description", db.requireAuth, (req, res) => {
            res.json({
                "description": req.user.description
            });
        });

        app.get("/v1/content-restriction", db.requireAuth, (req, res) => {
            res.json({
                "contentRestrictionLevel": "NoRestrictions"
            });
        });

        app.get("/v1/promotion-channels", db.requireAuth, (req, res) => {
            res.json({
                "promotionChannelsVisibilityPrivacy": "NoOne",
                "facebook": null,
                "twitter": null,
                "youtube": null,
                "twitch": null,
                "guilded": null
            });
        });

        app.get("/age-verification-service/v1/age-verification/verified-age", db.requireAuth, (req, res) => {
            res.json({
                "isVerified": false,
                "verifiedAge": 0
            });
        });

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
                res.status(400).send({});
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
                "birthMonth": date.getMonth() + 1,
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
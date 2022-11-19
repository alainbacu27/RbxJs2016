const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v1/avatar", async (req, res) => {
            res.json({
                "scales": {
                    "height": 1.0,
                    "width": 1.0,
                    "head": 1.0,
                    "depth": 1.00,
                    "proportion": 0.0,
                    "bodyType": 0.0
                },
                "playerAvatarType": "R6",
                "bodyColors": {
                    "headColorId": 125,
                    "torsoColorId": 125,
                    "rightArmColorId": 125,
                    "leftArmColorId": 125,
                    "rightLegColorId": 125,
                    "leftLegColorId": 125
                },
                "assets": [
                    /*
                                {
                                        "id": 1,
                                        "name": "Test Item",
                                        "assetType": {
                                            "id": 41,
                                            "name": "HairAccessory"
                                        },
                                        "currentVersionId": 1,
                                        "meta": {
                                            "order": 1,
                                            "version": 1
                                        }
                                    }
                                */
                ],
                "defaultShirtApplied": false,
                "defaultPantsApplied": false,
                "emotes": [
                    /*
                                {
                                        "assetId": 4849499887,
                                        "assetName": "Happy",
                                        "position": 1
                                    }, {
                                        "assetId": 5917570207,
                                        "assetName": "Floss Dance",
                                        "position": 2
                                    }
                                */
                ]
            });
        });

        app.get("/v1/users/:userid/avatar", async (req, res) => {
            res.json({
                "scales": {
                    "height": 1.0,
                    "width": 1.0,
                    "head": 1.0,
                    "depth": 1.00,
                    "proportion": 0.0,
                    "bodyType": 0.0
                },
                "playerAvatarType": "R6",
                "bodyColors": {
                    "headColorId": 125,
                    "torsoColorId": 125,
                    "rightArmColorId": 125,
                    "leftArmColorId": 125,
                    "rightLegColorId": 125,
                    "leftLegColorId": 125
                },
                "assets": [
                    /*
                                {
                                        "id": 1,
                                        "name": "Test Item",
                                        "assetType": {
                                            "id": 41,
                                            "name": "HairAccessory"
                                        },
                                        "currentVersionId": 1,
                                        "meta": {
                                            "order": 1,
                                            "version": 1
                                        }
                                    }
                                */
                ],
                "defaultShirtApplied": false,
                "defaultPantsApplied": false,
                "emotes": [
                    /*
                                {
                                        "assetId": 4849499887,
                                        "assetName": "Happy",
                                        "position": 1
                                    }, {
                                        "assetId": 5917570207,
                                        "assetName": "Floss Dance",
                                        "position": 2
                                    }
                                */
                ]
            });
        });

        app.get("/v1/users/1/outfits", (req, res) => {
            const isEditable = req.query.isEditable == "true";
            const itemsPerPage = parseInt(req.query.itemsPerPage);
            const page = parseInt(req.query.page);
            res.json({
                "filteredCount": 0,
                "data": [
                    /*{
                                        "id": 1,
                                        "name": "Test",
                                        "isEditable": false
                                    }*/
                ],
                "total": 0
            });
        });

        app.get("/v1.1/avatar-fetch", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const placeId = parseInt(req.query.placeId);

            if (userId == 0) {
                res.json({
                    "resolvedAvatarType": "R6",
                    "equippedGearVersionIds": [],
                    "backpackGearVersionIds": [],
                    "accessoryVersionIds": [
                        /*
                                            {
                                                "assetId": 0,
                                                "assetTypeId": 0
                                            }
                                        */
                    ],
                    "animations": {},
                    "bodyColorsUrl": `https://www.rbx2016.nl/asset/BodyColors.ashx?userId=0`,
                    "scales": {
                        "Height": 1.0000,
                        "Width": 1.0000,
                        "Head": 1.0000,
                        "Depth": 1.00,
                        "Proportion": 0.0000,
                        "BodyType": 0.0000
                    },
                    "emotes": []
                });
                return;
            }

            const user = await db.getUser(userId);
            if (!user) {
                res.status(404).json({});
                return;
            }

            let equipCatalogItems = [];
            const tmp = await db.getEquippedCatalogItems(user.userid);
            for (const itemid of tmp) {
                equipCatalogItems.push(itemid);
            }

            res.json({
                "resolvedAvatarType": "R6",
                "equippedGearVersionIds": [],
                "backpackGearVersionIds": [],
                "accessoryVersionIds": equipCatalogItems,
                "animations": {},    
                "bodyColorsUrl": `https://www.rbx2016.nl/asset/BodyColors.ashx?userId=${user.userid}`,
                "scales": {
                    "Height": 1.0000,
                    "Width": 1.0000,
                    "Head": 1.0000,
                    "Depth": 1.00,
                    "Proportion": 0.0000,
                    "BodyType": 0.0000
                },
                "emotes": []
            });
        });

        app.get("/v1/avatar-fetch", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const placeId = parseInt(req.query.placeId);

            if (userId == 0) {
                res.json({
                    "resolvedAvatarType": "R6",
                    "equippedGearVersionIds": [],
                    "backpackGearVersionIds": [],
                    "accessoryVersionIds": [
                        /*
                                            {
                                                "assetId": 0,
                                                "assetTypeId": 0
                                            }
                                        */
                    ],
                    "animations": {},
                    "bodyColorsUrl": `https://www.rbx2016.nl/asset/BodyColors.ashx?userId=0`,
                    "scales": {
                        "Height": 1.0000,
                        "Width": 1.0000,
                        "Head": 1.0000,
                        "Depth": 1.00,
                        "Proportion": 0.0000,
                        "BodyType": 0.0000
                    },
                    "emotes": []
                });
                return;
            }

            const user = await db.getUser(userId);
            if (!user) {
                res.status(404).json({});
                return;
            }

            let equipCatalogItems = [];
            const tmp = await db.getEquippedCatalogItems(user.userid);
            for (const itemid of tmp) {
                equipCatalogItems.push(itemid);
            }

            res.json({
                "resolvedAvatarType": "R6",
                "equippedGearVersionIds": [],
                "backpackGearVersionIds": [],
                "accessoryVersionIds": equipCatalogItems,
                "animations": {},    
                "bodyColorsUrl": `https://www.rbx2016.nl/asset/BodyColors.ashx?userId=${user.userid}`,
                "scales": {
                    "Height": 1.0000,
                    "Width": 1.0000,
                    "Head": 1.0000,
                    "Depth": 1.00,
                    "Proportion": 0.0000,
                    "BodyType": 0.0000
                },
                "emotes": []
            });
        });

        app.post("/v1/avatar/set-player-avatar-type", (req, res) => {
            const playerAvatarType = req.body.playerAvatarType;
            if (playerAvatarType == "R15" && playerAvatarType == "R6") {
                res.status(400).json({});
                return;
            }
            res.status(501).json({});
        });

        app.post("/v1/avatar/set-scales", (req, res) => {
            const bodyType = parseFloat(req.body.bodyType);
            const head = parseFloat(req.body.head);
            const height = parseFloat(req.body.height);
            const proportion = parseFloat(req.body.proportion);
            const width = parseFloat(req.body.width);
            res.status(501).json({});
        });

        app.get("/v1/recent-items/:type/list", (req, res) => {
            const type = req.params.type; // all, etc..
            res.json({
                "data": [
                    /*
                                {
                                        "id": 1,
                                        "name": "Test",
                                        "type": "Asset",
                                        "assetType": {
                                            "id": 8,
                                            "name": "Hat"
                                        }
                                    }
                                */
                ],
                "total": 9
            });
        });

        app.get("/v1/avatar/metadata", (req, res) => {
            res.json({
                "enableDefaultClothingMessage": false,
                "isAvatarScaleEmbeddedInTab": true,
                "isBodyTypeScaleOutOfTab": true,
                "scaleHeightIncrement": 0.05,
                "scaleWidthIncrement": 0.05,
                "scaleHeadIncrement": 0.05,
                "scaleProportionIncrement": 0.05,
                "scaleBodyTypeIncrement": 0.05,
                "supportProportionAndBodyType": true,
                "showDefaultClothingMessageOnPageLoad": false,
                "areThreeDeeThumbsEnabled": true,
                "isAvatarWearingApiCallsLockingOnFrontendEnabled": true,
                "isOutfitHandlingOnFrontendEnabled": true,
                "isJustinUiChangesEnabled": true,
                "isCategoryReorgEnabled": true,
                "LCEnabledInEditorAndCatalog": true,
                "isLCCompletelyEnabled": true
            });
        });

        app.get("/v1/avatar-rules", (req, res) => {
            res.json({
                "playerAvatarTypes": ["R6", "R15"],
                "scales": {
                    "height": {
                        "min": 0.90,
                        "max": 1.05,
                        "increment": 0.01
                    },
                    "width": {
                        "min": 0.70,
                        "max": 1.00,
                        "increment": 0.01
                    },
                    "head": {
                        "min": 0.95,
                        "max": 1.00,
                        "increment": 0.01
                    },
                    "proportion": {
                        "min": 0.00,
                        "max": 1.00,
                        "increment": 0.01
                    },
                    "bodyType": {
                        "min": 0.00,
                        "max": 1.00,
                        "increment": 0.01
                    }
                },
                "wearableAssetTypes": [{
                    "maxNumber": 1,
                    "id": 18,
                    "name": "Face"
                }, {
                    "maxNumber": 1,
                    "id": 19,
                    "name": "Gear"
                }, {
                    "maxNumber": 1,
                    "id": 17,
                    "name": "Head"
                }, {
                    "maxNumber": 1,
                    "id": 29,
                    "name": "Left Arm"
                }, {
                    "maxNumber": 1,
                    "id": 30,
                    "name": "Left Leg"
                }, {
                    "maxNumber": 1,
                    "id": 12,
                    "name": "Pants"
                }, {
                    "maxNumber": 1,
                    "id": 28,
                    "name": "Right Arm"
                }, {
                    "maxNumber": 1,
                    "id": 31,
                    "name": "Right Leg"
                }, {
                    "maxNumber": 1,
                    "id": 11,
                    "name": "Shirt"
                }, {
                    "maxNumber": 1,
                    "id": 2,
                    "name": "T-Shirt"
                }, {
                    "maxNumber": 1,
                    "id": 27,
                    "name": "Torso"
                }, {
                    "maxNumber": 1,
                    "id": 48,
                    "name": "Climb Animation"
                }, {
                    "maxNumber": 1,
                    "id": 49,
                    "name": "Death Animation"
                }, {
                    "maxNumber": 1,
                    "id": 50,
                    "name": "Fall Animation"
                }, {
                    "maxNumber": 1,
                    "id": 51,
                    "name": "Idle Animation"
                }, {
                    "maxNumber": 1,
                    "id": 52,
                    "name": "Jump Animation"
                }, {
                    "maxNumber": 1,
                    "id": 53,
                    "name": "Run Animation"
                }, {
                    "maxNumber": 1,
                    "id": 54,
                    "name": "Swim Animation"
                }, {
                    "maxNumber": 1,
                    "id": 55,
                    "name": "Walk Animation"
                }, {
                    "maxNumber": 1,
                    "id": 56,
                    "name": "Pose Animation"
                }, {
                    "maxNumber": 0,
                    "id": 61,
                    "name": "Emote Animation"
                }, {
                    "maxNumber": 3,
                    "id": 8,
                    "name": "Hat"
                }, {
                    "maxNumber": 1,
                    "id": 41,
                    "name": "Hair Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 42,
                    "name": "Face Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 43,
                    "name": "Neck Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 44,
                    "name": "Shoulder Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 45,
                    "name": "Front Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 46,
                    "name": "Back Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 47,
                    "name": "Waist Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 72,
                    "name": "Dress Skirt Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 67,
                    "name": "Jacket Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 70,
                    "name": "Left Shoe Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 71,
                    "name": "Right Shoe Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 66,
                    "name": "Pants Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 65,
                    "name": "Shirt Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 69,
                    "name": "Shorts Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 68,
                    "name": "Sweater Accessory"
                }, {
                    "maxNumber": 1,
                    "id": 64,
                    "name": "T-Shirt Accessory"
                }],
                "bodyColorsPalette": [{
                    "brickColorId": 361,
                    "hexColor": "#564236",
                    "name": "Dirt brown"
                }, {
                    "brickColorId": 192,
                    "hexColor": "#694028",
                    "name": "Reddish brown"
                }, {
                    "brickColorId": 217,
                    "hexColor": "#7C5C46",
                    "name": "Brown"
                }, {
                    "brickColorId": 153,
                    "hexColor": "#957977",
                    "name": "Sand red"
                }, {
                    "brickColorId": 359,
                    "hexColor": "#AF9483",
                    "name": "Linen"
                }, {
                    "brickColorId": 352,
                    "hexColor": "#C7AC78",
                    "name": "Burlap"
                }, {
                    "brickColorId": 5,
                    "hexColor": "#D7C59A",
                    "name": "Brick yellow"
                }, {
                    "brickColorId": 101,
                    "hexColor": "#DA867A",
                    "name": "Medium red"
                }, {
                    "brickColorId": 1007,
                    "hexColor": "#A34B4B",
                    "name": "Dusty Rose"
                }, {
                    "brickColorId": 1014,
                    "hexColor": "#AA5500",
                    "name": "CGA brown"
                }, {
                    "brickColorId": 38,
                    "hexColor": "#A05F35",
                    "name": "Dark orange"
                }, {
                    "brickColorId": 18,
                    "hexColor": "#CC8E69",
                    "name": "Nougat"
                }, {
                    "brickColorId": 125,
                    "hexColor": "#EAB892",
                    "name": "Light orange"
                }, {
                    "brickColorId": 1030,
                    "hexColor": "#FFCC99",
                    "name": "Pastel brown"
                }, {
                    "brickColorId": 133,
                    "hexColor": "#D5733D",
                    "name": "Neon orange"
                }, {
                    "brickColorId": 106,
                    "hexColor": "#DA8541",
                    "name": "Bright orange"
                }, {
                    "brickColorId": 105,
                    "hexColor": "#E29B40",
                    "name": "Br. yellowish orange"
                }, {
                    "brickColorId": 1017,
                    "hexColor": "#FFAF00",
                    "name": "Deep orange"
                }, {
                    "brickColorId": 24,
                    "hexColor": "#F5CD30",
                    "name": "Bright yellow"
                }, {
                    "brickColorId": 334,
                    "hexColor": "#F8D96D",
                    "name": "Daisy orange"
                }, {
                    "brickColorId": 226,
                    "hexColor": "#FDEA8D",
                    "name": "Cool yellow"
                }, {
                    "brickColorId": 141,
                    "hexColor": "#27462D",
                    "name": "Earth green"
                }, {
                    "brickColorId": 1021,
                    "hexColor": "#3A7D15",
                    "name": "Camo"
                }, {
                    "brickColorId": 28,
                    "hexColor": "#287F47",
                    "name": "Dark green"
                }, {
                    "brickColorId": 37,
                    "hexColor": "#4B974B",
                    "name": "Bright green"
                }, {
                    "brickColorId": 310,
                    "hexColor": "#5B9A4C",
                    "name": "Shamrock"
                }, {
                    "brickColorId": 317,
                    "hexColor": "#7C9C6B",
                    "name": "Moss"
                }, {
                    "brickColorId": 119,
                    "hexColor": "#A4BD47",
                    "name": "Br. yellowish green"
                }, {
                    "brickColorId": 1011,
                    "hexColor": "#002060",
                    "name": "Navy blue"
                }, {
                    "brickColorId": 1012,
                    "hexColor": "#2154B9",
                    "name": "Deep blue"
                }, {
                    "brickColorId": 1010,
                    "hexColor": "#0000FF",
                    "name": "Really blue"
                }, {
                    "brickColorId": 23,
                    "hexColor": "#0D69AC",
                    "name": "Bright blue"
                }, {
                    "brickColorId": 305,
                    "hexColor": "#527CAE",
                    "name": "Steel blue"
                }, {
                    "brickColorId": 102,
                    "hexColor": "#6E99CA",
                    "name": "Medium blue"
                }, {
                    "brickColorId": 45,
                    "hexColor": "#B4D2E4",
                    "name": "Light blue"
                }, {
                    "brickColorId": 107,
                    "hexColor": "#008F9C",
                    "name": "Bright bluish green"
                }, {
                    "brickColorId": 1018,
                    "hexColor": "#12EED4",
                    "name": "Teal"
                }, {
                    "brickColorId": 1027,
                    "hexColor": "#9FF3E9",
                    "name": "Pastel blue-green"
                }, {
                    "brickColorId": 1019,
                    "hexColor": "#00FFFF",
                    "name": "Toothpaste"
                }, {
                    "brickColorId": 1013,
                    "hexColor": "#04AFEC",
                    "name": "Cyan"
                }, {
                    "brickColorId": 11,
                    "hexColor": "#80BBDC",
                    "name": "Pastel Blue"
                }, {
                    "brickColorId": 1024,
                    "hexColor": "#AFDDFF",
                    "name": "Pastel light blue"
                }, {
                    "brickColorId": 104,
                    "hexColor": "#6B327C",
                    "name": "Bright violet"
                }, {
                    "brickColorId": 1023,
                    "hexColor": "#8C5B9F",
                    "name": "Lavender"
                }, {
                    "brickColorId": 321,
                    "hexColor": "#A75E9B",
                    "name": "Lilac"
                }, {
                    "brickColorId": 1015,
                    "hexColor": "#AA00AA",
                    "name": "Magenta"
                }, {
                    "brickColorId": 1031,
                    "hexColor": "#6225D1",
                    "name": "Royal purple"
                }, {
                    "brickColorId": 1006,
                    "hexColor": "#B480FF",
                    "name": "Alder"
                }, {
                    "brickColorId": 1026,
                    "hexColor": "#B1A7FF",
                    "name": "Pastel violet"
                }, {
                    "brickColorId": 21,
                    "hexColor": "#C4281C",
                    "name": "Bright red"
                }, {
                    "brickColorId": 1004,
                    "hexColor": "#FF0000",
                    "name": "Really red"
                }, {
                    "brickColorId": 1032,
                    "hexColor": "#FF00BF",
                    "name": "Hot pink"
                }, {
                    "brickColorId": 1016,
                    "hexColor": "#FF66CC",
                    "name": "Pink"
                }, {
                    "brickColorId": 330,
                    "hexColor": "#FF98DC",
                    "name": "Carnation pink"
                }, {
                    "brickColorId": 9,
                    "hexColor": "#E8BAC8",
                    "name": "Light reddish violet"
                }, {
                    "brickColorId": 1025,
                    "hexColor": "#FFC9C9",
                    "name": "Pastel orange"
                }, {
                    "brickColorId": 364,
                    "hexColor": "#5A4C42",
                    "name": "Dark taupe"
                }, {
                    "brickColorId": 351,
                    "hexColor": "#BC9B5D",
                    "name": "Cork"
                }, {
                    "brickColorId": 1008,
                    "hexColor": "#C1BE42",
                    "name": "Olive"
                }, {
                    "brickColorId": 29,
                    "hexColor": "#A1C48C",
                    "name": "Medium green"
                }, {
                    "brickColorId": 1022,
                    "hexColor": "#7F8E64",
                    "name": "Grime"
                }, {
                    "brickColorId": 151,
                    "hexColor": "#789082",
                    "name": "Sand green"
                }, {
                    "brickColorId": 135,
                    "hexColor": "#74869D",
                    "name": "Sand blue"
                }, {
                    "brickColorId": 1020,
                    "hexColor": "#00FF00",
                    "name": "Lime green"
                }, {
                    "brickColorId": 1028,
                    "hexColor": "#CCFFCC",
                    "name": "Pastel green"
                }, {
                    "brickColorId": 1009,
                    "hexColor": "#FFFF00",
                    "name": "New Yeller"
                }, {
                    "brickColorId": 1029,
                    "hexColor": "#FFFFCC",
                    "name": "Pastel yellow"
                }, {
                    "brickColorId": 1003,
                    "hexColor": "#111111",
                    "name": "Really black"
                }, {
                    "brickColorId": 26,
                    "hexColor": "#1B2A35",
                    "name": "Black"
                }, {
                    "brickColorId": 199,
                    "hexColor": "#635F62",
                    "name": "Dark stone grey"
                }, {
                    "brickColorId": 194,
                    "hexColor": "#A3A2A5",
                    "name": "Medium stone grey"
                }, {
                    "brickColorId": 1002,
                    "hexColor": "#CDCDCD",
                    "name": "Mid gray"
                }, {
                    "brickColorId": 208,
                    "hexColor": "#E5E4DF",
                    "name": "Light stone grey"
                }, {
                    "brickColorId": 1,
                    "hexColor": "#F2F3F3",
                    "name": "White"
                }, {
                    "brickColorId": 1001,
                    "hexColor": "#F8F8F8",
                    "name": "Institutional white"
                }],
                "basicBodyColorsPalette": [{
                    "brickColorId": 364,
                    "hexColor": "#5A4C42",
                    "name": "Dark taupe"
                }, {
                    "brickColorId": 217,
                    "hexColor": "#7C5C46",
                    "name": "Brown"
                }, {
                    "brickColorId": 359,
                    "hexColor": "#AF9483",
                    "name": "Linen"
                }, {
                    "brickColorId": 18,
                    "hexColor": "#CC8E69",
                    "name": "Nougat"
                }, {
                    "brickColorId": 125,
                    "hexColor": "#EAB892",
                    "name": "Light orange"
                }, {
                    "brickColorId": 361,
                    "hexColor": "#564236",
                    "name": "Dirt brown"
                }, {
                    "brickColorId": 192,
                    "hexColor": "#694028",
                    "name": "Reddish brown"
                }, {
                    "brickColorId": 351,
                    "hexColor": "#BC9B5D",
                    "name": "Cork"
                }, {
                    "brickColorId": 352,
                    "hexColor": "#C7AC78",
                    "name": "Burlap"
                }, {
                    "brickColorId": 5,
                    "hexColor": "#D7C59A",
                    "name": "Brick yellow"
                }, {
                    "brickColorId": 153,
                    "hexColor": "#957977",
                    "name": "Sand red"
                }, {
                    "brickColorId": 1007,
                    "hexColor": "#A34B4B",
                    "name": "Dusty Rose"
                }, {
                    "brickColorId": 101,
                    "hexColor": "#DA867A",
                    "name": "Medium red"
                }, {
                    "brickColorId": 1025,
                    "hexColor": "#FFC9C9",
                    "name": "Pastel orange"
                }, {
                    "brickColorId": 330,
                    "hexColor": "#FF98DC",
                    "name": "Carnation pink"
                }, {
                    "brickColorId": 135,
                    "hexColor": "#74869D",
                    "name": "Sand blue"
                }, {
                    "brickColorId": 305,
                    "hexColor": "#527CAE",
                    "name": "Steel blue"
                }, {
                    "brickColorId": 11,
                    "hexColor": "#80BBDC",
                    "name": "Pastel Blue"
                }, {
                    "brickColorId": 1026,
                    "hexColor": "#B1A7FF",
                    "name": "Pastel violet"
                }, {
                    "brickColorId": 321,
                    "hexColor": "#A75E9B",
                    "name": "Lilac"
                }, {
                    "brickColorId": 107,
                    "hexColor": "#008F9C",
                    "name": "Bright bluish green"
                }, {
                    "brickColorId": 310,
                    "hexColor": "#5B9A4C",
                    "name": "Shamrock"
                }, {
                    "brickColorId": 317,
                    "hexColor": "#7C9C6B",
                    "name": "Moss"
                }, {
                    "brickColorId": 29,
                    "hexColor": "#A1C48C",
                    "name": "Medium green"
                }, {
                    "brickColorId": 105,
                    "hexColor": "#E29B40",
                    "name": "Br. yellowish orange"
                }, {
                    "brickColorId": 24,
                    "hexColor": "#F5CD30",
                    "name": "Bright yellow"
                }, {
                    "brickColorId": 334,
                    "hexColor": "#F8D96D",
                    "name": "Daisy orange"
                }, {
                    "brickColorId": 199,
                    "hexColor": "#635F62",
                    "name": "Dark stone grey"
                }, {
                    "brickColorId": 1002,
                    "hexColor": "#CDCDCD",
                    "name": "Mid gray"
                }, {
                    "brickColorId": 1001,
                    "hexColor": "#F8F8F8",
                    "name": "Institutional white"
                }],
                "minimumDeltaEBodyColorDifference": 11.4,
                "proportionsAndBodyTypeEnabledForUser": true,
                "defaultClothingAssetLists": {
                    "defaultShirtAssetIds": [855776103, 855760101, 855766176, 855777286, 855768342, 855779323, 855773575, 855778084],
                    "defaultPantAssetIds": [855783877, 855780360, 855781078, 855782781, 855781508, 855785499, 855782253, 855784936]
                },
                "bundlesEnabledForUser": true,
                "emotesEnabledForUser": true
            });
        });
    }
}
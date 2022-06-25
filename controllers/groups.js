const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v1/groups/metadata", (req, res) => {
            res.json({
                "groupLimit": 100,
                "currentGroupCount": 6,
                "groupStatusMaxLength": 255,
                "groupPostMaxLength": 500,
                "isGroupWallNotificationsEnabled": false,
                "groupWallNotificationsSubscribeIntervalInMilliseconds": 60000,
                "areProfileGroupsHidden": false,
                "isGroupDetailsPolicyEnabled": true,
                "showPreviousGroupNames": true
            });
        });

        app.get("/v1/groups/configuration/metadata", (req, res) => {
            res.json({
                "groupConfiguration": {
                    "nameMaxLength": 50,
                    "descriptionMaxLength": 1000,
                    "iconMaxFileSizeMb": 20,
                    "cost": 100,
                    "isUsingTwoStepWebviewComponent": true
                },
                "recurringPayoutsConfiguration": {
                    "maxPayoutPartners": 20
                },
                "roleConfiguration": {
                    "nameMaxLength": 100,
                    "descriptionMaxLength": 1000,
                    "limit": 40,
                    "cost": 25,
                    "minRank": 0,
                    "maxRank": 255
                },
                "groupNameChangeConfiguration": {
                    "cost": 100,
                    "cooldownInDays": 90,
                    "ownershipCooldownInDays": 90
                },
                "isPremiumPayoutsEnabled": true,
                "isDefaultEmblemPolicyEnabled": true
            });
        });

        app.get("/v1/users/:groupid/groups/roles", (req, res) => {
            res.json({
                "data": [
                    /*
                                {
                                        "group": {
                                            "id": 2,
                                            "name": "GROUP NAME",
                                            "description": "",
                                            "owner": {
                                                "buildersClubMembershipType": "None",
                                                "userId": 1,
                                                "username": "Roblox",
                                                "displayName": "Roblox"
                                            },
                                            "shout": null,
                                            "memberCount": 1,
                                            "isBuildersClubOnly": false,
                                            "publicEntryAllowed": false
                                        },
                                        "role": {
                                            "id": 1,
                                            "name": "Member",
                                            "rank": 1
                                        }
                                    }
                                */
                ]
            });
        });
        app.get("/v2/users/1/groups/roles", (req, res) => {
            res.json({
                "data": [{
                    "group": {
                        "id": 7384468,
                        "name": "Roblox Arena Events",
                        "memberCount": 967
                    },
                    "role": {
                        "id": 46417776,
                        "name": "Member",
                        "rank": 1
                    }
                }, {
                    "group": {
                        "id": 7,
                        "name": "Roblox",
                        "memberCount": 7573077
                    },
                    "role": {
                        "id": 52,
                        "name": "Owner",
                        "rank": 255
                    }
                }, {
                    "group": {
                        "id": 127081,
                        "name": "Roblox Wiki",
                        "memberCount": 1531648
                    },
                    "role": {
                        "id": 676373,
                        "name": "Wiki System Operator",
                        "rank": 254
                    }
                }]
            });
        });
    }
}
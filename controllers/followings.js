const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v1/users/:userid/universes/:universeid/status", (req, res) => {
            const userid = parseInt(req.params.userid);
            const universeid = parseInt(req.params.universeid);
            res.json({
                "UniverseId": universeid,
                "UserId": userid,
                "CanFollow": false,
                "IsFollowing": false,
                "FollowingCountByType": 5,
                "FollowingLimitByType": 200
            });
        });
    }
}
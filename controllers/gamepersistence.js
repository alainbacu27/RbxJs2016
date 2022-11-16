const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        app.post("/persistence/set", async (req, res) => {
            const ip = get_ip(req).clientIp;
            const allowedIps = db.getHostPublicIps();
            if (!allowedIps.includes(ip)) {
                return res.status(403).send("Forbidden");
            }

            const placeId = parseInt(req.query.placeId);
            const key = req.query.key;
            const type = req.query.type;
            const scope = req.query.scope;
            const target = req.query.target;
            const valueLength = parseInt(req.query.valueLength);
            const value = req.body.value;
            const saved = await db.setDataStore(placeId, key, type, scope, target, value);
            if (saved) {
                res.json({
                    // "error": null,
                    "data": []
                });
            } else {
                res.status(400).send();
            }
        });

        app.post("/persistence/getSortedValues", async (req, res) => {
            const ip = get_ip(req).clientIp;
            const allowedIps = db.getHostPublicIps();
            if (!allowedIps.includes(ip)) {
                return res.status(403).send("Forbidden");
            }
            
            const placeId = parseInt(req.query.placeId);
            const type = req.query.type;
            const key = req.query.key;
            const pageSize = parseInt(req.query.pageSize);
            const ascending = req.query.ascending == "True";
            const exclusiveStartKey = req.query.exclusiveStartKey;
            let result = await db.getSortedDataStore(placeId, key, type);
            result = result.sort((a, b) => {
                if (ascending) {
                    return a.value - b.value;
                } else {
                    return b.value - a.value;
                }
            });
            let data = [];
            for (let i = 0; i < pageSize; i++) {
                if (i < result.length) {
                    const result0 = result[i];
                    data.push({
                        "Value": result0.value,
                        "Target": result0.target
                    });
                }
            }
            res.json({
                "Entries": data,
                "ExclusiveStartKey": "AQEBAgRLZXky"
            });
        });

        app.post("/persistence/increment", async (req, res) => {
            const ip = get_ip(req).clientIp;
            const allowedIps = db.getHostPublicIps();
            if (!allowedIps.includes(ip)) {
                return res.status(403).send("Forbidden");
            }

            const placeId = parseInt(req.query.placeId);
            const type = req.query.type;
            const key = req.query.key;
            const target = req.query.target;
            const scope = req.query.scope;
            const pageSize = parseInt(req.query.pageSize);
            const by = parseInt(req.query.by);
            let result = await db.increaseDataStore(placeId, key, type, scope, target, by);
            result = result.sort((a, b) => {
                if (ascending) {
                    return a.value - b.value;
                } else {
                    return b.value - a.value;
                }
            });
            let data = [];
            for (let i = 0; i < pageSize; i++) {
                if (i < result.length) {
                    const result0 = result[i];
                    data.push({
                        "Value": result0.value,
                        "Target": result0.target
                    });
                }
            }
            res.json({
                "Entries": data,
                "ExclusiveStartKey": "AQEBAgRLZXky"
            });
        });

        app.post("/persistence/getV2", async (req, res) => {
            const ip = get_ip(req).clientIp;
            const allowedIps = db.getHostPublicIps();
            if (!allowedIps.includes(ip)) {
                return res.status(403).send("Forbidden");
            }
            try {
                const placeId = parseInt(req.query.placeId);
                const type = req.query.type;
                const scope = req.query.scope;
                const target = req.body.qkeys[1];
                const key = req.body.qkeys[2];
                const value = await db.getDataStore(placeId, key, type, scope, target);
                if (value) {
                    const data = [{
                        "Value": value,
                        "Scope": scope,
                        "Key": key,
                        "Target": target
                    }];
                    res.json({
                        // "error": null,
                        "data": data
                    });
                } else {
                    res.json({
                        // "error": null,
                        "data": []
                    });
                }
            } catch (err) {
                console.error("DATASTORE FAILED", err);
                res.json({
                    // "error": null,
                    "data": []
                });
            }
        });
    }
}
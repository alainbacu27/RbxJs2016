const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");
const crypto = require('crypto');
const MongoClient = mongodb.MongoClient;
const dbName = "roblox";
const get_ip = require('ipware')().get_ip;
const os = require('os-utils');
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
const fastFolderSize = require('fast-folder-size');
const checkDiskSpace = require('check-disk-space').default;
const util = require('util');
// const exec = util.promisify(require('child_process').exec);
let exec = require('child_process').exec;
const soapRequest = require('easy-soap-request');
const pm2 = require('pm2');
const utf8 = require('utf8');
const kill = require('tree-kill');

let maintenanceModeWhitelistedIps = ["127.0.0.1", "::1"];

let PRIVATE_PLACE_KEYS = [];

const siteConfigFP = path.resolve(__dirname + "/config.json");
let siteConfig = JSON.parse(fs.readFileSync(siteConfigFP).toString());

fs.watchFile(siteConfigFP, (curr, prev) => {
    siteConfig = JSON.parse(fs.readFileSync(siteConfigFP).toString());
});

const isWin = process.platform === "win32";
const rccPath = path.resolve(__dirname + "/internal/RCCService/RCCService.exe");

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getDataStore(placeid, key, type, scope, target) {
    return new Promise(async returnPromise => {
        if (siteConfig.backend.datastoresEnabled == false) {
            returnPromise(false);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("datastores").findOne({
                placeid: placeid,
                key: key,
                type: type,
                scope: scope,
                target: target
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                };
                db.close();
                returnPromise(result ? result.value : null);
            });
        });
    });
}

async function getSortedDataStore(placeid, key, type, scope, target) {
    return new Promise(async returnPromise => {
        if (siteConfig.backend.datastoresEnabled == false) {
            returnPromise(false);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("datastores").find({
                placeid: placeid,
                value: {
                    $gt: -Infinity
                }
            }, {
                sort: {
                    value: -1
                }
            }).toArray(function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                };
                db.close();
                returnPromise(result);
            });
        });
    });
}

async function setDataStore(placeid, key, type, scope, target, value) {
    return new Promise(async returnPromise => {
        if (siteConfig.backend.datastoresEnabled == false) {
            returnPromise(false);
            return;
        }
        if (value.length > 256 * 1024) {
            returnPromise(false);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("datastores").findOne({
                placeid: placeid,
                key: key,
                type: type,
                scope: scope,
                target: target
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                if (result == null) {
                    dbo.collection("datastores").find({
                        placeid: placeid
                    }).toArray(function (err, result2) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        if (result2.length >= siteConfig.backend.datastoresMaxPerPlace) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("datastores").insertOne({
                            placeid: placeid,
                            key: key,
                            type: type,
                            scope: scope,
                            target: target,
                            value: value
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    });
                } else {
                    dbo.collection("datastores").updateOne({
                        placeid: placeid,
                        key: key,
                        type: type,
                        scope: scope,
                        target: target
                    }, {
                        $set: {
                            value: value
                        }
                    }, function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        db.close();
                        returnPromise(true);
                    });
                }
            })
        });
    });
}

async function increaseDataStore(placeid, key, type, scope, target, value) {
    return new Promise(async returnPromise => {
        if (siteConfig.backend.datastoresEnabled == false) {
            returnPromise(false);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("datastores").findOne({
                placeid: placeid,
                key: key,
                type: type,
                scope: scope,
                target: target
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                if (result == null) {
                    dbo.collection("datastores").find({
                        placeid: placeid
                    }).toArray(function (err, result2) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        if (result2.length >= siteConfig.backend.datastoresMaxPerPlace) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("datastores").insertOne({
                            placeid: placeid,
                            key: key,
                            type: type,
                            scope: scope,
                            target: target,
                            value: value
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    });
                } else {
                    dbo.collection("datastores").updateOne({
                        placeid: placeid,
                        key: key,
                        type: type,
                        scope: scope,
                        target: target
                    }, {
                        $inc: {
                            value: value
                        }
                    }, function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        db.close();
                        returnPromise(true);
                    });
                }
            })
        });
    });
}

async function setMaintenanceWhitelistCode(code) {
    return new Promise(async returnPromise => {
        if (siteConfig.backend.canBypassMaintenanceScreen == false) {
            returnPromise(false);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("config").updateOne({}, {
                $set: {
                    maintenanceBypassCode: code
                }
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(true);
            });
        });
    });
}

async function getMaintenanceWhitelistCode() {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("config").findOne({}, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(result.maintenanceBypassCode);
            });
        });
    });
}

function formatNumber(num, digits) {
    const lookup = [{
            value: 1,
            symbol: ""
        },
        {
            value: 1e3,
            symbol: "k"
        },
        {
            value: 1e6,
            symbol: "M"
        },
        {
            value: 1e9,
            symbol: "B"
        },
        {
            value: 1e12,
            symbol: "T"
        },
        {
            value: 1e15,
            symbol: "P"
        },
        {
            value: 1e18,
            symbol: "E"
        }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol + ((num > 1e3 && num > item.value) ? "+" : "") : "0";
}

function formatNumberS(num) {
    const snum = num.toString();
    if (snum.length > 3) {
        return snum.substring(0, 1) + "," + snum.substring(1).match(/.{1,3}/g).join(",");
    } else {
        return snum;
    }
}

async function getCpuUsage() {
    return new Promise(async returnPromise => {
        os.cpuUsage(function (v) {
            returnPromise(Math.round(v * 100));
        });
    });
}

async function getDiskSpace() {
    return new Promise(async returnPromise => {
        checkDiskSpace(path.resolve("/")).then((diskSpace) => {
            returnPromise(diskSpace)
        });
    });
}

let mongourl = `mongodb://${siteConfig.backend.database.ip}:${siteConfig.backend.database.port}/`;
if (siteConfig.PRIVATE.DATABASE_PASSWORD != "") {
    mongourl = `mongodb://admin:${siteConfig.PRIVATE.DATABASE_PASSWORD}@${siteConfig.backend.database.ip}:${siteConfig.backend.database.port}/`;
}
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

new MongoClient(mongourl, {tls: false}).connect(function (err, db) {
    if (err) throw err;
    db.close();
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "users"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("users", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "games"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("games", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "gamepasses"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("gamepasses", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "devproducts"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("devproducts", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "recipes"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("recipes", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "assets"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("assets", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "favorites"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("favorites", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "ratings"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("ratings", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "invitekeys"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("invitekeys", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, async function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "config"
    }).next(async function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("config", function (err, res) {
                if (err) throw err;
                dbo.collection("config").insertOne({
                    assets: 0,
                    maintenance: false,
                    maintenanceBypassCode: "",
                    maintenance_finishtime: 0,
                    roblox_message: ""
                }).next((err, result) => {
                    if (err) throw err;
                    db.close();
                });
            });
        } else {
            if (await dbo.collection("config").countDocuments() == 0) {
                dbo.collection("config").insertOne({
                    assets: 0,
                    maintenance: false,
                    maintenance_finishtime: 0,
                    maintenanceBypassCode: "",
                    roblox_message: ""
                }).next((err, result) => {
                    if (err) throw err;
                    db.close();
                });
            }
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "friends"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("friends", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "blocked"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("blocked", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "logincodes"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("logincodes", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

MongoClient.connect(mongourl, function (err, db) {
    if (err) throw err;
    const dbo = db.db(dbName);
    dbo.listCollections({
        name: "catalog"
    }).next(function (err, collinfo) {
        if (err) throw err;
        if (!collinfo) {
            dbo.createCollection("catalog", function (err, res) {
                if (err) throw err;
                db.close();
            });
        }
    });
});

function filterText(input) {
    return input.replace(/[^0-9a-z]/gi, '')
}

function filterText2(input) {
    return input.replace(/[^0-9a-z:_ ]/gi, '')
}

function filterText3(input) {
    return input.replace(/[^0-9a-z:_]/gi, '')
}

function randHash(len, possible = "ABCDEF0123456789") {
    var text = "";
    for (var i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function generateLoginCode() {
    const innerContent = randHash(6);
    return innerContent;
}

function generateInviteKey() {
    const innerContent = `r2016--${uuidv4()}`;
    return innerContent;
}

function generateToken() {
    const innerContent = randHash(750, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    return innerContent;
}

function generateCookie() {
    const innerContent = randHash(744);
    return "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_" + innerContent;
}

function generateCSRF() {
    const innerContent = randHash(128, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=+-/");
    return innerContent;
}

function getUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
}

function unixToDate(unix) {
    return new Date(unix * 1000);
}

function formatAMPMFull(date, onlyDate = false) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let result = year + '/' + month + '/' + day;
    if (!onlyDate) {
        result += ' ' + hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    }
    return result;
}

async function findUserByCookie(cookie) {
    return new Promise(async returnPromise => {
        if (cookie == "") {
            returnPromise(null);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("users").findOne({
                cookie: cookie
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                db.close();
                returnPromise(result);
            });
        });
    });
}

function toString(input) {
    if (input === null || input === undefined) {
        return "null";
    } else if (input === false) {
        return "false";
    } else if (input === true) {
        return "true";
    } else if (typeof input === "string") {
        return '"' + input + '"';
    } else if (typeof input === "number") {
        return input.toString();
    } else if (typeof input === "object") {
        let string = "{";
        for (let key in input) {
            string += key + ":" + toString(input[key]) + ",";
        }
        string = string.substring(0, string.length - 1);
        string += "}";
        return string;
    } else {
        return "";
    }
}

function timeToString(input) {
    return formatAMPMFull(new Date(input * 1000));
}

async function isUserUnder13(userid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("users").findOne({
                userid: userid
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                db.close();
                returnPromise(((Date.now() - unixToDate(result.birthday)) < (13 * 365 * 24 * 60 * 60 * 1000)));
            });
        });
    });
}

async function areBlocked(userid, userid2, checkBothWays = false) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("blocked").findOne({
                userid: userid,
                userid2: userid2
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                let blocked = result != null && result != undefined;
                if (!blocked && checkBothWays) {
                    dbo.collection("blocked").findOne({
                        userid: userid2,
                        userid2: userid
                    }, function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        blocked = result != null && result != undefined;
                        returnPromise(blocked);
                    });
                } else {
                    returnPromise(blocked);
                }
            });
        });
    });
}

async function unfriend(userid, friendid) {
    if (userid == friendid) {
        returnPromise(false);
        return;
    }
    return new Promise(async returnPromise => {
        if (!(await areFriends(userid, friendid))) {
            returnPromise(false);
            return;
        }
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("friends").deleteOne({
                userid: userid,
                friendid: friendid
            }, function (err, obj) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                dbo.collection("friends").deleteOne({
                    userid: friendid,
                    friendid: userid
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    });
}

async function getFriends(userid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("friends").find({
                userid: userid,
                accepted: true
            }).toArray(function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                db.close();
                returnPromise(result);
            });
        });
    });
}

async function areFriends(userid, friendid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("friends").findOne({
                userid: userid,
                friendid: friendid,
                accepted: true
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(result != null && result != undefined);
            });
        });
    });
}

async function areFriendsPending(userid, friendid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("friends").findOne({
                userid: userid,
                friendid: friendid,
                accepted: false
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(result != null && result != undefined);
            });
        });
    });
}

async function denyFriend(userid, friendid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("friends").deleteOne({
                userid: userid,
                friendid: friendid,
                accepted: false
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(true);
            });
        });
    });
}

async function denyAllFriends(userid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("friends").deleteMany({
                friendid: userid,
                accepted: false
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(true);
            });
        });
    });
}

async function getUserByCsrfToken(xcsrftoken) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("users").findOne({
                xcsrftoken: xcsrftoken
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                if (result != null) {
                    db.close();
                    returnPromise(result);
                } else {
                    db.close();
                    returnPromise(false);
                }
            });
        });
    });
}

async function generateUserCsrfToken(userid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            const xcsrftoken = generateCSRF();
            dbo.collection("users").updateOne({
                userid: userid
            }, {
                $set: {
                    xcsrftoken: xcsrftoken
                }
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                db.close();
                returnPromise(xcsrftoken);
            });
        });
    });
}

async function getConfig() {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("config").findOne({}, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                db.close();
                returnPromise(result);
            });
        });
    });
}

async function getRenderObject(user, banned = false) {
    const config = await getConfig();
    return {
        userid: user.userid,
        username: user.username,
        isUnder13: toString(await isUserUnder13(user.userid)),
        accountCreated: timeToString(user.created, true),
        isAdmin: toString(user.isAdmin),
        isMod: toString(user.isMod),
        banned: toString(user.banned),
        bannedDate: timeToString(user.bannedDate),
        bannedModNote: user.bannedModNote,
        bannedReason: user.bannedReason,
        bannedReasonItem: user.bannedReasonItem,
        xcsrftoken: banned ? "" : encodeURIComponent(user.xcsrftoken),
        robux: banned ? "?" : user.robux,
        robux2: banned ? "?" : formatNumberS(user.robux),
        robuxFormatted: banned ? "?" : formatNumber(user.robux),
        tix: banned ? "?" : user.tix,
        tix2: banned ? "?" : formatNumberS(user.tix),
        tixFormatted: banned ? "?" : formatNumber(user.tix),

        theme: user.theme && user.theme.toLowerCase() || "light",
        gender: user.gender,
        birthday: user.birthday,

        robloxMessage: config.roblox_message
    };
}

async function getBlankRenderObject() {
    const config = await getConfig();
    return {
        userid: 0,
        username: "",
        isUnder13: toString(false),
        accountCreated: timeToString(0, true),
        isAdmin: toString(false),
        isMod: toString(false),
        banned: toString(false),
        bannedDate: 0,
        bannedModNote: "",
        bannedReason: "",
        bannedReasonItem: "",
        xcsrftoken: "",
        robux: "?",
        robux2: "?",
        robuxFormatted: "?",
        tix: "?",
        tix2: "?",
        tixFormatted: "?",

        theme: "light",
        gender: 1,
        birthday: 0,

        robloxMessage: config.roblox_message
    };
}

async function userHasPlayedGame(userid, gameid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, async function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("games").findOne({
                gameid: gameid
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(false);
                    return;
                }
                if (result != null) {
                    if (result.played.includes(userid)) {
                        db.close();
                        returnPromise(true);
                    } else {
                        db.close();
                        returnPromise(false);
                    }
                } else {
                    db.close();
                    returnPromise(false);
                }
            });
        });
    });
}

async function getGame(gameid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("games").findOne({
                gameid: gameid
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                db.close();
                returnPromise(result);
            });
        });
    });
}

async function getCatalogItem(itemid) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            dbo.collection("catalog").findOne({
                itemid: itemid
            }, function (err, result) {
                if (err) {
                    db.close();
                    returnPromise(null);
                    return;
                }
                if (result != null) {
                    db.close();
                    returnPromise(result);
                } else {
                    db.close();
                    returnPromise(null);
                }
            });
        });
    });
}

setInterval(() => {
    MongoClient.connect(mongourl, async function (err, db) {
        if (err) throw err;
        const dbo = db.db(dbName);
        dbo.collection("logincodes").find({
            created: {
                $lt: getUnixTimestamp() - 300
            }
        }).toArray(async function (err, result) {
            if (err) throw err;
            let needsRemoval = result.length;
            let removed = 0;
            for (let i = 0; i < result.length; i++) {
                dbo.collection("logincodes").deleteOne({
                    created: result[i].created
                }, function (err, result) {
                    if (err) throw err;
                    removed++;
                });
            }
            while (removed < needsRemoval) {
                await sleep(100);
            }
            db.close();
        });
    });
}, 7500);

setInterval(() => {
    MongoClient.connect(mongourl, async function (err, db) {
        if (err) throw err;
        const dbo = db.db(dbName);
        dbo.collection("recipes").find({
            bought: {
                $lt: getUnixTimestamp() - 20
            }
        }).toArray(async function (err, result) {
            if (err) throw err;
            let needsRemoval = result.length;
            let removed = 0;
            for (let i = 0; i < result.length; i++) {
                dbo.collection("recipes").deleteOne({
                    bought: result[i].bought
                }, function (err, result) {
                    if (err) throw err;
                    removed++;
                });
            }
            while (removed < needsRemoval) {
                await sleep(100);
            }
            db.close();
        });
    });
}, 7500);

setInterval(() => {
    MongoClient.connect(mongourl, async function (err, db) {
        if (err) throw err;
        const dbo = db.db(dbName);
        let updated = 0;
        let needsUpdating = 0;
        dbo.collection("games").find({
            lastHeartBeat: {
                $gt: 0
            }
        }).toArray(async function (err, result) {
            if (err) throw err;
            for (let i = 0; i < result.length; i++) {
                if (result[i].lastHeartBeat != 0 && Date.now() - unixToDate(result[i].lastHeartBeat) > 15000) {
                    needsUpdating++;
                    const servers = await getJobsByGameId(result[i].gameid);
                    if (servers.length > 0) {
                        for (let j = 0; j < servers.length; j++) {
                            const job = await getJob(servers[j]);
                            if (job) {
                                await job.stop();
                            }
                        }
                    }
                    dbo.collection("games").updateOne({
                        gameid: result[i].gameid
                    }, {
                        $set: {
                            port: 0,
                            playing: 0,
                            rccVersion: "",
                            lastHeartBeat: 0
                        }
                    }, async function (err, res) {
                        if (err) throw err;
                        dbo.collection("users").updateMany({
                            playing: result[i].gameid
                        }, {
                            $set: {
                                playing: 0
                            }
                        }, async function (err, res) {
                            if (err) throw err;
                            updated++;
                        });
                    });
                } else if (result[i].lastHeartBeat == 0) {
                    needsUpdating++;
                    dbo.collection("users").updateMany({
                        playing: result[i].gameid
                    }, {
                        $set: {
                            playing: 0
                        }
                    }, async function (err, res) {
                        if (err) throw err;
                        updated++;
                    });
                }
            }
            while (updated < needsUpdating) {
                await sleep(100);
            }
        });
        dbo.collection("games").find({
            teamCreateLastHeartBeat: {
                $gt: 0
            }
        }).toArray(async function (err, result) {
            if (err) throw err;
            for (let i = 0; i < result.length; i++) {
                if (result[i].teamCreateLastHeartBeat != 0 && Date.now() - unixToDate(result[i].teamCreateLastHeartBeat) > 15000) {
                    needsUpdating++;
                    dbo.collection("games").updateOne({
                        gameid: result[i].gameid
                    }, {
                        $set: {
                            teamCreatePort: 0,
                            teamCreatePlaying: 0,
                            teamCreateRccVersion: "",
                            teamCreateLastHeartBeat: 0
                        }
                    }, async function (err, res) {
                        if (err) throw err;
                        dbo.collection("users").updateMany({
                            editing: result[i].gameid
                        }, {
                            $set: {
                                editing: 0
                            }
                        }, async function (err, res) {
                            if (err) throw err;
                            updated++;
                        });
                    });
                }
            }
            await sleep(1000)
            while (updated < needsUpdating) {
                await sleep(100);
            }
            db.close();
        });
    });
}, 7500);

let availableRCCPorts = [];
for (let i = 0; i < siteConfig.backend.maxServers; i++) {
    availableRCCPorts.push((siteConfig.backend.serverStartingPort + siteConfig.backend.maxServers + 1) + i);
}
let availableGamePorts = [];
for (let i = 0; i < siteConfig.backend.maxServers; i++) {
    availableGamePorts.push(siteConfig.backend.serverStartingPort + i);
}

function getRCCScriptXml(script, id, timeout = 10, hasExecutedOnce = false) {
    if (!hasExecutedOnce) {
        return `<?xml version = "1.0" encoding = "UTF-8"?>
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://rbx2016.tk/RCCServiceSoap" xmlns:ns1="http://rbx2016.tk/" xmlns:ns3="http://rbx2016.tk/RCCServiceSoap12">
        <SOAP-ENV:Body>
               <ns1:OpenJobEx>
                    <ns1:job>
                        <ns1:id>${id}</ns1:id>
                        <ns1:expirationInSeconds>${timeout}</ns1:expirationInSeconds>
                    </ns1:job>
                    <ns1:script>
                        <ns1:name>MainExecutionJob</ns1:name>
                        <ns1:script>${script}</ns1:script>
                    </ns1:script>
                </ns1:OpenJobEx>
            </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>`;
    } else {
        return `<?xml version = "1.0" encoding = "UTF-8"?>
        <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://rbx2016.tk/RCCServiceSoap" xmlns:ns1="http://rbx2016.tk/" xmlns:ns3="http://rbx2016.tk/RCCServiceSoap12">
            <SOAP-ENV:Body>
                   <ns1:ExecuteEx>
                        <ns1:jobID>${id}</ns1:jobID>
                        <ns1:script>
                            <ns1:name>AdminPanelExecutionJob</ns1:name>
                            <ns1:script>${script}</ns1:script>
                        </ns1:script>
                    </ns1:ExecuteEx>
                </SOAP-ENV:Body>
        </SOAP-ENV:Envelope>`;
    }
}

function getRCCHostScript(gameid, port, jobid, isCloudEdit = false) {
    const key = uuidv4();
    PRIVATE_PLACE_KEYS.push(key);
    let script = ``;
    if (!isCloudEdit) {
        script = `local placeId = ${gameid}
    local port = ${port}
    local url = "http://www.rbx2016.tk"
    
    function waitForChild(parent, childName)
        while true do
            local child = parent:findFirstChild(childName)
            if child then
                return child
            end
            parent.ChildAdded:wait()
        end
    end
    
    pcall(function() settings().Network.UseInstancePacketCache = true end)
    pcall(function() settings().Network.UsePhysicsPacketCache = true end)
    pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)
    
    settings().Network.PhysicsSend = Enum.PhysicsSendMethod.TopNErrors
    settings().Network.ExperimentalPhysicsEnabled = true
    settings().Network.WaitingForCharacterLogRate = 100
    pcall(function() settings().Diagnostics:LegacyScriptMode() end)
    
    local scriptContext = game:GetService('ScriptContext')
    pcall(function() scriptContext:AddStarterScript(37801172) end)
    scriptContext.ScriptsDisabled = true
    
    game:SetPlaceID(placeId, false)
    game:GetService("ChangeHistoryService"):SetEnabled(false)
    
    local ns = game:GetService("NetworkServer")
    
    if url~=nil then
        pcall(function() game:GetService("Players"):SetAbuseReportUrl(url .. "/AbuseReport/InGameChatHandler.ashx") end)
        pcall(function() game:GetService("ScriptInformationProvider"):SetAssetUrl(url .. "/Asset/") end)
        pcall(function() game:GetService("ContentProvider"):SetBaseUrl(url .. "/") end)
        pcall(function() game:GetService("Players"):SetChatFilterUrl(url .. "/Game/ChatFilter.ashx") end)
    
        game:GetService("BadgeService"):SetPlaceId(placeId)
    
        game:GetService("BadgeService"):SetIsBadgeLegalUrl("")
        game:GetService("InsertService"):SetBaseSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
        game:GetService("InsertService"):SetUserSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
        game:GetService("InsertService"):SetCollectionUrl(url .. "/Game/Tools/InsertAsset.ashx?sid=%d")
        game:GetService("InsertService"):SetAssetUrl(url .. "/Asset/?id=%d")
        game:GetService("InsertService"):SetAssetVersionUrl(url .. "/Asset/?assetversionid=%d")
        
        pcall(function() loadfile(url .. "/Game/LoadPlaceInfo.ashx?PlaceId=" .. placeId)() end)
        
    end
    
    settings().Diagnostics.LuaRamLimit = 0
    
    game:GetService("Players").PlayerAdded:connect(function(plr)
        print("Player " .. plr.userId .. " added")
        loadfile(url .. "/Game/api/v1/UserJoined?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|${gameid}|" .. tostring(plr.UserId))()
    end)

    game:GetService("Players").PlayerRemoving:connect(function(plr)
        print("Player " .. plr.userId .. " leaving")
        loadfile(url .. "/Game/api/v1/UserLeft?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|${gameid}|" .. tostring(plr.UserId))()
    end)
    
    if placeId~=nil and url~=nil then
        wait()
        
        game:Load("http://www.rbx2016.tk/asset/?id=${gameid}|${key}")
    end
    
    ns:Start(port)
    
    
    scriptContext:SetTimeout(10)
    scriptContext.ScriptsDisabled = false
    
    
    
    loadfile(url .. "/Game/api/v1/GetPublicIp?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}")()

    spawn(function()
        wait(1)
        while true do
            loadfile(url .. 
            "/Game/api/v2.0/Refresh?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" ..
            game.JobId ..
            "|${gameid}" ..
            "|" ..
            tostring(game:GetService("Players").MaxPlayers) ..
            "|" ..
            publicIp .. 
            "|${port}|" .. 
            tostring(#game:GetService("Players"):GetPlayers()) .. 
            "|false|Unknown"
            )
            wait(10)
        end
    end)

    spawn(function()
        while true do
            wait(30)
            if #game:GetService("Players"):GetPlayers() == 0 then
                loadfile(url .. "/Game/api/v1/close?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" .. game.JobId .. "|${gameid}")
                game:FinishShutdown(false)
            end
        end
    end)
    
    
    game:GetService("RunService"):Run()`;
    } else {
        script = `local placeId = ${gameid}
        local port = ${port}
        local url = "http://www.rbx2016.tk"
        
        function waitForChild(parent, childName)
            while true do
                local child = parent:findFirstChild(childName)
                if child then
                    return child
                end
                parent.ChildAdded:wait()
            end
        end
        
        pcall(function() settings().Network.UseInstancePacketCache = true end)
        pcall(function() settings().Network.UsePhysicsPacketCache = true end)
        pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)
        
        settings().Network.PhysicsSend = Enum.PhysicsSendMethod.TopNErrors
        settings().Network.ExperimentalPhysicsEnabled = true
        settings().Network.WaitingForCharacterLogRate = 100
        pcall(function() settings().Diagnostics:LegacyScriptMode() end)
        
        local scriptContext = game:GetService('ScriptContext')
        pcall(function() scriptContext:AddStarterScript(37801172) end)
        scriptContext.ScriptsDisabled = true
        
        game:SetPlaceID(placeId, false)
        game:GetService("ChangeHistoryService"):SetEnabled(false)
        
        local ns = game:GetService("NetworkServer")

        ns:ConfigureAsCloudEditServer()
        
        if url~=nil then
            pcall(function() game:GetService("Players"):SetAbuseReportUrl(url .. "/AbuseReport/InGameChatHandler.ashx") end)
            pcall(function() game:GetService("ScriptInformationProvider"):SetAssetUrl(url .. "/Asset/") end)
            pcall(function() game:GetService("ContentProvider"):SetBaseUrl(url .. "/") end)
            pcall(function() game:GetService("Players"):SetChatFilterUrl(url .. "/Game/ChatFilter.ashx") end)
        
            game:GetService("BadgeService"):SetPlaceId(placeId)
        
            game:GetService("BadgeService"):SetIsBadgeLegalUrl("")
            game:GetService("InsertService"):SetBaseSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
            game:GetService("InsertService"):SetUserSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
            game:GetService("InsertService"):SetCollectionUrl(url .. "/Game/Tools/InsertAsset.ashx?sid=%d")
            game:GetService("InsertService"):SetAssetUrl(url .. "/Asset/?id=%d")
            game:GetService("InsertService"):SetAssetVersionUrl(url .. "/Asset/?assetversionid=%d")
            
            pcall(function() loadfile(url .. "/Game/LoadPlaceInfo.ashx?PlaceId=" .. placeId)() end)
            
        end
        
        settings().Diagnostics.LuaRamLimit = 0
        
        game:GetService("Players").PlayerAdded:connect(function(plr)
            print("Player " .. plr.userId .. " added")
            loadfile(url .. "/Game/api/v1/UserJoinedTeamCreate?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|${gameid}|" .. tostring(plr.UserId))()
        end)

        game:GetService("Players").PlayerRemoving:connect(function(plr)
            print("Player " .. plr.userId .. " leaving")
            loadfile(url .. "/Game/api/v1/UserLeftTeamCreate?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|${gameid}|" .. tostring(plr.UserId))()
        end)
        
        if placeId~=nil and url~=nil then
            wait()
            
            game:Load("http://www.rbx2016.tk/asset/?id=${gameid}|${siteConfig.PRIVATE.PRIVATE_API_KEY}")
        end
        
        ns:Start(port)
        
        
        scriptContext:SetTimeout(10)
        scriptContext.ScriptsDisabled = false
        
        
        
        loadfile(url .. "/Game/api/v1/GetPublicIp?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}")()
    
        spawn(function()
            wait(1)
            while true do
                loadfile(url .. 
                "/Game/api/v2.0/Refresh?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" ..
                game.JobId ..
                "|${gameid}" ..
                "|" ..
                tostring(game:GetService("Players").MaxPlayers) ..
                "|" ..
                publicIp .. 
                "|${port}|" .. 
                tostring(#game:GetService("Players"):GetPlayers()) .. 
                "|true|Unknown"
                )
                wait(10)
            end
        end)
    
        spawn(function()
            while true do
                wait(25)
                if #game:GetService("Players"):GetPlayers() == 0 then
                    loadfile(url .. "/Game/api/v1/close?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" .. game.JobId .. "|${gameid}")
                    game:FinishShutdown(false)
                end
            end
        end)
        
        
        `;
    }

    return script;
}

async function getRCCRenderScript(itemid, port, jobid) { // BROKEN, DO NOT USE (ThumbnailGenerator crashes rcc.)
    const isGame = await getGame(itemid) != null;

    let script = ``;

    if (isGame) {
        const key = uuidv4();
        PRIVATE_PLACE_KEYS.push(key);
        script = `local placeId = ${itemid}
        local port = ${port}
        local url = "http://www.rbx2016.tk"
        
        function waitForChild(parent, childName)
            while true do
                local child = parent:findFirstChild(childName)
                if child then
                    return child
                end
                parent.ChildAdded:wait()
            end
        end
        
        pcall(function() settings().Network.UseInstancePacketCache = true end)
        pcall(function() settings().Network.UsePhysicsPacketCache = true end)
        pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)
        
        settings().Network.PhysicsSend = Enum.PhysicsSendMethod.TopNErrors
        settings().Network.ExperimentalPhysicsEnabled = true
        settings().Network.WaitingForCharacterLogRate = 100
        pcall(function() settings().Diagnostics:LegacyScriptMode() end)
        
        local scriptContext = game:GetService('ScriptContext')
        pcall(function() scriptContext:AddStarterScript(37801172) end)
        scriptContext.ScriptsDisabled = true
        
        game:SetPlaceID(placeId, false)
        game:GetService("ChangeHistoryService"):SetEnabled(false)
        
        local ns = game:GetService("NetworkServer")
        
        if url~=nil then
            pcall(function() game:GetService("Players"):SetAbuseReportUrl(url .. "/AbuseReport/InGameChatHandler.ashx") end)
            pcall(function() game:GetService("ScriptInformationProvider"):SetAssetUrl(url .. "/Asset/") end)
            pcall(function() game:GetService("ContentProvider"):SetBaseUrl(url .. "/") end)
            pcall(function() game:GetService("Players"):SetChatFilterUrl(url .. "/Game/ChatFilter.ashx") end)
        
            game:GetService("BadgeService"):SetPlaceId(placeId)
        
            game:GetService("BadgeService"):SetIsBadgeLegalUrl("")
            game:GetService("InsertService"):SetBaseSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
            game:GetService("InsertService"):SetUserSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
            game:GetService("InsertService"):SetCollectionUrl(url .. "/Game/Tools/InsertAsset.ashx?sid=%d")
            game:GetService("InsertService"):SetAssetUrl(url .. "/Asset/?id=%d")
            game:GetService("InsertService"):SetAssetVersionUrl(url .. "/Asset/?assetversionid=%d")
            
            pcall(function() loadfile(url .. "/Game/LoadPlaceInfo.ashx?PlaceId=" .. placeId)() end)
            
        end
        
        settings().Diagnostics.LuaRamLimit = 0
        
        if placeId~=nil and url~=nil then
            wait()
            
            game:Load("http://www.rbx2016.tk/asset/?id=${itemid}|${key}")
        end

        spawn(function()
            while true do
                wait(25)
                loadfile(url .. "/Game/api/v1/close?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" .. game.JobId .. "|${itemid}")
                game:FinishShutdown(false)
            end
        end)
        
        local result = {data = game:GetService("ThumbnailGenerator"):Click("PNG", 420, 420, true), itemid = ${itemid}}
        local https = game:GetService("HttpService")
        local url = "https://www.rbx2016.tk/api/v1/thumbnail/upload?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}"
        
        local data = ""
        for k, v in pairs(result) do
            data = data .. ("&%s=%s"):format(
                https:UrlEncode(k),
                https:UrlEncode(v)
            )
        end
        data = data:sub(2)
        
        local resp = https:PostAsync(url, data, Enum.HttpContentType.ApplicationUrlEncoded, false)`;
    } else {
        const item = getCatalogItem(itemid);
        if (!item){
            script = `local url = "http://www.rbx2016.tk"
        game:GetService("ScriptContext").ScriptsDisabled = true
        local plr = game.Players:CreateLocalPlayer(0)
        plr.CharacterAppearance = "https://api.roblox.com/v1.1/avatar-fetch/?userId=15491471"
        plr:LoadCharacter(false)
        for i,v in pairs(plr.Character:GetChildren()) do
           print(v)
           if v:IsA("Tool") then
               plr.Character.Torso["Right Shoulder"].CurrentAngle = math.pi / 2
           end
        end

        spawn(function()
            while true do
                wait(25)
                loadfile(url .. "/Game/api/v1/close?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" .. game.JobId .. "|${itemid}")
                game:FinishShutdown(false)
            end
        end)

        local result = {data = game:GetService("ThumbnailGenerator"):Click("PNG", 420, 420, true), itemid = ${itemid}}
        local https = game:GetService("HttpService")
        local url = "https://www.rbx2016.tk/api/v1/thumbnail/upload?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}"
        
        local data = ""
        for k, v in pairs(result) do
            data = data .. ("&%s=%s"):format(
                https:UrlEncode(k),
                https:UrlEncode(v)
            )
        end
        data = data:sub(2)
        
        local resp = https:PostAsync(url, data, Enum.HttpContentType.ApplicationUrlEncoded, false)
        `;
        }else{
            let loadCode = ""
            if (item.itemtype == "Shirt"){
                loadCode = `local shirt = Instance.new("Shirt")
                shirt.ShirtTemplate = "rbxassetid://${item.itemdecalid}"
                shirt.Parent = plr.Character`;
            }else if (item.itemtype == "Pants"){
                loadCode = `local pants = Instance.new("Pants")
                pants.PantsTemplate = "rbxassetid://${item.itemdecalid}"
                pants.Parent = plr.Character`;
            }
            script = `local url = "http://www.rbx2016.tk"
        game:GetService("ScriptContext").ScriptsDisabled = true
        local plr = game.Players:CreateLocalPlayer(0)
        plr.CharacterAppearance = "https://api.rbx2016.tk/v1.1/avatar-fetch/?userId=0"
        plr:LoadCharacter(false)

        for i,v in pairs(plr.Character:GetChildren()) do
           if v:IsA("Shirt") or v:IsA("Pants") then
               v:Destroy()
           end
        end
        
        ${loadCode}
        
        for i,v in pairs(plr.Character:GetChildren()) do
           if v:IsA("Tool") then
               plr.Character.Torso["Right Shoulder"].CurrentAngle = math.pi / 2
           end
        end

        spawn(function()
            while true do
                wait(25)
                loadfile(url .. "/Game/api/v1/close?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}|" .. game.JobId .. "|${itemid}")
                game:FinishShutdown(false)
            end
        end)
        
        local result = game:GetService("ThumbnailGenerator"):Click("PNG", 5, 5, true)
        error(result)

        local result = {data = game:GetService("ThumbnailGenerator"):Click("PNG", 420, 420, true), itemid = ${itemid}}
        local https = game:GetService("HttpService")
        url = url .. "/api/v1/thumbnail/upload?apiKey=${siteConfig.PRIVATE.PRIVATE_API_KEY}"

        local data = ""
        for k, v in pairs(result) do
            data = data .. ("&" .. "%s" .. "=" .. "%s"):format(
                https:UrlEncode(k),
                https:UrlEncode(v)
            )
        end
        data = data:sub(2)
        
        local resp = https:PostAsync(url, data, Enum.HttpContentType.ApplicationUrlEncoded, false)
        `;
        }
    }

    return script;
}

// console.log(getRCCHostScript(1, 53640))

let activeJobs = {};
let activeGameJobs = {};

async function newJob(gameid, isCloudEdit = false, isRenderJob = false) {
    return new Promise(async returnPromise => {
        MongoClient.connect(mongourl, function (err, db) {
            if (err) throw err;
            const dbo = db.db(dbName);
            if (!isCloudEdit) {
                if (!isRenderJob) {
                    dbo.collection("games").findOne({
                        gameid: gameid,
                        port: 0
                    }, function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        if (gameid != 0 && result == null) {
                            db.close();
                            returnPromise(null);
                            return;
                        }

                        if (activeGameJobs[gameid]) { // For now..
                            db.close();
                            returnPromise(null);
                            return;
                        }

                        let myPort = 0;
                        let myHostPort = 0;
                        let jobId = "";
                        let proc = null;

                        let hasExecutedOnce = false;

                        let self = {}

                        async function stop() {
                            return new Promise(async returnPromise => {
                                if (myPort == 0) {
                                    returnPromise(null);
                                    return;
                                }
                                try {
                                    delete activeJobs[jobId];
                                } catch {}
                                try {
                                    delete activeGameJobs[gameid][jobId];
                                } catch {}
                                try {
                                    if (Object.keys(activeGameJobs[gameid]).length == 0) {
                                        delete activeGameJobs[gameid];
                                    }
                                } catch {}


                                availableRCCPorts.push(myPort);
                                availableGamePorts.push(myHostPort);

                                try {
                                    // proc.stdin.pause();
                                    // proc.kill();
                                    kill(proc.pid, 'SIGTERM');
                                } catch {}
                                myPort = 0;
                                myHostPort = 0;
                                jobId = "";
                                returnPromise(true);
                                /*
                                pm2.delete(`RCC-${myPort}`, (err) => {
                                    if (err) {
                                        console.error(err);
                                    }
                                    myPort = 0;
                                    myHostPort = 0;
                                    jobId = "";
                                    returnPromise(true);
                                });
                                */
                            });
                        }

                        async function execute(script, timeout = 10, connectionTimeout = 1000) {
                            return new Promise(async returnPromise => {
                                if (myPort == 0) {
                                    returnPromise(null);
                                    return;
                                }
                                const url = `http://127.0.0.1:${myPort}/`;
                                const headers2 = {
                                    'user-agent': 'RCC-Arbiter',
                                    'Content-Type': 'text/xml;charset=UTF-8',
                                    'soapAction': `https://www.rbx2016.tk/internal/${siteConfig.PRIVATE.PRIVATE_API_KEY}/RCCService.wsdl#OpenJob`,
                                };
                                const xml = utf8.encode(getRCCScriptXml(script, jobId, timeout, hasExecutedOnce));
                                if (!hasExecutedOnce) {
                                    hasExecutedOnce = true;
                                }

                                let c = siteConfig.backend.maxGameStartupTime;
                                while (true) {
                                    try {
                                        const {
                                            response
                                        } = await soapRequest({
                                            url: url,
                                            headers: headers2,
                                            xml: xml,
                                            timeout: connectionTimeout
                                        }); // Optional timeout parameter(milliseconds)
                                        const {
                                            headers,
                                            body,
                                            statusCode
                                        } = response;
                                        if (statusCode != 200 && statusCode != 302 && statusCode != 304) {
                                            returnPromise(false);
                                            return;
                                        }
                                        let result = [];
                                        let result0 = body.split("<ns1:value>");
                                        if (result0.length > 1) {
                                            for (let i = 1; i < result0.length; i++) {
                                                result.push("ok|" + result0[i].split("</ns1:value>")[0]);
                                            }
                                        }
                                        result0 = body.split("<faultstring>");
                                        if (result0.length > 1) {
                                            result.push("err|" + result0[1].split("</faultstring>")[0]);
                                        }
                                        returnPromise(result);
                                        return;
                                    } catch (e) {
                                        // console.error(e);
                                        try {
                                            let result = [];
                                            let result0 = e.split("<ns1:value>");
                                            if (result0.length > 1) {
                                                for (let i = 1; i < result0.length; i++) {
                                                    result.push("ok|" + result0[i].split("</ns1:value>")[0]);
                                                }
                                            }
                                            result0 = e.split("<faultstring>");
                                            if (result0.length > 1) {
                                                result.push("err|" + result0[1].split("</faultstring>")[0]);
                                            }
                                            await stop();
                                            returnPromise(result);
                                            return;
                                        } catch (e) {
                                            if (c <= 0) {
                                                await stop();
                                                returnPromise(["err|Unknown Error"]);
                                                return;
                                            }
                                            c--;
                                            await sleep(1000);
                                        }
                                    }
                                }
                            });
                        }

                        async function start() {
                            return new Promise(async returnPromise => {
                                if (myHostPort != 0) {
                                    // throw new Error("Already Hosting");
                                    returnPromise(false);
                                }
                                myPort = availableRCCPorts.shift();
                                myHostPort = availableGamePorts.shift();
                                jobId = uuidv4();
                                if (isWin) {
                                    let rccFolder = rccPath.split(path.sep);
                                    rccFolder = rccFolder.splice(0, rccFolder.length - 1);
                                    rccFolder = rccFolder.join(path.sep);

                                    activeJobs[jobId] = self;
                                    if (!activeGameJobs[gameid]) {
                                        activeGameJobs[gameid] = {};
                                    }
                                    activeGameJobs[gameid][jobId] = self;

                                    proc = exec(`${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`, {
                                        cwd: rccFolder
                                    }, (err, stdout, stderr) => {});

                                    returnPromise(true);
                                    /*
                                    pm2.start({
                                        name: `RCC-${myPort}`,
                                        script: `${rccPath}`,
                                        cron_restart: 0,
                                        autorestart: false,
                                        stop_exit_codes: [0],
                                        args: `-Console -Start -Custom -PlaceId:${gameid} ${myPort}`
                                        // out_file: `app.strout.log`,
                                        // error_file: `app.strerr.log`
                                    }, async function (err, apps) {
                                        if (err) {
                                            console.error(err)
                                            returnPromise(false);
                                            return;
                                        }
                                        let c = 0;
                                        while (c < siteConfig.backend.maxGameStartupTime && (await getGame(gameid)).port == 0) {
                                            await sleep(1000);
                                            c ++;
                                        }
                                        activeJobs[jobId] = self;
                                        returnPromise(true);
                                    });
                                    */
                                } else {
                                    // REQUIRES WINE.
                                    let rccFolder = rccPath.split(path.sep);
                                    rccFolder = rccFolder.splice(0, rccFolder.length - 1);
                                    rccFolder = rccFolder.join(path.sep);

                                    /*
                                    sudo apt install xvfb lightdm
    
                                    export DISPLAY=:1
                                    Xvfb :1 -screen 0 1024x768x16 &
                                    sleep 1
    
                                    #exec gnome-session & # use gnome-session instead of lightdm
                                    exec lightdm-session &
                                    */

                                    activeJobs[jobId] = self;
                                    if (!activeGameJobs[gameid]) {
                                        activeGameJobs[gameid] = {};
                                    }
                                    activeGameJobs[gameid][jobId] = self;

                                    proc = exec(`${__dirname}/exec.sh ${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`, {
                                        cwd: rccFolder
                                    }, (err, stdout, stderr) => {});

                                    returnPromise(true);
                                    /*
                                    pm2.start({
                                        name: `RCC-${myPort}`,
                                        script: `exec.sh`,
                                        cron_restart: 0,
                                        autorestart: false,
                                        stop_exit_codes: [0],
                                        args: `${rccPath} -Console -PlaceId:${gameid} -Start -Custom -PlaceId:${gameid} ${myPort}`
                                        // out_file: `app.strout.log`,
                                        // error_file: `app.strerr.log`
                                    }, async function (err, apps) {
                                        if (err) {
                                            console.error(err)
                                            returnPromise(false);
                                            return;
                                        }
                                        let c = 0;
                                        while (c < siteConfig.backend.maxGameStartupTime && (await getGame(gameid)).port == 0) {
                                            await sleep(1000);
                                            c ++;
                                        }
                                        activeJobs[jobId] = self;
                                        returnPromise(true);
                                    });
                                    */
                                }
                            });
                        }

                        self = {
                            host: async function () {
                                await start();
                                await sleep(1000);
                                const resp = await execute(getRCCHostScript(gameid, myHostPort, jobId, false), 6000000);
                                if (resp == "err|Unknown Error") {
                                    await stop();
                                }
                            },
                            update: async function () {
                                return new Promise(async returnPromise => {
                                    if (myPort == 0) {
                                        returnPromise(false);
                                        return;
                                    }
                                    MongoClient.connect(mongourl, function (err, db) {
                                        if (err) throw err;
                                        const dbo = db.db(dbName);
                                        dbo.collection("games").findOne({
                                            gameid: gameid,
                                            port: myHostPort
                                        }, async function (err, result) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            if (result == null) {
                                                await stop();
                                                db.close();
                                                returnPromise(true);
                                                return;
                                            }
                                            db.close();
                                            returnPromise(false);
                                        });
                                    });
                                });
                            },
                            start: start,
                            stop: stop,
                            execute: execute,
                            isAlive: function () {
                                return myPort != 0;
                            },
                            getRccPort: function () {
                                return myPort;
                            },
                            getHostPort: function () {
                                return myHostPort;
                            },
                            getJobId: function () {
                                return jobId;
                            }
                        }

                        returnPromise(self);
                    });
                } else {
                    dbo.collection("games").findOne({
                        gameid: gameid,
                        port: 0
                    }, function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        if (gameid != 0 && result == null) {
                            db.close();
                            returnPromise(null);
                            return;
                        }

                        if (activeGameJobs[gameid]) { // For now..
                            db.close();
                            returnPromise(null);
                            return;
                        }

                        let myPort = 0;
                        let myHostPort = 0;
                        let jobId = "";
                        let proc = null;

                        let hasExecutedOnce = false;

                        let self = {}

                        async function stop() {
                            return new Promise(async returnPromise => {
                                if (myPort == 0) {
                                    returnPromise(null);
                                    return;
                                }
                                try {
                                    delete activeJobs[jobId];
                                } catch {}
                                try {
                                    delete activeGameJobs[gameid][jobId];
                                } catch {}
                                try {
                                    if (Object.keys(activeGameJobs[gameid]).length == 0) {
                                        delete activeGameJobs[gameid];
                                    }
                                } catch {}


                                availableRCCPorts.push(myPort);
                                availableGamePorts.push(myHostPort);

                                try {
                                    // proc.stdin.pause();
                                    // proc.kill();
                                    kill(proc.pid, 'SIGTERM');
                                } catch {}
                                myPort = 0;
                                myHostPort = 0;
                                jobId = "";
                                returnPromise(true);
                                /*
                                pm2.delete(`RCC-${myPort}`, (err) => {
                                    if (err) {
                                        console.error(err);
                                    }
                                    myPort = 0;
                                    myHostPort = 0;
                                    jobId = "";
                                    returnPromise(true);
                                });
                                */
                            });
                        }

                        async function execute(script, timeout = 10, connectionTimeout = 1000) {
                            return new Promise(async returnPromise => {
                                if (myPort == 0) {
                                    returnPromise(null);
                                    return;
                                }
                                const url = `http://127.0.0.1:${myPort}/`;
                                const headers2 = {
                                    'user-agent': 'RCC-Arbiter',
                                    'Content-Type': 'text/xml;charset=UTF-8',
                                    'soapAction': `https://www.rbx2016.tk/internal/${siteConfig.PRIVATE.PRIVATE_API_KEY}/RCCService.wsdl#OpenJob`,
                                };
                                const xml = utf8.encode(getRCCScriptXml(script, jobId, timeout, hasExecutedOnce));
                                if (!hasExecutedOnce) {
                                    hasExecutedOnce = true;
                                }

                                let c = siteConfig.backend.maxGameStartupTime;
                                while (true) {
                                    try {
                                        const {
                                            response
                                        } = await soapRequest({
                                            url: url,
                                            headers: headers2,
                                            xml: xml,
                                            timeout: connectionTimeout
                                        }); // Optional timeout parameter(milliseconds)
                                        const {
                                            headers,
                                            body,
                                            statusCode
                                        } = response;
                                        if (statusCode != 200 && statusCode != 302 && statusCode != 304) {
                                            returnPromise(false);
                                            return;
                                        }
                                        let result = [];
                                        let result0 = body.split("<ns1:value>");
                                        if (result0.length > 1) {
                                            for (let i = 1; i < result0.length; i++) {
                                                result.push("ok|" + result0[i].split("</ns1:value>")[0]);
                                            }
                                        }
                                        result0 = body.split("<faultstring>");
                                        if (result0.length > 1) {
                                            result.push("err|" + result0[1].split("</faultstring>")[0]);
                                        }
                                        returnPromise(result);
                                        return;
                                    } catch (e) {
                                        // console.error(e);
                                        try {
                                            let result = [];
                                            let result0 = e.split("<ns1:value>");
                                            if (result0.length > 1) {
                                                for (let i = 1; i < result0.length; i++) {
                                                    result.push("ok|" + result0[i].split("</ns1:value>")[0]);
                                                }
                                            }
                                            result0 = e.split("<faultstring>");
                                            if (result0.length > 1) {
                                                result.push("err|" + result0[1].split("</faultstring>")[0]);
                                            }
                                            await stop();
                                            returnPromise(result);
                                            return;
                                        } catch (e) {
                                            if (c <= 0) {
                                                await stop();
                                                returnPromise(["err|Unknown Error"]);
                                                return;
                                            }
                                            c--;
                                            await sleep(1000);
                                        }
                                    }
                                }
                            });
                        }

                        async function start() {
                            return new Promise(async returnPromise => {
                                if (myHostPort != 0) {
                                    // throw new Error("Already Hosting");
                                    returnPromise(false);
                                }
                                myPort = availableRCCPorts.shift();
                                myHostPort = availableGamePorts.shift();
                                jobId = uuidv4();
                                if (isWin) {
                                    let rccFolder = rccPath.split(path.sep);
                                    rccFolder = rccFolder.splice(0, rccFolder.length - 1);
                                    rccFolder = rccFolder.join(path.sep);

                                    activeJobs[jobId] = self;
                                    if (!activeGameJobs[gameid]) {
                                        activeGameJobs[gameid] = {};
                                    }
                                    activeGameJobs[gameid][jobId] = self;

                                    proc = exec(`${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`, {
                                        cwd: rccFolder
                                    }, (err, stdout, stderr) => {});

                                    returnPromise(true);
                                    /*
                                    pm2.start({
                                        name: `RCC-${myPort}`,
                                        script: `${rccPath}`,
                                        cron_restart: 0,
                                        autorestart: false,
                                        stop_exit_codes: [0],
                                        args: `-Console -Start -Custom -PlaceId:${gameid} ${myPort}`
                                        // out_file: `app.strout.log`,
                                        // error_file: `app.strerr.log`
                                    }, async function (err, apps) {
                                        if (err) {
                                            console.error(err)
                                            returnPromise(false);
                                            return;
                                        }
                                        let c = 0;
                                        while (c < siteConfig.backend.maxGameStartupTime && (await getGame(gameid)).port == 0) {
                                            await sleep(1000);
                                            c ++;
                                        }
                                        activeJobs[jobId] = self;
                                        returnPromise(true);
                                    });
                                    */
                                } else {
                                    // REQUIRES WINE.
                                    let rccFolder = rccPath.split(path.sep);
                                    rccFolder = rccFolder.splice(0, rccFolder.length - 1);
                                    rccFolder = rccFolder.join(path.sep);

                                    /*
                                    sudo apt install xvfb lightdm
    
                                    export DISPLAY=:1
                                    Xvfb :1 -screen 0 1024x768x16 &
                                    sleep 1
    
                                    #exec gnome-session & # use gnome-session instead of lightdm
                                    exec lightdm-session &
                                    */

                                    activeJobs[jobId] = self;
                                    if (!activeGameJobs[gameid]) {
                                        activeGameJobs[gameid] = {};
                                    }
                                    activeGameJobs[gameid][jobId] = self;

                                    proc = exec(`${__dirname}/exec.sh ${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`, {
                                        cwd: rccFolder
                                    }, (err, stdout, stderr) => {});

                                    returnPromise(true);
                                    /*
                                    pm2.start({
                                        name: `RCC-${myPort}`,
                                        script: `exec.sh`,
                                        cron_restart: 0,
                                        autorestart: false,
                                        stop_exit_codes: [0],
                                        args: `${rccPath} -Console -PlaceId:${gameid} -Start -Custom -PlaceId:${gameid} ${myPort}`
                                        // out_file: `app.strout.log`,
                                        // error_file: `app.strerr.log`
                                    }, async function (err, apps) {
                                        if (err) {
                                            console.error(err)
                                            returnPromise(false);
                                            return;
                                        }
                                        let c = 0;
                                        while (c < siteConfig.backend.maxGameStartupTime && (await getGame(gameid)).port == 0) {
                                            await sleep(1000);
                                            c ++;
                                        }
                                        activeJobs[jobId] = self;
                                        returnPromise(true);
                                    });
                                    */
                                }
                            });
                        }

                        self = {
                            render: async function (itemid) {
                                await start();
                                await sleep(1000);
                                const resp = await execute(await getRCCRenderScript(itemid, myHostPort, jobId, false), 6000000);
                                console.log(resp);
                                if (resp == "err|Unknown Error") {
                                    await stop();
                                }
                            },
                            update: async function () {
                                return new Promise(async returnPromise => {
                                    if (myPort == 0) {
                                        returnPromise(false);
                                        return;
                                    }
                                    MongoClient.connect(mongourl, function (err, db) {
                                        if (err) throw err;
                                        const dbo = db.db(dbName);
                                        dbo.collection("games").findOne({
                                            gameid: gameid,
                                            port: myHostPort
                                        }, async function (err, result) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            if (result == null) {
                                                await stop();
                                                db.close();
                                                returnPromise(true);
                                                return;
                                            }
                                            db.close();
                                            returnPromise(false);
                                        });
                                    });
                                });
                            },
                            start: start,
                            stop: stop,
                            execute: execute,
                            isAlive: function () {
                                return myPort != 0;
                            },
                            getRccPort: function () {
                                return myPort;
                            },
                            getHostPort: function () {
                                return myHostPort;
                            },
                            getJobId: function () {
                                return jobId;
                            }
                        }

                        returnPromise(self);
                    });
                }
            } else {
                dbo.collection("games").findOne({
                    gameid: gameid,
                    port: 0
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (gameid != 0 && result == null) {
                        db.close();
                        returnPromise(null);
                        return;
                    }

                    if (activeGameJobs[gameid]) { // For now..
                        db.close();
                        returnPromise(null);
                        return;
                    }

                    let proc = null;

                    let myPort = 0;
                    let myHostPort = 0;
                    let jobId = "";

                    let hasExecutedOnce = false;

                    let self = {}

                    async function stop() {
                        return new Promise(async returnPromise => {
                            if (myPort == 0) {
                                returnPromise(null);
                                return;
                            }
                            if (Object.keys(activeJobs).includes(jobId)) {
                                delete activeJobs[jobId];
                            }
                            if (Object.keys(activeGameJobs).includes(gameid) && Object.keys(activeGameJobs[gameid]).includes(jobId)) {
                                delete activeGameJobs[gameid][jobId];
                                if (Object.keys(activeGameJobs[gameid]).length == 0) {
                                    delete activeGameJobs[gameid];
                                }
                            }
                            availableRCCPorts.push(myPort);
                            availableGamePorts.push(myHostPort);

                            try {
                                // proc.stdin.pause();
                                // proc.kill();
                                kill(proc.pid, 'SIGTERM');
                            } catch {}
                            myPort = 0;
                            myHostPort = 0;
                            jobId = "";
                            returnPromise(true);
                            /*
                            pm2.delete(`RCC-${myPort}`, (err) => {
                                if (err) {
                                    console.error(err);
                                }
                                myPort = 0;
                                myHostPort = 0;
                                jobId = "";
                                returnPromise(true);
                            });
                            */
                        });
                    }

                    async function execute(script, timeout = 10, connectionTimeout = 1000) {
                        return new Promise(async returnPromise => {
                            if (myPort == 0) {
                                returnPromise(null);
                                return;
                            }
                            const url = `http://127.0.0.1:${myPort}/`;
                            const headers2 = {
                                'user-agent': 'RCC-Arbiter',
                                'Content-Type': 'text/xml;charset=UTF-8',
                                'soapAction': `https://www.rbx2016.tk/internal/${siteConfig.PRIVATE.PRIVATE_API_KEY}/RCCService.wsdl#OpenJob`,
                            };
                            const xml = utf8.encode(getRCCScriptXml(script, jobId, timeout, hasExecutedOnce));
                            if (!hasExecutedOnce) {
                                hasExecutedOnce = true;
                            }

                            let c = siteConfig.backend.maxGameStartupTime;
                            while (true) {
                                try {
                                    const {
                                        response
                                    } = await soapRequest({
                                        url: url,
                                        headers: headers2,
                                        xml: xml,
                                        timeout: connectionTimeout
                                    }); // Optional timeout parameter(milliseconds)
                                    const {
                                        headers,
                                        body,
                                        statusCode
                                    } = response;
                                    if (statusCode != 200 && statusCode != 302 && statusCode != 304) {
                                        returnPromise(false);
                                        return;
                                    }
                                    let result = [];
                                    let result0 = body.split("<ns1:value>");
                                    if (result0.length > 1) {
                                        for (let i = 1; i < result0.length; i++) {
                                            result.push("ok|" + result0[i].split("</ns1:value>")[0]);
                                        }
                                    }
                                    result0 = body.split("<faultstring>");
                                    if (result0.length > 1) {
                                        result.push("err|" + result0[1].split("</faultstring>")[0]);
                                    }
                                    returnPromise(result);
                                    return;
                                } catch (e) {
                                    // console.error(e);
                                    try {
                                        let result = [];
                                        let result0 = e.split("<ns1:value>");
                                        if (result0.length > 1) {
                                            for (let i = 1; i < result0.length; i++) {
                                                result.push("ok|" + result0[i].split("</ns1:value>")[0]);
                                            }
                                        }
                                        result0 = e.split("<faultstring>");
                                        if (result0.length > 1) {
                                            result.push("err|" + result0[1].split("</faultstring>")[0]);
                                        }
                                        await stop();
                                        returnPromise(result);
                                        return;
                                    } catch (e) {
                                        if (c <= 0) {
                                            await stop();
                                            returnPromise(["err|Unknown Error"]);
                                            return;
                                        }
                                        c--;
                                        await sleep(1000);
                                    }
                                }
                            }
                        });
                    }

                    async function start() {
                        return new Promise(async returnPromise => {
                            if (myHostPort != 0) {
                                // throw new Error("Already Hosting");
                                returnPromise(false);
                            }
                            myPort = availableRCCPorts.shift();
                            myHostPort = availableGamePorts.shift();
                            jobId = uuidv4();
                            if (isWin) {
                                let rccFolder = rccPath.split(path.sep);
                                rccFolder = rccFolder.splice(0, rccFolder.length - 1);
                                rccFolder = rccFolder.join(path.sep);

                                activeJobs[jobId] = self;
                                if (!activeGameJobs[gameid]) {
                                    activeGameJobs[gameid] = {};
                                }
                                activeGameJobs[gameid][jobId] = self;

                                proc = exec(`${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`, {
                                    cwd: rccFolder
                                }, (err, stdout, stderr) => {});

                                returnPromise(true);
                                /*
                                pm2.start({
                                    name: `RCC-${myPort}`,
                                    script: `${rccPath}`,
                                    cron_restart: 0,
                                    autorestart: false,
                                    stop_exit_codes: [0],
                                    args: `-Console -Start -Custom -PlaceId:${gameid} ${myPort}`
                                    // out_file: `app.strout.log`,
                                    // error_file: `app.strerr.log`
                                }, async function (err, apps) {
                                    if (err) {
                                        console.error(err)
                                        returnPromise(false);
                                        return;
                                    }
                                    let c = 0;
                                    while (c < siteConfig.backend.maxGameStartupTime && (await getGame(gameid)).port == 0) {
                                        await sleep(1000);
                                        c ++;
                                    }
                                    activeJobs[jobId] = self;
                                    returnPromise(true);
                                });
                                */
                            } else {
                                // REQUIRES WINE.
                                let rccFolder = rccPath.split(path.sep);
                                rccFolder = rccFolder.splice(0, rccFolder.length - 1);
                                rccFolder = rccFolder.join(path.sep);
                                /*
                                sudo apt install xvfb lightdm

                                export DISPLAY=:1
                                Xvfb :1 -screen 0 1024x768x16 &
                                sleep 1

                                #exec gnome-session & # use gnome-session instead of lightdm
                                exec lightdm-session &
                                */

                                activeJobs[jobId] = self;
                                if (!activeGameJobs[gameid]) {
                                    activeGameJobs[gameid] = {};
                                }
                                activeGameJobs[gameid][jobId] = self;

                                proc = exec(`${__dirname}/exec.sh ${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`, {
                                    cwd: rccFolder
                                }, (err, stdout, stderr) => {});

                                returnPromise(true);
                                /*
                                pm2.start({
                                    name: `RCC-${myPort}`,
                                    script: `exec.sh`,
                                    cron_restart: 0,
                                    autorestart: false,
                                    stop_exit_codes: [0],
                                    args: `${rccPath} -Console -Start -Custom -PlaceId:${gameid} ${myPort}`
                                    // out_file: `app.strout.log`,
                                    // error_file: `app.strerr.log`
                                }, async function (err, apps) {
                                    if (err) {
                                        console.error(err)
                                        returnPromise(false);
                                        return;
                                    }
                                    let c = 0;
                                    while (c < siteConfig.backend.maxGameStartupTime && (await getGame(gameid)).port == 0) {
                                        await sleep(1000);
                                        c ++;
                                    }
                                    activeJobs[jobId] = self;
                                    returnPromise(true);
                                });
                                */
                            }
                        });
                    }

                    self = {
                        host: async function () {
                            await start();
                            await sleep(1000);
                            const resp = await execute(getRCCHostScript(gameid, myHostPort, jobId, true), 6000000);
                            if (resp == "err|Unknown Error") {
                                await stop();
                            }
                        },
                        update: async function () {
                            return new Promise(async returnPromise => {
                                if (myPort == 0) {
                                    returnPromise(false);
                                    return;
                                }
                                MongoClient.connect(mongourl, function (err, db) {
                                    if (err) throw err;
                                    const dbo = db.db(dbName);
                                    dbo.collection("games").findOne({
                                        gameid: gameid,
                                        port: myHostPort
                                    }, async function (err, result) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        if (result == null) {
                                            await stop();
                                            db.close();
                                            returnPromise(true);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(false);
                                    });
                                });
                            });
                        },
                        start: start,
                        stop: stop,
                        execute: execute,
                        isAlive: function () {
                            return myPort != 0;
                        },
                        getRccPort: function () {
                            return myPort;
                        },
                        getHostPort: function () {
                            return myHostPort;
                        },
                        getJobId: function () {
                            return jobId;
                        }
                    }

                    returnPromise(self);
                });
            }
        });
    });
}

async function getJob(jobId) {
    return new Promise(async returnPromise => {
        if (Object.keys(activeJobs).includes(jobId)) {
            returnPromise(activeJobs[jobId]);
            return;
        }
        returnPromise(null);
    });
}

async function getJobs() {
    return new Promise(async returnPromise => {
        returnPromise(Object.keys(activeJobs));
    });
}

async function getJobsByGameId(gameid) {
    return new Promise(async returnPromise => {
        if (typeof activeGameJobs[gameid] == "undefined") {
            returnPromise([]);
            return;
        }
        returnPromise(Object.keys(activeGameJobs[gameid]));
    });
}

let attemptedWhitelistIps = {};
let ratingsUserIds = {};
let userLaunchStatuses = {};

setInterval(() => {
    ratingsUserIds = {};
}, 1000 * 60 * 30);

async function renderCatalogItem(itemid) {

}

if (siteConfig.backend.PRODUCTION) {
    process.stdin.resume(); //so the program will not close instantly

    async function exitHandler(options, exitCode) {
        // if (options.cleanup) console.log('clean');
        // if (exitCode || exitCode === 0) console.log(exitCode);
        for (let i = 0; i < Object.keys(activeJobs).length; i++) {
            const job = activeJobs[Object.keys(activeJobs)[i]];
            await job.stop();
        }
        if (options.exit) process.exit();
    }

    //do something when app is closing
    process.on('exit', exitHandler.bind(null, {
        cleanup: true,
        exit: true
    }));

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {
        exit: true
    }));

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, {
        exit: true
    }));
    process.on('SIGUSR2', exitHandler.bind(null, {
        exit: true
    }));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {
        exit: true
    }));
}

module.exports = {
    getPRIVATE_PLACE_KEYS: function () {
        return PRIVATE_PLACE_KEYS;
    },
    removePrivatePlaceKey: function (key) {
        if (PRIVATE_PLACE_KEYS.includes(key)) {
            PRIVATE_PLACE_KEYS.splice(PRIVATE_PLACE_KEYS.indexOf(key), 1);
        }
    },

    pendingStudioAuthentications: {},
    pendingPlayerAuthentications: {},

    setDataStore: setDataStore,
    getDataStore: getDataStore,
    increaseDataStore: increaseDataStore,
    getSortedDataStore: getSortedDataStore,

    setMaintenanceWhitelistCode: setMaintenanceWhitelistCode,
    getMaintenanceWhitelistCode: getMaintenanceWhitelistCode,

    getMaintenanceModeWhitelistedIps: function () {
        return maintenanceModeWhitelistedIps;
    },
    addMaintenanceModeWhitelistedIp: function (ip) {
        maintenanceModeWhitelistedIps.push(ip);
    },
    attemptMaintenanceModeWhitelistedIp: async function (ip, key) {
        return new Promise(async returnPromise => {
            if (siteConfig.backend.canBypassMaintenanceScreen == false) {
                returnPromise(false);
                return;
            }
            if (typeof attemptedWhitelistIps[ip] != "undefined" && attemptedWhitelistIps[ip] >= siteConfig.backend.maxMaintenanceWhitelistAttempts) {
                returnPromise(false);
                return;
            }
            const code = await getMaintenanceWhitelistCode();
            if (code == "" || code == null) {
                returnPromise(false);
                return;
            }
            if (key != code) {
                if (typeof attemptedWhitelistIps[ip] == "undefined") {
                    attemptedWhitelistIps[ip] = 1;
                } else {
                    attemptedWhitelistIps[ip]++;
                }
                returnPromise(false);
                return;
            }
            maintenanceModeWhitelistedIps.push(ip);
            returnPromise(true);
        });
    },
    resetMaintenanceModeWhitelistedIps: function () {
        attemptedWhitelistIps = {};
        maintenanceModeWhitelistedIps = ["127.0.0.1", "::1"];
    },

    uuidv1: uuidv1,
    uuidv4: uuidv4,

    getSiteConfig: function () {
        return siteConfig;
    },

    approveAsset: async function (userid, assetid) {
        return new Promise(async returnPromise => {
            const dbo = await getDataStore();
            dbo.collection("assets").updateOne({
                assetid: assetid,
            }, {
                $set: {
                    approved: getUnixTimestamp(),
                    approvedBy: userid,
                }
            }, function (err, result) {
                if (err) {
                    returnPromise(false);
                    return;
                }
                returnPromise(true);
            });
        });
    },

    deleteAsset: async function (assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);

                dbo.collection("assets").updateOne({
                    id: assetid,
                }, {
                    $set: {
                        deleted: true
                    }
                }, function (err, result) {
                    if (err) {
                        returnPromise(false);
                        return;
                    }
                    returnPromise(true);
                });
            });
        });
    },

    changePassword: async function (userid, password) {
        return new Promise(async returnPromise => {
            password = bcrypt.hashSync(password, 10);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);

                dbo.collection("users").updateOne({
                    userid: userid,
                }, {
                    $set: {
                        password: password
                    }
                }, function (err, result) {
                    if (err) {
                        returnPromise(false);
                        return;
                    }
                    returnPromise(true);
                });
            });
        });
    },

    createUser: async function (username, password, birthday, gender, ip) {
        return new Promise(async returnPromise => {
            username = filterText3(username);
            password = bcrypt.hashSync(password, 10);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);

                dbo.collection("users").count({}, function (error, numOfDocs) {
                    const COOKIE = generateCookie();
                    const myobj = {
                        userid: numOfDocs + 1,
                        username: username,
                        description: "",
                        email: "",
                        emailverified: false,
                        robux: siteConfig.backend.starterItems.starterRobux,
                        tix: siteConfig.backend.starterItems.starterTix,
                        lastTix: getUnixTimestamp(),
                        membership: siteConfig.backend.starterItems.starterMembership,
                        password: password,
                        birthday: Math.floor(birthday / 1000),
                        gender: gender,
                        created: getUnixTimestamp(),
                        isMod: siteConfig.backend.starterItems.DANGER_STARTER_MOD,
                        isAdmin: siteConfig.backend.starterItems.DANGER_STARTER_ADMIN,
                        banned: false,
                        bannedDate: 0,
                        bannedModNote: "",
                        bannedReason: "",
                        bannedReasonItem: "",
                        token: "",
                        xcsrftoken: generateCSRF(),
                        cookie: COOKIE,
                        ip: siteConfig.backend.logSignupIP ? ip : "",
                        lastOnline: 0,
                        loginCode: "",
                        seenLoginCode: "",
                        playing: 0,
                        editing: 0,
                        lastStudio: 0,
                        inviteKey: "",
                        favoritedGames: [],
                        recentlyPlayedGames: [],
                        placeVisits: 0,
                        firstDailyAssetUpload: 0,

                        theme: "Light"
                    };
                    dbo.collection("users").insertOne(myobj, function (err, res) {
                        if (err) throw err;
                        db.close();
                        returnPromise(COOKIE);
                    });
                });
            });
        });
    },

    overwriteUser: async function (username, password, birthday, gender, ip) {
        return new Promise(async returnPromise => {
            username = filterText3(username);
            password = bcrypt.hashSync(password, 10);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                const COOKIE = generateCookie();
                const myobj = {
                    userid: numOfDocs + 1,
                    username: username,
                    description: "",
                    statusdescription: "",
                    email: "",
                    emailverified: false,
                    robux: siteConfig.backend.starterItems.starterRobux,
                    membership: 0,
                    password: password,
                    birthday: Math.floor(birthday / 1000),
                    gender: gender,
                    created: getUnixTimestamp(),
                    isAdmin: siteConfig.backend.starterItems.DANGER_STARTER_ADMIN,
                    banned: false,
                    bannedDate: 0,
                    bannedModNote: "",
                    bannedReason: "",
                    bannedReasonItem: "",
                    token: "",
                    xcsrftoken: generateCSRF(),
                    cookie: COOKIE,
                    ip: siteConfig.backend.logSignupIP ? ip : "",
                    lastOnline: 0,
                    loginCode: "",
                    seenLoginCode: "",
                    playing: 0,
                    inviteKey: "",

                    theme: "Light"
                };
                dbo.collection("users").updateOne({
                    username: username
                }, {
                    $set: myobj
                }, function (err, res) {
                    if (err) throw err;
                    db.close();
                    returnPromise(COOKIE);
                });
            });
        });
    },

    getUser: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    createInviteKey: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                const inviteKey = generateInviteKey();
                dbo.collection("invitekeys").insertOne({
                    inviteKey: inviteKey,
                    created: getUnixTimestamp(),
                    usedDate: 0,
                    createdby: userid,
                    used: false,
                    deleted: false
                }, function (err, res) {
                    if (err) throw err;
                    db.close();
                    returnPromise(inviteKey);
                });
            });
        });
    },

    deleteInviteKey: async function (key) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("invitekeys").updateOne({
                    inviteKey: key
                }, {
                    $set: {
                        deleted: true,
                        usedDate: getUnixTimestamp()
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    listInviteKeys: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("invitekeys").find({
                    used: false,
                    deleted: false
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    dbo.collection("invitekeys").find({
                        deleted: true,
                        created: {
                            $gt: getUnixTimestamp() - 86400
                        }
                    }).toArray(function (err, result2) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result.concat(result2));
                    });
                });
            });
        });
    },

    activateInviteKey: async function (userid, inviteKey) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("invitekeys").findOne({
                    inviteKey: inviteKey,
                    used: false,
                    deleted: false
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (result == null) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    dbo.collection("users").updateOne({
                        userid: userid
                    }, {
                        $set: {
                            inviteKey: inviteKey
                        }
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("invitekeys").updateOne({
                            inviteKey: inviteKey,
                            used: false,
                            deleted: false
                        }, {
                            $set: {
                                used: true,
                                usedDate: getUnixTimestamp()
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            };
                            db.close();
                            returnPromise(true);
                        });
                    });
                });
            });
        });
    },

    banUser: async function (userid, note = "Repeatedly breaking rules will not be tolerated.", banReason = "Inappropriate", banReasonItem = "[ Content Deleted ]") {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        banned: true,
                        bannedModNote: note,
                        bannedDate: getUnixTimestamp(),
                        bannedReason: banReason,
                        bannedReasonItem: banReasonItem
                    }
                }, function (err, res) {
                    if (err) throw err;
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    unbanUser: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        banned: false,
                        bannedModNote: "",
                        bannedDate: 0,
                        bannedReason: "",
                        bannedReasonItem: ""
                    }
                }, function (err, res) {
                    if (err) throw err;
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    loginUser: async function (username, password, xcsrftoken) {
        return new Promise(async returnPromise => {
            username = filterText3(username);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    username: username
                }, function (err, result) {
                    if (err) {
                        returnPromise(false);
                        return;
                    }
                    if (result == null) {
                        db.close();
                        returnPromise(false);
                    } else {
                        if (bcrypt.compareSync(password, result.password)) {
                            let COOKIE = "";
                            if (!xcsrftoken) {
                                xcsrftoken = generateCSRF();
                                COOKIE = generateCookie();
                            } else {
                                xcsrftoken = result.xcsrftoken;
                                if (result.cookie == "") {
                                    COOKIE = generateCookie();
                                } else {
                                    COOKIE = result.cookie;
                                }
                            }
                            dbo.collection("users").updateOne({
                                userid: result.userid
                            }, {
                                $set: {
                                    cookie: COOKIE,
                                    xcsrftoken: xcsrftoken
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise({
                                    userid: result.userid,
                                    username: result.username,
                                    cookie: COOKIE
                                });
                            });
                        } else {
                            returnPromise(false);
                        }
                    }
                });
            });
        });
    },

    createLoginCodeSession: async function (req) {
        return new Promise(async returnPromise => {
            const ip = get_ip(req).clientIp;
            const device0 = req.device.type.toLowerCase();
            const device = device0 == "desktop" ? "Computer" : device0.substring(0, 1).toUpperCase() + device0.substring(1);
            const code = generateLoginCode();
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("logincodes").findOne({
                    ip: ip,
                    device: device
                }, function (err, result) {
                    if (err) {
                        returnPromise(false);
                        db.close();
                        return;
                    }
                    if (result == null) {
                        dbo.collection("logincodes").insertOne({
                            ip: ip,
                            device: device,
                            loginCode: code,
                            loginPass: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                            created: getUnixTimestamp()
                        }, function (err, res) {
                            if (err) {
                                returnPromise(false);
                                db.close();
                                return;
                            }
                            db.close();
                            returnPromise(code);
                        });
                    } else {
                        db.close();
                        returnPromise(result.loginCode);
                    }
                })
            });
        });
    },

    cancelLoginCode: async function (user) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: user.userid
                }, {
                    $set: {
                        loginCode: ""
                    }
                }, function (err, res) {
                    if (err) {
                        returnPromise(false);
                        db.close();
                        return;
                    }
                    dbo.collection("logincodes").deleteOne({
                        loginCode: user.seenLoginCode
                    }, function (err, res) {
                        if (err) {
                            returnPromise(false);
                            db.close();
                            return;
                        }
                        returnPromise(true);
                        db.close();
                    });
                });
            });
        });
    },

    updateLoginCodeSession: async function (req, loginCode, loginPass) {
        return new Promise(async returnPromise => {
            const ip = get_ip(req).clientIp;
            const device0 = req.device.type.toLowerCase();
            const device = device0 == "desktop" ? "Computer" : device0.substring(0, 1).toUpperCase() + device0.substring(1);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    seenLoginCode: loginCode
                }, function (err, result0) {
                    if (err) {
                        returnPromise({
                            "status": "Created",
                            "accountName": null,
                            "accountPictureUrl": null,
                            "expirationTime": null
                        });
                        db.close();
                        return;
                    }
                    if (result0 == null) {
                        dbo.collection("logincodes").findOne({
                            ip: ip,
                            device: device
                        }, function (err, result) {
                            if (err) {
                                returnPromise({
                                    "status": "Created",
                                    "accountName": null,
                                    "accountPictureUrl": null,
                                    "expirationTime": null
                                });
                                db.close();
                                return;
                            }
                            if (result == null) {
                                returnPromise({
                                    "status": "Created",
                                    "accountName": null,
                                    "accountPictureUrl": null,
                                    "expirationTime": null
                                });
                                db.close();
                                return;
                            } else {
                                returnPromise({
                                    "status": "Created",
                                    "accountName": null,
                                    "accountPictureUrl": null,
                                    "expirationTime": unixToDate(result.created + 300).toISOString()
                                })
                            }
                        });
                    } else {
                        dbo.collection("users").findOne({
                            loginCode: loginCode
                        }, function (err, result) {
                            if (err) {
                                returnPromise({
                                    "status": "Created",
                                    "accountName": null,
                                    "accountPictureUrl": null,
                                    "expirationTime": null
                                });
                                db.close();
                                return;
                            }
                            if (result == null) {
                                dbo.collection("logincodes").findOne({
                                    ip: ip,
                                    device: device
                                }, function (err, result) {
                                    if (err) {
                                        returnPromise({
                                            "status": "Created",
                                            "accountName": null,
                                            "accountPictureUrl": null,
                                            "expirationTime": null
                                        });
                                        db.close();
                                        return;
                                    }
                                    if (result == null) {
                                        returnPromise({
                                            "status": "Cancelled",
                                            "accountName": null,
                                            "accountPictureUrl": null,
                                            "expirationTime": null
                                        });
                                        db.close();
                                        return;
                                    } else {
                                        returnPromise({
                                            "status": "UserLinked",
                                            "accountName": result0.username,
                                            "accountPictureUrl": null,
                                            "expirationTime": unixToDate(result.created + 300).toISOString()
                                        });
                                        db.close();
                                        return;
                                    }
                                });
                            } else {
                                returnPromise({
                                    "status": "Validated",
                                    "accountName": result.username,
                                    "accountPictureUrl": null,
                                    "expirationTime": unixToDate(result.created + 300).toISOString()
                                });
                            }
                        });
                    }
                });
            });
        });
    },

    getPendingLoginSession: async function (loginCode) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("logincodes").findOne({
                    loginCode: loginCode
                }, function (err, result) {
                    if (err) {
                        returnPromise(false);
                        db.close();
                        return;
                    }
                    if (result == null) {
                        returnPromise(false);
                    } else {
                        returnPromise(result);
                    }
                    db.close();
                });
            });
        });
    },

    setUserLoginCode(userid, code) {
        return new Promise(async returnPromise => {
            if (code.length != 6) {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        loginCode: code
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    dbo.collection("logincodes").deleteOne({
                        loginCode: code
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        db.close();
                        returnPromise(true);
                    });
                });
            });
        });
    },

    setUserSeenLoginCode(userid, code) {
        return new Promise(async returnPromise => {
            if (code.length != 6) {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        seenLoginCode: code
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    loginUserByLoginCode: async function (loginCode, loginPass, xcsrftoken) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    loginCode: loginCode
                }, function (err, result) {
                    if (err) {
                        returnPromise(false);
                        return;
                    }
                    if (result == null) {
                        db.close();
                        returnPromise(false);
                    } else {
                        let COOKIE = "";
                        if (!xcsrftoken) {
                            xcsrftoken = generateCSRF();
                        } else {
                            xcsrftoken = result.xcsrftoken;
                        }
                        if (result.cookie == "") {
                            COOKIE = generateCookie();
                        } else {
                            COOKIE = result.cookie;
                        }
                        dbo.collection("users").updateOne({
                            userid: result.userid
                        }, {
                            $set: {
                                loginCode: "",
                                seenLoginCode: "",
                                cookie: COOKIE,
                                xcsrftoken: xcsrftoken
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            dbo.collection("logincodes").deleteOne({
                                loginCode: loginCode
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise({
                                    userid: result.userid,
                                    username: result.username,
                                    cookie: COOKIE
                                });
                            });
                        });
                    }
                });
            });
        });
    },

    sign: function (content) {
        const ALGORITHM = "sha1"; // Accepted: any result of crypto.getHashes(), check doc dor other options
        const SIGNATURE_FORMAT = "base64"; // Accepted: hex, latin1, base64
        const privateKey = fs.readFileSync(__dirname + "/internal/privatekey.pem", "utf8");
        const sign = crypto.createSign(ALGORITHM);
        sign.update(content);
        const signature = sign.sign(privateKey, SIGNATURE_FORMAT);
        return signature;
    },

    findUserByToken: async function (token) { // NOTE: Removes the token
        return new Promise(async returnPromise => {
            if (token == "") {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    token: token
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (result != null) {
                        dbo.collection("users").updateOne({
                            userid: result.userid
                        }, {
                            $set: {
                                token: ""
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            db.close();
                            returnPromise(result);
                        });
                    } else {
                        returnPromise(null);
                    }
                });
            });
        });
    },

    generateUserToken: async function (xcsrftoken) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                const token = generateToken();
                dbo.collection("users").updateOne({
                    xcsrftoken: xcsrftoken
                }, {
                    $set: {
                        token: token
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(token);
                });
            });
        });
    },

    generateUserTokenByCookie: async function (cookie) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                const token = generateToken();
                dbo.collection("users").updateOne({
                    cookie: cookie
                }, {
                    $set: {
                        token: token
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(token);
                });
            });
        });
    },

    genres: {
        1: "All",
        13: "Adventure",
        19: "Building",
        15: "Comedy",
        10: "Fighting",
        20: "FPS",
        11: "Horror",
        8: "Medieval",
        17: "Military",
        12: "Naval",
        21: "RPG",
        9: "Sci-Fi",
        14: "Sports",
        7: "Town and City",
        16: "Western"
    },

    getUserByCsrfToken: getUserByCsrfToken,

    generateUserCsrfToken: generateUserCsrfToken,

    getUserFavoritedGames: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (result == null) {
                        db.close();
                        returnPromise(null);
                    } else {
                        db.close();
                        returnPromise(result.favoritedGames);
                    }
                });
            });
        });
    },

    getUserRecentlyPlayedGames: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (result == null) {
                        db.close();
                        returnPromise(null);
                    } else {
                        db.close();
                        returnPromise(result.recentlyPlayedGames);
                    }
                });
            });
        });
    },

    getGamesByCreatorId: async function (creatorid, onlyPublic = false) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").find({
                    creatorid: creatorid
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    if (onlyPublic) {
                        returnPromise(result.filter(game => game.isPublic == true));
                        return;
                    }
                    returnPromise(result);
                });
            });
        });
    },

    getPublicGames: async function (dontShowBannedResults = true) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, async function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").find({
                    isPublic: true
                }).toArray(async function (err, results) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (dontShowBannedResults) {
                        let bannedGames = [];
                        let pendingChecks = 0;
                        for (let i = 0; i < results.length; i++) {
                            if (!bannedGames.includes(results[i].gameid)) {
                                if (results[i].deleted) {
                                    bannedGames.push(results[i].gameid);
                                } else {
                                    pendingChecks++;
                                    dbo.collection("users").findOne({
                                        userid: results[i].creatorid
                                    }, function (err, result) {
                                        pendingChecks--;
                                        if (err) {
                                            return;
                                        }
                                        if (result.banned) {
                                            bannedGames.push(results[i].gameid);
                                        }
                                    });
                                }
                            }
                        }
                        await sleep(10);
                        if (pendingChecks > 0) {
                            while (pendingChecks > 0) {
                                await sleep(100);
                            }
                        }

                        returnPromise(results.filter(game => !bannedGames.includes(game.gameid)));
                        db.close();
                        return;
                    }
                    returnPromise(results);
                });
            });
        });
    },

    findUsers: async function (username) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").find({
                    username: {
                        $regex: username,
                        $options: "i"
                    }
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    findGames: async function (gameName) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").find({
                    gamename: {
                        $regex: gameName,
                        $options: "i"
                    }
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getCatalogItemsByCreatorId: async function (creatorid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").find({
                    itemcreatorid: creatorid
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    setCatalogItemProperty: async function (itemid, property, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").updateOne({
                    itemid: itemid
                }, {
                    $set: {
                        [property]: value
                    }
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    createCatalogItem: async function (itemname, itemdescription, itemprice, itemtype, itemcreatorid, decalId = 0, meshId = 0, amount = -1, itemimage = "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc8.png") {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").findOne({}, function (error, config) {
                    if (error) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    const lastId = config.assets + 1;
                    while (fs.existsSync(`${__dirname}/required_assets/${lastId}.asset`)) {
                        lastId++;
                    }
                    dbo.collection("config").updateOne({}, {
                        $set: {
                            assets: lastId
                        }
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("catalog").insertOne({
                            itemid: lastId,
                            itemname: itemname,
                            itemdescription: itemdescription,
                            itemprice: itemprice,
                            itemimage: itemimage,
                            itemtype: itemtype,
                            itemcreatorid: itemcreatorid,
                            itemfavorites: [],
                            itemlikes: [],
                            itemdislikes: [],
                            itemowners: [],
                            itemdecalid: decalId,
                            itemmeshid: meshId,
                            itempricestatus: itemprice == 0 ? "Free" : null, // OffSale, NoResellers
                            unitsAvailableForConsumption: amount,
                            // lowestPrice: itemprice,
                            created: getUnixTimestamp(),
                            updated: getUnixTimestamp(),
                            itemoffsafedeadline: null,
                            itemgenre: "All",
                            onSale: false,
                            currency: 1
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    });
                });
            });
        });
    },

    getCatalogItem: getCatalogItem,

    updateCatalogItemProp: async function (itemid, prop, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").updateOne({
                    itemid: itemid
                }, {
                    $set: {
                        [prop]: value
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    countCatalogItems: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").countDocuments({}, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getAllCatalogItems: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").find({}).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getCatalogItems: async function (keyword, onlyPublic) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").find({
                    itemname: {
                        $regex: keyword,
                        $options: "i"
                    }
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    if (onlyPublic) {
                        returnPromise(result.filter(item => item.onSale == true));
                        return;
                    }
                    returnPromise(result);
                });
            });
        });
    },

    getCatalogItemsFromCreatorId: async function (creatorid, type) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").find({
                    itemcreatorid: creatorid,
                    itemtype: type
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getCatalogItems2: async function (startIndex, limit, onlyPublic) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").find({}).skip(startIndex).limit(limit).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    if (onlyPublic) {
                        returnPromise(result.filter(item => item.onSale == true));
                        return;
                    }
                    returnPromise(result);
                });
            });
        });
    },

    deleteCatalogItem: async function (itemid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").deleteOne({
                    itemid: itemid
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    setLike: async function (userid, assetid, likeType) {
        return new Promise(async returnPromise => {
            if (typeof ratingsUserIds[userid] != "undefined") {
                if (ratingsUserIds[userid] >= siteConfig.shared.maxUserRatingsPerHour) {
                    returnPromise(false);
                    return;
                } else {
                    ratingsUserIds[userid]++;
                }
            } else {
                ratingsUserIds[userid] = 1;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (result != null) {
                        const hasLiked = result.itemlikes.includes(userid);
                        const hasDisliked = result.itemdislikes.includes(userid);
                        if (hasLiked) {
                            dbo.collection("catalog").updateOne({
                                itemid: assetid
                            }, {
                                $pull: {
                                    itemlikes: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        }
                        if (hasDisliked) {
                            dbo.collection("catalog").updateOne({
                                itemid: assetid
                            }, {
                                $pull: {
                                    itemdislikes: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        }
                        if (likeType == "like") {
                            dbo.collection("catalog").updateOne({
                                itemid: assetid
                            }, {
                                $push: {
                                    itemlikes: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        } else if (likeType == "dislike") {
                            dbo.collection("catalog").updateOne({
                                itemid: assetid
                            }, {
                                $push: {
                                    itemdislikes: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        } else if (likeType == "none") {
                            returnPromise(true);
                        }
                    } else {
                        dbo.collection("games").findOne({
                            gameid: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (result != null) {
                                if (!result.played.includes(userid) && siteConfig.shared.needsToPlayBeforeLikeGame == true) {
                                    returnPromise(false);
                                    return;
                                }
                                const hasLiked = result.likes.includes(userid);
                                const hasDisliked = result.dislikes.includes(userid);
                                if (hasLiked) {
                                    dbo.collection("games").updateOne({
                                        gameid: assetid
                                    }, {
                                        $pull: {
                                            likes: userid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                }
                                if (hasDisliked) {
                                    dbo.collection("games").updateOne({
                                        gameid: assetid
                                    }, {
                                        $pull: {
                                            dislikes: userid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                }
                                if (likeType == "like") {
                                    dbo.collection("games").updateOne({
                                        gameid: assetid
                                    }, {
                                        $push: {
                                            likes: userid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                } else if (likeType == "dislike") {
                                    dbo.collection("games").updateOne({
                                        gameid: assetid
                                    }, {
                                        $push: {
                                            dislikes: userid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                } else if (likeType == "none") {
                                    returnPromise(true);
                                }
                            } else {
                                db.close();
                                returnPromise(false);
                            }
                        });
                    }
                });
            });
        });
    },

    userHasFavorited: async function (userid, assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (result != null) {
                        const hasFavorited = result.itemfavorites.includes(userid);
                        db.close();
                        returnPromise(hasFavorited);
                    } else {
                        dbo.collection("games").findOne({
                            gameid: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (result != null) {
                                const hasFavorited = result.favorites.includes(userid);
                                db.close();
                                returnPromise(hasFavorited);
                            } else {
                                db.close();
                                returnPromise(false);
                            }
                        });
                    }
                });
            });
        });
    },

    userLikeStatus: async function (userid, assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (result != null) {
                        const hasLiked = result.itemlikes.includes(userid);
                        const hasDisliked = result.itemdislikes.includes(userid);
                        db.close();
                        returnPromise(hasLiked ? "Liked" : hasDisliked ? "Disliked" : "None");
                    } else {
                        dbo.collection("games").findOne({
                            gameid: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (result != null) {
                                const hasLiked = result.likes.includes(userid);
                                const hasDisliked = result.dislikes.includes(userid);
                                db.close();
                                returnPromise(hasLiked ? "Liked" : hasDisliked ? "Disliked" : "None");
                            } else {
                                db.close();
                                returnPromise(false);
                            }
                        });
                    }
                });
            });
        });
    },

    assetFavorites: async function (assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (result != null) {
                        db.close();
                        returnPromise(result.itemfavorites);
                    } else {
                        dbo.collection("games").findOne({
                            gameid: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            if (result != null) {
                                db.close();
                                returnPromise(result.favorites);
                            } else {
                                db.close();
                                returnPromise(null);
                            }
                        });
                    }
                });
            });
        });
    },

    assetLikes: async function (assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (result != null) {
                        db.close();
                        returnPromise(result.itemlikes);
                    } else {
                        dbo.collection("games").findOne({
                            gameid: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            if (result != null) {
                                db.close();
                                returnPromise(result.itemlikes);
                            } else {
                                db.close();
                                returnPromise(null);
                            }
                        });
                    }
                });
            });
        });
    },

    userHasPlayedGame: userHasPlayedGame,

    isUserRatingRateLimited: function (userid) {
        if (typeof ratingsUserIds[userid] != "undefined") {
            if (ratingsUserIds[userid] >= siteConfig.shared.maxUserRatingsPerHour) {
                return true;
            }
        }
        return false;
    },

    getUserLaunchStatus: function (userid) {
        if (typeof userLaunchStatuses[userid] != "undefined") {
            return userLaunchStatuses[userid];
        }
        return "Unknown";
    },

    getUserLaunchStatus2: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, user) {
                    if (err) {
                        db.close();
                        returnPromise("Unknown");
                        return;
                    }
                    db.close();
                    const presenceType = (user.lastStudio || 0) > (getUnixTimestamp() - 30) ? 3 : (user.lastOnline || 0) > (getUnixTimestamp() - 60) ? ((user.lastOnline || 0) > (getUnixTimestamp() - 60) && user.playing != 0 && user.playing != null) ? 2 : 1 : 0;
                    returnPromise(presenceType == 0 ? "Unknown" : presenceType == 1 ? "Unknown" : presenceType == 2 ? "Playing" : presenceType == 3 ? "Studio" : "Unknown");
                });
            });
        });
    },

    setUserLaunchStatus: function (userid, status) {
        if (status == null) {
            delete userLaunchStatuses[userid];
            return;
        }
        userLaunchStatuses[userid] = status;
    },

    toggleFavorite: async function (userid, assetid) {
        return new Promise(async returnPromise => {
            if (typeof ratingsUserIds[userid] != "undefined") {
                if (ratingsUserIds[userid] >= siteConfig.shared.maxUserRatingsPerHour) {
                    returnPromise(false);
                    return;
                } else {
                    ratingsUserIds[userid]++;
                }
            } else {
                ratingsUserIds[userid] = 1;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (result != null) {
                        const hasFavorited = result.itemfavorites.includes(userid);
                        if (hasFavorited) {
                            dbo.collection("catalog").updateOne({
                                itemid: assetid
                            }, {
                                $push: {
                                    itemfavorites: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        } else {
                            dbo.collection("catalog").updateOne({
                                itemid: assetid
                            }, {
                                $pull: {
                                    itemfavorites: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        }
                    } else {
                        dbo.collection("games").findOne({
                            gameid: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (result != null) {
                                const hasFavorited = result.favorites.includes(userid);
                                if (hasFavorited) {
                                    dbo.collection("games").updateOne({
                                        gameid: assetid
                                    }, {
                                        $pull: {
                                            favorites: userid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        dbo.collection("users").updateOne({
                                            userid: userid
                                        }, {
                                            $pull: {
                                                favoritedGames: assetid
                                            }
                                        }, function (err, res) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            db.close();
                                            returnPromise(true);
                                        });
                                    });
                                } else {
                                    dbo.collection("games").updateOne({
                                        gameid: assetid
                                    }, {
                                        $push: {
                                            favorites: userid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        dbo.collection("users").updateOne({
                                            userid: userid
                                        }, {
                                            $push: {
                                                favoritedGames: assetid
                                            }
                                        }, function (err, res) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            db.close();
                                            returnPromise(true);
                                        });
                                    });
                                }
                            } else {
                                db.close();
                                returnPromise(false);
                            }
                        });
                    }
                });
            });
        });
    },

    getUsers: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").find({}).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    countUsers: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").countDocuments(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getGames: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").find({}).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    countGames: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").countDocuments(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getActiveGames: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").find({
                    port: {
                        $gt: 0
                    }
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    countActiveGames: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").find({
                    port: {
                        $gt: 0
                    }
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result.length);
                });
            });
        });
    },

    getPlayingPlayers: async function (gameid = 0) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                if (gameid > 0) {
                    dbo.collection("games").find({
                        playing: gameid
                    }).toArray(function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result);
                    });
                } else {
                    dbo.collection("games").find({
                        playing: {
                            $gt: 0
                        }
                    }).toArray(function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result);
                    });
                }
            });
        });
    },

    countPlayingPlayers: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").find({
                    playing: {
                        $gt: 0
                    }
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result.length);
                });
            });
        });
    },

    getTotalUserRobux: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").find({}).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    let total = 0;
                    for (let i = 0; i < result.length; i++) {
                        total += result[i].robux;
                    }
                    returnPromise(total);
                });
            });
        });
    },

    getRichestUser: async function () {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").find({}).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    let richest = {
                        robux: -1
                    };
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].robux > richest.robux) {
                            richest = result[i];
                        }
                    }
                    returnPromise(richest);
                });
            });
        });
    },

    getGamesSize: async function () {
        return new Promise(async returnPromise => {
            fastFolderSize(`./games/`, (err, bytes) => {
                if (err) {
                    throw err
                }

                returnPromise(bytes)
            })
        });
    },

    formatBytes: formatBytes,

    formatNumber: formatNumber,
    formatNumberS: formatNumberS,

    findUserByCookie: findUserByCookie,

    isUserUnder13: isUserUnder13,

    toString: toString,

    timeToString: timeToString,

    formatAMPMFull: formatAMPMFull,

    getRenderObject: getRenderObject,
    getBlankRenderObject: getBlankRenderObject,

    newJob: newJob,
    getJob: getJob,

    userExists: async function (username) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    username: username
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(true);
                        return;
                    }
                    db.close();
                    returnPromise(result != null && result != undefined);
                });
            });
        });
    },

    censorEmail: function (email) {
        if (email == "" || email.split("@").length != 2) return "";
        return email.split("@")[0].replace(/[a-zA-Z0-9]/g, "*") + "@" + email.split("@")[1];
    },

    getUserFromUsername: async function (username) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    username: username
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    deleteItemFromInventory: async function (userid, itemid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("gamepasses").updateOne({
                    id: itemid
                }, {
                    $pull: {
                        owners: userid
                    }
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    dbo.collection("catalog").updateOne({
                        itemid: itemid
                    }, {
                        $pull: {
                            itemowners: userid
                        }
                    }, function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        db.close();
                        returnPromise(true);
                    });
                });
            });
        });
    },

    getAsset: async function (assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("assets").findOne({
                    id: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getAssets: async function (userid, type = "All") {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                if (type == "All") {
                    dbo.collection("assets").find({
                        creatorid: userid
                    }).toArray(function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result);
                    });
                } else {
                    dbo.collection("assets").find({
                        creatorid: userid,
                        type: type
                    }).toArray(function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result);
                    });
                }
            });
        });
    },

    getAssetsThisDay: async function (userid, type = "All") {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                if (type == "All") {
                    dbo.collection("assets").find({
                        creatorid: userid,
                        created: {
                            $gte: getUnixTimestamp() - (30 * 24 * 60 * 60)
                        }
                    }).toArray(function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result);
                    });
                } else {
                    dbo.collection("assets").find({
                        creatorid: userid,
                        type: type,
                        created: {
                            $gte: getUnixTimestamp() - (30 * 24 * 60 * 60)
                        }
                    }).toArray(function (err, result) {
                        if (err) {
                            db.close();
                            returnPromise(null);
                            return;
                        }
                        db.close();
                        returnPromise(result);
                    });
                }
            });
        });
    },

    convertCurrency: async function (userid, from, amount) {
        return new Promise(async returnPromise => {
            if (amount <= 0) {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, user) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (!user) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (from == "tix") {
                        if ((amount / siteConfig.backend.tix.exchangeRate).toString().includes(".")) {
                            returnPromise(false);
                            db.close();
                            return;
                        }
                        if (user.tix < amount) {
                            returnPromise(false);
                            db.close();
                            return;
                        }
                        dbo.collection("users").updateOne({
                            userid: userid
                        }, {
                            $set: {
                                tix: user.tix - amount,
                                robux: user.robux + Math.floor(amount / siteConfig.backend.tix.exchangeRate)
                            }
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    } else if (from == "robux") {
                        if (user.robux < amount) {
                            returnPromise(false);
                            db.close();
                            return;
                        }
                        dbo.collection("users").updateOne({
                            userid: userid
                        }, {
                            $set: {
                                tix: user.tix + (amount * siteConfig.backend.tix.exchangeRate),
                                robux: user.robux - amount
                            }
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    } else {
                        db.close();
                        returnPromise(false);
                    }
                });
            });
        });
    },

    getUnixTimestamp: getUnixTimestamp,
    unixToDate: unixToDate,
    filterText: filterText,
    filterText2: filterText2,
    filterText3: filterText3,

    accountsByIP: async function (ip) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").find({
                    ip: ip
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    createGamepass: async function (creatorid, gameid, name, desc, price, thumbnailurl = "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png") {
        return new Promise(async returnPromise => {
            name = filterText(name);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").findOne({}, async (err, config) => {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    const lastId = config.assets + 1;
                    while (fs.existsSync(`${__dirname}/required_assets/${lastId}.asset`)) {
                        lastId++;
                    }
                    dbo.collection("config").updateOne({}, {
                        $set: {
                            assets: lastId
                        }
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }

                        dbo.collection("gamepasses").insertOne({
                            id: lastId,
                            gameid: gameid,
                            creatorid: creatorid,
                            name: name,
                            description: desc,
                            price: price,
                            thumbnailurl: thumbnailurl,
                            owners: [creatorid],
                            sold: 0,
                            created: getUnixTimestamp(),
                            updated: getUnixTimestamp(),
                            likes: [],
                            dislikes: [],
                            favorites: [],
                            currency: 1,
                            onSale: false
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            db.close();
                            returnPromise(lastId);
                        });
                    });
                });
            });
        });
    },

    getGamepasses: async function (gameid, playerid = 0) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("gamepasses").find({
                    gameid: gameid
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    if (playerid > 0) {
                        db.close();
                        returnPromise(result.filter(pass => pass.owners.includes(playerid)));
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    createDevProduct(creatorid, gameid, name, desc, price, thumbnailurl = "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png") {
        return new Promise(async returnPromise => {
            name = filterText(name);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").findOne({}, async (err, config) => {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    const lastId = config.assets + 1;
                    while (fs.existsSync(`${__dirname}/required_assets/${lastId}.asset`)) {
                        lastId++;
                    }
                    dbo.collection("config").updateOne({}, {
                        $set: {
                            assets: lastId
                        }
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }

                        dbo.collection("devproducts").insertOne({
                            id: lastId,
                            gameid: gameid,
                            creatorid: creatorid,
                            name: name,
                            description: desc,
                            price: price,
                            thumbnailurl: thumbnailurl,
                            sold: 0,
                            created: getUnixTimestamp(),
                            updated: getUnixTimestamp(),
                            currency: 1,
                            onSale: true
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            db.close();
                            returnPromise(lastId);
                        });
                    });
                });
            });
        });
    },

    editDevProduct: async function (id, creatorid, gameid, name, desc, price, onSale = true, thumbnailurl = "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png") {
        return new Promise(async returnPromise => {
            name = filterText(name);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("devproducts").updateOne({
                    id: id
                }, {
                    $set: {
                        gameid: gameid,
                        creatorid: creatorid,
                        name: name,
                        description: desc,
                        price: price,
                        thumbnailurl: thumbnailurl,
                        updated: getUnixTimestamp(),
                        onSale: onSale
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    getDevProductByGameAndName: async function (gameid, name) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("devproducts").findOne({
                    gameid: gameid,
                    name: name
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getDevProducts: async function (gameid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("devproducts").find({
                    gameid: gameid
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    buyDevProduct(userid, productid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, user) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }

                    dbo.collection("devproducts").findOne({
                        id: productid
                    }, function (err, product) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("users").findOne({
                            userid: product.creatorid
                        }, function (err, creator) {
                            if (err) {
                                db.close();
                                returnPromise(null);
                                return;
                            }
                            if (!creator) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (!product) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (product.currency == 1) {
                                if (user.robux < product.price) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").updateOne({
                                    userid: userid
                                }, {
                                    $inc: {
                                        robux: -product.price
                                    }
                                }, function (err, res) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: product.creatorid
                                    }, {
                                        $inc: {
                                            robux: Math.floor((product.price / 100) * (creator.isAdmin ? siteConfig.backend.marketplaceEarnings.admin : creator.membership > 0 ? siteConfig.backend.marketplaceEarnings.bc : siteConfig.backend.marketplaceEarnings.user))
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        dbo.collection("devproducts").updateOne({
                                            id: productid
                                        }, {
                                            $inc: {
                                                sold: 1
                                            }
                                        }, function (err, res) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            dbo.collection("recipes").insertOne({
                                                id: productid,
                                                userid: userid,
                                                gameid: product.gameid,
                                                recipe: uuidv4(),
                                                bought: getUnixTimestamp()
                                            }, function (err, res) {
                                                if (err) {
                                                    db.close();
                                                    returnPromise(false);
                                                    return;
                                                }
                                                db.close();
                                                returnPromise(true);
                                            });
                                        });
                                    });
                                });
                            } else if (currency == 2) {
                                if (user.tix < product.price) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").updateOne({
                                    userid: userid
                                }, {
                                    $inc: {
                                        tix: -product.price
                                    }
                                }, function (err, res) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: product.creatorid
                                    }, {
                                        $inc: {
                                            tix: Math.floor((product.price / 100) * (creator.isAdmin ? siteConfig.backend.marketplaceEarnings.admin : creator.membership > 0 ? siteConfig.backend.marketplaceEarnings.bc : siteConfig.backend.marketplaceEarnings.user))
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        dbo.collection("devproducts").updateOne({
                                            id: productid
                                        }, {
                                            $inc: {
                                                sold: 1
                                            }
                                        }, function (err, res) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            ddbo.collection("recipes").insertOne({
                                                id: productid,
                                                userid: userid,
                                                gameid: product.gameid,
                                                recipe: uuidv4(),
                                                bought: getUnixTimestamp()
                                            }, function (err, res) {
                                                if (err) {
                                                    db.close();
                                                    returnPromise(false);
                                                    return;
                                                }
                                                db.close();
                                                returnPromise(true);
                                            });
                                        });
                                    });
                                });
                            } else {
                                db.close();
                                returnPromise(false);
                            }
                        });
                    });
                });
            });
        });
    },

    getRecipes: function (gameid, userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("recipes").find({
                    gameid: gameid,
                    userid: userid
                }).toArray(function (err, recipes) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(recipes);
                });
            });
        });
    },



    getDevProduct: async function (id) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("devproducts").findOne({
                    id: id
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getOwnedGamepasses: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("gamepasses").find({
                    owners: {
                        $in: [userid]
                    }
                }).toArray(function (err, gamepasses) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(gamepasses);
                });
            });
        });
    },

    userOwnsAsset: async function (userid, assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    id: assetid
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (result && result.itemowners.includes(userid)) {
                        db.close();
                        returnPromise(true);
                    } else {
                        dbo.collection("gamepasses").findOne({
                            id: assetid
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            if (result && result.owners.includes(userid)) {
                                db.close();
                                returnPromise(true);
                            } else {
                                db.close();
                                returnPromise(false);
                            }
                        });
                    }
                });
            });
        });
    },

    getGamepass: async function (id) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("gamepasses").findOne({
                    id: id
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    buyGamepass: async function (user, gamepassid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("gamepasses").findOne({
                    id: gamepassid
                }, function (err, gamepass) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (gamepass == null) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (!gamepass.onSale && user.userid != gamepass.creatorid) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (gamepass.owners.includes(user.userid)) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (gamepass.currency == 1) {
                        if (user.robux < gamepass.price) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("users").updateOne({
                            userid: user.userid
                        }, {
                            $inc: {
                                robux: -gamepass.price
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            dbo.collection("gamepasses").updateOne({
                                id: gamepassid
                            }, {
                                $inc: {
                                    sold: 1
                                },
                                $push: {
                                    owners: user.userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").findOne({
                                    userid: gamepass.creatorid
                                }, function (err, creator) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: gamepass.creatorid
                                    }, {
                                        $inc: {
                                            robux: Math.floor((gamepass.price / 100) * (creator.isAdmin ? siteConfig.backend.marketplaceEarnings.admin : creator.membership > 0 ? siteConfig.backend.marketplaceEarnings.bc : siteConfig.backend.marketplaceEarnings.user))
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                });
                            });
                        });
                    } else if (gamepass.currency == 2) {
                        if (user.tix < gamepass.price) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("users").updateOne({
                            userid: user.userid
                        }, {
                            $inc: {
                                tix: -gamepass.price
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            dbo.collection("gamepasses").updateOne({
                                id: gamepassid
                            }, {
                                $inc: {
                                    sold: 1
                                },
                                $push: {
                                    owners: user.userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").findOne({
                                    userid: gamepass.creatorid
                                }, function (err, creator) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: gamepass.creatorid
                                    }, {
                                        $inc: {
                                            tix: Math.floor((gamepass.price / 100) * (creator.isAdmin ? siteConfig.backend.marketplaceEarnings.admin : creator.membership > 0 ? siteConfig.backend.marketplaceEarnings.bc : siteConfig.backend.marketplaceEarnings.user))
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                });
                            });
                        });
                    } else {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                });
            });
        });
    },

    buyCatalogItem: async function (user, itemid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").findOne({
                    itemid: itemid
                }, function (err, item) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (item == null) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (!item.onSale && user.userid != item.itemcreatorid) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (item.itemowners.includes(user.userid)) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (item.currency == 1) {
                        if (user.robux < item.itemprice) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("users").updateOne({
                            userid: user.userid
                        }, {
                            $inc: {
                                robux: -item.itemprice
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            dbo.collection("catalog").updateOne({
                                itemid: itemid
                            }, {
                                $inc: {
                                    sold: 1
                                },
                                $push: {
                                    itemowners: user.userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").findOne({
                                    userid: item.itemcreatorid
                                }, function (err, creator) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: item.itemcreatorid
                                    }, {
                                        $inc: {
                                            robux: Math.floor((item.itemprice / 100) * (creator.isAdmin ? siteConfig.backend.marketplaceEarnings.admin : creator.membership > 0 ? siteConfig.backend.marketplaceEarnings.bc : siteConfig.backend.marketplaceEarnings.user))
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                });
                            });
                        });
                    } else if (item.currency == 2) {
                        if (user.tix < item.itemprice) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("users").updateOne({
                            userid: user.userid
                        }, {
                            $inc: {
                                tix: -item.itemprice
                            }
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            dbo.collection("catalog").updateOne({
                                itemid: itemid
                            }, {
                                $inc: {
                                    sold: 1
                                },
                                $push: {
                                    itemowners: user.userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").findOne({
                                    userid: item.itemcreatorid
                                }, function (err, creator) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: item.itemcreatorid
                                    }, {
                                        $inc: {
                                            tix: Math.floor((item.itemprice / 100) * (creator.isAdmin ? siteConfig.backend.marketplaceEarnings.admin : creator.membership > 0 ? siteConfig.backend.marketplaceEarnings.bc : siteConfig.backend.marketplaceEarnings.user))
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        db.close();
                                        returnPromise(true);
                                    });
                                });
                            });
                        });
                    } else {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                });
            });
        });
    },

    getOwnedCatalogItems: async function (userid, itemtype = "") {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("catalog").find({
                    itemowners: {
                        $in: [userid]
                    }
                }).toArray(function (err, items) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    if (itemtype != "") {
                        returnPromise(items.filter(item => item.itemtype == itemtype));
                        return;
                    }
                    returnPromise(items);
                });
            });
        });
    },

    getFirstXUnapprovedAssets: async function (x) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("assets").find({
                    approvedBy: 0,
                    deleted: false
                }).sort({
                    created: 1
                }).limit(x).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    convertMesh: async function (fp) {
        return new Promise(async returnPromise => {
            const fp0 = fp.replace(".asset", ".obj");
            fs.renameSync(fp, fp0);
            proc = exec(`${isWin ? "" : "wine "}${__dirname}/internal/ObjToRBXMesh.exe ${fp0} 2.00`, {
                cwd: `${__dirname}/temp/`
            }, (err, stdout, stderr) => {});
            const timeout = setTimeout(async () => {
                kill(proc.pid, 'SIGTERM');
                returnPromise(false);
            }, 10000);
            proc.on('exit', function () {
                clearTimeout(timeout);
                fs.unlinkSync(fp0);
                try {
                    fs.renameSync(`${fp0}.mesh`, fp);
                    returnPromise(true);
                } catch {
                    returnPromise(false);
                }
            });
        });
    },

    createAsset: async function (userid, name, desc, type, approved) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").findOne({}, async (err, config) => {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    const lastId = config.assets + 1;
                    while (fs.existsSync(`${__dirname}/required_assets/${lastId}.asset`)) {
                        lastId++;
                    }
                    dbo.collection("config").updateOne({}, {
                        $set: {
                            assets: lastId
                        }
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        dbo.collection("assets").insertOne({
                            id: lastId,
                            name: name,
                            description: desc,
                            type: type,
                            sold: 0,
                            owners: [],
                            creatorid: userid,
                            created: getUnixTimestamp(),
                            updated: getUnixTimestamp(),
                            approvedBy: approved ? userid : 0,
                            approved: approved ? getUnixTimestamp() : 0,
                            deleted: false,
                            onSale: false,
                            likes: [],
                            dislikes: [],
                            favorites: []
                        }, function (err, result) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(lastId);
                        });
                    });
                });
            });
        });
    },

    approveAsset: async function (userid, assetid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("assets").updateOne({
                    id: assetid
                }, {
                    $set: {
                        deleted: false,
                        approvedBy: userid,
                        approved: getUnixTimestamp()
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    createGame: async function (gamename, gamedescription, creatorid, iconthumbnail = "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png", thumbnail = "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png") {
        return new Promise(async returnPromise => {
            gamename = filterText2(gamename);
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").findOne({}, async (err, config) => {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    const lastId = config.assets + 1;
                    while (fs.existsSync(`${__dirname}/required_assets/${lastId}.asset`)) {
                        lastId++;
                    }
                    dbo.collection("config").updateOne({}, {
                        $set: {
                            assets: lastId
                        }
                    }, function (err, res) {
                        if (err) {
                            db.close();
                            returnPromise(false);
                            return;
                        }
                        const myobj = {
                            gameid: lastId,
                            gamename: gamename,
                            description: gamedescription,
                            creatorid: creatorid,
                            playing: 0,
                            visits: 0,
                            likes: [],
                            dislikes: [],
                            favorites: [],
                            played: [],
                            iconthumbnail: iconthumbnail,
                            thumbnail: thumbnail,
                            deleted: false,
                            created: getUnixTimestamp(),
                            updated: getUnixTimestamp(),
                            isPublic: false,
                            allowstudioaccesstoapis: false,
                            genre: "All",
                            maxplayers: 12,
                            access: "Everyone",
                            copiable: false,
                            chattype: "Classic",
                            ip: "",
                            port: 0,
                            rccVersion: "",
                            lastHeartBeat: 0,
                            teamCreateEnabled: false,
                            teamCreateIp: "",
                            teamCreatePort: 0,
                            teamCreatePlaying: 0,
                            teamCreateRccVersion: "",
                            teamCreateLastHeartBeat: 0,
                            showOnProfile: false
                        };
                        dbo.collection("games").insertOne(myobj, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(lastId);
                        });
                    });
                });
            });
        });
    },

    userLeftTeamCreate: async function (userid, gameid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        editing: 0
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    userJoinedTeamCreate: async function (userid, gameid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        editing: gameid
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    userLeftGame: async function (userid, gameid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        playing: 0
                    }
                }, function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    userJoinedGame: async function (userid, gameid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").findOne({
                    gameid: gameid
                }, function (err, game) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (game.played.includes(userid)) {
                        if (userid == game.creatorid) {
                            dbo.collection("users").findOne({
                                userid: userid
                            }, function (err, user) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").updateOne({
                                    userid: userid
                                }, {
                                    $set: {
                                        playing: gameid
                                    }
                                }, function (err, res) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    if (user.recentlyPlayedGames.includes(gameid)) {
                                        dbo.collection("users").updateOne({
                                            userid: userid
                                        }, {
                                            $set: {
                                                recentlyPlayedGames: user.recentlyPlayedGames.filter(id => id != gameid)
                                            }
                                        }, function (err, res) {
                                            if (err) {
                                                db.close();
                                                returnPromise(false);
                                                return;
                                            }
                                            if (true) {
                                                if (user.recentlyPlayedGames.length >= 6) {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $pop: {
                                                            recentlyPlayedGames: -1
                                                        },
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                } else {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                }
                                            } else {
                                                db.close();
                                                returnPromise(true);
                                            }
                                        });
                                    } else {
                                        if (true) {
                                            if (user.recentlyPlayedGames.length >= 6) {
                                                dbo.collection("users").updateOne({
                                                    userid: userid
                                                }, {
                                                    $pop: {
                                                        recentlyPlayedGames: -1
                                                    },
                                                    $push: {
                                                        recentlyPlayedGames: gameid
                                                    }
                                                }, function (err, res) {
                                                    if (err) {
                                                        db.close();
                                                        returnPromise(false);
                                                        return;
                                                    }
                                                    db.close();
                                                    returnPromise(true);
                                                });
                                            } else {
                                                dbo.collection("users").updateOne({
                                                    userid: userid
                                                }, {
                                                    $push: {
                                                        recentlyPlayedGames: gameid
                                                    }
                                                }, function (err, res) {
                                                    if (err) {
                                                        db.close();
                                                        returnPromise(false);
                                                        return;
                                                    }
                                                    db.close();
                                                    returnPromise(true);
                                                });
                                            }
                                        }
                                    }
                                });
                            });
                        } else {
                            dbo.collection("games").updateOne({
                                gameid: gameid
                            }, {
                                $inc: {
                                    visits: 1
                                },

                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").findOne({
                                    userid: userid
                                }, function (err, user) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: userid
                                    }, {
                                        $inc: {
                                            placeVisits: 1
                                        },
                                        $set: {
                                            playing: gameid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        if (user.recentlyPlayedGames.includes(gameid)) {
                                            dbo.collection("users").updateOne({
                                                userid: userid
                                            }, {
                                                $set: {
                                                    recentlyPlayedGames: user.recentlyPlayedGames.filter(id => id != gameid)
                                                }
                                            }, function (err, res) {
                                                if (err) {
                                                    db.close();
                                                    returnPromise(false);
                                                    return;
                                                }
                                                if (true) {
                                                    if (user.recentlyPlayedGames.length >= 6) {
                                                        dbo.collection("users").updateOne({
                                                            userid: userid
                                                        }, {
                                                            $inc: {
                                                                placeVisits: 1
                                                            },
                                                            $pop: {
                                                                recentlyPlayedGames: -1
                                                            },
                                                            $push: {
                                                                recentlyPlayedGames: gameid
                                                            }
                                                        }, function (err, res) {
                                                            if (err) {
                                                                db.close();
                                                                returnPromise(false);
                                                                return;
                                                            }
                                                            db.close();
                                                            returnPromise(true);
                                                        });
                                                    } else {
                                                        dbo.collection("users").updateOne({
                                                            userid: userid
                                                        }, {
                                                            $inc: {
                                                                placeVisits: 1
                                                            },
                                                            $push: {
                                                                recentlyPlayedGames: gameid
                                                            }
                                                        }, function (err, res) {
                                                            if (err) {
                                                                db.close();
                                                                returnPromise(false);
                                                                return;
                                                            }
                                                            db.close();
                                                            returnPromise(true);
                                                        });
                                                    }
                                                } else {
                                                    db.close();
                                                    returnPromise(true);
                                                }
                                            });
                                        } else {
                                            if (true) {
                                                if (user.recentlyPlayedGames.length >= 6) {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $inc: {
                                                            placeVisits: 1
                                                        },
                                                        $pop: {
                                                            recentlyPlayedGames: -1
                                                        },
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                } else {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $inc: {
                                                            placeVisits: 1
                                                        },
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                }
                                            } else {
                                                db.close();
                                                returnPromise(true);
                                            }
                                        }
                                    });
                                });
                            });
                        }
                    } else {
                        if (userid == game.creatorid) {
                            dbo.collection("games").updateOne({
                                gameid: gameid
                            }, {
                                $push: {
                                    played: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").findOne({
                                    userid: userid
                                }, function (err, user) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").updateOne({
                                        userid: userid
                                    }, {
                                        $set: {
                                            playing: gameid
                                        }
                                    }, function (err, res) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        if (user.recentlyPlayedGames.includes(gameid)) {
                                            dbo.collection("users").updateOne({
                                                userid: userid
                                            }, {
                                                $set: {
                                                    recentlyPlayedGames: user.recentlyPlayedGames.filter(id => id != gameid)
                                                }
                                            }, function (err, res) {
                                                if (err) {
                                                    db.close();
                                                    returnPromise(false);
                                                    return;
                                                }
                                                if (true) {
                                                    if (user.recentlyPlayedGames.length >= 6) {
                                                        dbo.collection("users").updateOne({
                                                            userid: userid
                                                        }, {
                                                            $pop: {
                                                                recentlyPlayedGames: -1
                                                            },
                                                            $push: {
                                                                recentlyPlayedGames: gameid
                                                            }
                                                        }, function (err, res) {
                                                            if (err) {
                                                                db.close();
                                                                returnPromise(false);
                                                                return;
                                                            }
                                                            db.close();
                                                            returnPromise(true);
                                                        });
                                                    } else {
                                                        dbo.collection("users").updateOne({
                                                            userid: userid
                                                        }, {
                                                            $push: {
                                                                recentlyPlayedGames: gameid
                                                            }
                                                        }, function (err, res) {
                                                            if (err) {
                                                                db.close();
                                                                returnPromise(false);
                                                                return;
                                                            }
                                                            db.close();
                                                            returnPromise(true);
                                                        });
                                                    }
                                                } else {
                                                    db.close();
                                                    returnPromise(true);
                                                }
                                            });
                                        } else {
                                            if (true) {
                                                if (user.recentlyPlayedGames.length >= 6) {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $pop: {
                                                            recentlyPlayedGames: -1
                                                        },
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                } else {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                }
                                            }
                                        }
                                    });
                                });
                            });
                        } else {
                            dbo.collection("games").updateOne({
                                gameid: gameid
                            }, {
                                $inc: {
                                    visits: 1
                                },
                                $push: {
                                    played: userid
                                }
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                dbo.collection("users").updateOne({
                                    userid: userid
                                }, {
                                    $inc: {
                                        placeVisits: 1
                                    },
                                    $set: {
                                        playing: gameid
                                    }
                                }, function (err, res) {
                                    if (err) {
                                        db.close();
                                        returnPromise(false);
                                        return;
                                    }
                                    dbo.collection("users").findOne({
                                        userid: userid
                                    }, function (err, user) {
                                        if (err) {
                                            db.close();
                                            returnPromise(false);
                                            return;
                                        }
                                        if (user.recentlyPlayedGames.includes(gameid)) {
                                            dbo.collection("users").updateOne({
                                                userid: userid
                                            }, {
                                                $set: {
                                                    recentlyPlayedGames: user.recentlyPlayedGames.filter(id => id != gameid)
                                                }
                                            }, function (err, res) {
                                                if (err) {
                                                    db.close();
                                                    returnPromise(false);
                                                    return;
                                                }
                                                if (true) {
                                                    if (user.recentlyPlayedGames.length >= 6) {
                                                        dbo.collection("users").updateOne({
                                                            userid: userid
                                                        }, {
                                                            $inc: {
                                                                placeVisits: 1
                                                            },
                                                            $pop: {
                                                                recentlyPlayedGames: -1
                                                            },
                                                            $push: {
                                                                recentlyPlayedGames: gameid
                                                            }
                                                        }, function (err, res) {
                                                            if (err) {
                                                                db.close();
                                                                returnPromise(false);
                                                                return;
                                                            }
                                                            db.close();
                                                            returnPromise(true);
                                                        });
                                                    } else {
                                                        dbo.collection("users").updateOne({
                                                            userid: userid
                                                        }, {
                                                            $inc: {
                                                                placeVisits: 1
                                                            },
                                                            $push: {
                                                                recentlyPlayedGames: gameid
                                                            }
                                                        }, function (err, res) {
                                                            if (err) {
                                                                db.close();
                                                                returnPromise(false);
                                                                return;
                                                            }
                                                            db.close();
                                                            returnPromise(true);
                                                        });
                                                    }
                                                } else {
                                                    db.close();
                                                    returnPromise(true);
                                                }
                                            });
                                        } else {
                                            if (true) {
                                                if (user.recentlyPlayedGames.length >= 6) {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $inc: {
                                                            placeVisits: 1
                                                        },
                                                        $pop: {
                                                            recentlyPlayedGames: -1
                                                        },
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                } else {
                                                    dbo.collection("users").updateOne({
                                                        userid: userid
                                                    }, {
                                                        $inc: {
                                                            placeVisits: 1
                                                        },
                                                        $push: {
                                                            recentlyPlayedGames: gameid
                                                        }
                                                    }, function (err, res) {
                                                        if (err) {
                                                            db.close();
                                                            returnPromise(false);
                                                            return;
                                                        }
                                                        db.close();
                                                        returnPromise(true);
                                                    });
                                                }
                                            } else {
                                                db.close();
                                                returnPromise(true);
                                            }
                                        }
                                    });
                                });
                            });
                        }
                    }
                });
            });
        });
    },

    getGame: getGame,

    deleteGame: async function (gameid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: gameid
                }, {
                    $set: {
                        deleted: true
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    updateGameInternal: async function (placeid, gameid, ip, port, playing, rccVersion) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: placeid
                }, {
                    $set: {
                        ip: ip,
                        port: port,
                        playing: playing,
                        rccVersion: rccVersion,
                        lastHeartBeat: getUnixTimestamp()
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    updateGameInternalCloud: async function (placeid, gameid, ip, port, playing, rccVersion) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: placeid
                }, {
                    $set: {
                        teamCreateIp: ip,
                        teamCreatePort: port,
                        teamCreatePlaying: playing,
                        teamCreateRccVersion: rccVersion,
                        teamCreateLastHeartBeat: getUnixTimestamp()
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    areFriends: areFriends,

    areFriendsPending: areFriendsPending,

    denyFriend: denyFriend,

    denyAllFriends: denyAllFriends,

    getFriendRequests: async function (userid) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("friends").find({
                    friendid: userid,
                    accepted: false
                }).toArray(function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(result);
                });
            });
        });
    },

    getFriends: getFriends,

    addFriends: async function (userid, friendid) {
        return new Promise(async returnPromise => {
            if (userid == friendid) {
                returnPromise(false);
                return;
            }
            if (await areFriends(userid, friendid)) {
                returnPromise(false);
                return;
            }
            if (await areFriendsPending(userid, friendid)) {
                returnPromise(false);
                return;
            }
            if (await areBlocked(userid, friendid, true)) {
                returnPromise(false);
                return;
            }
            if (await getFriends(userid).length >= 200) {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                let isAccepted = false;
                dbo.collection("friends").findOne({
                    userid: friendid,
                    friendid: userid,
                    accepted: false
                }, function (err, result) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (result != null && result != undefined) {
                        isAccepted = true;
                    }
                    if (isAccepted) {
                        dbo.collection("friends").updateOne({
                            userid: friendid,
                            friendid: userid
                        }, {
                            $set: {
                                accepted: true
                            }
                        }, function (err, obj) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            dbo.collection("friends").insertOne({
                                userid: userid,
                                friendid: friendid,
                                accepted: isAccepted,
                                created: getUnixTimestamp()
                            }, function (err, res) {
                                if (err) {
                                    db.close();
                                    returnPromise(false);
                                    return;
                                }
                                db.close();
                                returnPromise(true);
                            });
                        });
                    } else {
                        dbo.collection("friends").insertOne({
                            userid: userid,
                            friendid: friendid,
                            accepted: isAccepted,
                            created: getUnixTimestamp()
                        }, function (err, res) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    }
                });
            });
        });
    },

    unfriend: unfriend,

    getConfig: getConfig,

    setConfig: async function (prop, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").updateOne({}, {
                    $set: {
                        [prop]: value
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    setMaintenance: async function (value, time = 0) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("config").updateOne({}, {
                    $set: {
                        maintenance: value,
                        maintenance_finishtime: time
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    block: async function (userid, userid2) {
        return new Promise(async returnPromise => {
            if (userid == userid2) {
                returnPromise(false);
                return;
            }
            if (await areBlocked(userid, userid2)) {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, async function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("blocked").insertOne({
                    userid: userid,
                    userid2: userid2,
                    created: getUnixTimestamp()
                }, async function (err, res) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    if (await areFriends(userid, userid2)) {
                        await unfriend(userid, userid2);
                    } else if (await areFriendsPending(userid, userid2)) {
                        dbo.collection("friends").deleteOne({
                            userid: userid,
                            friendid: userid2,
                            accepted: false
                        }, function (err, obj) {
                            if (err) {
                                db.close();
                                returnPromise(false);
                                return;
                            }
                            db.close();
                            returnPromise(true);
                        });
                    } else {
                        db.close();
                        returnPromise(true);
                    }
                });
            });
        });
    },

    areBlocked: areBlocked,

    unblock: async function (userid, userid2) {
        return new Promise(async returnPromise => {
            if (userid == userid2) {
                returnPromise(false);
                return;
            }
            if (!(await areBlocked(userid, userid2))) {
                returnPromise(false);
                return;
            }
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("blocked").deleteOne({
                    userid: userid,
                    userid2: userid2
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    updatePlace: async function (placeid, name, description, genre, maxplayers, access, copiable, chattype) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: placeid
                }, {
                    $set: {
                        gamename: name,
                        description: description,
                        genre: genre,
                        maxplayers: maxplayers,
                        access: access,
                        copiable: copiable,
                        chattype: chattype,
                        updated: getUnixTimestamp()
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    updateGame: async function (gameid, gamename, allowstudioaccesstoapis, isPublic) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                gamename = filterText2(gamename);
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: gameid
                }, {
                    $set: {
                        gamename: gamename,
                        updated: getUnixTimestamp(),
                        isPublic: isPublic,
                        allowstudioaccesstoapis: allowstudioaccesstoapis
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    updateGameStudio: async function (gameid, gamename, description, isPublic, genre) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                gamename = filterText2(gamename);
                description = filterText2(description);
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: gameid
                }, {
                    $set: {
                        gamename: gamename,
                        description: description,
                        updated: getUnixTimestamp(),
                        isPublic: isPublic,
                        genre: genre
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    setDevProductProperty: async function (productid, property, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("devproducts").updateOne({
                    id: productid
                }, {
                    $set: {
                        [property]: value
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    setAssetProperty: async function (assetid, property, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("assets").updateOne({
                    id: assetid
                }, {
                    $set: {
                        [property]: value
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    setGamepassProperty: async function (id, property, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("gamepasses").updateOne({
                    id: id
                }, {
                    $set: {
                        [property]: value
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    setGameProperty: async function (gameid, prop, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("games").updateOne({
                    gameid: gameid
                }, {
                    $set: {
                        [prop]: value
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },


    setUserProperty: async function (userid, prop, value) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").updateOne({
                    userid: userid
                }, {
                    $set: {
                        [prop]: value
                    }
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(false);
                        return;
                    }
                    db.close();
                    returnPromise(true);
                });
            });
        });
    },

    getUserProperty: async function (userid, prop) {
        return new Promise(async returnPromise => {
            MongoClient.connect(mongourl, function (err, db) {
                if (err) throw err;
                const dbo = db.db(dbName);
                dbo.collection("users").findOne({
                    userid: userid
                }, function (err, obj) {
                    if (err) {
                        db.close();
                        returnPromise(null);
                        return;
                    }
                    db.close();
                    returnPromise(obj[prop]);
                });
            });
        });
    },

    getCpuUsage: getCpuUsage,

    getDiskSpace: getDiskSpace,

    randHash: randHash,

    getJobs: getJobs,

    getJobsByGameId: getJobsByGameId,

    requireAuth: function (req, res, next) {
        if (typeof req.cookies[".ROBLOSECURITY"] == "undefined" || req.cookies[".ROBLOSECURITY"] == "") {
            if (req.get("User-Agent") && req.get("User-Agent").toLowerCase().includes("roblox")) {
                res.redirect("/My/Places.aspx&showlogin=True");
            } else {
                res.redirect("https://www.rbx2016.tk/newlogin");
            }
            return;
        }
        findUserByCookie(req.cookies[".ROBLOSECURITY"]).then(async user => {
            if (user) {
                req.user = user;
                let domain = "www.rbx2016.tk";
                const under13 = await isUserUnder13(user.userid);
                if (under13) {
                    domain = "web.rbx2016.tk";
                }
                if (user.banned && req.url != "/not-approved") {
                    res.redirect("https://" + domain + "/not-approved");
                } else if (req.user.inviteKey == "") {
                    res.redirect("/authentication/invitekey");
                } else {
                    if (under13 && req.get("HOST") == "www.rbx2016.tk") {
                        res.redirect("https://" + domain + req.url);
                        return;
                    } else if (!under13 && req.get("HOST") == "web.rbx2016.tk") {
                        res.redirect("https://" + domain + req.url);
                        return;
                    }
                    if (!req.secure) {
                        res.redirect("https://" + req.get("HOST") + req.url);
                        return;
                    }
                    next();
                }
            } else {
                if (req.get("User-Agent") && req.get("User-Agent").toLowerCase().includes("roblox")) {
                    res.redirect("/My/Places.aspx&showlogin=True");
                } else {
                    res.redirect("https://www.rbx2016.tk/newlogin");
                }
            }
        });
    },

    requireMod: async function (req, res, next) {
        if (typeof req.user == "undefined") {
            if (req.get("User-Agent") && req.get("User-Agent").toLowerCase().includes("roblox")) {
                res.redirect("/My/Places.aspx&showlogin=True");
            } else {
                res.redirect("/newlogin");
            }
            return;
        }
        if (req.user.isMod || req.user.isAdmin) {
            next();
        } else {
            if (req.user) {
                res.status(403).render("403", await getRenderObject(req.user));
            } else {
                res.status(403).render("403", await getBlankRenderObject());
            }
        }
    },

    requireAdmin: async function (req, res, next) {
        if (typeof req.user == "undefined") {
            if (req.get("User-Agent") && req.get("User-Agent").toLowerCase().includes("roblox")) {
                res.redirect("/My/Places.aspx&showlogin=True");
            } else {
                res.redirect("/newlogin");
            }
            return;
        }
        if (req.user.isAdmin) {
            next();
        } else {
            if (req.user) {
                res.status(403).render("403", await getRenderObject(req.user));
            } else {
                res.status(403).render("403", await getBlankRenderObject());
            }
        }
    },

    requireNonAuth: function (req, res, next) {
        if (typeof req.cookies[".ROBLOSECURITY"] == "undefined") {
            next();
            return;
        }
        findUserByCookie(req.cookies[".ROBLOSECURITY"]).then(user => {
            if (user) {
                req.user = user;
                res.redirect("https://www.rbx2016.tk/home");
            } else {
                if (!req.get("User-Agent") || !req.get("User-Agent").toLowerCase().includes("roblox")) {
                    if (!req.secure) {
                        res.redirect("https://" + req.get("HOST") + req.url);
                        return;
                    }
                }
                next();
            }
        });
    },

    requireAuth2: function (req, res, next) {
        if (typeof req.cookies[".ROBLOSECURITY"] == "undefined") {
            next();
            return;
        }
        if (req.cookies[".ROBLOSECURITY"] == "") {
            next();
            return;
        }
        findUserByCookie(req.cookies[".ROBLOSECURITY"]).then(user => {
            if (user) {
                req.user = user;
            }
            next();
        });
    },

    requireAuthCSRF: function (req, res, next) {
        let ok = false;
        if (typeof req.headers["x-csrf-token"] !== "undefined") {
            if (req.headers["x-csrf-token"].length == 128) {
                ok = true;
            }
        }
        if (!ok) {
            res.status(401).json({});
            return;
        }
        if (!req.get("User-Agent") || !req.get("User-Agent").toLowerCase().includes("roblox")) {
            if (!req.secure) {
                res.redirect("https://" + req.get("HOST") + req.url);
                return;
            }
        }
        getUserByCsrfToken(req.headers["x-csrf-token"]).then(user => {
            if (user) {
                req.user = user;
            }
            next();
        });
    },
}
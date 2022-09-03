const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const template = require("./template");
const express = require("express");
const db = require("./db");
const get_ip = require('ipware')().get_ip;
const crypto = require('crypto');
const AdmZip = require('adm-zip');

// db.createGame("Testing Place", "A testing game.", 1, "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png", "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png");
// db.createCatalogItem("Test Item", "DEBUG TESTING ITEM", 0, "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png", 41, 1);
// db.createGamepass(1, 3, "Test Gamepass", "A testing gamepass.", 0, "https://static.rbx2016.tk/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png");

if (!fs.existsSync("./logs/admin.log")) {
    fs.writeFileSync("./logs/admin.log", "");
}

template.app.use("/", express.static(__dirname + "/public"));
template.app.use("/", express.static(__dirname + "/public/css"));
template.app.use("/", express.static(__dirname + "/public/img"));
template.app.use("/", express.static(__dirname + "/public/js"));
template.app.use("/", express.static(__dirname + "/public/setup"));

const whitelistedUrls = ["/moderation/filtertext/", "//moderation/filtertext/"]
template.app.use((req, res, next) => {
    if (req.path.substr(-1) === '/' && req.path.length > 1 && !whitelistedUrls.includes(req.path)) {
        const query = req.url.slice(req.path.length)
        const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
        res.redirect(301, safepath + query)
    } else {
        next()
    }
});

template.app.use(async (req, res, next) => {
    if (db.getSiteConfig().shared.pages.disabledRoutes.includes(req.url)) {
        return;
    }
    if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false && (req.url.startsWith("/version-") || req.url.startsWith("/Roblox.apk") || req.url.startsWith("/RobloxPlayerLauncher.exe") || req.url.startsWith("/RobloxStudioLauncherBeta.exe") || req.url.startsWith("/mac") || req.url.startsWith("/Roblox.dmb"))) {
        res.status(403).send("Forbidden");
        return;
    }
    next();
});

template.app.use(db.requireAuth2, async (req, res, next) => {
    if (!req.user) {
        next();
        return;
    }
    if (req.user.inviteKey != "", !req.user.banned && db.getSiteConfig().backend.presenceEnabled == true) {
        await db.setUserProperty(req.user.userid, "lastOnline", db.getUnixTimestamp());
        if (db.getSiteConfig().backend.tix.enabled == true && db.getUnixTimestamp() - req.user.lastTix >= db.getSiteConfig().backend.tix.tixEverySeconds) {
            await db.setUserProperty(req.user.userid, "lastTix", db.getUnixTimestamp());
            await db.setUserProperty(req.user.userid, "tix", req.user.tix + 10);
        }
        if (req.method == "GET" && (!req.url.startsWith("/v1/") && req.url.startsWith("/v1.1/") && !req.url.startsWith("/v2/") && req.url.startsWith("/v3/") && req.url.startsWith("/api/"))) {
            await db.generateUserCsrfToken(req.user.userid);
        }
    }
    next();
});

template.app.use(db.requireAuth2, async (req, res, next) => {
    const ip = get_ip(req).clientIp;
    if ((req.user && req.user.isAdmin) || db.getMaintenanceModeWhitelistedIps().includes(ip)) {
        next();
        return;
    }
    if (db.getSiteConfig().backend.canBypassMaintenanceScreen == true && req.url == "/Login/FulfillConstraint.aspx?" && req.method == "POST") {
        next();
        return;
    }
    const config = await db.getConfig();
    if (config.maintenance && !db.getSiteConfig().backend.allowedMaintenanceResources.includes(req.url)) {
        if (req.url != "/Login/FulfillConstraint.aspx") {
            res.redirect("/Login/FulfillConstraint.aspx");
            return;
        }
        if (config.maintenance_finishtime == 0) {
            res.status(503).render("maintenance", {
                finishTime: ""
            });
        } else {
            res.status(503).render("maintenance", {
                finishTime: db.unixToDate(config.maintenance_finishtime).toUTCString()
            });
        }
    } else {
        next();
    }
});

template.app.get("/Login/FulfillConstraint.aspx", (req, res) => {
    res.redirect("/");
});

template.app.get("/internal/:apiKey/RCCService.wsdl", db.requireAuth2, async (req, res) => {
    const apiKey = req.params.apiKey;
    if (apiKey == db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
        res.sendFile(__dirname + "/internal/RCCService.wsdl");
    } else {
        if (req.user) {
            res.status(404).render("404", await db.getRenderObject(req.user));
        } else {
            res.status(404).render("404", await db.getBlankRenderObject());
        }
    }
});

const subdomain = require('express-subdomain');

const merged = ["assetgame", "admin"];

const files = fs.readdirSync(__dirname + "/controllers/");
for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.endsWith(".js")) {
        const name = file.replace(".js", "");
        if (db.getSiteConfig().backend.disabledApis.includes(name)) {
            continue;
        }
        const router = express.Router();
        const controller = require("./controllers/" + file);
        controller.init(router, db);
        if (name == "MAIN") {
            template.app.use(router);
            continue;
        }
        if (!merged.includes(name) && router.stack.filter(layer => layer.route && layer.route.path === "/").length == 0) {
            router.get("/", (req, res) => {
                res.json({
                    "message": "OK"
                });
            });
        }
        template.app.use(subdomain(name, router));
        if (merged.includes(name)) {
            template.app.use(router);
        }
    }
}

const studioFiles = []
const clientFiles = [];
fs.readdirSync(__dirname + "/public/setup").forEach(file => {
    if (file.endsWith(".zip")) {
        // const md5 = crypto.createHash('md5').update(fs.readFileSync(__dirname + "/public/setup/" + file)).digest('hex');
        if (file.startsWith(`version-${db.getSiteConfig().client.version}s`)) {
            var zip = new AdmZip(__dirname + "/public/setup/" + file);
            zip.getEntries().map(entry => {
                const md5Hash = crypto.createHash('md5').update(entry.getData()).digest('hex');
                let name = file.split("-");
                name.splice(0, 2);
                if (name[name.length - 1] == "RobloxStudio.zip") {
                    name.pop();
                }
                name = name.join("\\");
                studioFiles.push({
                    name: name.length > 0 ? name + "\\" + entry.entryName : entry.entryName,
                    md5: md5Hash
                });
            });
        } else if (file.startsWith(`version-${db.getSiteConfig().client.version}`)) {
            var zip = new AdmZip(__dirname + "/public/setup/" + file);
            zip.getEntries().map(entry => {
                const md5Hash = crypto.createHash('md5').update(entry.getData()).digest('hex');
                let name = file.split("-");
                name.splice(0, 2);
                if (name[name.length - 1] == "RobloxApp.zip") {
                    name.pop();
                }
                name = name.join("\\");
                clientFiles.push({
                    name: name.length > 0 ? name + "\\" + entry.entryName : entry.entryName,
                    md5: md5Hash
                });
            });
        }
    }
});
let studioRbxMainfest = "";
let clientRbxMainfest = "";

for (let i = 0; i < studioFiles.length; i++) {
    studioRbxMainfest += `${studioFiles[i].name}\n${studioFiles[i].md5}\n`;
}
for (let i = 0; i < clientFiles.length; i++) {
    clientRbxMainfest += `${clientFiles[i].name}\n${clientFiles[i].md5}\n`;
}

template.app.get("*", db.requireAuth2, async (req, res) => {
    // Start OF Version API Extension \\

    if (req.url == `/version-${db.getSiteConfig().client.version}-RobloxVersion.txt`) {
        if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
            res.status(403).send("Forbidden");
            return;
        }
        res.send(db.getSiteConfig().client.versionFull);
        return;
    } else if (req.url == `/version-${db.getSiteConfig().client.version}-rbxManifest.txt`) {
        if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
            res.status(403).send("Forbidden");
            return;
        }
        res.status(200).send(clientRbxMainfest);
        return;
    } else if (req.url == `/version-${db.getSiteConfig().client.version}s-rbxManifest.txt`) {
        if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
            res.status(403).send("Forbidden");
            return;
        }
        res.status(200).send(studioRbxMainfest);
        return;
    } else if (req.url == `/version-${db.getSiteConfig().client.version}s-BootstrapperQTStudioVersion.txt`) {
        if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
            res.status(403).send("Forbidden");
            return;
        }
        res.send(db.getSiteConfig().client.versionFull);
        return;
    } else if (req.url == `/version-${db.getSiteConfig().client.version}-R`) {
        if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
            res.status(403).send("Forbidden");
            return;
        }
        res.redirect("/RobloxPlayerLauncher.exe")
        return;
    } else if (req.url == `/version-${db.getSiteConfig().client.version}s-rbxManifest.txt`) {
        if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
            res.status(403).send("Forbidden");
            return;
        }
        res.status(304).send();
        return;
    }
    // End Of Version API Extension \\
    console.warn("404 - " + req.method + ": " + req.get("HOST") + req.url)
    if (req.user) {
        res.status(404).render("404", await db.getRenderObject(req.user));
    } else {
        res.status(404).render("404", await db.getBlankRenderObject());
    }
});

template.app.post("*", db.requireAuth2, async (req, res) => {
    console.warn("404 - " + req.method + ": " + req.get("HOST") + req.url)
    if (req.user) {
        res.status(404).render("404", await db.getRenderObject(req.user));
    } else {
        res.status(404).render("404", await db.getBlankRenderObject());
    }
});

template.app.patch("*", db.requireAuth2, async (req, res) => {
    console.warn("404 - " + req.method + ": " + req.get("HOST") + req.url)
    if (req.user) {
        res.status(404).render("404", await db.getRenderObject(req.user));
    } else {
        res.status(404).render("404", await db.getBlankRenderObject());
    }
});

template.app.delete("*", db.requireAuth2, async (req, res) => {
    console.warn("404 - " + req.method + ": " + req.get("HOST") + req.url)
    if (req.user) {
        res.status(404).render("404", await db.getRenderObject(req.user));
    } else {
        res.status(404).render("404", await db.getBlankRenderObject());
    }
});

template.start("0.0.0.0", db.getSiteConfig().shared.httpPort, db.getSiteConfig().shared.httpsEnabled, db.getSiteConfig().shared.httpsPort);
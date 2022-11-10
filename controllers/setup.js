const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

module.exports = {
    init: (app, db) => {
        app.get(`/version-${db.getSiteConfig().client.windows.x86.version}-RobloxPlayerLauncher.exe`, (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            res.redirect("/RobloxPlayerLauncher.exe");
        });
        
        app.get(`/version-${db.getSiteConfig().studio.windows.x64.version}-RobloxStudioLauncherBeta.exe`, (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            res.redirect("/RobloxStudioLauncherBeta.exe");
        });

        const studioFiles = []
        const studio64Files = []
        const clientFiles = [];
        const bp = path.join(__dirname, "..", "public", "setup");
        fs.readdirSync(bp).forEach(file => {
            if (file.endsWith(".zip")) {
                // const md5 = crypto.createHash('md5').update(fs.readFileSync(path.join(bp, file))).digest('hex');
                if (file.startsWith(`version-${db.getSiteConfig().studio.windows.x86.version}`)) {
                    var zip = new AdmZip(path.join(bp, file));
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
                } else if (file.startsWith(`version-${db.getSiteConfig().studio.windows.x64.version}`)) {
                    var zip = new AdmZip(path.join(bp, file));
                    zip.getEntries().map(entry => {
                        const md5Hash = crypto.createHash('md5').update(entry.getData()).digest('hex');
                        let name = file.split("-");
                        name.splice(0, 2);
                        if (name[name.length - 1] == "RobloxStudio.zip") {
                            name.pop();
                        }
                        name = name.join("\\");
                        studio64Files.push({
                            name: name.length > 0 ? name + "\\" + entry.entryName : entry.entryName,
                            md5: md5Hash
                        });
                    });
                } else if (file.startsWith(`version-${db.getSiteConfig().client.windows.x86.version}`)) {
                    var zip = new AdmZip(path.join(bp, file));
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
        let studio64RbxMainfest = "";
        let clientRbxMainfest = "";

        for (let i = 0; i < studioFiles.length; i++) {
            studioRbxMainfest += `${studioFiles[i].name}\n${studioFiles[i].md5}\n`;
        }

        for (let i = 0; i < studio64Files.length; i++) {
            studio64RbxMainfest += `${studio64Files[i].name}\n${studio64Files[i].md5}\n`;
        }

        for (let i = 0; i < clientFiles.length; i++) {
            clientRbxMainfest += `${clientFiles[i].name}\n${clientFiles[i].md5}\n`;
        }

        app.get("*", db.requireAuth2, async (req, res) => {
            // Start Of Version API Extension \\

            if (req.url == `/version-${db.getSiteConfig().client.windows.x86.version}-RobloxVersion.txt`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.send(db.getSiteConfig().client.windows.x86.versionFull);
                return;
            } else if (req.url == `/version-${db.getSiteConfig().client.windows.x86.version}-rbxPkgManifest.txt`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.status(200).send(clientRbxMainfest);
                return;
            } else if (req.url == `/version-${db.getSiteConfig().studio.windows.x86.version}-rbxPkgManifest.txt`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.status(200).send(studioRbxMainfest);
                return;
            } else if (req.url == `/version-${db.getSiteConfig().studio.windows.x64.version}-rbxPkgManifest.txt`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.status(200).send(studio64RbxMainfest);
                return;
            } else if (req.url == `/version-${db.getSiteConfig().studio.windows.x86.version}-BootstrapperQTStudioVersion.txt`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.send(db.getSiteConfig().client.windows.x86.versionFull);
                return;
            } else if (req.url == `/version-${db.getSiteConfig().client.windows.x86.version}-R`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.redirect("/RobloxPlayerLauncher.exe")
                return;
            } else if (req.url == `/version-${db.getSiteConfig().studio.windows.x86.version}-rbxManifest.txt`) {
                if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                    res.status(403).send("Forbidden");
                    return;
                }
                res.status(304).send();
                return;
            }
            // End Of Version API Extension \\
            if (req.user) {
                res.status(404).render("404", await db.getRenderObject(req.user));
            } else {
                res.status(404).render("404", await db.getBlankRenderObject());
            }
        });
    }
}
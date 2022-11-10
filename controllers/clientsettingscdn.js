const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v2/client-version/WindowsPlayer", (req, res) => {
            res.json({
                "version": `${db.getSiteConfig().client.windows.x86.versionFull.replaceAll(", ", ".")}`,
                "clientVersionUpload": `version-${db.getSiteConfig().client.windows.x86.version}`,
                "bootstrapperVersion": db.getSiteConfig().client.windows.x86.bootstrapperVersion,
            });
            // res.send(fs.readFileSync(__dirname + "/../FFlags/WindowsPlayerVersion.json").toString());
        });
        app.get("/v2/client-version/MacPlayer", (req, res) => {
            res.json({
                "version": `${db.getSiteConfig().client.mac.x64.versionFull.replaceAll(", ", ".")}`,
                "clientVersionUpload": `version-${db.getSiteConfig().client.mac.x64.version}`,
                "bootstrapperVersion": db.getSiteConfig().client.mac.x64.bootstrapperVersion,
            });
            // res.send(fs.readFileSync(__dirname + "/../FFlags/MacPlayerVersion.json").toString());
        });
        app.get("/v2/client-version/WindowsStudio", (req, res) => {
            res.json({
                "version": `${db.getSiteConfig().studio.windows.x86.versionFull.replaceAll(", ", ".")}`,
                "clientVersionUpload": `version-${db.getSiteConfig().studio.windows.x86.version}`,
                "bootstrapperVersion": db.getSiteConfig().studio.windows.x86.bootstrapperVersion,
            });
            // res.send(fs.readFileSync(__dirname + "/../FFlags/WindowsStudioVersion.json").toString());
        });
        app.get("/v2/client-version/WindowsStudio64", (req, res) => {
            res.json({
                "version": `${db.getSiteConfig().studio.windows.x64.versionFull.replaceAll(", ", ".")}`,
                "clientVersionUpload": `version-${db.getSiteConfig().studio.windows.x64.version}`,
                "bootstrapperVersion": db.getSiteConfig().studio.windows.x64.bootstrapperVersion,
            });
            // res.send(fs.readFileSync(__dirname + "/../FFlags/WindowsStudioVersion64.json").toString());
        });
        app.get("/v2/client-version/MacStudio", (req, res) => {
            res.json({
                "version": `${db.getSiteConfig().studio.mac.x64.versionFull.replaceAll(", ", ".")}`,
                "clientVersionUpload": `version-${db.getSiteConfig().studio.mac.x64.version}`,
                "bootstrapperVersion": db.getSiteConfig().studio.mac.x64.bootstrapperVersion,
            });
            // res.send(fs.readFileSync(__dirname + "/../FFlags/MacStudioVersion.json").toString());
        });

        app.get("/v2/settings/application/AndroidApp", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/AndroidApp.json").toString());
        });
        app.get("/v2/settings/application/iOSApp", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/iOSApp.json").toString());
        });
        app.get("/v2/settings/application/MacDesktopClient", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/MacDesktopClient.json").toString());
        });
        app.get("/v2/settings/application/MacClientBootstrapper", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/MacClientBootstrapper.json").toString());
        });
        app.get("/v2/settings/application/MacStudioApp", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/MacStudioApp.json").toString());
        });
        app.get("/v2/settings/application/MacStudioBootstrapper", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/MacStudioBootstrapper.json").toString());
        });
        app.get("/v2/settings/application/PCDesktopClient", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/PCDesktopClient.json").toString());
        });
        app.get("/v2/settings/application/PCClientBootstrapper", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/PCClientBootstrapper.json").toString());
        });
        app.get("/v2/settings/application/PCStudioApp", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/PCStudioApp.json").toString());
        });
        app.get("/v2/settings/application/PCStudioBootstrapper", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/PCStudioBootstrapper.json").toString());
        });
        app.get("/v2/settings/application/UWPApp", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/UWPApp.json").toString());
        });
        app.get("/v2/settings/application/XboxClient", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/XboxClient.json").toString());
        });
    }
}
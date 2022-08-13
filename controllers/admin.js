const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post("/v1/admin/ban", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const modnote = req.body.modnote;
            const reason = req.body.reason;
            const item = req.body.item;
            const todo = req.body.todo;
            await db.banUser(userid, modnote, reason, item);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/approve", db.requireAuth, db.requireMod, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const assetid = parseInt(req.body.assetid);
            await db.approveAsset(req.user.userid, assetid);
            res.send("Asset Approved!");
        });

        app.post("/v1/admin/settix", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const tix = parseInt(req.body.tix);
            await db.setUserProperty(userid, "tix", tix);
            res.send("OK");
        });

        app.post("/v1/admin/addtix", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user){
                res.status(400).send("User not found.");
                return;
            }
            const amount = parseInt(req.body.amount);
            const tix = await db.getUserProperty(userid, "tix");
            await db.setUserProperty(userid, "tix", tix + amount);
            res.send("OK");
        });

        app.post("/v1/admin/gettix", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user){
                res.status(400).send("User not found.");
                return;
            }
            const tix = await db.getUserProperty(userid, "tix");
            res.send(tix.toString());
        });

        app.post("/v1/useradmin/givetix", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user){
                res.status(400).send("User not found.");
                return;
            }
            const give = parseInt(req.body.amount);
            if (amount < 0 || amount > db.getSiteConfig().backend.maxGiveTix){
                res.status(400).send(`You can only give between 0 and ${db.getSiteConfig().backend.maxGiveTix} tix!`);
                return;
            }
            if (req.user.tix < amount){
                res.status(400).send("You do not have enough tix to give!");
                return;
            }
            const tix = await db.getUserProperty(userid, "tix");
            await db.setUserProperty(req.user.userid, "tix", req.user.tix - amount);
            await db.setUserProperty(userid, "tix", tix + give);
            res.send(tix.toString());
        });

        app.get("/v1/admin/unapprovedAssets", async (req, res) => {
            let limit = parseInt(req.query.limit) || 100;
            if (limit < 0) {
                limit = 1;
            } else if (limit > 100) {
                limit = 100;
            }
            const assets = await db.getFirstXUnapprovedAssets(limit);
            let html = `
            <script type='text/javascript' src='/js/jquery-1.11.1.min.js'></script>
            <script type='text/javascript'>
                window.jQuery || document.write("<script type='text/javascript' src='/js/jquery/jquery-1.11.1.js'><\\/script>")
            </script>
            <script type='text/javascript' src='/js/jquery-migrate-1.2.1.min.js'></script>
            <script type='text/javascript'>
                window.jQuery || document.write(
                    "<script type='text/javascript' src='/js/jquery-migrate-1.2.1.js'><\\/script>")
            </script>
            <script>
                function approveAsset(id){
                    $.ajax({
                        url: 'https://www.rbx2016.tk/v1/admin/approve',
                        type: 'POST',
                        data: {
                            'assetid': id
                        },
                        success: function(data){
                            document.getElementById("asset-" + id.toString()).innerHTML = "Approved";
                        }
                    });
                }
                
                function deleteAsset(id){
                    $.ajax({
                        url: 'https://www.rbx2016.tk/v1/admin/delete',
                        type: 'POST',
                        data: {
                            'assetid': id
                        },
                        success: function(data){
                            document.getElementById("asset-" + id.toString()).innerHTML = "Deleted";
                        }
                    });
                }
            </script>

            <table>
            <thead>
              <tr>
                <th>Creator</th>
                <th>Asset</th>
                <th>Actions</th>
              </tr>

             </thead>
             <tbody>
               
            `;
            for (let i = 0; i < assets.length; i++) {
                const asset = assets[i];
                const creator = await db.getUser(asset.creatorid);
                html += `<tr>
                 <td><a href="https://www.rbx2016.tk/users/${creator.userid}/profile">${creator.username}</a></td>
                 <td><a href="https://www.rbx2016.tk/library/${asset.id}">${asset.name}</a></td>
                 <td id="asset-${asset.id}"><button onclick="approveAsset(${asset.id})">Approve</button> <button onclick="deleteAsset(${asset.id})">Delete</button></td>
               </tr>`;
            }
            html += `<tr>
            </tr></tbody>
            </table>`;
            res.send(html);
        });

        app.post("/v1/admin/delete", db.requireAuth, db.requireMod, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const assetid = parseInt(req.body.assetid);
            await db.deleteAsset(assetid);
            res.send("Asset Deleted!");
        });

        app.post("/v1/admin/unban", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const modnote = req.body.modnote;
            const reason = req.body.reason;
            const item = req.body.item;
            await db.unbanUser(userid);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/setrobux", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const robux = parseInt(req.body.robux);
            await db.setUserProperty(userid, "robux", robux);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/maintenance", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const maintenance = req.body.maintenance != null;
            const maintenance_finishtime = parseInt(req.body.maintenance_finishtime);
            await db.setMaintenance(maintenance, maintenance_finishtime);
            if (maintenance) {
                const code = db.uuidv4();
                await db.setMaintenanceWhitelistCode(code);
                res.send(code);
            } else {
                await db.setMaintenanceWhitelistCode("");
                db.resetMaintenanceModeWhitelistedIps();
                res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
            }
        });

        app.post("/v1/admin/msg", db.requireAuth, db.requireMod, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const msg = req.body.msg;
            await db.setConfig("roblox_message", msg);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/restartarbiter", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const jobs = await db.getJobs();
            for (let i = 0; i < jobs.length; i++) {
                const job = await db.getJob(jobs[i]);
                await job.stop();
            }
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/restartarbiter")
        });

        app.post("/v1/admin/cinvitekey", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const key = await db.createInviteKey(req.user.userid);
            res.send(key);
        });

        app.post("/v1/admin/dinvitekey", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const key = req.body.key;
            const deleted = await db.deleteInviteKey(key);
            if (deleted) {
                res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/invitekeys");
            } else {
                res.status(404).send("Key not found");
            }
        });

        app.post("/v1/admin/renameuser", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const username = req.body.username;
            const user = await db.getUser(userid);
            if (!user) {
                return res.status(404).send("User not found");
            }
            await db.setUserProperty(userid, "username", username);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/usermoderation")
        });

        app.post("/v1/admin/gmembership", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const membership = parseInt(req.body.membership);
            const user = await db.getUser(userid);
            if (!user) {
                return res.status(404).send("User not found");
            }
            if (membership < 0 || membership > 3) {
                return res.status(400).send("Invalid membership");
            }
            await db.setUserProperty(userid, "membership", membership);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/usermoderation")
        });

        app.post("/v1/admin/userinfo", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user) {
                return res.status(404).send("User not found");
            }
            const membership = user.membership == 3 ? "Outrageous Builders Club" : user.membership == 2 ? "Turbo Builders Club" : user.membership == 1 ? "Builders Club" : "None";

            let games = "";
            let items = "";
            let assets = "";

            const games0 = await db.getGamesByCreatorId(user.userid);
            for (let i = 0; i < games0.length; i++) {
                const game = games0[i];
                games += `<a href="/games/${game.gameid}">${game.gamename}</a><p></p>`;
            }
            const items0 = await db.getCatalogItemsByCreatorId(user.userid);
            for (let i = 0; i < items0.length; i++) {
                const item = items0[i];
                items += `<a href="/catalog/${item.itemid}">${item.itemname}</a><p></p>`;
            }


            res.send(`
--------------------------------------------<p></p>
UserId: ${user.userid}<p></p>
Username: ${user.username}<p></p>
Admin: ${db.toString(user.isAdmin)}<p></p>
Banned: ${db.toString(user.banned)}<p></p>
ㅤㅤ- Ban Date: ${user.bannedDate}<p></p>
ㅤㅤㅤㅤ- Ban Mod Note: ${user.bannedModNote}<p></p>
ㅤㅤㅤㅤ- Ban Item: ${user.bannedReasonItem}<p></p>
ㅤㅤㅤㅤ- Ban Reason: ${user.bannedReason}<p></p>
--------------------------------------------<p></p>
User Info:<p></p>
ㅤㅤ[Submitted Info]<p></p>
ㅤㅤ- Email: ${user.email}<p></p>
ㅤㅤㅤㅤ- Email Verified: ${db.toString(user.emailverified)}<p></p>
ㅤㅤ- Birthday: ${db.unixToDate(user.birthday).toISOString()}<p></p>
ㅤㅤ- Gender: ${(user.gender == 1 ? "Not Specified" : user.gender == 2 ? "Boy" : user.gender == 3 ? "Girl" : "Unknown")}<p></p>
ㅤㅤ- User Description: ${user.description}<p></p>
ㅤㅤ[Currency]<p></p>
ㅤㅤ- Membership: ${membership}<p></p>
ㅤㅤ- Robux: ${db.formatNumber(user.robux)}<p></p>
ㅤㅤ- Tix: ${db.formatNumber(user.tix)}<p></p>
ㅤㅤ[Signup/Dates]<p></p>
ㅤㅤ- Signup IP: ${user.ip}<p></p>
ㅤㅤㅤㅤ- Created: ${db.unixToDate(user.created).toISOString()}<p></p>
ㅤㅤ[Other]<p></p>
ㅤㅤ- Last Online: ${db.unixToDate(user.lastOnline).toISOString()}<p></p>
ㅤㅤ- Playing: ${(user.lastOnline || 0) <= (db.getUnixTimestamp() - 60) && user.playing == 0 ? "Nothing" : db.toString(user.playing)}<p></p>
--------------------------------------------<p></p>
User Assets:<p></p>
[Games]<p></p>
${games}
[Catalog Items]<p></p>
${items}
[Assets]<p></p>
${assets}
--------------------------------------------<p></p>
            `);
        });


        app.post("/v1/admin/linvitekeys", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const keys = await db.listInviteKeys();
            let out = "";
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (key.deleted) {
                    out += `${key.inviteKey} | Creator: ${key.createdby} | Created: ${db.unixToDate(key.created).toISOString()} | DELETED : ${db.unixToDate(key.usedDate).toISOString()}<p></p>`;
                    continue;
                }
                out += `${key.inviteKey} | Creator: ${key.createdby} | Created: ${db.unixToDate(key.created).toISOString()}<p></p>`;
            }
            res.send(out);
        });

        app.post("/v1/admin/setfflag", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const fflag = req.body.fflag;
            const value = req.body.value;
            const platform = req.body.platform;
            if (!platform) {
                const files = fs.readdirSync(path.resolve(__dirname + "/../FFlags"));
                for (const file of files) {
                    if (file.endsWith(".json")) {
                        const fp = path.resolve(__dirname + "/../FFlags/" + file)
                        const data = JSON.parse(fs.readFileSync(fp, "utf8"));
                        data.applicationSettings[fflag] = value;
                        fs.writeFileSync(fp, JSON.stringify(data));
                    }
                }
            } else {
                const bp = path.resolve(__dirname + "/../FFlags") + path.sep;
                const fp = path.resolve(bp + platform + ".json");
                if (!fp.startsWith(bp)) {
                    res.status(400).send();
                    return;
                }
                if (!fs.existsSync(fp)) {
                    res.status(404).send("Configuration File Not Found.");
                    return;
                }
                const data = JSON.parse(fs.readFileSync(fp, "utf8"));
                data.applicationSettings[fflag] = value;
                fs.writeFileSync(fp, JSON.stringify(data));
                res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/fflags");
            }
        });

        app.post("/v1/admin/rccrunscript", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const script = req.body.script;
            const jobid = req.body.jobid;
            const jobid2 = req.body.jobid2;

            const isNewJob = req.body.jobtype == "newjob";
            if (isNewJob) {
                if (db.getSiteConfig().backend.ADMIN_AdminCanExecuteNewJobScripts == false) {
                    return res.status(404).send("[!]: Executing scirpts on new instances is disabled.");
                }
                const job = await db.newJob(0);
                if (!job) {
                    return res.send("Error creating job.");
                }
                await job.start();
                let jobStoped = false;
                setTimeout(async () => {
                    if (!jobStoped) {
                        jobStoped = true;
                        await job.stop();
                        res.status(500).send("Job stopped due to timeout.");
                    }
                }, 15000);
                const result0 = await job.execute(script);
                if (!jobStoped) {
                    let result01 = [];
                    let result02 = [];
                    for (let i = 0; i < result0.length; i++) {
                        if (result0[i].startsWith("ok|")) {
                            result01.push(result0[i].substring(3));
                        } else if (result0[i].startsWith("err|")) {
                            result02.push(result0[i].substring(4));
                        }
                    }
                    let result = result02.length > 0 ? result02.join(", ") : result01.join(", ");
                    if (result02.length > 0) {
                        res.status(400).send("[ERROR]: " + result);
                    } else {
                        res.send(result);
                    }
                    await job.stop();
                    jobStoped = true;
                }
            } else {
                const job = await db.getJob(jobid2 && jobid2 != "" ? jobid2 : jobid);
                if (db.getSiteConfig().backend.ADMIN_AdminCanExecuteJobScripts == false) {
                    return res.status(404).send("[!]: Executing scirpts on existing instances is disabled.");
                }
                if (!job) {
                    return res.send("Job not found.");
                }
                const result0 = await job.execute(script);
                if (result0) {
                    let result01 = [];
                    let result02 = [];
                    for (let i = 0; i < result0.length; i++) {
                        if (result0[i].startsWith("ok|")) {
                            result01.push(result0[i].substring(3));
                        } else if (result0[i].startsWith("err|")) {
                            result02.push(result0[i].substring(4));
                        }
                    }
                    let result = result02.length > 0 ? result02.join(", ") : result01.join(", ");
                    if (result02.length > 0) {
                        res.status(400).send("[ERROR]: " + result);
                    } else {
                        res.send(result);
                    }
                }else{
                    res.send("[ERROR]: An error occured while executing.");
                }
            }
        });

        app.post("/v1/admin/getfflag", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const fflag = req.body.fflag;
            const platform = req.body.platform;
            const bp = path.resolve(__dirname + "/../FFlags") + path.sep;
            const fp = path.resolve(bp + platform + ".json");
            if (!fp.startsWith(bp)) {
                res.status(400).send();
                return;
            }
            if (!fs.existsSync(fp)) {
                res.status(404).send("Configuration File Not Found.");
                return;
            }
            const data = JSON.parse(fs.readFileSync(fp, "utf8"));
            res.send(data.applicationSettings[fflag]);
        });
    }
}
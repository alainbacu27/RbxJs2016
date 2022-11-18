const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        const validBanTypes = ["Warning", "1Day", "3Days", "1Week", "Permanent"];
        app.post("/v1/admin/ban", db.requireAuth, db.requireMod, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const modnote = req.body.modnote;
            const reason = req.body.reason;
            const item = req.body.item;
            const todo = req.body.todo;
            const user = await db.getUser(userid);
            if (req.user.role == "mod") {
                if (user && (user.role == "mod" || user.role == "admin" || user.role == "owner")) {
                    res.status(401).send("You cannot ban that person. Lacking sufficient permissions.");
                    return;
                }
            }
            if (req.user.role == "admin") {
                if (user && (user.role == "admin" || user.role == "owner")) {
                    res.status(401).send("You cannot ban that person. Lacking sufficient permissions.");
                    return;
                }
            }
            if (user && user.role == "owner" && req.user.userid != 1) {
                res.status(401).send("You cannot ban that person. Lacking sufficient permissions.");
                return;
            }
            if (!user || user.isBanned) {
                res.status(400).send("User not found or already banned.");
                return;
            }
            const banType = req.body.type || "Permanent";
            if (!validBanTypes.includes(banType)) {
                res.status(400).send("Invalid ban type.");
                return;
            }
            db.log(`user ${req.user.userid} has been ${banType} banned by ${user.username} (${user.userid}) for the reason: ${reason}`);
            await db.banUser(userid, banType, modnote, reason, item);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/approve", db.requireAuth, db.requireApprover, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const assetid = parseInt(req.body.assetid);
            const approved = await db.approveAsset(req.user.userid, assetid);
            if (approved){
                db.log(`User ${req.user.userid} has approved asset ${assetid}.`);
                res.send("Asset Approved!");
            }else{
                res.send("Failed to approve asset. (Does it exist?)");
            }
        });

        app.post("/v1/admin/settix", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const tix = parseInt(req.body.tix);
            db.log(`${req.user.userid} setting ${userid}'s tix to ${tix}.`);
            await db.setUserProperty(userid, "tix", tix);
            res.send("OK");
        });

        app.post("/v1/admin/addtix", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user) {
                res.status(400).send("User not found.");
                return;
            }
            const amount = parseInt(req.body.amount);
            const tix = await db.getUserProperty(userid, "tix");
            db.log(`${req.user.userid} adding ${tix} tix to user ${userid}.`);
            await db.setUserProperty(userid, "tix", tix + amount);
            res.send("OK");
        });

        app.post("/v1/admin/gettix", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user) {
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
            if (!user) {
                res.status(400).send("User not found.");
                return;
            }
            if (user.userid == req.user.userid) {
                res.status(401).send("You cannot give your self tix.");
                return;
            }
            const amount = parseInt(req.body.amount);
            if (amount < 1 || amount > db.getSiteConfig().backend.maxGiveTix) {
                res.status(400).send(`You can only give between 1 and ${db.getSiteConfig().backend.maxGiveTix} tix!`);
                return;
            }
            if (req.user.tix < amount) {
                res.status(400).send("You do not have enough tix to give!");
                return;
            }
            const tix = await db.getUserProperty(userid, "tix");
            await db.setUserProperty(req.user.userid, "tix", req.user.tix - amount);
            await db.setUserProperty(userid, "tix", tix + amount);
            res.send(`Sucessfully gave "${user.username}" (userid: ${user.userid}), ${amount} tix!`);
        });

        app.get("/v1/admin/unapprovedAssets", db.requireApprover, async (req, res) => {
            let limit = parseInt(req.query.limit) || 100;
            if (limit < 0) {
                limit = 1;
            } else if (limit > 100) {
                limit = 100;
            }
            const assets = await db.getFirstXUnapprovedAssets(limit);
            let html = `
            <link rel="stylesheet" href="https://static.rbx2016.nl/css/main.css">
<script type='text/javascript' src='/shut/realtime.js'></script>
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
                        url: 'https://www.rbx2016.nl/v1/admin/approve',
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
                        url: 'https://www.rbx2016.nl/v1/admin/delete',
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
                 <td><a href="https://www.rbx2016.nl/users/${creator.userid}/profile">${creator.username}</a></td>
                 <td><a href="https://www.rbx2016.nl/library/${asset.id}">${asset.name}</a></td>
                 <td id="asset-${asset.id}"><button onclick="approveAsset(${asset.id})">Approve</button> <button onclick="deleteAsset(${asset.id})">Delete</button></td>
               </tr>`;
            }
            html += `<tr>
            </tr></tbody>
            </table>`;
            res.send(html);
        });

        app.post("/v1/admin/delete", db.requireAuth, db.requireApprover, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const assetid = parseInt(req.body.assetid);
            const deleted = await db.deleteAsset(assetid);
            if (deleted){
                db.log(`User ${req.user.userid} deleting asset ${assetid}.`);
                res.send("Asset Deleted!");
            }else{
                res.send("Failed to delete asset. (does it exist?)");
            }
        });

        app.post("/v1/admin/unban", db.requireAuth, db.requireMod, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            db.log(`User ${req.user.userid} unbanning user ${userid}.`);
            await db.unbanUser(userid);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/setrobux", db.requireAuth, db.requireOwner, async (req, res) => {
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
                db.log(`Maintenance enabled by ${req.user.userid}, code: ${code}`);
                await db.setMaintenanceWhitelistCode(code);
                res.send(code);
            } else {
                db.log(`Maintenance disabled by ${req.user.userid}.`);
                await db.setMaintenanceWhitelistCode("");
                db.resetMaintenanceModeWhitelistedIps();
                res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
            }
        });

        app.post("/v1/admin/msg", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const msg = req.body.msg;
            if (msg == "") {
                db.log(`User ${req.user.userid} removing message.`);
            } else {
                db.log(`User ${req.user.userid} publishing message: ${msg}`);
            }
            await db.setConfig("roblox_message", msg);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute)
        });

        app.post("/v1/admin/restartarbiter", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            db.log(`User ${req.user.userid} restarting arbiter.`);
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
            if (req.user.role == "mod") {
                if (req.user.lastInvite && db.getUnixTimestamp() - req.user.lastInvite < db.getSiteConfig().shared.ADMIN_InviteCooldown) {
                    res.status(401).send(`You cannot invite another user until ${db.timeToString(req.user.lastInvite + db.getSiteConfig().shared.ADMIN_InviteCooldown)}.`);
                    return;
                }
            }
            db.log("Invite key requested by user " + req.user.userid.toString());
            await db.setUserProperty(req.user.userid, "lastInvite", db.getUnixTimestamp());
            const key = await db.createInviteKey(req.user.userid);
            res.send(key);
        });

        app.post("/v1/admin/dinvitekey", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const key = req.body.key;
            const ik = await db.getInviteKey(key);
            if (!req.user.role == "owner" && ik && ik.createdby != req.user.userid) {
                res.status(401).send("You cannot delete this invite key.");
                return;
            }
            const deleted = await db.deleteInviteKey(key);
            if (deleted) {
                db.log("Invite key \"" + key + "\" deleted by user " + req.user.userid.toString());
                res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/invitekeys");
            } else {
                res.status(404).send("Key not found");
            }
        });

        app.post("/v1/admin/renameuser", db.requireAuth, db.requireMod, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const username = db.filterText3(req.body.username);
            const user = await db.getUser(userid);
            if (db.shouldCensorText(username)) {
                res.status(400).send("Invalid username.");
                return;
            }
            if (!user) {
                return res.status(404).send("User not found");
            }
            if (user.role == "mod" && !(req.user.role == "admin" || req.user.role == "owner") && req.user.userid != user.userid) {
                return res.status(401).send("You cannot rename this user.");
            }
            if (user.role == "admin" && req.user.role != "owner" && req.user.userid != user.userid) {
                return res.status(401).send("You cannot rename this user.");
            }
            if (user.role == "owner" && req.user.role != "owner" && req.user.userid != user.userid) {
                return res.status(401).send("You cannot rename this user.");
            }

            if (await db.userExists(username)) {
                res.status(400).send("Username already exists");
                return;
            }
            db.log(`User ${req.user.userid} renaming user ${userid} to ${username}.`);
            await db.setUserProperty(userid, "username", username);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/usermoderation")
        });

        app.post("/v1/admin/gmembership", db.requireAuth, db.requireOwner, async (req, res) => {
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
            db.log(`User ${req.user.userid} changing user ${userid}'s membership to ${membership}.`);
            await db.setUserProperty(userid, "membership", membership);
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/usermoderation")
        });

        app.post("/v1/admin/grole", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const userid = parseInt(req.body.userid);
            const role = parseInt(req.body.role);
            const user = await db.getUser(userid);
            if (!user) {
                return res.status(404).send("User not found");
            }
            if (role < 0 || role > 2) {
                return res.status(400).send("Invalid role");
            }
            if (user.role == "owner" && req.user.userid != 1) {
                return res.status(401).send("You cannot change this user's role.");
            }
            db.log(`User ${req.user.userid} changing user ${userid}'s role to ${role}.`);
            switch (role) {
                case 0:
                    await db.setUserProperty(userid, "role", "none");
                    break;
                case 1:
                    await db.setUserProperty(userid, "role", "approver");
                    break;
                case 2:
                    await db.setUserProperty(userid, "role", "mod");
                    break;
                case 3:
                    await db.setUserProperty(userid, "role", "admin");
                    break;
            }
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/usermoderation");
        });

        app.post("/v1/admin/userinfo", db.requireAuth, db.requireMod, async (req, res) => {
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
Role: ${user.role}<p></p>
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
ㅤㅤ- Signup IP: ${req.user.role == "owner" ? user.ip : db.maskIp(user.ip)}<p></p>
ㅤㅤㅤㅤ- Created: ${db.unixToDate(user.created).toISOString()}<p></p>
ㅤㅤ[Other]<p></p>
ㅤㅤ- Last IP: ${req.user.role == "owner" ? user.lastIp || "?.?.?.?" : db.maskIp(user.lastIp || "?.?.?.?")}<p></p>
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

        async function formatMessages(userid, location) {
            let messages = await db.getMessages(userid, location);
            if (!messages) return ``;
            messages = messages.reverse();
            let formatted = ``;
            for (let i = 0; i < messages.length; i++) {
                if (i > 1000) break;
                const message = messages[i];
                const sender = await db.getUser(message.from);
                if (!sender) continue;
                formatted += `<h1>User ${userid} messages</h1>
                <h2>Id: ${message.id}</h2>
                <h2>To: ${message.to}</h2>
                <h2>Timestamp: ${message.timestamp}</h2>
                <h3>Subject: ${message.subject}</h3>
                <h4>Body: ${message.body}</h4>
                <p>&nbsp;</p>
                <br/>`;
            }
            return formatted;
        }

        app.post("/v1/admin/messages", db.requireAuth, db.requireOwner, async (req, res) => {
            const userid = parseInt(req.body.userid);
            const user = await db.getUser(userid);
            if (!user) return res.status(404).send("User not found.");
            res.send(await formatMessages(user.userid, "sent"));
        });


        app.post("/v1/admin/linvitekeys", db.requireAuth, db.requireAdmin, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            let out = "";
            if (req.user.role == "mod") {
                const keys = await db.listInviteKeys(req.user.userid);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (key.deleted) {
                        out += `${key.inviteKey} | Created: ${db.unixToDate(key.created).toISOString()} | DELETED : ${db.unixToDate(key.usedDate).toISOString()}<p></p>`;
                        continue;
                    }
                    out += `${key.inviteKey} | Created: ${db.unixToDate(key.created).toISOString()}<p></p>`;
                }
            } else {
                const keys = await db.listInviteKeys();
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (key.deleted) {
                        out += `${key.inviteKey} | Creator: ${key.createdby} | Created: ${db.unixToDate(key.created).toISOString()} | DELETED : ${db.unixToDate(key.usedDate).toISOString()}<p></p>`;
                        continue;
                    }
                    out += `${key.inviteKey} | Creator: ${key.createdby} | Created: ${db.unixToDate(key.created).toISOString()}<p></p>`;
                }
            }
            res.send(out);
        });

        app.post("/v1/admin/setfflag", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const fflag = req.body.fflag;
            let value = req.body.value;
            if (value.toLowerCase() == "false") {
                value = false
            } else if (value.toLowerCase() == "true") {
                value = true
            } else if (parseInt(number)) {
                value = parseInt(number)
            } else if (parseFloat(number)) {
                value = parseFloat(number)
            }
            const platform = req.body.platform;
            if (!platform) {
                const files = fs.readdirSync(path.resolve(__dirname + "/../FFlags"));
                for (const file of files) {
                    if (file.endsWith(".json")) {
                        const fp = path.resolve(__dirname + "/../FFlags/" + file)
                        const data = JSON.parse(fs.readFileSync(fp, "utf8"));
                        data[fflag] = value;
                        fs.writeFileSync(fp, JSON.stringify(data, null, 4));
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
                data[fflag] = value;
                fs.writeFileSync(fp, JSON.stringify(data, null, 4));
                res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/fflags");
            }
        });

        app.post("/v1/admin/setconfig", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const fflag = req.body.fflag;
            let value = req.body.value;
            if (value.toLowerCase() == "false") {
                value = false
            } else if (value.toLowerCase() == "true") {
                value = true
            } else if (parseInt(number)) {
                value = parseInt(number)
            } else if (parseFloat(number)) {
                value = parseFloat(number)
            }
            const bp = path.resolve(__dirname + "/../") + path.sep;
            const fp = path.resolve(bp + "config.json");
            if (!fp.startsWith(bp)) {
                res.status(400).send();
                return;
            }
            if (!fs.existsSync(fp)) {
                res.status(404).send("Configuration File Not Found.");
                return;
            }
            db.log(`User ${req.user.userid} setting ${fflag} to ${value}`);
            const data = JSON.parse(fs.readFileSync(fp, "utf8"));
            data.shared[fflag] = value;
            fs.writeFileSync(fp, JSON.stringify(data, null, 4));
            res.redirect(db.getSiteConfig().shared.ADMIN_AdminPanelRoute + "/config");
        });

        app.post("/v1/admin/rccrunscript", db.requireAuth, db.requireOwner, async (req, res) => {
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
                    return res.status(404).send("[!]: Executing scripts on existing instances is disabled.");
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
                } else {
                    res.send("[ERROR]: An error occured while executing.");
                }
            }
        });

        app.post("/v1/admin/getfflag", db.requireAuth, db.requireOwner, async (req, res) => {
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
            res.send(data[fflag]);
        });

        app.post("/v1/admin/getconfig", db.requireAuth, db.requireOwner, async (req, res) => {
            if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == false) {
                res.status(400).send();
                return;
            }
            const fflag = req.body.fflag;
            const bp = path.resolve(__dirname + "/../") + path.sep;
            const fp = path.resolve(bp + "config.json");
            if (!fp.startsWith(bp)) {
                res.status(400).send();
                return;
            }
            if (!fs.existsSync(fp)) {
                res.status(404).send("Configuration File Not Found.");
                return;
            }
            const data = JSON.parse(fs.readFileSync(fp, "utf8"));
            res.send(data.shared[fflag]);
        });
    }
}
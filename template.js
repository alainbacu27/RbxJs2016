const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const ejs = require("ejs");
const cors = require('cors')
const fileUpload = require('express-fileupload');
var device = require('express-device');
const get_ip = require('ipware')().get_ip;
const favicon = require('serve-favicon')
const app = express();
const {
    constants
} = require('crypto')

const {
    rateLimit
} = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: async (request, response) => {
        const ip = get_ip(request).clientIp;
        if (ip == "127.0.0.1" || ip == "::1") {
            return 9999999;
        } else {
            return 2000; // Limit each IP to 2000 requests per `window` (here, per 2 minutes)
        }
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to API calls only
app.use('/game', apiLimiter)
app.use('/api', apiLimiter)
app.use('/v1', apiLimiter)
app.use('/v1.1', apiLimiter)
app.use('/v2', apiLimiter)
app.use('/v2.0', apiLimiter)
app.use('/v3', apiLimiter)
app.use('/asset', apiLimiter)

const logsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: async (request, response) => {
        const ip = get_ip(request).clientIp;
        if (ip == "127.0.0.1" || ip == "::1"){
            return 9999999;
        }else{
            return 1000; // Limit each IP to 1000 requests per `window` (here, per minute)
        }
	},
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to API calls only
app.use('/www', logsLimiter)
app.use('/studio', logsLimiter)

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: async (request, response) => {
        const ip = get_ip(request).clientIp;
        if (ip == "127.0.0.1" || ip == "::1"){
            return 9999999;
        }else{
            return 15000; // Limit each IP to 15000 requests per `window` (here, per 5 minutes)
        }
	},
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

app.use(favicon(path.resolve(__dirname + "/public/favicon.ico")));

app.use(cookieParser());
app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(morgan('combined'));

app.use(device.capture());

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

let allowAllIps = true;
let allowedIps = [];
const allowedIpsFP = path.resolve(__dirname + "/allowed-ips.txt");

let allowedIps2 = fs.readFileSync(allowedIpsFP).toString().split("\n");
for (let i = 0; i < allowedIps2.length; i++) {
    allowedIps[i] = allowedIps2[i].trim().split("#")[0].trimRight();
}

fs.watchFile(allowedIpsFP, (curr, prev) => {
    allowedIps = [];
    let allowedIps2 = fs.readFileSync(allowedIpsFP).toString().split("\n");
    for (let i = 0; i < allowedIps2.length; i++) {
        allowedIps[i] = allowedIps2[i].trim().split("#")[0].trimRight();
    }
});

app.use((req, res, next) => {
    if (allowAllIps){
        next();
        return;
    }
    const ip = get_ip(req).clientIp;
    if (allowedIps.includes(ip)) {
        next();
    } else {
        res.status(403).send("You are not allowed to access this server.");
    }
});

let domains = [];
const files = fs.readdirSync(__dirname + "/controllers/");
for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.endsWith(".js")) {
        const domain = file.trim().replace(".js", "");
        if (domain == "MAIN") {
            domains.push("http://web.rbx2016.nl");
            domains.push("https://web.rbx2016.nl");
            domains.push("http://www.rbx2016.nl");
            domains.push("https://www.rbx2016.nl");
            domains.push("http://rbx2016.nl");
            domains.push("https://rbx2016.nl");
        } else {
            domains.push("http://" + domain + ".rbx2016.nl");
            domains.push("https://" + domain + ".rbx2016.nl");
        }
    }
}

const corsOptions = {
    origin: domains,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    credentials: true,
    optionsSuccessStatus: 204,
    exposedHeaders: ["RBX-Authentication-Ticket"]
}
app.use(cors(corsOptions))

app.use(function(req, res, next) {
    if (req.path.toLowerCase().startsWith("/error")){
        next();
    }else{
        express.json()(req, res, next);
    }
});
app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

module.exports = {
    app: app,
    start: function (ip, httpPort, httpsEnabled, httpsPort) {
        const server = http.createServer(app);
        server.listen(httpPort, ip);
        console.log("listening to http on port " + httpPort);

        if (httpsEnabled) {
            const server2 = https.createServer({
                key: fs.readFileSync(`${__dirname}/certs/domain.key`, 'utf8'),
                cert: fs.readFileSync(`${__dirname}/certs/domain.crt`, 'utf8'),
                // secureOptions: constants.SSL_OP_ALL | constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
            }, app);
            server2.listen(httpsPort, ip);
            console.log("listening to https on port " + httpsPort)
        }
    }
}
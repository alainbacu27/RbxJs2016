const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/contacts/metadata', (req, res) => {
            res.json({
                "multiGetContactsMaxSize": 200,
                "multiGetContactsCacheTTLinMS": 30000
            });
        });

        app.get('/v1/user/get-tags', (req, res) => {
            res.json([]);
        });
        
        app.post('/v1/user/get-tags', (req, res) => {
            res.json([]);
        });
    }
}
const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/catalog/contents", (req ,res) => {
            const CatalogContext = req.query.CatalogContext;
            const Catagory = req.query.Catagory;
            res.render("library", {})
        });
    }
}
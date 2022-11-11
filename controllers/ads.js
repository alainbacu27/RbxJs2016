const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/sponsored-pages', (req, res) => {
            res.json({
                "data": [
                    /*{
                                        "name": "GucciTown",
                                        "title": "Gucci Town",
                                        "logoImageUrl": "https://images.rbx2016.nl/00b3fce6fa5831184f9ff79aeb6d6953",
                                        "pageType": "Sponsored",
                                        "pagePath": "/sponsored/GucciTown"
                                    }*/
                ]
            });
        });
    }
}
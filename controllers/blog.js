const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/wp-json/wp/v2/posts", (req, res) => {
            const per_page = parseInt(req.query.per_page);
            const context = req.query.context;
            return res.json([{
                "id": 41452,
                "date": "2022-05-18T12:48:21",
                "slug": "working-roblox-meet-justin-park",
                "type": "post",
                "link": "https:\/\/blog.roblox.com\/2022\/05\/working-roblox-meet-justin-park\/",
                "title": {
                    "rendered": "Working at Roblox: Meet Justin Park"
                },
                "excerpt": {
                    "rendered": "<p>Justin Park is a Software Engineer on the Avatar Marketplace team. Get a glimpse into his work on bringing layered clothing to the Avatar Shop.<\/p>\n",
                    "protected": false
                },
                "author": 49,
                "featured_media": 41453,
                "_links": {
                    "self": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts\/41452"
                    }],
                    "collection": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts"
                    }],
                    "about": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/types\/post"
                    }],
                    "author": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/users\/49"
                    }],
                    "replies": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/comments?post=41452"
                    }],
                    "version-history": [{
                        "count": 0,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts\/41452\/revisions"
                    }],
                    "wp:featuredmedia": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/media\/41453"
                    }],
                    "wp:attachment": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/media?parent=41452"
                    }],
                    "wp:term": [{
                        "taxonomy": "category",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/categories?post=41452"
                    }, {
                        "taxonomy": "post_tag",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/tags?post=41452"
                    }, {
                        "taxonomy": "yst_prominent_words",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/yst_prominent_words?post=41452"
                    }],
                    "curies": [{
                        "name": "wp",
                        "href": "https:\/\/api.w.org\/{rel}",
                        "templated": true
                    }]
                }
            }, {
                "id": 41161,
                "date": "2022-05-02T12:35:06",
                "slug": "future-work-roblox",
                "type": "post",
                "link": "https:\/\/blog.roblox.com\/2022\/05\/future-work-roblox\/",
                "title": {
                    "rendered": "The Future of Work at Roblox"
                },
                "excerpt": {
                    "rendered": "<p>As we look forward to Robloxians returning to the office this week, our approach gives individual teams and leaders the flexibility to decide how they work best given their goals.<\/p>\n",
                    "protected": false
                },
                "author": 47,
                "featured_media": 40649,
                "_links": {
                    "self": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts\/41161"
                    }],
                    "collection": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts"
                    }],
                    "about": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/types\/post"
                    }],
                    "author": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/users\/47"
                    }],
                    "replies": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/comments?post=41161"
                    }],
                    "version-history": [{
                        "count": 0,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts\/41161\/revisions"
                    }],
                    "wp:featuredmedia": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/media\/40649"
                    }],
                    "wp:attachment": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/media?parent=41161"
                    }],
                    "wp:term": [{
                        "taxonomy": "category",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/categories?post=41161"
                    }, {
                        "taxonomy": "post_tag",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/tags?post=41161"
                    }, {
                        "taxonomy": "yst_prominent_words",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/yst_prominent_words?post=41161"
                    }],
                    "curies": [{
                        "name": "wp",
                        "href": "https:\/\/api.w.org\/{rel}",
                        "templated": true
                    }]
                }
            }, {
                "id": 41184,
                "date": "2022-04-28T10:34:25",
                "slug": "delivering-large-scale-platform-reliability",
                "type": "post",
                "link": "https:\/\/blog.roblox.com\/2022\/04\/delivering-large-scale-platform-reliability\/",
                "title": {
                    "rendered": "Delivering Large-Scale Platform Reliability"
                },
                "excerpt": {
                    "rendered": "<p>Showcasing a quality-oriented process for achieving higher reliability in microservices acting together to improve the platform.<\/p>\n",
                    "protected": false
                },
                "author": 47,
                "featured_media": 41185,
                "_links": {
                    "self": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts\/41184"
                    }],
                    "collection": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts"
                    }],
                    "about": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/types\/post"
                    }],
                    "author": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/users\/47"
                    }],
                    "replies": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/comments?post=41184"
                    }],
                    "version-history": [{
                        "count": 0,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/posts\/41184\/revisions"
                    }],
                    "wp:featuredmedia": [{
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/media\/41185"
                    }],
                    "wp:attachment": [{
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/media?parent=41184"
                    }],
                    "wp:term": [{
                        "taxonomy": "category",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/categories?post=41184"
                    }, {
                        "taxonomy": "post_tag",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/tags?post=41184"
                    }, {
                        "taxonomy": "yst_prominent_words",
                        "embeddable": true,
                        "href": "https:\/\/blog.roblox.com\/wp-json\/wp\/v2\/yst_prominent_words?post=41184"
                    }],
                    "curies": [{
                        "name": "wp",
                        "href": "https:\/\/api.w.org\/{rel}",
                        "templated": true
                    }]
                }
            }]);
        });
    }
}
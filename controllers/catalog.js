const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const {
    app
} = require("../template");

module.exports = {
    init: (app, db) => {
        app.get("/v1/catalog/metadata", (req, res) => {
            res.json({
                "numberOfCatalogItemsToDisplayOnSplash": 25,
                "numberOfCatalogItemsToDisplayOnSplashOnPhone": 15,
                "isCatalogSortsFromApiEnabled": false,
                "is3dInEachItemCardAbTestingEnabled": false,
                "is3dInEachItemCardEnabled": false,
                "timeoutOn3dThumbnailRequestInMs": 0,
                "isPremiumPriceOnItemTilesEnabled": false,
                "isPremiumIconOnItemTilesEnabled": true,
                "isPremiumSortEnabled": true,
                "isJustinUiChangesEnabled": true,
                "isCategoryReorgEnabled": true,
                "LCEnabledInEditorAndCatalog": true,
                "isAutocompleteEnabled": true,
                "autocompleteOmniSearchNumToDisplay": 5,
                "autocompleteAvatarSearchNumToDisplay": 5,
                "isCatalogAdsRowOnRecommendedPageEnabled": false
            });
        });

        app.get("/v1/search/navigation-menu-items", (req, res) => {
            res.json({
                "defaultGearSubcategory": 5,
                "defaultCategory": 0,
                "defaultCategoryIdForRecommendedSearch": 0,
                "defaultCreator": 0,
                "defaultCurrency": 0,
                "defaultSortType": 0,
                "defaultSortAggregation": 5,
                "categoriesWithCreator": [1, 3, 13],
                "robloxUserId": 1,
                "robloxUserName": "Roblox",
                "gearSubcategory": 5,
                "allCategories": 1,
                "freeFilter": 5,
                "customRobuxFilter": 3,
                "robuxFilter": 1,
                "categories": [{
                    "category": "All",
                    "categoryId": 1,
                    "name": "All Categories",
                    "orderIndex": 1,
                    "subcategories": [],
                    "isSearchable": true
                }, {
                    "category": "Featured",
                    "categoryId": 0,
                    "name": "Featured",
                    "orderIndex": 2,
                    "subcategories": [{
                        "subcategory": "Featured",
                        "subcategoryId": 0,
                        "name": "All Featured Items",
                        "shortName": "All"
                    }, {
                        "subcategory": "Accessories",
                        "subcategoryId": 19,
                        "name": "Featured Accessories",
                        "shortName": "Accessories"
                    }, {
                        "subcategory": "AnimationBundles",
                        "subcategoryId": 38,
                        "name": "Featured Animations",
                        "shortName": "Animations"
                    }, {
                        "subcategory": "Faces",
                        "subcategoryId": 10,
                        "name": "Featured Faces",
                        "shortName": "Faces"
                    }, {
                        "subcategory": "Gear",
                        "subcategoryId": 5,
                        "name": "Featured Gear",
                        "shortName": "Gear"
                    }, {
                        "subcategory": "AllBundles",
                        "subcategoryId": 53,
                        "name": "Featured Bundles",
                        "shortName": "Bundles"
                    }, {
                        "subcategory": "EmoteAnimations",
                        "subcategoryId": 39,
                        "name": "Featured Emotes",
                        "shortName": "Emotes"
                    }],
                    "isSearchable": true
                }, {
                    "category": "CommunityCreations",
                    "categoryId": 13,
                    "name": " Community Creations",
                    "orderIndex": 3,
                    "subcategories": [{
                        "subcategory": "CommunityCreations",
                        "subcategoryId": 40,
                        "name": "All Creations",
                        "shortName": null
                    }, {
                        "subcategory": "HeadAccessories",
                        "subcategoryId": 54,
                        "name": "Head",
                        "shortName": null
                    }, {
                        "subcategory": "HairAccessories",
                        "subcategoryId": 20,
                        "name": "Hair",
                        "shortName": null
                    }, {
                        "subcategory": "FaceAccessories",
                        "subcategoryId": 21,
                        "name": "Face",
                        "shortName": null
                    }, {
                        "subcategory": "NeckAccessories",
                        "subcategoryId": 22,
                        "name": "Neck",
                        "shortName": null
                    }, {
                        "subcategory": "ShoulderAccessories",
                        "subcategoryId": 23,
                        "name": "Shoulder",
                        "shortName": null
                    }, {
                        "subcategory": "FrontAccessories",
                        "subcategoryId": 24,
                        "name": "Front",
                        "shortName": null
                    }, {
                        "subcategory": "BackAccessories",
                        "subcategoryId": 25,
                        "name": "Back",
                        "shortName": null
                    }, {
                        "subcategory": "WaistAccessories",
                        "subcategoryId": 26,
                        "name": "Waist",
                        "shortName": null
                    }],
                    "isSearchable": true
                }, {
                    "category": "Premium",
                    "categoryId": 14,
                    "name": "Premium",
                    "orderIndex": 4,
                    "subcategories": [{
                        "subcategory": "Premium",
                        "subcategoryId": 50,
                        "name": "All Premium Items",
                        "shortName": null
                    }, {
                        "subcategory": "HeadAccessories",
                        "subcategoryId": 54,
                        "name": "Head",
                        "shortName": null
                    }, {
                        "subcategory": "HairAccessories",
                        "subcategoryId": 20,
                        "name": "Hair",
                        "shortName": null
                    }, {
                        "subcategory": "FaceAccessories",
                        "subcategoryId": 21,
                        "name": "Face",
                        "shortName": null
                    }, {
                        "subcategory": "NeckAccessories",
                        "subcategoryId": 22,
                        "name": "Neck",
                        "shortName": null
                    }, {
                        "subcategory": "ShoulderAccessories",
                        "subcategoryId": 23,
                        "name": "Shoulder",
                        "shortName": null
                    }, {
                        "subcategory": "FrontAccessories",
                        "subcategoryId": 24,
                        "name": "Front",
                        "shortName": null
                    }, {
                        "subcategory": "BackAccessories",
                        "subcategoryId": 25,
                        "name": "Back",
                        "shortName": null
                    }, {
                        "subcategory": "WaistAccessories",
                        "subcategoryId": 26,
                        "name": "Waist",
                        "shortName": null
                    }],
                    "isSearchable": true
                }, {
                    "category": "Collectibles",
                    "categoryId": 2,
                    "name": "Collectibles",
                    "orderIndex": 5,
                    "subcategories": [{
                        "subcategory": "Collectibles",
                        "subcategoryId": 2,
                        "name": "All Collectibles",
                        "shortName": "All"
                    }, {
                        "subcategory": "Accessories",
                        "subcategoryId": 19,
                        "name": "Collectible Accessories",
                        "shortName": "Accessories"
                    }, {
                        "subcategory": "Faces",
                        "subcategoryId": 10,
                        "name": "Collectible Faces",
                        "shortName": "Faces"
                    }, {
                        "subcategory": "Gear",
                        "subcategoryId": 5,
                        "name": "Collectible Gear",
                        "shortName": "Gear"
                    }],
                    "isSearchable": true
                }, {
                    "category": "Characters",
                    "categoryId": 17,
                    "name": "Characters",
                    "orderIndex": 6,
                    "subcategories": [],
                    "isSearchable": true
                }, {
                    "category": "Clothing",
                    "categoryId": 3,
                    "name": "Clothing",
                    "orderIndex": 7,
                    "subcategories": [{
                        "subcategory": "Clothing",
                        "subcategoryId": 3,
                        "name": "All Clothing",
                        "shortName": "All"
                    }, {
                        "subcategory": "TShirtAccessories",
                        "subcategoryId": 58,
                        "name": "T-Shirts",
                        "shortName": null
                    }, {
                        "subcategory": "ShirtAccessories",
                        "subcategoryId": 59,
                        "name": "Shirts",
                        "shortName": null
                    }, {
                        "subcategory": "SweaterAccessories",
                        "subcategoryId": 62,
                        "name": "Sweaters",
                        "shortName": null
                    }, {
                        "subcategory": "JacketAccessories",
                        "subcategoryId": 61,
                        "name": "Jackets",
                        "shortName": null
                    }, {
                        "subcategory": "PantsAccessories",
                        "subcategoryId": 60,
                        "name": "Pants",
                        "shortName": null
                    }, {
                        "subcategory": "ShortsAccessories",
                        "subcategoryId": 63,
                        "name": "Shorts",
                        "shortName": null
                    }, {
                        "subcategory": "DressSkirtAccessories",
                        "subcategoryId": 65,
                        "name": "Dresses & Skirts",
                        "shortName": null
                    }, {
                        "subcategory": "ShoesBundles",
                        "subcategoryId": 64,
                        "name": "Shoes",
                        "shortName": null
                    }, {
                        "subcategory": "ClassicShirts",
                        "subcategoryId": 56,
                        "name": "Classic Shirts",
                        "shortName": null
                    }, {
                        "subcategory": "ClassicTShirts",
                        "subcategoryId": 55,
                        "name": "Classic T-Shirts",
                        "shortName": null
                    }, {
                        "subcategory": "ClassicPants",
                        "subcategoryId": 57,
                        "name": "Classic Pants",
                        "shortName": null
                    }],
                    "isSearchable": true
                }, {
                    "category": "Accessories",
                    "categoryId": 11,
                    "name": "Accessories",
                    "orderIndex": 8,
                    "subcategories": [{
                        "subcategory": "Accessories",
                        "subcategoryId": 19,
                        "name": "All Accessories",
                        "shortName": "All"
                    }, {
                        "subcategory": "HeadAccessories",
                        "subcategoryId": 54,
                        "name": "Head",
                        "shortName": null
                    }, {
                        "subcategory": "FaceAccessories",
                        "subcategoryId": 21,
                        "name": "Face",
                        "shortName": null
                    }, {
                        "subcategory": "NeckAccessories",
                        "subcategoryId": 22,
                        "name": "Neck",
                        "shortName": null
                    }, {
                        "subcategory": "ShoulderAccessories",
                        "subcategoryId": 23,
                        "name": "Shoulder",
                        "shortName": null
                    }, {
                        "subcategory": "FrontAccessories",
                        "subcategoryId": 24,
                        "name": "Front",
                        "shortName": null
                    }, {
                        "subcategory": "BackAccessories",
                        "subcategoryId": 25,
                        "name": "Back",
                        "shortName": null
                    }, {
                        "subcategory": "WaistAccessories",
                        "subcategoryId": 26,
                        "name": "Waist",
                        "shortName": null
                    }, {
                        "subcategory": "Gear",
                        "subcategoryId": 5,
                        "name": "Gear",
                        "shortName": null
                    }],
                    "isSearchable": true
                }, {
                    "category": "BodyParts",
                    "categoryId": 4,
                    "name": "Body Parts",
                    "orderIndex": 9,
                    "subcategories": [{
                        "subcategory": "BodyParts",
                        "subcategoryId": 4,
                        "name": "All Body Parts",
                        "shortName": "All"
                    }, {
                        "subcategory": "HairAccessories",
                        "subcategoryId": 20,
                        "name": "Hair",
                        "shortName": null
                    }, {
                        "subcategory": "Heads",
                        "subcategoryId": 15,
                        "name": "Heads",
                        "shortName": null
                    }, {
                        "subcategory": "Faces",
                        "subcategoryId": 10,
                        "name": "Faces",
                        "shortName": null
                    }],
                    "isSearchable": true
                }, {
                    "category": "AvatarAnimations",
                    "categoryId": 12,
                    "name": "Avatar Animations",
                    "orderIndex": 10,
                    "subcategories": [{
                        "subcategory": "AvatarAnimations",
                        "subcategoryId": 27,
                        "name": "All Animations",
                        "shortName": null
                    }, {
                        "subcategory": "AnimationBundles",
                        "subcategoryId": 38,
                        "name": "Bundles",
                        "shortName": null
                    }, {
                        "subcategory": "EmoteAnimations",
                        "subcategoryId": 39,
                        "name": "Emotes",
                        "shortName": null
                    }],
                    "isSearchable": true
                }],
                "genres": [{
                    "genre": 13,
                    "name": "Building",
                    "isSelected": false
                }, {
                    "genre": 5,
                    "name": "Horror",
                    "isSelected": false
                }, {
                    "genre": 1,
                    "name": "Town and City",
                    "isSelected": false
                }, {
                    "genre": 11,
                    "name": "Military",
                    "isSelected": false
                }, {
                    "genre": 9,
                    "name": "Comedy",
                    "isSelected": false
                }, {
                    "genre": 2,
                    "name": "Medieval",
                    "isSelected": false
                }, {
                    "genre": 7,
                    "name": "Adventure",
                    "isSelected": false
                }, {
                    "genre": 3,
                    "name": "Sci-Fi",
                    "isSelected": false
                }, {
                    "genre": 6,
                    "name": "Naval",
                    "isSelected": false
                }, {
                    "genre": 14,
                    "name": "FPS",
                    "isSelected": false
                }, {
                    "genre": 15,
                    "name": "RPG",
                    "isSelected": false
                }, {
                    "genre": 8,
                    "name": "Sports",
                    "isSelected": false
                }, {
                    "genre": 4,
                    "name": "Fighting",
                    "isSelected": false
                }, {
                    "genre": 10,
                    "name": "Western",
                    "isSelected": false
                }],
                "sortMenu": {
                    "sortOptions": [{
                        "sortType": 0,
                        "sortOrder": 2,
                        "name": "Relevance",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": false
                    }, {
                        "sortType": 1,
                        "sortOrder": 2,
                        "name": "Most Favorited",
                        "isSelected": false,
                        "hasSubMenu": true,
                        "isPriceRelated": false
                    }, {
                        "sortType": 2,
                        "sortOrder": 2,
                        "name": "Bestselling",
                        "isSelected": false,
                        "hasSubMenu": true,
                        "isPriceRelated": false
                    }, {
                        "sortType": 3,
                        "sortOrder": 2,
                        "name": "Recently Updated",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": false
                    }, {
                        "sortType": 5,
                        "sortOrder": 2,
                        "name": "Price (High to Low)",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": true
                    }, {
                        "sortType": 4,
                        "sortOrder": 1,
                        "name": "Price (Low to High)",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": true
                    }],
                    "sortAggregations": [{
                        "sortAggregation": 5,
                        "name": "All Time",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": false
                    }, {
                        "sortAggregation": 3,
                        "name": "Past Week",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": false
                    }, {
                        "sortAggregation": 1,
                        "name": "Past Day",
                        "isSelected": false,
                        "hasSubMenu": false,
                        "isPriceRelated": false
                    }]
                },
                "creatorFilters": [{
                    "userId": 0,
                    "name": "All Creators",
                    "isSelected": false
                }, {
                    "userId": 1,
                    "name": "Roblox",
                    "isSelected": false
                }],
                "priceFilters": [{
                    "currencyType": 0,
                    "name": "Any Price",
                    "excludePriceSorts": false
                }, {
                    "currencyType": 3,
                    "name": "R$?",
                    "excludePriceSorts": false
                }, {
                    "currencyType": 5,
                    "name": "Free",
                    "excludePriceSorts": true
                }]
            });
        });

        app.get("/v1/search/items", async (req, res) => {
            const catagory = req.query.category;
            const limit = parseInt(req.query.limit) || 60;
            const cursor = parseInt(req.query.cursor) || 0;
            const keyword = req.query.keyword;
            let data = []
            let catalogItems = null
            if (keyword){
                catalogItems = await db.getCatalogItems(keyword)
            }else{
                catalogItems = await db.getCatalogItems2(cursor, limit);
            }
            if (!catalogItems) {
                res.status(400).json({});
                return;
            }
            for (let i = 0; i < catalogItems.length; i++) {
                if (i > limit)
                    break;
                const item = catalogItems[i];
                data.push({
                    "id": item.itemid,
                    "itemType": "Asset" // Bundle
                })
            }
            res.json({
                "keyword": null,
                "previousPageCursor": cursor ? cursor - limit : null,
                "nextPageCursor": catalogItems.length > 0 ? catalogItems[catalogItems.length - 1].itemid + 1 : null,
                "data": data
            });
        });

        app.post("/v1/catalog/items/details", async (req, res) => {
            const items = req.body.items || [];
            let data = [];
            for (let i = 0; i < items.length; i++) {
                const item0 = items[i];
                const item = await db.getCatalogItem(item0.id);
                if (!item) {
                    continue;
                }
                const itemcreator = await db.getUser(item.itemcreatorid);
                data.push({
                    "id": item0.id,
                    "itemType": item0.itemType,
                    "assetType": item.itemtype,
                    "name": item.itemname,
                    "description": item.itemdescription,
                    "productId": item.itemid,
                    "genres": [item.itemgenre],
                    "itemStatus": [],
                    "itemRestrictions": [],
                    "creatorType": "User",
                    "creatorTargetId": itemcreator.userid,
                    "creatorName": itemcreator.username,
                    "price": item.itemprice,
                    "priceStatus": item.itempricestatus,
                    "favoriteCount": item.itemfavorites,
                    "offSaleDeadline": item.itemoffsafedeadline
                })
            }
            res.json({
                "data": data
            });
        });

        app.get("/v1/asset-to-category", (req, res) => {
            res.json({
                "8": 11,
                "41": 11,
                "42": 11,
                "43": 11,
                "44": 11,
                "45": 11,
                "46": 11,
                "47": 11,
                "19": 11,
                "53": 12,
                "55": 12,
                "50": 12,
                "52": 12,
                "51": 12,
                "54": 12,
                "48": 12,
                "61": 12,
                "18": 4,
                "17": 4,
                "12": 3,
                "11": 3,
                "2": 3,
                "64": 3,
                "65": 3,
                "66": 3,
                "67": 3,
                "68": 3,
                "69": 3,
                "70": 3,
                "71": 3,
                "72": 3,
                "3": 9,
                "62": 14,
                "13": 8,
                "10": 6,
                "40": 10,
                "38": 7
            });
        });

        app.get("/v1/asset-to-subcategory", (req, res) => {
            res.json({
                "8": 54,
                "41": 20,
                "42": 21,
                "43": 22,
                "44": 23,
                "45": 24,
                "46": 25,
                "47": 26,
                "19": 5,
                "53": 33,
                "55": 35,
                "50": 30,
                "52": 32,
                "51": 31,
                "54": 34,
                "48": 28,
                "61": 39,
                "18": 10,
                "17": 15,
                "12": 57,
                "11": 56,
                "2": 55,
                "64": 58,
                "65": 59,
                "66": 60,
                "67": 61,
                "68": 62,
                "69": 63,
                "70": 64,
                "71": 64,
                "72": 65,
                "3": 16,
                "62": 41,
                "13": 8,
                "10": 6,
                "40": 18,
                "38": 7
            });
        });
        app.get("/v1/categories", (req, res) => {
            res.json({
                "Featured": 0,
                "All": 1,
                "Collectibles": 2,
                "Clothing": 3,
                "BodyParts": 4,
                "Gear": 5,
                "Models": 6,
                "Plugins": 7,
                "Decals": 8,
                "Audio": 9,
                "Meshes": 10,
                "Accessories": 11,
                "AvatarAnimations": 12,
                "CommunityCreations": 13,
                "Video": 14,
                "Recommended": 15,
                "LayeredClothing": 16,
                "Characters": 17
            });
        });
        app.get("/v1/subcategories", (req, res) => {
            res.json({
                "Featured": 0,
                "All": 1,
                "Collectibles": 2,
                "Clothing": 3,
                "BodyParts": 4,
                "Gear": 5,
                "Models": 6,
                "Plugins": 7,
                "Decals": 8,
                "Hats": 9,
                "Faces": 10,
                "Packages": 11,
                "Shirts": 12,
                "Tshirts": 13,
                "Pants": 14,
                "Heads": 15,
                "Audio": 16,
                "RobloxCreated": 17,
                "Meshes": 18,
                "Accessories": 19,
                "HairAccessories": 20,
                "FaceAccessories": 21,
                "NeckAccessories": 22,
                "ShoulderAccessories": 23,
                "FrontAccessories": 24,
                "BackAccessories": 25,
                "WaistAccessories": 26,
                "AvatarAnimations": 27,
                "ClimbAnimations": 28,
                "FallAnimations": 30,
                "IdleAnimations": 31,
                "JumpAnimations": 32,
                "RunAnimations": 33,
                "SwimAnimations": 34,
                "WalkAnimations": 35,
                "AnimationPackage": 36,
                "BodyPartsBundles": 37,
                "AnimationBundles": 38,
                "EmoteAnimations": 39,
                "CommunityCreations": 40,
                "Video": 41,
                "Recommended": 51,
                "LayeredClothing": 52,
                "AllBundles": 53,
                "HeadAccessories": 54,
                "ClassicTShirts": 55,
                "ClassicShirts": 56,
                "ClassicPants": 57,
                "TShirtAccessories": 58,
                "ShirtAccessories": 59,
                "PantsAccessories": 60,
                "JacketAccessories": 61,
                "SweaterAccessories": 62,
                "ShortsAccessories": 63,
                "ShoesBundles": 64,
                "DressSkirtAccessories": 65
            });
        });

        app.get("/v1/users/1/bundles", (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            const nextPageCursor = parseInt(req.query.nextPageCursor) || 0;
            const sortOrder = req.query.sortOrder || "Ascending";
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": [
                    /*
                                {
                                        "id": 857,
                                        "name": "Captain Rampage: Gold",
                                        "bundleType": "BodyParts",
                                        "creator": {
                                            "id": 1,
                                            "name": "Roblox",
                                            "type": "User"
                                        }
                                    }, {
                                        "name": "Climb",
                                        "displayName": "Climb",
                                        "filter": null,
                                        "id": 48,
                                        "type": "AssetType",
                                        "categoryType": "AvatarAnimations"
                                    }
                                */
                ]
            });
        });

        app.get("/v1/recommendations/metadata", (req, res) => {
            res.json({
                "numOfRecommendationsDisplayed": 7,
                "numOfRecommendationsRetrieved": 50,
                "subject": "assets",
                "isV2EndpointEnabled": true
            });
        });

        app.get("/v2/recommendations/assets", (req, res) => {
            const assetId = req.query.assetId;
            const typeId = req.query.TypeId;
            const numItems = req.query.numItems;
            res.json({
                "data": [ /*1,2,3,4,5*/ ]
            });
        });
    }
}
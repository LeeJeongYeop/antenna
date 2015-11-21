/**
 * Created by kingw on 2015-11-22.
 */
var bookmarkModel = require('../models/bookmarkModel');
var _cryptor = require('../my_conf');
var logger = require('../logger');
var async = require('async');

/*******************
 *  Bookmark Add
 ********************/
exports.bkAdd = function(req, res){
    if(!req.headers.uid || !req.body.freq){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        async.waterfall([
                function(callback){
                    bookmarkModel.freqToIdx(req.body.freq, function(err, bookmark){
                        if(err){
                            callback(err, "Freq to Idx Error");
                        }else{
                            callback(null, bookmark);
                        }
                    });
                },
                function(bookmark, callback){
                    var data = {
                        "bookmark_my": _cryptor.decrypted(req.headers.uid),
                        "bookmark_friend": bookmark
                    };
                    bookmarkModel.bkAdd(data, function(err, msg){
                        if(err){
                            callback(err, msg);
                        }else{
                            callback(null, msg);
                        }
                    });
                }
            ],
            function(err, msg){
                var status = true;
                if(err){  // 에러로 status 변경
                    status = false;
                }
                return res.json({
                    "status": status,
                    "message": msg
                });
            }
        );  // waterfall
    }
};
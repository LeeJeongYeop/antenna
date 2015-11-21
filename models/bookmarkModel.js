/**
 * Created by kingw on 2015-11-22.
 */
var mysql = require('mysql');
var db_config = require('./db_config');
var pool = mysql.createPool(db_config);
var logger = require('../logger');
var async = require('async');

// freq to idx
exports.freqToIdx = function(freq, done){
    var sql = "SELECT user_idx FROM atn_user WHERE user_freq = ?";
    pool.query(sql, freq, function(err, rows){
        if(err){
            logger.error("Freq to Idx Error: ", err);
            done(err);
        }else{
            if(rows.length == 0){
                logger.error("Freq to Idx Error: ", err);
                done(err);
            }else{
                done(null, rows[0].user_idx);
            }
        }
    });
};

/*******************
 *  Bookmark Add
 ********************/
exports.bkAdd = function(data, done){
    async.waterfall([
            function(callback){  // already bookmark check
                var sql = "SELECT bookmark_idx FROM atn_bookmark WHERE bookmark_my = ? AND bookmark_friend = ?";
                pool.query(sql, [data.bookmark_my, data.bookmark_friend], function(err, rows){
                    if(err){
                        logger.error("Bookmark Add Error waterfall_1: ", err);
                        callback(err, "Bookmark Add Error");
                    }else{
                        if(rows.length == 0){
                            callback(null);
                        }else{
                            var my_err = "Already bookmark";
                            callback(my_err, "Already bookmark");  // my_error
                        }
                    }
                });
            },
            function(callback){
                var sql = "INSERT INTO atn_bookmark SET ?";
                pool.query(sql, data, function(err, rows){
                    if(err){
                        logger.error("Bookmark Add Error waterfall_2: ", err);
                        callback(err, "Bookmark Add Error");
                    }else{
                        if(rows.affectedRows == 1){
                            callback(null, "success");
                        }else{
                            var my_err = "Bookmark Add DB Error";
                            callback(my_err, "Bookmark Add DB Error");  // my_error
                        }
                    }
                });
            }
        ],
        function(err, msg){
            if(err){
                done(err, msg);
            }else{
                done(null, msg);
            }
        }
    );  // waterfall
};
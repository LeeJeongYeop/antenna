/**
 * Created by kingw on 2015-10-31.
 */
var mysql = require('mysql');
var db_config = require('./db_config');
var pool = mysql.createPool(db_config);
var logger = require('../logger');
var async = require('async');

/*******************
 *  Estimate Song Send
 ********************/
exports.estiSong = function(done){
    async.waterfall([
            function(callback){
                var sql =
                    "SELECT DISTINCT(song_idx) song_idx, song_song, song_video, song_comment " +
                    "FROM atn_song " +
                    "ORDER BY RAND() LIMIT 10";  // 10곡
                pool.query(sql, function(err, rows){
                    if(err){
                        logger.error("Estimate Song Send waterfall_1");
                        callback(err);
                    }else{
                        if(rows.length == 0){
                            logger.error("Estimate Song Send waterfall_2");
                            done(false, "Estimate Song Send Error");  // done callback
                        }else{
                            callback(null, rows);
                        }
                    }
                });
            }
        ],
        function(err, song){
            if(err){
                logger.error("Error:", err);
                done(false, "Estimate Song Send Error");
            }else{
                done(true, "success", song);
            }
        }
    );  // waterfall
};
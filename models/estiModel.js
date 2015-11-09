/**
 * Created by kingw on 2015-10-31.
 */
var mysql = require('mysql');
var db_config = require('./db_config');
var pool = mysql.createPool(db_config);
var logger = require('../logger');
var async = require('async');

/*******************
 *  Estimate Song List
 ********************/
exports.estiSong = function(done){
    var sql =
        "SELECT DISTINCT(song_idx) song_idx, song_song, song_video, song_comment " +
        "FROM atn_song " +
        "ORDER BY RAND() LIMIT 10";  // 10곡
    pool.query(sql, function(err, rows){
        if(err){
            logger.error("Estimate Song Send waterfall_1: ", err);
            done(false, "Estimate Song Send Error");
        }else{
            if(rows.length == 0){
                logger.error("Estimate Song Send waterfall_2: no data");
                done(false, "Estimate Song Send Error");  // done callback
            }else{
                done(true, "success", rows);
            }
        }
    });
};

/*******************
 *  Estimate Song Result
 ********************/
exports.estiResultFirst = function(data, done){
    pool.getConnection(function(err, conn){
        if(err){
            logger.error("Estimate Result First getConnection error:", err);
            done(false, "Estimate Result First getConnection error");
        }else{
            conn.beginTransaction(function(err){
                if(err){
                    logger.error("Estimate Result First beginTransaction error:", err);
                    done(false, "Estimate Result First beginTransaction error");
                    conn.release();
                }else{
                    async.waterfall([
                            function(callback){
                                var sql = "INSERT INTO atn_user() VALUE ()";
                                conn.query(sql, function(err, rows){
                                    if(err){
                                        logger.error("Estimate Result First waterfall_1:", err);
                                        callback(err);
                                    }else{
                                        if(rows.length == 0){
                                            logger.error("Estimate Result First waterfall_2: no data");
                                            conn.rollback(function(){
                                                done(false, "Estimate Result First DB Error");  // error done callback
                                                conn.release();
                                            });
                                        }else{
                                            logger.info("rows.insertId:", rows.insertId);
                                            callback(null, rows.insertId);
                                        }
                                    }
                                });
                            },
                            function(user_idx, callback){
                                data.esti_user = user_idx;  // 객체에 esti_user 추가
                                var sql = "INSERT INTO atn_esti SET ?";
                                conn.query(sql, data, function(err, rows){
                                    if(err){
                                        logger.error("Estimate Result First waterfall_3:", err);
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows == 1){
                                            callback(null, user_idx);
                                        }else{
                                            conn.rollback(function(){
                                                logger.error("Estimate Result First waterfall_4");
                                                done(false, "Estimate Result First DB Error");  // error done callback
                                                conn.release();
                                            });
                                        }
                                    }
                                });
                            }
                        ],
                        function(err, user_idx){
                            if(err){
                                conn.rollback(function(){
                                    done(false, "Estimate Result First DB Error");  // error
                                    conn.release();
                                });
                            }else{
                                conn.commit(function(err){
                                    if(err){
                                        logger.error("Estimate Result First Commit Error:", err);
                                        done(false, "Estimate Result First Commit Error");  // error
                                        conn.release();
                                    }else{
                                        done(true, "success", user_idx);  // success
                                        conn.release();
                                    }
                                });
                            }
                        }
                    );  // waterfall
                }
            });  // beginTransaction
        }
    });
};

exports.estiResult = function(data, done){
    var sql = "INSERT INTO atn_esti SET ?";
    pool.query(sql, data, function(err, rows){
        if(err){
            logger.error("Estimate Result Error_1:", err);
            done(false, "Estimate Result Error");
        }else{
            if(rows.affectedRows != 1){
                logger.error("Estimate Result Error_2");
                done(false, "Estimate Result Error");
            }else{
                done(true, "success");
            }
        }
    });
};
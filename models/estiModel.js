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
exports.estiSongList = function(done){
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
exports.estiResultSongFirst = function(data, done){
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

exports.estiResultSong = function(data, done){
    async.waterfall([
            function(callback){
                var sql = "SELECT * FROM atn_esti WHERE esti_user=? AND esti_song=?";
                pool.query(sql, [data.esti_user, data.esti_song], function(err, rows){
                    if(err){
                        logger.error("Estimate Result Waterfall Error_1:", err);
                        callback(err);
                    }else{
                        callback(null, rows);
                    }
                });
            },
            function(flag, callback){
                logger.info("flag:",flag);
                if(flag.length == 0){  // 평가하지 않은 곡
                    var insert_sql = "INSERT INTO atn_esti SET ?";
                    pool.query(insert_sql, data, function(err, rows){
                        if(err){
                            logger.error("Estimate Result Waterfall Error_2:", err);
                            callback(err);
                        }else{
                            if(rows.affectedRows != 1){
                                logger.error("Estimate Result Waterfall Error_3");
                                done(false, "Estimate Result DB Error");  // callback 없이 done
                            }else{
                                callback(null);
                            }
                        }
                    });
                }else{  // 이미 평가한곡
                    var update_sql = "UPDATE atn_esti SET esti_esti=? WHERE esti_user=?  AND esti_song=?";
                    pool.query(update_sql, [data.esti_esti, data.esti_user, data.esti_song], function(err, rows){
                        if(err){
                            logger.error("Estimate Result Waterfall Error_4:", err);
                            callback(err);
                        }else{
                            if(rows.affectedRows != 1){
                                logger.error("Estimate Result Waterfall Error_5");
                                done(false, "Estimate Result DB Error");  // callback 없이 done
                            }else{
                                callback(null);
                            }
                        }
                    });
                }
            }
        ],
        function(err){
            if(err){
                done(false, "Estimate Result Error");
            }else{
                done(true, "success");
            }
        }
    );
};

/*******************
 *  Estimate Match
 ********************/
exports.estimate = function(uid, done){
    var sql = "SELECT esti_song, esti_esti FROM atn_esti WHERE esti_user = ?";
    pool.query(sql, uid, function(err, rows){
        if(err){
            logger.error("Estimate error:", err);
            done(err);
        }else{
            if(rows.length == 0){
                logger.error("No Estimate Data");
                done("No Estimate Data");  // my error code
            }else{
                done(null, rows);
            }
        }
    });
};
exports.otherList = function(done){
    var sql = "SELECT user_idx, user_freq FROM atn_user WHERE user_freq IS NOT NULL";
    pool.query(sql, function(err, rows){
        if(err){
            logger.error("Other List error:", err);
            done(err);
        }else{
            if(rows.length == 0){
                logger.error("Other List No user");
                done("Other List No user");  // my error code
            }else{
                done(null, rows);
            }
        }
    });
};
exports.matchInsert = function(uid, other_idx, data, done){
    pool.getConnection(function(err, conn){
        if(err){
            logger.error("Match Insert getConnection error:", err);
            done(false, "Match Insert getConnection error");
        }else{
            conn.beginTransaction(function(err){
                if(err){
                    logger.error("Match Insert beginTransaction error:", err);
                    done(false, "Match Insert beginTransaction error");
                    conn.release();
                }else{
                    async.waterfall([
                            function(callback){
                                var sql = "Update atn_user SET user_partner=? WHERE user_idx=?";
                                conn.query(sql, [other_idx, uid], function(err, rows){
                                    if(err){
                                        logger.error("Match Insert waterfall_1:", err);
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows != 1){
                                            logger.error("Match Insert waterfall_2: no data");
                                            conn.rollback(function(){
                                                done(false, "Match Insert DB Error");  // error done callback
                                                conn.release();
                                            });
                                        }else{
                                            callback(null);
                                        }
                                    }
                                });
                            },
                            function(callback){
                                var sql = "INSERT INTO atn_match(match_my, match_other, match_song) VALUE ?";
                                logger.info(data);
                                conn.query(sql, data, function(err, rows){
                                    if(err){
                                        logger.error("Match Insert waterfall_3:", err);
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows == 0){
                                            conn.rollback(function(){
                                                logger.error("Match Insert waterfall_4");
                                                done(false, "Match Insert DB Error");  // error done callback
                                                conn.release();
                                            });
                                        }else{
                                            callback(null);
                                        }
                                    }
                                });
                            }
                        ],
                        function(err){
                            if(err){
                                conn.rollback(function(){
                                    done(false, "Match Insert DB Error");  // error
                                    conn.release();
                                });
                            }else{
                                conn.commit(function(err){
                                    if(err){
                                        logger.error("Match Insert Commit Error:", err);
                                        done(false, "Match Insert Commit Error");  // error
                                        conn.release();
                                    }else{
                                        done(true, "success");  // success
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
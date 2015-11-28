/**
 * Created by kingw on 2015-10-07.
 */
var mysql = require('mysql');
var db_config = require('./db_config');
var pool = mysql.createPool(db_config);
var logger = require('../logger');
var async = require('async');

// 주파수 생성
var frequencyCreate = function(area, count){
    var number = ((area * 100000) + count);
    var freq = (number/1000);
    return freq.toFixed(3);
};

/*******************
 *  USER Join
 ********************/
exports.join = function(user_data, done){
    pool.getConnection(function(err, conn){
        if(err){
            logger.error("User join getConnection error");
            done(false, "User join DB error");
        }else{
            conn.beginTransaction(function(err){
                if(err){
                    logger.error("User join beginTransaction error");
                    done(false, "User join DB error");
                    conn.release();
                }else{
                    async.waterfall([
                            function(callback){  // 해당 주파수 count 증가
                                var sql = "UPDATE atn_freq SET count=count+1 WHERE no = ?";
                                conn.query(sql, user_data.user_freq, function(err, rows){
                                    if(err){
                                        logger.error("User join waterfall_1");
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows == 1){
                                            callback(null);
                                        }else{
                                            logger.error("User join waterfall_2");
                                            conn.rollback(function(){
                                                done(false, "User join DB error");
                                                conn.release();
                                            });
                                        }
                                    }
                                });
                            },
                            function(callback){  // 증가한 숫자 가져오기
                                var sql = "SELECT count FROM atn_freq WHERE no = ?";
                                conn.query(sql, user_data.user_freq, function(err, rows){
                                    if(err){
                                        logger.error("User join waterfall_3");
                                        callback(err);
                                    }else{
                                        if(rows[0]){
                                            callback(null, rows[0].count);
                                        }else{
                                            logger.error("User join waterfall_4");
                                            conn.rollback(function(){
                                                done(false, "User join DB error");
                                                conn.release();
                                            });
                                        }
                                    }
                                });
                            },
                            function(count, callback){  // 회원 데이터 입력
                                user_data.user_freq = frequencyCreate(user_data.user_freq, count);
                                var sql =
                                    "UPDATE atn_user " +
                                    "SET user_freq=?, user_song=?, user_video=?, user_nickname=?, " +
                                    "user_comment=?, user_phone=?, user_regid=? " +
                                    "WHERE user_idx = ?";
                                var update_user = [];
                                for (var key in user_data){
                                    update_user.push(user_data[key]);
                                }
                                logger.info("update_user:", update_user);
                                conn.query(sql, update_user, function(err, rows){
                                    if(err){
                                        logger.error("User join waterfall_5");
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows == 1){
                                            callback(null, user_data.user_freq);
                                        }else{
                                            logger.error("User join waterfall_6");
                                            conn.rollback(function(){
                                                done(false, "User join DB error");
                                                conn.release();
                                            });
                                        }
                                    }
                                });
                            },
                            function(user_freq, callback){  // 노래 데이터 입력
                                var sql = "INSERT INTO atn_song(song_song, song_video, song_comment, song_user) VALUES (?,?,?,?)";
                                conn.query(sql, [user_data.user_song, user_data.user_video, user_data.user_comment, user_data.user_idx], function(err, rows){
                                    if(err){
                                        logger.error("User join waterfall_7");
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows == 1){
                                            callback(null, user_freq);
                                        }else{
                                            logger.error("User join waterfall_8");
                                            conn.rollback(function(){
                                                done(false, "User join DB error");
                                                conn.release();
                                            });
                                        }
                                    }
                                });
                            }
                        ],
                        function(err, user_freq){
                            if(err) {
                                conn.rollback(function(){
                                    done(false, "User join DB error");  // error
                                    conn.release();
                                });
                            }else{
                                conn.commit(function(err){
                                    if(err){
                                        logger.error("User join commit error");
                                        done(false, "User join DB error");
                                        conn.release();
                                    }else{
                                        done(true, "success", user_freq);  // success
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
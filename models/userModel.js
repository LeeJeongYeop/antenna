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
    return ((area * 100000) + count);
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
                            function(count, callback){  // 데이터 입력
                                user_data.user_freq = frequencyCreate(user_data.user_freq, count);
                                var sql = "INSERT INTO atn_user SET ?";
                                pool.query(sql, user_data, function(err, rows){
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
                                        user_freq = (user_freq / 1000);  // 주파수 상태로 보여주기
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
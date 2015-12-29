/**
 * Created by kingw on 2015-11-28.
 */
var mysql = require('mysql');
var db_config = require('./db_config');
var pool = mysql.createPool(db_config);
var logger = require('../logger');
var async = require('async');

/*******************
 *  Mail Send
 ********************/
exports.mailSave = function(data, done){
    var sql = "INSERT INTO atn_mail SET ?";
    pool.query(sql, data, function(err, rows){
        if(err){
            logger.error("Mail Save Error:", err);
            done(err);
        }else{
            if(rows.affectedRows != 1){
                logger.error("Mail Save Error");
                done("Mail Save Error");  // 메일 저장 실패시
            }else{
                done(null, rows.insertId);
            }
        }
    });
};
exports.userInfo = function(freq, done){
    logger.info("freq:", freq);
    var sql = "SELECT user_idx, user_phone, user_regid FROM atn_user WHERE user_freq = ?";
    pool.query(sql, freq, function(err, rows){
        if(err){
            logger.error("Mail Send userInfo Error:", err);
            done(err);
        }else{
            if(rows.length == 0){
                logger.error("Mail Send userInfo Error(No data)");
                done("Mail Send userInfo Error(No data)");  // 주파수 검색 실패시
            }else{
                done(null, rows[0]);
            }
        }
    });
};
exports.sendInfo = function(uid, done){
    var sql = "SELECT user_nickname, user_freq FROM atn_user WHERE user_idx = ?";
    pool.query(sql, uid, function(err, rows){
        if(err){
            logger.error("Mail Send sendInfo Error:", err);
            done(err);
        }else{
            if(rows.length == 0){
                logger.error("Mail Send sendInfo Error(No data)");
                done("Mail Send sendInfo Error(No data)");  // 주파수 검색 실패시
            }else{
                done(null, rows[0]);
            }
        }
    });
};

/*******************
 *  Mail View
 ********************/
exports.mailView = function(mid, done){
    pool.getConnection(function(err, conn){
        if(err){
            logger.error("Mail View getConnection error");
            done(false, "Mail View DB error");
        }else{
            conn.beginTransaction(function(err){
                if(err){
                    logger.error("Mail View beginTransaction error");
                    done(false, "Mail View DB error");
                    conn.release();
                }else{
                    async.waterfall([
                            function(callback){  // 메일 가져오기
                                var sql =
                                    "SELECT u.user_freq, u.user_nickname, m.mail_song, m.mail_video, m.mail_comment " +
                                    "FROM atn_mail m, atn_user u " +
                                    "WHERE m.mail_sender = u.user_idx AND m.mail_idx = ?";
                                conn.query(sql, mid, function(err, rows){
                                    if(err){
                                        logger.error("Mail View Error waterfall_1:", err);
                                        callback(err);
                                    }else{
                                        if(rows.length == 0){
                                            logger.error("Mail View Error(No data) waterfall_2");
                                            conn.rollback(function(){
                                                done(false, "Mail View Error(No data)");  // 주파수 검색 실패시(임의 에러)
                                                conn.release();
                                            });
                                        }else{
                                            callback(null, rows[0]);
                                        }
                                    }
                                });
                            },
                            function(mail, callback){  // 메일 읽음 표시
                                var READ = 1;
                                var sql = "UPDATE atn_mail SET mail_readcheck=? WHERE mail_idx=?";
                                conn.query(sql, [READ, mid], function(err, rows){
                                    if(err){
                                        logger.error("Mail View Error waterfall_3");
                                        callback(err);
                                    }else{
                                        if(rows.affectedRows == 1){
                                            callback(null, mail);
                                        }else{
                                            logger.error("Mail View Error waterfall_4");
                                            conn.rollback(function(){
                                                done(false, "Mail View Error");  // 읽음 표시 수정에러(임의 에러)
                                                conn.release();
                                            });
                                        }
                                    }
                                });
                            }
                        ],
                        function(err, mail){
                            if(err) {
                                conn.rollback(function(){
                                    done(false, "Mail View DB error");  // error
                                    conn.release();
                                });
                            }else{
                                conn.commit(function(err){
                                    if(err){
                                        logger.error("Mail View commit error");
                                        done(false, "Mail View DB error");
                                        conn.release();
                                    }else{
                                        done(true, "success", mail);  // success
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

/*******************
 *  Mail Read Check
 ********************/
exports.mailReadCheck = function(uid, done){
    var sql = "SELECT mail_idx mid FROM atn_mail WHERE mail_receiver = ? AND mail_readcheck=0";
    pool.query(sql, uid, function(err, rows){
        if(err){
            logger.error("Mail Mail Read Check Error:", err);
            done(false, "Mail Mail Read Check Error");
        }else{
            done(true, "success", rows);
        }
    });
};
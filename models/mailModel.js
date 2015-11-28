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

/*******************
 *  Mail View
 ********************/
exports.mailView = function(mid, done){
    var sql =
        "SELECT u.user_freq, u.user_nickname, m.mail_song, m.mail_video, m.mail_comment " +
        "FROM atn_mail m, atn_user u " +
        "WHERE m.mail_sender = u.user_idx AND m.mail_idx = ?";
    pool.query(sql, mid, function(err, rows){
        if(err){
            logger.error("Mail View Error:", err);
            done(false, "Mail View Error");
        }else{
            if(rows.length == 0){
                logger.error("Mail View Error(No data)");
                done(false, "Mail View Error(No data)");  // 주파수 검색 실패시
            }else{
                done(true, "success", rows[0]);
            }
        }
    });
};
/**
 * Created by kingw on 2015-11-28.
 */
var mailModel = require('../models/mailModel');
var my = require('../my_conf');
var logger = require('../logger');
var async = require('async');

/*******************
 *  Mail Send
 ********************/
exports.mailSend = function(req, res){
    if(!req.headers.uid || !req.body.freq || !req.body.song || !req.body.video){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        async.waterfall([
                function(callback){  // receiver 유저 정보
                    logger.info("req.body.freq:", req.body.freq);
                    mailModel.userInfo(req.body.freq, function(err, receiver){
                        if(err){
                            callback(err);
                        }else{
                            callback(null, receiver);
                        }
                    });
                },
                function(receiver, callback){  // sender 유저 정보
                    mailModel.sendInfo(my.decrypted(req.headers.uid), function(err, sender){
                        if(err){
                            callback(err);
                        }else{
                            callback(null, sender, receiver);
                        }
                    });
                },
                function(sender, receiver, callback){  // mail 저장
                    var data = {
                        "mail_sender": my.decrypted(req.headers.uid),
                        "mail_receiver": receiver.user_idx,
                        "mail_song": req.body.song,
                        "mail_video": req.body.video,
                        "mail_comment": req.body.comment
                    };
                    mailModel.mailSave(data, function(err, mid){
                        if(err){
                            callback(err);
                        }else{
                            callback(null, sender, receiver, mid);
                        }
                    });
                },
                function(sender, receiver, mid, callback){  // push 전송
                    if(!receiver.user_regid || receiver.user_regid == ""){  // regid가 없을 시 push 패스
                        callback(null);
                    }else{
                        if(receiver.user_phone == 1){  // 0: 안드, 1: 아이폰
                            my.apns(receiver.user_regid, mid, sender);
                        }else{
                            my.gcm(receiver.user_regid, mid);
                        }
                        callback(null);
                    }
                }
            ],
            function(err){
                if(err){
                    return res.json({
                        "status": false,
                        "message": "Mail Send Fail"
                    });
                }else{
                    return res.json({
                        "status": true,
                        "message": "success"
                    });
                }
            }
        )
    }
};

/*******************
 *  Mail View
 ********************/
exports.mailView = function(req, res){
    var mid = req.params.mid;
    mailModel.mailView(mid, function(status, msg, mail){
        if(!status){
            mail = null;
        }
        return res.json({
            "status": status,
            "message": msg,
            "data": {
                "info": mail
            }
        })
    });
};

/*******************
 *  Mail Read Check
 ********************/
exports.mailReadCheck = function(req, res){
    if(!req.headers.uid){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        mailModel.mailReadCheck(my.decrypted(req.headers.uid), function(status, msg, mid){
            return res.json({
                "status": status,
                "message": msg,
                "data": mid
            });
        });
    }
};
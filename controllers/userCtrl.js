/**
 * Created by kingw on 2015-10-07.
 */
var userModel = require('../models/userModel');
var my = require('../my_conf');
var logger = require('../logger');
var async = require('async');

/*******************
 *  USER Join
 ********************/
exports.join = function(req, res){
    if(!req.body.uid || !req.body.survey || !req.body.song ||
        !req.body.video || !req.body.nickname || !req.body.phone || !req.body.regid){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        var user_data = {
            "user_freq": req.body.survey,
            "user_song": req.body.song,
            "user_video": req.body.video,
            "user_nickname": req.body.nickname,
            "user_comment": req.body.comment,
            "user_phone": req.body.phone,
            "user_regid": req.body.regid,
            "user_idx": my.decrypted(req.body.uid)
        };
        userModel.join(user_data, function(status, msg, user_freq){
            if(!status){
                user_freq = null;
            }
            return res.json({
                "status": status,
                "message": msg,
                "data": {
                    "frequency": user_freq
                }
            });
        });
    }
};

/*******************
 *  USER Find
 ********************/
exports.find = function(req, res){
    if(!req.params.freq) {  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        userModel.find(req.params.freq, function(err, user){
            var status = false;
            var message = "";
            if(err){
                message = "User frequency find error";
            }else if(!user){
                message = "No User";
            }else{
                status = true;
                message = "success";
            }
            return res.json({
                "status": status,
                "message": message,
                "data": user
            });
        });
    }
};
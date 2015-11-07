/**
 * Created by kingw on 2015-10-31.
 */
var estiModel = require('../models/estiModel');
var _cryptor = require('../my_conf');
var logger = require('../logger');
var async = require('async');

/*******************
 *  Estimate Song List
 ********************/
exports.estiSong = function(req, res){
    estiModel.estiSong(function(status, msg, song){
        if(!status){
            song = null;
        }
        return res.json({
            "status": status,
            "messgae": msg,
            "data": {
                "song": song
            }
        });
    });
};

/*******************
 *  Estimate Song Result
 ********************/
exports.estiResult = function(req, res){
    if(!req.body.song_idx || !req.body.estimate){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        var data = {
            "esti_song": req.body.song_idx,
            "esti_esti": req.body.estimate
        };
        if(!req.body.uid){  // 완전 첫 유저의 경우
            estiModel.estiResultFirst(data, function(status, msg, uid){
                if(!uid){
                    uid = null;
                }
                return res.json({
                    "status": status,
                    "message": msg,
                    "data": {
                        "uid": _cryptor.encrypted(uid)
                    }
                });
            });
        }else{  // user_idx를 받은 유저
            data.esti_user = _cryptor.decrypted(req.body.uid);  // 객체에 esti_user 추가
            estiModel.estiResult(data, function(status, msg){
                return res.json({
                    "status": status,
                    "message": msg
                });
            });
        }
    }
};
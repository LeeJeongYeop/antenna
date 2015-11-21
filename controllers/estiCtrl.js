/**
 * Created by kingw on 2015-10-31.
 */
var estiModel = require('../models/estiModel');
var _cryptor = require('../my_conf');
var logger = require('../logger');
var async = require('async');

// other_list Shuffle function
var shuffle = function(array){
    array.sort(function(){
        return 0.5 - Math.random();
    });
    return array;
};

// recommend user
var recommend = function(my_array, other_list, recommend_cb){
    var cnt = 0;
    var recommend_user = "",
        recommend_song = [],
        other_idx = 0;
    async.whilst(
        function(){ return cnt < other_list.length },
        function(callback){
            estiModel.estimate(other_list[cnt].user_idx, function(err, other_estimate){
                if(err){
                    callback(err);  // model에서 에러상황
                }else{
                    var other_array = [];
                    var result_array = [];

                    // other 평가 배열 만들기
                    for (var i in other_estimate){
                        other_array.push(other_estimate[i].esti_song * other_estimate[i].esti_esti);
                    }

                    // my와 other의 평가 배열 비교
                    for (var i in my_array){
                        var check = other_array.indexOf(my_array[i]);
                        if(check != -1){
                            result_array.push(other_array[check]);
                        }
                    }

                    logger.info("result_array:", result_array);
                    var STANDARD = 0.5;  // 추천 조건
                    if(result_array.length >= ((my_array.length) * STANDARD)){
                        recommend_user = other_list[cnt].user_freq;
                        recommend_song = result_array;
                        other_idx = other_list[cnt].user_idx;
                        cnt = other_list.length;
                        callback();
                    }else{
                        if(recommend_user == 0){  // 첫번째 비교 대상
                            recommend_user = other_list[cnt].user_freq;
                            recommend_song = result_array;
                            other_idx = other_list[cnt].user_idx;
                            cnt++;
                            callback();
                        }else{
                            if(recommend_song.length > result_array.length){  // 그나마 확률이 높은사람
                                cnt++;
                                callback();
                            }else{
                                recommend_user = other_list[cnt].user_freq;
                                recommend_song = result_array;
                                other_idx = other_list[cnt].user_idx;
                                cnt++;
                                callback();
                            }
                        }
                    }
                }
            });
        },
        function(err){
            if(err){
                recommend_cb(err);
            }else{
                logger.info("recommend_user", recommend_user);
                recommend_cb(null, recommend_user, recommend_song, other_idx);
            }
        }
    );  // whilst
};

/*******************
 *  Estimate Song List
 ********************/
exports.estiSongList = function(req, res){
    estiModel.estiSongList(function(status, msg, song){
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
exports.estiSongResult = function(req, res){
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
            estiModel.estiResultSongFirst(data, function(status, msg, uid){
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
            estiModel.estiResultSong(data, function(status, msg){
                return res.json({
                    "status": status,
                    "message": msg
                });
            });
        }
    }
};

/*******************
 *  Estimate Match
 ********************/
exports.estiMatch = function(req, res){
    if(!req.body.uid){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        var uid = _cryptor.decrypted(req.body.uid);
        async.parallel({
                my_array: function(callback){  // 자신의 평가 배열생성
                    var my_array = [];
                    estiModel.estimate(uid, function(err, my_estimate){
                        if(err){
                            callback(err);  // model에서 에러상황
                        }else{
                            for (var i in my_estimate){  // 자신의 평가 배열 만들기
                                my_array.push(my_estimate[i].esti_song * my_estimate[i].esti_esti);
                            }
                            callback(null, my_array);
                        }
                    });
                },
                other_list: function(callback){  // 주파수를 가진 사람들 리스트
                    estiModel.otherList(function(err, other_list){
                        if(err){
                            callback(err);  // model에서 에러상황
                        }else{
                            var shuffle_list = shuffle(other_list);  // 주파수 가진 사람들 리스트 랜덤 배치
                            callback(null, shuffle_list);
                        }
                    });
                }
            },
            function(err, result){
                if(err){
                    return res.json({
                        "status": false,
                        "message": "list call fail"
                    });
                }else{
                    // recommend 콜백 함수 호출
                    recommend(result.my_array, result.other_list, function(err, recommend_user, recommend_song, other_idx){
                        if(err){
                            return res.json({
                                "status": false,
                                "message": "list call fail"
                            });
                        }else{
                            var data = [];
                            for (var i in recommend_song){  // 매칭 데이터
                                data[i] = [uid, other_idx, recommend_song[i]];
                            }
                            estiModel.matchInsert(uid, other_idx, data, function(status, msg){
                                if(status){
                                    return res.json({
                                        "status": true,
                                        "message": msg,
                                        "data": {
                                            "frequency": recommend_user,
                                            "song": recommend_song.length
                                        }
                                    });
                                }else{
                                    return res.json({
                                        "status": false,
                                        "message": msg
                                    });
                                }
                            });
                        }
                    });
                }
            }
        );  // parallel
    }
};

/*******************
 *  Estimate Detail
 ********************/
exports.estiDetail = function(req, res){
    logger.info("headers:", req.headers.uid);
    if(!req.headers.uid){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        estiModel.estiDetail(_cryptor.decrypted(req.headers.uid), function(status, msg, song, partner){
            if(!status){
                song = null;
                partner = null;
            }
            return res.json({
                "status": status,
                "message": msg,
                "data": {
                    "song": song,
                    "partner": partner
                }
            });
        });
    }
};
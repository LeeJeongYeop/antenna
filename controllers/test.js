/**
 * Created by kingw on 2015-10-03.
 */
var my = require('../my_conf');

/*******************
 *  Connect TEST
 ********************/
exports.connect = function(req, res){
    res.json({
        "status": true,
        "message": "Server Connect Success"
    });
};

exports.hashcheck = function(req, res){
    if(!req.body.uid){  // parameter check
        return res.json({
            "status": false,
            "message": "invalid parameter"
        });
    }else{
        res.json({
            "status": true,
            "uid": my.encrypted(req.body.uid)
        });
    }
};
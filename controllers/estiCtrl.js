/**
 * Created by kingw on 2015-10-31.
 */
var estiModel = require('../models/estiModel');
var logger = require('../logger');
var async = require('async');

/*******************
 *  Estimate Song Send
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
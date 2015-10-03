/**
 * Created by kingw on 2015-10-03.
 */

/*******************
 *  Connect TEST
 ********************/
exports.connect = function(req, res){
    res.json({
        "status": true,
        "message": "Server Connect Success"
    });
};
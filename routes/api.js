/**
 * Created by kingw on 2015-10-03.
 */
var test = require('../controllers/test');
var userCtrl = require('../controllers/userCtrl');
var estiCtrl = require('../controllers/estiCtrl');

exports.initApp = function(app){
    // TEST
    app.route('/antenna/test/connect')
        .get(test.connect);

    // USER
    app.route('/antenna/user')
        .post(userCtrl.join);

    // Estimate
    app.route('/antenna/estimate')
        .get(estiCtrl.estiSong)
        .post(estiCtrl.estiResult);
};
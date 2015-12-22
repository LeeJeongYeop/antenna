/**
 * Created by kingw on 2015-10-03.
 */
var test = require('../controllers/test');
var userCtrl = require('../controllers/userCtrl');
var estiCtrl = require('../controllers/estiCtrl');
var bookmarkCtrl = require('../controllers/bookmarkCtrl');
var mailCtrl = require('../controllers/mailCtrl');

exports.initApp = function(app){
    // TEST
    app.route('/antenna/test/connect')
        .get(test.connect);
    app.route('/antenna/test/uid')
        .post(test.hashcheck);

    // USER
    app.route('/antenna/user')
        .post(userCtrl.join);
    app.route('/antenna/user/find/:freq')
        .get(userCtrl.find);

    // ESTIMATE
    app.route('/antenna/estimate')
        .get(estiCtrl.estiSongList)
        .post(estiCtrl.estiSongResult);
    app.route('/antenna/estimate/match')
        .post(estiCtrl.estiMatch);
    app.route('/antenna/estimate/detail')
        .get(estiCtrl.estiDetail);

    // BOOKMARK
    app.route('/antenna/bookmark')
        .post(bookmarkCtrl.bkAdd)
        .get(bookmarkCtrl.bkList);

    // MAIL
    app.route('/antenna/mail')
        .post(mailCtrl.mailSend);
    app.route('/antenna/mail/:mid')
        .get(mailCtrl.mailView);
};
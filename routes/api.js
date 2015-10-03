/**
 * Created by kingw on 2015-10-03.
 */
var test = require('../controllers/test');

exports.initApp = function(app){
    //TEST
    app.route('/antenna/test/connect')
        .get(test.connect);
};
var unicum = require("./unicum")
    , express = require('express')
    , app = express();

global.logger = function (str) {
    require('fs').appendFileSync('/log/unicum.log', str + "\n");
}

app.get('/generate/:type', function (req, res) {
    unicum.generate(req.params.type, function (err, key) {
        console.log("err", err);
        res.json({
            success: !err,
            code: err ? 404 : 200,
            key: key,
            type: req.params.type
        })
    });
});

app.get('/generate/:type/:quantity', function (req, res) {
    unicum.generate(req.params.type, req.params.quantity, function (keys) {
        var good = Array.isArray(keys) && keys.length > 0;
        res.json({
            success: good ? true : false,
            code: good ? 200 : 404,
            keys: keys,
            type: req.params.type
        })
    });
});

app.get('/type/:key', function (req, res) {
    var type = unicum.getType(req.params.key);
    res.json({
        success: type ? true : false,
        code: type ? 200 : 403,
        key: req.params.key,
        type: type
    });
});

app.get('/time/:key', function (req, res) {
    var time = unicum.getTime(req.params.key);
    res.json({
        success: time ? true : false,
        code: time ? 200 : 403,
        key: req.params.key,
        time: time
    });
});

app.get('/fulltime/:key', function (req, res) {
    var time = unicum.getFullTime(req.params.key);
    res.json({
        success: time ? true : false,
        code: time ? 200 : 403,
        key: req.params.key,
        seconds: time[0],
        micros: time[1]
    });
});

app.get('/date/:key', function (req, res) {
    var time = unicum.getTime(req.params.key, true);
    res.json({
        success: time ? true : false,
        code: time ? 200 : 403,
        key: req.params.key,
        date: time
    });
});

app.get('/info/:key', function (req, res) {
    var info = unicum.getInfo(req.params.key);
    res.json({
        success: info ? true : false,
        code: info ? 200 : 403,
        key: info.key,
        type: info.type,
        date: info.date
    });
});

app.get('/epoch', function (req, res) {
    res.json({
        success: true,
        code: 200,
        epoch: unicum.getEpoch()
    });
});

app.get('/convert/:key/:type', function (req, res) {
    unicum.convert(req.params.key, req.params.type, function (err, key) {
        res.json({
            success: !err,
            code: err && err.status ? err.status : err ? 404 : 200,
            key: key,
            type: req.params.type
        });
    });
});

app.get('/init', function (req, res) {
    unicum.init(JSON.parse(req.query.config), function (err) {
        res.json({
            success: !err,
            message: err && err.message ? err.message : null
        });
    })
});

app.get('/restore/:secret', function (req, res) {
    unicum.restore(JSON.parse(req.query.config), req.params.secret, function (err) {
        res.json({
            success: !err,
            message: err && err.message ? err.message : null
        });
    });
});

app.get('/export', function (req, res) {
    unicum.export(function (err, config) {
        res.json({
            success: !err,
            config: config
        });
    })
});

app.get('/', function (req, res) {
    res.json({success: true, code: 200, message: 'Welcome to Unicum'});
});


/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.json({
        success: false,
        code: 404,
        message: 'Wrong api call.'
    });
});

//global.errout = function (err, req, res) {
//    res.status(err.status || 500);
//    var ret = {
//        success: false,
//        error: {
//            code: err.status || 500,
//            message: err.message
//        }
//    };
//    //if (app.get('env') === 'development' && ret.error.code != 404) {
//    //    console.error(err);
//    //    ret.error.err = err;
//    //}
//    res.json(ret);
//}
//
//app.use(errout);
////
//app.get('*', function (req, res) {
//    res.json({
//        success: false,
//        code: 404,
//        message: 'Wrong api call.'
//    });
//});

app.listen(6961);

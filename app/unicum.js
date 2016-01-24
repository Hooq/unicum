/*!
 * Unicum version 0.1.0 - September 6th, 2014
 * (c) Francesco Sullo, fs@hooq.co
 * Released under MIT Licence
 */

function Unicum() {

    var keystr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        , strlen = keystr.length
        , epoch = 0
        , codes = {}
        , types = {}
        , nextKey = -1
        , redis = require('redis')
            .createClient(6379, process.env.UNICUM_REDIS_PORT_6379_TCP_ADDR);

    if (process.env.REDIS_PASSWORD)
        redis.auth(process.env.REDIS_PASSWORD, function () {
        });
    redis.on('error', function (err) {
        console.log('Error connecting to Redis: ' + err);
    });


    function zeroFill(n, z) {
        var l = z
            , r = "" + n
            , d = l - r.length;
        for (var j = 0; j < d; j++)
            r = "0" + r;
        return r;
    }

    function decode(k, onlyType) {
        var key = (k || '').toString()
            , l = key.length,
            typeCode = fromInt62(key.substring(l - 2, l));

        console.log("typeCode", typeCode, types["" + typeCode]);
        var type = types["" + typeCode];
        if (type) {
            if (onlyType)
                return type;
            var ts32 = key.substring(0, l - 7)
                , micros32 = key.substring(l - 7, l - 3)
                , variant62 = key.substring(l - 3, l - 2);
            if (ts32.length >= 1 && isInt62(ts32) && isInt62(micros32) && isInt62(variant62))
                return {
                    ts: ts32 ? fromInt62(ts32) : 0,
                    micros: micros32 ? fromInt62(micros32) : 0,
                    variant: fromInt62(variant62),
                    type: type,
                    typeCode: typeCode
                };
            else
                return null;
        } else
            return null;
    }

    function isNumber(x) {
        return typeof x === 'number';
    }

    function create(type, cb) {
        if (isNumber(codes[type])) cb();
        else {
//            console.log("doesntexist");
//            console.log("nextKey", nextKey)
            if (nextKey > Math.pow(strlen, 2) - 1) {
                cb({code: 401, message: 'No more space for key codes.'});
            }
            else {
                var val = {};
                val[type] = nextKey;
//                console.log("val", val);
                redis.hmset('codes', val, function (err) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        codes[type] = nextKey;
                        types["" + nextKey] = type;
                        nextKey++;
                        cb();
                    }
                });
            }
        }
    };

    function isInt62(s) {
        var re = new RegExp("[^" + keystr + "]");
        if (!s || re.test(s))
            return false;
        return true;
    }

    function toInt62(x, z) {
        if (!x)
            return (z ? zeroFill(0, z) : "0");
        var ret = "";
        while (x > 0) {
            var p = x % strlen;
            ret = keystr.substring(p, p + 1) + ret;
            x = Math.floor(x / strlen);
        }
        if (z)
            ret = zeroFill(ret, z);
        return ret;
    };

    function fromInt62(x) {
        var ret = 0;
        if (x && isInt62(x))
            for (var j = x.length; j; j--) {
                var p = -1 * (j - x.length);
                ret += keystr.indexOf(x.substring(p, p + 1))
                    * Math.pow(strlen, j - 1);
            }
        return ret;
    };

    function toISODate(d0) {
        var d = typeof d0 == 'number' ? new Date(d0) : d0;

        function f(n) {    // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
        }

        var date = d.getFullYear() + '-' +
            f(d.getMonth() + 1) + '-' +
            f(d.getDate()) + 'T' +
            f(d.getHours()) + ':' +
            f(d.getMinutes()) + ':' +
            f(d.getSeconds()) + ':' +
            f(d.getMilliseconds()) + 'Z';

        return date;
    };

    function randomStr(l) {
        var len = l || 8,
            str = '';
        for (var j = 0; j < len; j++) {
            var val = (1000000 * Math.random()) % 62;
            str += keystr.substring(val, val + 1);
        }
        return str;
    }

    function getType(key) {
        return decode(key, true);
    };

    function getTime(key, isoFormat) {
        var k = decode(key);
        if (k.ts) {
            var ts = (k.ts + epoch) * 1000;
            var rest = Math.floor(k.micros / 1000);
            var millis = ts + rest;
            if (isoFormat)
                return toISODate(millis);
            else
                return millis;
        }
        return null;
    };

    function init(config, cb) {

        redis.exists('epoch', function (err, exists) {
            if (!exists) {
                redis.set('epoch', config.epoch, function (err) {
                    epoch += config.epoch - epoch;
                    redis.hmset('codes', config.codes, function (err) {
                        for (var i in codes) {
                            delete types["" + codes[i]];
                            delete codes[i];
                        }
                        for (i in config.codes) {
                            codes[i] = config.codes[i];
                            types[codes[i]] = i;
                        }
                        cb();
                    });
                });
            }
            else cb({code: 401, message: 'The database is not empty. Call /restore/:secret to force the import. Be careful!'});
        });
    };

    // public methods

    this.generate = function generate(type, quantity, cb) {
        var kval = codes[type];
//        console.log("typeof kval", typeof kval);
        if (typeof kval != 'number') {
            create(type, function (err) {
                console.log("err", err);
                if (err) cb(err);
                else generate(type, quantity, cb);
            });
        } else {
            if (!cb) {
                cb = quantity;
                quantity = 1;
            }
//            console.log("epoch", epoch);
            redis.time(function (err, time) {
                if (err != null)
                    cb(err);
                else
                    redis.incr("sequence:" + kval, function (err2, variant) {
                        if (err2 != null)
                            cb(err2);
                        else {
                            var ts = parseInt(time[0], 10) - epoch
                                , micros = parseInt(time[1], 10)
                                , variant62 = toInt62(variant % strlen, 2);

//                            console.log(epoch, time, ts);
//                            console.log(variant62);

                            var ts62 = toInt62(ts, 2)
                                , micros62 = toInt62(micros, 4)
                                , ktype62 = toInt62(kval, 2);

//                            console.log(ts62, micros62, ktype62);

                            if (quantity == 1) {
                                var key = ts62
                                    + micros62
                                    + variant62
                                    + ktype62;
                                cb(null, key);
                            } else {
                                var keys = [], ms = time[1];
                                for (var j = 0; j < quantity; j++) {
                                    keys[j] = ts62
                                        + toInt62(ms, 4)
                                        + variant62
                                        + ktype62;
                                    ms++;
                                    if (ms == 1000000) {
                                        ms = 0;
                                        ts62 = toInt62(++ts, 2);
                                    }
                                }
                                cb(null, keys);
                            }
                        }
                    });
            });
        }
    };

    this.getType = getType;

    this.getInfo = function getInfo(key) {
        var type = getType(key);
        var date = getTime(key, true);
        if (type && date)
            return {
                key: key,
                type: type,
                date: date
            };
        else return null;
    };

    this.getTime = getTime;

    this.getFullTime = function getTime(key) {
        var k = decode(key);
        if (isNumber(k.ts) && isNumber(k.micros)) {
            return [k.ts + epoch, k.micros];
        }
        return null;
    };

    this.getEpoch = function getEpoch() {
        return epoch;
    };

    this.export = function (cb) {
        cb(null, {
            epoch: epoch,
            codes: codes
        })
    };

    this.restore = function restore(config, secret, cb) {
        redis.exists('secret', function (err, exists) {
            if (!exists)
                cb({code: 403, message: "Unicum hasn't been configured yet."});
            else
                redis.get('secret', function (err2, secret2) {
                    if (err2) cb(err2);
                    else if (secret == secret2)
                        redis.del('epoch', function () {
                            redis.del('codes', function () {
                                Import(config, cb);
                            });
                        });
                    else
                        cb({code: 401, message: 'Wrong secret.'});
                });
        });
    };

    this.init = init;


// configuration

    redis.exists('epoch', function (err, exists) {
        if (!exists) {
            logger("Configuring Unicum.");
            // first time
            redis.time(function (err, time) {
                    epoch += parseInt(time[0], 10);
                    nextKey += 1;
                    redis.set('epoch', epoch);
                    var secret = randomStr(24);
                    redis.set('secret', secret);
                    logger("Unicum server started on port 6961 at "+toISODate(Date.now())+".\nSecret key: " + secret + ".");
                }
            )
        } else {

            function getSecret() {
                redis.get('secret', function (err, secret) {
                    logger("Unicum server started on port 6961 at "+toISODate(Date.now())+".\nSecret key: " + secret + ".");
                });
            }

            // other times
            logger("Loading Unicum configuration.");
            redis.get('epoch', function (err, epoch2) {
                epoch += parseInt(epoch2, 10);
                redis.exists('codes', function (err, exists2) {
//                    console.log("exists", exists2);
                    if (exists2)
                        redis.hgetall('codes', function (err, savedCodes) {

//                            console.log("savedCodes",JSON.stringify(savedCodes));
                            var max = -1;
                            for (var i in savedCodes) {
                                var val = savedCodes[i];
                                codes[i] = val;
                                types[val] = i;
                                max = Math.max(max, val);
                            }
                            nextKey += max + 1;
//                            console.log(JSON.stringify(types));
//                            console.log(JSON.stringify(codes));
                            getSecret();
                        })
                    else {
                        nextKey += 1;
                        getSecret();
                    }
                });
            });
        }
    })

};

module.exports = new Unicum();
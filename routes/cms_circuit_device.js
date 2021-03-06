var express = require('express');
var router = express.Router();
var mongoHelp = require('./mongo');
var Q = require('q');
var redis = require("redis");

var getcms_circuit_q = function (wfId, callback) {
    console.log(wfId);
    var deffered = Q.defer();
    mongoHelp.mongoInit("cms_circuit", function (err, collection) {
        collection.find({ "wfId": wfId }).toArray(function (err, doc) {
            //assert.equal(err, null);
            var result = new Object();
            if (doc != null) {
                console.log("in true");
                console.dir(doc[0]);

                result.data = doc[0];
                result.message = "founded"

            } else {
                console.log("in else");
                result.data = null;
                result.message = "nothing was found";
            }

            deffered.resolve(result);
            // actData(result);
        })
    });
    return deffered.promise.nodeify(callback);
}

var getcms_circuit_device_q = function (deviceUniKey, callback) {
    var client = redis.createClient(19000, "hao.oudot.cn");
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    console.log(deviceUniKey);
    var deffered = Q.defer();
    client.hgetall("cms:circuit:" + deviceUniKey, function (err, replies) {
        for (var key in replies) {
            console.log(key + ': ' + replies[key]);
        };
        console.log("last");
        console.dir(replies);
        deffered.resolve(replies);
    });
    return deffered.promise.nodeify(callback);
}

var getcms_device_info_q = function (devicetag, callback) {
    var client = redis.createClient(19000, "hao.oudot.cn");
    client.on("error", function (err) {
        console.log("Error " + err);
    });
    console.log(devicetag);
    var deffered = Q.defer();
    client.hgetall("cms:" + devicetag, function (err, replies) {
        for (var key in replies) {
            console.log(key + ': ' + replies[key]);
        };
        console.log("last");
        console.dir(replies);
        deffered.resolve(replies);
    });
    return deffered.promise.nodeify(callback);
}

// var getcms_circuit_device_key = function (wfId, act) {
//     getcms_circuit(wfId, function (data) {
//         console.dir(data);
//         var dd = data == null ? null : data.data.channels.channel.map(function (curChannel, index, arr) {
//             var ed = curChannel.endPoints.endPoint.map(function (curEndPoint, index, arr) {
//                 return curChannel.deviceUniKey + '.' + curEndPoint.key;
//             });
//             return ed;
//         });

//         data.data = [].concat.apply([], dd);

//         act(data);
//     })
// };

var getcms_circuit_device_key_q = function (wfId, callback) {
    var deffered = Q.defer();
    var promise = getcms_circuit_q(wfId);
    promise.then(function (data) {
        console.dir(data);
        var dd = data == null ? null : data.data.channels.channel.map(function (curChannel, index, arr) {
            var ed = curChannel.endPoints.endPoint.map(function (curEndPoint, index, arr) {
                return curChannel.deviceUniKey + '.' + curEndPoint.key;
            });
            return ed;
        });

        data.data = [].concat.apply([], dd);

        deffered.resolve(data);
    })
    return deffered.promise.nodeify(callback);
};

router.get('/union_key/:wfId', function (req, res) {
    var promise = getcms_circuit_device_key_q(req.params.wfId);
    promise.then(function (data) {
        res.send(data);
    });
});

var getcms_circuit_key_q = function (wfId, recall) {
    var deffered = Q.defer();
        
    var promise = getcms_circuit_q(wfId);
    promise.then(function (data) {
        
        console.dir(data);
        var dd = data == null ? null : data.data.channels.channel.map(function (curChannel, index, arr) {

            return curChannel.deviceUniKey;
        });

        data.data = dd;//[].concat.apply([], dd);
        // console.dir(data);
        deffered.resolve(data);
        //act(data);
    });
    return deffered.promise.nodeify(recall);
};



router.get('/:deviceUniKey', function (req, res) {
    console.log(req.path);
    var promise = getcms_circuit_device_q(req.params.deviceUniKey);
    promise.then(function (data) {
        res.send(data);
    })
});

router.get('/cms-circuit/:wfId', function (req, res) {
    var promise = getcms_circuit_q(req.params.wfId);
    promise.then(function (data) {
        res.send(data);
    });
});

router.get('/circuits/:wfId', function (req, res) {
    var promise = getcms_circuit_key_q(req.params.wfId);
    promise.then(function (data) {
        res.send(data);
    });
    //   getcms_circuit_key(req.params.wfId, function (data) {
    //     res.send(data);

});

router.get('/status/:wfId', function (req, res) {
    console.log(req.path);
    var promise = getcms_circuit_key_q(req.params.wfId);
    var pp = promise.then(function (data) {

        return data.data.map(function (item) {
            return getcms_circuit_device_q(item);
        });
    });
    Q.all(pp).then(function (dataArray) {


        var result = {};
        dataArray.map(function (md) {


            for (var key in md) {
                result[key] = md[key];
            };
        })

        res.send(result);
        //console.dir(result);
    });

});

router.get('/info/:tag', function (req, res) {
    console.log(req.path);
    var promise = getcms_device_info_q(req.params.tag);
    var pp = promise.then(function (data) {
        res.send(data);
    });
});

module.exports = router;

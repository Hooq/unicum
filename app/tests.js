
function tests (unicum) {

    unicum.getEpoch(function (err, epoch) {
        console.log("Epoch", epoch);
    });
};


module.exports = {
    run: function (unicum) {
        tests(unicum);
    }
};
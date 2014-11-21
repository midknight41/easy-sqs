var errors = require("../CustomErrors");
function nullErrorTest(test, fnc) {
    var errorType = new errors.NullArgumentError();
    errorTest(test, errorType, fnc);
}
exports.nullErrorTest = nullErrorTest;
function invalidArgumentErrorTest(test, fnc) {
    var errorType = new errors.InvalidArgumentError();
    errorTest(test, errorType, fnc);
}
exports.invalidArgumentErrorTest = invalidArgumentErrorTest;
function badConfigErrorTest(test, fnc) {
    var errorType = new errors.BadConfigError();
    errorTest(test, errorType, fnc);
}
exports.badConfigErrorTest = badConfigErrorTest;
function errorTest(test, errorType, fnc) {
    try {
        fnc();
        test.equal(1, 0, "an error should have occurred");
    }
    catch (e) {
        test.equal(e.name, errorType.name, "received wrong error: " + e.name + ":" + e.message);
    }
}
exports.errorTest = errorTest;
//# sourceMappingURL=TestHelper.js.map
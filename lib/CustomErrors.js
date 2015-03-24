var utils = require('util');
var BadConfigError = (function () {
    function BadConfigError(message) {
        this.name = "BadConfigError";
        this.message = message;
        var er = Error;
        er.captureStackTrace(this, BadConfigError);
    }
    return BadConfigError;
})();
exports.BadConfigError = BadConfigError;
utils.inherits(BadConfigError, Error);
var NullOrEmptyArgumentError = (function () {
    function NullOrEmptyArgumentError(message) {
        this.name = "NullOrEmptyArgumentError";
        this.message = message;
        var er = Error;
        er.captureStackTrace(this, InvalidArgumentError);
    }
    return NullOrEmptyArgumentError;
})();
exports.NullOrEmptyArgumentError = NullOrEmptyArgumentError;
utils.inherits(NullOrEmptyArgumentError, Error);
var InvalidArgumentError = (function () {
    function InvalidArgumentError(message) {
        this.name = "InvalidArgumentError";
        this.message = message;
        var er = Error;
        er.captureStackTrace(this, InvalidArgumentError);
    }
    return InvalidArgumentError;
})();
exports.InvalidArgumentError = InvalidArgumentError;
utils.inherits(InvalidArgumentError, Error);
//# sourceMappingURL=CustomErrors.js.map
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
require('util').inherits(BadConfigError, Error);
var NullArgumentError = (function () {
    function NullArgumentError(message) {
        this.name = "NullArgumentError";
        this.message = message;
        var er = Error;
        er.captureStackTrace(this, InvalidArgumentError);
    }
    return NullArgumentError;
})();
exports.NullArgumentError = NullArgumentError;
require('util').inherits(NullArgumentError, Error);
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
require('util').inherits(InvalidArgumentError, Error);
//# sourceMappingURL=CustomErrors.js.map
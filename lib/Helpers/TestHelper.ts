import errors = require("../CustomErrors");

export function nullErrorTest(test: nodeunit.Test, fnc: () => void) {

  var errorType = new errors.NullArgumentError();
  errorTest(test, errorType, fnc);
}

export function invalidArgumentErrorTest(test: nodeunit.Test, fnc: () => void) {

  var errorType = new errors.InvalidArgumentError();
  errorTest(test, errorType, fnc);
}

export function badConfigErrorTest(test: nodeunit.Test, fnc: () => void) {

  var errorType = new errors.BadConfigError();
  errorTest(test, errorType, fnc);
}

export function errorTest(test: nodeunit.Test, errorType: Error, fnc: () => void) {

  try {
    fnc();
    test.equal(1, 0, "an error should have occurred");
  } catch (e) {
    test.equal(e.name, errorType.name, "received wrong error: " + e.name + ":" + e.message);
  }

} 
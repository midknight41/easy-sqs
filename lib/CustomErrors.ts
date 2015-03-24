import utils = require('util');

export class BadConfigError implements Error {
  public name: string = "BadConfigError";
  public message: string;

  constructor(message?: string) {
    this.message = message;
    var er:any = Error;
    er.captureStackTrace(this, BadConfigError);
  }
}

utils.inherits(BadConfigError, Error);

export class NullOrEmptyArgumentError implements Error {
  public name: string = "NullOrEmptyArgumentError";
  public message: string;

  constructor(message?: string) {
    this.message = message;

    var er: any = Error;
    er.captureStackTrace(this, InvalidArgumentError);
    
  }

}

utils.inherits(NullOrEmptyArgumentError, Error);

export class InvalidArgumentError implements Error {
  public name: string = "InvalidArgumentError";
  public message: string;

  constructor(message?: string) {
    this.message = message;

    var er: any = Error;
    er.captureStackTrace(this, InvalidArgumentError);
  }

}

utils.inherits(InvalidArgumentError, Error);  
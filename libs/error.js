class BadRequest extends Error {
  constructor(message) {
    super(message);
  }
}

class NotFound extends Error {
  constructor(message) {
    super(message);
  }
}

class NoContent extends Error {
  constructor(message) {
    super(message);
  }
}

class Conflict extends Error {
  constructor(message) {
    super(message);
  }
}

class InternalServerError extends Error {
  constructor(message) {
    super(message);
  }
}

class Forbidden extends Error {
  constructor(message) {
    super(message);
  }
}

class Unauthorized extends Error {
  constructor(message) {
    super(message);
  }
}

module.exports = {
  BadRequest,
  NotFound,
  Conflict,
  InternalServerError,
  NoContent,
  Forbidden,
  Unauthorized,
};

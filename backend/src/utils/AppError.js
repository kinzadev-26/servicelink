// An error we throw on purpose, with the HTTP status code to send back.
export class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

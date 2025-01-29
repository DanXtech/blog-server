class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // Call the parent class constructor
    this.code = errorCode; // Add a custom property
  }
}
export default HttpError;

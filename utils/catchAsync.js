module.exports = (fn) => {
  // the fn is an asynchronous function and it an asynchronous function returns promises. and when there is an error is an asynchronous function, that means that the promise gets rejected. we can catch the error
  return (req, res, next) => {
    // the next in the catch will be called with the error sent to the catch
    fn(req, res, next).catch(next);
  };
};

export function promisify(fn, context, ...args) {
  return new Promise((resolve, reject) => {
    fn.call(context, ...args, (...cbArgs) => {
      // If only 1 callback arg, resolve with the value; otherwise, array
      if (cbArgs.length <= 1) {
        resolve(cbArgs[0]);
      } else {
        resolve(cbArgs);
      }
    });
  });
}

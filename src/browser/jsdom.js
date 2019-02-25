export function JSDOM() {
  throw new Error('Only DOM elements are supported in a browser environment');
}

JSDOM.fromFile = function() {
  return Promise.reject(
    new Error('Only DOM elements are supported in a browser environment')
  );
};

JSDOM.fromURL = function() {
  return Promise.reject(
    new Error('Only DOM elements are supported in a browser environment')
  );
};

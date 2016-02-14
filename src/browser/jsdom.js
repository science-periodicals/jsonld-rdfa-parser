var jsdom = {
  env: function (config) {
    if (config.done) {
      config.done(new Error('only DOM elements are supported in a browser environment'));
    }
  }
}

export default jsdom;

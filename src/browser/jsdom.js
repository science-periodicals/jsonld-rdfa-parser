let jsdom = {
  env: (config) => {
    if (config.done) {
      config.done(new Error('Only DOM elements are supported in a browser environment'));
    }
  },
};

export default jsdom;

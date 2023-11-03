module.exports = {
  root: true,
  extends: ['prettier'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    babelOptions: {
      parserOpts: {
        plugins: ['jsx'],
      },
    },
  },
};

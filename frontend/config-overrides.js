const { overrideDevServer } = require('customize-cra');

module.exports = {
  devServer: overrideDevServer((config) => {
    config.allowedHosts = 'all'; // Permet tous les hôtes
    return config;
  }),
};
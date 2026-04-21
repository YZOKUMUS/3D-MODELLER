const base = require('./app.json');

/**
 * Keep `experiments.baseUrl` for web exports (GitHub Pages),
 * but avoid setting it for native builds because Android resource
 * names must start with a letter.
 */
module.exports = () => {
  const expo = { ...base.expo };

  const isWebBuild = process.env.EAS_BUILD_PLATFORM === 'web';
  const baseUrl = '/3D-MODELLER/';

  expo.experiments = { ...(expo.experiments ?? {}) };
  if (isWebBuild) {
    expo.experiments.baseUrl = baseUrl;
  } else {
    delete expo.experiments.baseUrl;
  }

  return { expo };
};


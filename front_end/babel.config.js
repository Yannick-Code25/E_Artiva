module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // plugins: [
    //   // Requis pour que expo-router fonctionne correctement.
    //   'expo-router/babel',
    // ],
  };
};
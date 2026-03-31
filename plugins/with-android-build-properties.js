const { withGradleProperties } = require('@expo/config-plugins');

function setGradleProperty(items, key, value) {
  const existing = items.find((item) => item.type === 'property' && item.key === key);

  if (existing) {
    existing.value = String(value);
    return items;
  }

  items.push({
    type: 'property',
    key,
    value: String(value),
  });

  return items;
}

module.exports = function withAndroidBuildProperties(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults;

    setGradleProperty(properties, 'android.minSdkVersion', 24);
    setGradleProperty(properties, 'android.targetSdkVersion', 35);
    setGradleProperty(properties, 'android.compileSdkVersion', 35);

    config.modResults = properties;
    return config;
  });
};

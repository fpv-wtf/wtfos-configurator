const isLinux = () => {
  const platform = window.navigator?.userAgentData?.platform || window.navigator.platform;

  return /Linux/.test(platform);
};

export {
  isLinux,
};

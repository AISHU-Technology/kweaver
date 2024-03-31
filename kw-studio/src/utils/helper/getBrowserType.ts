const getBrowserType = (userAgent?: any) => {
  // 获取浏览器 userAgent
  const ua: any = userAgent || navigator.userAgent;

  // 是否为 Opera
  const isOpera = ua.indexOf('Opera') > -1;
  // 返回结果
  if (isOpera) {
    return 'Opera';
  }

  // 是否为 IE
  const isIE = ua.indexOf('compatible') > -1 && ua.indexOf('MSIE') > -1 && !isOpera;
  const isIE11 = ua.indexOf('Trident') > -1 && ua.indexOf('rv:11.0') > -1;
  // 返回结果
  if (isIE11) {
    return 'IE11';
  } else if (isIE) {
    // 检测是否匹配
    const re = new RegExp('MSIE (\\d+\\.\\d+);');
    re.test(ua);
    // 获取版本
    const ver = parseFloat(RegExp.$1);
    // 返回结果
    if (ver === 7) {
      return 'IE7';
    } else if (ver === 8) {
      return 'IE8';
    } else if (ver === 9) {
      return 'IE9';
    } else if (ver === 10) {
      return 'IE10';
    }
    return 'IE';
  }

  // 是否为 Edge
  const isEdge = ua.indexOf('Edge') > -1;
  // 返回结果
  if (isEdge) {
    return 'Edge';
  }

  // 是否为 Firefox
  const isFirefox = ua.indexOf('Firefox') > -1;
  // 返回结果
  if (isFirefox) {
    return 'Firefox';
  }

  // 是否为 Safari
  const isSafari = ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1;
  // 返回结果
  if (isSafari) {
    return 'Safari';
  }

  // 是否为 Chrome
  const isChrome = ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1 && ua.indexOf('Edge') === -1;
  // 返回结果
  if (isChrome) {
    return 'Chrome';
  }

  // 是否为 UC
  const isUC = ua.indexOf('UBrowser') > -1;
  // 返回结果
  if (isUC) {
    return 'UC';
  }

  // 是否为 QQ
  const isQQ = ua.indexOf('QQBrowser') > -1;
  // 返回结果
  if (isQQ) {
    return 'QQ';
  }

  // 都不是
  return '';
};

export default getBrowserType;

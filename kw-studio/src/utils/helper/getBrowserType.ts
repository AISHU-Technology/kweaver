const getBrowserType = (userAgent?: any) => {
  const ua: any = userAgent || navigator.userAgent;
  const isOpera = ua.indexOf('Opera') > -1;
  if (isOpera) {
    return 'Opera';
  }

  const isIE = ua.indexOf('compatible') > -1 && ua.indexOf('MSIE') > -1 && !isOpera;
  const isIE11 = ua.indexOf('Trident') > -1 && ua.indexOf('rv:11.0') > -1;
  if (isIE11) {
    return 'IE11';
  } else if (isIE) {
    const re = new RegExp('MSIE (\\d+\\.\\d+);');
    re.test(ua);
    const ver = parseFloat(RegExp.$1);
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

  const isEdge = ua.indexOf('Edge') > -1;
  if (isEdge) {
    return 'Edge';
  }

  const isFirefox = ua.indexOf('Firefox') > -1;
  if (isFirefox) {
    return 'Firefox';
  }

  const isSafari = ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1;
  if (isSafari) {
    return 'Safari';
  }

  const isChrome = ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1 && ua.indexOf('Edge') === -1;
  if (isChrome) {
    return 'Chrome';
  }

  const isUC = ua.indexOf('UBrowser') > -1;
  if (isUC) {
    return 'UC';
  }

  const isQQ = ua.indexOf('QQBrowser') > -1;
  if (isQQ) {
    return 'QQ';
  }

  return '';
};

export default getBrowserType;

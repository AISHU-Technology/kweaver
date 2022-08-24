/**
 * 修改`url`的格式为：`/api/xxx?nonce=xxx&timestamp=xxx&_id=ar&signature=xxx`
 * 数字签名算法：`signature = base64(hexMd5(base64(url)))`
 */
const changeUrl = url => {
  if (url.indexOf('?') !== -1) {
    return `${url}&timestamp=${+new Date()}`;
  }

  return `${url}?timestamp=${+new Date()}`;
};

export default changeUrl;

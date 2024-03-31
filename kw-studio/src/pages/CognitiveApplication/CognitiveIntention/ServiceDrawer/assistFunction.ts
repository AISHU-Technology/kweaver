import intl from 'react-intl-universal';

const { origin } = window.location;
export const onGoLang = () =>
  `import (
   "crypto/hmac"
   "crypto/sha256"
   "encoding/base64"
   "encoding/hex"
)
//reqParams 请求体
//timestamp 时间戳
//appid 账号标识
func OpenAPISecret(reqParams, timestamp, appid string) string {
    hmac := hmac.New(sha256.New, []byte(appid))
    sha := sha256.New()
    sha.Write([]byte(timestamp))
    timestamp16str := hex.EncodeToString(sha.Sum(nil))
    sha.Reset()
    sha.Write([]byte(reqParams))
    reqParams16str := hex.EncodeToString(sha.Sum(nil))
    hmac.Write([]byte(timestamp16str))
    hmac.Write([]byte(reqParams16str))
    return base64.StdEncoding.EncodeToString([]byte(hex.EncodeToString(hmac.Sum(nil))))
}`;

export const onPython = () => `
import base64
import hashlib
import hmac
import time
 
def OpenAPI_Secret(timestamp=int(time.time()), reqParams="", appid=""):
    """
    :param appid: 账户appid
    :param reqParams: 请求参数
    :param timestamp: 10位时间戳
    :return:
    """
    _timestamp = hashlib.sha256(str(timestamp).encode("utf-8")).digest().hex().encode("utf-8")
    _reqParams = hashlib.sha256(reqParams.encode("utf-8")).digest().hex().encode("utf-8")
    shaStr = hmac.new(appid.encode("utf-8"), _timestamp + _reqParams, digestmod=hashlib.sha256).digest()
    return base64.b64encode(shaStr.hex().encode("utf-8"))
            `;

export const onPythonExample = () => `
if __name__ == '__main__':
    timestamp = int(time.time())
    appid = "Roiwehjgfr03457WMCI"
    reqParams = """{"query":"query {\n        kglist(page:-1) {\n            count\n            kglist {\n                id\n                name\n            }\n        }\n    }","variables":{}}"""
 
    appkey = OpenAPI_Secret(timestamp, reqParams, appid)
    header = {"appid": appid, "appkey": appkey, "timestamp": str(timestamp)}
    print(appkey)
    url = ${origin}/api/engine/v1/open/kg
    response = requests.post(url, verify=False, headers=header, data=reqParams)
    print(str(response.content))
              `;

export const onJava = () => `
package com.example.demo;
 
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
 
public class Sha256 {
 
    /**
     * 利用java原生的类实现SHA256加密
     *
     * @param str 加密前的报文
     * @return
     */
    public static String getSHA256(String str) {
        MessageDigest messageDigest;
        String encodestr = "";
        try {
            messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(str.getBytes("UTF-8"));
            encodestr = byte2Hex(messageDigest.digest());
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return encodestr;
    }
 
    /**
     * 将byte转为16进制
     *
     * @param bytes
     * @return
     */
    public static String byte2Hex(byte[] bytes) {
        StringBuffer stringBuffer = new StringBuffer();
        String temp = null;
        for (int i = 0; i < bytes.length; i++) {
            temp = Integer.toHexString(bytes[i] & 0xFF);
            if (temp.length() == 1) {
                //1获得一位的进行补0操做
                stringBuffer.append("0");
            }
            stringBuffer.append(temp);
        }
        return stringBuffer.toString();
    }
 
    /**
     * 生成appkey
     *
     * @param reqParams json格式body
     * @param timestamp 秒时间戳
     * @param appId     通过ADF管理界面获取
     * @return
     * @throws NoSuchAlgorithmException
     * @throws UnsupportedEncodingException
     * @throws InvalidKeyException
     */
    public static String appKey(String reqParams, String timestamp, String appId) throws NoSuchAlgorithmException, UnsupportedEncodingException, InvalidKeyException {
        String encodedReqParams = Sha256.getSHA256(reqParams);
        String encodedTimestamp = Sha256.getSHA256(timestamp);
        String secret = appId;
        String message = encodedTimestamp + encodedReqParams;
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes("utf-8"), "HmacSHA256");
        sha256_HMAC.init(secretKey);
        byte[] hash = sha256_HMAC.doFinal(message.getBytes("utf-8"));
        String encodeStr = Base64.getEncoder().encodeToString(Sha256.byte2Hex(hash).getBytes(StandardCharsets.UTF_8));
        return encodeStr;
    }
}
            `;
export const onDocument = () => `
Request header： 
   appkey=SHAresult   #${intl.get('cognitiveService.restAPI.appKeyDes')} 
   timestamp：1623312420   #${intl.get('cognitiveService.restAPI.keyDescription')}
   appid=Roiwehjgfr03457WMCI   #${intl.get('cognitiveService.restAPI.appidDes')}
          `;

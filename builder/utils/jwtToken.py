# -*-coding:utf-8-*-
import jwt
class jwtToken(object):
    def jwtencoded(self, req):
        encoded = jwt.encode(req, 'secret', algorithm='HS256')
        return encoded
    def jwtdecoded(self, req):
        decoded = jwt.decode(req, 'secret', algorithms=['HS256'])
        return decoded



jwt_token = jwtToken()
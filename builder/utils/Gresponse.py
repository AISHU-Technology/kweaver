# -*-coding:utf-8-*-
from flask import jsonify, Response,make_response
from werkzeug.datastructures import Headers

class Gresponse(Response):
    """
    http统一钩子方法
    """

    @classmethod
    def force_type(cls, response, environ=None):
        if isinstance(response, (list, dict)):
            response = jsonify(response)
        return super(Response, cls).force_type(response, environ)

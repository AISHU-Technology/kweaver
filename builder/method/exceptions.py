# -*- coding: utf-8 -*-

class KomException(Exception):
    def __init__(self, message, errors):
        import re
        _errorClass = message.split(" ")[0]
        err_sql = re.findall(r"(?<=: )[\S\s]*(?=\r\n)", message)[0]
        err_sql = re.sub(r"[\\]", " ", err_sql)

        x = {
            "OCommandSQLParsingException": OrientSqlException
        }

        # Override the exception Type with OrientDB exception map
        if _errorClass in x.keys():
            self.__class__ = x[_errorClass]

        Exception.__init__(self, err_sql)
        # errors is an array of tuple made this way:
        self.errors = errors

    def __str__(self):
        if self.errors:
            return "%s - %s" % (Exception.__str__(self), self.errors[0])
        else:
            return Exception.__str__(self)


class OrientSqlException(KomException):
    pass

# -*- coding:utf-8 -*-
from __future__ import (absolute_import, unicode_literals)
from flask_babel import gettext as _l

errDict = {
    'Builder.Dao.AsyncTaskDao.Update.ServerError': {
        "ErrorCode": "Builder.Dao.AsyncTaskDao.Update.ServerError",
        "Description": "Server Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.Dao.AsyncTaskDao.Update.SQLSyntaxError': {
        "ErrorCode": "Builder.Dao.AsyncTaskDao.Update.SQLSyntaxError",
        "Description": "SQL Syntax Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please contact the developers.")
    }
}

# -*- coding:utf-8 -*-
from __future__ import (absolute_import, unicode_literals)
from flask_babel import gettext as _l

errDict = {
    'Builder.GraphdbDao.GetPropertiesOrientdb.OrientdbRequestError': {
        "ErrorCode": "Builder.GraphdbDao.GetPropertiesOrientdb.OrientdbRequestError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether the OrientDB request information is correct.")  # 请检查OrientDB请求信息是否正确
    },
    'Builder.GraphdbDao.GetPropertiesNebula.NebulaExecError': {
        "ErrorCode": "Builder.GraphdbDao.GetPropertiesNebula.NebulaExecError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether the Nebula request information is correct.")  # 请检查Nebula请求信息是否正确
    },
    'Builder.GraphdbDao.Count.GraphDBConnectionError': {
        "ErrorCode": "Builder.GraphdbDao.Count.GraphDBConnectionError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether your GraphDB service is running normally.")
    },
    'Builder.GraphdbDao.Count.DBNameNotExitsError': {
        "ErrorCode": "Builder.GraphdbDao.Count.DBNameNotExitsError",
        "Description": "DB name:[db_name], graphdb_address: [graphdb_address], graphdb_port: [graphdb_port], graphdb_type: [graphdb_type]",
        "ErrorDetails": "DB name:[db_name], graphdb_address: [graphdb_address], graphdb_port: [graphdb_port], graphdb_type: [graphdb_type]",
        "Solution": _l("Please check whether your DB name is correct.")
    },
    'Builder.GraphdbDao.CountOrientdb.OrientdbRequestError': {
        "ErrorCode": "Builder.GraphdbDao.CountOrientdb.OrientdbRequestError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether the OrientDB request information is correct.")  # 请检查OrientDB请求信息是否正确
    },
    'Builder.GraphdbDao.CountNebula.NebulaExecError': {
        "ErrorCode": "Builder.GraphdbDao.CountNebula.NebulaExecError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether the Nebula request information is correct.")
    },
    'Builder.GraphdbDao.CheckSchemaNebula.NebulaExecError': {
        "ErrorCode": "Builder.GraphdbDao.CheckSchemaNebula.NebulaExecError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether the Nebula request information is correct.")
    },
}

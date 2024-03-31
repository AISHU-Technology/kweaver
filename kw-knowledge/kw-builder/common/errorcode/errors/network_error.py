# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.controller.knowledgeNetwork_controller.getAllKnw.ParamsError': {
        "ErrorCode": "Builder.controller.knowledgeNetwork_controller.getAllKnw.ParamsError",
        "Description": _l("Parameters Error!"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please check your parameters.")
    },
    'Builder.KnowledgeNetworkController.CreateServiceKnw.UnknownError': {
        "ErrorCode": "Builder.KnowledgeNetworkController.CreateServiceKnw.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[description]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.KnowledgeNetworkController.CreateServiceKnw.ParamsError': {
        "ErrorCode": "Builder.KnowledgeNetworkController.CreateServiceKnw.ParamsError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameters.")
    },
    'Builder.service.knw_service.knwService.getKnw.RequestError': {
        "ErrorCode": "Builder.service.knw_service.knwService.getKnw.RequestError",
        "Description": _l("[description]"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please check your parameters.")
    }
}

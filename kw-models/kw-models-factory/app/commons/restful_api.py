def get_model_restful_api_document(llm_id):
    api = {
        "openapi": "3.0.2",
        "info": {
            "title": "大语言模型服务",
            "version": "1.0.0",
            "description": "大语言模型服务RESTful API文档"
        },
        "paths": {
            "/api/model-factory/v1/llm-used/{}".format(llm_id): {
                "post": {
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/serviceReq"
                                },
                                "examples": {
                                    "request": {
                                        "value": {
                                            "ai_system": "",
                                            "ai_user": "",
                                            "ai_assistant": "",
                                            "ai_history": [
                                                {
                                                    "role": "ai",
                                                    "message": ""
                                                },
                                                {
                                                    "role": "human",
                                                    "message": ""
                                                }
                                            ],
                                            "top_p": 1,
                                            "temperature": 1,
                                            "max_token": 16,
                                            "frequency_penalty": 1,
                                            "presence_penalty": 1
                                        }
                                    }
                                }
                            }
                        },
                        "required": False
                    },
                    "tags": [
                        "LLM Service"
                    ],
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/ServiceUserTokenColumn"
                        },
                        {
                            "$ref": "#/components/parameters/ServiceUserTimeStampColumn"
                        },
                        {
                            "$ref": "#/components/parameters/ServiceUserAppKeyColumn"
                        }
                    ],
                    "responses": {
                        "200": {
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/LLMResp"
                                    },
                                    "examples": {
                                        "resp": {
                                            "value": {
                                                "res": "这是调用大预言模型的返回结果"
                                            }
                                        }
                                    }
                                }
                            },
                            "description": "ok"
                        },
                        "500": {
                            "$ref": "#/components/responses/RespStaSE500"
                        }
                    },
                    "summary": "大语言模型接口"
                }
            }
        },
        "components": {
            "schemas": {
                "serviceReq": {
                    "description": "使用服务请求体",
                    "type": "object",
                    "properties": {
                        "ai_system": {
                            "description": "系统角色",
                            "type": "string"
                        },
                        "ai_user": {
                            "description": "用户角色",
                            "type": "string"
                        },
                        "ai_assistant": {
                            "description": "助手角色",
                            "type": "string"
                        },
                        "ai_history": {
                            "description": "历史对话",
                            "type": "array",
                            "items": {}
                        },
                        "top_p": {
                            "description": "核采样",
                            "type": "number"
                        },
                        "temperature": {
                            "description": "随机性",
                            "type": "number"
                        },
                        "max_token": {
                            "description": "单次回复限制",
                            "type": "integer"
                        },
                        "frequency_penalty": {
                            "description": "频率惩罚度",
                            "type": "number"
                        },
                        "presence_penalty": {
                            "description": "话题新鲜度",
                            "type": "number"
                        }
                    }
                },
                "Error": {
                    "description": "接口调用错误信息基类，具体错误情况可查看字段ErrorDetails",
                    "required": [
                        "ErrorCode",
                        "Solution",
                        "Description",
                        "ErrorDetails",
                        "ErrorLink"
                    ],
                    "type": "object",
                    "properties": {
                        "Description": {
                            "description": "导致此错误的原因",
                            "type": "string"
                        },
                        "ErrorCode": {
                            "description": "业务错误码，'.' 字符前为微服务名， '.' 字符后为具体错误码",
                            "type": "string"
                        },
                        "Solution": {
                            "description": "解决错误办法",
                            "type": "string"
                        },
                        "ErrorLink": {
                            "description": "错误链接",
                            "type": "string"
                        },
                        "ErrorDetails": {
                            "description": "错误详情",
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "details": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "LLMResp": {
                    "description": "",
                    "required": [
                        "res"
                    ],
                    "type": "object",
                    "properties": {
                        "res": {
                            "description": "调用大模型结果",
                            "type": "object",
                            "properties": {
                                "time": {
                                    "description": "大模型生成结果的耗时",
                                    "type": "string"
                                },
                                "token_len": {
                                    "description": "大模型返回结果的token总数",
                                    "type": "integer"
                                },
                                "data": {
                                    "description": "调用提示词的返回结果",
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            },
            "responses": {
                "RespStaSE500": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Error"
                            },
                            "examples": {
                                "Err500": {
                                    "$ref": "#/components/examples/Status500"
                                }
                            }
                        }
                    },
                    "description": "Bad Request"
                }
            },
            "parameters": {
                "ServiceUserTokenColumn": {
                    "name": "appid",
                    "description": "appid: 用户登录AnyDATA 通过 /manager/v1/appid 获取的AnyDATA账户的APPID，用于数据科学家和开发者调用或者使用AnyDATA服务时的唯一标识",
                    "schema": {
                        "type": "string"
                    },
                    "in": "header",
                    "required": True
                },
                "ServiceUserTimeStampColumn": {
                    "name": "timestamp",
                    "description": "timestamp: 此时间戳的接受范围以AD的系统时间为基准，接受客户端的时间在AD的系统有效期为30分钟，误差时间15分钟",
                    "schema": {
                        "type": "string"
                    },
                    "in": "header",
                    "required": False
                },
                "ServiceUserAppKeyColumn": {
                    "name": "appkey",
                    "description": "appkey: 客户端使用特定的算法通过appid、时间戳和请求参数这三个参数生成的校验字符串，用于后端校验请求的合法性",
                    "schema": {
                        "type": "string"
                    },
                    "in": "header",
                    "required": False
                }
            },
            "examples": {
                "Status500": {
                    "summary": "请求参数错误",
                    "description": "以下原因均会导致该错误\n- 当前大模型不存在\n- 参数错误\n",
                    "value": {
                        "Description": "Parma Error",
                        "ErrorCode": "LLMUsed.ParameterError",
                        "ErrorDetails": "",
                        "Solution": "",
                        "ErrorLink": ""
                    }
                }
            }
        },
        "tags": [
            {
                "name": "LLM Service",
                "description": "大语言模型服务API"
            }
        ]
    }
    return api


def get_prompt_restful_api_document(prompt_id, var_dict, prompt):
    api = {
        "openapi": "3.0.2",
        "info": {
            "title": "提示词服务",
            "version": "1.0.0",
            "description": "提示词服务RESTful API文档"
        },
        "paths": {
            "/api/model-factory/v1/prompt/{}/used".format(prompt_id): {
                "post": {
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/serviceReq"
                                },
                                "examples": {
                                    "request": {
                                        "value": {
                                            "inputs": var_dict,
                                            "history_dia": [
                                                {
                                                    "role": "ai",
                                                    "message": ""
                                                },
                                                {
                                                    "role": "human",
                                                    "message": ""
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        "required": True
                    },
                    "tags": [
                        "Prompt Service"
                    ],
                    "parameters": [
                        {
                            "$ref": "#/components/parameters/ServiceUserTokenColumn"
                        },
                        {
                            "$ref": "#/components/parameters/ServiceUserTimeStampColumn"
                        },
                        {
                            "$ref": "#/components/parameters/ServiceUserAppKeyColumn"
                        }
                    ],
                    "responses": {
                        "200": {
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/PromptResp"
                                    },
                                    "examples": {
                                        "resp": {
                                            "value": {
                                                "res": {
                                                    "time": 1.4746403948576325,
                                                    "token_len": 1,
                                                    "data": "hello"
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            "description": "ok"
                        },
                        "500": {
                            "$ref": "#/components/responses/RespStaSE500"
                        }
                    },
                    "summary": "提示词工程接口",
                    "description": "您当前使用的提示词为：{}".format(prompt)
                }
            }
        },
        "components": {
            "schemas": {
                "serviceReq": {
                    "description": "使用服务请求体",
                    "type": "object",
                    "properties": {
                        "inputs": {
                            "description": "变量值",
                            "type": "object",
                            "items": {}
                        },
                        "history_dia": {
                            "description": "历史对话",
                            "type": "array",
                            "items": {}
                        }
                    }
                },
                "Error": {
                    "description": "接口调用错误信息基类，具体错误情况可查看字段ErrorDetails",
                    "required": [
                        "ErrorCode",
                        "Solution",
                        "Description",
                        "ErrorDetails",
                        "ErrorLink"
                    ],
                    "type": "object",
                    "properties": {
                        "Description": {
                            "description": "导致此错误的原因",
                            "type": "string"
                        },
                        "ErrorCode": {
                            "description": "业务错误码，'.' 字符前为微服务名， '.' 字符后为具体错误码",
                            "type": "string"
                        },
                        "Solution": {
                            "description": "解决错误办法",
                            "type": "string"
                        },
                        "ErrorLink": {
                            "description": "错误链接",
                            "type": "string"
                        },
                        "ErrorDetails": {
                            "description": "错误详情",
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "details": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "PromptResp": {
                    "description": "提示词服务响应结构体",
                    "required": [
                        "res"
                    ],
                    "type": "object",
                    "properties": {
                        "res": {
                            "description": "结果",
                            "type": "object",
                            "properties": {
                                "time": {
                                    "description": "大模型生成结果的耗时",
                                    "type": "string"
                                },
                                "token_len": {
                                    "description": "大模型返回结果的token总数",
                                    "type": "integer"
                                },
                                "data": {
                                    "description": "调用提示词的返回结果",
                                    "type": "string"
                                }
                            }
                        }
                    }
                }
            },
            "responses": {
                "RespStaSE500": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/Error"
                            },
                            "examples": {
                                "Err400": {
                                    "$ref": "#/components/examples/Status500"
                                }
                            }
                        }
                    },
                    "description": "Bad Request"
                }
            },
            "parameters": {
                "ServiceUserTokenColumn": {
                    "name": "appid",
                    "description": "appid: 用户登录AnyDATA 通过 /manager/v1/appid 获取的AnyDATA账户的APPID，用于数据科学家和开发者调用或者使用AnyDATA服务时的唯一标识",
                    "schema": {
                        "type": "string"
                    },
                    "in": "header",
                    "required": True
                },
                "ServiceUserTimeStampColumn": {
                    "name": "timestamp",
                    "description": "timestamp: 此时间戳的接受范围以AD的系统时间为基准，接受客户端的时间在AD的系统有效期为30分钟，误差时间15分钟",
                    "schema": {
                        "type": "string"
                    },
                    "in": "header",
                    "required": False
                },
                "ServiceUserAppKeyColumn": {
                    "name": "appkey",
                    "description": "appkey: 客户端使用特定的算法通过appid、时间戳和请求参数这三个参数生成的校验字符串，用于后端校验请求的合法性",
                    "schema": {
                        "type": "string"
                    },
                    "in": "header",
                    "required": False
                }
            },
            "examples": {
                "Status500": {
                    "summary": "请求参数错误",
                    "description": "以下原因均会导致该错误\n- 提示词变量输入异常\n- 历史信息字数超过限制\n- 当前prompt未发布\n",
                    "value": {
                        "Description": "Parma Error",
                        "ErrorCode": "PromptUsed.ParameterError",
                        "ErrorDetails": "",
                        "Solution": "",
                        "ErrorLink": ""
                    }
                }
            }
        },
        "tags": [
            {
                "name": "Prompt Service",
                "description": "提示词服务API"
            }
        ]
    }
    return api

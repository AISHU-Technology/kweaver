import json

from app.commons.user_info import user
from app.dao.model_dao import model_dao


def reshape_source(result, total):
    result = {
        "total": total,
        "data": [
            {
                "model_id": line["f_model_id"],
                "model_name": line["f_model_name"],
                "model_series": line["f_model_series"],
                "model": line["f_model"],
                "model_api": line["f_model_api"],
                "create_by": user(line["f_create_by"]) if line["f_create_by"] else '',
                "update_by": user(line["f_update_by"]) if line["f_create_by"] else '',
                "create_time": line["f_create_time"].strftime('%Y-%m-%d %H:%M:%S'),
                "update_time": line["f_update_time"].strftime('%Y-%m-%d %H:%M:%S')
            }
            for line in result
        ]
    }
    return {'res': result}


def reshape_check(result):
    result = {
        "res":
            {
                "model_id": line["f_model_id"],
                "model_series": line["f_model_series"],
                "model_name": line["f_model_name"],
                "model_config": json.loads(line["f_model_config"].replace("'", '"')),
                "model_url": line["f_model_url"]
            }
        for line in result
    }
    return result


async def reshape_param(param):
    result = list()
    data_list = model_dao.get_all_data_from_model_param()
    for line in param:
        series = {
            # 'model': line.f_model_series_name_us,
            'title': line["f_model_series_name_cn"],
            # 'subTitle': {
            #     'zh-CN': line.f_model_series_desc_cn,
            #     'en-US': line.f_model_series_desc_us
            # },
            'icon': line["f_model_icon"],
            'formData': []
        }
        for param_id in json.loads(line["f_model_param_id"].replace("'", '"')):
            # cell = model_dao.get_data_from_model_param_by_param_id(param_id)
            cell = []
            for item in data_list:
                if item["f_param_id"] == param_id:
                    cell.append(item)
                    break
            if cell == []:
                continue
            if cell[0]["f_param_field"] == "model_name":
                cell[0]["f_pattern"] = '^[-()_a-zA-Z0-9\u4e00-\u9fa5]+$'
            param = {
                'field': f'model_config.{cell[0]["f_param_field"]}',
                'component': cell[0]["f_box_component"],
                'type': cell[0]["f_param_type"],
                'label': {
                    'zh-CN': cell[0]["f_box_lab_cn"],
                    'en-US': cell[0]["f_box_lab_us"],
                },
                'placeholder': {
                    'zh-CN': cell[0]["f_box_mark_cn"],
                    'en-US': cell[0]["f_box_mark_us"],
                },
                'rules': [
                    {
                        'required': cell[0]["f_req"],
                        'message': {
                            'zh-CN': cell[0]["f_req_mes_cn"],
                            'en-US': cell[0]["f_req_mes_us"],
                        }
                    },
                    {
                        'max': cell[0]["f_max"],
                        'message': {
                            'zh-CN': cell[0]["f_max_mes_cn"],
                            'en-US': cell[0]["f_max_mes_us"],
                        }
                    },
                    {
                        'pattern': cell[0]["f_pattern"],
                        'message': {
                            'zh-CN': cell[0]["f_pat_mes_cn"],
                            'en-US': cell[0]["f_pat_mes_us"],
                        }
                    }
                ]
            }
            series['formData'].append(param)
        result.append({f"{line['f_model_series_name_cn']}": series})
    return {'res': result}


def key_value():
    order_list = {
        "asc": "",
        "desc": "-"
    }
    rule_dict = {
        "create_time": "f_create_time",
        "update_time": "f_update_time",
        "prompt_name": "f_prompt_name"
    }
    return order_list, rule_dict

def key_value_model():
    order_list = {
        "asc": "",
        "desc": "-"
    }
    rule_dict = {
        "create_time": "f_create_time",
        "update_time": "f_update_time",
        "model_name": "f_model_name"
    }
    return order_list, rule_dict




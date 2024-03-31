import json

import requests


# 获取用户名函数
def user(user_id):
    try:
        response = requests.get(f"http://kg-user-rbac:6900/api/rbac/v1/user?field=userId&value={user_id}")
        response = json.loads(response.text)
        response = response['res']
        user_name = response['username']
        return user_name
    except Exception:
        return ""

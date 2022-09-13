# !/usr/bin/env python
# -*- coding:utf-8 -*-

import requests, logging


logging.basicConfig(level=logging.INFO, format='%(levelname)s %(asctime)s %(filename)s:%(lineno)d %(message)s')
logger = logging.getLogger(__name__)


def get_as_file(as_cfg, gns_last_id, access_token):
    es_api_0 = '{}:{}/api/ecoindex/v1/index/{}/{}'
    url = es_api_0.format(as_cfg['ds_address'], as_cfg['ds_port'], gns_last_id, ",".join(as_cfg['key_list']))
    headers = {
        'Content-Type': 'application/json',
        "authorization": "Bearer {}".format(access_token)
    }

    try:
        res = requests.request('GET', url=url, headers=headers, timeout=5, verify=False)
    except requests.exceptions.ReadTimeout:
        logger.info('read time out error happened.')
        return ''

    text = []
    if res.status_code == 200:
        res = res.json()
        for key in as_cfg['key_list']:
            if key in res:
                if key == 'parent_path':
                    text.extend(res[key].split('/')[3:])
                else:
                    text.append(res[key])
    else:
        logger.info('fetch text failed - {}'.format(res.text))

    return '\n'.join(text)


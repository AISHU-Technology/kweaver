import type { FormInstance } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

/**
 * 判断json
 * @param data
 */
const isJson = (data: any) => {
  try {
    const value = JSON.parse(data);
    return Object.prototype.toString.call(value).slice(8, -1) === 'Object';
  } catch (err) {
    return false;
  }
};

/**
 * json模板
 */
const JSON_TEMP = {
  name: '合同',
  id: '100000001',
  auditOpinion: {
    taskName: '法律初审',
    remark: '同意',
    startTime: '2021‐01‐01'
  }
};

/**
 * 设置表单错误
 * @param form 表单实例
 * @param field { field: error }
 */
const setErrors = (form: FormInstance, field: Record<string, string>) => {
  _.entries(field).forEach(([key, value]) => {
    form.setFields([
      {
        name: key,
        errors: [value]
      }
    ]);
  });
};

/**
 * 测试链接报错
 */
const TEST_ERROR_CODES = {
  500002: { msg: 'datamanagement.incorrect', error: { ds_user: ' ', ds_password: ' ' } },
  500012: { status: 0, error: { ds_auth: intl.get('datamanagement.as7.needAuth') } },
  500013: { status: 0, error: { ds_auth: intl.get('datamanagement.as7.authTimeOut') } },
  500014: { msg: 'datamanagement.correctVhost', error: { vhost: ' ' } },
  500015: { msg: 'datamanagement.correctQueue', error: { queue: ' ' } },
  500016: { msg: 'datamanagement.as7.trueAddressAndPort', error: { ds_address: ' ', ds_port: ' ' } },
  'Studio.Graph.KnowledgeNetworkNotFoundError': { msg: 'datamanagement.notExist' }
};

export { isJson, JSON_TEMP, setErrors, TEST_ERROR_CODES };

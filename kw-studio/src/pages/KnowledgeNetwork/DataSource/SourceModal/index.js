/* eslint-disable max-lines */
/**
 * 新建/编辑数据源弹窗
 * @author Jason.ji
 * @date 2021/12/22
 *
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { Button, Input, Modal, Form, Select, message, ConfigProvider } from 'antd';
import {
  ExclamationCircleFilled,
  LoadingOutlined,
  SafetyOutlined,
  CheckCircleFilled,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';

import apiService from '@/utils/axios-http/oldIndex';
import servicesDataSource from '@/services/dataSource';
import ScrollBar from '@/components/ScrollBar';
import TrimmedInput from '@/components/TrimmedInput';
import UniversalModal from '@/components/UniversalModal';

import './style.less';
import classNames from 'classnames';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;
const STRUCTURED = 'structured'; // 结构化
const UNSTRUCTURED = 'unstructured'; // 非结构化
const STANDARDEXTRACTION = 'standardExtraction'; // 标准抽取
const MODELEXTRACTION = 'modelExtraction'; // 模型抽取
const LABELEXTRACTION = 'labelExtraction'; // 标注抽取
const MYSQL = 'mysql';
const HIVE = 'hive';
const AS = 'as7';
const AR = 'AnyRobot';
const MQ = 'rabbitmq';
const ODBC = 'odbc';
const SQLSERVER = 'odbc-sqlserver';
const KINGBASEES = 'odbc-kingbasees';
const KINGBASE = 'kingbasees';
const POSTGRESQL = 'postgresql';
const MYSQLODBC = 'odbc-mysql';
const ODBCPERFIX = 'odbc-';
const CONNTYPE = 'odbc';
const CLICKHOUSE = 'clickhouse';
const asReg =
  /^(?=^.{3,255}$)[a-zA-Z0-9][-_a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-_a-zA-Z0-9]{0,62})+$|^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
const ipv6Reg =
  /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}|:((:[\da−fA−F]1,4)1,6|:)|:((:[\da−fA−F]1,4)1,6|:)|^[\da-fA-F]{1,4}:((:[\da-fA-F]{1,4}){1,5}|:)|([\da−fA−F]1,4:)2((:[\da−fA−F]1,4)1,4|:)|([\da−fA−F]1,4:)2((:[\da−fA−F]1,4)1,4|:)|^([\da-fA-F]{1,4}:){3}((:[\da-fA-F]{1,4}){1,3}|:)|([\da−fA−F]1,4:)4((:[\da−fA−F]1,4)1,2|:)|([\da−fA−F]1,4:)4((:[\da−fA−F]1,4)1,2|:)|^([\da-fA-F]{1,4}:){5}:([\da-fA-F]{1,4})?|([\da−fA−F]1,4:)6:|([\da−fA−F]1,4:)6:/;
// 是否是json
const isJson = data => {
  try {
    const value = JSON.parse(data);

    return Object.prototype.toString.call(value).slice(8, -1) === 'Object';
  } catch (err) {
    return false;
  }
};

// json模板
const JsonPlace = {
  name: '合同',
  id: '100000001',
  auditOpinion: {
    taskName: '法律初审',
    remark: '同意',
    startTime: '2021‐01‐01'
  }
};

const originalOptions = [
  {
    id: MYSQL,
    value: MYSQL,
    label: 'MySQL'
  },
  {
    id: HIVE,
    value: HIVE,
    label: 'Hive'
  },
  {
    id: CLICKHOUSE,
    value: CLICKHOUSE,
    label: 'ClickHouse'
  },
  {
    id: POSTGRESQL,
    value: POSTGRESQL,
    label: `PostgreSQL ${intl.get('datamanagement.pgSql')}`
  },
  {
    id: KINGBASE,
    value: KINGBASE,
    label: `KingbaseES ${intl.get('datamanagement.king')}`
  },
  // {
  //   id: `${AS}-${STRUCTURED}`,
  //   value: `${AS}-${STRUCTURED}`,
  //   label: `AnyShare 7-${intl.get('datamanagement.structured')}`
  // },
  // {
  //   id: `${AS}-${UNSTRUCTURED}`,
  //   value: `${AS}-${UNSTRUCTURED}`,
  //   label: `AnyShare 7-${intl.get('datamanagement.unstructured')}`
  // },
  // {
  //   id: MQ,
  //   value: MQ,
  //   label: 'RabbitMQ'
  // },
  // {
  //   id: AR,
  //   value: AR,
  //   label: 'AnyRobot'
  // },
  {
    id: ODBC,
    value: ODBC,
    label: 'ODBC'
  }
];

const addedOptions = [
  {
    id: MYSQL,
    value: MYSQL,
    label: 'MySQL'
  },
  {
    id: HIVE,
    value: HIVE,
    label: 'Hive'
  },
  {
    id: CLICKHOUSE,
    value: CLICKHOUSE,
    label: 'ClickHouse'
  },
  {
    id: POSTGRESQL,
    value: POSTGRESQL,
    label: `PostgreSQL ${intl.get('datamanagement.pgSql')}`
  },
  {
    id: KINGBASE,
    value: KINGBASE,
    label: `KingbaseES ${intl.get('datamanagement.king')}`
  },
  // {
  //   id: `${AS}-${STRUCTURED}`,
  //   value: `${AS}-${STRUCTURED}`,
  //   label: `AnyShare 7-${intl.get('datamanagement.structured')}`
  // },
  // {
  //   id: `${AS}-${UNSTRUCTURED}`,
  //   value: `${AS}-${UNSTRUCTURED}`,
  //   label: `AnyShare 7-${intl.get('datamanagement.unstructured')}`
  // },
  // {
  //   id: MQ,
  //   value: MQ,
  //   label: 'RabbitMQ'
  // },
  // {
  //   id: AR,
  //   value: AR,
  //   label: 'AnyRobot'
  // },
  {
    id: ODBC,
    value: ODBC,
    label: 'ODBC'
  },
  {
    id: SQLSERVER,
    value: SQLSERVER,
    label: 'SQLServer (ODBC)'
  },
  {
    id: KINGBASEES,
    value: KINGBASEES,
    label: `KingbaseES (${intl.get('datamanagement.versionTip')})`
  },
  {
    id: MYSQLODBC,
    value: MYSQLODBC,
    label: 'MySQL (ODBC)'
  }
];

const SourceModal = props => {
  const { visible, handleCancel } = props;
  if (!visible) return null;
  const { operation, onSuccess, formInfo, selectKey } = props;
  const [form] = Form.useForm();
  const scrollRef = useRef(); // 绑定滚动条
  const [sourceType, setSourceType] = useState(MYSQL); // 选择的数据来源
  const [authStatus, setAuthStatus] = useState(0); // 认证状态 0/1/2 未认证/发送认证请求/认证成功
  const [testLoading, setTestLoading] = useState(false); // 测试loading
  const [saveLoading, setSaveLoading] = useState(false); // 保存loading
  const [dropVisible, setDropVisible] = useState(false); // 下拉框收起参数
  const dropRef = useRef(true); // 下拉框是否自动控制
  const [allOptions, setAllOptions] = useState(originalOptions); // 渲染源

  useEffect(() => {
    const { connect_type, data_source, dataType, ds_path } = formInfo;

    if (!data_source) return;
    const curSource =
      data_source === AS ? `${AS}-${dataType}` : connect_type === ODBC ? `${ODBC}-${data_source}` : data_source;

    const curDSPath = connect_type === ODBC ? ds_path.split('/')[0] : ds_path;
    const curDSSchema = connect_type === ODBC ? ds_path.split('/')[1] : '';

    form.setFieldsValue({ ...formInfo, data_source: curSource, ds_path: curDSPath, ds_schema: curDSSchema });
    form.setFields([{ name: 'ds_password', touched: false }]);
    setSourceType(curSource);
    operation === 'edit' && data_source === AS && setAuthStatus(2);
    connect_type === ODBC && setAllOptions(addedOptions);
  }, [formInfo, operation]);

  /**
   * 选择数据来源
   */
  const onSourceChange = value => {
    if (value === 'odbc') {
      form.setFieldsValue({
        data_source: sourceType
      });
      return;
    }
    form.resetFields(['ds_user', 'ds_password', 'ds_path', 'ds_address', 'ds_port', 'ds_auth']);
    form.setFieldsValue({
      extract_type: value.includes(UNSTRUCTURED) ? MODELEXTRACTION : STANDARDEXTRACTION,
      ds_port: value.includes(AS) ? '443' : ''
    });
    setSourceType(value);
    authStatus && setAuthStatus(0);
  };

  /**
   * 选择源
   */
  const onSourceSelect = value => {
    if (value === 'odbc') {
      if (allOptions.length > originalOptions.length) {
        setAllOptions(originalOptions);
      } else {
        setAllOptions(addedOptions);
      }
      dropRef.current = false;
    } else {
      dropRef.current = true;
    }
  };

  /**
   * 下拉菜单收起控制
   */
  const onDropdownVisible = value => {
    const odbcOption = document.getElementsByClassName('ant-select-item-option-content')[5];

    if (_.isEmpty(odbcOption)) {
      if (!dropRef.current) {
        return;
      }
      setDropVisible(value);
      return;
    }
    document.addEventListener('click', () => {
      dropRef.current = true;
    });
    odbcOption?.addEventListener('click', () => {
      setDropVisible(true);
      dropRef.current = false;
    });

    if (!dropRef.current) {
      return;
    }
    setDropVisible(value);
    // dropRef.current = value;
  };

  /**
   * 密码置空
   */
  const passwordFocus = () => {
    if ((operation === 'edit' || operation === 'copy') && !form.isFieldTouched('ds_password')) {
      form.setFieldsValue({ ds_password: '' });
    }
  };

  /**
   * as认证
   */
  const goAuth = async () => {
    const ip = form.getFieldValue('ds_address') || '';
    const key = form.getFieldValue('ds_auth') || '';
    const ipError = form.getFieldError('ds_address') || [];

    const port = form.getFieldValue('ds_port') || '';
    const portError = form.getFieldError('ds_port') || [];

    if (!ip) {
      form.setFields([
        {
          name: 'ds_address',
          errors: [intl.get('datamanagement.as7.inputAddress')]
        }
      ]);
    }

    if (!port) {
      form.setFields([
        {
          name: 'ds_port',
          errors: [intl.get('datamanagement.as7.inputPort')]
        }
      ]);
    }

    if (ip && ipError.length <= 0 && port && portError.length <= 0) {
      const response = await servicesDataSource.asAuthGet(ip, port, key);

      const { res, Code } = response || {};

      if (res !== undefined && !Code) {
        form.setFieldsValue({ ds_auth: res.ds_auth });
        setAuthStatus(1);
        form.setFields([
          {
            name: 'ds_auth',
            errors: []
          }
        ]);
        window.open(res.ds_url, '_blank');
      }

      if (Code && Code === 500011) {
        message.error(intl.get('datamanagement.as7.trueAddressAndPort'));
      }

      if (Code && Code === 500001) {
        message.error(response.Cause || response.message || '');
      }
    }
  };

  /**
   * 确认认证
   */
  const confirmAuth = async () => {
    setAuthStatus(2);
  };

  /**
   * 重新获取认证
   */
  const reauthorize = () => {
    setAuthStatus(1);
    goAuth();
  };

  /**
   * 测试连接错误处理
   * @param {Object} errInfo 错误信息
   */
  const showTestError = errInfo => {
    const { ErrorDetails } = errInfo;
    if (ErrorDetails) message.error(ErrorDetails);
  };

  /**
   * 测试链接
   */
  const onTest = async e => {
    e.preventDefault();

    form
      .validateFields()
      .then(async value => {
        let body = {};

        if (value.data_source.includes(AS)) {
          body = {
            ds_id: value.id || 0,
            data_source: AS,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port),
            ds_auth: value.ds_auth,
            ds_path: value.ds_path.replace(/(^\s*)|(\s*$)/g, ''),
            vhost: '',
            queue: '',
            connect_type: ''
          };
        } else if (value.data_source.includes(AR)) {
          body = {
            ds_id: value.id || 0,
            data_source:
              value.data_source.indexOf(ODBCPERFIX) > -1
                ? String(value.data_source).substring(ODBCPERFIX.length)
                : value.data_source,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port)
          };
        } else {
          body = {
            ds_id: value.id || 0,
            data_source:
              value.data_source.indexOf(ODBCPERFIX) > -1
                ? String(value.data_source).substring(ODBCPERFIX.length)
                : value.data_source,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port),
            ds_user: value.ds_user,
            ds_password: form.isFieldTouched('ds_password') ? btoa(value.ds_password) : value.ds_password,
            ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
            vhost: value.vhost || '',
            queue: value.queue || '',
            connect_type: value.data_source.indexOf(ODBCPERFIX) > -1 ? CONNTYPE : ''
          };
        }

        setTestLoading(true);

        const response = await servicesDataSource.sourceConnectTest(body);

        setTestLoading(false);

        if (response.res) {
          message.success(intl.get('datamanagement.testSuccessful'));

          if (body.data_source === AS) {
            setAuthStatus(2);
          }
        } else {
          showTestError(response);
        }
      })
      .catch(err => {});
  };

  /**
   * 保存
   */
  const onSave = async e => {
    e.preventDefault();

    form
      .validateFields()
      .then(async value => {
        let testBody = {};

        if (value.data_source.includes(AS)) {
          testBody = {
            ds_id: value.id || 0,
            data_source: AS,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port),
            ds_auth: value.ds_auth,
            ds_path: value.ds_path.replace(/(^\s*)|(\s*$)/g, ''),
            vhost: '',
            queue: '',
            connect_type: ''
          };
        } else if (value.data_source.includes(AR)) {
          testBody = {
            ds_id: value.id || 0,
            data_source:
              value.data_source.indexOf(ODBCPERFIX) > -1
                ? String(value.data_source).substring(ODBCPERFIX.length)
                : value.data_source,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port)
          };
        } else {
          testBody = {
            ds_id: value.id || 0,
            data_source:
              value.data_source.indexOf(ODBCPERFIX) > -1
                ? String(value.data_source).substring(ODBCPERFIX.length)
                : value.data_source,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port),
            ds_user: value.ds_user,
            ds_password: form.isFieldTouched('ds_password') ? btoa(value.ds_password) : value.ds_password,
            ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
            vhost: value.vhost || '',
            queue: value.queue || '',
            connect_type: value.data_source.indexOf(ODBCPERFIX) > -1 ? CONNTYPE : ''
          };
        }

        setSaveLoading(true);

        const resTest = await servicesDataSource.sourceConnectTest(testBody);

        if (resTest && resTest.res) {
          let body = {};

          if (value.data_source.includes(AS)) {
            body = {
              dsname: value.dsname,
              data_source: AS,
              dataType: value.extract_type === MODELEXTRACTION ? UNSTRUCTURED : STRUCTURED,
              ds_address: value.ds_address,
              ds_port: parseInt(value.ds_port),
              ds_auth: value.ds_auth,
              ds_path: value.ds_path.replace(/(^\s*)|(\s*$)/g, ''),
              extract_type: value.extract_type,
              vhost: '',
              queue: '',
              json_schema: '',
              connect_type: '',
              knw_id:
                window.sessionStorage.getItem('selectedKnowledgeId') &&
                parseInt(window.sessionStorage.getItem('selectedKnowledgeId'))
            };
          } else if (value.data_source.includes(AR)) {
            body = {
              dsname: value.dsname,
              data_source:
                value.data_source.indexOf(ODBCPERFIX) > -1
                  ? String(value.data_source).substring(ODBCPERFIX.length)
                  : value.data_source,
              dataType: STRUCTURED,
              ds_address: value.ds_address,
              ds_port: parseInt(value.ds_port),
              extract_type: STANDARDEXTRACTION,
              knw_id:
                window.sessionStorage.getItem('selectedKnowledgeId') &&
                parseInt(window.sessionStorage.getItem('selectedKnowledgeId'))
            };
          } else {
            body = {
              dsname: value.dsname,
              data_source:
                value.data_source.indexOf(ODBCPERFIX) > -1
                  ? String(value.data_source).substring(ODBCPERFIX.length)
                  : value.data_source,
              dataType: STRUCTURED,
              ds_address: value.ds_address,
              ds_port: parseInt(value.ds_port),
              ds_user: value.ds_user,
              ds_password: form.isFieldTouched('ds_password') ? btoa(value.ds_password) : value.ds_password,
              ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
              extract_type: STANDARDEXTRACTION,
              vhost: value.vhost || '',
              queue: value.queue || '',
              json_schema: value.json_schema || '',
              knw_id:
                window.sessionStorage.getItem('selectedKnowledgeId') &&
                parseInt(window.sessionStorage.getItem('selectedKnowledgeId')),
              connect_type: value.data_source.indexOf(ODBCPERFIX) > -1 ? CONNTYPE : ''
            };
          }

          // 发送请求, 新增 | 复制 | 编辑
          let res = {};

          if (operation === 'edit') {
            const fieldKey = value.data_source.includes(AS)
              ? ['data_source', 'dsname', 'ds_auth', 'ds_port', 'connect_type']
              : ['data_source', 'dsname', 'ds_user', 'ds_password', 'json_schema', 'connect_type'];
            const params = _.pick(body, fieldKey);
            res = await servicesDataSource.dataSourcePut(params, value.id);
          }

          if (operation === 'create') {
            res = await servicesDataSource.dataSourcePost(body);
          }

          if (operation === 'copy') {
            body.ds_id = selectKey;
            res = await servicesDataSource.postCopyDs(body);
          }

          // 结果处理
          if (res && res.res) {
            message.success(intl.get('datamanagement.savedSuccessfully'));
            onSuccess();
            handleCancel();
            return;
          }

          const { ErrorCode, Description, Code, Cause } = res || {};
          const curCode = ErrorCode || Code;
          const curDes = Description || Cause;

          if (!curCode) return;

          switch (true) {
            case curCode === '500403' || curCode === 'Manager.SoftAuth.UnknownServiceRecordError':
              message.error(intl.get('datamanagement.notAuth'));
              break;
            case curCode === 500002 ||
              curCode === 'Builder.service.dsm_Service.DsmService.addds.SameNameError' ||
              curCode === 'Builder.DsmService.Updata.SameNameError':
              form.setFields([
                {
                  name: 'dsname',
                  errors: [intl.get('datamanagement.alreadyUsed')]
                }
              ]);
              break;
            case curCode === 'Manager.Graph.AddDefaultPermissionError':
              message.error('datamanagement.addAuthError');
              break;
            case curCode === 500001 && curDes.includes('not exist'):
              message.error(intl.get('datamanagement.notExist'));
              break;
            default:
              curDes && message.error(curDes);
          }
        } else {
          showTestError(resTest);
        }
      })
      .catch(err => {})
      .finally(() => {
        setSaveLoading(false);
      });
  };

  /**
   * 保存或测试时更改表单，取消请求
   */
  const onFormChange = () => {
    if (!testLoading && !saveLoading) return;

    Object.keys(apiService.sources).forEach(key => {
      apiService.sources[key]('取消请求');
    });

    setTestLoading(false);
    setSaveLoading(false);
  };
  /**
   * 用户名置空
   */
  const userFocus = () => {
    if (!form.isFieldTouched('ds_user')) {
      form.setFieldsValue({ ds_user: '' });
    }
  };

  return (
    <UniversalModal
      title={intl.get(`datamanagement.${operation}`) + intl.get('datamanagement.dataSourceTitle')}
      className="data-source-modal"
      visible={visible}
      destroyOnClose
      focusTriggerAfterClose={false}
      width={640}
      maskClosable={false}
      footerData={
        <div>
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default test-btn" disabled={testLoading} onClick={onTest}>
              {testLoading ? (
                <>
                  <LoadingOutlined />
                  &nbsp;
                  {intl.get('datamanagement.testing')}
                </>
              ) : (
                intl.get('datamanagement.test')
              )}
            </Button>
            <Button type="primary" className="save-btn" disabled={saveLoading} onClick={onSave}>
              {saveLoading ? (
                <>
                  <LoadingOutlined />
                  &nbsp;
                  {intl.get('datamanagement.saving')}
                </>
              ) : (
                intl.get('datamanagement.save')
              )}
            </Button>
          </ConfigProvider>
        </div>
      }
      onCancel={() => handleCancel()}
    >
      <>
        {/* 表单 */}
        <div
          className="form-box"
          style={{
            height: sourceType === 'AnyRobot' ? 291 : 482,
            paddingBottom: sourceType === 'AnyRobot' && 6,
            marginBottom: sourceType !== 'AnyRobot' && 28
          }}
        >
          <ScrollBar
            ref={scrollRef}
            isshowx="false"
            color="rgb(184,184,184)"
            className={classNames({ 'scroll-box': sourceType === 'AnyRobot' })}
          >
            <div className="scroll-wrapper">
              <Form
                className="data-source-from"
                layout="vertical"
                form={form}
                initialValues={{
                  data_source: MYSQL,
                  extract_type: STANDARDEXTRACTION
                }}
                onValuesChange={onFormChange}
              >
                <FormItem name="id" style={{ display: 'none' }}>
                  <Input disabled={true} autoComplete="off" />
                </FormItem>

                {/* 数据源名 */}
                <div className="form-row">
                  <FormItem
                    name="dsname"
                    label={<span className="from-label">{intl.get('datamanagement.dataName')}</span>}
                    validateFirst
                    rules={[
                      { required: true, message: intl.get('datamanagement.empty') },
                      { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                      {
                        pattern: /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/,
                        message: intl.get('global.onlyKeyboard')
                      }
                    ]}
                  >
                    <Input autoComplete="off" placeholder={intl.get('datamanagement.pleaseDsname')} />
                  </FormItem>
                </div>

                {/* 数据来源 */}
                <div className="form-row">
                  <FormItem
                    name="data_source"
                    label={<span className="from-label">{intl.get('datamanagement.dataSource')}</span>}
                    validateFirst
                    rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
                  >
                    <Select
                      onChange={onSourceChange}
                      getPopupContainer={triggerNode => triggerNode.parentElement}
                      disabled={operation === 'edit'}
                      onSelect={onSourceSelect}
                      onDropdownVisibleChange={onDropdownVisible}
                      open={dropVisible}
                      optionLabelProp="label"
                    >
                      {allOptions &&
                        allOptions.map(item => (
                          <Option key={item.id} value={item.value} label={item.label}>
                            {item.value === 'odbc' ? (
                              allOptions.length > 10 ? (
                                <DownOutlined style={{ marginRight: '0.5em' }} />
                              ) : (
                                <RightOutlined style={{ marginRight: '0.5em' }} />
                              )
                            ) : null}
                            {item.value.indexOf(ODBCPERFIX) > -1 ? (
                              <span style={{ marginRight: '3.5em' }}></span>
                            ) : null}
                            {item.label}
                          </Option>
                        ))}
                    </Select>
                  </FormItem>
                </div>

                {/* as需要选择抽取方式 */}
                {sourceType.includes(AS) && (
                  <div className="form-row">
                    <FormItem
                      name="extract_type"
                      label={<span className="from-label">{intl.get('datamanagement.extractionMethod')}</span>}
                      validateFirst
                      rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
                    >
                      <Select
                        onChange={value => form.setFieldsValue({ extract_type: value })}
                        getPopupContainer={triggerNode => triggerNode.parentElement}
                        disabled={operation === 'edit' || sourceType === `${AS}-${UNSTRUCTURED}`}
                      >
                        {sourceType === `${AS}-${UNSTRUCTURED}` ? (
                          <Option value={MODELEXTRACTION}>{intl.get('datamanagement.modelExtraction')}</Option>
                        ) : (
                          <>
                            <Option value={STANDARDEXTRACTION}>{intl.get('datamanagement.standardExtraction')}</Option>
                            {/* <Option value={LABELEXTRACTION}>{intl.get('datamanagement.labelExtraction')}</Option>*/}
                          </>
                        )}
                      </Select>
                    </FormItem>
                  </div>
                )}

                <div className="form-row combo-row">
                  {/* 地址 */}
                  <FormItem
                    name="ds_address"
                    label={<span className="from-label">{intl.get('datamanagement.address')}</span>}
                    validateFirst
                    rules={[
                      { required: true, message: intl.get('datamanagement.empty') },
                      {
                        validator: async (rule, value) => {
                          if (value.indexOf('--') > -1) {
                            throw new Error(intl.get('datamanagement.correctAddress'));
                          }

                          const curValue =
                            sourceType.includes(AS) && value.slice(0, 8) === 'https://' ? value.slice(9) : value;

                          if (!asReg.test(curValue) && !ipv6Reg.test(curValue)) {
                            throw new Error(intl.get('datamanagement.correctAddress'));
                          }
                        }
                      }
                    ]}
                  >
                    <Input
                      disabled={operation === 'edit'}
                      autoComplete="off"
                      placeholder={intl.get('datamanagement.pleaseAddr')}
                    />
                  </FormItem>

                  {/* 端口 */}
                  <FormItem
                    name="ds_port"
                    label={<span className="from-label">{intl.get('datamanagement.port')}</span>}
                    validateFirst
                    rules={[
                      { required: true, message: intl.get('datamanagement.empty') },
                      {
                        pattern:
                          /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]{1}|6553[0-5])$/,
                        message: intl.get('datamanagement.correctPort')
                      }
                    ]}
                    getValueFromEvent={event => {
                      return event.target.value.replace(/\D/g, '');
                    }}
                  >
                    <Input
                      disabled={sourceType.includes(AS) ? false : operation === 'edit'}
                      autoComplete="off"
                      placeholder={intl.get('datamanagement.pleasePort')}
                    />
                  </FormItem>
                </div>

                {/* as的授权 */}
                {sourceType.includes(AS) && (
                  <div className="form-row">
                    <FormItem
                      name="ds_auth"
                      label={<span className="from-label">{intl.get('datamanagement.as7.auth')}</span>}
                      rules={[{ required: true, message: intl.get('datamanagement.as7.needAuth') }]}
                    >
                      {authStatus === 0 ? (
                        <Button className="ant-btn-default auth-button-0" onClick={goAuth}>
                          <SafetyOutlined />
                          {intl.get('datamanagement.as7.getAuth')}
                        </Button>
                      ) : (
                        <div>
                          <Button
                            className={`ant-btn-default ${authStatus === 1 ? 'auth-button-1' : 'auth-button-2'}`}
                            onClick={confirmAuth}
                          >
                            <CheckCircleFilled style={{ color: '#52C41A' }} />
                            {intl.get('datamanagement.as7.authed')}
                          </Button>
                          <Button className="ant-btn-default reauthorize-button" onClick={reauthorize}>
                            <ExclamationCircleFilled style={{ color: '#FAAD14' }} />
                            {intl.get('datamanagement.as7.reAuth')}
                          </Button>
                        </div>
                      )}
                    </FormItem>
                  </div>
                )}

                {/* RabbitMQ队列名和Vhost */}
                {sourceType === MQ && (
                  <div className="form-row combo-row">
                    {/* vhost */}
                    <FormItem
                      name="vhost"
                      label={<span className="from-label">{'Vhost'}</span>}
                      validateFirst
                      rules={[
                        { required: true, message: intl.get('datamanagement.empty') },
                        {
                          pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                          message: intl.get('workflow.basic.nameConsists')
                        }
                      ]}
                    >
                      <Input
                        disabled={operation === 'edit'}
                        autoComplete="off"
                        placeholder={intl.get('datamanagement.pleaseVhost')}
                      />
                    </FormItem>

                    {/* 队列名 */}
                    <FormItem
                      name="queue"
                      label={<span className="from-label">{intl.get('datamanagement.queue')}</span>}
                      validateFirst
                      rules={[
                        { required: true, message: intl.get('datamanagement.empty') },
                        {
                          pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                          message: intl.get('workflow.basic.nameConsists')
                        }
                      ]}
                    >
                      <Input
                        disabled={operation === 'edit'}
                        autoComplete="off"
                        placeholder={intl.get('datamanagement.pleaseQueue')}
                      />
                    </FormItem>
                  </div>
                )}

                {/* mysql, hive, rabbitmq, odbc 存在用户名密码输入框 */}
                {[MYSQL, HIVE, MQ, SQLSERVER, MYSQLODBC, KINGBASEES, KINGBASE, POSTGRESQL, CLICKHOUSE].includes(
                  sourceType
                ) && (
                  <div className="form-row combo-row">
                    {/* 兼容safari，去除记住用户名功能 */}
                    <Form.Item style={{ display: 'none' }}>
                      <Input onFocus={userFocus} autoComplete="off" />
                    </Form.Item>
                    {/* 兼容safari，去除记住密码功能 */}
                    <FormItem style={{ display: 'none' }}>
                      <Input type="password" onFocus={passwordFocus} autoComplete="off" />
                    </FormItem>
                    <FormItem
                      name="ds_user"
                      label={<span className="from-label">{intl.get('datamanagement.userName')}</span>}
                      validateFirst
                      rules={[
                        { required: true, message: intl.get('datamanagement.empty') },
                        {
                          pattern: /^[^\s]*$/,
                          message: intl.get('datamanagement.illegalCharacters')
                        }
                      ]}
                    >
                      <Input
                        autoComplete="off"
                        onFocus={userFocus}
                        placeholder={intl.get('datamanagement.pleaseUser')}
                      />
                    </FormItem>

                    <FormItem
                      name="ds_password"
                      label={<span className="from-label">{intl.get('datamanagement.password')}</span>}
                      validateFirst
                      rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
                    >
                      <Input
                        type="password"
                        onFocus={passwordFocus}
                        autoComplete="off"
                        placeholder={intl.get('datamanagement.pleasePass')}
                      />
                    </FormItem>
                  </div>
                )}

                {/* mysql, hive, as7, odbc存在路径字段 */}
                {([MYSQL, HIVE, SQLSERVER, MYSQLODBC, KINGBASEES, KINGBASE, POSTGRESQL, CLICKHOUSE].includes(
                  sourceType
                ) ||
                  sourceType.includes(AS)) &&
                  ([MYSQL, HIVE, SQLSERVER, MYSQLODBC, CLICKHOUSE].includes(sourceType) || sourceType.includes(AS) ? (
                    <div className="form-row">
                      <FormItem
                        name="ds_path"
                        label={
                          <span className="from-label">
                            {sourceType.includes(AS)
                              ? intl.get('datamanagement.path')
                              : intl.get('datamanagement.database')}
                          </span>
                        }
                        validateFirst
                        rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
                      >
                        {operation === 'edit' && navigator.userAgent.indexOf('Edge') > -1 ? (
                          <div className="disabled-input-out">
                            <div className="disabled-input-in">{form.getFieldValue('ds_path')}</div>
                          </div>
                        ) : (
                          <Input
                            disabled={operation === 'edit'}
                            autoComplete="off"
                            placeholder={
                              sourceType.includes(AS)
                                ? intl.get('datamanagement.pleasePath')
                                : intl.get('datamanagement.pleaseDatabase')
                            }
                          />
                        )}
                      </FormItem>
                    </div>
                  ) : (
                    <div className="form-row">
                      <FormItem
                        name="ds_path"
                        label={<span className="from-label">{intl.get('datamanagement.database')}</span>}
                        validateFirst
                        rules={[{ required: true, message: intl.get('datamanagement.empty') }]}
                      >
                        {operation === 'edit' && navigator.userAgent.indexOf('Edge') > -1 ? (
                          <div className="disabled-input-out">
                            <div className="disabled-input-in">{form.getFieldValue('ds_path')}</div>
                          </div>
                        ) : (
                          <Input
                            disabled={operation === 'edit'}
                            autoComplete="off"
                            placeholder={intl.get('datamanagement.pleaseDatabase')}
                          />
                        )}
                      </FormItem>
                    </div>
                  ))}

                {/* rabbitmq的json模板 */}
                {sourceType === MQ && (
                  <div className="form-row form-textarea">
                    <div className="key-tip">
                      <ExclamationCircleFilled className="warn-icon" />
                      <span>{intl.get('datamanagement.jsonTip')}</span>
                    </div>
                    <FormItem
                      name="json_schema"
                      label={<span className="from-label">{intl.get('datamanagement.jsonSchema')}</span>}
                      validateFirst
                      validateTrigger={['onChange', 'onSubmit']}
                      rules={[
                        { required: true, validateTrigger: 'onChange', message: intl.get('datamanagement.empty') },
                        {
                          validateTrigger: 'onSubmit',
                          validator: async (rule, value) => {
                            if (!isJson(value) || (isJson(value) && value.replace(/[\s\n\r]/g, '') === '{}')) {
                              throw new Error(intl.get('datamanagement.formatErr'));
                            }
                          }
                        }
                      ]}
                    >
                      <TextArea placeholder={`${JSON.stringify(JsonPlace, null, 4)}`} />
                    </FormItem>
                  </div>
                )}
              </Form>
            </div>
          </ScrollBar>
        </div>

        {/* 底部按钮 */}
        {/* <UniversalModal.Footer
        source={
          <div>
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default test-btn" disabled={testLoading} onClick={onTest}>
                {testLoading ? (
                  <>
                    <LoadingOutlined />
                    &nbsp;
                    {intl.get('datamanagement.testing')}
                  </>
                ) : (
                  intl.get('datamanagement.test')
                )}
              </Button>
              <Button type="primary" className="save-btn" disabled={saveLoading} onClick={onSave}>
                {saveLoading ? (
                  <>
                    <LoadingOutlined />
                    &nbsp;
                    {intl.get('datamanagement.saving')}
                  </>
                ) : (
                  intl.get('datamanagement.save')
                )}
              </Button>
            </ConfigProvider>
          </div>
        }
      /> */}
      </>
    </UniversalModal>
  );
};

SourceModal.defaultProps = {
  visible: false,
  operation: 'create',
  formInfo: {},
  selectKey: '',
  handleCancel: () => {},
  onSuccess: () => {}
};

export default memo(SourceModal);

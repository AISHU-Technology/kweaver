/* eslint-disable max-lines */
/**
 * 新建/编辑数据源弹窗
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { Button, Input, Modal, Form, Select, message, ConfigProvider } from 'antd';
import { ExclamationCircleFilled, LoadingOutlined, SafetyOutlined, CheckCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import apiService from '@/utils/axios-http';
import servicesDataSource from '@/services/dataSource';
import ScrollBar from '@/components/ScrollBar';
import { isJson, JSON_TEMP, setErrors, TEST_ERROR_CODES } from './assistFunction';
import './style.less';

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;
const STRUCTURED = 'structured'; // 结构化
const UNSTRUCTURED = 'unstructured'; // 非结构化
const STANDARD_EXTRACTION = 'standardExtraction'; // 标准抽取
const MODEL_EXTRACTION = 'modelExtraction'; // 模型抽取
const LABEL_EXTRACTION = 'labelExtraction'; // 标注抽取
const MYSQL = 'mysql';
const HIVE = 'hive';
const AS = 'as7';
const MQ = 'rabbitmq';
const asReg =
  /^(?=^.{3,255}$)[a-zA-Z0-9][-_a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-_a-zA-Z0-9]{0,62})+$|^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;

const ModalContent = props => {
  const { operation, onSuccess, handleCancel, formInfo, selectKey } = props;
  const [form] = Form.useForm();
  const scrollRef = useRef(); // 绑定滚动条
  const [sourceType, setSourceType] = useState(MYSQL); // 选择的数据来源
  const [authStatus, setAuthStatus] = useState(0); // 认证状态 0/1/2 未认证/发送认证请求/认证成功
  const [testLoading, setTestLoading] = useState(false); // 测试loading
  const [saveLoading, setSaveLoading] = useState(false); // 保存loading

  useEffect(() => {
    const { data_source, dataType } = formInfo;
    if (!data_source) return;
    const curSource = data_source === AS ? `${AS}-${dataType}` : data_source;

    form.setFieldsValue({ ...formInfo, data_source: curSource });
    form.setFields([{ name: 'ds_password', touched: false }]);
    setSourceType(curSource);
    operation === 'edit' && data_source === AS && setAuthStatus(2);
  }, [formInfo, operation]);

  /**
   * 选择数据来源
   */
  const onSourceChange = value => {
    form.resetFields(['ds_user', 'ds_password', 'ds_path', 'ds_address', 'ds_port', 'ds_auth']);
    form.setFieldsValue({
      extract_type: value.includes(UNSTRUCTURED) ? MODEL_EXTRACTION : STANDARD_EXTRACTION,
      ds_port: value.includes(AS) ? '443' : ''
    });
    setSourceType(value);
    authStatus && setAuthStatus(0);
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

    !ip && setErrors(form, { ds_address: intl.get('datamanagement.as7.inputAddress') });
    !port && setErrors(form, { ds_port: intl.get('datamanagement.as7.inputPort') });

    if (ip && !ipError.length && port && !portError.length) {
      try {
        const { res, Code, Cause } = (await servicesDataSource.asAuthGet(ip, port, key)) || {};

        if (res) {
          form.setFieldsValue({ ds_auth: res.ds_auth });
          setAuthStatus(1);
          setErrors(form, { ds_auth: '' });
          window.open(res.ds_url, '_blank');
        }

        Code === 500011
          ? message.error(intl.get('datamanagement.as7.trueAddressAndPort'))
          : Cause && message.error(Cause);
      } catch {
        return 0;
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
   * @param {Object} errInfo 后端错误信息
   */
  const showTestError = errInfo => {
    const { Code, Cause } = errInfo || {};
    const errData = TEST_ERROR_CODES[Code];

    if (!errData) {
      Cause && message.error(Cause);
      return;
    }

    const { msg, error, status } = errData;
    msg && message.error(intl.get(msg));
    error && setErrors(form, error);
    typeof status === 'number' && setAuthStatus(status);
  };

  /**
   * 测试链接
   */
  const onTest = async e => {
    e.preventDefault();

    form
      .validateFields()
      .then(async value => {
        const isAs = value.data_source.includes(AS);
        const body = {
          ds_id: value.id || 0,
          data_source: isAs ? AS : value.data_source,
          ds_address: value.ds_address,
          ds_port: parseInt(value.ds_port),
          ds_auth: value.ds_auth,
          ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
          vhost: value.vhost || '',
          queue: value.queue || '',
          ds_user: isAs ? undefined : value.ds_user,
          ds_password: isAs
            ? undefined
            : form.isFieldTouched('ds_password')
            ? window.btoa(value.ds_password)
            : value.ds_password
        };
        setTestLoading(true);
        const res = await servicesDataSource.sourceConnectTest(body);
        setTestLoading(false);

        if (res?.res) {
          message.success(intl.get('datamanagement.testSuccessful'));
          isAs && setAuthStatus(2);
        }

        showTestError(res);
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
        const isAs = value.data_source.includes(AS);
        const testBody = {
          ds_id: value.id || 0,
          data_source: isAs ? AS : value.data_source,
          ds_address: value.ds_address,
          ds_port: parseInt(value.ds_port),
          ds_auth: value.ds_auth,
          ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
          vhost: value.vhost || '',
          queue: value.queue || '',
          ds_user: isAs ? undefined : value.ds_user,
          ds_password: isAs
            ? undefined
            : form.isFieldTouched('ds_password')
            ? window.btoa(value.ds_password)
            : value.ds_password
        };

        setSaveLoading(true);
        const resTest = await servicesDataSource.sourceConnectTest(testBody);

        if (resTest?.res) {
          const body = {
            dsname: value.dsname,
            data_source: isAs ? AS : value.data_source,
            dataType: value.extract_type === MODEL_EXTRACTION ? UNSTRUCTURED : STRUCTURED,
            ds_address: value.ds_address,
            ds_port: parseInt(value.ds_port),
            ds_auth: value.ds_auth,
            ds_path: value.ds_path?.replace(/(^\s*)|(\s*$)/g, '') || '',
            extract_type: value.extract_type || STANDARD_EXTRACTION,
            vhost: value.vhost || '',
            queue: value.queue || '',
            json_schema: value.json_schema || '',
            ds_user: isAs ? undefined : value.ds_user,
            ds_password: isAs
              ? undefined
              : form.isFieldTouched('ds_password')
              ? window.btoa(value.ds_password)
              : value.ds_password,
            knw_id: +window.sessionStorage.getItem('selectedKnowledgeId') || undefined
          };
          let res = {};

          if (operation === 'edit') {
            body.knw_id = undefined;
            res = await servicesDataSource.dataSourcePut(body, value.id);
          }

          if (operation === 'create') {
            res = await servicesDataSource.dataSourcePost(body);
          }

          if (operation === 'copy') {
            body.ds_id = selectKey;
            res = await servicesDataSource.postCopyDs(body);
          }

          // 结果处理
          if (res?.res) {
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
            case curCode === '500403' || curCode === 'Studio.SoftAuth.UnknownServiceRecordError':
              message.error(intl.get('datamanagement.notAuth'));
              break;
            case curCode === 500002 || curCode === 'Builder.service.dsm_Service.DsmService.addds.SameNameError':
              message.error(intl.get('datamanagement.alreadyUsed'));
              break;
            case curCode === 'Studio.Graph.AddDefaultPermissionError':
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

  return (
    <>
      <div className="modal-title">
        {intl.get(`datamanagement.${operation}`) + intl.get('datamanagement.dataSourceTitle')}
      </div>

      {/* 表单 */}
      <div className="form-box">
        <ScrollBar ref={scrollRef} isshowx="false" color="rgb(184,184,184)">
          <div className="scroll-wrapper">
            <Form
              className="data-source-from"
              layout="vertical"
              form={form}
              initialValues={{
                data_source: MYSQL,
                extract_type: STANDARD_EXTRACTION
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
                    { max: 50, message: intl.get('datamanagement.maxLength') },
                    {
                      pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                      message: intl.get('workflow.basic.nameConsists')
                    },
                    {
                      validator: async (rule, value) => {
                        if (value) {
                          if (value[0] === ' ' || value[value.length - 1] === ' ') {
                            throw new Error(intl.get('workflow.basic.desConsists'));
                          }
                        }

                        if (/\n|\r/g.test(value)) {
                          throw new Error(intl.get('workflow.basic.desConsists'));
                        }
                      }
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
                  >
                    <Option value={MYSQL}>MySQL</Option>
                    <Option value={HIVE}>Hive</Option>
                    <Option value={`${AS}-${STRUCTURED}`}>AnyShare 7-{intl.get('datamanagement.structured')}</Option>
                    <Option value={`${AS}-${UNSTRUCTURED}`}>
                      AnyShare 7-{intl.get('datamanagement.unstructured')}
                    </Option>
                    <Option value={MQ}>RabbitMQ</Option>
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
                        <Option value={MODEL_EXTRACTION}>{intl.get('datamanagement.modelExtraction')}</Option>
                      ) : (
                        <>
                          <Option value={STANDARD_EXTRACTION}>{intl.get('datamanagement.standardExtraction')}</Option>
                          <Option value={LABEL_EXTRACTION}>{intl.get('datamanagement.labelExtraction')}</Option>
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

                        if (!asReg.test(curValue)) {
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

              {/* mysql, hive, rabbitmq 存在用户名密码输入框 */}
              {[MYSQL, HIVE, MQ].includes(sourceType) && (
                <div className="form-row combo-row">
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
                    <Input autoComplete="off" placeholder={intl.get('datamanagement.pleaseUser')} />
                  </FormItem>

                  {/* 兼容safari，去除记住密码功能 */}
                  <FormItem style={{ display: 'none' }}>
                    <Input type="password" onFocus={passwordFocus} autoComplete="off" />
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

              {/* mysql, hive, as7存在路径字段 */}
              {([MYSQL, HIVE].includes(sourceType) || sourceType.includes(AS)) && (
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
              )}

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
                        validator: async (_, value) => {
                          if (!isJson(value) || (isJson(value) && value.replace(/[\s\n\r]/g, '') === '{}')) {
                            throw new Error(intl.get('datamanagement.formatErr'));
                          }
                        }
                      }
                    ]}
                  >
                    <TextArea placeholder={`${JSON.stringify(JSON_TEMP, null, 4)}`} />
                  </FormItem>
                </div>
              )}
            </Form>
          </div>
        </ScrollBar>
      </div>

      {/* 底部按钮 */}
      <div className="modal-footer">
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
    </>
  );
};

const SourceModal = props => {
  const { visible, handleCancel } = props;

  return (
    <Modal
      className="data-source-modal"
      visible={visible}
      destroyOnClose
      focusTriggerAfterClose={false}
      width={640}
      maskClosable={false}
      footer={null}
      onCancel={() => handleCancel()}
    >
      <ModalContent {...props} />
    </Modal>
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

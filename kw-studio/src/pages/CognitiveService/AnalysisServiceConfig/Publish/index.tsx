/**
 * 发布图分析服务
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Input, Checkbox, Radio, ConfigProvider, message } from 'antd';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import analysisService from '@/services/analysisService';
import HOOKS from '@/hooks';
import { ANALYSIS_SERVICES, ONLY_NORMAL_NAME } from '@/enums';
import WangEditor from '@/components/WangEditor';
import { getParam, getTextByHtml } from '@/utils/handleFunction';
import TrimmedInput from '@/components/TrimmedInput';

import PC_ConfigModal from './PC_ConfigModal';
import { getConfigJson } from './PC_ConfigModal/EmbedConfig';
import { getCorrectParams } from '../ConfigAndTest/assistant';
import { ActionType, BasicData, TestData } from '../types';
import './style.less';

const { text, ACCESS_METHOD, PERMISSION, SEARCH_TYPE } = ANALYSIS_SERVICES;

export interface PublishProps {
  action: ActionType;
  basicData: BasicData;
  testData: TestData;
  isSaved: boolean; // 是否保存
  onChange?: (data: Partial<BasicData>) => void;
  onPrev: () => void;
  setIsPrevent: (bool?: any) => void;
  setIsSaved: (bool: boolean) => void;
}

type PublishField = Pick<BasicData, 'name' | 'description' | 'access_method' | 'permission'>;

const Publish = (props: PublishProps) => {
  const history = useHistory();
  const { action, basicData, testData, isSaved, onPrev, setIsPrevent, setIsSaved } = props;
  const [form] = Form.useForm();
  const language = HOOKS.useLanguage();
  const scrollWrapRef = useRef<HTMLDivElement>(null); // 滚动容器
  const [loading, setLoading] = useState(false);
  const [isSelectPC, setIsSelectPC] = useState(false); // 是否勾选PC内嵌功能
  const [configVisible, setConfigVisible] = useState(false); // PC配置弹窗
  const [savedPCConfig, setSavedPCConfig] = useState<any[]>([]); // 已保存的pc配置, json字符串

  useEffect(() => {
    if (basicData.action === 'init' || action === 'import') {
      setTimeout(() => {
        form.setFieldsValue({ ...basicData });
      }, 0);
      if (_.includes(basicData.access_method, ACCESS_METHOD.PC_EMBED)) {
        setIsSelectPC(true);
      }
    }
    if (basicData.pc_configure_item) {
      try {
        setSavedPCConfig(JSON.parse(basicData.pc_configure_item));
      } catch {
        //
      }
    }
  }, [basicData]);

  const onSubmit = (e: React.MouseEvent, type: 'save' | 'publish') => {
    e.preventDefault();
    form
      .validateFields()
      .then(value => {
        handleSubmit(value, type);
      })
      .catch(err => {
        setLoading(false);
        scrollWrapRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  /**
   * 校验成功后发送请求
   * @param formValues 表单数据
   * @param type 保存 0 | 发布 1
   */
  const handleSubmit = async (formValues: PublishField, type: 'save' | 'publish') => {
    if (loading) return;
    const { knw_id, kg_id, operation_type, graphLayoutPattern } = basicData;
    const { canvas_config, canvas_body } = testData;

    let canvas_body_string = '';
    try {
      const canvas_body_object = JSON.parse(canvas_body);
      canvas_body_object.graphLayoutPattern = graphLayoutPattern;
      canvas_body_string = JSON.stringify(canvas_body_object);
    } catch (e) {
      canvas_body_string = canvas_body;
    }

    const config_info = _.cloneDeep(testData.config_info);
    if (basicData.operation_type === SEARCH_TYPE.CUSTOM_SEARCH) {
      config_info.params = getCorrectParams(config_info.params);
    }
    let pc_configure_item = '';
    if (_.includes(formValues.access_method, ACCESS_METHOD.PC_EMBED)) {
      pc_configure_item = _.isEmpty(savedPCConfig) ? getConfigJson() : JSON.stringify(savedPCConfig);
    }

    const body = {
      ...formValues,
      id: basicData.id || getParam('service_id'),
      knw_id: String(knw_id),
      kg_id: String(kg_id),
      operation_type,
      description: getTextByHtml(formValues.description) ? formValues.description : '', // 去除空的富文本
      canvas_config,
      canvas_body: canvas_body_string,
      config_info,
      pc_configure_item,
      status: type === 'save' ? 0 : 1
    };
    const action = getParam('action');
    try {
      setLoading(true);
      const services = ['create', 'import'].includes(action)
        ? analysisService.analysisServiceCreate
        : analysisService.analysisServiceEdit;
      const res = await services(body);
      setLoading(false);

      if (res?.id) {
        type === 'publish'
          ? message.success(intl.get('analysisService.publishing'))
          : message.success(intl.get('global.saveSuccess'));
        setIsPrevent(false);
        setIsSaved(true);
        if (type === 'publish') {
          Promise.resolve().then(() => {
            history.push(`/cognitive-application/domain-analysis?id=${basicData.knw_id}`);
          });
        }
        history.push(`${window.location.pathname}?action=edit&service_id=${res?.id}`);
      }
    } catch (err) {
      setLoading(false);
      const { Description, ErrorCode } = err?.response || err?.data || err;
      if (
        ErrorCode === 'Cognitive.DuplicateApplicationNameErr' ||
        ErrorCode === 'EngineServer.DuplicateApplicationNameErr'
      ) {
        form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
        return;
      }
      if (ErrorCode === 'Cognitive.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'Cognitive.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
  };

  /**
   * 表单数据不需要实时同步到state, 点击发布时直接获取最终表单即可
   */
  const onFormChange = (changedValues: Partial<PublishField>) => {
    setIsSaved(false);
    if (changedValues.access_method) {
      setIsSelectPC(_.includes(changedValues.access_method, ACCESS_METHOD.PC_EMBED));
    }
  };

  return (
    <div className="service-config-step3-root">
      <div ref={scrollWrapRef} className="scroll-wrap">
        <div className="form-box">
          <Form form={form} layout="vertical" scrollToFirstError onValuesChange={onFormChange}>
            <Form.Item
              label={intl.get('analysisService.serviceName')}
              name="name"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  pattern: ONLY_NORMAL_NAME,
                  message: intl.get('global.onlyNormalName')
                }
              ]}
            >
              <TrimmedInput placeholder={intl.get('analysisService.serviceNamePlace')} autoComplete="off" />
            </Form.Item>
            <Form.Item
              label={intl.get('analysisService.accessControl')}
              name="permission"
              rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
            >
              <Radio.Group>
                <Radio className="align-item kw-mr-8" value={PERMISSION.APPID_LOGIN}>
                  {text(PERMISSION.APPID_LOGIN)}
                </Radio>
                <Radio className="align-item" value={PERMISSION.SINGLE_LOGIN} disabled>
                  {text(PERMISSION.SINGLE_LOGIN)}
                </Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label={intl.get('analysisService.accessMode')}
              name="access_method"
              rules={[{ required: true, message: intl.get('analysisService.accessModeTip') }]}
            >
              <Checkbox.Group className="kw-flex">
                <span>
                  <Checkbox checked={true} value={ACCESS_METHOD.REST_API}>
                    RESTful API
                  </Checkbox>
                  <br />
                  <div className="kw-mt-1 kw-pl-6 kw-c-subtext">{intl.get('analysisService.restfulExplain')}</div>
                </span>
                <span style={{ marginLeft: 40 }}>
                  <Checkbox value={ACCESS_METHOD.PC_EMBED}>{text(ACCESS_METHOD.PC_EMBED)}</Checkbox>
                  <div className="kw-mt-1 kw-pl-6 kw-c-subtext">
                    {intl.get('analysisService.pcExplain')}
                    <span
                      className={classNames('kw-ml-2', isSelectPC ? 'kw-c-primary' : 'kw-c-watermark')}
                      style={{ cursor: isSelectPC ? 'pointer' : 'not-allowed' }}
                      onClick={() => isSelectPC && setConfigVisible(true)}
                    >
                      {intl.get('global.settings')}
                    </span>
                  </div>
                </span>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item
              label={intl.get('global.desc')}
              name="description"
              rules={[
                {
                  validator: async (_, value) => {
                    const text = getTextByHtml(value);
                    if (text.length > 20000) {
                      throw new Error(intl.get('global.lenErr', { len: 20000 }));
                    }
                  }
                }
              ]}
            >
              <WangEditor height={260} language={language} />
            </Form.Item>
          </Form>
        </div>
      </div>

      <div className="footer-box">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button type="default" onClick={onPrev}>
            {intl.get('global.previous')}
          </Button>
          <Button type="default" disabled={isSaved} onClick={e => onSubmit(e, 'save')}>
            {intl.get('global.save')}
          </Button>
          <Button type="primary" onClick={e => onSubmit(e, 'publish')}>
            {intl.get('analysisService.publish')}
          </Button>
        </ConfigProvider>
      </div>

      <PC_ConfigModal
        visible={configVisible}
        savedPCConfig={savedPCConfig}
        basicData={basicData}
        configInfo={testData.config_info}
        onBack={() => setConfigVisible(false)}
        onSave={data => setSavedPCConfig(data)}
      />
    </div>
  );
};

export default Publish;

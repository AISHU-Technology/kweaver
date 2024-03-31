import React, { useRef, useState, useEffect } from 'react';

import { Button, Form, Input, Checkbox, Radio, ConfigProvider, message } from 'antd';
import { useHistory } from 'react-router-dom';
import WangEditor from '@/components/WangEditor';
import customService from '@/services/customService';
import HOOKS from '@/hooks';
import intl from 'react-intl-universal';
import { ANALYSIS_SERVICES } from '@/enums';
import { getTextByHtml, getParam, localStore } from '@/utils/handleFunction';
import _ from 'lodash';

import BaseTip from '@/components/ExplainTip/BaseTip';
import './style.less';

const { text, ACCESS_METHOD, PERMISSION, TRANS_MODE } = ANALYSIS_SERVICES;
type PublishField = Pick<any, 'name' | 'description' | 'access_method' | 'permission'>;

const Publish = (props: any) => {
  const { onPrev, basicData, setIsPrevent, actuatorData, isSaved, setIsSaved } = props;
  const history = useHistory();
  const [form] = Form.useForm();
  const language = HOOKS.useLanguage();
  const scrollWrapRef = useRef<any>(null); // 滚动容器
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { action } = getParam(['action']);
    setTimeout(() => {
      if (action === 'copy') {
        const { name } = basicData;
        form.setFieldsValue({ ...basicData, name: `${name}的副本` });
      } else {
        form.setFieldsValue({ ...basicData });
      }
    }, 0);
  }, [basicData]);

  /**
   * 提交
   */
  const onSubmit = (e: React.MouseEvent, type: 'save' | 'publish') => {
    e.preventDefault();
    form
      .validateFields()
      .then(value => {
        handleSubmit(value, type);
      })
      .catch(err => {
        setLoading(false);
        // scrollWrapRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
  };

  /**
   * 校验成功后发送请求
   * @param formValues 表单数据
   * @param type 保存 0 | 发布 1
   */
  const handleSubmit = async (formValues: any, type: 'save' | 'publish') => {
    const { action, s_id, env } = getParam(['action', 's_id', 'env']);
    if (loading) return;

    const { knw_id } = basicData;
    const userInfo = localStore.get('userInfo') || {};
    const body: any = {
      ...formValues,
      status: type === 'save' ? 0 : 1,
      // knw_id: 0,
      description: getTextByHtml(formValues.description) ? formValues.description : '', // 去除空的富文本
      custom_config: JSON.parse(actuatorData),
      env
    };

    if (action !== 'create') {
      body.service_id = s_id;
    }
    try {
      setLoading(true);
      // 发送接口
      const { res } =
        action === 'create' || action === 'copy'
          ? await customService.addCustom(body)
          : await customService.updateCustom(body);
      setLoading(false);

      if (res) {
        type === 'publish'
          ? message.success(intl.get('analysisService.publishing'))
          : message.success(intl.get('global.saveSuccess'));
        setIsPrevent(false);
        setIsSaved(true);
        if (type === 'publish') {
          Promise.resolve().then(() => {
            history.push(`/cognitive-application/domain-custom?id=${basicData.knw_id}`);
          });
        }
        history.push(`${window.location.pathname}?action=edit&s_id=${res}&name=${body?.name}`);
      }
    } catch (err) {
      setLoading(false);
      const { Description, ErrorCode } = err?.response || err.data || err;
      if (ErrorCode === 'KnCognition.DuplicateApplicationNameErr') {
        form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
        return;
      }
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      if (ErrorCode === 'KnCognition.GraphPermissionDeniedErr') {
        return message.error(intl.get('analysisService.noGraphAuth'));
      }
      Description && message.error(Description);
    }
  };
  const onFormChange = () => {
    setIsSaved(false);
  };
  return (
    <div className="custom-config-service-publish-root">
      <div ref={scrollWrapRef} className="scroll-wrap kw-ml-6 kw-mr-6">
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
                  pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                  message: intl.get('global.onlyNormalName')
                }
              ]}
              // style={{ height: 94 }}
            >
              <Input placeholder={intl.get('analysisService.serviceNamePlace')} autoComplete="off" />
            </Form.Item>

            {/* <Form.Item
              label={
                <>
                  <span>{intl.get('analysisService.transMode')}</span>
                  <BaseTip
                    className="kw-ml-2"
                    title={
                      <>
                        <div>{intl.get('analysisService.transModeTip')}</div>
                      </>
                    }
                  />
                </>
              }
              name="transMode"
              rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
              // style={{ height: 94 }}
            >
              <Radio.Group>
                <Radio className="align-item kw-mr-8" value={TRANS_MODE.NO_STREAM}>
                  {text(TRANS_MODE.NO_STREAM)}
                </Radio>
                <Radio className="align-item" value={TRANS_MODE.STREAM}>
                  {text(TRANS_MODE.STREAM)}
                </Radio>
              </Radio.Group>
            </Form.Item> */}

            <Form.Item
              label={intl.get('analysisService.accessControl')}
              name="permission"
              rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
              // style={{ height: 94 }}
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
              // style={{ height: 94 }}
            >
              <Checkbox.Group>
                <Checkbox className="align-item kw-mr-8" value={ACCESS_METHOD.REST_API}>
                  RESTful API
                </Checkbox>
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
              className="kw-mb-0"
            >
              <WangEditor height={197} language={language} />
            </Form.Item>
          </Form>
        </div>
      </div>

      <div className="footer-box">
        <ConfigProvider autoInsertSpaceInButton={false}>
          <Button className="foot-btn kw-mr-2" type="default" onClick={() => onPrev()}>
            {intl.get('global.previous')}
          </Button>
          <Button className="btn-middle kw-mr-2" type="default" disabled={isSaved} onClick={e => onSubmit(e, 'save')}>
            {/* {intl.get('analysisService.saveAndExist')} */}
            {intl.get('global.save')}
          </Button>
          <Button className="foot-btn" type="primary" onClick={e => onSubmit(e, 'publish')}>
            {intl.get('analysisService.publish')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default Publish;

/**
 * 发布dpapi服务
 */
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Button, Form, Input, Checkbox, Radio, ConfigProvider, message } from 'antd';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import servicesDpapi from '@/services/dpapi';
import HOOKS from '@/hooks';
import { ANALYSIS_SERVICES } from '@/enums';
import WangEditor from '@/components/WangEditor';
import { getTextByHtml, localStore } from '@/utils/handleFunction';
import { ActionType, BasicData, TestData } from './types';
import './style.less';
import { DpapiDataContext, SAVE_BTN_DISABLED } from '../dpapiData';

const { text, ACCESS_METHOD, PERMISSION, SEARCH_TYPE } = ANALYSIS_SERVICES;

/**
 * 去除参数中多余的字段
 * @param params
 */
export const getCorrectParams = (params: any[]) => {
  return _.map(params, item => {
    const data = _.pick(item, 'name', 'alias', 'description', 'position', 'param_type', 'options', 'entity_classes');
    data.position.sort((a: any, b: any) => (b.example === item.example ? -1 : 0));
    return data;
  });
};

type PublishField = Pick<BasicData, 'name' | 'description' | 'access_method' | 'permission'>;

const myTest = false;

const SecondPublishAPI = (props: any) => {
  const history = useHistory();
  const { action, onPrev, setIsPrevent, pageAction, id: product_id } = props;
  const [form] = Form.useForm();
  const language = HOOKS.useLanguage();
  const scrollWrapRef = useRef<HTMLDivElement>(null); // 滚动容器
  const [loading, setLoading] = useState(false);

  // @ts-ignore
  const { data, dispatch } = useContext(DpapiDataContext);
  // @ts-ignore
  const { datasourceInfo, knData, basicData, editorData, editingData, selectedKnUserId, hasSaved } = data.toJS();

  useEffect(() => {
    if ((pageAction === 'edit' || pageAction === 'publish') && !_.isEmpty(basicData)) {
      setTimeout(() => {
        form.setFieldsValue({ ...basicData });
      }, 0);
    }
  }, [basicData.id]);

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

  if (myTest) {
    // @ts-ignore
    window.y = () => {
      // @ts-ignore
      const { editorData, editingData } = data.toJS();
    };
  }

  /**
   * 校验成功后发送请求
   * @param formValues 表单数据
   * @param type 保存 0 | 发布 1
   */
  const handleSubmit = async (formValues: any, type: 'save' | 'publish') => {
    if (loading) return;
    const {
      origin: { data_source, ds_address, ds_password, ds_path, ds_port, ds_user, id, dsname }
    } = datasourceInfo;

    const datasourceInfoVal = {
      id,
      dsName: dsname,
      dsPath: ds_path,
      dataSource: data_source,
      dsAddress: ds_address,
      dsPort: ds_port,
      dsUser: ds_user,
      dsPassword: ds_password
    };

    // @ts-ignore
    const { editorData, editingData } = data.toJS();

    // 组合参数根据  editingData.params 和  editorData.params 的
    for (let i = 0; i < editingData.params.length; i++) {
      const cur = editingData.params[i];
      for (let j = 0; j < editorData.params.length; j++) {
        const posItem = editorData.params[j];
        if (cur._id === posItem._id) {
          cur.position = [...posItem.position];
        }
      }
    }
    const formData = {
      ...formValues,
      note: getTextByHtml(formValues.note) ? formValues.note : '', // 去除空的富文本
      params: editingData.params || [],
      sqlText: [
        { label: '1', value: editorData.value } // 带$变量的sql
      ],
      datasourceId: datasourceInfoVal.id,
      userName: localStore.get('userInfo').username || '',
      userId: localStore.get('userInfo').id || '',
      id: product_id,
      ext: {
        // 前端用-模板值 sql  不带$的 原始sql
        statements: editingData.statements,
        // 前端用-坐标位置
        params: editingData.params
      },
      knwId: selectedKnUserId
    };
    try {
      setLoading(true);
      const services = type === 'save' ? servicesDpapi.DBApiAdd : servicesDpapi.DBApiPublish;
      const res = await services(formData);
      setLoading(false);

      if (res?.code === '200') {
        action === 'publish'
          ? message.success(intl.get('analysisService.publishing'))
          : message.success(intl.get('global.saveSuccess'));
        setIsPrevent(false);
        if (type === 'publish') {
          Promise.resolve().then(() => {
            history.push(`/cognitive-application/domain-dbapi?id=${selectedKnUserId}`);
          });
        }
        dispatch({ type: SAVE_BTN_DISABLED, data: true });
      } else {
        message.error(res?.data?.description || res?.data?.solution);
      }
    } catch (err) {
      setLoading(false);
      const { Description, ErrorCode } = err?.response || err.data || {};
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
    dispatch({ type: SAVE_BTN_DISABLED, data: false });
  };

  return (
    <div className="dbapi-config-publish">
      <div ref={scrollWrapRef} className="scroll-wrap">
        <div className="form-box">
          <Form form={form} layout="vertical" scrollToFirstError onValuesChange={onFormChange}>
            <Form.Item
              label={intl.get('dpapiService.APIName')}
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
            >
              <Input placeholder={intl.get('analysisService.serviceNamePlace')} autoComplete="off" />
            </Form.Item>
            <Form.Item
              label={intl.get('dpapiService.APIAddress')}
              name="path"
              validateFirst
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                {
                  pattern: /^[a-zA-Z0-9\]\\{}/|!@#$%^&*`~()+=-_]+$/,
                  message: intl.get('dpapiService.onlyKeyboard')
                }
              ]}
            >
              <Input
                addonBefore={`https://${location.host}/api/cognition_api/v1/getApi/`}
                addonAfter="/{serviceld}"
                placeholder={intl.get('dpapiService.APIAddressHolder')}
                autoComplete="off"
              />
            </Form.Item>

            <Form.Item label={intl.get('analysisService.accessControl')} name="permission">
              <Radio defaultChecked className="align-item kw-mr-8" value={PERMISSION.APPID_LOGIN}>
                {text(PERMISSION.APPID_LOGIN)}
              </Radio>
              <Radio className="align-item" value={PERMISSION.SINGLE_LOGIN} disabled>
                {text(PERMISSION.SINGLE_LOGIN)}
              </Radio>
            </Form.Item>
            <Form.Item label={intl.get('analysisService.accessMode')} name="access_method">
              <Checkbox value={ACCESS_METHOD.REST_API} defaultChecked disabled>
                RESTful API
              </Checkbox>
              {/* <br />
              <div className="kw-mt-1 kw-mb-4 kw-pl-6 kw-c-subtext">{intl.get('analysisService.restfulExplain')}</div>
              <Checkbox value={ACCESS_METHOD.PC_EMBED} disabled>
                {text(ACCESS_METHOD.PC_EMBED)}
              </Checkbox>
              <div className="kw-mt-1 kw-pl-6 kw-c-subtext">
                {intl.get('analysisService.pcExplain')}
                <span className={classNames('kw-ml-2', 'kw-c-watermark')} style={{ cursor: 'not-allowed' }}>
                  {intl.get('global.settings')}
                </span>
              </div> */}
            </Form.Item>
            <Form.Item
              label={intl.get('global.desc')}
              name="note"
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
          <Button type="default" disabled={hasSaved} onClick={e => onSubmit(e, 'save')}>
            {intl.get('global.save')}
          </Button>
          <Button type="primary" onClick={e => onSubmit(e, 'publish')}>
            {intl.get('analysisService.publish')}
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default SecondPublishAPI;

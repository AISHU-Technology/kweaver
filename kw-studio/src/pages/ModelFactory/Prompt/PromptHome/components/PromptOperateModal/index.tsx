import React, { useState, useEffect } from 'react';
import { Form, Select, Input, message, Tooltip } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';

import * as promptServices from '@/services/prompt';
import { ONLY_KEYBOARD } from '@/enums';
import HOOKS from '@/hooks';
import { copyToBoard } from '@/utils/handleFunction';
import IconFont from '@/components/IconFont';
import UniversalModal from '@/components/UniversalModal';

import ModelIcon from '@/pages/ModelFactory/LLMModel/components/ModelIcon';

import CategorySelector from './CategorySelector';
import IconRadio from './IconRadio';
import { getRememberParams } from '../../utils';
import { getDefaultModelOptions } from '../../../PromptConfig/utils';
import { ProjectItem } from '../../types';
import { PROMPT_TYPES } from '../../enums';
import './style.less';

export interface PromptOperateModalProps {
  className?: string;
  visible?: boolean;
  action?: 'create' | 'edit' | string;
  data: any;
  projectList?: ProjectItem[];
  onOk?: (data: any) => void;
  onCancel?: () => void;
}

const PromptOperateModal = (props: PromptOperateModalProps) => {
  const { className, visible, action = 'create', data, projectList = [], onOk, onCancel } = props;
  const history = useHistory();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState({ chat: [], completion: [] } as Record<string, any[]>);
  const [formData, setFormData] = useState({ prompt_type: 'completion', icon: '5' }); // 部分字段单独控制
  const [ID, setID] = useState('');

  useEffect(() => {
    getModelList();
  }, []);

  useEffect(() => {
    form.setFieldsValue({ ...data });
    if (action === 'create') {
      generateID();
    }
    if (action === 'edit') {
      setFormData(_.pick(data, 'prompt_type', 'icon'));
    }
  }, [action, data]);

  const getModelList = async () => {
    const { res } = (await promptServices.promptLLMList()) || {};
    if (!res?.data) return;
    setModelData({
      completion: res.data,
      chat: _.filter(res.data, d => d.model_type === 'chat')
    });
    if (action === 'create' && res.data.length) {
      form.setFieldsValue({ model_id: res.data[0].model_id });
    }
  };

  /**
   * 生成雪花id
   */
  const generateID = async () => {
    const { res } = (await promptServices.promptSnowId()) || {};
    if (!res) return;
    setID(String(res));
    form.setFieldsValue({ prompt_service_id: String(res) });
  };

  const copyId = async () => {
    const isSuccess = await copyToBoard(data.prompt_service_id);
    isSuccess && message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  const onFormChange = (changedValues: any) => {
    if ('prompt_type' in changedValues) {
      const { prompt_type } = changedValues;
      setFormData(pre => ({ ...pre, prompt_type }));
      const model_id = form.getFieldValue('model_id');
      if (model_id && !_.find(modelData[prompt_type], item => item.model_id === model_id)) {
        form.setFieldsValue({ model_id: undefined });
      }
    }
  };

  const submit = () => {
    if (loading) return;
    form
      .validateFields()
      .then(async values => {
        const valueTrim = values?.prompt_name?.trim?.();
        if (!valueTrim) {
          form.setFields([{ name: 'prompt_name', errors: [intl.get('global.noNull')] }]);
          return;
        }

        form.setFieldsValue({ prompt_name: valueTrim });
        handleSave({ ...values, prompt_name: valueTrim });
      })
      .catch(err => {
        //
      });
  };

  const handleSave = async (values: any) => {
    let body = { ...values };
    if (action === 'create') {
      const model = _.find(modelData[formData.prompt_type], d => d.model_id === values.model_id);
      body.messages = '';
      body.model_para = getDefaultModelOptions(model.model_para);
    } else {
      body = _.omit(body, 'prompt_service_id', 'prompt_type');
      body.prompt_id = data!.prompt_id;
    }
    const servicesFunc = action === 'create' ? promptServices.promptAdd : promptServices.promptNameEdit;
    try {
      setLoading(true);
      const { res } = (await servicesFunc(body)) || {};
      setLoading(false);
      if (!res) return;
      if (action === 'create') {
        const search = getRememberParams(body);
        return history.push(
          `/model-factory/prompt-config${search}&action=edit&prompt_id=${res.prompt_id}&prompt_type=${values?.prompt_type}`
        );
      }
      onOk?.(body);
    } catch (err) {
      setLoading(false);
      const { description, code } = err?.response || err?.data || err || {};
      let codeError = false;
      if (code === 'ModelFactory.PromptController.PromptAdd.IdError') {
        codeError = true;
        form.setFields([{ name: 'prompt_service_id', errors: [intl.get('prompt.idExist')] }]);
      }
      if (
        [
          'ModelFactory.PromptController.PromptAdd.NameError',
          'ModelFactory.PromptController.PromptNameEdit.NameError'
        ].includes(code)
      ) {
        codeError = true;
        form.setFields([{ name: 'prompt_name', errors: [intl.get('global.repeatName')] }]);
      }
      if (codeError) return;
      description && message.error(description);
    }
  };

  return (
    <UniversalModal
      className={classNames(className, 'prompt-operate-modal-root')}
      title={action === 'create' ? intl.get('prompt.createPromptTwo') : intl.get('prompt.editPromptTwo')}
      visible={visible}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        {
          label: action === 'create' ? intl.get('prompt.create') : intl.get('global.save'),
          type: 'primary',
          onHandle: submit
        }
      ]}
    >
      <div className="prompt-operate-modal-root-content kw-h-100">
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
          initialValues={{ ...formData, prompt_desc: '' }}
          onValuesChange={onFormChange}
        >
          <Form.Item name="prompt_item_id" hidden>
            <div />
          </Form.Item>
          <Form.Item
            label={intl.get('prompt.id')}
            name="prompt_service_id"
            rules={[
              { required: true, message: intl.get('global.pleaseSelect') },
              { max: 20, message: intl.get('global.lenErr', { len: 20 }) },
              { pattern: /\w/, message: intl.get('global.onlyMetacharacters') }
            ]}
          >
            <Input
              disabled={true}
              suffix={
                <Tooltip title={intl.get('global.copy') + ' ID'}>
                  <div className="kw-pointer" style={{ width: 24, height: 24, textAlign: 'center' }} onClick={copyId}>
                    <IconFont type="icon-copy" style={{ color: 'var(--kw-text-color)' }} />
                  </div>
                </Tooltip>
              }
            />
          </Form.Item>
          <Form.Item
            label={intl.get('prompt.modelApplyName')}
            name="prompt_name"
            validateFirst
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input placeholder={intl.get('global.pleaseEnter')} />
          </Form.Item>
          <Form.Item
            label={intl.get('prompt.appType')}
            name="prompt_type"
            rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
          >
            <Select disabled={action === 'edit'}>
              {PROMPT_TYPES.map(item => {
                return (
                  <Select.Option key={item?.key}>
                    <div>
                      <div className="kw-align-center kw-mb-2">
                        <IconFont type={item.icon} className="kw-mr-2" style={{ fontSize: 16 }} />
                        <div>{item.label}</div>
                      </div>
                      <div className="kw-c-subtext kw-ellipsis-2" style={{ lineHeight: '18px', fontSize: 12 }}>
                        {item.desc}
                      </div>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            label={intl.get('prompt.selectModel')}
            name="model_id"
            rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
          >
            <Select
              placeholder={intl.get('global.pleaseSelect')}
              getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
            >
              {_.map(modelData[formData.prompt_type], item => {
                const { model_id, model_name, model_series } = item;
                return (
                  <Select.Option key={model_id} value={model_id} data={item}>
                    <div className="kw-align-center">
                      <ModelIcon size={16} type={model_series} />
                      <div className="kw-flex-item-full-width kw-pl-2 kw-ellipsis">{model_name}</div>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            label={intl.get('prompt.selectGroup')}
            name="prompt_item_type_id"
            rules={[{ required: true, message: intl.get('global.pleaseSelect') }]}
          >
            <CategorySelector
              projectList={projectList}
              onProjectChange={prompt_item_id => form.setFieldsValue({ prompt_item_id })}
            />
          </Form.Item>
          <Form.Item label={intl.get('prompt.color')} name="icon" required>
            <IconRadio type={formData.prompt_type} />
          </Form.Item>
          <Form.Item
            label={intl.get('global.desc')}
            name="prompt_desc"
            validateFirst
            rules={[
              { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input.TextArea placeholder={intl.get('global.pleaseEnter')} rows={4} />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: PromptOperateModalProps) => {
  const [projectList, setProjectList] = useState(props.projectList || []);

  /**
   * 外部未声明projectList, 自行获取
   */
  useEffect(() => {
    if (props.projectList) return;
    getData();
  }, []);

  /**
   * 外部未声明projectList, 打开弹窗更新数据
   */
  HOOKS.useUpdateEffect(() => {
    if (props.projectList || !props.visible) return;
    getData();
  }, [props.visible]);

  useEffect(() => {
    props.projectList && setProjectList(props.projectList);
  }, [props.projectList]);

  const getData = async () => {
    const { res } = (await promptServices.promptProjectList({ prompt_item_name: '', page: 1, size: 1000 })) || {};
    res?.data && setProjectList(res.data);
  };

  if (!props.visible) return null;
  return <PromptOperateModal {...props} projectList={projectList} />;
};

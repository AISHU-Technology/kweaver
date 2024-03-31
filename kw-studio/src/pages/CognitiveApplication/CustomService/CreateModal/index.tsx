import React, { useEffect, useState } from 'react';
import { Form, Input, message, Select, Spin } from 'antd';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import TemplateModal from '@/components/TemplateModal';
import { createGlossary, editGlossary } from '@/services/glossaryServices';
import { EnvOptions, EnvDes } from '../constants';
import HOOKS from '@/hooks';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import UniversalModal from '@/components/UniversalModal';
import TrimmedInput from '@/components/TrimmedInput';
import { ONLY_KEYBOARD } from '@/enums';
import { tipModalFunc } from '@/components/TipModal';
import { getTextByHtml, localStore } from '@/utils/handleFunction';

import './style.less';
import classNames from 'classnames';

type FormValues = {
  name: string;
  env: string;
  description: string;
  init?: boolean;
  id?: string;
};
const CreateModal = (props: any) => {
  const language = HOOKS.useLanguage();
  const { editData, onClose, kwId, refreshTableData, openDetailPage, knData } = props;

  const [form] = Form.useForm();
  const history = useHistory();

  useEffect(() => {
    if (editData?.name) {
      const { name, env, description } = editData;
      !editData.init
        ? form.setFieldsValue({ name: name + intl.get('customService.duplicate'), env, description })
        : form.setFieldsValue({ name, env, description });
    }
  }, [editData]);

  const formFinish = async (values: FormValues) => {
    // localStorage.setItem('env', values.name);
    // localStorage.setItem('env', values.env);
    // localStorage.setItem('env', values.description);

    const description = values.description || '';
    localStore.set('description', description);

    !editData.id
      ? history.push(`/custom/service?action=create&env=${values.env}&name=${values.name}`)
      : history.push(`/custom/service?action=create&s_id=${editData.id}&env=${values.env}&name=${values.name}`);

    // history.push('/custom/service?action=create');
  };

  return (
    <UniversalModal
      // title={!editData.name ? intl.get('customService.createService') : intl.get('customService.editService')}
      title={intl.get('customService.createService')}
      visible
      className="customService-modal"
      width={640}
      onCancel={onClose}
      footerData={[
        {
          label: intl.get('global.cancel'),
          type: 'default',
          onHandle: () => {
            onClose();
          }
        },
        {
          label: intl.get('global.ok'),
          type: 'primary',
          onHandle: () => {
            form.submit();
          }
        }
      ]}
    >
      <div>
        <Form layout="vertical" form={form} onFinish={formFinish}>
          <Form.Item
            label={intl.get('customService.env')}
            name="env"
            rules={[
              {
                required: true,
                message: intl.get('global.noNull')
              }
            ]}
            initialValue={'0'}
            className="kw-mb-2"
          >
            <Select options={EnvOptions} />
          </Form.Item>

          <div className="env-des kw-mb-3">
            {EnvDes.map((desItem, index) => {
              return (
                <div
                  style={{
                    wordWrap: 'break-word'
                  }}
                  className={classNames('env-des', index === 2 ? '' : 'kw-mb-1')}
                  key={index}
                >
                  {desItem}
                </div>
              );
            })}
          </div>

          <div className="line kw-mb-4"></div>

          <Form.Item
            label={intl.get('customService.serviceName')}
            name="name"
            rules={[
              {
                required: true,
                message: intl.get('glossary.notNull')
              },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('global.onlyKeyboard')
              },
              {
                max: 50,
                message: intl.get('global.lenErr', { len: 50 })
              }
            ]}
          >
            <TrimmedInput
              onChange={() => {}}
              placeholder={intl.get('customService.inputServiceName')}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            label={intl.get('global.desc')}
            name="description"
            rules={[
              { max: 20000, message: intl.get('global.lenErr', { len: 20000 }) },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('global.onlyKeyboard')
              }
            ]}
            style={{ margin: 0 }}
          >
            <Input.TextArea
              placeholder={''}
              // autoSize={{ minRows: 3, maxRows: 5 }}
              style={{ maxHeight: 144, height: 144 }}
            />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};
export default CreateModal;

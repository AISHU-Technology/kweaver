import React, { useEffect } from 'react';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import * as promptServices from '@/services/prompt';
import UniversalModal from '@/components/UniversalModal';
import { ONLY_KEYBOARD } from '@/enums';

import { ProjectItem } from '../../types';
import './style.less';

export interface ProjectOperateModalProps {
  className?: string;
  visible?: boolean;
  action?: 'create' | 'edit' | string;
  data?: ProjectItem;
  onOk?: (action: string, id?: string) => void;
  onCancel?: () => void;
}

/**
 * 提示词项目操作弹窗
 */
const ProjectOperateModal = (props: ProjectOperateModalProps) => {
  const { className, visible, action = 'create', data, onOk, onCancel } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    if (!_.isEmpty(data) && action === 'edit') {
      form.setFieldsValue({ prompt_item_name: data!.prompt_item_name });
    }
  }, []);

  const handleSave = async (values: any) => {
    const body = { ...values, is_management: true };
    if (action === 'edit') body.prompt_item_id = data?.prompt_item_id;
    const servicesFunc = action === 'create' ? promptServices.promptProjectAdd : promptServices.promptProjectEdit;
    try {
      const { res } = (await servicesFunc(body)) || {};
      res && onOk?.(action, action === 'create' ? res : undefined);
    } catch (err) {
      const { description, code } = err?.response || err?.data || err || {};
      if (
        [
          'ModelFactory.PromptController.PromptItemAdd.NameError',
          'ModelFactory.PromptController.PromptItemEdit.NameError'
        ].includes(code)
      ) {
        return form.setFields([
          {
            name: 'prompt_item_name',
            errors: [intl.get('global.repeatName')]
          }
        ]);
      }
      description && message.error(description);
    }
  };

  const submit = () => {
    form
      .validateFields()
      .then(values => {
        const valueTrim = values?.prompt_item_name?.trim?.();
        if (!valueTrim) {
          form.setFields([{ name: 'prompt_item_name', errors: [intl.get('global.noNull')] }]);
          return;
        }
        form.setFieldsValue({ prompt_item_name: valueTrim });
        handleSave({ ...values, prompt_item_name: valueTrim });
      })
      .catch(err => {
        //
      });
  };

  return (
    <UniversalModal
      className={classNames(className, 'manage-project-operate-modal-root')}
      title={action === 'create' ? intl.get('prompt.createGroup') : intl.get('prompt.editGroup')}
      open={visible}
      width={480}
      zIndex={2000}
      onCancel={onCancel}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: onCancel },
        { label: intl.get('global.ok'), type: 'primary', onHandle: submit }
      ]}
    >
      <div className="kw-h-100">
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            label={intl.get('prompt.promptGroup')}
            name="prompt_item_name"
            validateFirst
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
            ]}
          >
            <Input placeholder={intl.get('prompt.manageNamePlace')} onPressEnter={submit} />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default (props: ProjectOperateModalProps) => (props.visible ? <ProjectOperateModal {...props} /> : null);

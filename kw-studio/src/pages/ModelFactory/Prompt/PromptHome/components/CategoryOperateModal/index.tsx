import React, { useEffect } from 'react';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import * as promptServices from '@/services/prompt';
import UniversalModal from '@/components/UniversalModal';
import { ONLY_KEYBOARD } from '@/enums';

import { CategoryItem } from '../../types';
import './style.less';

export interface CategoryOperateModalProps {
  className?: string;
  visible?: boolean;
  action?: 'create' | 'edit' | string;
  data: CategoryItem;
  onOk?: (action: string, id?: string) => void;
  onCancel?: () => void;
}

/**
 * 提示词项目操作弹窗
 */
const CategoryOperateModal = (props: CategoryOperateModalProps) => {
  const { className, visible, action = 'create', data, onOk, onCancel } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    if (!_.isEmpty(data) && action === 'edit') {
      form.setFieldsValue({ prompt_item_type: data?.prompt_item_type_name });
    }
  }, []);

  const handleSave = async (values: any) => {
    const body = { ...values };
    if (action === 'create') body.prompt_item_id = data.prompt_item_id;
    if (action === 'edit') body.prompt_item_type_id = data.prompt_item_type_id;
    const servicesFunc = action === 'create' ? promptServices.promptCategoryAdd : promptServices.promptCategoryEdit;
    try {
      const { res } = (await servicesFunc(body)) || {};
      res && onOk?.(action, action === 'create' ? res : undefined);
    } catch (err) {
      const { description, code } = err?.response || err?.data || err || {};
      if (
        [
          'ModelFactory.PromptController.PromptTypeAdd.NameError',
          'ModelFactory.PromptController.PromptTypeEdit.NameError'
        ].includes(code)
      ) {
        return form.setFields([
          {
            name: 'prompt_item_type',
            errors: [intl.get('global.repeatName')]
          }
        ]);
      }
      description && message.error(description);
    }
  };

  /**
   * 提交
   */
  const submit = () => {
    form
      .validateFields()
      .then(values => {
        const valueTrim = values?.prompt_item_type?.trim?.();
        if (!valueTrim) {
          form.setFields([{ name: 'prompt_item_type', errors: [intl.get('global.noNull')] }]);
          return;
        }

        form.setFieldsValue({ prompt_item_type: valueTrim });
        handleSave({ ...values, prompt_item_type: valueTrim });
      })
      .catch(err => {
        //
      });
  };

  return (
    <UniversalModal
      className={classNames(className, 'prompt-category-operate-modal')}
      title={action === 'create' ? intl.get('prompt.createGroup') : intl.get('prompt.editGroup')}
      visible={visible}
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
            name="prompt_item_type"
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

export default (props: CategoryOperateModalProps) => (props.visible ? <CategoryOperateModal {...props} /> : null);

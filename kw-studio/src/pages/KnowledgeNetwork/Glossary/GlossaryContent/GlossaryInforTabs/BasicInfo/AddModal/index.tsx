import React, { memo, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { Button, Form, Input, message, Select } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import KwScrollBar from '@/components/KwScrollBar';
import TemplateModal from '@/components/TemplateModal';
import IconFont from '@/components/IconFont';
import './style.less';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { TermLabelType } from '@/pages/KnowledgeNetwork/Glossary/types';
import { editTerm } from '@/services/glossaryServices';
import UniversalModal from '@/components/UniversalModal';
import TrimmedInput from '@/components/TrimmedInput';
import { ONLY_KEYBOARD } from '@/enums';

const AddLanguageModal = (props: any) => {
  const {
    glossaryStore: { selectedTerm, glossaryData }
  } = useGlossaryStore();
  const { visible, editData, onCancel, refreshTerm } = props;
  const [nameFieldValidate, setNameFieldValidate] = useState({
    status: undefined as any,
    help: undefined as any
  });
  const [autoFocus, setAutoFocus] = useState<boolean>(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (editData) {
      form.setFieldsValue(editData);
    }
  }, [editData]);

  /** 先校验之前的是否输入 */
  const onAdd = (callback: any) => {
    const synonymData = form.getFieldValue('synonym');
    if (!synonymData || synonymData.length === 0) {
      setAutoFocus(true);
      callback();
      return;
    }
    const names = _.times(synonymData.length, index => ['synonym', index]);
    const errorList = form.getFieldsError(names);
    const haveError = errorList.find((item: any) => item.errors.length > 0);
    if (!haveError) {
      setAutoFocus(true);
      callback();
    }
  };

  const onFinish = async (values: TermLabelType) => {
    try {
      await editTerm(glossaryData!.id, selectedTerm[0].id, {
        action: editData ? 'update' : 'add',
        language: values.language,
        label: {
          name: values.name,
          description: values.description ?? '',
          synonym: values.synonym ?? []
        }
      });
      message.success(intl.get('global.saveSuccess'));
      refreshTerm(selectedTerm[0].id);
      onCancel();
    } catch (error) {
      const { ErrorCode, ErrorDetails } = error.type === 'message' ? error.response : error.data;
      if (ErrorCode.includes('Builder.TaxonomyService.EditWordLabel.DuplicateName')) {
        setNameFieldValidate({
          status: 'error',
          help: intl.get('glossary.glossaryDuplicateName')
        });
      } else {
        message.error(ErrorDetails);
      }
    }
  };

  const prefixCls = 'addLanguageModal';

  const selectOptions = useMemo(() => {
    const addedLanguage = selectedTerm[0].label.map(item => item.language);
    return languageOptions.filter(item => !addedLanguage.includes(item.value));
  }, [selectedTerm]);

  return (
    <UniversalModal
      title={editData ? intl.get('glossary.editTranslateAndSynonym') : intl.get('glossary.addTranslateAndSynonym')}
      className={prefixCls}
      open={visible}
      onCancel={onCancel}
      footerData={[
        {
          label: intl.get('global.cancel'),
          type: 'default',
          onHandle: () => {
            onCancel();
          }
        },
        {
          label: intl.get('global.ok'),
          type: 'primary',
          onHandle: _.debounce(() => {
            let haveError;
            const synonymData = form.getFieldValue('synonym');
            if (synonymData) {
              const names = _.times(synonymData.length, index => ['synonym', index]);
              const errorList = form.getFieldsError(names);
              haveError = errorList.find((item: any) => item.errors.length > 0);
            }
            if (!haveError) {
              form.submit();
            }
          }, 300)
        }
      ]}
    >
      <Form form={form} className="formWrapper" layout="vertical" onFinish={onFinish}>
        <Form.Item
          label={intl.get('glossary.language')}
          name="language"
          rules={[{ required: true, message: intl.get('glossary.notNull') }]}
          initialValue={selectOptions[0]?.value}
        >
          <Select options={editData ? languageOptions : selectOptions} disabled={!!editData} />
        </Form.Item>
        <Form.Item
          label={intl.get('glossary.translate')}
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
              max: 255,
              message: intl.get('global.lenErr', { len: 255 })
            }
          ]}
          validateStatus={nameFieldValidate.status}
          help={nameFieldValidate.help}
        >
          <TrimmedInput
            onChange={() => {
              if (nameFieldValidate.status === 'error') {
                setNameFieldValidate({
                  status: undefined,
                  help: undefined
                });
              }
            }}
            placeholder={intl.get('glossary.translatePlaceholder')}
            autoComplete="off"
          />
        </Form.Item>
        <div className="kw-c-text">{intl.get('glossary.synonym')}</div>
        <Form.List name="synonym">
          {(fields, { add, remove }) => (
            <>
              <Button type="link" onClick={() => onAdd(add)} style={{ minWidth: 52, marginBottom: 16, padding: 0 }}>
                <PlusOutlined />
                <span>{intl.get('global.add')}</span>
              </Button>
              {fields.map((field, index) => {
                return (
                  <Form.Item required={false} key={field.key}>
                    <div className="kw-align-center">
                      <IconFont
                        type="icon-del"
                        onClick={() => {
                          remove(field.name);
                        }}
                        className="kw-mr-1"
                        style={{ color: '#bfbfbf' }}
                      />
                      <Form.Item
                        noStyle
                        {...field}
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
                            max: 255,
                            message: intl.get('global.lenErr', { len: 255 })
                          },
                          {
                            validator: async (rule, value) => {
                              const dataArr = form.getFieldValue('synonym');
                              const data = dataArr.filter((item: any) => item === value);
                              if (data.length > 1) {
                                throw new Error(intl.get('glossary.glossaryDuplicateName'));
                              }
                            }
                          }
                        ]}
                      >
                        <TrimmedInput autoFocus={autoFocus} placeholder={intl.get('glossary.synonymPlaceholder')} />
                      </Form.Item>
                    </div>
                  </Form.Item>
                );
              })}
            </>
          )}
        </Form.List>
        <Form.Item
          label={intl.get('glossary.description')}
          name="description"
          rules={[
            {
              pattern: ONLY_KEYBOARD,
              message: intl.get('global.onlyKeyboard')
            },
            {
              max: 255,
              message: intl.get('global.lenErr', { len: 255 })
            }
          ]}
        >
          <Input.TextArea placeholder={intl.get('glossary.descriptionPlace')} autoSize={{ minRows: 3, maxRows: 5 }} />
        </Form.Item>
      </Form>
    </UniversalModal>
  );
};
export default (props: any) => (props?.visible ? <AddLanguageModal {...props} /> : null);

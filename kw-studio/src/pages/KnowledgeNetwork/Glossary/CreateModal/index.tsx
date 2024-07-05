import React, { useEffect, useState } from 'react';
import { Form, Input, message, Select, Spin } from 'antd';
import intl from 'react-intl-universal';
import TemplateModal from '@/components/TemplateModal';
import LoadingMask from '@/components/LoadingMask';
import { createGlossary, editGlossary } from '@/services/glossaryServices';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import HOOKS from '@/hooks';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import UniversalModal from '@/components/UniversalModal';
import TrimmedInput from '@/components/TrimmedInput';
import { ONLY_KEYBOARD } from '@/enums';
import { tipModalFunc } from '@/components/TipModal';

type FormValues = {
  name: string;
  default_language: string;
  description: string;
};
const CreateModal = (props: any) => {
  const language = HOOKS.useLanguage();
  const prefixLocale = 'glossary';
  const { editData, onClose, kwId, refreshTableData, openDetailPage } = props;
  const { setGlossaryStore } = useGlossaryStore();
  const [okBtnProps, setOkBtnProps] = useState({
    loading: false,
    btnText: intl.get('global.ok')
  });
  const [nameFieldValidate, setNameFieldValidate] = useState({
    status: undefined as any,
    help: undefined as any
  });
  const [form] = Form.useForm();

  useEffect(() => {
    if (editData?.name) {
      const { name, default_language, description } = editData;
      form.setFieldsValue({ name, default_language, description });
    }
  }, [editData]);

  const formFinish = async (values: FormValues) => {
    setOkBtnProps(prevState => ({
      ...prevState,
      loading: true,
      btnText: `${intl.get('glossary.creating')}...`
    }));
    try {
      if (editData) {
        await editGlossary(editData.id, { ...values });
        setGlossaryStore(preStore => ({
          ...preStore,
          glossaryData: {
            ...preStore.glossaryData,
            ...values
          },
          selectedLanguage: values.default_language
        }));
        message.success(intl.get('global.saveSuccess'));
      } else {
        const data = await createGlossary({ knw_id: kwId, ...values });
        openDetailPage();
        setGlossaryStore(preStore => ({
          ...preStore,
          glossaryData: {
            id: data.res,
            ...values
          },
          mode: 'edit',
          selectedLanguage: values.default_language
        }));
      }
      refreshTableData?.();
      onClose?.();
    } catch (error) {
      setOkBtnProps(prevState => ({
        ...prevState,
        loading: false,
        btnText: intl.get('global.ok')
      }));
      const { ErrorCode, ErrorDetails } = error.type === 'message' ? error.response : error.data;
      if (ErrorCode.includes('DuplicateName')) {
        setNameFieldValidate({
          status: 'error',
          help: intl.get(`${prefixLocale}.glossaryDuplicateName`)
        });
      } else {
        message.error(ErrorDetails);
      }
    }
    setOkBtnProps(prevState => ({
      ...prevState,
      loading: false,
      btnText: intl.get('global.ok')
    }));
  };

  const closeModal = () => {
    if (!okBtnProps.loading) {
      onClose();
    }
  };

  return (
    <UniversalModal
      title={editData ? intl.get(`${prefixLocale}.editGlossaryTitle`) : intl.get(`${prefixLocale}.createGlossaryTitle`)}
      open
      width={640}
      onCancel={closeModal}
      footerData={[
        {
          label: intl.get('global.cancel'),
          type: 'default',
          onHandle: () => {
            closeModal();
          }
        },
        {
          label: okBtnProps.btnText,
          type: 'primary',
          onHandle: () => {
            form.submit();
          }
        }
      ]}
    >
      <div>
        <LoadingMask loading={okBtnProps.loading} />
        <Form layout="vertical" form={form} onFinish={formFinish}>
          <Form.Item
            label={intl.get(`${prefixLocale}.glossaryName`)}
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
              placeholder={intl.get(`${prefixLocale}.glossaryNamePlaceholder`)}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            label={intl.get(`${prefixLocale}.defaultLanguage`)}
            name="default_language"
            rules={[
              {
                required: true,
                message: intl.get('global.noNull')
              }
            ]}
            initialValue={language === 'en-US' ? 'en' : 'zh_CN'}
          >
            <Select placeholder={intl.get(`${prefixLocale}.defaultLanguagePlaceholder`)} options={languageOptions} />
          </Form.Item>
          <Form.Item
            label={intl.get('global.desc')}
            name="description"
            rules={[
              { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
              {
                pattern: ONLY_KEYBOARD,
                message: intl.get('global.onlyKeyboard')
              }
            ]}
          >
            <Input.TextArea
              placeholder={intl.get(`${prefixLocale}.descriptionPlaceholder`)}
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};
export default CreateModal;

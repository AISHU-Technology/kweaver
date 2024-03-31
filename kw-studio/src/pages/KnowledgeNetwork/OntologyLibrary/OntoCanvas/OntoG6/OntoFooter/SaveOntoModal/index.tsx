import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import intl from 'react-intl-universal';
import { Space, Button, Table, Checkbox, Select, Form, Input, Modal, Radio, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SettingOutlined, MinusCircleOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';

import UniversalModal from '@/components/UniversalModal';
import Labels from './Labels';
import type { FormInstance } from 'antd/es/form/Form';

import './style.less';

const DES_TEST = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;

export interface SaveOntoDataType {
  ontologyName: string;
  domainArray: string[];
  ontologyDescribe: string;
}

export interface SaveOntoDataProps {
  showSaveOntologyModal: boolean;
  closeSaveOntologyModal: (e: any) => void;
  modalOkSave: Function;
  initData: SaveOntoDataType;
  modalTitle: string;
}

export interface SaveOntoModalRef {
  dataSummary: React.MutableRefObject<SaveOntoDataType | undefined>;
  formDetailError: React.MutableRefObject<string>;
  form: FormInstance<any>;
}

const SaveOntologyModal: React.ForwardRefRenderFunction<SaveOntoModalRef, SaveOntoDataProps> = (
  saveOntoProps,
  saveOntoRef
) => {
  useImperativeHandle(saveOntoRef, () => ({
    dataSummary,
    formDetailError,
    form
  }));

  const [form] = Form.useForm();
  const { TextArea } = Input;
  const { showSaveOntologyModal, closeSaveOntologyModal, modalOkSave, initData, modalTitle } = saveOntoProps;

  const [ontologyName, setOntologyName] = useState<string>(initData.ontologyName);
  const [ontologyDescribe, setOntologyDescribe] = useState<string>(initData.ontologyDescribe);
  const [domainArray, setDomainArray] = useState<string[]>(initData.domainArray); // 已生成的领域标签
  const [selectOption, setSelectOption] = useState<Array<string>>([]); // 候选的标签（暂无）
  const dataSummary = useRef<SaveOntoDataType | undefined>();

  const [domainErr, setDomainErr] = useState(false); // 领域是否有错误
  const formDetailError = useRef(''); // form的错误

  useEffect(() => {
    dataSummary.current = {
      ontologyName,
      ontologyDescribe,
      domainArray
    };
  }, [ontologyName, ontologyDescribe, domainArray]);

  const modalOkFunc = async () => {
    if (domainErr) {
      return;
    }
    try {
      await form.validateFields(['ontologyName', 'ontoDescribe']);
      modalOkSave();
    } catch (error) {}
  };

  const ontoNameChange = (value: any) => {
    formDetailError.current = '';

    setOntologyName(value);
  };

  const ontoDescribeChange = (e: any) => {
    setOntologyDescribe(e.target.value);
  };

  return (
    <UniversalModal
      className="create-saveOnto-content"
      width={'640px'}
      title={modalTitle}
      visible={showSaveOntologyModal}
      destroyOnClose={true}
      maskClosable={false}
      onCancel={closeSaveOntologyModal}
      onOk={modalOkFunc}
      footerData={[
        { label: intl.get('graphList.cancel'), onHandle: closeSaveOntologyModal },
        { label: intl.get('graphList.sure'), type: 'primary', onHandle: modalOkFunc }
      ]}
    >
      <div className="create-saveOnto-content">
        <Form preserve={false} form={form} layout={'vertical'} requiredMark={true}>
          <Form.Item
            name="ontologyName"
            initialValue={ontologyName}
            validateFirst={true}
            style={{ fontSize: '14px', color: '#000000D9' }}
            label={intl.get('ontoLib.ontoName')}
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
              { max: 50, message: intl.get('ontoLib.errInfo.maxLen', { len: 50 }) },
              { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
              {
                validator: async (rule, value) => {
                  if (formDetailError.current !== '') {
                    throw new Error(formDetailError.current);
                  }
                }
              }
            ]}
            required
          >
            <TrimmedInput
              autoComplete="off"
              style={{ color: '#000000A6' }}
              onChange={(e: any) => ontoNameChange(e)}
              placeholder={intl.get('ontoLib.ontoNamePlaceHold')}
            />
          </Form.Item>
        </Form>

        <Form preserve={false} form={form} layout={'vertical'}>
          <Form.Item name="labels" label={intl.get('ontoLib.domain')}>
            <Labels
              setTags={setDomainArray}
              tags={domainArray}
              selectOption={selectOption}
              setDomainErr={setDomainErr}
            />
          </Form.Item>
        </Form>

        <Form preserve={false} form={form} layout={'vertical'}>
          <Form.Item
            name="ontoDescribe"
            initialValue={ontologyDescribe}
            label={intl.get('ontoLib.domainDescribe')}
            validateFirst={true}
            rules={[
              { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
              { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
              { pattern: DES_TEST, message: intl.get('ontoLib.errInfo.ceLettersNumberSymbols') }
            ]}
          >
            <TextArea
              style={{ fontSize: '14px', color: '#000000A6', marginTop: '8px' }}
              rows={4}
              placeholder={intl.get('ontoLib.domainDescribePlaceHold')}
              onChange={e => ontoDescribeChange(e)}
            />
          </Form.Item>
        </Form>
      </div>
    </UniversalModal>
  );
};

export default forwardRef(SaveOntologyModal);

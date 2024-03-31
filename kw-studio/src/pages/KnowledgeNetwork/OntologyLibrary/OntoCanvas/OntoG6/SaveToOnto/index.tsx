import _ from 'lodash';
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import intl from 'react-intl-universal';
import { Space, Button, Table, Checkbox, Select, Form, Input, Modal, Radio, message } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SettingOutlined, MinusCircleOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import Labels from './Labels';
import servicesCreateEntity from '@/services/createEntity';
import { getParam } from '@/utils/handleFunction';
import { ONLY_KEYBOARD, PERMISSION_KEYS } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';
import type { FormInstance } from 'antd/es/form/Form';
import LoadingMask from '@/components/LoadingMask';

import servicesPermission from '@/services/rbacPermission';

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
  firstShow: boolean;
}

export interface SaveToOntoRef {
  dataSummary: React.MutableRefObject<SaveOntoDataType | undefined>;
  formDetailError: React.MutableRefObject<string>;
  form: FormInstance<any>;
}

const SaveToOnto: React.ForwardRefRenderFunction<SaveToOntoRef, SaveOntoDataProps> = (saveOntoProps, saveOntoRef) => {
  useImperativeHandle(saveOntoRef, () => ({
    dataSummary,
    formDetailError,
    form
  }));

  const [form] = Form.useForm();
  const { TextArea } = Input;
  const { showSaveOntologyModal, closeSaveOntologyModal, modalOkSave, initData, modalTitle, firstShow } = saveOntoProps;

  const [ontologyName, setOntologyName] = useState<string>(initData.ontologyName);
  const [ontologyDescribe, setOntologyDescribe] = useState<string>(initData.ontologyDescribe);
  const [domainArray, setDomainArray] = useState<string[]>(initData.domainArray); // 已生成的领域标签
  const [selectOption, setSelectOption] = useState<Array<string>>([]); // 候选的标签（暂无）
  const [saveType, setSaveType] = useState<string>(firstShow ? 'create' : 'cover');
  const [selectData, setSelectData] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]);
  const [selId, setSelId] = useState('');
  const [domainErr, setDomainErr] = useState(false); // 领域是否有错误
  const formDetailError = useRef(''); // form的错误

  const dataSummary = useRef<SaveOntoDataType | undefined>();
  const [fetchOntologyDataLoading, setFetchOntologyDataLoading] = useState(true);
  useEffect(() => {
    dataSummary.current = {
      ontologyName,
      ontologyDescribe,
      domainArray
    };
  }, [ontologyName, ontologyDescribe, domainArray]);

  const fetchData = async () => {
    setFetchOntologyDataLoading(true);
    const OntologyData = {
      knw_id: getParam('knId'),
      page: -1,
      size: 10,
      rule: 'update',
      order: 'desc',
      search: '',
      filter: ''
    };
    const { filter, ...importData } = OntologyData;
    const { res } = (await servicesCreateEntity.getAllNoumenon(filter ? OntologyData : importData)) || {};
    if (res?.count) {
      const otlList = res.otls;
      const dataIds = res.otls.map((item: any) => String(item?.otl_id));
      const postData = { dataType: PERMISSION_KEYS.TYPE_ONTOLOGY, dataIds };
      // const result = await servicesPermission.dataPermission(postData);
      // const codesData = _.keyBy(result?.res, 'dataId');
      // const newOtlList = otlList.map((item: any) => {
      //   return {
      //     ...item,
      //     __codes: codesData?.[item.otl_id]?.codes
      //   };
      // });

      // const targetData = newOtlList.filter((item: any) => item.__codes.includes(PERMISSION_KEYS.OTL_EDIT));

      // const arrNew = targetData.map((item: any) => {
      //   return {
      //     value: item.otl_id,
      //     label: item.ontology_name
      //   };
      // });
      const arrNew = otlList.map((item: any) => {
        return {
          value: item.otl_id,
          label: item.ontology_name
        };
      });
      setSelectData(arrNew);
      // setFullData(targetData);
      setFullData(otlList);
      setFetchOntologyDataLoading(false);
    } else {
      setFetchOntologyDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const modalOkFunc = async () => {
    if (domainErr) {
      return;
    }
    try {
      await form.validateFields(['ontologyName', 'ontoDescribe']);
      modalOkSave(saveType, selId);
    } catch (error) {}
  };

  const ontoNameChange = (value: any) => {
    formDetailError.current = '';

    setOntologyName(value);
  };

  const ontoDescribeChange = (e: any) => {
    setOntologyDescribe(e.target.value);
  };

  const onRadioAttrIndexChange = (e: any) => {
    setSaveType(e.target.value);
    form.setFieldsValue({ ontologyName: undefined, ontoDescribe: '' });
    setOntologyName('');
    setDomainArray([]);
    setOntologyDescribe('');
  };

  const selectValueChanged = (value: string, option: any) => {
    setSelId(value);
    const filterData = _.filter(fullData, item => item.otl_id === value);
    setDomainArray(filterData[0].domain);
    form.setFieldsValue({ ontoDescribe: filterData[0].ontology_des });
    setOntologyDescribe(filterData[0].ontology_des);
    form.setFieldsValue({ ontologyName: filterData[0].ontology_name });
    setOntologyName(filterData[0].ontology_name);
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
      {fetchOntologyDataLoading ? (
        <LoadingMask loading />
      ) : (
        <div className="create-saveOnto-content">
          <Form preserve={false} form={form} style={{ height: '52px' }} layout={'vertical'}>
            <Form.Item
              name="saveType"
              initialValue={saveType}
              style={{ fontSize: '14px', color: '#000000D9' }}
              label={intl.get('ontoLib.saveToType')}
            >
              {selectData.length > 0 ? (
                <Radio.Group name="radiogroup" onChange={onRadioAttrIndexChange} value={saveType}>
                  <Radio value={'create'}>{intl.get('ontoLib.saveToTypeCreate')}</Radio>
                  <Radio value={'cover'}>{intl.get('ontoLib.saveToTypeCover')}</Radio>
                </Radio.Group>
              ) : (
                <Select
                  disabled
                  showArrow={false}
                  options={[{ label: intl.get('ontoLib.saveToTypeCreate'), value: 'create' }]}
                />
              )}
            </Form.Item>
          </Form>

          <Form
            preserve={false}
            form={form}
            style={{ width: '100%', marginTop: '24px' }}
            layout={'vertical'}
            requiredMark={true}
          >
            <Form.Item
              name="ontologyName"
              // initialValue={ontologyName}
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
              {saveType === 'create' ? (
                <TrimmedInput
                  autoComplete="off"
                  style={{ color: '#000000A6' }}
                  onChange={(e: any) => ontoNameChange(e)}
                  placeholder={intl.get('ontoLib.ontoNamePlaceHold')}
                />
              ) : (
                <Select
                  placeholder={intl.get('ontoLib.saveToSelHold')}
                  style={{ color: '#000000A6' }}
                  onChange={selectValueChanged}
                  options={selectData}
                />
              )}
            </Form.Item>
          </Form>

          <Form preserve={false} form={form} layout={'vertical'} style={{ marginTop: '24px' }}>
            <Form.Item name="labels" label={intl.get('ontoLib.domain')}>
              <Labels
                setTags={setDomainArray}
                tags={domainArray}
                selectOption={selectOption}
                setDomainErr={setDomainErr}
              />
            </Form.Item>
          </Form>

          <Form preserve={false} form={form} layout={'vertical'} style={{ marginTop: '24px' }}>
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
                style={{ fontSize: '14px', color: '#000000A6' }}
                rows={4}
                placeholder={intl.get('ontoLib.domainDescribePlaceHold')}
                onChange={e => ontoDescribeChange(e)}
              />
            </Form.Item>
          </Form>
        </div>
      )}
    </UniversalModal>
  );
};

export default forwardRef(SaveToOnto);

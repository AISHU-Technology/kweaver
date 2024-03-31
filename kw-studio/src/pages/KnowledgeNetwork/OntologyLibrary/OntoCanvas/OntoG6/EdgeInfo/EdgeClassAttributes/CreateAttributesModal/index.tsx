import React, { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Button, Select, Form, Input, Radio, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TemplateModal from '@/components/TemplateModal';
import Format from '@/components/Format';
import SynonymsList from '../../../components/SynonymsList';
import './style.less';

const DES_TEST = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;

export interface EdgeAttributesDataType {
  attrName: string;
  attrDisplayName: string;
  attrType: string;
  attrIndex: boolean;
  attrSynonyms: string[];
  attrDescribe: string;
  error?: any;
}

export interface EdgeModalAttributesProps {
  showCreateAttributesModal: boolean;
  closeCreateAttributesModal: (e: any) => void;
  setModalAttributes: (data: EdgeAttributesDataType, index: number) => any;
  dataOutsideIndex: number;
  defaultIndexSwitch: boolean;
  edgeAttributes: EdgeAttributesDataType[];
  modalType: string;
  readOnly?: boolean;
  disabled?: boolean;
}

const attrSelOpts = [
  { value: 'boolean', label: 'boolean' },
  { value: 'date', label: 'date' },
  { value: 'datetime', label: 'datetime' },
  { value: 'decimal', label: 'decimal' },
  { value: 'double', label: 'double' },
  { value: 'float', label: 'float' },
  { value: 'integer', label: 'integer' },
  { value: 'string', label: 'string' }
];

const CreateAttributesModal = (props: EdgeModalAttributesProps) => {
  const [form] = Form.useForm();
  const sysRef = useRef<any>();

  const { TextArea } = Input;

  const {
    showCreateAttributesModal,
    closeCreateAttributesModal,
    edgeAttributes,
    setModalAttributes,
    defaultIndexSwitch,
    dataOutsideIndex,
    modalType,
    readOnly,
    disabled
  } = props;

  const [attrName, setAttrName] = useState<string>(
    dataOutsideIndex === -1 ? '' : edgeAttributes[dataOutsideIndex].attrName
  );
  const [attrDisplayName, setAttrDisplayName] = useState<string>(
    dataOutsideIndex === -1 ? '' : edgeAttributes[dataOutsideIndex].attrDisplayName
  );
  const [attrType, setAttrType] = useState<string>(
    dataOutsideIndex === -1 ? 'string' : edgeAttributes[dataOutsideIndex].attrType
  );
  const [attrIndex, setAttrIndex] = useState<boolean>(
    dataOutsideIndex === -1 ? false : edgeAttributes[dataOutsideIndex].attrIndex
  );
  const [attrSynonyms, setAttrSynonyms] = useState<{ value: string; error?: string }[]>(() => {
    const array = dataOutsideIndex === -1 ? [] : edgeAttributes[dataOutsideIndex].attrSynonyms;
    return (_.filter(array, d => d.trim()) as string[]).map(d => ({ value: d }));
  });
  const [attrDescribe, setAttrDescribe] = useState<string>(
    dataOutsideIndex === -1 ? '' : edgeAttributes[dataOutsideIndex].attrDescribe
  );

  const [aliasHasChanged, setAliasHasChanged] = useState(false); // 是否修改过显示名

  useEffect(() => {
    if (dataOutsideIndex === -1 && defaultIndexSwitch) {
      setAttrIndex(true);
    }
    if (modalType === 'edit') {
      setAliasHasChanged(true);
    }

    form.validateFields();
    sysRef.current.validateFields();
  }, []);

  const edgeAttrNameChange = (e: any) => {
    if (!aliasHasChanged) {
      form.setFieldsValue({ edgeAttrDisplayName: e.target.value });
      form.validateFields(['edgeAttrDisplayName']);
      setAttrDisplayName(e.target.value);
    }
    setAttrName(e.target.value);
  };

  const attrDisplayNameChange = (e: any) => {
    setAliasHasChanged(true);
    setAttrDisplayName(e.target.value);
  };

  const attrDescribeChange = (e: any) => {
    setAttrDescribe(e.target.value);
  };

  const attrTypeChange = (value: string, option: any) => {
    setAttrType(value);
  };

  const onRadioAttrIndexChange = (e: any) => {
    setAttrIndex(e.target.value);
  };

  /**
   * 新增同义词
   */
  const onAddSynonyms = () => {
    let hasError = false;
    if (attrSynonyms.length && !attrSynonyms[0].value) {
      const cloneData = [...attrSynonyms];
      cloneData[0].error = intl.get('ontoLib.errInfo.emptyInput');
      setAttrSynonyms(cloneData);
      hasError = true;
    }
    if (hasError || _.some(attrSynonyms, d => d.error)) return;
    setAttrSynonyms([{ value: '' }, ...attrSynonyms]);
  };

  /**
   * 同义词变化
   * @param data 新的同义词
   */
  const onSynonymsChange = (data: any[]) => {
    setAttrSynonyms(data);
  };

  const modalOkFunc = () => {
    if (_.some(attrSynonyms, d => d.error)) return;
    form.validateFields().then(async values => {
      setModalAttributes(
        {
          attrName,
          attrDisplayName,
          attrType,
          attrIndex,
          attrDescribe,
          attrSynonyms: _.map(attrSynonyms, d => d.value).filter(Boolean)
        },
        dataOutsideIndex
      );
      // message.success(intl.get('ontoLib.opOK'));
      message.success({
        content: intl.get('ontoLib.opOK'),
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    });
  };

  return (
    <TemplateModal
      width={480}
      title={
        modalType === 'edit'
          ? intl.get('ontoLib.canvasEdge.editEdgeAttrTitle')
          : intl.get('ontoLib.canvasEdge.createEdgeAttrTitle')
      }
      visible={showCreateAttributesModal}
      onCancel={closeCreateAttributesModal}
      onOk={modalOkFunc}
    >
      <div style={{ height: '500px', padding: '24px 4px 64px 24px' }} className="create-attr-modal-content">
        <div className="kw-h-100" style={{ overflowY: 'auto', paddingRight: 20 }}>
          <Form preserve={false} form={form} requiredMark={true} colon={false}>
            <Form.Item
              name="edgeAttrName"
              initialValue={attrName}
              validateFirst={true}
              style={{ fontSize: '14px', color: '#000000D9' }}
              label={intl.get('ontoLib.canvasEdge.edgeAttrName')}
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
                { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
                { pattern: /^[0-9a-zA-Z_]{1,}$/, message: intl.get('ontoLib.errInfo.eLettersNumber_') },
                {
                  validator: async (_, value) => {
                    // 校验属性名是否重复
                    const filterNames = edgeAttributes.filter(
                      (item, index) =>
                        item.attrName === value && (dataOutsideIndex === -1 ? true : dataOutsideIndex !== index)
                    );
                    if (filterNames.length > 0) throw new Error(intl.get('global.repeatName'));
                  }
                }
              ]}
              required
            >
              <Input
                disabled={disabled || readOnly}
                autoComplete="off"
                style={{ color: '#000000A6' }}
                onChange={e => edgeAttrNameChange(e)}
                placeholder={intl.get('ontoLib.canvasEdge.edgeAttrNamePlaceHold')}
              />
            </Form.Item>

            <Form.Item
              name="edgeAttrDisplayName"
              validateFirst={true}
              initialValue={attrDisplayName}
              style={{ fontSize: '14px', color: '#000000D9' }}
              label={intl.get('ontoLib.canvasEdge.edgeAttrDisplayName')}
              rules={[
                { required: true, message: intl.get('global.noNull') },
                { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
                { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
                { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: intl.get('ontoLib.errInfo.ceLettersNumber_') },
                {
                  validator: async (_, value) => {
                    // 校验属性显示名是否重复
                    const filterAlias = edgeAttributes.filter(
                      (item, index) =>
                        item.attrDisplayName === value && (dataOutsideIndex === -1 ? true : dataOutsideIndex !== index)
                    );
                    if (filterAlias.length > 0) throw new Error(intl.get('global.repeatName'));
                  }
                }
              ]}
              required
            >
              <Input
                disabled={readOnly}
                autoComplete="off"
                style={{ color: '#000000A6' }}
                onChange={e => attrDisplayNameChange(e)}
                placeholder={intl.get('ontoLib.canvasEdge.edgeAttrDisplayNamePlaceHold')}
              />
            </Form.Item>

            <Form.Item
              name="edgeAttrType"
              initialValue={attrType}
              style={{ fontSize: '14px', color: '#000000D9' }}
              label={intl.get('ontoLib.canvasEdge.edgeAttrType')}
              required
            >
              <Select
                disabled={disabled || readOnly}
                style={{ color: '#000000A6' }}
                className="edge-class-attributes-table-select"
                onChange={attrTypeChange}
                options={attrSelOpts}
                // defaultValue={attrType}
              />
            </Form.Item>
          </Form>

          <Form preserve={false} form={form} colon={false}>
            <Form.Item
              name="entityAttrIndex"
              initialValue={dataOutsideIndex === -1 ? defaultIndexSwitch : attrIndex}
              style={{ fontSize: '14px', color: '#000000D9' }}
              label={intl.get('ontoLib.canvasOnto.entityAttrIndex')}
            >
              <Radio.Group
                name="radiogroup"
                onChange={onRadioAttrIndexChange}
                value={attrIndex}
                disabled={disabled || readOnly}
              >
                <Radio value={true}>{intl.get('ontoLib.canvasOnto.radioOpen')}</Radio>
                <Radio value={false}>{intl.get('ontoLib.canvasOnto.radioClose')}</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>

          <div>
            <Format.Title strong={4} style={{ width: 100, paddingLeft: 11 }}>
              {intl.get('ontoLib.canvasEdge.attributesSynonyms')}
            </Format.Title>
            <Button
              type="link"
              style={{ height: 20, lineHeight: '20px', padding: 0, textAlign: 'left' }}
              icon={<PlusOutlined style={{ paddingRight: 2 }} />}
              disabled={readOnly}
              onClick={onAddSynonyms}
            >
              {intl.get('ontoLib.canvasEdge.addSynonyms')}
            </Button>
          </div>

          <div className="kw-pt-2 kw-pb-1" style={{ paddingLeft: 100 }}>
            <SynonymsList
              ref={sysRef}
              type="edge"
              readOnly={readOnly}
              data={attrSynonyms}
              onChange={onSynonymsChange}
            />
          </div>

          <Form preserve={false} form={form} colon={false}>
            <Form.Item
              className="kw-mt-2"
              name="edgeDescribe"
              initialValue={attrDescribe}
              label={intl.get('ontoLib.canvasEdge.attributesDescribe')}
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
                placeholder={intl.get('ontoLib.canvasEdge.attributesDescribePlaceHold')}
                readOnly={readOnly}
                onChange={e => attrDescribeChange(e)}
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    </TemplateModal>
  );
};

export default CreateAttributesModal;

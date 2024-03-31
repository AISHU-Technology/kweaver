import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import type { FormInstance } from 'antd/es/form/Form';
import { Button, Select, Form, Dropdown, Switch, Empty, Divider } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import CreateAttributesModal, { EdgeAttributesDataType } from './CreateAttributesModal';
import PropertyTable from '../../components/PropertyTable';
import kongImg from '@/assets/images/kong.svg';
import './style.less';
import { useLocation } from 'react-router-dom';

export interface EdgeAttributesFullDataType {
  edgeAttributes: EdgeAttributesDataType[];
  attrDefaultDisplay: string;
  attrIndexMaster: boolean;
  attrIndexDefault: boolean;
}

export interface EdgeAttributesProps {
  readOnly?: boolean;
  edgeAttributesData: EdgeAttributesFullDataType;
  updateData: Function;
  ontoLibType: string;
  selectedElement: Record<string, any>;
  isDisabledItem: Function;
  attrHasError: React.MutableRefObject<boolean | undefined>;
}

export interface EdgeAttributesRef {
  form: Pick<FormInstance<any>, 'validateFields'>;
  formHide: Pick<FormInstance<any>, 'validateFields'>;
  formSelect: FormInstance<any>;
  dataSummary: React.MutableRefObject<EdgeAttributesFullDataType | undefined>;
  setEdgeAttributes: any;
  setAttrDefaultDisplay: any;
  setAttrIndexMaster: any;
  setAttrIndexDefault: any;
}

const EdgeClassAttributes: React.ForwardRefRenderFunction<EdgeAttributesRef, EdgeAttributesProps> = (
  attributesProps,
  attributesRef
) => {
  useImperativeHandle(attributesRef, () => ({
    formSelect,
    dataSummary,
    form: {
      validateFields: propertyTableRef.current?.validateFields
    },
    formHide: {
      validateFields: validateEdgeAttrSynonymsDescribe
    },
    setEdgeAttributes,
    setAttrDefaultDisplay,
    setAttrIndexMaster,
    setAttrIndexDefault
  }));

  const [formSelect] = Form.useForm();
  const propertyTableRef = useRef<any>();

  const dataSummary = useRef<EdgeAttributesFullDataType | undefined>();

  // 外部传入的Detail数据
  const { edgeAttributesData, updateData, ontoLibType, selectedElement, isDisabledItem, attrHasError } =
    attributesProps;

  const [showCreateAttributesModal, setShowCreateAttributesModal] = useState(false); // 是否显示创建属性modal

  // 组件内属性
  const [edgeAttributes, setEdgeAttributes] = useState<EdgeAttributesDataType[]>(edgeAttributesData.edgeAttributes);
  // 组件内默认显示属性
  const [attrDefaultDisplay, setAttrDefaultDisplay] = useState<string>(edgeAttributesData.attrDefaultDisplay);
  // 组件内索引设置总开关
  const [attrIndexMaster, setAttrIndexMaster] = useState<boolean>(edgeAttributesData.attrIndexMaster);
  // 组件内索引设置默认开关
  const [attrIndexDefault, setAttrIndexDefault] = useState<boolean>(edgeAttributesData.attrIndexDefault);
  // 组件内默认显示属性list
  const [attrDefaultDisplayList, setAttrDefaultDisplayList] = useState<any[]>(
    _.map(edgeAttributesData.edgeAttributes, item => {
      return { value: item.attrName, label: item.attrName };
    })
  );
  // 如果modal是编辑则为对应的index，否则为-1
  const [dataOutsideIndex, setDataOutsideIndex] = useState<number>(-1);
  // const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState('');
  const [aliasChangeWithName, setAliasChangeWithName] = useState(false); // 修改属性名, 显示名同步修改
  const attributeErrIndex = useRef<number[]>([]); // 错误的属性列表
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式

  useEffect(() => {
    let list: any = [];
    _.map(edgeAttributesData.edgeAttributes, item => {
      list = [...list, { value: item.attrName, label: item.attrName }];
    });
    setAttrDefaultDisplayList(list);
  }, []);

  useEffect(() => {
    dataSummary.current = {
      attrDefaultDisplay,
      attrIndexDefault,
      attrIndexMaster,
      edgeAttributes: _.map(edgeAttributes, d => _.omit(d, 'error'))
    };
    validateAttributesError();
    updateData();
  }, [attrDefaultDisplay, attrIndexDefault, attrIndexMaster, edgeAttributes]);

  useEffect(() => {
    if (attrDefaultDisplayList.length) {
      if (attrDefaultDisplayList.length === 1) {
        setAttrDefaultDisplay(attrDefaultDisplayList[0].value);
        formSelect.setFieldsValue({ attrDefaultSelect: attrDefaultDisplayList[0].value });
      }
      const valueFilter = attrDefaultDisplayList.map(obj => obj.value);
      if (!valueFilter.includes(attrDefaultDisplay) && valueFilter.length !== 1) {
        setAttrDefaultDisplay(attrDefaultDisplayList[0].value);
        formSelect.setFieldsValue({ attrDefaultSelect: attrDefaultDisplayList[0].value });
      }
    } else {
      setAttrDefaultDisplay('');
      formSelect.setFieldsValue({ attrDefaultSelect: '' });
    }
  }, [attrDefaultDisplayList]);

  useEffect(() => {
    // 变更select选项
    let list: any = [];
    _.map(edgeAttributes, item => {
      list = [...list, { value: item.attrName, label: item.attrName }];
    });
    setAttrDefaultDisplayList(list);

    // 变更索引总开关的状态
    if (edgeAttributes.length > 0) {
      const filterIndex = edgeAttributes.filter(item => !item.attrIndex);
      if (filterIndex.length > 0) {
        setAttrIndexMaster(false);
      } else {
        setAttrIndexMaster(true);
      }
    } else {
      setAttrIndexMaster(false);
    }
  }, [edgeAttributes]);

  const validateEdgeAttrSynonymsDescribe = () => {
    attributeErrIndex.current = [];
    return new Promise((resolve, reject) => {
      _.map(edgeAttributes, (attribute, attributeIndex) => {
        let isError = false;
        _.map(_.filter(attribute.attrSynonyms, d => d.trim()) as string[], (attrSynonym, synonymIndex) => {
          if (attrSynonym === '') {
            isError = true;
          }
          if (attrSynonym?.length > 50) {
            isError = true;
          }
          if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(attrSynonym)) {
            isError = true;
          }
          if (_.some(attribute.attrSynonyms, (d, i) => d === attrSynonym && i !== synonymIndex)) {
            isError = true;
          }
        });
        if (attribute?.attrDescribe?.length > 150) {
          isError = true;
        }
        if (
          attribute.attrDescribe !== '' &&
          !/^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/.test(attribute.attrDescribe)
        ) {
          isError = true;
        }
        if (isError) attributeErrIndex.current = [...attributeErrIndex.current, attributeIndex];
      });
      if (attributeErrIndex.current.length) {
        reject({ errorFields: [{ name: 'edge-errors', errors: 'attr-synonyms-describe-error' }] });
      } else {
        resolve([]);
      }
    });
  };

  const indexSettingDefaultSwitchChange = (value: boolean) => {
    setAttrIndexDefault(value);
  };

  const indexSettingMasterSwitchChange = (value: boolean) => {
    const cloneAttrData = [...edgeAttributes];
    if (value) {
      // 总开关如果是false，把所有的索引都打开
      _.map(cloneAttrData, item => {
        if (!item.attrIndex) {
          item.attrIndex = true;
        }
      });
    } else {
      // 总开关如果是true，列表中的索引都关闭
      _.map(cloneAttrData, item => {
        if (item.attrIndex) {
          item.attrIndex = false;
        }
      });
    }
    setEdgeAttributes(cloneAttrData);
    setAttrIndexMaster(value);
    setTimeout(() => {
      (async () => {
        try {
          await propertyTableRef.current.validateFields();
        } catch (error) {}
      })();
    }, 0);
  };

  const editAttrSetting = (record: EdgeAttributesDataType, index: number) => {
    setDataOutsideIndex(index);
    setModalType('edit');
    setShowCreateAttributesModal(true);
  };

  const addEdgeAttributes = async () => {
    try {
      await propertyTableRef.current.validateFields();
      setEdgeAttributes([
        {
          attrName: '',
          attrDisplayName: '',
          attrType: 'string',
          attrIndex: attrIndexDefault,
          attrSynonyms: [],
          attrDescribe: ''
        },
        ...edgeAttributes
      ]);
      setAliasChangeWithName(true);
      setTimeout(() => {
        propertyTableRef.current?.focusFirst?.();
      }, 0);
    } catch (error) {}
  };

  const defaultAttrNameChange = (value: string, option: any) => {
    setAttrDefaultDisplay(value);
  };

  const closeCreateAttributesModal = () => {
    setShowCreateAttributesModal(false);
  };

  const setModalAttributes = (data: EdgeAttributesDataType, index: number) => {
    if (index >= 0) {
      const cloneAttrData = [...edgeAttributes];
      cloneAttrData[index] = data;
      setEdgeAttributes(cloneAttrData);

      const cloneDefaultDisplayList = [...attrDefaultDisplayList];
      cloneDefaultDisplayList[index] = { value: data.attrName, label: data.attrName };
      setAttrDefaultDisplayList(cloneDefaultDisplayList);

      setShowCreateAttributesModal(false);
    } else {
      setAttrDefaultDisplayList([...attrDefaultDisplayList, { value: data.attrName, label: data.attrName }]);
      setEdgeAttributes([...edgeAttributes, data]);
      setShowCreateAttributesModal(false);
    }
    setTimeout(() => {
      (async () => {
        try {
          await propertyTableRef.current.validateFields();
        } catch (error) {}
      })();
    }, 0);
    attributeErrIndex.current = _.filter(attributeErrIndex.current, item => item !== index);
  };

  const attrIndexSettingDropDown = () => {
    return (
      <div
        style={{
          width: '240px',
          // height: '139px',
          background: 'white',
          border: '1px solid var(--kw-border-color-base)',
          borderRadius: '2px'
        }}
      >
        <div style={{ marginTop: '12px', marginLeft: '16px', marginRight: '24px', fontSize: '13px' }}>
          {intl.get('ontoLib.canvasOnto.indexSettingTip')}
        </div>

        <div
          style={{
            position: 'relative',
            marginTop: '14px',
            marginLeft: '16px',
            marginRight: '24px',
            display: 'flex',
            marginBottom: '8px'
          }}
        >
          <div style={{ fontSize: '13px' }}>{intl.get('ontoLib.canvasOnto.indexSettingDefaultSwitch')}</div>
          <Switch
            // disabled={ontoLibType === 'view' ||
            // (selectedElement.model !== '' && selectedElement.model !== undefined)}
            disabled={isDisabledItem()}
            style={{ position: 'absolute', right: '0px' }}
            defaultChecked={attrIndexDefault}
            onChange={indexSettingDefaultSwitchChange}
          />
        </div>
        <div
          style={{
            position: 'relative',
            marginTop: '13px',
            marginLeft: '16px',
            marginRight: '24px',
            display: 'flex',
            marginBottom: '8px'
          }}
        >
          <div style={{ fontSize: '13px' }}>{intl.get('ontoLib.canvasOnto.indexSettingMasterSwitch')}</div>
          <Switch
            // disabled={ontoLibType === 'view' ||
            // (selectedElement.model !== '' && selectedElement.model !== undefined)}
            disabled={isDisabledItem()}
            style={{ position: 'absolute', right: '0px' }}
            defaultChecked={attrIndexMaster}
            checked={attrIndexMaster}
            onChange={indexSettingMasterSwitchChange}
          />
        </div>
      </div>
    );
  };

  const validateAttributesError = () => {
    let isError = false;
    let attrErr = false;
    const cloneEdgeAttributes: any = [...edgeAttributes];
    if (attributeErrIndex.current.length) {
      attrErr = true;
    }
    _.map(cloneEdgeAttributes, edgeAttribute => {
      if (edgeAttribute.error) {
        _.map(Object.values(edgeAttribute.error), err => {
          if (err !== '') {
            isError = true;
          }
        });
      }
    });
    attrHasError.current = isError || attrErr;
  };

  return (
    <div className="edge-class-attributes">
      <div
        className={
          viewMode || ontoLibType === 'view' ? 'attr-none' : 'operate-header kw-align-center kw-space-between kw-mb-4'
        }
      >
        <Button
          onClick={addEdgeAttributes}
          icon={<PlusOutlined />}
          disabled={isDisabledItem()}
          // disabled={ontoLibType === 'view' ||
          // (selectedElement.model !== '' && selectedElement.model !== undefined)}
        >
          {intl.get('ontoLib.canvasEdge.addAttributes')}
        </Button>
        <Dropdown placement="bottomRight" trigger={['click']} overlay={attrIndexSettingDropDown()}>
          <Button type="link" className="kw-c-text" style={{ display: isDisabledItem() ? 'none' : undefined }}>
            {intl.get('ontoLib.canvasOnto.attributesIndexSettings')}
            <SettingOutlined />
          </Button>
        </Dropdown>
      </div>

      <PropertyTable
        ref={propertyTableRef}
        type="edge"
        property={edgeAttributes}
        disabled={!!selectedElement.model}
        readOnly={ontoLibType === 'view' || viewMode}
        aliasChangeWithName={aliasChangeWithName}
        setAliasChangeWithName={setAliasChangeWithName}
        onChange={data => setEdgeAttributes(data)}
        onDelete={data => setEdgeAttributes(data)}
        updateData={updateData}
        onEdit={editAttrSetting}
        errorIndex={attributeErrIndex.current}
      />

      <Divider className="kw-mt-5 kw-mb-3" style={{ color: 'var(--kw-line-color)' }} />

      <Form form={formSelect} layout={'vertical'} requiredMark={!!edgeAttributes.length}>
        <Form.Item
          name={'attrDefaultSelect'}
          initialValue={attrDefaultDisplay}
          label={intl.get('ontoLib.canvasEdge.edgeAttrDefaultDisplayProperties')}
          rules={[
            {
              validator: async (_, value) => {
                // 默认显示属性，在属性列表不为空的时候生效
                if (edgeAttributes.length) {
                  if (value === undefined || value === '') {
                    throw new Error(intl.get('ontoLib.errInfo.emptyInput'));
                  }
                }
              }
            }
          ]}
          required
        >
          <Select
            style={{ width: '100%', maxWidth: 352 }}
            value={attrDefaultDisplay}
            onChange={defaultAttrNameChange}
            options={attrDefaultDisplayList}
            disabled={isDisabledItem()}
            // disabled={ontoLibType === 'view' ||
            //  (selectedElement.model !== '' && selectedElement.model !== undefined)}
            notFoundContent={<Empty image={kongImg} description={intl.get('ontoLib.canvasEdge.emptySynonyms')} />}
          />
        </Form.Item>
      </Form>

      {showCreateAttributesModal && (
        <CreateAttributesModal
          closeCreateAttributesModal={closeCreateAttributesModal}
          showCreateAttributesModal={showCreateAttributesModal}
          setModalAttributes={setModalAttributes}
          dataOutsideIndex={dataOutsideIndex}
          defaultIndexSwitch={attrIndexDefault}
          edgeAttributes={edgeAttributes}
          modalType={modalType}
          readOnly={ontoLibType === 'view'}
          disabled={!!selectedElement.model}
        />
      )}
    </div>
  );
};

export default forwardRef(EdgeClassAttributes);

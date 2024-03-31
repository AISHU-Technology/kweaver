import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import type { FormInstance } from 'antd/es/form/Form';
import { Button, Select, Form, Dropdown, Switch, Empty, Divider, message } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import CreateAttributesModal, { EntityAttributesDataType } from './CreateAttributesModal';
import PropertyTable from '../../components/PropertyTable';
import kongImg from '@/assets/images/kong.svg';
import './style.less';
import { useLocation } from 'react-router-dom';

export interface EntityAttributesFullDataType {
  entityAttributes: EntityAttributesDataType[];
  attrDefaultDisplay: string;
  attrIndexMaster: boolean;
  attrIndexDefault: boolean;
}

export interface EntityAttributesProps {
  entityAttributesData: EntityAttributesFullDataType;
  updateData: Function;
  ontoLibType: string;
  selectedElement: Record<string, any>;
  attrHasError: React.MutableRefObject<boolean | undefined>;
  checkVectorServiceStatus?: () => any;
}

export interface EntityAttributesRef {
  form: Pick<FormInstance<any>, 'validateFields'>;
  formHide: Pick<FormInstance<any>, 'validateFields'>;
  formSelect: FormInstance<any>;
  dataSummary: React.MutableRefObject<EntityAttributesFullDataType | undefined>;
}

const EntityClassAttributes: React.ForwardRefRenderFunction<EntityAttributesRef, EntityAttributesProps> = (
  attributesProps,
  attributesRef
) => {
  useImperativeHandle(attributesRef, () => ({
    dataSummary,
    formSelect,
    form: {
      validateFields: propertyTableRef.current?.validateFields
    },
    formHide: {
      validateFields: validateNodeAttrSynonymsDescribe
    }
  }));

  const [formSelect] = Form.useForm();
  const propertyTableRef = useRef<any>();
  const dataSummary = useRef<EntityAttributesFullDataType | undefined>();
  // 外部传入的Detail数据
  const { entityAttributesData, updateData, ontoLibType, selectedElement, attrHasError, checkVectorServiceStatus } =
    attributesProps;
  const [showCreateAttributesModal, setShowCreateAttributesModal] = useState(false); // 是否显示创建属性modal

  // 组件内属性
  const [entityAttributes, setEntityAttributes] = useState<EntityAttributesDataType[]>(
    entityAttributesData.entityAttributes
  );
  // 组件内默认显示属性
  const [attrDefaultDisplay, setAttrDefaultDisplay] = useState<string>(entityAttributesData.attrDefaultDisplay);
  // 组件内索引设置总开关
  const [attrIndexMaster, setAttrIndexMaster] = useState<boolean>(entityAttributesData.attrIndexMaster);
  // 组件内索引设置默认开关
  const [attrIndexDefault, setAttrIndexDefault] = useState<boolean>(entityAttributesData.attrIndexDefault);
  // 组件内默认显示属性list
  const [attrDefaultDisplayList, setAttrDefaultDisplayList] = useState<any[]>(
    _.map(entityAttributesData.entityAttributes, item => {
      return { value: item.attrName, label: item.attrName };
    })
  );
  // 如果modal是编辑则为对应的index，否则为-1
  const [dataOutsideIndex, setDataOutsideIndex] = useState<number>(-1);
  const [modalType, setModalType] = useState('');
  const [aliasChangeWithName, setAliasChangeWithName] = useState(false); // 修改属性名, 显示名同步修改
  const attributeErrIndex = useRef<number[]>([]); // 错误的属性列表
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式

  useEffect(() => {
    let list: any = [];
    _.map(entityAttributesData.entityAttributes, item => {
      list = [...list, { value: item.attrName, label: item.attrName }];
    });
    setAttrDefaultDisplayList(list);
    // 如果是新建的点
    if (selectedElement.isCreate) {
      addEntityAttributes();
    }
  }, []);

  useEffect(() => {
    dataSummary.current = {
      attrDefaultDisplay,
      attrIndexDefault,
      attrIndexMaster,
      entityAttributes: _.map(entityAttributes, d => _.omit(d, 'error'))
    };
    validateAttributesError();
    updateData();
  }, [attrDefaultDisplay, attrIndexDefault, attrIndexMaster, entityAttributes]);

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
    _.map(entityAttributes, item => {
      list = [...list, { value: item.attrName, label: item.attrName }];
    });
    setAttrDefaultDisplayList(list);

    // 变更索引总开关的状态
    if (entityAttributes.length > 0) {
      const filterIndex = entityAttributes.filter(item => !item.attrIndex);
      if (filterIndex.length > 0) {
        setAttrIndexMaster(false);
      } else {
        setAttrIndexMaster(true);
      }
    } else {
      setAttrIndexMaster(false);
    }
  }, [entityAttributes]);

  const validateNodeAttrSynonymsDescribe = () => {
    attributeErrIndex.current = [];
    return new Promise((resolve, reject) => {
      _.map(entityAttributes, (attribute, attributeIndex) => {
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
        reject({ errorFields: [{ name: 'node-errors', errors: 'attr-synonyms-describe-error' }] });
      } else {
        resolve([]);
      }
    });
  };

  const editAttrSetting = (record: EntityAttributesDataType, index: number) => {
    setDataOutsideIndex(index);
    setModalType('edit');
    setShowCreateAttributesModal(true);
  };

  const addEntityAttributes = async () => {
    try {
      await propertyTableRef.current.validateFields();
      setEntityAttributes([
        {
          attrName: '',
          attrDisplayName: '',
          attrType: 'string',
          attrIndex: selectedElement.isCreate || !entityAttributes.length ? true : attrIndexDefault,
          attrMerge: selectedElement.isCreate || !entityAttributes.length,
          attrVector: false,
          attrSynonyms: [],
          attrDescribe: ''
        },
        ...entityAttributes
      ]);
      setAliasChangeWithName(true);
      setTimeout(() => {
        propertyTableRef.current?.focusFirst?.();
      }, 0);
    } catch (error) {}

    // setDataOutsideIndex(-1);
    // setModalType('create');
    // setShowCreateAttributesModal(true);
  };

  const defaultAttrNameChange = (value: string, option: any) => {
    setAttrDefaultDisplay(value);
  };

  const closeCreateAttributesModal = () => {
    setShowCreateAttributesModal(false);
  };

  const setModalAttributes = (data: EntityAttributesDataType, index: number) => {
    if (index >= 0) {
      // 编辑属性数据处理
      const cloneAttrData = [...entityAttributes];
      cloneAttrData[index] = data;
      setEntityAttributes(cloneAttrData);
      const cloneDefaultDisplayList = [...attrDefaultDisplayList];
      cloneDefaultDisplayList[index] = { value: data.attrName, label: data.attrName };
      setAttrDefaultDisplayList(cloneDefaultDisplayList);
    } else {
      // 新增属性数据处理
      setAttrDefaultDisplayList([...attrDefaultDisplayList, { value: data.attrName, label: data.attrName }]);
      setEntityAttributes([...entityAttributes, data]);
    }
    setShowCreateAttributesModal(false);
    setTimeout(() => {
      (async () => {
        try {
          await propertyTableRef.current.validateFields();
        } catch (error) {}
      })();
    }, 0);
    attributeErrIndex.current = _.filter(attributeErrIndex.current, item => item !== index);
  };

  const indexSettingDefaultSwitchChange = (value: boolean) => {
    setAttrIndexDefault(value);
  };

  const indexSettingMasterSwitchChange = (value: boolean) => {
    const cloneAttrData = [...entityAttributes];
    if (value) {
      // 总开关如果是false，把所有的索引都打开
      _.map(cloneAttrData, item => {
        if (!item.attrIndex) {
          item.attrIndex = true;
        }
      });
    } else {
      // 总开关如果是true，列表中的索引都关闭, 向量也要都关闭
      _.map(cloneAttrData, item => {
        if (item.attrIndex) {
          item.attrIndex = false;
          item.attrVector = false;
        }
      });
    }
    setEntityAttributes(cloneAttrData);
    setAttrIndexMaster(value);
    setTimeout(() => {
      (async () => {
        try {
          await propertyTableRef.current.validateFields();
        } catch (error) {}
      })();
    }, 0);
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
            disabled={ontoLibType === 'view' || (selectedElement.model !== '' && selectedElement.model !== undefined)}
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
            disabled={ontoLibType === 'view' || (selectedElement.model !== '' && selectedElement.model !== undefined)}
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
    let attrIndexErr = true;
    let attrMergeErr = true;
    const cloneEntityAttributes: any = [...entityAttributes];
    if (attributeErrIndex.current.length) {
      attrErr = true;
    }
    _.map(cloneEntityAttributes, entityAttribute => {
      if (entityAttribute.error) {
        _.map(Object.values(entityAttribute.error), err => {
          if (err !== '') {
            isError = true;
          }
        });
      }
      if (entityAttribute.attrIndex) {
        attrIndexErr = false;
      }
      if (entityAttribute.attrMerge) {
        attrMergeErr = false;
      }
    });
    attrHasError.current = isError || attrIndexErr || attrMergeErr || attrErr;
  };

  return (
    <div className="entity-class-attributes">
      <div
        className={
          viewMode || ontoLibType === 'view' ? 'attr-none' : 'operate-header kw-align-center kw-space-between kw-mb-4'
        }
      >
        <Button
          onClick={addEntityAttributes}
          icon={<PlusOutlined />}
          disabled={ontoLibType === 'view' || (selectedElement.model !== '' && selectedElement.model !== undefined)}
        >
          {intl.get('ontoLib.canvasEdge.addAttributes')}
        </Button>
        <div>
          <Dropdown placement="bottomRight" trigger={['click']} overlay={attrIndexSettingDropDown()}>
            <Button type="link" className="kw-c-text" style={{ display: selectedElement.model ? 'none' : undefined }}>
              {intl.get('ontoLib.canvasOnto.attributesIndexSettings')}
              <SettingOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      <PropertyTable
        ref={propertyTableRef}
        type="node"
        property={entityAttributes}
        disabled={!!selectedElement.model}
        readOnly={ontoLibType === 'view' || viewMode}
        aliasChangeWithName={aliasChangeWithName}
        setAliasChangeWithName={setAliasChangeWithName}
        onChange={data => setEntityAttributes(data)}
        onDelete={data => setEntityAttributes(data)}
        updateData={updateData}
        onEdit={editAttrSetting}
        errorIndex={attributeErrIndex.current}
        checkVectorServiceStatus={checkVectorServiceStatus}
      />

      <Divider className="kw-mt-5 kw-mb-3" style={{ color: 'var(--kw-line-color)' }} />

      <Form form={formSelect} layout={'vertical'} requiredMark={true}>
        <Form.Item
          name={'attrDefaultSelect'}
          initialValue={attrDefaultDisplay}
          label={intl.get('ontoLib.canvasOnto.entityAttrDefaultDisplayProperties')}
          rules={[{ required: true, message: intl.get('ontoLib.errInfo.needDefaultProperty') }]}
          required
        >
          <Select
            className="kw-w-100"
            style={{ maxWidth: 352 }}
            onChange={defaultAttrNameChange}
            options={attrDefaultDisplayList}
            disabled={ontoLibType === 'view' || viewMode}
            value={attrDefaultDisplay}
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
          entityAttributes={entityAttributes}
          modalType={modalType}
          readOnly={ontoLibType === 'view'}
          disabled={!!selectedElement.model}
        />
      )}
    </div>
  );
};

export default forwardRef(EntityClassAttributes);

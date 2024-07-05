/* eslint-disable max-lines */
import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Input, Tabs, Popconfirm, message, Alert, InputRef } from 'antd';

import IconFont from '@/components/IconFont';

import EntityClassDetail, { EntityDetailDataType, EntityDetailRef } from './EntityClassDetail';
import EntityClassAttributes, { EntityAttributesFullDataType, EntityAttributesRef } from './EntityClassAttributes';
import { EntityAttributesDataType } from './EntityClassAttributes/CreateAttributesModal';
import EntityClassStyle, { EntityStyleDataType, EntityStyleRef } from './EntityClassStyle';

import './style.less';
import { GraphGroupItem } from '../types/items';
import type { FormInstance } from 'antd/es/form/Form';
import { useLocation } from 'react-router-dom';

export interface EntityDataType {
  entityName: string;
  entityDetail: EntityDetailDataType;
  entityAttributes: EntityAttributesFullDataType;
  entityStyle: EntityStyleDataType;
}

export interface NodeInfoProps {
  detailDeleteData: Function;
  setSelectedElement: Function;
  selectedElement: Record<string, any>;
  detailUpdateData: Function;
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  groupList: GraphGroupItem[];
  used_task: any[];
  setUsedTask: Function;
  onAddEdgesBatch: Function;
  onCreateGroup: () => void;
  ontoLibType: string;
  showQuitTip: any;
  handleGroupNodes: Function;
  checkVectorServiceStatus?: () => any;
  firstBuild: boolean;
}

export interface NodeInfoRef {
  checkData: Record<string, any>;
  formNameRef: FormInstance<any>;
  DetailRef: React.RefObject<EntityDetailRef>;
  AttributesRef: React.RefObject<EntityAttributesRef>;
  StyleRef: React.RefObject<EntityStyleRef>;
  verifyParameter: Function;
  updateData: Function;
}

const OntoNodeInfo: React.ForwardRefRenderFunction<NodeInfoRef, NodeInfoProps> = (nodeInfoProps, nodeInfoRef) => {
  useImperativeHandle(nodeInfoRef, () => ({
    checkData,
    formNameRef,
    DetailRef,
    AttributesRef,
    StyleRef,
    verifyParameter,
    updateData
  }));
  const [formNameRef] = Form.useForm();
  const {
    detailDeleteData,
    setSelectedElement,
    selectedElement,
    detailUpdateData,
    nodes,
    edges,
    groupList,
    used_task,
    setUsedTask,
    onAddEdgesBatch,
    onCreateGroup,
    ontoLibType,
    showQuitTip,
    handleGroupNodes,
    checkVectorServiceStatus,
    firstBuild
  } = nodeInfoProps;
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式

  useEffect(() => {
    if (!selectedElement.isCreate) {
      verifyParameter();
      setAliasHasChanged(true);
    } else {
      setTimeout(() => {
        inputFirst.current?.focus();
      }, 0);
    }
    setEntityName(selectedElement.name);
    setEntityDetail({
      entityDisplayName: selectedElement.alias || '',
      entitySynonyms: selectedElement.synonyms || [],
      entityDescribe: selectedElement.describe || ''
    });
    setEntityAttributes({
      entityAttributes: selectedElement.attributes || [],
      attrDefaultDisplay: selectedElement.default_tag || '',
      attrIndexDefault: selectedElement.switchDefault || false,
      attrIndexMaster: selectedElement.switchMaster || false
    });
    setEntityStyle({
      type: selectedElement.type || '',
      fillColor: selectedElement.color,
      strokeColor: selectedElement.strokeColor,
      size: selectedElement.size || '',
      labelFill: selectedElement.labelFill,
      position: selectedElement.position || '',
      labelType: selectedElement.labelType || '',
      labelLength: selectedElement.labelLength || '',
      labelFixLength: selectedElement.labelFixLength || '',
      icon: selectedElement.icon || '',
      iconColor: selectedElement.iconColor || '#ffffff'
    });
  }, []);

  const DetailRef = useRef<EntityDetailRef>(null);
  const AttributesRef = useRef<EntityAttributesRef>(null);
  const StyleRef = useRef<EntityStyleRef>(null);
  const initNum = useRef(0);

  const inputFirst = useRef<InputRef>(null);

  const [selTabKey, setSelTabKey] = useState('EntityClassDetail'); // 选择的tab键

  // 实体类名字
  const [entityName, setEntityName] = useState(selectedElement.name);
  // 实体类详情
  const [entityDetail, setEntityDetail] = useState<EntityDetailDataType>({
    entityDisplayName: selectedElement.alias || '',
    entitySynonyms: selectedElement.synonyms || [],
    entityDescribe: selectedElement.describe || ''
  });
  // 实体类属性
  const [entityAttributes, setEntityAttributes] = useState<EntityAttributesFullDataType>({
    entityAttributes: selectedElement.attributes || [],
    attrDefaultDisplay: selectedElement.default_tag || '',
    attrIndexDefault: selectedElement.switchDefault || false,
    attrIndexMaster: selectedElement.switchMaster || false
  });
  // 实体类样式
  const [entityStyle, setEntityStyle] = useState<EntityStyleDataType>({
    type: selectedElement.type || '',
    fillColor: selectedElement.color,
    strokeColor: selectedElement.strokeColor,
    size: selectedElement.size || '',
    labelFill: selectedElement.labelFill,
    position: selectedElement.position || '',
    labelType: selectedElement.labelType || '',
    labelLength: selectedElement.labelLength || '',
    labelFixLength: selectedElement.labelFixLength || '',
    icon: selectedElement.icon || '',
    iconColor: selectedElement.iconColor || '#ffffff'
  });

  const [checkData, setCheckData] = useState<Record<string, any>>({
    isErr: false, // 输入内容是否有误
    errIndex: -1, // 错误的数组索引
    content: null, // 错误提示内容, { name: '错误信息', 'alias': '错误信息' }
    notIndex: false // 是否 未开启索引
  });

  const hasError = useRef<any[]>(); // node是不是有错误
  const detailHasError = useRef<boolean>(); // detail是不是有错误
  const attrHasError = useRef<boolean>(); // attr是不是有错误

  const [aliasHasChanged, setAliasHasChanged] = useState(false); // 是否修改过显示名

  const [group, setGroup] = useState(selectedElement._group || []); // 分组

  /**
   * Tabs切换(EntityClassDetail,EntityClassAttributes,EntityClassStyle)
   * @param selTabKey 选中的tabs key
   */
  const changeTab = (selTabKey: string) => {
    setSelTabKey(selTabKey);
  };

  /**
   * 确定删除本体类
   */
  const confirmDelete = () => {
    detailDeleteData({ type: 'node', items: [selectedElement.uid] }, selectedElement);
    setSelectedElement('');
    // message.success([intl.get('createEntity.deleteSuc')]);
    // message.success({
    //   content: intl.get('createEntity.deleteSuc'),
    //   className: 'custom-class',
    //   style: {
    //     marginTop: '6vh'
    //   }
    // });
  };

  useEffect(() => {
    updateData();
  }, [group]);

  /**
   * 输入框值变更
   * @param e e.target.value输入框的值
   */
  const entityClassNameChanged = (e: any) => {
    if (DetailRef.current?.form.getFieldValue('entityDisplayName') === '' && aliasHasChanged) {
      DetailRef.current?.setPlaceHold(e.target.value);
      DetailRef.current?.setEntityDisplayName(e.target.value);
      DetailRef.current?.form.validateFields(['entityDisplayName']);
      DetailRef.current?.validateDetailError();
      setEntityName(e.target.value);
      updateData();
    } else {
      if (!aliasHasChanged) {
        DetailRef.current?.form.setFieldsValue({ entityDisplayName: e.target.value });
        DetailRef.current?.setEntityDisplayName(e.target.value);
        DetailRef.current?.form.validateFields(['entityDisplayName']);
        DetailRef.current?.validateDetailError();
      }
      setEntityName(e.target.value);
      updateData();
    }
  };

  const filterAndExtraction = (
    filterOrder: string,
    filterValue: any,
    extraction: string,
    sourceArray: Record<string, any>[] | undefined
  ) => {
    const filterArr = (sourceArray || []).filter(item => item[filterOrder] === filterValue);
    return filterArr.map(item => {
      return item[extraction];
    });
  };

  const objectExtraction = (sourceArray: EntityAttributesDataType[] | undefined) => {
    return (sourceArray || []).map(({ attrName, attrType, attrDisplayName }) => {
      return [attrName, attrType, attrDisplayName];
    });
  };

  // 验证提交参数
  const verifyParameter = async () => {
    initNum.current = 0;
    let errorArr: any[] = [];
    const verifyArr = [
      formNameRef.validateFields,
      DetailRef.current?.form?.validateFields,
      DetailRef.current?.formTable?.validateFields,
      AttributesRef.current?.form?.validateFields,
      AttributesRef.current?.formSelect?.validateFields,
      AttributesRef.current?.formHide.validateFields
    ];
    await Promise.all(
      verifyArr.map(async item => {
        try {
          await item?.();
        } catch (error) {
          _.map(error.errorFields, errorField => {
            errorArr = [
              ...errorArr,
              {
                name: errorField.name[0],
                error: errorField.errors[0]
              }
            ];
          });
        }
      })
    );
    _.map(errorArr, error => {
      if (error.name === 'entityDescribe' || error.name === 'entityDisplayName' || RegExp(/synonym/).test(error.name)) {
        detailHasError.current = true;
      } else {
        if (error.name !== 'entityClassName') {
          attrHasError.current = true;
        }
      }
    });
    hasError.current = errorArr;
    updateData();
    return errorArr;
  };

  const validateHasError = async () => {
    let finalError = false;
    // name是否有error
    if (!selectedElement.isCreate) {
      try {
        await formNameRef.validateFields();
      } catch (error) {
        _.map(error.errorFields, errorField => {
          finalError = true;
        });
      }
    }
    // detail是否有error
    if (detailHasError.current) finalError = true;
    // attributes是否有error
    if (attrHasError.current) finalError = true;
    // 返回最终的error
    return finalError;
  };

  const updateData = async () => {
    initNum.current += 1;
    if (initNum.current > 3 && ontoLibType !== '') {
      showQuitTip.current = true;
    }
    if (initNum.current > 6) {
      delete selectedElement.isCreate;
    }
    const name = formNameRef.getFieldValue('entityClassName');
    const detailFinalData = DetailRef.current?.dataSummary.current;
    const styleFinalData = StyleRef.current?.dataSummary.current;
    const attributesFinalData = AttributesRef.current?.dataSummary.current;
    if (
      detailFinalData?.entityDisplayName === undefined &&
      DetailRef.current?.form.getFieldValue('entityDisplayName') === undefined
    ) {
      return;
    }
    const data = {
      name,
      alias: aliasHasChanged
        ? detailFinalData?.entityDisplayName
        : DetailRef.current?.form.getFieldValue('entityDisplayName'),
      color: styleFinalData?.fillColor || selectedElement.color,
      icon: styleFinalData?.icon || 'empty', // 设置默认的图标为空
      iconColor: styleFinalData?.iconColor,
      properties: objectExtraction(attributesFinalData?.entityAttributes),
      properties_index: filterAndExtraction(
        'attrIndex',
        true,
        'attrName',
        AttributesRef.current?.dataSummary.current?.entityAttributes
      ),
      default_tag: attributesFinalData?.attrDefaultDisplay,
      attributes: attributesFinalData?.entityAttributes,
      switchDefault: attributesFinalData?.attrIndexDefault,
      switchMaster: attributesFinalData?.attrIndexMaster,
      uid: selectedElement?.uid,
      type: styleFinalData?.type,
      fillColor: styleFinalData?.fillColor,
      strokeColor: styleFinalData?.strokeColor,
      size: styleFinalData?.size,
      labels: aliasHasChanged
        ? detailFinalData?.entityDisplayName
        : DetailRef.current?.form.getFieldValue('entityDisplayName'),
      labelFill: styleFinalData?.labelFill,
      position: styleFinalData?.position,
      labelType: styleFinalData?.labelType,
      labelLength: styleFinalData?.labelLength,
      labelFixLength: styleFinalData?.labelFixLength,
      synonyms: detailFinalData?.entitySynonyms,
      describe: detailFinalData?.entityDescribe,
      showLabels: [
        {
          key: name,
          alias: aliasHasChanged
            ? detailFinalData?.entityDisplayName
            : DetailRef.current?.form.getFieldValue('entityDisplayName'),
          value: aliasHasChanged
            ? detailFinalData?.entityDisplayName
            : DetailRef.current?.form.getFieldValue('entityDisplayName'),
          type: 'node',
          isChecked: true,
          isDisabled: false
        }
      ],
      hasError: selectedElement.isCreate
        ? []
        : (await validateHasError())
        ? [
            {
              name: 'error',
              error: 'errorField.errors[0]'
            }
          ]
        : [],
      _group: group
    };
    detailUpdateData({ type: 'node', items: [data] });
  };

  return (
    <div className="flow3-node-info kw-h-100" style={{ width: selTabKey === 'EntityClassAttributes' ? 640 : 400 }}>
      {window.location?.pathname?.indexOf('/knowledge/workflow') !== -1 && !firstBuild && (
        <Alert
          message={intl.get('ontoLib.nodeEdgeTips')}
          type="warning"
          showIcon
          style={{ backgroundColor: '#FFFBE6', borderColor: '#FFF1B8' }}
        />
      )}
      <div className="title">
        <div className="word">
          <span>{intl.get('createEntity.ect')}</span>
        </div>
        {!viewMode && (
          <Popconfirm
            className={ontoLibType === 'view' ? 'delete-btn-none' : undefined}
            title={intl.get('ontoLib.canvasOnto.sureToDeleteAttr')}
            onConfirm={confirmDelete}
            okText={intl.get('ontoLib.canvasOnto.confirmDeleteAttr')}
            cancelText={intl.get('ontoLib.canvasOnto.cancelDeleteAttr')}
            placement="bottomRight"
            disabled={ontoLibType === 'view'}
          >
            <div className="click-mask kw-pointer">
              <IconFont type="icon-lajitong" className="kw-mr-2" />
              {intl.get('global.delete')}
            </div>
          </Popconfirm>
        )}
      </div>
      <div className="info-content-flow">
        <Form form={formNameRef} className="node-info-form" layout={'vertical'} requiredMark={true}>
          <Form.Item
            name="entityClassName"
            label={intl.get('ontoLib.canvasOnto.entityClassName')}
            validateFirst={true}
            initialValue={entityName}
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
              { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
              { pattern: /^[0-9a-zA-Z_]{1,}$/, message: intl.get('ontoLib.errInfo.eLettersNumber_') },
              {
                // 实体类名不能和其他实体类名一样，不能和其他关系类名一样
                validator: async (rule, value) => {
                  const filterNodes = nodes.filter(item => item.uid !== selectedElement.uid);
                  const filterNodeNames = filterNodes.filter(item => item.name === value);

                  // if (filterNodeNames.length > 0) throw new Error('实体类名不能和其余的实体类名一致');
                  if (filterNodeNames.length > 0) {
                    const msg = filterNodeNames?.[0]?.model
                      ? intl.get('ontoLib.errInfo.repeatErr')
                      : intl.get('global.repeatName');
                    throw new Error(msg);
                  }
                  const filterEdgeNames = edges.filter(item => item.name === value);
                  // if (filterEdgeNames.length > 0) throw new Error('实体类名不能和其余的关系类名一致');
                  if (filterEdgeNames.length > 0) {
                    const msg = filterNodeNames?.[0]?.model
                      ? intl.get('ontoLib.errInfo.repeatErr')
                      : intl.get('global.repeatName');
                    throw new Error(msg);
                  }
                }
              }
            ]}
            required
          >
            <Input
              ref={inputFirst}
              style={{ maxWidth: 352 }}
              disabled={
                viewMode ||
                ontoLibType === 'view' ||
                (selectedElement.model !== '' && selectedElement.model !== undefined)
              }
              autoComplete="off"
              placeholder={intl.get('ontoLib.canvasOnto.entityClassPlaceHold')}
              onChange={e => entityClassNameChanged(e)}
            />
          </Form.Item>
        </Form>

        <Tabs className="node-info-tab" activeKey={selTabKey} onChange={e => changeTab(e)}>
          <Tabs.TabPane
            tab={
              <span>
                {intl.get('ontoLib.canvasOnto.entityDetail')}
                {detailHasError.current === true && !selectedElement.isCreate && (
                  <IconFont type="graph-warning1" style={{ color: '#f5222d', fontSize: 16 }} />
                )}
              </span>
            }
            key="EntityClassDetail"
          >
            <EntityClassDetail
              ref={DetailRef}
              entityDetailData={entityDetail}
              updateData={updateData}
              setAliasHasChanged={setAliasHasChanged}
              selectedElement={selectedElement}
              nodes={nodes}
              edges={edges}
              ontoLibType={ontoLibType}
              detailHasError={detailHasError}
              groupList={groupList}
              onCreateGroup={onCreateGroup}
              group={group}
              setGroup={setGroup}
              handleGroupNodes={handleGroupNodes}
            />
          </Tabs.TabPane>
          <Tabs.TabPane
            forceRender={true}
            tab={
              <span>
                {intl.get('ontoLib.canvasOnto.entityAttributes')}
                {attrHasError.current === true && !selectedElement.isCreate && (
                  <IconFont type="graph-warning1" style={{ color: '#f5222d', fontSize: 16 }} />
                )}
              </span>
            }
            key="EntityClassAttributes"
          >
            <EntityClassAttributes
              ref={AttributesRef}
              entityAttributesData={entityAttributes}
              updateData={updateData}
              ontoLibType={ontoLibType}
              selectedElement={selectedElement}
              attrHasError={attrHasError}
              checkVectorServiceStatus={checkVectorServiceStatus}
            />
          </Tabs.TabPane>
          <Tabs.TabPane forceRender={true} tab={intl.get('ontoLib.canvasOnto.entityStyle')} key="EntityClassStyle">
            <EntityClassStyle
              ref={StyleRef}
              entityStyleData={entityStyle}
              updateData={updateData}
              selectedElement={selectedElement}
              ontoLibType={ontoLibType}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default forwardRef(OntoNodeInfo);

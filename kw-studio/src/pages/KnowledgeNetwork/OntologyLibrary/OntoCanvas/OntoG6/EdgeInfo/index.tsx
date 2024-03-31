/* eslint-disable max-lines */
import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Form, Input, Tabs, Popconfirm, message, Alert } from 'antd';

import IconFont from '@/components/IconFont';

import EdgeClassDetail, { EdgeDetailDataType, EdgeDetailRef } from './EdgeClassDetail';
import EdgeClassAttributes, { EdgeAttributesFullDataType, EdgeAttributesRef } from './EdgeClassAttributes';
import EdgeClassStyle, { EdgeStyleDataType, EdgeStyleRef } from './EdgeClassStyle';

import './style.less';
import { GraphGroupItem } from '../types/items';
import type { FormInstance } from 'antd/es/form/Form';
import { EdgeAttributesDataType } from './EdgeClassAttributes/CreateAttributesModal';
import Format from '@/components/Format';
import { useLocation } from 'react-router-dom';

export interface EdgeDataType {
  edgeName: string;
  edgeDetail: EdgeDetailDataType;
  edgeAttributes: EdgeAttributesFullDataType;
  edgeStyle: EdgeStyleDataType;
}

export interface EdgeInfoProps {
  setSelectedElement: Function;
  selectedElement: any;
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  groupList: GraphGroupItem[];
  onCreateGroup: () => void;
  setItemsAdd: (data: any) => void;
  setItemsUpdate: (data: any) => void;
  setItemsDeleteIds: (data: any) => void;
  ontoLibType: string;
  detailUpdateData: (data: any) => void;
  showQuitTip: any;
  firstBuild: boolean;
}

export interface EdgeInfoRef {
  checkData: Record<string, any>;
  defaultTagIndex: number;
  formNameRef: FormInstance<any>;
  DetailRef: React.RefObject<EdgeDetailRef>;
  AttributesRef: React.RefObject<EdgeAttributesRef>;
  StyleRef: React.RefObject<EdgeStyleRef>;
  verifyParameter: Function;
  updateData: Function;
}

const OntoEdgeInfo: React.ForwardRefRenderFunction<EdgeInfoRef, EdgeInfoProps> = (edgeInfoProps, edgeInfoRef) => {
  useImperativeHandle(edgeInfoRef, () => ({
    checkData,
    defaultTagIndex,
    formNameRef,
    DetailRef,
    AttributesRef,
    StyleRef,
    verifyParameter,
    updateData
  }));
  const [formNameRef] = Form.useForm();

  const {
    setItemsDeleteIds,
    setSelectedElement,
    selectedElement,
    nodes,
    edges,
    groupList,
    onCreateGroup,
    setItemsAdd,
    setItemsUpdate,
    ontoLibType,
    detailUpdateData,
    showQuitTip,
    firstBuild
  } = edgeInfoProps;

  const DetailRef = useRef<EdgeDetailRef>(null);
  const AttributesRef = useRef<EdgeAttributesRef>(null);
  const StyleRef = useRef<EdgeStyleRef>(null);
  const initNum = useRef(0);

  useEffect(() => {
    if (!selectedElement.isCreate) {
      verifyParameter();
      setAliasHasChanged(true);
    }
    setEdgeName(selectedElement.name);
    setEdgeAttributes({
      edgeAttributes: selectedElement.attributes || [],
      attrDefaultDisplay: selectedElement.default_tag || '',
      attrIndexDefault: selectedElement.switchDefault || false,
      attrIndexMaster: selectedElement.switchMaster || false
    });

    setEdgeStyle({
      type: selectedElement.type || '',
      strokeColor: selectedElement.color || '',
      size: selectedElement.size || ''
    });
  }, []);

  const [selTabKey, setSelTabKey] = useState('EdgeClassDetail'); // 选择的tab键
  const [edgeName, setEdgeName] = useState(selectedElement.name); // 实体类名字
  // 实体类属性
  const [edgeAttributes, setEdgeAttributes] = useState<EdgeAttributesFullDataType>({
    edgeAttributes: selectedElement.attributes || [],
    attrDefaultDisplay: selectedElement.default_tag || '',
    attrIndexDefault: selectedElement.switchDefault || false,
    attrIndexMaster: selectedElement.switchMaster || false
  });
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyleDataType>({
    type: selectedElement.type || '',
    strokeColor: selectedElement.color || '',
    size: selectedElement.size || 0.75
  }); // 实体类样式
  const [checkData, setCheckData] = useState<Record<string, any>>({
    isErr: false, // 输入内容是否有误
    errIndex: -1, // 错误的数组索引
    content: null, // 错误提示内容, { name: '错误信息', 'alias': '错误信息' }
    notIndex: false // 是否 未开启索引
  });
  const [defaultTagIndex, setDefaultTagIndex] = useState<number>(
    selectedElement.default_tag === ''
      ? 0
      : Number(selectedElement.default_tag) < 0
      ? 0
      : Number(selectedElement.default_tag)
  );
  const [group, setGroup] = useState(selectedElement._group || []);

  const hasError = useRef<any[]>(); // edge是不是有错误
  const detailHasError = useRef<boolean>(); // detail是不是有错误
  const attrHasError = useRef<boolean>(); // attr是不是有错误

  const [aliasHasChanged, setAliasHasChanged] = useState(false); // 是否修改过显示名
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式

  /**
   * Tabs切换(EdgeClassDetail,EdgeClassAttributes,EdgeClassStyle)
   * @param selTabKey 选中的tabs key
   */
  const changeTab = (selTabKey: string) => {
    setSelTabKey(selTabKey);
  };

  /**
   * 确定删除本体类
   */
  const confirmDelete = () => {
    setItemsDeleteIds({ type: 'edge', items: [selectedElement.uid] });
    setSelectedElement('');
    // message.success(intl.get('createEntity.deleteSuc'));
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
  const edgeClassNameChanged = (e: any) => {
    const selectedEdge = _.filter(edges, item => {
      return item.name === e.target.value;
    })?.[0];
    if (selectedEdge && (selectedEdge.model === '' || selectedEdge.model === undefined)) {
      AttributesRef.current?.setEdgeAttributes(selectedEdge.attributes || []);
      AttributesRef.current?.setAttrDefaultDisplay(selectedEdge.default_tag || '');
      AttributesRef.current?.setAttrIndexDefault(selectedEdge.switchDefault || false);
      AttributesRef.current?.setAttrIndexMaster(selectedEdge.switchMaster || false);
      DetailRef.current?.setEdgeDisplayName(selectedEdge.alias);
      DetailRef.current?.form.setFieldsValue({ edgeDisplayName: selectedEdge.alias });
    } else {
      if (!aliasHasChanged) {
        DetailRef.current?.form.setFieldsValue({ edgeDisplayName: e.target.value });
        DetailRef.current?.form.validateFields(['edgeDisplayName']);
      }
      setEdgeName(e.target.value);
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

  const objectExtraction = (sourceArray: EdgeAttributesDataType[] | undefined) => {
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
      if (error.name === 'edgeDescribe' || error.name === 'edgeDisplayName' || RegExp(/synonym/).test(error.name)) {
        detailHasError.current = true;
      } else {
        if (error.name !== 'edgeClassName') {
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
    try {
      await formNameRef.validateFields();
    } catch (error) {
      _.map(error.errorFields, errorField => {
        finalError = true;
      });
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
    if (initNum.current > 4 && ontoLibType !== '') {
      showQuitTip.current = true;
    }
    const name = formNameRef.getFieldValue('edgeClassName');
    const detailFinalData = DetailRef.current?.dataSummary.current;
    const styleFinalData = StyleRef.current?.dataSummary.current;
    const attributesFinalData = AttributesRef.current?.dataSummary.current;
    if (
      detailFinalData?.edgeDisplayName === undefined &&
      DetailRef.current?.form.getFieldValue('edgeDisplayName') === undefined
    ) {
      return;
    }
    const data: any = {
      name,
      alias: aliasHasChanged
        ? detailFinalData?.edgeDisplayName
        : DetailRef.current?.form.getFieldValue('edgeDisplayName'),
      color: styleFinalData?.strokeColor || selectedElement.color,
      properties: objectExtraction(attributesFinalData?.edgeAttributes),
      properties_index: filterAndExtraction(
        'attrIndex',
        true,
        'attrName',
        AttributesRef.current?.dataSummary.current?.edgeAttributes
      ),
      default_tag:
        (attributesFinalData?.edgeAttributes ? attributesFinalData?.edgeAttributes : []).filter(
          obj => obj.attrName === attributesFinalData?.attrDefaultDisplay
        ).length > 0
          ? attributesFinalData?.attrDefaultDisplay
          : '',
      attributes: attributesFinalData?.edgeAttributes,
      switchDefault: attributesFinalData?.attrIndexDefault,
      switchMaster: attributesFinalData?.attrIndexMaster,
      uid: selectedElement?.uid,
      type: styleFinalData?.type,
      size: styleFinalData?.size || 0.75,
      synonyms: detailFinalData?.edgeSynonyms,
      describe: detailFinalData?.edgeDescribe,
      strokeColor: styleFinalData?.strokeColor || selectedElement.color,
      lineWidth: styleFinalData?.size || 0.75,
      hasError: (await validateHasError())
        ? [
            {
              name: 'error',
              error: 'errorField.errors[0]'
            }
          ]
        : [],
      _group: group
    };
    // 同步更新端点分组
    let sourceNode;
    let targetNode;
    _.forEach(nodes, node => {
      if (node.uid === selectedElement.source) {
        sourceNode = { ...node };
        sourceNode._group = _.uniq([...group, ...(node._group || [])]);
      }
      if (node.uid === selectedElement.target) {
        targetNode = { ...node };
        targetNode._group = _.uniq([...group, ...(node._group || [])]);
      }
    });
    const updatedData = [data, sourceNode, targetNode].filter(Boolean);
    /**
     * [bug 355406] 同名边类，属性和显示名改变要保持统一
     */
    _.forEach(edges, item => {
      if (
        item.name === name &&
        item.uid !== selectedElement?.uid &&
        (item.model === '' || item.model === undefined) &&
        (selectedElement.model === '' || selectedElement.model === undefined)
      ) {
        updatedData.push({ ..._.omit(data, '_group'), uid: item.uid });
      }
    });
    detailUpdateData({ type: 'all', items: updatedData });
  };

  /**
   * 新建边
   */
  const onCreateEdge = (edge: any) => {
    const originEdge = _.find(edges, e => e.uid === selectedElement.uid);
    const sourceNode = _.find(nodes, e => e.uid === edge.source);
    const targetNode = _.find(nodes, e => e.uid === edge.target);
    setItemsAdd({
      type: 'edge',
      items: [
        {
          ...originEdge,
          ...edge,
          startId: edge.source,
          endId: edge.target,
          relations: [sourceNode?.name, originEdge?.name, targetNode?.name]
        }
      ]
    });
  };

  const isDisabledItem = () => {
    if (ontoLibType === 'view' || viewMode) {
      return true;
    }
    if (selectedElement.model !== undefined && selectedElement.model !== '') {
      return true;
    }
    const arr = _.filter(
      edges,
      edge =>
        edge.name === formNameRef.getFieldValue('edgeClassName') &&
        edge.model !== undefined &&
        edge.model !== '' &&
        edge.uid !== selectedElement.uid
    );
    if (arr.length) {
      return false;
    }
    return false;
  };

  return (
    <div className="flow3-edge-info kw-h-100" style={{ width: selTabKey === 'EdgeClassAttributes' ? 640 : 400 }}>
      {window.location?.pathname?.indexOf('/knowledge/workflow') !== -1 && !firstBuild && (
        <Alert
          message={intl.get('ontoLib.nodeEdgeTips')}
          type="warning"
          showIcon
          style={{ backgroundColor: '#FFFBE6', borderColor: '#FFF1B8' }}
        />
      )}
      <div className="t-header">
        <Format.Title level={3}>{intl.get('ontoLib.edge')}</Format.Title>
        {!viewMode && (
          <Popconfirm
            className={ontoLibType === 'view' ? 'delete-btn-none' : undefined}
            title={intl.get('ontoLib.canvasEdge.sureToDelete')}
            onConfirm={confirmDelete}
            okText={intl.get('ontoLib.canvasEdge.confirmDelete')}
            cancelText={intl.get('ontoLib.canvasEdge.cancelDelete')}
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
        <Form form={formNameRef} className="kw-mt-5" layout={'vertical'} requiredMark={true}>
          <Form.Item
            name="edgeClassName"
            label={intl.get('ontoLib.canvasEdge.edgeClassName')}
            validateFirst={true}
            initialValue={edgeName}
            rules={[
              { required: true, message: intl.get('global.noNull') },
              { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
              { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
              { pattern: /^[0-9a-zA-Z_]{1,}$/, message: intl.get('ontoLib.errInfo.eLettersNumber_') },
              {
                // 关系类名不能和其他实体类名一样，（起点和终点一样的情况下）不能和其他关系类名一样
                validator: async (rule, value) => {
                  const filterNodes = nodes.filter(item => item.alias === value);
                  // if (filterNodes.length > 0) throw new Error('关系类名不能和其他实体类名一致');
                  if (filterNodes.length > 0) {
                    const msg = filterNodes?.[0]?.model
                      ? intl.get('ontoLib.errInfo.repeatErr')
                      : intl.get('global.repeatName');
                    throw new Error(msg);
                  }
                  const filterEdges = edges.filter(item => item.uid !== selectedElement.uid);
                  const filterEdgeAlias = filterEdges.filter(
                    item =>
                      item.startId === selectedElement.startId &&
                      item.endId === selectedElement.endId &&
                      item.name === value
                  );

                  // if (filterEdgeAlias.length > 0) throw new Error('关系类名不能和其他关系类名一致');
                  if (filterEdgeAlias.length > 0) {
                    const msg = filterEdgeAlias?.[0]?.model
                      ? intl.get('ontoLib.errInfo.repeatErr')
                      : intl.get('global.repeatName');
                    throw new Error(msg);
                  }
                  const filterModelEdgeName = filterEdges.filter(
                    item => item.model !== '' && item.model !== undefined && item.name === value
                  );
                  if (filterModelEdgeName.length > 0) {
                    throw new Error(intl.get('ontoLib.errInfo.repeatErr'));
                  }
                  const filterModelNodes = nodes.filter(
                    item => item.model !== '' && item.model !== undefined && item.name === value
                  );
                  if (filterModelNodes.length > 0) {
                    throw new Error(intl.get('ontoLib.errInfo.repeatErr'));
                  }
                }
              }
            ]}
            required
          >
            <Input
              style={{ maxWidth: 352 }}
              autoComplete="off"
              // disabled={ontoLibType === 'view' ||
              // (selectedElement.model !== '' && selectedElement.model !== undefined)}
              disabled={isDisabledItem()}
              placeholder={intl.get('ontoLib.canvasEdge.edgeClassPlaceHold')}
              onChange={e => edgeClassNameChanged(e)}
            />
          </Form.Item>
        </Form>

        <Tabs className="edge-info-tab" activeKey={selTabKey} onChange={e => changeTab(e)}>
          <Tabs.TabPane
            forceRender={true}
            tab={
              <span>
                {intl.get('ontoLib.canvasEdge.edgeDetail')}
                {detailHasError.current === true && (
                  <IconFont type="graph-warning1" style={{ color: '#f5222d', fontSize: 16 }} />
                )}
              </span>
            }
            key="EdgeClassDetail"
          >
            <EdgeClassDetail
              ref={DetailRef}
              nodes={nodes}
              edges={edges}
              selectedElement={selectedElement}
              updateData={updateData}
              setItemsUpdate={setItemsUpdate}
              setItemsDeleteIds={setItemsDeleteIds}
              onCreateEdge={onCreateEdge}
              setAliasHasChanged={setAliasHasChanged}
              ontoLibType={ontoLibType}
              showQuitTip={showQuitTip}
              isDisabledItem={isDisabledItem}
              detailHasError={detailHasError}
              groupList={groupList}
              onCreateGroup={onCreateGroup}
              group={group}
              setGroup={setGroup}
            />
          </Tabs.TabPane>
          <Tabs.TabPane
            forceRender={true}
            tab={
              <span>
                {intl.get('ontoLib.canvasEdge.edgeAttributes')}
                {attrHasError.current === true && (
                  <IconFont type="graph-warning1" style={{ color: '#f5222d', fontSize: 16 }} />
                )}
              </span>
            }
            key="EdgeClassAttributes"
          >
            <EdgeClassAttributes
              ref={AttributesRef}
              edgeAttributesData={edgeAttributes}
              updateData={updateData}
              ontoLibType={ontoLibType}
              selectedElement={selectedElement}
              isDisabledItem={isDisabledItem}
              attrHasError={attrHasError}
            />
          </Tabs.TabPane>
          <Tabs.TabPane forceRender={true} tab={intl.get('ontoLib.canvasEdge.edgeClassStyle')} key="EdgeClassStyle">
            <EdgeClassStyle
              ref={StyleRef}
              edgeStyleData={edgeStyle}
              updateData={updateData}
              ontoLibType={ontoLibType}
              selectedElement={selectedElement}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default forwardRef(OntoEdgeInfo);

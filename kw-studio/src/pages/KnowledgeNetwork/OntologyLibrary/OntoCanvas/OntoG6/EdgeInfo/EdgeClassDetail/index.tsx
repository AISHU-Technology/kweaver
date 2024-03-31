import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Form, Input, Button } from 'antd';
import type { FormInstance } from 'antd/es/form/Form';
import { PlusOutlined } from '@ant-design/icons';
import Format from '@/components/Format';
import { ONLY_KEYBOARD } from '@/enums';
import RelationPoints from './RelationPoints';
import SynonymsList from '../../components/SynonymsList';
import './style.less';
import { uniqEdgeId } from '../../assistant';
import GroupSelector from '../../GroupSelector';
import { GraphGroupItem } from '../../types/items';
import { useLocation } from 'react-router-dom';

const DES_TEST = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;

const { TextArea } = Input;

export interface EdgeDetailDataType {
  edgeDisplayName: string;
  edgeSynonyms: string[];
  edgeDescribe: string;
}

export interface EdgeDetailProps {
  selectedElement: Record<string, any>;
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  updateData: () => void;
  setItemsUpdate: (data: any) => void;
  setItemsDeleteIds: (data: any) => void;
  onCreateEdge: (edge: any) => void;
  setAliasHasChanged: (bool: boolean) => void;
  ontoLibType: string;
  showQuitTip: any;
  isDisabledItem: Function;
  detailHasError: React.MutableRefObject<boolean | undefined>;
  groupList: GraphGroupItem[];
  onCreateGroup: () => void;
  group: any;
  setGroup: Function;
}

export interface EdgeDetailRef {
  form: FormInstance<any>;
  formTable: Pick<FormInstance<any>, 'validateFields'>;
  dataSummary: React.MutableRefObject<EdgeDetailDataType | undefined>;
  setEdgeDisplayName: any;
}

const EdgeClassDetail: React.ForwardRefRenderFunction<EdgeDetailRef, EdgeDetailProps> = (props, detailRef) => {
  // 对外暴露的属性或者方法
  useImperativeHandle(detailRef, () => ({
    form,
    dataSummary,
    formTable: {
      validateFields: synonymsListRef.current?.validateFields
    },
    setEdgeDisplayName
  }));
  const {
    selectedElement,
    nodes,
    edges,
    ontoLibType,
    showQuitTip,
    isDisabledItem,
    detailHasError,
    groupList,
    onCreateGroup,
    group,
    setGroup
  } = props;
  const { updateData, setItemsUpdate, setItemsDeleteIds, onCreateEdge, setAliasHasChanged } = props;
  const [form] = Form.useForm();
  const synonymsListRef = useRef<any>();
  const dataSummary = useRef<EdgeDetailDataType | undefined>();
  const [edgeDisplayName, setEdgeDisplayName] = useState<string>(''); // 关系类显示名
  const [edgeRelation, setEdgeRelation] = useState<any[]>([]); // 关系类连接
  const [edgeSynonyms, setEdgeSynonyms] = useState<{ value: string; error?: string }[]>(
    _.filter(selectedElement.synonyms, Boolean).map(d => ({ value: d }))
  ); // 关系类同义词
  const [edgeDescribe, setEdgeDescribe] = useState<string>(''); // 关系类描述
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式
  /**
   * 组件是真条件渲染, 暂时不添加deps
   */
  useEffect(() => {
    if (!selectedElement.uid) return;
    setEdgeDisplayName(selectedElement.alias || '');
    setEdgeDescribe(selectedElement.describe || '');
    setEdgeSynonyms(_.filter(selectedElement.synonyms, Boolean).map(d => ({ value: d })));

    // 所有同名边
    const sameEdges = _.filter(
      edges,
      edge =>
        edge.name === selectedElement.name &&
        (edge.model === '' || edge.model === undefined) &&
        (selectedElement.model === '' || selectedElement.model === undefined)
    ).map(edge => _.pick(edge, 'uid', 'source', 'target'));
    if (!sameEdges.length) {
      sameEdges.push(_.pick(selectedElement, 'uid', 'source', 'target'));
    }
    setEdgeRelation(sameEdges);
  }, [selectedElement.uid]);

  // 数据更新到画布
  useEffect(() => {
    dataSummary.current = {
      edgeDisplayName,
      edgeSynonyms: _.map(edgeSynonyms, d => d.value).filter(Boolean),
      edgeDescribe
      // edgeRelation
    };
    validateDetailError();
    updateData();
  }, [edgeDisplayName, edgeSynonyms, edgeDescribe]);

  const onEdgeDisplayNameChanged = (e: any) => {
    setAliasHasChanged(true);
    setEdgeDisplayName(e.target.value);
  };

  const onEdgeDescribeChanged = (e: any) => {
    setEdgeDescribe(e.target.value);
  };

  /**
   * 新建起点终点关系
   */
  const onCreateRelation = () => {
    const cloneData = [...edgeRelation];
    const finallyEdge = cloneData[0];
    if (finallyEdge && (!finallyEdge.source || !finallyEdge.target)) {
      !finallyEdge.source && (finallyEdge.sourceErr = intl.get('ontoLib.errInfo.emptyInput'));
      !finallyEdge.target && (finallyEdge.targetErr = intl.get('ontoLib.errInfo.emptyInput'));
      return setEdgeRelation(cloneData);
    }
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    setEdgeRelation([{ uid: 'temporary-edge' }, ...edgeRelation]);
  };

  /**
   * 修改起点终点关系
   * @param edge 变更的边
   */
  const onRelationChange = (edge: any) => {
    const cloneEdge = { ...edge };
    cloneEdge.source && delete cloneEdge.sourceErr;
    cloneEdge.target && delete cloneEdge.targetErr;

    // 临时的边
    if (cloneEdge.uid === 'temporary-edge') {
      // 选完起点终点, 添加到画布
      if (cloneEdge.source && cloneEdge.target) {
        cloneEdge.uid = uniqEdgeId();
        onCreateEdge(cloneEdge);
      }
      setEdgeRelation(pre => _.map(pre, e => (e.uid === 'temporary-edge' ? cloneEdge : e)));
      return;
    }
    if (ontoLibType !== '') {
      showQuitTip.current = true;
    }
    // 修改画布
    setEdgeRelation(pre => _.map(pre, e => (e.uid === cloneEdge.uid ? cloneEdge : e)));
    setItemsUpdate({ type: 'all', items: [cloneEdge] });
  };

  /**
   * 删除起点终点关系
   * @param edge 删除的边
   */
  const onDeleteRelation = (edge: any) => {
    setEdgeRelation(pre => pre.filter(e => e.uid !== edge.uid));
    // 不是临时边, 需要从画布中清除
    if (edge.uid !== 'temporary-edge') {
      setItemsDeleteIds({ type: 'edge', items: [edge.uid] });
    }
  };

  /**
   * 新增同义词
   */
  const onAddSynonyms = () => {
    let hasError = false;
    if (edgeSynonyms.length && !edgeSynonyms[0].value) {
      const cloneData = [...edgeSynonyms];
      cloneData[0].error = intl.get('ontoLib.errInfo.emptyInput');
      setEdgeSynonyms(cloneData);
      hasError = true;
    }
    if (hasError || _.some(edgeSynonyms, d => d.error)) return;
    setEdgeSynonyms([{ value: '' }, ...edgeSynonyms]);
  };

  /**
   * 同义词变化
   * @param data 新的同义词
   */
  const onSynonymsChange = (data: any[]) => {
    setEdgeSynonyms(data);
  };

  // 校验detail板块的错误
  const validateDetailError = () => {
    let isError = false;
    // entityDisplayName
    // entityDisplayName不能为空
    if (edgeDisplayName === '') {
      isError = true;
    }
    // entityDisplayName少于50个字符
    if (edgeDisplayName.length > 50) {
      isError = true;
    }
    // entityDisplayName正则
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(edgeDisplayName)) {
      isError = true;
    }
    // // entityDisplayName和其余点边对比
    // const filterNodes = nodes.filter(item => item.uid !== selectedElement.uid);
    // const filterNodeAlias = filterNodes.filter(item => item.alias === edgeDisplayName);
    // if (filterNodeAlias.length > 0) {
    //   isError = true;
    // }
    // entitySynonyms的校验
    _.map(edgeSynonyms, synonyms => {
      if (synonyms.error && synonyms.error !== '') {
        isError = true;
      }
    });
    // entityDescribe少于150个字符
    if (edgeDescribe.length > 150) {
      isError = true;
    }
    // entityDescribe正则
    if (edgeDescribe.length && !DES_TEST.test(edgeDescribe)) {
      isError = true;
    }
    detailHasError.current = isError;
  };

  const onChangedSelectFunc = (ids: number[]) => {
    setGroup(ids);
  };

  return (
    <div className="edge-class-detail">
      <Form form={form} layout={'vertical'} requiredMark={true}>
        <Form.Item
          name="edgeDisplayName"
          initialValue={selectedElement?.alias}
          label={intl.get('ontoLib.canvasEdge.edgeDisplayName')}
          validateFirst={true}
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
            { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
            { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: intl.get('ontoLib.errInfo.ceLettersNumber_') },
            {
              // （起点和终点一样的情况下）不能和其他关系类显示名一样
              validator: async (rule, value) => {
                const filterEdges = edges.filter(item => item.uid !== selectedElement.uid);
                const filterEdgeAlias = filterEdges.filter(
                  item =>
                    item.startId === selectedElement.startId &&
                    item.endId === selectedElement.endId &&
                    item.alias === value
                );
                if (filterEdgeAlias.length > 0) {
                  throw new Error(intl.get('global.repeatName'));
                }
                // // 类名不一样的情况下，不能和其余关系类名一样
                // const filterOtherEdgeAlias = filterEdges.filter(
                //   item => item.name !== selectedElement.name && item.alias === value
                // );
                // if (filterOtherEdgeAlias.length > 0) {
                //   throw new Error(
                //     intl.get('ontoLib.errInfo.alreadyExisted', {
                //       name: intl.get('ontoLib.canvasEdge.edgeDisplayFName')
                //     })
                //   );
                // }
              }
            }
          ]}
          required
          tooltip={intl.get('ontoLib.edgeTips')}
        >
          <Input
            disabled={ontoLibType === 'view' || viewMode}
            autoComplete="off"
            onChange={e => onEdgeDisplayNameChanged(e)}
            placeholder={intl.get('ontoLib.canvasEdge.edgeDisplayPlaceHold')}
          />
        </Form.Item>
      </Form>

      {/* <Format.Title block strong={5}>
        {intl.get('ontoLib.canvasEdge.detailStartAndEnd')}
      </Format.Title> */}
      <div className="kw-mt-3 edge-relations-title">{intl.get('ontoLib.canvasEdge.detailStartAndEnd')}</div>
      {!viewMode && (
        <Button
          className={ontoLibType === 'view' ? 'add-relation-none' : 'kw-pl-0'}
          type="link"
          style={{ textAlign: 'left' }}
          icon={<PlusOutlined style={{ opacity: 0.8 }} />}
          disabled={isDisabledItem()}
          onClick={onCreateRelation}
        >
          {intl.get('ontoLib.canvasEdge.connect2Points')}
        </Button>
      )}

      <RelationPoints
        readOnly={isDisabledItem()}
        nodes={nodes}
        edges={edgeRelation}
        onDelete={onDeleteRelation}
        onChange={onRelationChange}
      />

      {/* <Format.Title className="kw-mt-5" block strong={5}>
        {intl.get('ontoLib.canvasEdge.edgeSynonyms')}
      </Format.Title> */}
      <div className="kw-mt-3 edge-synonyms-title">{intl.get('ontoLib.canvasEdge.edgeSynonyms')}</div>
      {!viewMode && (
        <Button
          className={ontoLibType === 'view' ? 'add-sys-none' : 'kw-pl-0'}
          type="link"
          style={{ textAlign: 'left' }}
          icon={<PlusOutlined style={{ opacity: 0.8 }} />}
          disabled={ontoLibType === 'view'}
          onClick={onAddSynonyms}
        >
          {intl.get('ontoLib.canvasEdge.connect2Points')}
        </Button>
      )}

      <SynonymsList
        ref={synonymsListRef}
        type="edge"
        readOnly={ontoLibType === 'view' || viewMode}
        data={edgeSynonyms}
        onChange={onSynonymsChange}
      />

      {ontoLibType === '' && (
        <div>
          <div className="kw-mt-3 group-sel-edge">{intl.get('ontoLib.canvasOnto.grouping')}</div>
          <GroupSelector
            value={group}
            node={selectedElement}
            groupList={groupList}
            onChange={onChangedSelectFunc}
            onCreateGroup={onCreateGroup}
          />
        </div>
      )}

      <Form form={form} layout={'vertical'}>
        <Form.Item
          className="kw-mt-3"
          name="edgeDescribe"
          initialValue={selectedElement?.describe}
          label={intl.get('ontoLib.canvasEdge.edgeDescribe')}
          validateFirst={true}
          rules={[
            { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
            { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') }
          ]}
        >
          <TextArea
            rows={4}
            placeholder={intl.get('ontoLib.canvasEdge.edgeDescribePlaceHold')}
            disabled={ontoLibType === 'view' || viewMode}
            onChange={e => onEdgeDescribeChanged(e)}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default forwardRef(EdgeClassDetail);

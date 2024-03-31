import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Form, Input, Button } from 'antd';
import type { FormInstance } from 'antd/es/form/Form';
import { PlusOutlined } from '@ant-design/icons';
import SynonymsList from '../../components/SynonymsList';
import './style.less';
import GroupSelector from '../../GroupSelector';
import { GraphGroupItem } from '../../types/items';
import { useLocation } from 'react-router-dom';

const DES_TEST = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;

const { TextArea } = Input;

export interface EntityDetailDataType {
  entityDisplayName: string;
  entitySynonyms: string[];
  entityDescribe: string;
}

export interface EntityDetailProps {
  entityDetailData: EntityDetailDataType;
  updateData: Function;
  setAliasHasChanged: Function;
  selectedElement: Record<string, any>;
  nodes: Record<string, any>[];
  edges: Record<string, any>[];
  ontoLibType: string;
  detailHasError: React.MutableRefObject<boolean | undefined>;
  groupList: GraphGroupItem[];
  onCreateGroup: () => void;
  group: any;
  setGroup: Function;
  handleGroupNodes: Function;
}

export interface EntityDetailRef {
  form: FormInstance<any>;
  formTable: Pick<FormInstance<any>, 'validateFields'>;
  dataSummary: React.MutableRefObject<EntityDetailDataType | undefined>;
  setPlaceHold: Function;
  setEntityDisplayName: Function;
  validateDetailError: Function;
}

const EntityClassDetail: React.ForwardRefRenderFunction<EntityDetailRef, EntityDetailProps> = (
  detailProps,
  detailRef
) => {
  // 对外暴露的属性或者方法
  useImperativeHandle(detailRef, () => ({
    form,
    dataSummary,
    formTable: {
      validateFields: synonymsListRef.current?.validateFields
    },
    setPlaceHold,
    setEntityDisplayName,
    validateDetailError
  }));

  const [form] = Form.useForm();
  const synonymsListRef = useRef<any>();
  const dataSummary = useRef<EntityDetailDataType | undefined>();

  // 外部传入的Detail数据
  const {
    entityDetailData,
    updateData,
    setAliasHasChanged,
    selectedElement,
    nodes,
    edges,
    ontoLibType,
    detailHasError,
    groupList,
    onCreateGroup,
    group,
    setGroup,
    handleGroupNodes
  } = detailProps;
  const [entityDisplayName, setEntityDisplayName] = useState<string>(entityDetailData.entityDisplayName); // 组件内实体类显示名
  const [entitySynonyms, setEntitySynonyms] = useState<{ value: string; error?: string }[]>(() => {
    return entityDetailData.entitySynonyms
      .filter(entitySynonym => entitySynonym && entitySynonym.trim())
      .map(d => ({ value: d }));
  }); // 组件内实体类同义词
  const [entityDescribe, setEntityDescribe] = useState<string>(entityDetailData.entityDescribe); // 组件内实体类描述
  const [placeHold, setPlaceHold] = useState<string>('');
  const location = useLocation<any>();
  const viewMode = location.state?.mode === 'view'; // 是否处于查看模式

  useEffect(() => {
    dataSummary.current = {
      entityDisplayName,
      entitySynonyms: _.map(entitySynonyms, d => d.value).filter(Boolean),
      entityDescribe
    };
    validateDetailError();
    updateData();
  }, [entityDisplayName, entitySynonyms, entityDescribe]);

  const entityDisplayNameChanged = (e: any) => {
    let value = e.target.value;
    if (value === '') {
      value = selectedElement.name;
      setPlaceHold(selectedElement.name);
    }
    setAliasHasChanged(true);
    setEntityDisplayName(value);
  };

  const entityDescribeChanged = (e: any) => {
    setEntityDescribe(e.target.value);
  };

  /**
   * 新增同义词
   */
  const onAddSynonyms = () => {
    let hasError = false;
    if (entitySynonyms.length && !entitySynonyms[0].value) {
      const cloneData = [...entitySynonyms];
      cloneData[0].error = intl.get('ontoLib.errInfo.emptyInput');
      setEntitySynonyms(cloneData);
      hasError = true;
    }
    if (hasError || _.some(entitySynonyms, d => d.error)) return;
    setEntitySynonyms([{ value: '' }, ...entitySynonyms]);
  };

  /**
   * 同义词变化
   * @param data 新的同义词
   */
  const onSynonymsChange = (data: any[]) => {
    setEntitySynonyms(data);
  };

  // 校验detail板块的错误
  const validateDetailError = () => {
    let isError = false;

    // entityDisplayName
    // entityDisplayName不能为空
    if (entityDisplayName === '' && placeHold === undefined) {
      isError = true;
    }
    // entityDisplayName少于50个字符
    if (entityDisplayName.length > 50) {
      isError = true;
    }
    // entityDisplayName正则
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(entityDisplayName)) {
      isError = true;
    }
    // entityDisplayName和其余点边对比
    const filterNodes = nodes.filter(item => item.uid !== selectedElement.uid);
    const filterNodeAlias = filterNodes.filter(item => item.alias === entityDisplayName);
    if (filterNodeAlias.length > 0) {
      isError = true;
    }

    // entitySynonyms的校验
    _.map(entitySynonyms, synonyms => {
      if (synonyms.error && synonyms.error !== '') {
        isError = true;
      }
    });

    // entityDescribe少于150个字符
    if (entityDescribe.length > 150) {
      isError = true;
    }
    // entityDescribe正则
    if (entityDescribe.length && !DES_TEST.test(entityDescribe)) {
      isError = true;
    }

    detailHasError.current = isError;
  };

  const onChangedSelectFunc = (ids: number[]) => {
    const diff = group.concat(ids).filter((v: any) => !group.includes(v) || !ids.includes(v));
    // 点编辑分组删除标签的操作，需要考虑是否存在孤立的边，应该同时删除
    if (group.length > ids.length) {
      handleGroupNodes(diff[0], selectedElement.uid);
    }
    setGroup(ids);
  };

  return (
    <div className="entity-class-detail">
      <Form form={form} layout={'vertical'} requiredMark={true}>
        <Form.Item
          name="entityDisplayName"
          initialValue={entityDisplayName}
          label={intl.get('ontoLib.canvasOnto.entityDisplayName')}
          validateFirst={true}
          rules={[
            { required: true, message: intl.get('global.noNull') },
            { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
            { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
            { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: intl.get('ontoLib.errInfo.ceLettersNumber_') },
            {
              validator: async (rule, value) => {
                if (value === '' && (placeHold === undefined || placeHold === '')) {
                  throw new Error(intl.get('ontoLib.errInfo.emptyInput'));
                }
              }
            },
            {
              // 实体类显示名不能和其他实体类显示名一样
              validator: async (rule, value) => {
                const filterNodes = nodes.filter(item => item.uid !== selectedElement.uid);
                const filterNodeAlias = filterNodes.filter(item => item.alias === value && item.alias !== '');
                if (filterNodeAlias.length > 0) {
                  throw new Error(intl.get('global.repeatName'));
                }
              }
            }
          ]}
          required
          tooltip={intl.get('ontoLib.nodeTips')}
        >
          <Input
            style={{ maxWidth: 352 }}
            disabled={viewMode || ontoLibType === 'view'}
            autoComplete="off"
            onChange={e => entityDisplayNameChanged(e)}
            placeholder={placeHold === '' ? intl.get('ontoLib.canvasOnto.entityDisplayPlaceHold') : placeHold}
          />
        </Form.Item>
      </Form>

      <div className="entity-synonyms-title">{intl.get('ontoLib.canvasOnto.entitySynonyms')}</div>
      {!viewMode && (
        <Button
          className={ontoLibType === 'view' ? 'add-synonyms-btn-none' : 'kw-pl-0'}
          type="link"
          style={{ textAlign: 'left' }}
          icon={<PlusOutlined style={{ opacity: 0.8 }} />}
          disabled={ontoLibType === 'view'}
          onClick={onAddSynonyms}
        >
          {intl.get('ontoLib.canvasOnto.addSynonyms')}
        </Button>
      )}
      <SynonymsList
        ref={synonymsListRef}
        type="node"
        readOnly={viewMode || ontoLibType === 'view'}
        data={entitySynonyms}
        onChange={onSynonymsChange}
      />

      {ontoLibType === '' && (
        <div>
          <div className="kw-mt-3 group-sel">{intl.get('ontoLib.canvasOnto.grouping')}</div>
          <GroupSelector
            value={group}
            node={selectedElement}
            groupList={groupList}
            onChange={onChangedSelectFunc}
            onCreateGroup={onCreateGroup}
          />
        </div>
      )}

      <Form form={form} layout={'vertical'} className="kw-mt-3">
        <Form.Item
          name="entityDescribe"
          initialValue={entityDescribe}
          label={intl.get('ontoLib.canvasOnto.entityDescribe')}
          validateFirst={true}
          rules={[
            { min: 1, message: intl.get('ontoLib.errInfo.minLen', { len: 1 }) },
            { max: 255, message: intl.get('ontoLib.errInfo.maxLen', { len: 255 }) },
            { pattern: DES_TEST, message: intl.get('ontoLib.errInfo.ceLettersNumberSymbols') }
          ]}
        >
          <TextArea
            rows={4}
            disabled={viewMode || ontoLibType === 'view'}
            placeholder={intl.get('ontoLib.canvasOnto.entityDescribePlaceHold')}
            onChange={e => entityDescribeChanged(e)}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default forwardRef(EntityClassDetail);

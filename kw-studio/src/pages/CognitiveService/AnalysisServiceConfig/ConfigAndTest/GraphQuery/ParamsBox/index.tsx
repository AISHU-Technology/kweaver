import React, { useState, useRef } from 'react';
import { Tabs } from 'antd';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import ParamCodeEditor, { ParamEditorRef, paramPolyfill } from '@/components/ParamCodeEditor';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import Toolbar from './Toolbar';
import ParamsList from './ParamsList';
import OntologiesList from './OntologiesList';
import { getPlaceholder } from './enum';
import { BasicData, ParamsList as TParamsList } from '../../../types';
import { EditorStatus } from '../index';
import './style.less';

import AddParamsModal from '@/pages/KnowledgeNetwork/FunctionManage/Code/addParamsModal';
import RelateModal from '@/pages/KnowledgeNetwork/FunctionManage/Code/RelateModal';

export interface ParamsBoxProps {
  className?: string;
  editor?: { current: ParamEditorRef | null };
  basicData: BasicData;
  paramsList: TParamsList;
  ontology: { entity?: any[]; edge?: any[] };
  editorStatus?: EditorStatus;
  onValueChange?: (value: string) => void;
  onParamChange?: (data: TParamsList) => void;
  onRun?: () => void;
  onFocus?: () => void;
}

type OperateInfo = {
  visible: boolean;
  data: Partial<ParamItem>;
  action: 'create' | 'edit' | 'relate' | 'quote' | 'run' | string;
};

const ParamsBox = (props: ParamsBoxProps) => {
  const {
    className,
    editor: outsideEditorInstance,
    basicData,
    paramsList = [],
    ontology,
    editorStatus,
    onValueChange,
    onParamChange,
    onRun,
    onFocus
  } = props;
  const editorRef = useRef<ParamEditorRef>(null);
  const [selectionText, setSelectionText] = useState(''); // 框选的文本
  const [isEmpty, setIsEmpty] = useState(true); // 编辑器是否为空
  const [isFocused, setIsFocused] = useState(false); // 编辑器是否聚焦
  const [operate, setOperate] = useState<OperateInfo>({ visible: false, data: {}, action: '' }); // 各种操作

  // 让外部获取编辑器实例
  if (outsideEditorInstance && _.has(outsideEditorInstance, 'current')) {
    outsideEditorInstance.current = editorRef.current;
  }

  /**
   * 框选
   */
  const onSelectionChange = (isSelect: boolean, text: string) => {
    setSelectionText(text);
  };

  /**
   * 文本变化, 如果参数标记有变动, 则会返回剩余的参数标记
   * @param value
   * @param existedParams
   */
  const onChange = (value: string, existedParams?: ParamItem[]) => {
    onValueChange?.(value);

    // TODO 需要处理顺序问题
    if (existedParams) {
      const params = _.orderBy(existedParams, ['_order']);
      onParamChange?.(params);
    }
    setIsEmpty(!value?.trim?.());
  };

  /**
   * 工具栏点击操作的回调
   * @param action 点击的功能
   * @param data 操作的数据
   */
  const onToolClick = ({ action, data }: { action: string; data?: any }) => {
    // 新建参数
    if (action === 'create') {
      if (!selectionText) return;
      const markAble = editorRef.current?.markAble();
      markAble && setOperate({ visible: true, data: {}, action });
    }

    // 关联参数
    if (action === 'relate') {
      if (!selectionText || !paramsList.length) return;
      const markAble = editorRef.current?.markAble();
      markAble && setOperate({ visible: true, data: {}, action });
    }

    // 引用函数
    if (action === 'quote') {
      const params = paramPolyfill(data.params);
      editorRef.current?.initMark(data.code, params);
      onParamChange?.(params);
      editorRef.current?.clearSelection();
    }

    // 运行函数
    if (action === 'run') {
      onRun?.();
    }
  };

  /**
   * 确认添加或编辑参数
   * @param values
   */
  const onConfirmCreate = (values: any) => {
    const { data } = operate;
    if (data.name) {
      const newParamsList = _.map(paramsList, p => {
        if (p?._id === data?._id) {
          return { ...p, ...values };
        }
        return p;
      });
      onParamChange?.(newParamsList);
      editorRef.current?.updateMark({ ...data, ...values });
      setOperate({ visible: false, data: {}, action: '' });
      return;
    }

    const attr = editorRef.current?.addMark({ ...values, _order: +new Date() });
    const newParamsList = _.cloneDeep(paramsList);
    newParamsList.push({ ...attr, position: [] } as any);
    onParamChange?.(newParamsList);
    editorRef.current?.clearSelection();
    setOperate({ visible: false, data: {}, action: '' });
  };

  /**
   * 确认关联
   * @param param 关联的目标参数
   */
  const onConfirmRelate = (param: ParamItem) => {
    const attr = editorRef.current?.addMark(_.omit(param, '_text'));
    if (!attr) return;
    const newParamsList = _.map(paramsList, p => {
      if (p._id === attr._id) {
        return { ...p, example: attr._text };
      }
      return p;
    });
    onParamChange?.(newParamsList);
    setOperate({ visible: false, data: {}, action: '' });
  };

  /**
   * 向编辑器中插入实体类名、属性名
   * @param text
   */
  const onInsertText = (text: string) => {
    editorRef.current?.insertText(text);
  };

  /**
   * 删除参数
   */
  const handleDelete = (param: ParamItem) => {
    editorRef.current?.removeMark(param);
    const newList = _.filter(paramsList, p => p?._id !== param?._id);
    onParamChange?.(newList);
  };

  return (
    <div className={classNames(className, 'custom-param-box-root kw-flex')}>
      <div className="kw-h-100 kw-flex-item-full-width">
        <Toolbar
          editor={editorRef}
          basicData={basicData}
          paramsList={paramsList}
          selectionText={selectionText}
          isEmpty={isEmpty}
          editorStatus={editorStatus}
          onToolClick={onToolClick}
        />
        <ParamCodeEditor
          ref={editorRef}
          height="100%"
          options={{ placeholder: getPlaceholder() }}
          params={paramsList}
          onSelectionChange={onSelectionChange}
          onChange={onChange}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      <div
        className="tabs-box"
        style={{ width: 400 }}
        onMouseDown={e => {
          // 不让编辑器失焦
          e.preventDefault();
        }}
      >
        <Tabs>
          <Tabs.TabPane key="params" tab={intl.get('function.parameter')}>
            <ParamsList
              paramsList={paramsList}
              onEdit={item => setOperate({ visible: true, data: item, action: 'edit' })}
              onDelete={handleDelete}
            />
          </Tabs.TabPane>
          <Tabs.TabPane key="ontologies" tab={intl.get('knowledge.entity')}>
            <OntologiesList
              key={basicData.kg_id}
              ontology={ontology}
              isEditorFocused={isFocused}
              onAdd={onInsertText}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>

      <AddParamsModal
        visible={operate.visible && ['create', 'edit'].includes(operate.action)}
        entities={ontology?.entity}
        parameters={paramsList}
        editParam={operate.data}
        selectValue={selectionText}
        isService={true}
        onHandleOk={onConfirmCreate}
        onCancel={() => setOperate({ visible: false, data: {}, action: '' })}
      />

      <RelateModal
        visible={operate.visible && operate.action === 'relate'}
        data={paramsList}
        onOk={onConfirmRelate}
        onCancel={() => setOperate({ visible: false, data: {}, action: '' })}
      />
    </div>
  );
};

export default ParamsBox;

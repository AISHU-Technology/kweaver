import React, { useState, useRef, useEffect, useReducer, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Tooltip, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import serviceFunction from '@/services/functionManage';
import HELPER from '@/utils/helper';
import { PERMISSION_CODES } from '@/enums';
import IconFont from '@/components/IconFont';
import ParamCodeEditor, {
  ParamEditorRef,
  isSingleStatement,
  updatePosition,
  paramPolyfill
} from '@/components/ParamCodeEditor';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import AddParamsModal from './addParamsModal';
import RelateModal from './RelateModal';
import ParamTable from './ParamTable';
import QuoteBar from './QuoteBar';
import SaveModal from './SaveModal';
import './style.less';

// const SIZE = 10;
const EXAMPLE_CODE =
  // eslint-disable-next-line no-template-curly-in-string
  ' match (v1:person{book:3,name:${name}})-[]->(v2:person{book:${book},name:"Aegon-I-Targaryen"}) return v1, v2 limit 2';

type CodeEditorProps = {
  knwId?: number; // 知识网络id
  parameters: any[]; // 参数
  isService?: boolean; // 是否服务应用
  entities?: any[]; // 实体类
  isDisabled?: boolean; // 是否可编辑
  codeError?: boolean; // 代码长度过长
  required?: boolean; // 必要参数标记
  mode?: 'simple' | 'default'; // 简单模式只有`新建`和`关联`操作
  customBar?: React.ReactNode; // 自定义操作按钮
  onErrorChange?: (item: any) => void; // 错误回调
  onParamChange?: (item: any) => void; // 参数变化的回调
  onValueChange?: (value: string) => void; // 内容变化的回调
  onQuote?: (func: Record<string, any>) => void; // 引用函数的回调
  onFocus?: (value: string) => void;
};

const CodeEditor = (props: CodeEditorProps, ref: any) => {
  const {
    knwId,
    parameters,
    isDisabled,
    codeError,
    entities,
    isService = false,
    required = true,
    mode = 'default',
    customBar,
    onErrorChange,
    onParamChange,
    onValueChange,
    onQuote,
    onFocus
  } = props;
  const editorRef = useRef<ParamEditorRef>(null);
  const [selectionText, setSelectionText] = useState(''); // 框选的文本
  const [visible, setVisible] = useState(false);
  // const [page, setPage] = useState<number>(1); // 监听页码
  // const [pageData, setPageData] = useState<any>([]); // 参数分页数据
  const [editParam, setEditParam] = useState<any>({}); // 编辑参数
  const [relateVisible, setRelateVisible] = useState(false); // 关联函数弹窗
  const [saveVisible, setSaveVisible] = useState(false); // 保存弹窗
  const [shouldSave, setShouldSave] = useState(false); // 是否可保存
  const [refreshQuoteFlag, dispatchRefreshQuoteFlag] = useReducer(x => x + 1, 0); // 触发刷新函数引用列表
  // 有新建权限才能保存
  const savePermission = useMemo(() => {
    return HELPER.getAuthorByUserInfo({ roleType: PERMISSION_CODES.ADF_KN_FUNCTION_CREATE });
  }, []);

  // 转发编辑器ref
  useImperativeHandle(ref, () => editorRef.current);

  useEffect(() => {
    // onChangePage(page);
    document.getElementsByClassName('functionCodeEditor')?.[0]?.addEventListener('copy', changeCopyText);
    return () => {
      document.getElementsByClassName('functionCodeEditor')?.[0]?.removeEventListener('copy', changeCopyText);
    };
  }, [parameters]);

  /**
   * 复制时还原
   */
  const changeCopyText = (e: any) => {
    const selectText = editorRef.current?.getSelectText(); // 选中的文字
    if (_.trim(selectText) === _.trim(editorRef.current?.getValue())) {
      const { statement } = editorRef.current?.getOriginData() || {};
      e.clipboardData.setData('text/plain', statement);
      e.preventDefault();
    } else {
      return selectText;
    }
  };

  /**
   * 打开参数化弹窗
   */
  const onClickParam = () => {
    if (!selectionText) return;
    const markAble = editorRef.current?.markAble();
    markAble && setVisible(true);
  };

  /**
   * 打开关联化弹窗
   */
  const onClickRelate = () => {
    if (!selectionText || !parameters.length) return;
    const markAble = editorRef.current?.markAble();
    markAble && setRelateVisible(true);
  };

  /**
   * 打开保存弹窗
   */
  const onClickSave = () => {
    if (!savePermission || !shouldSave) return;
    setSaveVisible(true);
  };

  /**
   * 编辑
   */
  const onClickEdit = (record: any) => {
    if (isDisabled) return;
    setEditParam(record);
    setVisible(true);
  };

  /**
   * 删除参数
   */
  const onDeleteParam = (record: any) => {
    const param = _.filter(parameters, p => p?._id !== record?._id);
    editorRef.current?.removeMark(record);
    onParamChange?.(param);
  };

  /**
   * 确认添加或编辑参数
   * @param values
   */
  const onConfirmAdd = (values: any) => {
    if (editParam?.name) {
      const params = _.map(parameters, p => {
        if (p?._id === editParam?._id) {
          return { ...p, ...values };
        }
        return p;
      });
      onParamChange?.(params);
      setVisible(false);
      setEditParam({});
      editorRef.current?.updateMark({ ...editParam, ...values });
      return;
    }

    const attr = editorRef.current?.addMark({ ...values, _order: +new Date() });
    const param = _.cloneDeep(parameters);
    param.push({ ...attr, position: [] });
    onParamChange?.(param);
    setVisible(false);
    editorRef.current?.clearSelection();
  };

  /**
   * 确认关联
   * @param param 关联的目标参数
   */
  const onConfirmRelate = (param: ParamItem) => {
    const attr = editorRef.current?.addMark(_.omit(param, '_text'));
    if (!attr) return;
    const newParams = _.map(parameters, p => {
      if (p._id === attr._id) {
        return { ...p, example: attr._text };
      }
      return p;
    });
    onParamChange?.(newParams);
    setRelateVisible(false);
  };

  /**
   * 处理引用
   * @param func 函数对象
   */
  const handleQuote = (func: Record<string, any>) => {
    onQuote?.(func);
    const { parameters, code } = func;
    const params = paramPolyfill(parameters);
    editorRef.current?.initMark(code, params);
    const curValue = editorRef.current?.getValue() || '';
    onValueChange?.(curValue);
    onParamChange?.(params);
    setShouldSave(!!curValue);
  };

  /**
   * 确认保存
   * @param formValues 函数名、描述、语言
   * @param setError 表单错误回调
   */
  const onSave = async (formValues: any, setError?: any) => {
    const { name, description, language } = formValues;
    const { params, statement } = editorRef.current?.getOriginData() || {};
    if (codeError) return;
    if (!statement.trim()) return onErrorChange?.(intl.get('global.noNull'));
    if (!isSingleStatement(statement)) return message.error(intl.get('function.onlySingle'));
    const paramsArr = updatePosition(parameters, params);
    try {
      const data = {
        knw_id: knwId!,
        name,
        language,
        code: statement,
        description,
        parameters: paramsArr
      };
      const response = await serviceFunction.functionCreate(data);
      dispatchRefreshQuoteFlag();

      if (response?.res) {
        message.success(intl.get('function.addSuccess'));
        setSaveVisible(false);
      }
      if (setError && response?.ErrorCode === 'Builder.FunctionService.CreateFunction.DuplicatedName') {
        setError([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
        return;
      }
      if (response?.ErrorCode) {
        message.error(response?.ErrorDetails);
      }
    } catch (err) {
      dispatchRefreshQuoteFlag();
    }
  };

  /**
   * 取消参数化
   */
  const onCancel = () => {
    setEditParam({});
    setVisible(false);
  };

  // 参数换页
  // const onChangePage = (page: number) => {
  //   const start = (page - 1) * SIZE;
  //   setPage(page);
  //   let currentData = parameters?.slice(start);

  //   if (start + SIZE < parameters?.length) {
  //     currentData = parameters?.slice(start, start + SIZE);
  //   }
  //   setPageData(currentData);
  // };

  /**
   * 文本变化, 如果参数标记有变动, 则会返回剩余的参数标记
   * @param value
   * @param existedParams
   */
  const onChange = (value: string, existedParams?: ParamItem[]) => {
    onValueChange?.(value);
    const size = getStrSize(value);
    onErrorChange?.(size > 16772150 ? intl.get('function.codeMatch') : '');

    setSelectionText('');
    // TODO 需要处理顺序问题
    if (existedParams) {
      const params = _.orderBy(existedParams, ['_order']);
      onParamChange?.(params);
    }

    setShouldSave(!!value);
  };

  /**
   * Blob对象计算代码字节长度
   */
  const getStrSize = (str: string) => (str ? new Blob([str]).size : 0);

  /**
   * 框选
   */
  const onSelectionChange = (isSelect: boolean, text: string) => {
    setSelectionText(text);
  };

  const getPlaceholder = () => {
    // 空行保留
    return `${intl.get('function.place1')}\n${intl.get('function.place2')}\n${intl
      .get('function.place4')
      .replace('4', '3')}\n${EXAMPLE_CODE}`;
  };

  return (
    <div className="functionCodeRoot">
      <div className={classNames('tool-bar kw-space-between', `tool-mode-${mode}`)}>
        <div className={classNames('kw-pl-4', { required })}>{intl.get('analysisService.graphLang')}</div>

        <div>
          <Tooltip title={intl.get('function.createBtn')}>
            <span className={classNames('tool-btn kw-mr-1', { disabled: !selectionText })} onClick={onClickParam}>
              <IconFont type="icon-Add" />
            </span>
          </Tooltip>
          <Tooltip title={intl.get('function.linkBtn')}>
            <span
              className={classNames('tool-btn kw-mr-1', { disabled: !selectionText || !parameters.length })}
              style={{ fontSize: 17 }}
              onClick={onClickRelate}
            >
              <IconFont type="icon-guanlian" />
            </span>
          </Tooltip>

          {mode === 'default' && (
            <>
              <QuoteBar knwId={knwId} refreshFlag={refreshQuoteFlag} onSelect={handleQuote} />
              <Tooltip title={intl.get('function.saveBtn')}>
                <span
                  className={classNames('tool-btn kw-mr-2', { disabled: !savePermission || !shouldSave })}
                  style={{ fontSize: 14 }}
                  onClick={onClickSave}
                >
                  <IconFont type="icon-baocun" />
                </span>
              </Tooltip>

              {customBar}
            </>
          )}
        </div>
      </div>

      <ParamCodeEditor
        className="functionCodeEditor"
        ref={editorRef}
        disabled={isDisabled}
        options={{ placeholder: getPlaceholder() }}
        height="248px"
        params={parameters}
        onSelectionChange={onSelectionChange}
        onChange={onChange}
        onFocus={onFocus}
      />

      {codeError && <div className="kw-c-error">{codeError}</div>}

      <div className="kw-pt-6">
        <div className="kw-mb-2">{intl.get('function.parameter')}</div>
        <ParamTable data={parameters} disabled={isDisabled} onEdit={onClickEdit} onDelete={onDeleteParam} />
      </div>

      <AddParamsModal
        visible={visible}
        entities={entities}
        parameters={parameters}
        editParam={editParam}
        selectValue={selectionText}
        isService={isService}
        onHandleOk={onConfirmAdd}
        onCancel={onCancel}
      />

      <RelateModal
        data={parameters}
        visible={relateVisible}
        onOk={onConfirmRelate}
        onCancel={() => setRelateVisible(false)}
      />

      <SaveModal visible={saveVisible} onCancel={() => setSaveVisible(false)} onOk={onSave} />
    </div>
  );
};
export default forwardRef(CodeEditor);

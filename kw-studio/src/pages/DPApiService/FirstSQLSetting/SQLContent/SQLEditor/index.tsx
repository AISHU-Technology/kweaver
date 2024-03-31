import React, {
  useState,
  useRef,
  useEffect,
  useReducer,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useContext
} from 'react';
import { Tooltip, message, Tabs } from 'antd';
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
import {
  DpapiDataContext,
  CHANGE_SQLCONTENT,
  CHANGE_SQLMODIFY,
  CHANGE_RELATEPARAMS,
  CHANGE_SQLPARAMS
} from '../../../dpapiData';
import './style.less';
import { getImage } from '../../assistant';
import locales from '@/locales';

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
  onErrorChange?: (item: any) => void; // 错误回调
  onParamChange?: (item: any) => void; // 参数变化的回调
  onValueChange?: (value: string) => void; // 内容变化的回调
  onQuote?: (func: Record<string, any>) => void; // 引用函数的回调
  onFocus?: (value: string) => void;
  selectedData: any;
  pageAction: any;
  setParameters: (value: any) => void;
};
const initialItems = [{ label: 'sql1', children: 'Content of Tab 1', key: '1' }];

const CodeEditor = (props: CodeEditorProps, ref: any) => {
  const {
    knwId,
    parameters,
    isDisabled,
    codeError,
    entities,
    isService = false,
    required = true,
    onErrorChange,
    onParamChange,
    onValueChange,
    onQuote,
    onFocus,
    setParameters,
    selectedData,
    pageAction
  } = props;
  const editorRef = useRef<ParamEditorRef>(null);
  const paramsListRef = useRef<any>();
  const [selectionText, setSelectionText] = useState(''); // 框选的文本
  const [visible, setVisible] = useState(false);
  const [editParam, setEditParam] = useState<any>({}); // 编辑参数
  const [relateVisible, setRelateVisible] = useState(false); // 关联函数弹窗
  const [shouldSave, setShouldSave] = useState(false); // 是否可保存
  const [paramsListHeight, setParamsListHeight] = useState(330);
  // const [activeKey, setActiveKey] = useState<any>(initialItems[0]['key']); // 编辑代码框的 tabs
  const [tabItems, setTabItems] = useState<any>(initialItems);
  const newTabIndex = useRef(1);
  const currentNumRef = useRef(initialItems[0].key); // 更加及时

  // @ts-ignore
  const { data, dispatch } = useContext(DpapiDataContext);
  const { sqlContent, sqlParams, basicData, sqlModify, relateParam } = data.toJS();

  useEffect(() => {
    if (pageAction !== 'create' && !_.isEmpty(basicData)) {
      const { params: data_params, ext, sqlText } = basicData;
      const arr =
        ext.sqlText && ext.sqlText.length > 0
          ? ext.sqlText.map((item: any) => {
              return { label: `sql${item.label}`, children: `Content ${item.label}`, key: `${item.label}` };
            })
          : initialItems;
      setTabItems(arr);
      // setActiveKey(arr[0].key);
      currentNumRef.current = arr[0].key;
      const params = paramPolyfill(data_params);
      setParameters(params);
      if (ext.sqlText.length) {
        newTabIndex.current = ext.sqlText[ext.sqlText.length - 1].label;
        const codeContent = ext.sqlText.find((item: any) => item.label === arr[0].key);
        const newParams = params.filter((item: any) => item.tabId === arr[0].key);
        const resParams = newParams.concat(
          ext.relateParam ? ext.relateParam.filter((item: any) => item.tabId === arr[0].key) : []
        );
        // @ts-ignore
        codeContent.value && editorRef?.current?.initMark(codeContent.value, resParams);
        codeContent.value && editorRef.current?.clearSelection();
      }
    }
  }, [basicData.id]);

  const { sourceImg, dsname } = useMemo(() => {
    if (_.isEmpty(selectedData)) return { sourceImg: '', dsname: '' };
    const sourceImg = getImage(selectedData?.origin);
    const dsname = selectedData?.origin?.dsname;
    return { sourceImg, dsname };
  }, [selectedData]);

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
    editorRef.current?.removeMark2(record);
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
      setTimeout(() => {
        const { params, statement } = editorRef.current?.getOriginData() || {};
        handleSqlContent(currentNumRef.current, statement);
      }, 0);
      return;
    }
    const attr: any = editorRef.current?.addMark({ ...values, _order: +new Date() });
    attr.tabId = currentNumRef.current;
    const param = _.cloneDeep(parameters);
    param.push({ ...attr, position: [] });
    setTimeout(() => {
      const { params, statement } = editorRef.current?.getOriginData() || {};
      const paramsArr = _.map(param, (item: any) => {
        if (item.tabId === currentNumRef.current) {
          const temp = params.find((p: any) => p.position[0].example === item.example);
          if (temp) {
            return { ...item, position: temp.position };
          }
        }
        return item;
      });
      onParamChange?.(paramsArr);
      handleSqlContent(currentNumRef.current, statement);
    }, 0);
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
    const { params, statement } = editorRef.current?.getOriginData() || {};
    let temp = params.find((item: any) => item._id === param._id);
    temp = {
      ...temp,
      position: _.map(temp.position, (item: any) => {
        const flag = _.find(sqlParams, { example: item.example });
        if (_.isNil(flag)) {
          return item;
        }
        return { example: '', pos: [] };
      })
    };
    let newRelateParam: any = [];
    const flag = _.findIndex(relateParam, (item: any) => item._id === temp._id && item.tabId === currentNumRef.current);
    if (flag !== -1) {
      newRelateParam = _.map(relateParam, (item: any) => {
        if (item._id === temp._id && item.tabId === currentNumRef.current) {
          return { ...item, position: temp.position };
        }
        return item;
      });
    } else {
      newRelateParam = [
        ...relateParam,
        {
          ...temp,
          name: param.name,
          tabId: currentNumRef.current
        }
      ];
    }
    handleSqlContent(currentNumRef.current, statement);
    dispatch({ type: CHANGE_RELATEPARAMS, data: newRelateParam });
    // setRelateParam(newRelateParam);
    setRelateVisible(false);
  };

  /**
   * 取消参数化
   */
  const onCancel = () => {
    setEditParam({});
    setVisible(false);
  };

  const getRemoveIndex = (paramsArr: any, removedInfo: any) => {
    const tmp = _.find(
      paramsArr,
      (item: any) => item.tabId === currentNumRef.current && removedInfo.removeName.includes(item.name)
    );
    let res = -1;
    if (!_.isNil(tmp)) {
      res = _.findIndex(tmp.position, (item: any) => {
        return item.pos[0] === removedInfo.line && item.pos[1] === removedInfo.ch;
      });
    }
    return res;
  };

  /**
   * 文本变化, 如果参数标记有变动, 则会返回剩余的参数标记
   * @param value
   * @param existedParams
   */
  const onChange = (value: string, existedParams?: ParamItem[], removedInfo?: any) => {
    onValueChange?.(value);
    const size = getStrSize(value);
    onErrorChange?.(size > 16772150 ? intl.get('function.codeMatch') : '');

    // 处理参数问题
    if (removedInfo) {
      // 先从 关联参数里找
      const newRelateParamIndex = getRemoveIndex(relateParam, removedInfo);
      if (newRelateParamIndex !== -1) {
        // 从关联参数删除
        const newRelateParam = _.map(relateParam, (item: any) => {
          if (item.tabId === currentNumRef.current && removedInfo.removeName.includes(item.name)) {
            item.position.splice(newRelateParamIndex, 1);
            return { ...item, position: item.position };
          }
          return item;
        });
        dispatch({ type: CHANGE_RELATEPARAMS, data: newRelateParam });
      } else {
        // 从新建参数删除
        const newParamIndex = _.findIndex(
          sqlParams,
          (item: any) => item.tabId === currentNumRef.current && removedInfo.removeName.includes(item.name)
        );
        if (newParamIndex !== -1) {
          const newParams = [...sqlParams];
          newParams.splice(newParamIndex, 1);
          onParamChange?.(newParams);
          const resParams: any = [];
          _.forEach(relateParam, (item: any) => {
            if (!removedInfo.removeName.includes(item.name)) {
              resParams.push(item);
            }
          });
          dispatch({ type: CHANGE_RELATEPARAMS, data: resParams });
        }
      }
    }

    setShouldSave(!!value);
    const { params, statement } = editorRef.current?.getOriginData() || {}; // editor组件内的数据
    // todo 输入变化时 输入内容可能导致原有 ${xxx} 的参数位置变化，所以要同步 params
    const tmp = sqlModify.find((item: any) => item.label === currentNumRef.current);
    if (tmp && tmp.value !== value) {
      updatePos(params);
    } else {
    }

    handleSqlContent(currentNumRef.current, statement);
    handleModifySql(currentNumRef.current, value);
  };
  const updatePos = (params: any) => {
    let newSqlParams = sqlParams.filter((item: any) => item.tabId === currentNumRef.current);
    let newRelateParams = relateParam.filter((item: any) => item.tabId === currentNumRef.current);
    const obj: any = {};
    _.forEach(params, (item: any) => {
      _.forEach(item.position, (pos: any) => {
        obj[pos.example] = pos.pos;
      });
    });
    if (newSqlParams && newSqlParams.length > 0) {
      newSqlParams = _.map(newSqlParams, (item: any) => {
        const tmp = obj[item.position[0].example];
        if (!_.isNil(tmp)) {
          return { ...item, position: [{ example: item.position[0].example, pos: tmp }] };
        }
        return item;
      });
      onParamChange?.(newSqlParams);
    }

    newRelateParams = _.map(newRelateParams, (item: any) => {
      if (item.position && item.position.length > 0) {
        const tmp = obj[item.position[0].example];
        if (!_.isNil(tmp)) {
          return { ...item, position: [{ example: item.position[0].example, pos: tmp }] };
        }
        return item;
      }
      return item;
    });

    if (newRelateParams && newRelateParams.length) {
      dispatch({ type: CHANGE_RELATEPARAMS, data: newRelateParams });
    }
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

  const onChangeTabs = (newActiveKey: string) => {
    currentNumRef.current = newActiveKey;
    // setActiveKey(newActiveKey);
    renderSqlArea(newActiveKey);
    setTimeout(() => {
      const { params, statement } = editorRef.current?.getOriginData() || {};
      handleSqlContent(currentNumRef.current, statement);
    }, 0);
  };

  const addTab = () => {
    const newActiveKey = `${++newTabIndex.current}`;
    const newPanes = [...tabItems];
    newPanes.push({ label: `sql${newActiveKey}`, children: 'Content of new Tab', key: newActiveKey });
    currentNumRef.current = newActiveKey;
    setTabItems(newPanes);
    // setActiveKey(newActiveKey);
    handleSqlContent(newActiveKey, '');
    handleModifySql(newActiveKey, '');
    renderSqlArea(newActiveKey);
  };

  const removeTab = (targetKey: string) => {
    let newActiveKey = currentNumRef.current;
    let lastIndex = -1;
    tabItems.forEach((item: any, i: any) => {
      if (item.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const newPanes = tabItems.filter((item: any) => item.key !== targetKey);
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    setTabItems(newPanes);
    currentNumRef.current = newActiveKey;
    // setActiveKey(newActiveKey);
    setTimeout(() => {
      // 为了处理onchange回调问题
      let newSQL = sqlContent.filter((item: any) => item.label !== targetKey);
      const newSQL2 = sqlModify.filter((item: any) => item.label !== targetKey);
      newSQL = _.map(newSQL, (item: any) => {
        if (item.label === currentNumRef.current) {
          const { statement } = editorRef.current?.getOriginData() || {};
          return { ...item, value: statement };
        }
        return item;
      });
      dispatch({ type: CHANGE_SQLCONTENT, data: newSQL });
      dispatch({ type: CHANGE_SQLMODIFY, data: newSQL2 });
    }, 10);
    renderSqlArea(newActiveKey);
  };

  const onEditTab = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'add') {
      addTab();
    } else {
      removeTab(targetKey);
    }
  };

  const handleSqlContent = (currentKey: any, data: any) => {
    let newSqlCotent: any = [];
    const temp = sqlContent.find((item: any) => item.label === currentKey);
    if (temp) {
      newSqlCotent = [...sqlContent];
      temp.value = data;
    } else {
      const sqlCotent: any = { label: currentKey, value: data };
      newSqlCotent = [...sqlContent, sqlCotent];
    }
    dispatch({ type: CHANGE_SQLCONTENT, data: newSqlCotent });
  };

  const handleModifySql = (currentKey: any, data: any) => {
    let newSqlCotent: any = [];
    const temp = sqlModify.find((item: any) => item.label === currentKey);
    if (temp) {
      newSqlCotent = [...sqlModify];
      temp.value = data;
    } else {
      const newSql: any = { label: currentKey, value: data };
      newSqlCotent = [...sqlModify, newSql];
    }
    dispatch({ type: CHANGE_SQLMODIFY, data: newSqlCotent });
  };

  const renderSqlArea = (newActiveKey: string) => {
    const params = sqlParams;
    const codeModify = sqlModify.find((item: any) => item.label === newActiveKey);
    const codeContent = sqlContent.find((item: any) => item.label === newActiveKey);
    editorRef?.current?.removeText();
    if (!_.isNil(codeModify)) {
      const newParams = params.filter((item: any) => item.tabId === newActiveKey);
      const resParams = newParams.concat(relateParam.filter((item: any) => item.tabId === newActiveKey));
      editorRef?.current?.initMark(codeContent.value, resParams);
    }
  };

  useEffect(() => {
    const contianerHeight = paramsListRef?.current?.offsetHeight - 30 - 30;
    setParamsListHeight(contianerHeight);
  }, [paramsListRef.current]);

  return (
    <div className="functionCodeRoot">
      <div className={classNames('tool-bar kw-space-between')}>
        <div className="tool-bar-tabs">
          <Tabs type="editable-card" onChange={onChangeTabs} activeKey={currentNumRef.current} onEdit={onEditTab}>
            {tabItems?.map((item: any) => {
              return <Tabs.TabPane tab={item.label} key={item.key}></Tabs.TabPane>;
            })}
          </Tabs>
        </div>

        <div className="editable-function">
          <img src={sourceImg} style={{ width: 14, height: 14, margin: '0 8px' }} />
          <span className="kw-ellipsis" style={{ display: 'inline-block', maxWidth: 120 }} title={dsname}>
            {dsname}
          </span>
          <span className="spa-line">|</span>
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
        </div>
      </div>
      <ParamCodeEditor
        className="functionCodeEditor"
        ref={editorRef}
        disabled={isDisabled}
        options={{ placeholder: `${intl.get('dpapiService.inputSql')}` }}
        height="248px"
        params={parameters}
        onSelectionChange={onSelectionChange}
        onChange={onChange}
        onFocus={onFocus}
      />

      {codeError && <div className="kw-c-error">{codeError}</div>}

      <div className="params-table-wrapper kw-pt-6" ref={paramsListRef}>
        <div className="kw-mb-2">{intl.get('function.parameter')}</div>
        <div className="params-list-wrapper" style={{ height: paramsListHeight }}>
          <ParamTable data={parameters} disabled={isDisabled} onEdit={onClickEdit} onDelete={onDeleteParam} />
        </div>
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
    </div>
  );
};
export default forwardRef(CodeEditor);

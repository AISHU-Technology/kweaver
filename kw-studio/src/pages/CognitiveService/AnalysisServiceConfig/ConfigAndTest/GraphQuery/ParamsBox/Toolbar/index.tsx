import React, { useState, useReducer, useEffect } from 'react';
import { Tooltip, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import serviceFunction from '@/services/functionManage';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import ExplainTip from '@/components/ExplainTip';
import { ANALYSIS_SERVICES } from '@/enums';
import { getPlaceholder } from '../enum';
import { BasicData } from '../../../../types';
import { EditorStatus } from '../../index';
import './style.less';

import { ParamEditorRef, isSingleStatement, updatePosition } from '@/components/ParamCodeEditor';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import QuoteBar from '@/pages/KnowledgeNetwork/FunctionManage/Code/QuoteBar';
import SaveModal from '@/pages/KnowledgeNetwork/FunctionManage/Code/SaveModal';

export interface ToolbarProps {
  editor: { current: ParamEditorRef | null };
  basicData: BasicData;
  paramsList: ParamItem[];
  selectionText: string;
  isEmpty?: boolean;
  editorStatus?: EditorStatus;
  onToolClick?: (cb: { action: string; data?: any }) => void;
}

const Toolbar = (props: ToolbarProps) => {
  const { editor, basicData, paramsList, selectionText, isEmpty, editorStatus, onToolClick } = props;
  const [saveVisible, setSaveVisible] = useState(false); // 保存弹窗
  const [refreshQuoteFlag, dispatchRefreshQuoteFlag] = useReducer(x => x + 1, 0); // 触发刷新函数引用列表

  useEffect(() => {
    if (!basicData.knw_id) return;
    const getKnwPermission = () => {
      // servicesPermission.dataPermission(postData).then(result => {
      //   setKnwCode(result?.res?.[0]?.codes);
      // });
    };
    getKnwPermission();
  }, [basicData.knw_id]);

  /**
   * 点击运行
   */
  const onRunClick = () => {
    onToolClick?.({ action: 'run' });
  };

  /**
   * 点击新建
   */
  const onCreateClick = () => {
    onToolClick?.({ action: 'create' });
  };

  /**
   * 点击关联
   */
  const onRelateClick = () => {
    onToolClick?.({ action: 'relate' });
  };

  /**
   * 引用
   * @param data
   */
  const onQuote = (data: { code: string; params: any[] }) => {
    onToolClick?.({ action: 'quote', data });
  };

  /**
   * 点击保存
   */
  const onSaveClick = () => {
    if (isEmpty) return;
    setSaveVisible(true);
  };

  /**
   * 确认保存
   * @param formValues 函数名、描述、语言
   * @param setError 表单错误回调
   */
  const onConfirmSave = async (formValues: any, setError?: any) => {
    const { name, description, language } = formValues;
    const { params, statement } = editor?.current?.getOriginData() || {};
    if (!isSingleStatement(statement)) return message.error(intl.get('function.onlySingle'));
    const paramsArr = updatePosition(paramsList, params);
    try {
      const data = {
        knw_id: basicData.knw_id,
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
      if (response?.ErrorDetails) {
        message.error(response?.ErrorDetails);
      }
    } catch (err) {
      dispatchRefreshQuoteFlag();
    }
  };

  return (
    <div className="custom-param-toolbar kw-space-between kw-pl-6 kw-pr-6">
      <div>
        <Format.Title style={{ verticalAlign: 'top' }}>{intl.get('analysisService.graphLangType')}</Format.Title>
        <ExplainTip
          autoMaxWidth
          placement="rightTop"
          title={<div style={{ whiteSpace: 'pre' }}>{getPlaceholder()}</div>}
        />
        <Tooltip
          placement="rightTop"
          title={
            <div style={{ minWidth: 200, maxWidth: 400 }}>
              <div className="kw-ellipsis">
                {intl.get('global.kgNet')}：{basicData.knw_name}
              </div>
              <div className="kw-ellipsis">
                {intl.get('global.graph')}：{basicData.kg_name}
              </div>
              <div className="kw-ellipsis">
                {intl.get('analysisService.queryType')}：{ANALYSIS_SERVICES.text(basicData.operation_type)}
              </div>
            </div>
          }
        >
          <IconFont className="info-icon kw-ml-2" type="icon-jibenxinxi" />
        </Tooltip>
      </div>
      <div>
        {editorStatus?.changed && (
          <div className="kw-c-error" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <ExclamationCircleFilled className="kw-mr-2" style={{ transform: 'translateY(1px)' }} />
            {intl.get('analysisService.changedTip')}
          </div>
        )}
        <Tooltip title={intl.get('function.runBtn')}>
          <span
            className={classNames('tool-btn run-btn kw-ml-3 kw-mr-2', { disabled: !editorStatus?.edited })}
            onClick={onRunClick}
          >
            <IconFont type="icon-qidong" />
          </span>
        </Tooltip>
        <Tooltip title={intl.get('function.createBtn')}>
          <span className={classNames('tool-btn kw-ml-2', { disabled: !selectionText })} onClick={onCreateClick}>
            <IconFont type="icon-Add" />
          </span>
        </Tooltip>
        <Tooltip title={intl.get('function.linkBtn')}>
          <span
            className={classNames('tool-btn kw-ml-1', { disabled: !selectionText || !paramsList?.length })}
            style={{ fontSize: 18 }}
            onClick={onRelateClick}
          >
            <IconFont type="icon-guanlian" />
          </span>
        </Tooltip>
        <QuoteBar knwId={basicData.knw_id} refreshFlag={refreshQuoteFlag} onQuote={onQuote} />
        <Tooltip title={intl.get('function.saveBtn')}>
          <span className={classNames('tool-btn kw-ml-1 kw-pr-0', { disabled: isEmpty })} onClick={onSaveClick}>
            <IconFont type="icon-baocun" />
          </span>
        </Tooltip>
      </div>

      <SaveModal visible={saveVisible} onOk={onConfirmSave} onCancel={() => setSaveVisible(false)} />
    </div>
  );
};

export default Toolbar;

import React, { useState, useMemo, useReducer, useEffect } from 'react';
import { Tooltip, message } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import servicesPermission from '@/services/rbacPermission';
import IconFont from '@/components/IconFont';
import { ANALYSIS_SERVICES } from '@/enums';
import { BasicData } from '../../../../SecondPublishAPI/types';
import { EditorStatus } from '../../index';
import './style.less';

import { ParamEditorRef, isSingleStatement, updatePosition } from '@/components/ParamCodeEditor';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import { getImage } from '@/pages/KnowledgeNetwork/DataSourceQuery/assistant';

export interface ToolbarProps {
  editor: { current: ParamEditorRef | null };
  basicData: BasicData;
  paramsList: ParamItem[];
  selectionText: string;
  isEmpty?: boolean;
  editorStatus?: EditorStatus;
  onToolClick?: (cb: { action: string; data?: any }) => void;
  selectedData: any;
}

const Toolbar = (props: ToolbarProps) => {
  const { editor, basicData, paramsList, selectionText, isEmpty, editorStatus, onToolClick, selectedData } = props;
  const { sourceImg, dsname } = useMemo(() => {
    if (selectedData && Object.keys(selectedData).length > 0) {
      const sourceImg = getImage(selectedData?.origin);
      const dsname = selectedData?.origin?.dsname;

      return { sourceImg, dsname };
    }
    return { sourceImg: '', dsname: '' };
  }, [selectedData]);
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
  return (
    <div className="custom-param-toolbar kw-space-between kw-pr-6" style={{ paddingLeft: '10px' }}>
      {Object.keys(selectedData).length > 0 ? (
        <div className={'dsWrapper'}>
          <img src={sourceImg} style={{ width: 14, height: 14, margin: '0 8px' }} />
          <span className="kw-ellipsis" style={{ display: 'inline-block', maxWidth: 200 }} title={dsname}>
            {dsname}
          </span>
        </div>
      ) : (
        <div></div>
      )}

      <div>
        <Tooltip title={intl.get('dpapiService.createBtn')}>
          <span className={classNames('tool-btn kw-ml-2', { disabled: !selectionText })} onClick={onCreateClick}>
            <IconFont type="icon-Add" />
          </span>
        </Tooltip>
        <Tooltip title={intl.get('dpapiService.linkBtn')}>
          <span
            className={classNames('tool-btn kw-ml-1', { disabled: !selectionText || !paramsList?.length })}
            style={{ fontSize: 18 }}
            onClick={onRelateClick}
          >
            <IconFont type="icon-guanlian" />
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default Toolbar;

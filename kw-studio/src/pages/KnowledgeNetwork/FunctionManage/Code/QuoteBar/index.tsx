import React, { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import serviceFunction from '@/services/functionManage';
import IconFont from '@/components/IconFont';
import QuoteModal from './Modal';

const DEFAULT_BODY = {
  page: 1,
  size: 1000,
  search: '',
  language: 'nGQL',
  order_type: 'desc',
  order_field: 'update_time'
};

export interface QuoteBarProps {
  knwId: number;
  disabled?: boolean;
  refreshFlag?: any; // 外部主动修改, 触发刷新
  onQuote?: (data: { code: string; params: any[] }) => void;
}

const QuoteBar = (props: any) => {
  const { knwId, disabled, refreshFlag, onQuote } = props;
  const [funcList, setFuncList] = useState<any[]>([]); // 函数列表
  const [visible, steVisible] = useState(false); // 引用弹窗

  useEffect(() => {
    knwId && getFuncList();
  }, [knwId, refreshFlag]);

  /**
   * 获取所有函数
   */
  const getFuncList = async () => {
    try {
      const body = { ...DEFAULT_BODY, knw_id: knwId };
      const response = await serviceFunction.functionList(body);
      if (response?.res) {
        setFuncList(response?.res?.functions || []);
      }
      if (response === null) {
        setFuncList([]);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 打开引用函数弹窗
   */
  const openModal = () => {
    if (disabled || !funcList.length) return;
    steVisible(true);
  };

  /**
   * 确认引用
   * @param data { code: 函数代码, params: 参数 }
   */
  const onOk = (data: { code: string; params: any[] }) => {
    onQuote?.(data);
    steVisible(false);
  };

  return (
    <>
      <Tooltip title={intl.get('function.referenceBtn')}>
        <span
          className={classNames('tool-btn kw-ml-1', { disabled: disabled || !funcList.length })}
          onClick={openModal}
        >
          <IconFont type="icon-yinyonghanshu" style={{ fontSize: 16, transform: 'translateY(1px)' }} />
        </span>
      </Tooltip>
      <QuoteModal visible={visible} funcList={funcList} onCancel={() => steVisible(false)} onOk={onOk} />
    </>
  );
};

export default QuoteBar;

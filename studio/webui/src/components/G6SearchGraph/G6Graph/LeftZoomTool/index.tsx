import React, { useEffect, useState } from 'react';
import { Input, Tooltip, Popover } from 'antd';
import { QuestionCircleOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import './style.less';

interface ZoomToolProps {
  count: number;
  zoomGraph: (option: string) => void;
  moveToSelect: () => void;
  setCount: (count: number) => void;
  setVisible: (visible: boolean) => void;
  visible: boolean;
}

const ZoomTool: React.FC<ZoomToolProps> = props => {
  const { visible, count, zoomGraph, moveToSelect, setCount, setVisible } = props;
  const [isError, setIsError] = useState<boolean>(false);
  const [isClick, setIsClick] = useState<boolean>(false); // 点击打开弹窗，鼠标移除步消失

  useEffect(() => {
    if (!count) {
      setCount(100);
    }
    setIsClick(false); // 初始化值为false
  }, [visible]);

  /**
   * 输入框的值改变
   */
  const changeNumber = (e: any) => {
    const value = parseInt(e.target.value);
    const test = /^[0-9]*$/;
    setIsError(false);
    setCount(e.target.value);

    if (!e.target.value) {
      return;
    }

    if (!test.test(e.target.value)) {
      setIsError(true);
    }

    if (value > 200) {
      setCount(200);
      return;
    }

    if (value < 1) {
      setCount(1);
      setIsError(false);
    }
  };
  return (
    <div id="search-graph-zoom">
      <div className="search-count-config">
        <Popover
          content={
            <div className="set-count-box" id="set-count-box">
              <div className="set-count-title">{intl.get('searchGraph.analysisConfig')}</div>
              <p className="label">
                <span className="entity-count">{intl.get('searchGraph.entityNum')}</span>
                <Tooltip
                  placement="bottomLeft"
                  zIndex={199}
                  arrowPointAtCenter
                  getPopupContainer={() => document.getElementById('set-count-box') || document.body}
                  title={intl.get('searchGraph.entityNumTip')}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </p>
              <Input
                className="search-count-input"
                placeholder={intl.get('searchGraph.inputPlace')}
                value={count}
                onChange={e => {
                  changeNumber(e);
                }}
              />
              <p className={isError ? 'error-text' : 'hidden'}>{intl.get('searchGraph.numberError')}</p>
            </div>
          }
          title={null}
          trigger={['hover']}
          placement="right"
          getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
          visible={visible}
          onVisibleChange={visible => {
            if (!visible) {
              !isClick && setVisible(false);
              return;
            }
            setVisible(visible);
          }}
        >
          <IconFont
            type="icon-setting"
            className="icon"
            onClick={() => {
              setVisible(true);
              setIsClick(true);
            }}
          />
        </Popover>
      </div>
      <div className="toolButton" onClick={moveToSelect}>
        <IconFont type="icon-dingwei" style={{ fontSize: 14 }} />
      </div>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomOut')}>
        <PlusOutlined
          className="toolButton add"
          onClick={() => {
            zoomGraph('add');
          }}
        />
      </Tooltip>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomIn')}>
        <MinusOutlined className="toolButton reduce" onClick={() => zoomGraph('reduce')} />
      </Tooltip>
    </div>
  );
};
export default ZoomTool;

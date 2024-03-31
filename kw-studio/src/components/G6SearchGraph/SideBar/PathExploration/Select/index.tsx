import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';
import { Select, Button } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';

import './style.less';

export interface SelectBoxProps {
  startNode: any; // 起点
  endNode: any; // 终点
  nodes: Array<any>;
  searchVisible: boolean;
  setStartNode: (node: any) => void; // 设置起点
  setEndNode: (node: any) => void; // 设置终点
  startExplore: () => void;
}

const SelectBox: React.FC<SelectBoxProps> = props => {
  const { nodes, startNode, endNode, searchVisible, setEndNode, setStartNode, startExplore } = props;
  const [errorText, seterrorText] = useState<string>(''); // 报错信息

  useEffect(() => {
    if (!startNode || !endNode) return;
    seterrorText('');
  }, [startNode, endNode]);

  useEffect(() => {
    // 画布返回到搜索列表，报错清空
    if (startNode || searchVisible) {
      seterrorText('');
    }
  }, [startNode, searchVisible]);

  /**
   * 交换方向
   */
  const changeNode = () => {
    const start = startNode;
    const end = endNode;
    setEndNode(start);
    setStartNode(end);
  };

  /**
   * 获取选择框的值
   */
  const getValue = (node: any) => {
    const id = node?.id;

    const currentNodes = [...nodes, startNode, endNode];
    const item = currentNodes.filter(e => e?.id === id)[0];

    if (node?.id) {
      return {
        value: item?.data?.name,
        label: (
          <div className="kw-ellipsis" title={item?.data?.id}>
            <span className="selectOption" style={{ background: item?.data?.color }}></span>
            {item?.data?.id}
          </div>
        )
      };
    }
    return undefined;
  };

  /**
   * 选择框切换
   */
  const selectChange = (e: any, type: string) => {
    seterrorText(''); // 清空报错

    if (!e) {
      return; // 清空
    }

    const node = nodes.filter(i => i.id === e?.key)[0];

    if (type === 'start') {
      setStartNode(node);
    }

    if (type === 'end') {
      setEndNode(node);
    }
  };

  // 点击探索按钮
  const clickExploreButton = () => {
    if (!startNode) {
      seterrorText(intl.get('searchGraph.noStartNode'));
      return;
    }

    if (!endNode) {
      seterrorText(intl.get('searchGraph.noEndNode'));
      return;
    }

    // 判断画布中是否存在起点、终点
    const startExit = nodes.some(item => item.id === startNode.id);
    const endExit = nodes.some(item => item.id === endNode.id);
    // 起点和终点都非空
    if (startExit && endExit) {
      startExplore();
      return;
    }

    if (!startExit) {
      setStartNode('');
    }
    if (!endExit) {
      setEndNode('');
    }

    seterrorText(intl.get('searchGraph.nodeRemoved'));
  };

  return (
    <div className="pathExplore-select-box" id="pathExplore-select-box">
      <div className="select-node-box">
        <div className="select-box-left" id="select-box-left">
          <div className="startpoint">
            <Select
              labelInValue
              placeholder={intl.get('searchGraph.startPlace')}
              value={getValue(startNode)}
              onChange={(e, option) => selectChange(e, 'start')}
              onSearch={() => {}}
              bordered={false}
              showSearch
              allowClear
              showArrow={false}
              style={{ width: '100%', height: 46 }}
              onClear={() => {
                setStartNode('');
              }}
              getPopupContainer={triggerNode => triggerNode.parentElement!}
              optionLabelProp="children"
            >
              {nodes.map(item => (
                <Select.Option key={item?.data?.id} value={item?.data?.id}>
                  <div className="kw-ellipsis" title={item?.data?.id}>
                    <span className="selectOption" style={{ background: item?.data?.color }}></span>
                    {item?.data?.id}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="endpoint">
            <Select
              labelInValue
              placeholder={intl.get('searchGraph.endPlace')}
              value={getValue(endNode)}
              onChange={e => selectChange(e, 'end')}
              bordered={false}
              showSearch
              allowClear
              showArrow={false}
              onSearch={() => {}}
              style={{ width: '100%', height: 46 }}
              onClear={() => {
                setEndNode('');
              }}
              getPopupContainer={triggerNode => triggerNode.parentElement!}
              optionLabelProp="children"
            >
              {nodes.map(item => (
                <Select.Option key={item?.data?.id} value={item?.data?.id}>
                  <div className="kw-ellipsis" title={item?.data?.id}>
                    <span className="selectOption" style={{ background: item?.data?.color }}></span>
                    {item?.data?.id}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
        <div className="change-icon" onClick={changeNode}>
          <IconFont type="icon-qiehuan1"></IconFont>
        </div>
      </div>
      <div className="error-text">{errorText || ''}</div>
      <div className="expore-btn-box">
        <Button
          icon={<IconFont type="icon-lujingtansuo" />}
          type="primary"
          className="expore-btn"
          onClick={() => clickExploreButton()}
          disabled={!startNode && !endNode}
        >
          {intl.get('searchGraph.startExplore')}
        </Button>
      </div>
    </div>
  );
};
export default memo(SelectBox);

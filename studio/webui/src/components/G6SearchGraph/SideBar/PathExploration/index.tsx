import React, { useState } from 'react'
import { Select, Input, Radio, Tooltip, Button } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import './style.less';

export interface PathexplorationProps {
  startNode: string; // 起点
  endNode: string; // 终点
  setStartNode: (node: string) => void; // 设置起点
  setEndNode: (node: string) => void; // 设置终点
}

const OPTIONS = ['Apples', 'Nails', 'Bananas', 'Helicopters'];

const Pathexploration: React.FC<PathexplorationProps> = props => {
  const { startNode, endNode, setStartNode, setEndNode } = props;
  const [checkPath, setCheckPath] = useState<string>('short');
  const [selectedItems, setSelectedItems] = useState<string>();
  const [end, setEnd] = useState<string>();

  return (
    <div className="path-exploration">
      <div className="exploration-title">
        {intl.get('searchGraph.pathExploration')}
      </div>
      <div className="select-path-type">
        <span>{intl.get('searchGraph.pathType')}</span>

        <Radio.Group onChange={e => {
          setCheckPath(e.target.value)
        }}
          value={checkPath}
        >
          <Radio value="short">{intl.get('searchGraph.shortPath')}</Radio>
          <Radio value="all">{intl.get('searchGraph.allPath')}</Radio>
        </Radio.Group>
      </div>
      <div className="select-node-box">
        <div className="startpoint">
          <Select
            placeholder={intl.get('searchGraph.startPlace')}
            value={startNode}
            onChange={e => { setStartNode(e) }}
            bordered={false}
            showArrow={false}
            style={{ width: '100%', height: 46 }}
          >
            {OPTIONS.map(item => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="endpoint">
          <Select
            placeholder={intl.get('searchGraph.endPlace')}
            value={endNode}
            onChange={e => { setEndNode(e) }}
            bordered={false}
            showArrow={false}
            style={{ width: '100%', height: 46 }}
          >
            {OPTIONS.map(item => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      <div className="expore-btn-box">
        <Button icon={<IconFont type="icon-lujingtansuo" />} type="primary" className="expore-btn">{intl.get('searchGraph.startExplore')}</Button>
      </div >
      <div className="replore-result">
        <div className="result-title">
          <div>{intl.get('searchGraph.pathList')}<span>()</span></div>
          <div><IconFont type="icon-paixu1"></IconFont></div>
        </div>
        <div></div>
      </div>
    </div >
  )
}
export default Pathexploration;

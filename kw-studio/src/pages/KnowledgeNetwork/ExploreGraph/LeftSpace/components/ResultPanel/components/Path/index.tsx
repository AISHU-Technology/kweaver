import React from 'react';
import { Checkbox, Collapse, Popover } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { GraphIcon } from '@/utils/antv6';
import PreviewCanvas from '../../../PreviewCanvas';
import './style.less';

export interface PathProps {
  className?: string;
  style?: React.CSSProperties;
  dataSource: any[]; // 渲染数据
  checkable?: boolean; // 是否显示可勾选
  checkedKeys?: string[]; // 勾选的key
  disabledKeys?: string[]; // 禁用的key
  onFocusItem?: (data: any) => void; // 点击 聚焦定位 的回调
  onCheckChange?: (keys: string[]) => void; // 勾选的回调
}

const Path = (props: PathProps) => {
  const { className, style, dataSource, checkable, checkedKeys, disabledKeys } = props;
  const { onFocusItem, onCheckChange } = props;

  /**
   * 处理勾选
   * @param checked 是否勾选
   * @param id 勾选的路径id
   */
  const handleCheck = (checked: boolean, id: string) => {
    onCheckChange?.(checked ? [...(checkedKeys || []), id] : _.filter(checkedKeys, k => k !== id));
  };

  return (
    <div className={classNames(className, 'canvas-res-panel-path')} style={style}>
      <Collapse className="path-result-collapse" ghost>
        {_.map(dataSource, (path, pIndex) => {
          return (
            <Collapse.Panel
              className="path-col-panel"
              key={path.id}
              header={
                <div className="kw-w-100 kw-space-between">
                  <div>
                    {checkable && (
                      <Checkbox
                        className="kw-mr-3"
                        disabled={_.includes(disabledKeys, path.id)}
                        checked={_.includes(checkedKeys, path.id)}
                        onChange={e => handleCheck(e.target.checked, path.id)}
                        onClick={e => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation();
                        }}
                      />
                    )}
                    {intl.get('exploreGraph.path') + (pIndex + 1)}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <Popover
                      overlayClassName="path-preview-popover"
                      trigger="click"
                      title={null}
                      zIndex={1060}
                      content={<PreviewCanvas layout="dagre" graphData={path} />}
                    >
                      <IconFont
                        className="kw-mr-3"
                        type="icon-lujingyulan"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation();
                        }}
                      />
                    </Popover>

                    {!checkable && (
                      <IconFont
                        type="icon-dingwei1"
                        onClick={(event: any) => {
                          event.stopPropagation();
                          event.nativeEvent.stopImmediatePropagation();
                          onFocusItem?.({ type: 'path', data: path });
                        }}
                      />
                    )}
                  </div>
                </div>
              }
            >
              {_.map(path.nodes, (node, nIndex: number) => {
                const isNotStartOrEnd = !!nIndex && nIndex < path.nodes.length - 1;
                return (
                  <React.Fragment key={node.id}>
                    <div className="path-item kw-align-center">
                      <div
                        className={classNames('circle-icon kw-mr-2', {
                          start: !nIndex,
                          end: nIndex === path.nodes.length - 1
                        })}
                        style={{ backgroundColor: isNotStartOrEnd ? node.color || '#126ee3' : undefined }}
                      >
                        {isNotStartOrEnd && <GraphIcon type={node.icon} />}
                      </div>
                      <div
                        className="kw-ellipsis"
                        style={{ flex: 1, minWidth: 0 }}
                        title={node?.default_property?.value}
                      >
                        {node?.default_property?.value}
                      </div>
                    </div>
                    {nIndex < path.nodes.length - 1 && (
                      <div className="link-line">
                        <MoreOutlined />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default Path;

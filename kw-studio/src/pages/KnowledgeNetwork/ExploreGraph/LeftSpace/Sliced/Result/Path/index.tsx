import React, { useState, useEffect, useMemo } from 'react';
import { Collapse, Popover } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { GraphIcon } from '@/utils/antv6';
import './style.less';
import PreviewCanvas from '../../../components/PreviewCanvas';

const Path = (props: any) => {
  const { data, onSelect } = props;
  const paths = useMemo(() => {
    const nodesMap = _.keyBy(data.nodesDetail, 'id');
    const edgesMap = _.keyBy(data.edgesDetail, 'id');
    return _.map(data.paths, p => {
      return {
        nodes: _.reduce(p.nodes, (res, id) => (nodesMap[id] ? [...res, nodesMap[id]] : res), [] as any[]),
        edges: _.reduce(p.edges, (res, id) => (edgesMap[id] ? [...res, edgesMap[id]] : res), [] as any[])
      };
    });
  }, [data]);

  return (
    <div>
      <Collapse className="slice-result-collapse-path" ghost>
        {_.map(paths, (path, pIndex) => {
          return (
            <Collapse.Panel
              key={String(pIndex)}
              header={
                <div className="kw-w-100 kw-space-between">
                  <div>{intl.get('exploreGraph.path') + (pIndex + 1)}</div>
                  <div onClick={e => e.stopPropagation()}>
                    <Popover
                      overlayClassName="path-preview-popover"
                      trigger="click"
                      title={null}
                      zIndex={1060}
                      content={<PreviewCanvas layout="dagre" graphData={path} />}
                    >
                      <IconFont
                        className="kw-mr-2"
                        type="icon-lujingyulan"
                        onClick={(event: any) => {
                          event.stopPropagation();
                          event.nativeEvent.stopImmediatePropagation();
                          return false;
                        }}
                      />
                    </Popover>

                    <IconFont
                      type="icon-dingwei1"
                      onClick={(event: any) => {
                        onSelect(path.nodes, path.edges);
                        event.stopPropagation();
                        event.nativeEvent.stopImmediatePropagation();
                        return false;
                      }}
                    />
                  </div>
                </div>
              }
            >
              {_.map(path.nodes, (node, nIndex: number) => {
                const isCenter = !!nIndex && nIndex < path.nodes.length - 1;
                return (
                  <>
                    <div className="path-item kw-align-center">
                      <div
                        className={classNames('circle-icon kw-mr-2', {
                          start: !nIndex,
                          end: nIndex === path.nodes.length - 1
                        })}
                        style={{ backgroundColor: isCenter ? node.color || 'red' : undefined }}
                      >
                        {isCenter && <GraphIcon type={node.icon} />}
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
                        <MoreOutlined style={{ fontSize: 12 }} />
                      </div>
                    )}
                  </>
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

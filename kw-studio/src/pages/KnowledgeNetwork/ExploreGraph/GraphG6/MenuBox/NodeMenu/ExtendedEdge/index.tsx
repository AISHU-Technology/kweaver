import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { GRAPH_LAYOUT_PATTERN } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import servicesExplore from '@/services/explore';

import ScrollBar from '@/components/ScrollBar';
import NoDataBox from '@/components/NoDataBox';

import { parseCommonResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';
import './style.less';

const ExtendEdge = (props: any) => {
  const { isTree, selectedNode, selectedItem, extend } = props;
  const { onCloseMenu, onChangeData, openTip, onClickExpand } = props;
  const [selectedKey, setSelectedKey] = useState('out');
  const [loading, setLoading] = useState(false);
  const [inAndOutData, setInAndOutData] = useState<any>(); // 进出边数据
  const [listData, setListData] = useState<Array<any>>([]); // 列表数据

  const graphLayoutPattern = selectedItem.graphLayoutPattern;

  useEffect(() => {
    if (extend?.current?.isShow) {
      getInAndOutData();
    }
  }, []);

  /**
   * 获取进出边的数据
   */
  const getInAndOutData = async () => {
    if (!selectedItem?.detail?.authorKgView) return;
    const rid = selectedNode?.getModel()?.id;
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    if (!parseInt(id)) return;
    setLoading(true);
    try {
      const res = await servicesExplore.getInOrOut({ kg_id: `${id}`, vid: rid });
      if (res?.res) {
        setListData(res.res.out_e);
        setInAndOutData({
          inData: res.res.in_e, // 入边
          outData: res.res.out_e // 出边
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // 点击展开
  const onClickClass = async (item: any) => {
    const rid = selectedNode?.getModel()?.id;
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    if (!parseInt(id)) return;
    onChangeData({ type: 'exploring', data: { isExploring: true } });

    try {
      const params = {
        id: `${id}`, // 图谱id
        direction: selectedKey === 'in' ? 'reverse' : 'positive',
        vids: [rid], // 展开点的id
        page: 1,
        size: -1,
        steps: 1,
        final_step: false,
        filters: [{ e_filters: [{ relation: 'and', type: 'satisfy_all', edge_class: item.edge_class }] }]
      };
      const res = await servicesExplore.getNeighbors(params);
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      addData(res?.res);
      onCloseMenu();
    } catch (err) {
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (err?.type === 'message') {
        const { Description } = err?.response || {};
        Description && message.error(Description);
      } else {
        const { Description } = err || {};
        Description && message.error(Description);
      }
    }
  };

  /**
   * 添加数据到画布
   * @param data 数据
   */
  const addData = (data: any) => {
    const { graph } = parseCommonResult(data);
    onChangeData({
      type: 'add',
      data: { ...graph, length: graph.nodes.length + graph.edges.length }
    });
  };

  // 切换进出边
  const onChange = (e: string) => {
    const data = e === 'in' ? inAndOutData?.inData : inAndOutData?.outData;
    setListData(data);
    setSelectedKey(e);
  };

  const formatSize = (size: any) => {
    if (size < 1000) return size;

    const sizeKB = Math.floor(size / 1000);
    if (sizeKB < 1000) return `${sizeKB} K`;

    const sizeMB = Math.floor(sizeKB / 1000);
    if (sizeMB < 1000) return `${sizeMB} M`;

    const sizeGB = Math.floor(sizeMB / 1000);
    return `${sizeGB} G`;
  };
  return (
    <div className="extendEdgeRoot">
      <div className="topSelect kw-space-between">
        <div className="kw-flex">
          <Button
            className={classNames('title', { 'border-bt': selectedKey === 'out' })}
            type="link"
            onClick={() => onChange('out')}
          >
            {intl.get('exploreGraph.edgeOut')}
          </Button>
          {graphLayoutPattern !== GRAPH_LAYOUT_PATTERN.TREE && (
            <Button
              className={classNames('title', { 'border-bt': selectedKey === 'in' })}
              type="link"
              disabled={isTree}
              onClick={() => onChange('in')}
            >
              {intl.get('exploreGraph.edgeEntry')}
            </Button>
          )}
        </div>

        <div className="kw-c-primary kw-pointer" onClick={() => onClickExpand(true)}>
          <Button type="text" disabled={_.isEmpty(inAndOutData?.inData) && _.isEmpty(inAndOutData?.outData)}>
            {intl.get('exploreGraph.advance')}
          </Button>
        </div>
      </div>
      <div className="extendEdges">
        <ScrollBar autoHeight autoHeightMax={360} isshowx="false">
          <div>
            {loading ? (
              <div className="loading-box">
                <LoadingOutlined className="icon" />
              </div>
            ) : !_.isEmpty(listData) ? (
              _.map(listData, (item, index) => {
                return (
                  <div
                    key={item?.edge_class}
                    className="kw-space-between kw-pl-4 kw-pr-4"
                    style={{ height: 42, cursor: 'pointer' }}
                    onClick={() => {
                      if (item?.count > 500) {
                        openTip({}, () => onClickClass(item));
                        return;
                      }
                      onClickClass(item);
                    }}
                  >
                    <div className="kw-c-text">{item?.edge_class}</div>
                    <div className="kw-c-subtext">{formatSize(item?.count)}</div>
                  </div>
                );
              })
            ) : (
              <NoDataBox.NO_CONTENT />
            )}
          </div>
        </ScrollBar>
      </div>
    </div>
  );
};
export default ExtendEdge;

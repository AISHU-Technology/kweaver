import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';
import { message, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import HOOKS from '@/hooks';
import servicesExplore from '@/services/explore';
import apiService from '@/utils/axios-http';
import intl from 'react-intl-universal';
import PathListBox from './PathList';
import SelectBox from './Select';

import './style.less';

import { handleEXData, duplicateRemoval } from './assistFunction';

const { Option, OptGroup } = Select;
export interface PathexplorationProps {
  startNode: any; // 起点
  endNode: any; // 终点
  nodes: Array<any>;
  selectedNode: any;
  lefSelect: number;
  sideBarVisible: boolean;
  selectGraph: any;
  edges: Array<any>;
  pathList: any;
  direction: string;
  pathType: number;
  isExplorePath: boolean;
  pathLoading: boolean;
  isCognitive: boolean;
  searchVisible: boolean;
  addGraphData: (nodes: any, edges: any) => void;
  setStartNode: (node: any) => void; // 设置起点
  setEndNode: (node: any) => void; // 设置终点
  setPathList: (nodes: any) => void;
  setDirection: (dire: string) => void;
  setType: (type: number) => void;
  setSelectedPath: (nodes: any) => void;
  setIsExplorePath: (isExplore: boolean) => void;
  setPathLoading: (loading: boolean) => void;
}

const ONCE_SHOW_LENGTH = 300; // 数据量过大分批显示

const Pathexploration: React.FC<PathexplorationProps> = props => {
  const {
    startNode,
    endNode,
    nodes,
    direction,
    selectedNode,
    lefSelect,
    sideBarVisible,
    pathList,
    selectGraph,
    isExplorePath,
    pathType,
    pathLoading,
    isCognitive,
    searchVisible,
    setPathList,
    setDirection,
    setStartNode,
    setEndNode,
    setSelectedPath,
    setIsExplorePath,
    setPathLoading,
    setType
  } = props;
  const [countOfRender, setCountOfRender] = useState<number>(0);
  const [allData, setAlldata] = useState<any[]>([]); // 保所有路径的数据
  const [isFirst, setIsFirst] = useState<boolean>(true); // 首次探索
  const [selectValue, setselectValue] = useState('1-positive');

  useEffect(() => {
    if (sideBarVisible && lefSelect === 3) {
      if (!startNode?.label) {
        setStartNode(selectedNode);

        return;
      }

      if (!endNode?.label) {
        setEndNode(selectedNode);
      }
    }
  }, [selectedNode, lefSelect, sideBarVisible]);

  useEffect(() => {
    const value = `${pathType}-${direction}`;
    setselectValue(value);
  }, [pathType, direction]);

  useEffect(() => {
    if (isCognitive && _.isEmpty(selectGraph)) {
      clearExplorePath();
    }
  }, [selectGraph]);

  // 开启探索
  const startExplore = async () => {
    setIsExplorePath(true);

    // 获取两点间路径
    const data = {
      id: selectGraph.kg_id,
      startRid: startNode.id,
      endRid: endNode.id,
      direction,
      shortest: pathType
    };
    setSelectedPath([]); // 再次探索，清空上此选择的路径
    setAlldata([]); // 清空上此请求保存的数据
    Object.keys(apiService.sources).forEach((key: string) => {
      (apiService.sources as any)[key]('取消请求');
    });

    setPathLoading(true);

    try {
      const res = await servicesExplore.explorePath(data);

      if (res && res.res) {
        setAlldata(res.res); // 查询的所有数据
        setPathList({ data: [], count: res.res?.length });
        return;
      }

      // if (res?.res === null) {
      //   setPathList({ data: [], count: 0 });
      //   setPathLoading(false);
      // }
      if (res?.ErrorCode) {
        message.error(res?.Description);
      }

      setPathList({ data: [], count: 0 });
      setPathLoading(false);
    } catch (error) {
      setPathLoading(false);
    }
  };

  /**
   * 获取点和边的详细信息
   */
  const getPathDeatil = async (vids: any[], eids: any[]) => {
    const { nodes, edges, selectGraph, addGraphData } = props;

    try {
      const response = await servicesExplore.explorePathDetails({ id: selectGraph.kg_id, paths: [{ vids, eids }] });

      if (response?.res) {
        const { openNodes, openEdges } = handleEXData(nodes, edges, response.res);
        addGraphData(openNodes, openEdges);
      }

      if (response?.ErrorCode) {
        message.error(response.Description);
      }

      setPathLoading(false);
    } catch (err) {
      setPathLoading(false);
    }
  };

  // 循环展开数据
  const loop = (data: any) => {
    let vertices: any[] = []; // 点
    let edges: any[] = []; // 边
    let list: Array<any[]> = pathList?.data; // 路径

    data.forEach((item: any) => {
      vertices = [...vertices, ...item.vertices];

      edges = [...edges, ...item.edges];
      list = [...list, item.vertices];
    });

    edges = edges.map((e: { id: any; out: any; in: any }) => e.id);

    // 去重
    vertices = duplicateRemoval(vertices);
    edges = duplicateRemoval(edges);

    getPathDeatil(vertices, edges);
    setPathList({ ...pathList, data: list });
  };

  // 定时批量展开
  HOOKS.useInterval(async () => {
    if (isExplorePath && !_.isEmpty(allData)) {
      const data = allData;

      if (countOfRender >= pathList?.count) {
        loop(data);
        setAlldata([]);
        return;
      }
      const newCountOfRender = countOfRender + ONCE_SHOW_LENGTH;
      setCountOfRender(newCountOfRender);

      const spliceData = data.splice(0, ONCE_SHOW_LENGTH);

      loop(spliceData);
      setAlldata(data);

      if (!data?.length) {
        setIsFirst(false);
      }
    }
  }, 5 * 1000);

  // 获取选择框的值
  const getSelectValue = (value: string) => {
    const values = value.split('-');
    const type = values[0] === '1' ? [intl.get('searchGraph.shortPath')] : [intl.get('searchGraph.allPath')];
    const direction: { [key: string]: string } = {
      positive: intl.get('searchGraph.forward'),
      reverse: intl.get('searchGraph.reverse'),
      bidirect: intl.get('searchGraph.allDirection')
    };
    const d = direction[values[1]];
    return `${type}-${d}`;
  };

  // 语义分析返回清空已探索的路径
  const clearExplorePath = () => {
    setAlldata([]);
    setPathList({ data: [], count: 0 });
    setEndNode('');
    setStartNode('');
    setIsExplorePath(false);
    setPathLoading(false);
    setType(1);
    setDirection('positive');
  };
  return (
    <div className="path-exploration" id="path-exploration">
      <div className="path-exploration-top">
        <div className="exploration-title">{intl.get('searchGraph.pathExploration')}</div>
        <div className="select-path-type">
          <span>{intl.get('searchGraph.pathType')}</span>
          <Select
            defaultValue="最短路径-正向"
            value={getSelectValue(selectValue)}
            style={{ width: 296, marginLeft: 8 }}
            getPopupContainer={() => document.getElementById('path-exploration') || document.body}
            onChange={value => {
              const values = value.split('-');
              setType(parseInt(values[0])); // 设置路径类型
              setDirection(values[1]); // 设置方向
              setselectValue(value);
            }}
          >
            <OptGroup title="false" label={<span className="label-style">{intl.get('searchGraph.shortPath')}</span>}>
              <Option value="1-positive">{intl.get('searchGraph.forward')}</Option>
              <Option value="1-reverse">{intl.get('searchGraph.reverse')}</Option>
              <Option value="1-bidirect">{intl.get('searchGraph.allDirection')}</Option>
            </OptGroup>
            <OptGroup title="false" label={<span className="label-style">{intl.get('searchGraph.allPath')}</span>}>
              <Option value="0-positive">{intl.get('searchGraph.forward')}</Option>
              <Option value="0-reverse">{intl.get('searchGraph.reverse')}</Option>
              <Option value="0-bidirect">{intl.get('searchGraph.allDirection')}</Option>
            </OptGroup>
          </Select>
        </div>

        <SelectBox
          nodes={nodes}
          startNode={startNode}
          endNode={endNode}
          searchVisible={searchVisible}
          setEndNode={setEndNode}
          setStartNode={setStartNode}
          startExplore={startExplore}
        />
      </div>

      {pathLoading && isFirst ? (
        <div className="path-loading-data">
          <LoadingOutlined className="icon" />
          <p className="loading-tip">{intl.get('searchGraph.loadingTip')}</p>
        </div>
      ) : isExplorePath ? (
        <PathListBox
          nodes={nodes}
          setSelectedPath={setSelectedPath}
          pathList={pathList}
          setPathList={setPathList}
          loading={pathLoading}
          pathType={pathType}
          setIsFirst={setIsFirst}
        />
      ) : null}
    </div>
  );
};
export default memo(Pathexploration);

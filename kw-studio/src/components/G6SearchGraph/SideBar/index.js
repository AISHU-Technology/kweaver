/**
 * @description 汇总信息
 * @author Eden
 * @date 2022/01/11
 */

import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import Summary from './Summary';
import Basic from './Basic';
import Pathexploration from './PathExploration';

import './style.less';

const ICON_ARRAY = [
  { id: 1, type: 'icon-iconzhengli_dangan', intlText: 'searchGraph.Summary' },
  { id: 2, type: 'icon-jibenxinxi', intlText: 'searchGraph.baseInfo' },
  { id: 3, type: 'icon-lujingtansuo', intlText: 'searchGraph.pathExploration' }
];
class SideBar extends Component {
  onClickIcon = () => {
    const { setSideBarVisible, setAutoOpen, sideBarVisible, lefSelect, setTabSelect } = this.props;
    setSideBarVisible(!sideBarVisible);

    // 默认打开汇总信息
    if (!lefSelect) {
      setTabSelect(1);
    }

    // 手动关闭，点击实体不再打开
    if (sideBarVisible) {
      setAutoOpen();
    }
  };

  render() {
    const {
      setSideBarVisible,
      nodes,
      edges,
      selectedNode,
      sideBarVisible,
      showNodeProperty,
      setShowNodeProperty,
      showEdgeProperty,
      startNode,
      endNode,
      setStartNode,
      setEndNode,
      setTabSelect,
      lefSelect,
      setPathList,
      selectGraph,
      pathList,
      addGraphData,
      direction,
      setDirection,
      pathType,
      setType,
      setSelectedPath,
      isExplorePath,
      setIsExplorePath,
      pathLoading,
      setPathLoading,
      isCognitive,
      searchVisible
    } = this.props;
    return (
      <div className="side-bar-right">
        <div className="toggle">
          <div
            className="icon-menu-box"
            onClick={() => {
              this.onClickIcon();
            }}
          >
            {sideBarVisible ? (
              <IconFont type="icon-zhankai1" className="icon-menu" />
            ) : (
              <IconFont type="icon-zhankai1" />
            )}
          </div>

          {_.map(ICON_ARRAY, item => {
            const { id, type, intlText } = item;
            return (
              <div
                key={id}
                className={lefSelect === id ? 'search-graph-navItem select' : 'search-graph-navItem'}
                onClick={() => {
                  setTabSelect(id);
                  setSideBarVisible(true);
                }}
              >
                <div title={intl.get(intlText)}>
                  <IconFont type={type} className={lefSelect === id ? 'select-icon icon' : 'icon'} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={sideBarVisible ? 'graph-info-tab' : 'graph-info-tab-close'}>
          {lefSelect === 1 && <Summary nodes={nodes} edges={edges} />}
          {lefSelect === 2 && (
            <Basic
              selectedNode={selectedNode}
              showEdgeProperty={showEdgeProperty}
              showNodeProperty={showNodeProperty}
              setShowNodeProperty={setShowNodeProperty}
            />
          )}
          {lefSelect === 3 && (
            <Pathexploration
              startNode={startNode}
              endNode={endNode}
              setStartNode={setStartNode}
              setEndNode={setEndNode}
              nodes={nodes}
              lefSelect={lefSelect}
              selectedNode={selectedNode}
              sideBarVisible={sideBarVisible}
              setPathList={setPathList}
              pathList={pathList}
              selectGraph={selectGraph}
              edges={edges}
              addGraphData={addGraphData}
              direction={direction}
              setDirection={setDirection}
              pathType={pathType}
              setType={setType}
              setSelectedPath={setSelectedPath}
              isExplorePath={isExplorePath}
              setIsExplorePath={setIsExplorePath}
              pathLoading={pathLoading}
              setPathLoading={setPathLoading}
              isCognitive={isCognitive}
              searchVisible={searchVisible}
            />
          )}
        </div>
      </div>
    );
  }
}

export default SideBar;

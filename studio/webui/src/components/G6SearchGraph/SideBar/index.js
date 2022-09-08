import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import Summary from './Summary';
import Basic from './Basic';
import PathExploration from './PathExploration';
import './style.less';

const ICON_ARRAY = [
  { id: 1, type: 'icon-iconzhengli_dangan', intlText: 'searchGraph.Summary' },
  { id: 2, type: 'icon-jibenxinxi', intlText: 'searchGraph.baseInfo' }
];
class SideBar extends Component {
  state = {
    lefSelect: 0
  };

  setTabSelect = e => {
    this.setState({
      lefSelect: e
    });
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
      lefSelect
    } = this.props;
    return (
      <div className="side-bar-right">
        <div className="toggle">
          <div
            className="icon-menu-box"
            onClick={() => {
              setSideBarVisible(!sideBarVisible);
              !lefSelect && setTabSelect(1);
              sideBarVisible && this.props.setAutoOpen(); // 手动关闭，点击实体不再打开
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
            <PathExploration
              startNode={startNode}
              endNode={endNode}
              setStartNode={setStartNode}
              setEndNode={setEndNode}
            />
          )}
        </div>
      </div>
    );
  }
}

export default SideBar;

/**
 * @description 进出边选择栏
 */

import React, { Component } from 'react';
import G6 from '@antv/g6';
import _ from 'lodash';
import { Tooltip, Empty } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import ScrollBar from '@/components/ScrollBar';
import servicesExplore from '@/services/explore';
import intl from 'react-intl-universal';
import kong from '@/assets/images/kong.svg';
import './style.less';
import IconFont from '@/components/IconFont';

class Information extends Component {
  state = {
    inData: [], // 入边
    outData: [], // 出边
    sourceData: [], // 类下能展开的数据
    openEdges: this.props.edges, // 要展开的数据
    loading: false // 加载数据
  };

  componentDidMount() {
    const { selectGraph, selectedNode } = this.props;

    this.getInAndOutData(selectGraph.kg_id, selectedNode.id);
  }

  componentWillUnmount = () => {
    this.setState = (state, callback) => {};
  };

  /**
   * @description 获取in和out的数据
   * @param {string} id  知识网络id
   * @param {string} rid 节点id
   */
  getInAndOutData = async (id, rid) => {
    this.setState({
      loading: true
    });

    const res = await servicesExplore.getInOrOut({ kg_id: id, vid: rid });

    if (res?.res) {
      this.setState({
        inData: res?.res?.in_e, // 入边
        outData: res?.res?.out_e // 出边
      });
    }

    this.setState({
      loading: false
    });
  };

  /**
   * @description 选择边
   */
  selectEdge = async edge => {
    this.props.setSelectEdge(edge);
  };

  // 计算还未展开的数量
  getCount = item => {
    const { edges, selectedNode, inOrOut } = this.props;
    if (inOrOut === 'in') {
      const classCount = edges.filter(
        element => element.class === item.edge_class && selectedNode.id === element.target
      ).length;
      return classCount;
    }

    if (inOrOut === 'out') {
      const classCount = edges.filter(
        element => element.class === item.edge_class && selectedNode.id === element.source
      ).length;

      return classCount;
    }
  };

  render() {
    const { inData, outData, loading } = this.state;
    const { selectEdge, inOrOut } = this.props;

    return (
      <div className="information-tab" id="informationTab">
        <div className="title-fo">
          {inOrOut === 'in' ? intl.get('searchGraph.inEdge') : intl.get('searchGraph.outEdge')}
        </div>

        {inOrOut === 'in' ? (
          <ScrollBar autoHeight autoHeightMax={380} isshowx="false" color="rgb(184,184,184)">
            <div id="edgeMuster" className="edge-muster">
              {loading ? (
                <div className="in-out-loading-data">
                  <LoadingOutlined className="icon" />
                </div>
              ) : inData?.length ? (
                _.map(inData, (item, index) => {
                  return (
                    <div
                      className={
                        item?.edge_class === selectEdge.edge_class && selectEdge.type === 'in'
                          ? 'edge-name edge-name-selected'
                          : 'edge-name'
                      }
                      key={index.toString()}
                      onClick={() => {
                        this.selectEdge({ ...item, type: 'in' });
                      }}
                    >
                      <div className="edge-name-tooltip edge-name-tooltip-in">
                        <Tooltip placement="topLeft" title={item?.edge_class}>
                          <span className="word">{item?.edge_class}</span>
                        </Tooltip>
                      </div>
                      <span className="word">
                        (<span className="opened">{this.getCount(item)}</span>/{item?.count})
                      </span>
                      <IconFont type="icon-fanye" className="right-out" />
                    </div>
                  );
                })
              ) : (
                <Empty style={{ marginTop: 100 }} description={`${intl.get('searchGraph.noData')}`} image={kong} />
              )}
            </div>
          </ScrollBar>
        ) : (
          <ScrollBar autoHeight autoHeightMax={380} color="rgb(184,184,184)">
            {loading ? (
              <div className="in-out-loading-data">
                <LoadingOutlined className="icon" />
              </div>
            ) : (
              <div className="edge-muster">
                {outData?.length ? (
                  _.map(outData, (item, index) => {
                    return (
                      <div
                        className={
                          item?.edge_class === selectEdge.edge_class && selectEdge.type === 'out'
                            ? 'edge-name edge-name-selected'
                            : 'edge-name'
                        }
                        key={index.toString()}
                        onClick={() => {
                          this.selectEdge({ ...item, type: 'out' });
                        }}
                      >
                        <div className="edge-name-tooltip edge-name-tooltip-in">
                          <Tooltip placement="topLeft" title={item?.edge_class}>
                            <span className="word">{item?.edge_class}</span>
                          </Tooltip>
                        </div>
                        <span className="word">
                          (<span className="opened">{this.getCount(item)}</span>/{item?.count})
                        </span>

                        <IconFont type="icon-fanye" className="right-out" />
                      </div>
                    );
                  })
                ) : (
                  <Empty
                    style={{ marginTop: 100, height: 122 }}
                    description={`${intl.get('searchGraph.noData')}`}
                    image={kong}
                  />
                )}
              </div>
            )}
          </ScrollBar>
        )}
      </div>
    );
  }
}

export default Information;

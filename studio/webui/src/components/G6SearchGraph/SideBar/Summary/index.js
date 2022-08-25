/**
 * @description 汇总信息
 * @author Eden
 * @date 2022/01/11
 */

import React, { Component } from 'react';
import { List, Empty, ConfigProvider } from 'antd';
import intl from 'react-intl-universal';
import { numToThousand } from '@/utils/handleFunction';
import kong from '@/assets/images/kong.svg';
import './style.less';

class Summary extends Component {
  state = {
    check: 'nodes'
  };

  /**
   * @description 将class相同点点聚合在一起
   */
  handleNodes = nodes => {
    let allClass = [];
    let newNodes = [];

    nodes.forEach(item => {
      if (allClass.includes(item.data.class)) {
        newNodes = newNodes.map(nItem => {
          if (nItem.class === item.data.class) {
            nItem.count++;
          }

          return nItem;
        });
      } else {
        allClass = [...allClass, item.data.class];
        newNodes = [
          ...newNodes,
          { class: item.data.class, alias: item.data.alias || item.data.name, count: 1, color: item.data.color }
        ];
      }
    });

    return newNodes;
  };

  /**
   * @description 将class相同点边聚合在一起
   */
  handleEdges = edges => {
    let allClass = [];
    let newEdges = [];

    edges.forEach(item => {
      if (allClass.includes(item.class)) {
        newEdges = newEdges.map(eItem => {
          if (eItem.class === item.class) {
            eItem.count++;
          }

          return eItem;
        });
      } else {
        allClass = [...allClass, item.class];
        newEdges = [...newEdges, { class: item.class, alias: item.alias || item.name, count: 1, color: item.color }];
      }
    });

    return newEdges;
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kong} description={intl.get('createEntity.noData')} />
    </div>
  );

  render() {
    const { nodes, edges } = this.props;
    const { check } = this.state;

    return (
      <div className="new-summary">
        <div className="new-summary-title">{intl.get('searchGraph.Summary')}</div>

        <div className="summaryinfo-header">
          <div
            className={
              check === 'nodes' ? 'summaryinfo-header-box-checked left-border' : 'summaryinfo-header-box left-border'
            }
            onClick={() => {
              this.setState({
                check: 'nodes'
              });
            }}
          >
            {intl.get('atlasDetails.summaryInfo.vertex')}&nbsp; ({numToThousand(nodes.length)})
          </div>
          <div
            className={
              check === 'edges' ? 'summaryinfo-header-box-checked right-border' : 'summaryinfo-header-box right-border'
            }
            onClick={() => {
              this.setState({
                check: 'edges'
              });
            }}
          >
            {intl.get('atlasDetails.summaryInfo.edge')}&nbsp; ({numToThousand(edges.length)})
          </div>
        </div>

        <div
          className={(!nodes.length && check === 'nodes') || (!edges.length && check === 'edges') ? '' : 'list-data'}
        >
          <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
            <List
              dataSource={check === 'nodes' ? this.handleNodes(nodes) : this.handleEdges(edges)}
              renderItem={item => (
                <List.Item>
                  <div className="line">
                    <div
                      className={check === 'nodes' ? 'type-node' : 'type-edge'}
                      style={{ background: item.color }}
                    ></div>
                    <div className="text">
                      <div className="name" title={item.alias || item.name}>
                        {item.alias || item.name}
                      </div>
                      <div className="number">{item.count}</div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </ConfigProvider>
        </div>
      </div>
    );
  }
}

export default Summary;

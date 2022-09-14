/**
 * 进出边拓展点
 */

import React, { Component } from 'react';
import { Tooltip, Checkbox, Empty } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import G6 from '@antv/g6';
import servicesExplore from '@/services/explore';
import intl from 'react-intl-universal';
import ScrollBar from '@/components/ScrollBar';
import SearchInput from '@/components/SearchInput';
import './style.less';
import IconFont from '@/components/IconFont';
import kong from '@/assets/images/noResult.svg';

const PAGESIZE = 100;

class InAndOut extends Component {
  state = {
    page: 1, // 当前页
    sourceData: [], // 每页数据
    searchValue: '', // 搜索的值
    openEdges: this.props.edges, // 需要展开的边
    loading: false,
    openNodes: this.props.nodes // 需要展开的点
  };

  componentDidMount() {
    this.initData({});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectEdge.class !== this.props.selectEdge.class) {
      this.initData({ page: 1 });
    }
  }

  /**
   * @description 按分页初始化数据
   */
  initData = ({ page = this.state.page }) => {
    const { selectGraph, selectEdge, selectedNode } = this.props;
    const { searchValue } = this.state;
    this.getEdgeData({
      id: selectGraph.kg_id,
      typeClass: selectEdge.class,
      io: selectEdge.type,
      rid: selectedNode.id,
      page,
      size: PAGESIZE,
      name: searchValue
    });

    this.setState({
      page
    });
  };

  /**
   * @description 获取右侧展开栏边的信息
   */
  getEdgeData = async ({ id, typeClass, io, rid, page, size, name }) => {
    this.setState({
      loading: true
    });
    try {
      const res = await servicesExplore.expandEdges({
        id,
        class: typeClass,
        io, // 双击展开，展开全部方向
        rid,
        page,
        size,
        name
      });

      if (res && res.res) {
        this.setState({
          sourceData: this.handlePageData(res.res)
        });
      }

      if (res && res.res === null) {
        this.setState({
          sourceData: []
        });
      }
      this.setState({
        loading: false
      });
    } catch (error) {
      this.setState({
        loading: false
      });
    }
  };

  /**
   * @description 处理每页数据
   */
  handlePageData = data => {
    const { selectedNode, selectEdge } = this.props;

    // 遇到无颜色的的问题
    const defaultColor = 'rgba(0,0,0,0)';
    data.forEach(item => {
      const { id, color, name, expand, analysis, alias, properties } = item;

      if (selectEdge.type === 'in') {
        item.out_e.forEach(outItem => {
          outItem.source = item.id;
          outItem.target = selectedNode.id;
          // outItem.start = {
          //   data: { id, color, name, expand, analysis, alias, properties, class: item.class },
          //   id: item.id,
          //   label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
          //   style: {
          //     fill: item.color || defaultColor,
          //     stroke: item.color ? 'white' : 'rgba(0,0,0,0.15)'
          //   }
          // };
          // outItem.end = selectedNode;
        });
      } else {
        item.in_e.forEach(inItem => {
          inItem.source = selectedNode.id;
          inItem.target = item.id;
          // inItem.start = selectedNode;
          // inItem.end = {
          //   data: { id, color, name, expand, analysis, alias, properties, class: item.class },
          //   id: item.id,
          //   label: item.name.length < 20 ? item.name : `${item.name.substring(0, 17)}...`,
          //   style: {
          //     fill: item.color || defaultColor,
          //     stroke: 'white'
          //   }
          // };
        });
      }
      item.data = { id, color, name, expand, analysis, alias, properties, class: item.class };
      item.label = item.name;
      item.style = {
        fill: item.color || defaultColor,
        stroke: 'white'
      };
      item.properties = '';
    });

    return data;
  };

  /**
   * @description checkbox的change事件
   * @param {object} e chebox默认事件
   * @param {string} value 选中元素的值
   */
  checkboxChange = (e, value) => {
    let { openEdges, openNodes } = this.state;

    const addEdge = this.addCurveOffset(openEdges, value);
    const addNode = [...openNodes, value];

    if (e.target.checked) {
      this.setState({
        openEdges: [...openEdges, addEdge],
        openNodes: addNode
      });

      return;
    }

    this.deleteCurveOffset(openEdges, value);

    const edge = value.in_e || value.out_e;
    openEdges = openEdges.filter(item => {
      return item.id !== edge[0].id;
    });

    openNodes = openNodes.filter(item => {
      return item.id !== value.id;
    });

    this.setState({
      openEdges,
      openNodes
    });
  };

  /**
   * @description 对于选择的边，是否添加偏移量
   */
  addCurveOffset = (openEdges, value) => {
    const edge = value.in_e || value.out_e;
    const addEdge = edge[0];

    if (addEdge.source === addEdge.target) {
      addEdge.type = 'loop';
      addEdge.loopCfg = { position: 'top', dist: 100 };
      addEdge.style = {
        endArrow: {
          fill: addEdge.color,
          path: G6.Arrow.triangle(10, 12, 0),
          d: 0
        }
      };

      return addEdge;
    }

    for (let i = 0; i < openEdges.length; i++) {
      if (openEdges[i].source === addEdge.target && openEdges[i].target === addEdge.source) {
        openEdges[i].type = 'quadratic';
        openEdges[i].curveOffset = 40;
        openEdges[i].curvePosition = 0.5;
        // 与该边箭头方向相反的边在数组中的位置，便于取消选择的时候定位元素
        openEdges[i].reverse = openEdges.length;

        addEdge.type = 'quadratic';
        addEdge.curveOffset = 40;
        addEdge.curvePosition = 0.5;
        addEdge.reverse = i;

        break;
      }
    }

    addEdge.style = {
      startArrow: {
        fill: addEdge.color,
        path: G6.Arrow.triangle(0, 0, 20),
        d: 20
      },
      endArrow: {
        fill: addEdge.color,
        path: G6.Arrow.triangle(10, 12, 25),
        d: 25
      }
    };

    return addEdge;
  };

  /**
   * @description 取消选择的边时，是否取消偏移量
   */
  deleteCurveOffset = (openEdges, value) => {
    const edge = value.in_e || value.out_e;
    const { id } = edge[0];

    for (let i = 0; i < openEdges.length; i++) {
      if (id === openEdges[i].id && openEdges[i].reverse !== undefined) {
        openEdges[openEdges[i].reverse].type = 'line';
        openEdges[openEdges[i].reverse].reverse = undefined;
        openEdges[openEdges[i].reverse].style = {
          startArrow: {
            fill: openEdges[openEdges[i].reverse].color,
            path: G6.Arrow.triangle(0, 0, 20),
            d: 20
          },
          endArrow: {
            fill: openEdges[openEdges[i].reverse].color,
            path: G6.Arrow.triangle(10, 12, 25),
            d: 25
          }
        };
      }
    }
  };

  /**
   * @description 设置初始选中状态
   */
  setChecked = node => {
    const { openEdges } = this.state;

    const edge = node.in_e || node.out_e;
    for (let i = 0; i < openEdges.length; i++) {
      if (edge[0].id === openEdges[i].id) {
        return true;
      }
    }

    return false;
  };

  /**
   * @description 展开节点
   */
  expandNode = () => {
    const { updateGraphData, closeOpen, G6GraphRef, setSelectedStyle } = this.props;
    const { openEdges, openNodes } = this.state;

    G6GraphRef.addNodes(openNodes, openEdges);

    updateGraphData({ nodes: openNodes, edges: openEdges }, setSelectedStyle);

    closeOpen();
  };

  /**
   * @description 改变分页
   */
  changePage = async type => {
    let { page } = this.state;
    const { selectEdge } = this.props;

    if (
      (type === 'pre' && page === 1) ||
      (page === Math.ceil(parseInt(selectEdge.count) / PAGESIZE) && type === 'next')
    ) {
      return;
    }

    if (type === 'pre') {
      page--;
    }

    if (type === 'next') {
      page++;
    }

    this.initData({ page });
  };

  /**
   * @description 全选
   */
  checkedAll = e => {
    const { sourceData } = this.state;
    let { openEdges, openNodes } = this.state;

    if (e.target.checked) {
      const openEdgeIds = openEdges.map(item => item.id);
      const openNodeIds = openNodes.map(item => item.id);
      sourceData.forEach(item => {
        const edge = item.in_e || item.out_e;

        if (!openEdgeIds.includes(edge[0].id)) {
          const addEdge = this.addCurveOffset(openEdges, item);

          openEdges = [...openEdges, addEdge];
        }

        if (!openNodeIds.includes(item.id)) {
          openNodes = [...openNodes, item];
        }
      });
    } else {
      const deleteEdgeIds = sourceData.map(item => {
        const edge = item.in_e || item.out_e;
        return edge[0].id;
      });

      const deleteNodeIds = sourceData.map(item => {
        return item.id;
      });

      let deleteData = [];

      openEdges.forEach(item => {
        if (deleteEdgeIds.includes(item.id)) {
          deleteData = [...deleteData, item];
        }
      });

      deleteData.forEach(item => {
        if (item.reverse) {
          openEdges[item.reverse].reverse = undefined;
          openEdges[item.reverse].type = 'line';
          openEdges[item.reverse].style = {
            startArrow: {
              fill: openEdges[item.reverse].color,
              path: G6.Arrow.triangle(0, 0, 20),
              d: 20
            },
            endArrow: {
              fill: openEdges[item.reverse].color,
              path: G6.Arrow.triangle(10, 12, 25),
              d: 25
            }
          };
        }
      });

      openEdges = openEdges.filter(item => {
        return !deleteEdgeIds.includes(item.id);
      });

      openNodes = openNodes.filter(item => {
        return !deleteNodeIds.includes(item.id);
      });
    }

    this.setState({
      openEdges,
      openNodes
    });
  };

  /**
   * @description 是否全选中
   */
  isSelectAll = () => {
    const { sourceData, openEdges } = this.state;

    if (openEdges.length === 0) {
      return false;
    }

    for (let i = 0; i < sourceData.length; i++) {
      const edge = sourceData[i].in_e || sourceData[i].out_e;
      for (let j = 0; j < openEdges.length; j++) {
        if (edge[0].id === openEdges[j].id) {
          break;
        }

        if (j === openEdges.length - 1) {
          return false;
        }
      }
    }

    return true;
  };

  /**
   * @description 清空所有已选项
   */
  deleteAllNode = () => {
    const { nodes, selectedNode, updateGraphData, addNodes, closeOpen } = this.props;
    let { edges } = this.props;

    edges = edges.filter(item => {
      return item.source !== selectedNode.id && item.target !== selectedNode.id;
    });

    addNodes(nodes, edges);

    updateGraphData({ nodes, edges });

    closeOpen();
  };

  // 搜索
  onSearch = e => {
    const { searchValue } = this.state;
    const { selectGraph, selectEdge, selectedNode } = this.props;
    const name = e?.target?.value || searchValue;

    this.getEdgeData({
      id: selectGraph.kg_id,
      typeClass: selectEdge.class,
      io: selectEdge.type,
      rid: selectedNode.id,
      page: 1,
      size: PAGESIZE,
      name
    });
  };

  /**
   * 同步搜索的值
   */
  searchChange = e => {
    const { value } = e.target;
    this.setState({
      searchValue: value
    });
  };

  render() {
    const { selectEdge, openInformation, inOrOut } = this.props;
    const { page, sourceData, loading } = this.state;

    return (
      <div id="inAndOut">
        <div className="title">
          <div>
            <span>
              <IconFont type="icon-shangfanye"></IconFont>
            </span>
            <span
              className="back"
              onClick={() => {
                openInformation(inOrOut);
              }}
            >
              {intl.get('global.back')}
            </span>
          </div>
          <div>
            {intl.get('searchGraph.total')}
            <span className="page-count">{page}</span>
            {intl.get('searchGraph.page')}，{intl.get('searchGraph.current')}
            <span className="page">{Math.ceil(parseInt(selectEdge.count) / PAGESIZE)}</span>
            {intl.get('searchGraph.page')}
          </div>
        </div>
        <div>
          <SearchInput
            placeholder={intl.get('searchGraph.searchplace')}
            onChange={this.searchChange}
            className="search-box"
            onPressEnter={e => this.onSearch(e)}
          />
        </div>
        {loading ? (
          <div className="in-out-loading-data">
            <LoadingOutlined className="icon" />
          </div>
        ) : (
          <div>
            {sourceData.length > 0 ? (
              <div className="check">
                <ScrollBar autoHeight autoHeightMax={330} color="rgb(184,184,184)">
                  <div className="check-all">
                    <Checkbox
                      checked={this.isSelectAll()}
                      onChange={e => {
                        this.checkedAll(e);
                      }}
                    ></Checkbox>
                    <div className="select-all">
                      <span>{intl.get('searchGraph.selectAll')}</span>
                    </div>
                    <div className="select-all-current">
                      <span>{intl.get('searchGraph.currentSelect')}</span>
                    </div>
                  </div>

                  {sourceData.map((item, index) => {
                    return (
                      <div className="box" key={index.toString()}>
                        <Checkbox
                          key={item.id}
                          checked={this.setChecked(item)}
                          onChange={e => {
                            this.checkboxChange(e, item);
                          }}
                        ></Checkbox>
                        <div className="check-box-content">
                          <span className="check-box-span-tooltip" title={item.data.name}>
                            {item.data.name}
                          </span>
                        </div>
                        <div className="check-box-relation">
                          <span
                            className="check-box-span-tooltip-relation"
                            title={selectEdge.type === 'in' ? item.out_e[0].name : item.in_e[0].name}
                          >
                            {selectEdge.type === 'in' ? item.out_e[0].name : item.in_e[0].name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </ScrollBar>
              </div>
            ) : (
              <div className="inOut-empty">
                <Empty style={{ marginTop: 100 }} description={`${intl.get('memberManage.searchNull')}`} image={kong} />
              </div>
            )}
          </div>
        )}
        <div className="bottom">
          <Tooltip placement="top" title={intl.get('searchGraph.cleanAll')}>
            <span className="delete" onClick={this.deleteAllNode}>
              {intl.get('searchGraph.delete')}
            </span>
          </Tooltip>
          <span
            className={page === 1 ? 'page-pre unclick-color' : 'page-pre'}
            onClick={() => {
              this.changePage('pre');
            }}
          >
            {intl.get('searchGraph.previous')}
          </span>
          <span
            className={
              page === Math.ceil(parseInt(selectEdge.count) / PAGESIZE) ? 'page-next unclick-color' : 'page-next'
            }
            onClick={() => {
              this.changePage('next');
            }}
          >
            {intl.get('searchGraph.next')}
          </span>
          <span className="search" onClick={this.expandNode}>
            {intl.get('searchGraph.sure')}
          </span>
        </div>
      </div>
    );
  }
}

export default InAndOut;

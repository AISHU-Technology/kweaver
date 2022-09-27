/**
 * 关系类别
 */
import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Collapse, Tooltip } from 'antd';
import { CaretRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';
import { formatModel } from '@/utils/handleFunction';

import './style.less';

const { Panel } = Collapse;

class Relation extends Component {
  state = {
    searchValue: '', // 搜索值
    manual: [], // 手动构造的关系
    automatic: [], // 自动构造的关系
    model: [], // 模型导入的关系
    activeKey: '1'
  };

  savedSearchValue = ''; // 点击搜索后才将值保存用于筛选实体

  componentDidUpdate(preProps) {
    if (preProps.edges !== this.props.edges && this.props.current === 4) {
      this.splitEntity();
    }
  }

  /**
   * @description 拆分实体类
   */
  splitEntity = () => {
    const { edges, selectedElement } = this.props;

    let manual = [];
    let automatic = [];
    let model = [];

    edges.forEach((item, index) => {
      if (item.model && item?.relations?.join(',').includes(this.savedSearchValue)) {
        model = [...model, item];
        return;
      }

      if (item.source_type === 'manual' && item?.relations?.join(',').includes(this.savedSearchValue)) {
        manual = [...manual, item];
        return;
      }

      if (item.source_type === 'automatic' && item?.relations?.join(',').includes(this.savedSearchValue)) {
        automatic = [...automatic, item];
      }
    });

    this.setState({
      manual,
      automatic,
      model
    });

    let selectInclude = false;

    // 若删除了选中的边
    if (selectedElement.name && typeof selectedElement.edge_id === 'number') {
      edges.forEach(item => {
        if (selectedElement?.relations?.join(',') === item?.relations?.join(',')) {
          this.props.setSelectedElement(item);
          selectInclude = true;
        }
        // return selectedElement?.relations?.join(',') === item?.relations?.join(',');
      });
    }

    this.getOpenPanel(manual, automatic, model, selectInclude);
  };

  /**
   * @description 默认打开第一个有数据的面板
   */
  getOpenPanel = (manual, automatic, model, selectInclude) => {
    if (manual.length > 0) {
      !selectInclude && this.props.setSelectedElement(manual[0]);
      this.setState({ activeKey: '1' });
    } else if (automatic.length > 0) {
      !selectInclude && this.props.setSelectedElement(automatic[0]);
      this.setState({ activeKey: '2' });
    } else if (model.length > 0) {
      !selectInclude && this.props.setSelectedElement(model[0]);
      this.setState({ activeKey: '3' });
    }
  };

  /**
   * @description 边类是否为空字段
   */
  isReEmptyField = value => {
    if (value.edgeInfo) {
      if (value.edgeInfo.entity_type.value) return false;
    }

    if (value.moreFile) {
      const temp = value.moreFile;
      if (temp.begin_class_prop.value || temp.end_class_prop.value) return false;
      if (temp.relation_begin_pro.value && temp.relation_begin_pro.value) return false;
    }

    return true;
  };

  /**
   * @description 改变折叠面板
   */
  changeCollapse = activeKey => {
    let key = [];
    if (activeKey.length > 0) key = activeKey.length > 1 ? activeKey[1] : activeKey[0];

    this.setState({ activeKey: key });
  };

  /**
   * @description 点样式
   */
  RelationStyle = item => {
    const { selectedElement } = this.props;

    if (item.Type) return 'line line-error';
    if (selectedElement && selectedElement?.relations?.join(',') === item?.relations?.join(',')) {
      return 'line line-selected';
    }

    return 'line';
  };

  getNodeObject = () => {
    const { nodes } = this.props;
    const result = {};

    if (nodes?.length) {
      nodes.forEach(item => {
        result[item.name] = item;
      });
    }

    return result;
  };

  render() {
    const { manual, automatic, model, activeKey } = this.state;

    const nodeObject = this.getNodeObject();

    return (
      <div className="new-relation-list">
        <Collapse
          bordered={false}
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
          activeKey={activeKey}
          onChange={this.changeCollapse}
        >
          <Panel
            header={`${[intl.get('workflow.knowledge.hanRelClass')]} (${manual.length})`}
            key="1"
            collapsible={manual.length === 0 && 'disabled'}
          >
            <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)">
              {manual.map((item, index) => {
                const startNode = nodeObject?.[item.relations[0]] || {};
                const endNode = nodeObject?.[item.relations[2]] || {};

                return (
                  <div
                    className={this.RelationStyle(item)}
                    key={index.toString()}
                    onClick={e => {
                      e.stopPropagation();
                      this.props.setSelectedElement(item);
                      this.props.saveInfo(item);
                    }}
                  >
                    <div className="icon">
                      <div className="start" style={{ background: startNode.colour }} />
                      <div className="end" style={{ background: endNode.colour }} />
                    </div>

                    <div className="name manual-name" title={item.alias}>
                      {item.alias}
                      <div className="sub-name">
                        <div className="sub1">{startNode?.alias || ''}</div>
                        <IconFont className="arrow" type="icon-fanye" />
                        <div className="sub2">{endNode?.alias || ''}</div>
                      </div>
                    </div>

                    {item.Type ? (
                      <div className="error-word">
                        <Tooltip placement="right" title={[intl.get('workflow.knowledge.WrongConfig')]}>
                          <ExclamationCircleOutlined />
                        </Tooltip>
                      </div>
                    ) : null}

                    {!this.isReEmptyField(item) && !item.Type ? (
                      <div className="tag">
                        <Tooltip placement="bottom" title={intl.get('workflow.knowledge.configured')}>
                          {/* <img className="icon-configured" src={Configured} alt="KWeaver" /> */}
                          <IconFont type="icon-duigou" className="icon-configured"></IconFont>
                        </Tooltip>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </ScrollBar>
          </Panel>

          <Panel
            header={`${[intl.get('workflow.knowledge.preRelClass')]} (${automatic.length})`}
            key="2"
            collapsible={automatic.length === 0 && 'disabled'}
          >
            <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)">
              {automatic.map((item, index) => {
                const startNode = nodeObject?.[item.relations[0]] || {};
                const endNode = nodeObject?.[item.relations[2]] || {};

                return (
                  <div
                    className={this.RelationStyle(item)}
                    key={index.toString()}
                    onClick={e => {
                      e.stopPropagation();
                      this.props.setSelectedElement(item);
                      this.props.saveInfo(item);
                    }}
                  >
                    <div className="icon">
                      <div className="start" style={{ background: startNode.colour }} />
                      <div className="end" style={{ background: endNode.colour }} />
                    </div>
                    <div className="name manual-name" title={item.alias}>
                      {item.alias}
                      <div className="sub-name">
                        <div className="sub1">{startNode?.alias || ''}</div>
                        <IconFont className="arrow" type="icon-fanye" />
                        <div className="sub2">{endNode?.alias || ''}</div>
                      </div>
                    </div>

                    {item.Type ? (
                      <div className="error-word">
                        <Tooltip placement="right" title={[intl.get('workflow.knowledge.WrongConfig')]}>
                          <ExclamationCircleOutlined />
                        </Tooltip>
                      </div>
                    ) : null}

                    {!this.isReEmptyField(item) && !item.Type ? (
                      <div className="tag">
                        <Tooltip placement="bottom" title={intl.get('workflow.knowledge.configured')}>
                          {/* <img className="icon-configured" src={Configured} alt="KWeaver" /> */}
                          <IconFont type="icon-duigou" className="icon-configured"></IconFont>
                        </Tooltip>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </ScrollBar>
          </Panel>

          <Panel
            header={`${[intl.get('workflow.knowledge.modelRelClass')]} (${model.length})`}
            key="3"
            collapsible={model.length === 0 && 'disabled'}
          >
            <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)">
              {model.map((item, index) => {
                const startNode = nodeObject?.[item.relations[0]] || {};
                const endNode = nodeObject?.[item.relations[2]] || {};

                return (
                  <div
                    className={this.RelationStyle(item)}
                    key={index.toString()}
                    onClick={e => {
                      e.stopPropagation();
                      this.props.setSelectedElement(item);
                      this.props.saveInfo(item);
                    }}
                  >
                    <div className="icon">
                      <div className="start" style={{ background: startNode.colour }} />
                      <div className="end" style={{ background: endNode.colour }} />
                    </div>

                    <div className="name manual-name" title={item.alias}>
                      {item.alias}
                      <div className="sub-name">
                        <div className="sub1">{startNode?.alias || ''}</div>
                        <IconFont className="arrow" type="icon-fanye" />
                        <div className="sub2">{endNode?.alias || ''}</div>
                      </div>
                    </div>

                    <div className="model">{formatModel(item.model)}</div>

                    {item.Type ? (
                      <div className="model-error-word">
                        <Tooltip placement="right" title={[intl.get('workflow.knowledge.WrongConfig')]}>
                          <ExclamationCircleOutlined />
                        </Tooltip>
                      </div>
                    ) : null}

                    {!this.isReEmptyField(item) && !item.Type ? (
                      <div className="model-tag">
                        <Tooltip placement="bottom" title={intl.get('workflow.knowledge.configured')}>
                          {/* <img className="icon-configured" src={Configured} alt="KWeaver" /> */}
                          <IconFont type="icon-duigou" className="icon-configured"></IconFont>
                        </Tooltip>
                      </div>
                    ) : null}

                    {this.isReEmptyField(item) ? (
                      <div className="model-tag">
                        <div className="icon-configured"></div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </ScrollBar>
          </Panel>
        </Collapse>
      </div>
    );
  }
}

export default Relation;

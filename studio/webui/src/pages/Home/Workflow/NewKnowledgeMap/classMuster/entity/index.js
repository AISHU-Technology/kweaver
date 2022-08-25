/**
 * 实体类别
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

class Entity extends Component {
  state = {
    searchValue: '', // 搜索值
    manual: [], // 手动构造的实体
    automatic: [], // 自动构造的实体
    model: [], // 模型导入的实体
    activeKey: '1'
  };

  savedSearchValue = ''; // 点击搜索后才将值保存用于筛选实体

  componentDidUpdate(preProps) {
    if (preProps.nodes !== this.props.nodes && this.props.current === 4) {
      setTimeout(() => {
        this.splitEntity();
      }, 500);
    }
    if (preProps.selectedElement !== this.props.selectedElement) {
      this.setActiveKey();
    }
  }

  /**
   * @description 拆分实体类
   */
  splitEntity = () => {
    const { nodes, selectedElement } = this.props;
    let manual = [];
    let automatic = [];
    let model = [];

    nodes.forEach(item => {
      if (item.model && item.name.includes(this.savedSearchValue)) {
        model = [...model, item];
        return;
      }

      if (item.source_type === 'manual' && item.name.includes(this.savedSearchValue)) {
        manual = [...manual, item];
        return;
      }

      if (item.source_type === 'automatic' && item.name.includes(this.savedSearchValue)) {
        automatic = [...automatic, item];
      }
    });

    this.setState({ manual, automatic, model });
    let selectInclude = true;

    // 若删除了选中的点
    if (typeof selectedElement.entity_id === 'number') {
      selectInclude = nodes.some(item => {
        return selectedElement.name === item.name;
      });
    }

    // 如果初始进入没有选中任何点或者选的点被删除
    if (!selectedElement || !selectInclude) {
      this.getOpenPanel(manual, automatic, model);
    }
  };

  /**
   * @description 默认打开第一个有数据的面板
   */
  getOpenPanel = (manual, automatic, model) => {
    if (manual.length > 0) {
      this.props.setSelectedElement(manual[0]);
      this.setState({ activeKey: '1' });
    } else if (automatic.length > 0) {
      this.props.setSelectedElement(automatic[0]);
      this.setState({ activeKey: '2' });
    } else if (model.length > 0) {
      this.props.setSelectedElement(model[0]);
      this.setState({ activeKey: '3' });
    }
  };

  /**
   * @description 改变activeKey的默认值
   */
  setActiveKey = () => {
    const { manual, automatic, model } = this.state;
    const { selectedElement } = this.props;

    manual.forEach(item => {
      if (item.name === selectedElement.name) this.setState({ activeKey: 1 });
    });
    automatic.forEach(item => {
      if (item.name === selectedElement.name) this.setState({ activeKey: 2 });
    });
    model.forEach(item => {
      if (item.name === selectedElement.name) this.setState({ activeKey: 3 });
    });
  };

  /**
   * @description 点类是否为空字段
   */
  isEmptyField = value => {
    if (value.nodeInfo) {
      if (value.nodeInfo.entity_type.value) return false;

      const temp = value.nodeInfo.property_map;
      for (let i = 0; i < temp.length; i++) {
        if (temp[i].entity_prop.value) return false;
      }
    }

    return true;
  };

  /**
   * @description 点样式
   */
  nodeStyle = item => {
    const { selectedElement } = this.props;

    if (item.Type) return 'line line-error';
    if (selectedElement && selectedElement.name === item.name) return 'line line-selected';

    return 'line';
  };

  /**
   * @description 改变折叠面板
   */
  changeCollapse = activeKey => {
    let key = [];

    if (activeKey.length > 0) {
      key = activeKey.length > 1 ? activeKey[1] : activeKey[0];
    }

    this.setState({ activeKey: key });
  };

  render() {
    const { manual, automatic, model, activeKey } = this.state;
    const { selectedElement } = this.props;

    return (
      <div className="new-entity-list">
        <ScrollBar autoHeight autoHeightMax={750} isshowx="false" color="rgb(184,184,184)">
          <Collapse
            bordered={false}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            activeKey={activeKey}
            onChange={this.changeCollapse}
          >
            <Panel
              header={`${[intl.get('workflow.knowledge.handEntityClass')]}(${manual.length})`}
              key="1"
              collapsible={manual.length === 0 && 'disabled'}
            >
              <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)" id="scroll">
                {manual.map((item, index) => {
                  return (
                    <div
                      className={this.nodeStyle(item)}
                      key={index.toString()}
                      onClick={() => {
                        this.props.setSelectedElement(item);
                      }}
                    >
                      <div className="icon" style={{ background: item.colour }}></div>

                      <div className="name manual-name" title={item.alias}>
                        {item.alias}
                      </div>

                      {item.Type ? (
                        <div className="error-word">
                          <Tooltip placement="right" title={[intl.get('workflow.knowledge.WrongConfig')]}>
                            <ExclamationCircleOutlined />
                          </Tooltip>
                        </div>
                      ) : null}

                      {!this.isEmptyField(item) && !item.Type ? (
                        <div className="tag">
                          <Tooltip placement="bottom" title={intl.get('workflow.knowledge.configured')}>
                            {/* <img className="icon-configured" src={Configured} alt="AnyData" /> */}
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
              header={`${[intl.get('workflow.knowledge.preEntityClass')]} (${automatic.length})`}
              key="2"
              collapsible={automatic.length === 0 && 'disabled'}
            >
              <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)">
                {automatic.map((item, index) => {
                  return (
                    <div
                      className={this.nodeStyle(item)}
                      key={index.toString()}
                      onClick={() => {
                        this.props.setSelectedElement(item);
                      }}
                    >
                      <div className="icon" style={{ background: item.colour }}></div>

                      <div className="name automatic-name" title={item.alias}>
                        {item.alias}
                      </div>

                      {item.Type ? (
                        <div className="error-word">
                          <Tooltip placement="right" title={[intl.get('workflow.knowledge.WrongConfig')]}>
                            <ExclamationCircleOutlined />
                          </Tooltip>
                        </div>
                      ) : null}

                      {!this.isEmptyField(item) && !item.Type ? (
                        <div className="tag">
                          <Tooltip placement="bottom" title={intl.get('workflow.knowledge.configured')}>
                            {/* <img className="icon-configured" src={Configured} alt="AnyData" /> */}
                            <IconFont type="icon-duigou" className="icon-configured"></IconFont>
                          </Tooltip>
                        </div>
                      ) : null}

                      {this.isEmptyField(item) ? <div className="tag"></div> : null}
                    </div>
                  );
                })}
              </ScrollBar>
            </Panel>

            <Panel
              header={`${[intl.get('workflow.knowledge.modelEntityClass')]} (${model.length})`}
              key="3"
              collapsible={model.length === 0 && 'disabled'}
            >
              <ScrollBar autoHeight autoHeightMax={450} isshowx="false" color="rgb(184,184,184)">
                {model.map((item, index) => {
                  return (
                    <div
                      className={this.nodeStyle(item)}
                      key={index.toString()}
                      onClick={() => {
                        this.props.setSelectedElement(item);
                      }}
                    >
                      <div className="icon" style={{ background: item.colour }}></div>

                      <div className="name model-name" title={item.alias}>
                        {item.alias}
                      </div>

                      <div className="model">{formatModel(item.model)}</div>

                      {item.Type ? (
                        <div className="model-error-word">
                          <Tooltip placement="right" title={[intl.get('workflow.knowledge.WrongConfig')]}>
                            <ExclamationCircleOutlined />
                          </Tooltip>
                        </div>
                      ) : null}

                      {!this.isEmptyField(item) && !item.Type ? (
                        <div className="model-tag">
                          <Tooltip placement="bottom" title={intl.get('workflow.knowledge.configured')}>
                            {/* <img className="icon-configured" src={Configured} alt="AnyData" /> */}
                            <IconFont type="icon-duigou" className="icon-configured"></IconFont>
                          </Tooltip>
                        </div>
                      ) : null}

                      {this.isEmptyField(item) ? (
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
        </ScrollBar>
      </div>
    );
  }
}

export default Entity;

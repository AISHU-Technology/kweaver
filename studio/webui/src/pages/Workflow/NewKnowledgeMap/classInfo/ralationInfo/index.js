/* eslint-disable max-lines */
/**
 * 关系类别配置信息
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Input, Select, ConfigProvider, Empty, Modal, Button } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';

import ScrollBar from '@/components/ScrollBar';

import Associate from './associated';
import MoreFileRelation from './MoreFileRelation';

import kong from '@/assets/images/empty.svg';
import './style.less';

const { Option } = Select;

class RalationInfo extends Component {
  state = {
    modalVisible: false,
    startNode: '',
    endNode: '',
    entityName: { Type: 0, value: '' },
    keyProp: [], // 实体标识字段下拉框
    keyPropValue: { Type: 0, value: '' },
    attrSelect: [], // 属性字段下拉框
    attrValue: [], // 属性的值
    newMoreFileData: {
      begin_class_prop: { Type: 0, value: '' }, // 起始点实体类属性值
      equation_begin: '', // 四个框时第一个等于
      relation_begin_pro: { Type: 0, value: '' }, // 抽取关系属性一
      equation: '', // 两个框时点等于
      relation_end_pro: { Type: 0, value: '' }, // 抽取关系属性二
      equation_end: '', // 四个框时第二个等于
      end_class_prop: { Type: 0, value: '' } // 终点实体类属性值
    }
  };

  componentDidMount() {
    this.getNodeInfo();
    this.initInfo();
  }

  componentDidUpdate(preProps) {
    // if (this.props.selectedElement !== preProps.selectedElement) {
    //   this.getNodeInfo();
    //   this.initInfo();
    // }

    if (this.props.selectedElement !== preProps.selectedElement) {
      this.getNodeInfo();

      this.initInfo();

      return;
    }
    if (this.props.current !== preProps.current && this.props.current === 4) {
      this.getNodeInfo();

      setTimeout(() => {
        this.initInfo();
      }, 100);
    }
  }

  /**
   * @description 准备数据
   */
  planData = () => {
    const { entityName, attrValue, attrSelect } = this.state;
    const { selectedElement } = this.props;
    if (!selectedElement) return {};

    const data = { otl_name: selectedElement.name, entity_type: entityName, property_map: attrValue, attrSelect };
    return data;
  };

  /**
   * @description 初始化信息
   */
  initInfo = () => {
    const { selectedElement } = this.props;
    if (!selectedElement) return;

    let attrValue = [];
    if (selectedElement && selectedElement.edgeInfo) {
      for (let i = 0; i < selectedElement.edgeInfo.property_map.length; i++) {
        attrValue = [
          ...attrValue,
          {
            edge_prop: selectedElement.edgeInfo.property_map[i].edge_prop,
            entity_prop: selectedElement.edgeInfo.property_map[i].entity_prop
          }
        ];
      }

      this.setState(
        {
          attrValue,
          attrSelect: selectedElement.edgeInfo.attrSelect,
          entityName: {
            Type: selectedElement.edgeInfo.entity_type.Type,
            value: selectedElement.edgeInfo.entity_type.value
          } // 实体类名
        },
        () => {
          this.initProData(); // 新加
        }
      );
    } else {
      for (let i = 0; i < selectedElement.properties.length; i++) {
        attrValue = [
          ...attrValue,
          {
            edge_prop: selectedElement.properties[i][0],
            entity_prop: { Type: 0, value: '' }
          }
        ];
      }

      this.setState({
        attrValue,
        attrSelect: [],
        entityName: { Type: 0, value: '' } // 实体类名
      });
    }
    if (selectedElement && selectedElement.moreFile) {
      this.setState({ newMoreFileData: selectedElement.moreFile });
    } else {
      this.setState({
        newMoreFileData: {
          begin_class_prop: { Type: 0, value: '' }, // 起始点实体类属性值
          equation_begin: '', // 四个框时第一个等于
          relation_begin_pro: { Type: 0, value: '' }, // 抽取关系属性一
          equation: '', // 两个框时点等于
          relation_end_pro: { Type: 0, value: '' }, // 抽取关系属性二
          equation_end: '', // 四个框时第二个等于
          end_class_prop: { Type: 0, value: '' } // 终点实体类属性值
        }
      });
    }
  };

  /**
   * 属性映射默认值 新加
   */
  initProData = () => {
    const { selectedElement } = this.props;
    const { attrValue, attrSelect } = this.state;
    const newAttrValue = [...attrValue];

    selectedElement.properties.forEach((item, index) => {
      if (!attrValue[index].entity_prop.value) {
        if (attrSelect && attrSelect.includes(item[0])) {
          newAttrValue[index].entity_prop.value = item[0];
        }
      }
    });

    this.setState({ attrValue: newAttrValue });
  };

  /**
   * @description 选择抽取对象实体类名
   */
  selectEntity = (value, option) => {
    const { attrValue, newMoreFileData } = this.state;

    newMoreFileData.relation_begin_pro = { Type: 0, value: '' };
    newMoreFileData.relation_end_pro = { Type: 0, value: '' };
    newMoreFileData.begin_class_prop = { Type: 0, value: '' };
    newMoreFileData.end_class_prop = { Type: 0, value: '' };
    newMoreFileData.equation_end = '';
    newMoreFileData.equation_begin = '';
    newMoreFileData.equation = '';

    for (let i = 0; i < attrValue.length; i++) {
      attrValue[i].entity_prop = { Type: 0, value: '' };
    }

    if (option) {
      this.setState({
        entityName: { value, Type: 0 },
        attrSelect: option.data.entity_prop,
        attrValue,
        newMoreFileData
      });
    } else {
      this.setState({
        entityName: { value: '', Type: 0 },
        attrSelect: [],
        attrValue,
        newMoreFileData
      });
    }

    setTimeout(() => {
      this.props.changeEdgeInfo(this.planData());
      this.props.changeMoreFile(newMoreFileData);
      this.changeEdgeError();
      this.initProData();
    }, 0);
  };

  /**
   * @description 选择抽取对象属性
   */
  selectAttr = (value, index) => {
    const { attrValue } = this.state;
    attrValue[index].entity_prop = { value, Type: 0 };

    if (value) {
      attrValue[index].entity_prop = { value, Type: 0 };
    } else {
      attrValue[index].entity_prop = { value: '', Type: 0 };
    }

    this.setState({ attrValue });

    setTimeout(() => {
      this.props.changeEdgeInfo(this.planData());
      this.changeEdgeError();
    }, 0);
  };

  /**
   * @description 获取边相关的点的信息
   */
  getNodeInfo = () => {
    const { nodes, selectedElement } = this.props;
    let startNode = '';
    let endNode = '';

    if (!nodes || !selectedElement) return;
    for (let i = 0; i < nodes.length; i++) {
      if (selectedElement.relations[0] === nodes[i].name) startNode = nodes[i];
      if (selectedElement.relations[2] === nodes[i].name) endNode = nodes[i];
    }

    this.setState({ startNode, endNode });
  };

  /**
   * @description 关系tip
   */
  relationTitle = () => {
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{[intl.get('workflow.knowledge.inConect')]}</div>
        <div style={{ fontSize: 13 }}>{[intl.get('workflow.knowledge.inDes')]}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>{[intl.get('workflow.knowledge.OutConect')]}</div>
        <div style={{ fontSize: 13, marginBottom: 10 }}>{[intl.get('workflow.knowledge.OutDes')]}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{[intl.get('workflow.knowledge.indepenConect')]}</div>
        <div style={{ fontSize: 13 }}>{[intl.get('workflow.knowledge.indepenDes')]}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>
          {[intl.get('workflow.knowledge.Containment')]}
        </div>
        <div style={{ fontSize: 13, marginBottom: 10 }}>{[intl.get('workflow.knowledge.ContainmentDes')]}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{[intl.get('workflow.knowledge.DSR')]}</div>
        <div style={{ fontSize: 13 }}>{[intl.get('workflow.knowledge.DSRDes')]}</div>
      </div>
    );
  };

  /**
   * @description 改变多文件关系
   */
  changeMoreFileData = moreFileData => {
    this.setState({ newMoreFileData: moreFileData });
    this.props.changeMoreFile(moreFileData);
  };

  /**
   * @description 改变边的错误状态
   */
  changeEdgeError = () => {
    const { selectedElement } = this.props;

    if (!selectedElement.Type) return this.props.changeEdgeType();
    const { entityName, attrValue, newMoreFileData } = this.state;

    if (entityName && entityName.Type) return;
    for (let i = 0; i < attrValue.length; i++) {
      if (attrValue?.[i]?.entity_prop?.Type) return;
    }
    if (newMoreFileData?.begin_class_prop?.Type) return;
    if (newMoreFileData?.end_class_prop?.Type) return;
    if (newMoreFileData.relation_begin_pro.Type || newMoreFileData.relation_end_pro.Type) return;

    this.props.changeEdgeType();
  };

  /**
   * @description 清空属性
   */
  clear = () => {
    const { attrValue } = this.state;

    for (let i = 0; i < attrValue.length; i++) {
      attrValue[i].entity_prop = { value: '', Type: 0 };
    }

    this.setState({ attrValue, modalVisible: false });
    setTimeout(() => {
      this.props.changeEdgeInfo(this.planData());
      this.changeEdgeError();
    }, 0);
  };

  /**
   * @description 清空按钮是否可点击
   */
  clearIsDisable = () => {
    const { attrValue } = this.state;

    for (let i = 0; i < attrValue.length; i++) {
      if (attrValue[i].entity_prop.value) return true;
    }

    return false;
  };

  /**
   * @description 自定义属性空白页
   */
  attrCustomizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty
        image={kong}
        description={
          <div>
            <div style={{ fontWeight: 400, color: 'rgba(0, 0, 0, 0.85)' }}>
              {[intl.get('workflow.knowledge.noData')]}
            </div>
            <div>{[intl.get('workflow.knowledge.ConfigFirst')]}</div>
          </div>
        }
      />
    </div>
  );

  render() {
    const { selectedElement, nodes, mapEntity } = this.props;
    const { startNode, endNode, entityName, attrSelect, attrValue, modalVisible, newMoreFileData } = this.state;

    const { Type } = selectedElement.edgeInfo ? selectedElement.edgeInfo.entity_type : {}; // 解决校验渲染问题
    const attrValue1 = selectedElement.edgeInfo ? selectedElement.edgeInfo.property_map : attrValue; // 解决校验渲染问题

    return (
      <div className="raltion-info">
        <div className="title">
          <div className="word">{[intl.get('workflow.knowledge.relMap')]}</div>
        </div>
        <ScrollBar autoHeight autoHeightMax={735} isshowx="false" color="rgb(184,184,184)">
          <div className="scrollbar-box">
            <div className="top">
              <Associate
                nodes={nodes}
                startNode={startNode}
                endNode={endNode}
                selectedElement={selectedElement}
                setSelectedElement={this.props.setSelectedElement}
                showButton={this.props.showButton}
                changeTab={this.props.changeTab}
              />
            </div>

            <div className="entity-select">
              {/* 本体 */}
              <div className="unique">
                <div>
                  <span>{[intl.get('workflow.knowledge.edgesClass')]}</span>
                </div>
                <div>
                  <Input className="select" value={selectedElement.alias} disabled></Input>
                </div>
              </div>
              {/* 抽取 */}
              <div className="entity-name">
                <div>
                  <span>{[intl.get('workflow.knowledge.relExObject')]}</span>
                </div>
                <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                  <Select
                    className={Type ? 'select has-errors' : 'select'}
                    placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                    showSearch
                    allowClear
                    virtual={false}
                    key={selectedElement ? `${selectedElement.name}1` : null}
                    filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    value={entityName.value || selectedElement?.edgeInfo?.entity_type?.value || undefined}
                    title={entityName.value || undefined}
                    onChange={(value, option) => {
                      this.selectEntity(value, option);
                    }}
                  >
                    {mapEntity &&
                      mapEntity.length > 0 &&
                      mapEntity.map((item, index) => {
                        return (
                          <Option key={item.entity_type} data={item} title={item.entity_type}>
                            {item.entity_type}
                          </Option>
                        );
                      })}
                  </Select>
                </ConfigProvider>
              </div>
            </div>

            <div className="attribute-title">
              <span>{[intl.get('workflow.knowledge.attrMap')]}</span>

              <span
                className={this.clearIsDisable() ? 'clear' : 'disable-click'}
                onClick={() => {
                  if (this.clearIsDisable()) this.setState({ modalVisible: true });
                }}
              >
                {[intl.get('workflow.knowledge.empty')]}
              </span>
            </div>

            <Modal
              className="delete-create-info-45679"
              visible={modalVisible}
              bodyStyle={{ height: 92 }}
              footer={[
                <ConfigProvider key="clearEdgeInfo" autoInsertSpaceInButton={false}>
                  <Button
                    className="ant-btn-default add-modal-cancel"
                    key="cancel"
                    onClick={() => {
                      this.setState({ modalVisible: false });
                    }}
                  >
                    {[intl.get('createEntity.cancel')]}
                  </Button>
                  <Button className="add-modal-save" type="primary" key="ok" onClick={this.clear}>
                    {[intl.get('createEntity.ok')]}
                  </Button>
                </ConfigProvider>
              ]}
              closable={false}
            >
              <div className="title-content">
                <InfoCircleFilled className="icon" />
                <span className="title-word">{[intl.get('workflow.knowledge.emptyOper')]}</span>
              </div>
              <div className="content-word">{[intl.get('workflow.knowledge.emptyInfo')]}</div>
            </Modal>

            <div className="node-content">
              <div className="select-title">
                <div className="line-left">{[intl.get('workflow.knowledge.EdgeAttr')]}</div>
                <div className="line">{[intl.get('workflow.knowledge.attrRelObject')]}</div>
              </div>

              <div className="attr">
                {selectedElement &&
                  selectedElement.properties &&
                  selectedElement.properties.length > 0 &&
                  selectedElement.properties.map((item, index) => {
                    return (
                      <div className="value" key={index.toString()}>
                        <div className="box">
                          <Input value={item[0]} disabled={true} />
                        </div>

                        <div className=" other">
                          <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                            <Select
                              className={
                                attrValue1[index] && attrValue1[index].entity_prop && attrValue1[index].entity_prop.Type
                                  ? 'select has-errors'
                                  : 'select'
                              }
                              placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                              dropdownStyle={{ maxHeight: 170 }}
                              listHeight={165}
                              getPopupContainer={triggerNode => triggerNode.parentElement}
                              showSearch
                              allowClear
                              filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                              value={
                                (attrValue1[index] &&
                                  attrValue1[index].entity_prop &&
                                  attrValue1[index].entity_prop.value) ||
                                undefined
                              }
                              title={
                                (attrValue[index] &&
                                  attrValue[index].entity_prop &&
                                  attrValue[index].entity_prop.value) ||
                                undefined
                              }
                              onChange={value => {
                                this.selectAttr(value, index);
                              }}
                            >
                              {attrSelect &&
                                attrSelect.length > 0 &&
                                attrSelect.map(item => {
                                  return (
                                    <Option key={item} title={item}>
                                      {item}
                                    </Option>
                                  );
                                })}
                            </Select>
                          </ConfigProvider>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            {selectedElement?.source_type !== 'automatic' ? (
              <MoreFileRelation
                edgeData={selectedElement}
                startNode={startNode}
                endNode={endNode}
                moreFileData={newMoreFileData}
                attrSelect={attrSelect}
                entityName={entityName}
                changeMoreFileData={this.changeMoreFileData}
                changeEdgeError={this.changeEdgeError}
              />
            ) : (
              <div className="test-line">
                <div className="div1"></div>
              </div>
            )}
          </div>
        </ScrollBar>
      </div>
    );
  }
}

export default RalationInfo;

/**
 * 实体类别配置信息
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Input, Select, Empty, ConfigProvider, Modal, Button } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';

import ScrollBar from '@/components/ScrollBar';

import kong from '@/assets/images/empty.svg';
import './style.less';

const { Option } = Select;

class NodeInfo extends Component {
  state = {
    entityName: { value: '', Type: 0 }, // 抽取实体类名
    attrSelect: [], // 属性字段下拉框
    attrValue: [], // 属性的值
    modalVisible: false // 清除弹窗
  };

  componentDidMount() {
    this.initInfo();
  }

  componentDidUpdate(preProps) {
    if (this.props.selectedElement !== preProps.selectedElement) {
      this.initInfo();
    }
  }

  /**
   * @description 初始化信息
   */
  initInfo = async () => {
    const { selectedElement } = this.props;

    if (!selectedElement) return;
    if (selectedElement && selectedElement.nodeInfo) {
      this.setState(
        {
          entityName: selectedElement.nodeInfo.entity_type, // 实体类名
          attrSelect: selectedElement.nodeInfo.attrSelect, // 属性字段下拉框
          attrValue: selectedElement.nodeInfo.property_map // 属性的值
        },
        () => {
          this.initProData();
        }
      );

      return;
    }

    let attrValue = [];

    for (let i = 0; i < selectedElement.properties.length; i++) {
      attrValue = [
        ...attrValue,
        {
          otl_prop: selectedElement.properties[i][0],
          entity_prop: { value: '', Type: 0 }
        }
      ];
    }

    this.setState({
      attrValue,
      entityName: { value: '', Type: 0 }, // 实体类名
      attrSelect: [] // 属性字段下拉框
    });
  };

  /**
   * @description 选择实体类名
   */
  selectEntity = (value, option) => {
    const { attrValue } = this.state;

    for (let i = 0; i < attrValue.length; i++) {
      attrValue[i].entity_prop = { Type: 0, value: '' };
    }

    if (option) {
      this.setState(
        {
          entityName: { value, Type: 0 },
          attrSelect: option.data.entity_prop,
          attrValue
        },
        () => {
          this.props.changeNodeInfo(this.planData());
          this.changeNodeError();
          this.initProData();
        }
      );

      return;
    }

    this.setState(
      {
        entityName: { value: '', Type: 0 },
        attrSelect: [],
        attrValue
      },
      () => {
        this.props.changeNodeInfo(this.planData());
        this.changeNodeError();
      }
    );
  };

  /**
   * @description 选择属性
   */
  selectAttr = (value, index) => {
    const { attrValue } = this.state;

    if (value) {
      attrValue[index].entity_prop = { value, Type: 0 };
    } else {
      attrValue[index].entity_prop = { value: '', Type: 0 };
    }

    this.setState({ attrValue }, () => {
      this.props.changeNodeInfo(this.planData());
      this.changeNodeError();
    });
  };

  /**
   * @description 清空属性
   */
  clear = () => {
    const { attrValue } = this.state;

    for (let i = 0; i < attrValue.length; i++) {
      attrValue[i].entity_prop = { value: '', Type: 0 };
    }

    this.setState(
      {
        attrValue,
        modalVisible: false
      },
      () => {
        this.props.changeNodeInfo(this.planData());
        this.changeNodeError();
      }
    );
  };

  /**
   * @description 清空按钮是否可点击
   */
  clearIsDisable = () => {
    const { attrValue } = this.state;

    for (let i = 0; i < attrValue.length; i++) {
      if (attrValue[i].entity_prop.value) {
        return true;
      }
    }

    return false;
  };

  /**
   * @description 准备数据
   */
  planData = () => {
    const { entityName, attrValue, attrSelect } = this.state;
    const { selectedElement } = this.props;

    const data = {
      otl_name: selectedElement.name,
      entity_type: entityName,
      property_map: attrValue,
      attrSelect
    };

    return data;
  };

  /**
   * @description 改变点的错误状态
   */
  changeNodeError = () => {
    const { selectedElement } = this.props;

    if (!selectedElement.Type) {
      this.props.changeNodeType();
      return;
    }

    const { entityName, attrValue } = this.state;

    if (entityName && entityName.Type) return;
    for (let i = 0; i < attrValue.length; i++) {
      if (attrValue[i] && attrValue[i].entity_prop && attrValue[i].entity_prop.Type) {
        return;
      }
    }

    this.props.changeNodeType();
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
            <div>{[intl.get('workflow.knowledge.noData')]}</div>
          </div>
        }
      />
    </div>
  );

  /**
   * 属性映射默认值
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

    this.setState({
      attrValue: newAttrValue
    });
  };

  render() {
    const { selectedElement, mapEntity } = this.props;
    const { entityName, modalVisible, attrSelect, attrValue } = this.state;
    const { Type, value } = selectedElement.nodeInfo ? selectedElement.nodeInfo.entity_type : {};
    const attrValue1 = selectedElement.nodeInfo ? selectedElement.nodeInfo.property_map : attrValue;

    return (
      <div className="node-info">
        <div className="title">{[intl.get('workflow.knowledge.entityMap')]}</div>
        <ScrollBar autoHeight autoHeightMax={730} isshowx="false" color="rgb(184,184,184)">
          <div className="scrollbar-box">
            <div className="etntiy-select">
              {/* 本体类 */}
              <div className="unique">
                <div>
                  <span>{[intl.get('workflow.knowledge.entityClass')]}</span>
                </div>
                <div>
                  <Input className="select" value={selectedElement.alias} disabled></Input>
                </div>
              </div>
              {/* 抽取实体类 */}
              <div className="entity-name">
                <div>
                  <span>{[intl.get('workflow.knowledge.exObject')]}</span>
                </div>

                <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                  <Select
                    className={Type ? 'select has-errors' : 'select'}
                    dropdownStyle={{ maxHeight: 170 }}
                    listHeight={165}
                    placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
                    getPopupContainer={triggerNode => triggerNode.parentElement}
                    showSearch
                    allowClear
                    virtual={false}
                    key={`${selectedElement.name}1`}
                    filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    value={
                      (entityName && entityName.value) ||
                      (selectedElement.nodeInfo && selectedElement.nodeInfo.entity_type.value) ||
                      undefined
                    }
                    title={(entityName && entityName.value) || undefined}
                    onChange={(value, option) => {
                      this.selectEntity(value, option);
                    }}
                  >
                    {mapEntity &&
                      mapEntity.length > 0 &&
                      mapEntity.map(item => {
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

            <div className="property-map">
              <span className="des">{[intl.get('workflow.knowledge.attrMap')]}</span>
              <span
                className={this.clearIsDisable() ? 'clear' : 'disable-click'}
                onClick={() => {
                  if (this.clearIsDisable()) {
                    this.setState({ modalVisible: true });
                  }
                }}
              >
                {[intl.get('workflow.knowledge.empty')]}
              </span>
            </div>

            <div className="node-content">
              <div className="select-title">
                <div className="line-left">{[intl.get('workflow.knowledge.entityAttr')]}</div>
                <div className="line">{[intl.get('workflow.knowledge.attrexObject')]}</div>
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

                        <div className="box other">
                          <ConfigProvider renderEmpty={this.attrCustomizeRenderEmpty}>
                            <Select
                              className={
                                attrValue1[index] && attrValue1[index].entity_prop && attrValue1[index].entity_prop.Type
                                  ? 'select has-errors'
                                  : 'select'
                              }
                              dropdownStyle={{ maxHeight: 170 }}
                              listHeight={165}
                              placeholder={[intl.get('workflow.knowledge.selectPlaceholder')]}
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
                                (attrValue1[index] &&
                                  attrValue1[index].entity_prop &&
                                  attrValue1[index].entity_prop.value) ||
                                undefined
                              }
                              onChange={value => {
                                this.selectAttr(value, index);
                              }}
                            >
                              {attrSelect &&
                                attrSelect.length > 0 &&
                                attrSelect.map((item, attrIndex) => {
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

            <Modal
              className="delete-create-info-45679"
              visible={modalVisible}
              bodyStyle={{ height: 92 }}
              footer={[
                <ConfigProvider key="clearNodeInfo" autoInsertSpaceInButton={false}>
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
          </div>
        </ScrollBar>
      </div>
    );
  }
}

export default NodeInfo;

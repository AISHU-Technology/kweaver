/* eslint-disable max-lines */
import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { SketchPicker } from 'react-color';
import { Form, Alert, Collapse, Input, Tooltip, Switch, message, Modal, ConfigProvider, Button } from 'antd';
import { RightOutlined, DisconnectOutlined, QuestionCircleOutlined } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';
import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { tipModalFunc } from '@/components/TipModal';
import { wrapperTitle } from '@/utils/handleFunction';

import EdgesModal from '../Header/EdgesModal';
import Property from './Property';
import GroupSelector from '../GroupSelector';
import { handleProperty } from './assistFunction';

import dianIcon from '@/assets/images/dian.svg';
import DataSheet from '@/assets/images/DataSheet.svg';

import './style.less';

const { Panel } = Collapse;
const PAGESIZE = 10;

class NodeInfo extends Component {
  state = {
    displayColorPicker: false, // 颜色盘显示
    color: {
      hex: '#54639C'
    }, // 颜色选择
    property: [], // 属性与索引
    page: 1, // 分页
    checkData: {
      currentIndex: 0, // 正在检测的输入框在当前分页的下标
      isIncorrect: false, // 输入内容是否正确
      content: '' // 错误提示
    },
    edgesModalVisible: false, // 一键建边弹窗
    activeKey: ['1', '2', '3'],
    isInitAlias: false,
    group: [] // 分组
  };

  formNameRef = React.createRef();
  inputRef = React.createRef();
  inputFirst = React.createRef();

  componentDidMount() {
    this.initData();
    this?.inputFirst?.current?.focus();
    if (!this.props.selectedElement.name) this.setState({ isInitAlias: true });
  }

  componentDidUpdate(prevProps) {
    if (this.props?.selectedElement?.uid !== prevProps?.selectedElement?.uid) {
      this.initData();
      if (!this.props.selectedElement.name) this.setState({ isInitAlias: true });
    }
  }

  /**
   * @description 初始化数据
   */
  initData = () => {
    const { selectedElement } = this.props;
    if (selectedElement) {
      const { name = '', alias = '', color, properties, properties_index, _group = [] } = selectedElement;
      this?.formNameRef?.current?.setFieldsValue({ dataInfoName: name, nickName: alias });
      this.setState({
        color: { hex: color },
        property: handleProperty(properties, properties_index),
        group: [..._group]
      });
    }
  };

  /**
   * @description 手动创建的节点同步显示名内容
   */
  initAlias = e => {
    const { isInitAlias } = this.state;
    const value = e.target.value;
    if (!isInitAlias) return;
    this.formNameRef.current && this.formNameRef.current.setFieldsValue({ nickName: value || '' });
  };

  /**
   * @description 选择颜色
   */
  changeColor = color => {
    this.setState({ color }, () => this.updateData('isBatch'));
  };

  /**
   * @description 更新数据
   */
  updateData = async isBatch => {
    await this.checkAllData();

    const { checkData, color, property, group } = this.state;
    const { selectedElement } = this.props;

    // 输入名是否有错
    const nameRight = !this.formNameRef.current.getFieldsError()[0].errors.length;

    if (nameRight && !checkData.isIncorrect) {
      const name = this.formNameRef.current.getFieldValue('dataInfoName');
      const alias = this.formNameRef.current.getFieldValue('nickName');
      const properties_index = [];
      const newProperty = _.map(property, item => {
        if (typeof item[2] !== 'boolean') item[2] = true;
        item[2] && properties_index.push(item[0]);
        return item;
      });

      const data = {
        name,
        alias,
        color: color?.hex,
        properties: newProperty,
        properties_index,
        uid: selectedElement?.uid,
        _group: group
      };
      this.props.detailUpdateData({ type: 'node', items: [data] });
      // 同名边类，属性改变要保持统一
      if (isBatch) {
        const { edges } = this.props;
        _.forEach(edges, item => {
          if (item.name === name) {
            this.props.detailUpdateData({ type: 'node', items: [data], item });
          }
        });
      }
    }
  };

  /**
   * @description 添加属性
   */
  addProperty = () => {
    if (!this.checkAllData()) return;

    let { property } = this.state;
    property = [...property, ['', 'string', true]];
    this.setState({ property, page: Math.ceil(property.length / PAGESIZE) }, () => {
      // 添加属性的时候自动聚焦
      this.inputRef.current
        ? this.inputRef.current.focus()
        : document.getElementsByClassName('attr-input')[0] && document.getElementsByClassName('attr-input')[0].focus();
    });
  };

  /**
   * @description 修改属性
   * @param {string} value 输入值
   * @param {number} index 输入框在所有属性中的下标
   * @param {number} currentIndex 输入框在当前分页中的下标
   */
  changeInput = (value, index, currentIndex) => {
    const { property } = this.state;
    property[index][0] = value;
    this.setState({ property });

    this.checkInputData(value, currentIndex);
  };

  /**
   * @description 修改前缀
   */
  changeSelect = (value, index) => {
    const { property } = this.state;
    property[index][1] = value;
    this.setState({ property }, () => {
      this.updateData('isBatch');
    });
  };

  /**
   * @description 改变索引信息
   */
  changeIndex = (value, index) => {
    const { property } = this.state;
    property[index][2] = value;
    this.setState({ property }, () => {
      this.updateData('isBatch');
    });
  };

  /**
   * @description 删除属性
   */
  deleteProperty = deleteIndex => {
    // eslint-disable-next-line prefer-const
    let { property, page, checkData } = this.state;
    const { currentIndex, isIncorrect, content } = checkData;

    property = property.filter((item, index) => {
      return index !== deleteIndex;
    });

    // 如果删除的项是出错的项，则重置错误状态
    if (deleteIndex === currentIndex + page * PAGESIZE - 10) {
      this.setState({
        checkData: {
          currentIndex: 0, // 正在检测的输入框在当前分页的下标
          isIncorrect: false, // 输入内容是否正确
          content: ''
        }
      });
    }

    if (deleteIndex !== currentIndex + page * PAGESIZE - 10) {
      if (isIncorrect) {
        this.setState({
          checkData: {
            currentIndex: deleteIndex > currentIndex + page * PAGESIZE - 10 ? currentIndex : currentIndex - 1,
            isIncorrect,
            content
          }
        });
      }
    }

    this.setState({ property }, () => {
      this.updateData('isBatch');
    });

    if (page > Math.ceil(property.length / PAGESIZE)) {
      this.setState({ page: Math.ceil(property.length / PAGESIZE) });
    }

    message.success(intl.get('createEntity.attrDeleteSuc'));
  };

  /**
   * @description 改变分页
   */
  changePage = page => {
    if (!this.checkAllData()) return;
    this.setState({ page });
  };

  /**
   * @description 设置展开状态
   */
  setActiveKey = activeKey => {
    this.setState({ activeKey });
  };

  /**
   * @description 校验输入信息
   */
  checkInputData = (value, currentIndex) => {
    const { property, page } = this.state;
    const { dbType } = this.props;
    const REG = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/;

    let name = property.map((item, index) => {
      return item[0];
    });

    name = name.filter((item, index) => {
      return index !== page * PAGESIZE - 10 + currentIndex;
    });

    // 输入为空，报错
    if (!value) {
      this.setState({
        checkData: {
          currentIndex, // 正在检测的输入框在当前分页的下标
          isIncorrect: true, // 输入内容是否正确
          content: intl.get('createEntity.inputNotEmpty')
        }
      });

      return;
    }

    // 输入内容不合法
    if (!REG.test(value)) {
      this.setState({
        checkData: {
          currentIndex, // 正在检测的输入框在当前分页的下标
          isIncorrect: true, // 输入内容是否正确
          content: intl.get('createEntity.onlyThreeType')
        }
      });

      return;
    }

    // nebula数据库类型只能以小写字母开头
    if (dbType === 'nebula') {
      if (!/^[a-z]+$/.test(value.charAt(0))) {
        this.setState({
          checkData: {
            currentIndex,
            isIncorrect: true, // 输入内容是否正确
            content: intl.get('createEntity.onlyLowercaseStart')
          }
        });

        return;
      }
      if (!/^[0-9a-zA-Z_]{1,}$/.test(value)) {
        this.setState({
          checkData: {
            currentIndex,
            isIncorrect: true, // 输入内容是否正确
            content: intl.get('createEntity.onlyENU')
          }
        });

        return;
      }
    }

    if (value.length > 50) {
      const isMq = this.props.selectedElement?.data_source === 'rabbitmq';

      this.setState({
        checkData: {
          currentIndex, // 正在检测的输入框在当前分页的下标
          isIncorrect: true, // 输入内容是否正确
          content: isMq ? intl.get('createEntity.mq50') : intl.get('createEntity.noMoreThan50')
        }
      });

      return;
    }

    // 重名
    if (name.includes(value)) {
      this.setState({
        checkData: {
          currentIndex, // 正在检测的输入框在当前分页的下标
          isIncorrect: true, // 输入内容是否正确
          content: [intl.get('createEntity.repeatName')]
        }
      });

      return;
    }

    this.setState({
      checkData: {
        currentIndex, // 正在检测的输入框在当前分页的下标
        isIncorrect: false, // 输入内容是否正确
        content: ''
      }
    });
  };

  /**
   * @description 判断输入框是否可以输入
   */
  canInput = (page, index) => {
    const { checkData } = this.state;
    const { currentIndex, isIncorrect } = checkData;
    // 如果是第一项，锁定
    if (page === 1 && index === 0) return true;
    // 如果输入有错，锁定
    if (isIncorrect && index !== currentIndex) return true;
    return false;
  };

  /**
   * @description 在添加属性或切换分页时，进行数据的总体校验
   */
  checkAllData = () => {
    const { checkData, property, page } = this.state;
    const { isIncorrect } = checkData;

    if (isIncorrect) return false;
    for (let i = 0, { length } = property; i < length; i++) {
      if (!property[i][0]) {
        this.checkInputData('', i - page * PAGESIZE + 10);
        return false;
      }
    }
    return true;
  };

  /**
   * @description 全选按钮
   */
  switchAllIndex = value => {
    const { property } = this.state;
    let newPro = [];

    if (value) {
      newPro = property.map((item, index) => {
        item[2] = true;

        return item;
      });

      this.setState(
        {
          newPro
        },
        () => {
          this.updateData('isBatch');
        }
      );

      return;
    }

    newPro = property.map((item, index) => {
      if (index === 0) {
        return item;
      }

      item[2] = false;

      return item;
    });

    this.setState(
      {
        newPro
      },
      () => {
        this.updateData('isBatch');
      }
    );
  };

  /**
   * @description 全选状态
   */
  isSwitchAll = () => {
    const { property } = this.state;
    return _.every(property, pro => pro[2]);
  };

  /**
   * @description 删除点类或边类
   */
  deleteInfo = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('createEntity.sureDelete'),
      content: intl.get('createEntity.sureDeleteInfo')
    });

    if (!isOk) return;

    const { selectedElement } = this.props;
    this.props.detailDeleteData({ type: 'node', items: [selectedElement.uid] });
    this.props.setSelectedElement('');
    message.success([intl.get('createEntity.deleteSuc')]);
  };

  /**
   * @description 一键建边弹窗控制
   */
  setEdgesModal = edgesModalVisible => {
    this.setState({ edgesModalVisible });
  };

  /**
   * @description 关联数据源
   */
  relatedFile = () => {
    const { selectedElement } = this.props;

    if (selectedElement?.source_table?.length > 0) {
      // mysql数据源
      if (typeof selectedElement.source_table[0] === 'string') {
        return (
          <div className="data-source">
            <div className="image">
              <img src={DataSheet} alt="file" className="icon-file" />
            </div>

            <div className="word">
              <div className="line-1" title={wrapperTitle(selectedElement.source_table[0])}>
                {selectedElement.source_table[0]}
              </div>
              <div className="line-2" title={wrapperTitle(selectedElement.ds_path)}>
                {selectedElement.ds_path}
              </div>
              <div className="line-s">
                <span className="line-3">{selectedElement.data_source === 'hive' ? 'Hive' : 'MySQL'}</span>
              </div>
            </div>

            <div className="delete">
              <DisconnectOutlined className="icon" onClick={this.deleteSource} />
            </div>
          </div>
        );
      }

      return (
        <div className="data-source">
          <div className="image">
            <img src={DataSheet} alt="file" className="icon-file" />
          </div>

          <div className="word">
            <div className="line-1" title={selectedElement.source_table[0][1]}>
              {selectedElement.source_table[0][1]}
            </div>
            <div className="line-2" title={selectedElement.source_table[0][2]}>
              {selectedElement.source_table[0][2]}
            </div>
            <div className="line-s">
              <span className="line-3">AnyShare</span>
            </div>
          </div>

          <div className="delete">
            <DisconnectOutlined className="icon" onClick={this.deleteSource} />
          </div>
        </div>
      );
    }

    return (
      <div className="no-data">
        <span>{[intl.get('searchConfig.nodata')]}</span>
      </div>
    );
  };

  /**
   * @description 删除关联的数据源，将数据变成手动添加的
   */
  deleteSource = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('createEntity.uf'),
      content: intl.get('createEntity.ufw')
    });
    if (!isOk) return;
    const { selectedElement } = this.props;
    const { uid, task_id } = selectedElement;
    const newData = {
      ...selectedElement,
      dataType: '',
      data_source: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      extract_type: '',
      file_type: '',
      model: '',
      source_table: [],
      source_type: 'manual',
      task_id: '',
      ds_address: '',
      properties: selectedElement.properties.map(pro => [pro[0], pro[1]])
    };
    this.props.detailUpdateData({ type: 'node', items: [newData] });

    // 如果使用的过的任务里有删除的任务，则在使用过的任务中删除该任务
    const { nodes, edges } = this.props;
    let taskId = [];
    _.forEach([...nodes, ...edges], item => {
      item.uid !== uid && item.task_id && taskId.push(item.task_id);
    });
    taskId = [...new Set(taskId)];
    if (!taskId.includes(task_id)) {
      const res = await servicesCreateEntity.deleteEntityTask({ task_list: [task_id] });
      if (res?.res) {
        const usedTask = _.filter(this.props.used_task, id => id !== task_id);
        this.props.setUsedTask(usedTask);
      }
    }
  };

  /**
   * @description 检测名称是否重复
   */
  checkNameNode = value => {
    const { nodes, edges, selectedElement } = this.props;
    let tem = false;
    nodes.forEach(item => {
      const isSameName = item?.name.toLowerCase() === value.toLowerCase();
      if (value && isSameName && item.uid !== selectedElement.uid) tem = true;
    });
    edges.forEach(item => {
      if (value && item?.name.toLowerCase() === value.toLowerCase()) tem = true;
    });
    return tem;
  };

  /**
   * @description 检测别名是否重复
   */
  checkNickName = value => {
    const { nodes, selectedElement } = this.props;
    let tem = false;

    if (typeof selectedElement.entity_id === 'number') {
      nodes.forEach((item, index) => {
        if (
          item.alias &&
          value &&
          item.alias.toLowerCase() === value.toLowerCase() &&
          item.entity_id !== selectedElement.entity_id
        ) {
          tem = true;
        }
      });
    }

    return tem;
  };

  /**
   * 改变分组
   * @param ids 分组id
   */
  onGroupChange = ids => {
    this.setState({ group: ids }, () => {
      this.updateData('isBatch');
    });
  };

  render() {
    const { displayColorPicker, color, property, page, edgesModalVisible, checkData, activeKey, group } = this.state;
    const { selectedElement } = this.props;

    return (
      <div className="data-info ad-h-100">
        {!(selectedElement && selectedElement.model) && (
          <div>
            <Alert className="alert" message={intl.get('createEntity.tip')} type="warning" showIcon />
          </div>
        )}
        <div className="title">
          <div className="word">
            <img src={dianIcon} alt="KWeaver" className="dian-icon" />
            <span>{intl.get('createEntity.ec')}</span>
          </div>
          <div className="click-mask ad-c-subtext ad-pointer" onClick={this.deleteInfo}>
            <IconFont type="icon-lajitong" />
          </div>
        </div>

        <div className="info-content-flow">
          <Collapse
            activeKey={activeKey}
            expandIconPosition="right"
            onChange={value => this.setState({ activeKey: value })}
          >
            <Panel header={[intl.get('createEntity.basicInfo')]} key="1">
              <div className="basic-info">
                <Form
                  className="form"
                  layout="vertical"
                  ref={this.formNameRef}
                  initialValues={{ dataInfoName: '', nickName: '' }}
                >
                  <Form.Item
                    label={intl.get('createEntity.ecn')}
                    name="dataInfoName"
                    className="entity-describe"
                    colon={false}
                    rules={[
                      { required: true, message: [intl.get('createEntity.inputNotEmpty')] },
                      ({ getFieldValue }) => {
                        const checkName = this.checkNameNode(getFieldValue('dataInfoName'));
                        return {
                          validator(rule, value) {
                            if (!value) return Promise.resolve();
                            const reg = /^\w+$/g;
                            if (value && !reg.test(getFieldValue('dataInfoName'))) {
                              return Promise.reject([intl.get('createEntity.onlyType')]);
                            }
                            if (value.length > 50) {
                              return Promise.reject([intl.get('createEntity.noMoreThan50')]);
                            }
                            if (value && checkName) {
                              return Promise.reject([intl.get('createEntity.classRepeat')]);
                            }
                            return Promise.resolve();
                          }
                        };
                      }
                    ]}
                  >
                    <Input
                      ref={this.inputFirst}
                      autoComplete="off"
                      disabled={selectedElement && selectedElement.model}
                      placeholder={intl.get('workflow.information.nameHolder')}
                      onChange={this.initAlias}
                      onBlur={() => {
                        this.formNameRef.current
                          .validateFields()
                          .then(() => {
                            this.updateData();
                          })
                          .catch(() => {
                            this.updateData();
                          });
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <div>
                        <span>{[intl.get('createEntity.dn')]}</span>
                        <Tooltip placement="right" title={[intl.get('createEntity.dnD')]}>
                          <QuestionCircleOutlined className="icon" />
                        </Tooltip>
                      </div>
                    }
                    name="nickName"
                    className="entity-describe"
                    colon={false}
                    rules={[
                      { required: true, message: [intl.get('createEntity.inputNotEmpty')] },
                      ({ getFieldValue }) => {
                        const checkNickName = this.checkNickName(getFieldValue('nickName'));

                        return {
                          validator(rule, value) {
                            if (!value) return Promise.resolve();
                            const reg = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g;

                            if (value && !reg.test(getFieldValue('nickName'))) {
                              return Promise.reject([intl.get('createEntity.onlyThreeType')]);
                            }

                            if (value.length > 50) {
                              return Promise.reject([intl.get('createEntity.noMoreThan50')]);
                            }

                            if (value && checkNickName) {
                              return Promise.reject([intl.get('createEntity.entityRepeat')]);
                            }

                            return Promise.resolve();
                          }
                        };
                      }
                    ]}
                  >
                    <Input
                      autoComplete="off"
                      placeholder={[intl.get('createEntity.nnc')]}
                      onChange={() => this.setState({ isInitAlias: false })}
                      onBlur={() => {
                        this.formNameRef.current
                          .validateFields()
                          .then(() => {
                            this.updateData();
                          })
                          .catch(() => {
                            this.updateData();
                          });
                      }}
                    />
                  </Form.Item>
                </Form>
              </div>

              <div className="color-select-box">
                <div className="color-name">
                  <span>{[intl.get('createEntity.color')]}</span>
                </div>

                <div className="color-select-container">
                  <div
                    className="color-box"
                    onClick={() => {
                      this.setState({ displayColorPicker: !this.state.displayColorPicker });
                    }}
                  >
                    <div className="color-block" style={{ background: color.hex }}></div>
                    <div className="color">{color.hex}</div>
                  </div>
                </div>

                {displayColorPicker ? (
                  <div className="color-picker">
                    <div
                      className="cover"
                      onClick={() => {
                        this.setState({ displayColorPicker: false });
                      }}
                    />
                    <SketchPicker className="color-plate" color={color} onChange={this.changeColor} />
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel header={intl.get('createEntity.attlist')} key="2">
              <div className="add-all-index">
                <span>{intl.get(`createEntity.${this.isSwitchAll() ? 'closeIndex' : 'openIndex'}`)}</span>
                <Switch
                  className="switch"
                  checked={this.isSwitchAll()}
                  onClick={value => {
                    this.switchAllIndex(value);
                  }}
                />
              </div>

              <div className="add-box">
                <Property
                  page={page}
                  property={property}
                  checkData={checkData}
                  PAGESIZE={PAGESIZE}
                  deleteProperty={this.deleteProperty}
                  inputRef={this.inputRef}
                  canInput={this.canInput}
                  changeInput={this.changeInput}
                  updateData={this.updateData}
                  changeSelect={this.changeSelect}
                  changeIndex={this.changeIndex}
                />
                <div className="add-button" onClick={this.addProperty}>
                  <span className="icon">+</span>
                </div>

                <div className="page">
                  <BottomPagination
                    current={page}
                    showLessItems={true}
                    total={property.length}
                    pageSize={PAGESIZE}
                    onChange={this.changePage}
                    hideOnSinglePage={true}
                  />
                </div>
              </div>
            </Panel>
            <Panel header={intl.get('createEntity.group')} key="3">
              <GroupSelector
                value={group}
                groupList={this.props.groupList}
                onChange={this.onGroupChange}
                onCreateGroup={this.props.onCreateGroup}
              />
            </Panel>
          </Collapse>
          <div
            className="add-edges"
            onClick={() => {
              this.formNameRef.current
                .validateFields()
                .then(() => {
                  if (checkData.isIncorrect) {
                    message.error([intl.get('createEntity.de')]);
                    this.setActiveKey(['1', '2']);
                    return;
                  }

                  this.setEdgesModal(true);
                })
                .catch(() => {
                  message.error([intl.get('createEntity.de')]);
                  this.setActiveKey(['1', '2']);
                });
            }}
          >
            <div className="image">
              <IconFont type="icon-guanxilei" className="icon" />
            </div>

            <div className="word">
              <div className="top">{intl.get('createEntity.aR')}</div>
              <div className="bottom">{intl.get('createEntity.bd')}</div>
            </div>

            <div className="right-image">
              <RightOutlined className="icon" />
            </div>
          </div>

          <Collapse defaultActiveKey={['3']} expandIconPosition="right">
            <Panel header={intl.get('createEntity.asS')} key="3">
              {this.relatedFile()}
            </Panel>
          </Collapse>
        </div>

        <EdgesModal
          key={String(edgesModalVisible)}
          isVisibleEdges={edgesModalVisible}
          nodes={this.props.nodes}
          edges={this.props.edges}
          selectedElement={this.props.selectedElement}
          closeEdgesModal={() => this.setEdgesModal(false)}
          onAddEdgesBatch={this.props.onAddEdgesBatch}
        />
      </div>
    );
  }
}

export default NodeInfo;

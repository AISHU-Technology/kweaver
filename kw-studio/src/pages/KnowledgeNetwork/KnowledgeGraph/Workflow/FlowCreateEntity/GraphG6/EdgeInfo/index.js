/* eslint-disable max-lines */
import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { SketchPicker } from 'react-color';
import { Form, Alert, Collapse, Switch, message, AutoComplete } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { tipModalFunc } from '@/components/TipModal';
import ExplainTip from '@/components/ExplainTip';

import PropertyList from '../NodeInfo/PropertyList';
import { transProperty, revertProperty, verifyProperty } from '../NodeInfo/PropertyList/assistant';
import GroupSelector from '../GroupSelector';

import edgeIcon from '@/assets/images/edge.svg';

import './style.less';

const { Panel } = Collapse;
const PAGESIZE = 10;

class EdgeInfo extends Component {
  state = {
    displayColorPicker: false, // 颜色盘显示
    color: {
      hex: '#54639C'
    }, // 颜色选择
    property: [], // 属性与索引
    page: 1, // 分页
    checkData: {
      isErr: false, // 输入内容是否有误
      errIndex: -1, // 错误的数组索引
      content: null, // 错误提示内容, { name: '错误信息', 'alias': '错误信息' }
      notIndex: false // 是否 未开启索引
    },
    activeKey: ['1', '2', '3'],
    isInitAlias: false,
    group: [], // 分组,
    aliasChangeWithName: false, // 修改属性名, 显示名同步修改
    edgeDisabled: !!this.props.selectedElement?.model // 模型的边类不能修改类名和属性名, 与模型同名的边也不能修改
  };

  formNameRef = React.createRef();
  inputFirst = React.createRef();
  propertyRef = React.createRef();

  componentDidMount() {
    this.initData();
    this?.inputFirst?.current?.focus();
    if (!this.props.selectedElement.uid) this.setState({ isInitAlias: true, aliasChangeWithName: true });
  }

  componentDidUpdate(prevProps) {
    if (this.props?.selectedElement?.uid !== prevProps?.selectedElement?.uid) {
      this.initData();
      if (!this.props.selectedElement.uid) this.setState({ isInitAlias: true, aliasChangeWithName: true });
    }
  }

  /**
   * @description 初始化数据
   */
  initData = () => {
    const { selectedElement, edges } = this.props;
    if (!selectedElement) return;
    const { uid, name = '', alias = '', color, model, properties, properties_index, _group = [] } = selectedElement;
    this?.formNameRef?.current?.setFieldsValue({ dataInfoName: name, nickName: alias });

    // 判断是否可编辑边类
    let edgeDisabled = !!model;
    if (!edgeDisabled) {
      edgeDisabled = _.some(edges, edge => edge.uid !== uid && edge.name === name && edge.model);
    }

    this.setState({
      page: 1,
      color: { hex: color },
      property: transProperty(properties, properties_index, !!model),
      group: [..._group],
      edgeDisabled
    });
  };

  /**
   * @description 手动创建的节点同步显示名内容
   */
  initAlias = ({ value, type }) => {
    const { edges } = this.props;

    const selectedEdge = _.filter(edges, item => {
      return item.name === value;
    })?.[0];
    if (!selectedEdge) return;
    const { uid, model, properties, properties_index } = selectedEdge;
    let edgeDisabled = !!model;
    if (!edgeDisabled) {
      edgeDisabled = _.some(edges, edge => edge.uid !== uid && edge.name === value && edge.model);
    }
    const property = transProperty(properties, properties_index, !!model);
    this.setState({
      property,
      color: { hex: selectedEdge?.color || selectedEdge?.colour },
      page: 1,
      group: [],
      edgeDisabled
    });
    this.formNameRef.current.setFieldsValue({ nickName: selectedEdge?.alias });
    this.updateData();
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
    this.checkAllData();
    const { checkData, color, property, group } = this.state;
    const { selectedElement, nodes, edges } = this.props;

    // 输入名是否有错
    const nameRight = !this.formNameRef.current.getFieldsError()[0].errors.length;

    if (nameRight && !checkData.isErr) {
      const name = this.formNameRef.current.getFieldValue('dataInfoName');
      const alias = this.formNameRef.current.getFieldValue('nickName');
      const [newProperty, properties_index] = revertProperty(property);
      const data = {
        name,
        alias,
        color: color?.hex,
        properties: newProperty,
        properties_index,
        uid: selectedElement?.uid,
        _group: group
      };

      // 同步更新端点分组
      let sourceNode;
      let targetNode;
      _.forEach(nodes, node => {
        if (node.uid === selectedElement.source) {
          sourceNode = { ...node };
          sourceNode._group = _.uniq([...group, ...(node._group || [])]);
        }

        if (node.uid === selectedElement.target) {
          targetNode = { ...node };
          targetNode._group = _.uniq([...group, ...(node._group || [])]);
        }
      });

      const updatedData = [data, sourceNode, targetNode].filter(Boolean);

      /**
       * [bug 355406] 同名边类，属性和显示名改变要保持统一
       */
      if (isBatch) {
        _.forEach(edges, item => {
          if (item.name === name && item.uid !== selectedElement?.uid) {
            updatedData.push({ ..._.omit(data, '_group'), uid: item.uid });
          }
        });
      }
      this.props.detailUpdateData({ type: 'all', items: updatedData });
    }
  };

  /**
   * @description 添加属性
   */
  addProperty = e => {
    e.stopPropagation();
    if (!this.checkAllData()) return;

    const { property } = this.state;
    const newPro = [...property, { name: '', type: 'string', alias: '', checked: false }];
    this.setState(
      {
        property: newPro,
        page: Math.ceil(newPro.length / PAGESIZE) || 1,
        aliasChangeWithName: true
      },
      () => {
        // 添加属性的时候自动聚焦
        this.propertyRef.current?.focusLast();
      }
    );
  };

  setAliasChangeWithName = bool => this.setState({ aliasChangeWithName: bool });

  /**
   * @description 修改属性名|显示名
   * @param {any[]} property 新的属性列表
   */
  onProChange = property => {
    this.setState({ property });
  };

  /**
   * @description 修改属性类型
   * @param {any[]} property 新的属性列表
   */
  onProTypeChange = property => {
    this.setState({ property }, () => {
      this.updateData('isBatch');
    });
  };

  /**
   * @description 改变索引信息
   * @param {any[]} property 新的属性列表
   */
  onIndexesChange = property => {
    this.setState({ property }, () => {
      this.updateData('isBatch');
    });
  };

  /**
   * @description 属性错误回调
   */
  onProErr = err => {
    this.setState({ checkData: { ...err, notIndex: false } });
  };

  /**
   * @description 删除属性
   * @param {any[]} property 删除后的属性列表
   * @param {number} index 被删除的数据索引
   */
  deleteProperty = (property, index) => {
    const { page } = this.state;

    this.setState({ property }, () => {
      this.updateData('isBatch');
    });

    // 防止页码溢出
    if (page > Math.ceil(property.length / PAGESIZE)) {
      this.setState({ page: Math.ceil(property.length / PAGESIZE) || 1 });
    }

    // message.success(intl.get('createEntity.attrDeleteSuc'));
    message.success({
      content: intl.get('createEntity.attrDeleteSuc'),
      className: 'custom-class',
      style: {
        marginTop: '6vh'
      }
    });
  };

  /**
   * @description 改变分页
   */
  changePage = page => {
    // if (!this.checkAllData()) return;
    this.setState({ page });
  };

  /**
   * @description 在添加属性或切换分页时，进行数据的总体校验
   */
  checkAllData = () => {
    const { checkData, property, page } = this.state;
    const { isErr } = checkData;
    if (isErr) return false;

    const { errIndex, errMsg } = verifyProperty(property);
    if (errIndex > -1) {
      const errPage = Math.ceil(errIndex / PAGESIZE) || 1;
      this.setState({
        checkData: {
          ...checkData,
          isErr: true,
          content: errMsg,
          errIndex
        },
        page: errPage !== page ? errPage : page
      });
      return false;
    }
    return true;
  };

  /**
   * @description 全选按钮
   */
  switchAllIndex = checked => {
    const { property } = this.state;
    const newPro = property.map(item => ({ ...item, checked }));
    this.setState({ property: newPro }, () => this.updateData('isBatch'));
  };

  /**
   * @description 全选状态
   */
  isSwitchAll = () => {
    const { property } = this.state;
    return _.every(property, pro => pro.checked);
  };

  /**
   * @description 删除边类
   */
  deleteInfo = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('createEntity.sureDelete'),
      content: intl.get('createEntity.sureDeleteInfo')
    });

    if (!isOk) return;

    const { selectedElement } = this.props;
    this.props.detailDeleteData({ type: 'edge', items: [selectedElement.uid] });
    this.props.setSelectedElement('');
  };

  /**
   * @description 检测名称是否重复
   */
  checkNameEdge = value => {
    const { nodes, selectedElement } = this.props;
    return _.some(
      nodes,
      item => item.name?.toLowerCase() === value?.toLowerCase() && item.uid !== selectedElement?.uid
    );
  };

  /**
   * @description 检测别名是否重复
   */
  // checkNickName = value => {
  //   const { nodes, selectedElement } = this.props;
  //   let tem = false;

  //   if (typeof selectedElement.entity_id === 'number') {
  //     nodes.forEach((item, index) => {
  //       if (
  //         item.alias &&
  //         value &&
  //         item.alias.toLowerCase() === value.toLowerCase() &&
  //         item.entity_id !== selectedElement.entity_id
  //       ) {
  //         tem = true;
  //       }
  //     });
  //   }

  //   return tem;
  // };

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
    const {
      displayColorPicker,
      color,
      property,
      page,
      checkData,
      activeKey,
      group,
      aliasChangeWithName,
      edgeDisabled
    } = this.state;
    const { edges, selectedElement, language } = this.props;

    const edgesName = {};
    const edgesAlias = {};
    const edgesNameOption = edges?.filter(item => {
      let flag = false;

      if (edgesName?.[item.name]) {
        flag = false;
      } else {
        edgesName[item.name] = true;
        flag = true;
      }

      return flag;
    });
    const edgesAliasOption = edges?.filter(item => {
      let flag = false;

      if (edgesAlias?.[item.alias]) {
        flag = false;
      } else {
        edgesAlias[item.alias] = true;
        flag = true;
      }

      return flag;
    });

    return (
      <div className="flow3-edge-info kw-h-100">
        {!selectedElement?.model && (
          <div>
            <Alert className="alert" message={intl.get('createEntity.tip')} type="warning" showIcon />
          </div>
        )}

        <div className="title">
          <div className="word">
            <img src={edgeIcon} alt="KWeaver" className="dian-icon" />
            <span>{intl.get('createEntity.rct')}</span>
          </div>
          <div className="click-mask kw-c-subtext kw-pointer" onClick={this.deleteInfo}>
            <IconFont type="icon-lajitong" className="kw-mr-2" />
            {intl.get('global.delete')}
          </div>
        </div>

        <div className="info-content-flow">
          <Collapse
            activeKey={activeKey}
            expandIconPosition="right"
            onChange={value => {
              this.setState({
                activeKey: value
              });
            }}
          >
            <Panel header={intl.get('createEntity.basicInfo')} key="1">
              <div className="basic-info">
                <div className="kw-mb-2 kw-c-header required">{intl.get('createEntity.name')}</div>
                <Form className="form" ref={this.formNameRef} initialValues={{ dataInfoName: '', nickName: '' }}>
                  <div className="form-row kw-flex">
                    <span className={classNames('name-label kw-c-subtext', { EN: language === 'en-US' })}>
                      {intl.get('createEntity.rNameS')}
                    </span>
                    <Form.Item
                      name="dataInfoName"
                      className="entity-describe"
                      colon={false}
                      rules={[
                        { required: true, message: intl.get('createEntity.inputNotEmpty') },
                        ({ getFieldValue }) => {
                          const checkName = this.checkNameEdge(getFieldValue('dataInfoName'));

                          return {
                            validator(rule, value) {
                              if (!value) return Promise.resolve();
                              const reg = /^\w+$/g;

                              if (value && !reg.test(getFieldValue('dataInfoName'))) {
                                return Promise.reject(intl.get('global.onlyMetacharacters'));
                              }

                              if (value.length > 50) {
                                return Promise.reject(intl.get('createEntity.noMoreThan50'));
                              }

                              if (value && checkName) {
                                return Promise.reject(intl.get('createEntity.edgeClassRepeat'));
                              }

                              return Promise.resolve();
                            }
                          };
                        }
                      ]}
                    >
                      <AutoComplete
                        allowClear
                        className="input-relation name-input"
                        ref={this.inputFirst}
                        placeholder={intl.get('global.pleaseEnter')}
                        disabled={edgeDisabled}
                        options={
                          edgesNameOption?.length
                            ? edgesNameOption.reduce(
                                (res, item) => (item.name ? [...res, { value: item.name }] : res),
                                []
                              )
                            : []
                        }
                        onChange={value => {
                          this.initAlias({ value, type: 'edge' });
                        }}
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
                  </div>

                  <div className="form-row kw-flex">
                    <span className={classNames('name-label kw-c-subtext', { EN: language === 'en-US' })}>
                      {intl.get('createEntity.dn')}
                      <ExplainTip title={intl.get('createEntity.dnD')} />
                    </span>
                    <Form.Item
                      name="nickName"
                      className="entity-describe"
                      colon={false}
                      rules={[
                        { required: true, message: intl.get('createEntity.inputNotEmpty') },
                        ({ getFieldValue }) => {
                          // const checkNickName = this.checkNickName(getFieldValue('nickName'));

                          return {
                            validator(rule, value) {
                              if (!value) return Promise.resolve();
                              const reg = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/g;

                              if (value && !reg.test(getFieldValue('nickName'))) {
                                return Promise.reject(intl.get('createEntity.onlyThreeType'));
                              }

                              if (value.length > 50) {
                                return Promise.reject(intl.get('createEntity.noMoreThan50'));
                              }

                              // if (value && checkNickName) {
                              //   return Promise.reject(intl.get('createEntity.aliasRepeat'));
                              // }

                              return Promise.resolve();
                            }
                          };
                        }
                      ]}
                    >
                      <AutoComplete
                        className="show-name-input name-input"
                        allowClear
                        placeholder={intl.get('global.pleaseEnter')}
                        options={
                          edgesAliasOption?.length
                            ? edgesAliasOption.reduce(
                                (res, item) => (item.alias ? [...res, { value: item.alias }] : res),
                                []
                              )
                            : []
                        }
                        onChange={() => this.setState({ isInitAlias: false })}
                        onBlur={() => {
                          this.formNameRef.current
                            .validateFields()
                            .then(() => this.updateData('isBatch'))
                            .catch(() => {
                              this.updateData('isBatch');
                            });
                        }}
                      />
                    </Form.Item>
                  </div>
                </Form>
              </div>

              <div className="color-select-box">
                <div className="color-name">
                  <span>{[intl.get('createEntity.color')]}</span>
                </div>

                <div className="color-select-container">
                  <div
                    className={classNames('color-box', { 'color-focused': this.state.displayColorPicker })}
                    onClick={() => this.setState({ displayColorPicker: !this.state.displayColorPicker })}
                  >
                    <div className="color-block" style={{ background: color.hex }}></div>
                    <div className="color">{color.hex}</div>
                  </div>
                </div>

                {displayColorPicker ? (
                  <div className="color-picker">
                    <div className="cover" onClick={() => this.setState({ displayColorPicker: false })} />
                    <SketchPicker className="color-plate" color={color} onChange={this.changeColor} />
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel
              header={
                <div className="kw-space-between kw-w-100 kw-pr-5">
                  <span>{intl.get('createEntity.attlist')}</span>
                  {!edgeDisabled ? (
                    <span className="kw-pl-2 kw-pr-2 kw-mr-4 kw-pointer" onClick={this.addProperty}>
                      <PlusOutlined />
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              }
              key="2"
            >
              <div className="add-all-index">
                <span>{intl.get('createEntity.index')}</span>
                <Switch
                  className="switch"
                  checked={this.isSwitchAll()}
                  onClick={value => {
                    this.switchAllIndex(value);
                  }}
                />
              </div>

              <div className="add-box">
                <PropertyList
                  ref={this.propertyRef}
                  type="edge"
                  page={page}
                  property={property}
                  errorData={checkData}
                  PAGESIZE={PAGESIZE}
                  forceDisabled={edgeDisabled}
                  aliasChangeWithName={aliasChangeWithName}
                  setAliasChangeWithName={this.setAliasChangeWithName}
                  onChange={this.onProChange}
                  onTypeChange={this.onProTypeChange}
                  onIndexesChange={this.onIndexesChange}
                  onError={this.onProErr}
                  onDelete={this.deleteProperty}
                  updateData={this.updateData}
                />

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
                node={this.props.selectedElement}
                groupList={this.props.groupList}
                onChange={this.onGroupChange}
                onCreateGroup={this.props.onCreateGroup}
              />
            </Panel>
          </Collapse>
        </div>
      </div>
    );
  }
}

export default EdgeInfo;

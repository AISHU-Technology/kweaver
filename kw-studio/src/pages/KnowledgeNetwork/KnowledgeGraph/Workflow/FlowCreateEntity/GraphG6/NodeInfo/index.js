/* eslint-disable max-lines */
import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { SketchPicker } from 'react-color';
import { Form, Alert, Collapse, Input, Switch, message, Select } from 'antd';
import { RightOutlined, DisconnectOutlined, PlusOutlined, CloseCircleFilled } from '@ant-design/icons';
import classNames from 'classnames';

import servicesCreateEntity from '@/services/createEntity';
import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { tipModalFunc } from '@/components/TipModal';
import ExplainTip from '@/components/ExplainTip';
import { wrapperTitle } from '@/utils/handleFunction';

import EdgesModal from '../Header/EdgesModal';
import PropertyList from './PropertyList';
import GroupSelector from '../GroupSelector';
import IconSelect from '../IconSelect';
import { transProperty, revertProperty, verifyProperty } from './PropertyList/assistant';
import dianIcon from '@/assets/images/dian.svg';
import DataSheet from '@/assets/images/DataSheet.svg';
import './style.less';

const { Panel } = Collapse;
const { Option } = Select;
const PAGESIZE = 10;
const SOURCE_TYPE = ['kingbasees', 'postgresql', 'sqlserver'];

class NodeInfo extends Component {
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
    edgesModalVisible: false, // 一键建边弹窗
    activeKey: ['1', '2', '3'],
    isInitAlias: false,
    group: [], // 分组
    icon: '', // 图标
    defaultTagIndex: -1, // 唯一标识的属性索引
    aliasChangeWithName: false // 修改属性名, 显示名同步修改
  };

  formNameRef = React.createRef();
  inputFirst = React.createRef();
  propertyRef = React.createRef();

  componentDidMount() {
    this.initData();
    !this.props.selectedElement.name && this.setState({ isInitAlias: true, aliasChangeWithName: true });
    setTimeout(() => {
      this.inputFirst.current?.focus();
    }, 0);
  }

  componentDidUpdate(prevProps) {
    if (this.props?.selectedElement?.uid !== prevProps?.selectedElement?.uid) {
      this.initData();
      if (!this.props.selectedElement.name) this.setState({ isInitAlias: true, aliasChangeWithName: true });
    }
  }

  /**
   * @description 初始化数据
   */
  initData = () => {
    const { selectedElement } = this.props;
    if (!selectedElement) return;
    const {
      name = '',
      alias = '',
      color,
      icon = '',
      model,
      properties,
      properties_index,
      _group = [],
      default_tag
    } = selectedElement;
    const defaultTagIndex = _.findIndex(properties, pro => pro[0] === default_tag);

    const property = name
      ? transProperty(properties, properties_index, !!model)
      : properties.map(item => {
          const [name, type, alias] = item;
          return { name, type, alias: alias || name, checked: true };
        });
    this.formNameRef.current?.setFieldsValue({ dataInfoName: name, nickName: alias });
    this.setState({
      page: 1,
      color: { hex: color },
      icon,
      property,
      group: [..._group],
      defaultTagIndex: defaultTagIndex < 0 ? 0 : defaultTagIndex
    });

    // 触发校验
    if (name) {
      this.formNameRef.current?.validateFields();
      const { errIndex, errMsg } = verifyProperty(property);
      if (errIndex < 0) return;
      this.setState({
        checkData: {
          isErr: true,
          content: errMsg,
          errIndex
        }
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
    this.formNameRef.current?.setFieldsValue({ nickName: value || '' });
  };

  /**
   * @description 选择颜色
   */
  changeColor = color => {
    this.setState({ color }, () => this.updateData('isBatch'));
  };

  /**
   * @description 选择icon
   */
  onIconChange = icon => {
    this.setState({ icon }, () => this.updateData('isBatch'));
  };

  /**
   * @description 更新数据
   */
  updateData = async isBatch => {
    this.checkAllData();
    const { checkData, color, property, group, icon, defaultTagIndex } = this.state;
    const { selectedElement } = this.props;

    // 输入名是否有错
    const nameRight = !this.formNameRef.current?.getFieldsError()?.[0]?.errors?.length;

    if (nameRight && !checkData.isErr && defaultTagIndex >= 0) {
      const name = this.formNameRef.current.getFieldValue('dataInfoName');
      const alias = this.formNameRef.current.getFieldValue('nickName');
      const [newProperty, properties_index] = revertProperty(property);
      const data = {
        name,
        alias,
        color: color?.hex,
        icon,
        properties: newProperty,
        properties_index,
        default_tag: newProperty[defaultTagIndex][0],
        uid: selectedElement?.uid,
        _group: group
      };
      this.props.detailUpdateData({ type: 'node', items: [data] });
    }
  };

  /**
   * @description 添加属性
   */
  addProperty = e => {
    e.stopPropagation();
    if (!this.checkAllData()) return;

    const { property, checkData } = this.state;
    const newPro = [...property, { name: '', type: 'string', alias: '', checked: false }];
    this.setState(
      {
        property: newPro,
        page: Math.ceil(newPro.length / PAGESIZE) || 1,
        checkData: { ...checkData, notIndex: false },
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
    this.setState({ checkData: err });
  };

  /**
   * 选中唯一标识属性
   * @param {number} index 属性索引
   */
  onDefaultTagChange = index => {
    this.setState({ defaultTagIndex: index === undefined ? -1 : index }, () => {
      this.updateData('isBatch');
    });
  };

  /**
   * @description 删除属性
   * @param {any[]} property 删除后的属性列表
   * @param {number} index 被删除的数据索引
   */
  deleteProperty = (property, index) => {
    const { page, defaultTagIndex } = this.state;

    // 更新唯一标识
    const newDefaultTagIndex =
      index === defaultTagIndex ? -1 : index > defaultTagIndex ? defaultTagIndex : defaultTagIndex - 1;
    this.setState({ property, defaultTagIndex: newDefaultTagIndex }, () => {
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
   * @description 设置展开状态
   */
  setActiveKey = activeKey => {
    this.setState({ activeKey });
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

    const notIndex = !_.some(property, p => p.checked);
    if (notIndex) {
      this.setState({ checkData: { ...checkData, notIndex } });
      return false;
    }

    return true;
  };

  /**
   * @description 全选按钮
   */
  switchAllIndex = checked => {
    const { property, checkData } = this.state;
    const newPro = property.map(item => ({ ...item, checked }));
    this.setState({ property: newPro, checkData: { ...checkData, notIndex: !checked } }, () =>
      this.updateData('isBatch')
    );
  };

  /**
   * @description 全选状态
   */
  isSwitchAll = () => {
    const { property } = this.state;
    return _.every(property, pro => pro.checked);
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
  };

  /**
   * @description 一键建边弹窗控制
   */
  setEdgesModal = edgesModalVisible => {
    this.setState({ edgesModalVisible });
  };

  /**
   * @description 一键建边弹窗控制
   */
  matchDataSource = dataSource => {
    switch (dataSource) {
      case 'hive':
        return 'Hive';
      case 'mysql':
        return 'MySQL';
      case 'kingbasees':
        return 'KingBaseES';
      case 'sqlserver':
        return 'SQLServer';
      case 'rabbitmq':
        return 'RabbitMQ';
      case 'postgresql':
        return 'PostgreSQL';
      default:
        break;
    }
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
              <div
                className="line-1"
                title={wrapperTitle(
                  selectedElement.source_table[0].includes('/')
                    ? selectedElement.source_table[0].split('/')[1]
                    : selectedElement.source_table[0]
                )}
              >
                {selectedElement.source_table[0].includes('/')
                  ? selectedElement.source_table[0].split('/')[1]
                  : selectedElement.source_table[0]}
              </div>
              <div
                className="line-2"
                title={wrapperTitle(
                  SOURCE_TYPE.includes(selectedElement.data_source)
                    ? selectedElement.source_table[0]
                    : selectedElement.ds_path
                )}
              >
                {SOURCE_TYPE.includes(selectedElement.data_source)
                  ? selectedElement.source_table[0]
                  : selectedElement.ds_path}
              </div>
              <div className="line-s">
                <span className="line-3">{this.matchDataSource(selectedElement.data_source)}</span>
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
    return _.some(
      [...nodes, ...edges],
      item => item.name?.toLowerCase() === value?.toLowerCase() && item.uid !== selectedElement?.uid
    );
  };

  /**
   * @description 检测别名是否重复
   */
  checkNickName = value => {
    const { nodes, selectedElement } = this.props;
    return _.some(
      nodes,
      node => node.alias?.toLowerCase() === value?.toLowerCase() && node.uid !== selectedElement?.uid
    );
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
    const {
      displayColorPicker,
      color,
      property,
      page,
      edgesModalVisible,
      checkData,
      activeKey,
      group,
      icon,
      defaultTagIndex,
      aliasChangeWithName
    } = this.state;
    const { selectedElement, language } = this.props;

    return (
      <div className="flow3-node-info kw-h-100">
        {!selectedElement?.model && (
          <div>
            <Alert className="alert" message={intl.get('createEntity.tip')} type="warning" showIcon />
          </div>
        )}
        <div className="title">
          <div className="word">
            <img src={dianIcon} alt="KWeaver" className="dian-icon" />
            <span>{intl.get('createEntity.ect')}</span>
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
            onChange={value => this.setState({ activeKey: value })}
          >
            <Panel header={[intl.get('createEntity.basicInfo')]} key="1">
              <div className="basic-info">
                <div className="kw-mb-2 kw-c-header required">{intl.get('createEntity.name')}</div>
                <Form className="form" ref={this.formNameRef} initialValues={{ dataInfoName: '', nickName: '' }}>
                  <div className="form-row kw-flex">
                    <span className={classNames('name-label kw-c-subtext', { EN: language === 'en-US' })}>
                      {intl.get('createEntity.eNameS')}
                    </span>
                    <Form.Item
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
                                return Promise.reject([intl.get('global.onlyMetacharacters')]);
                              }
                              if (value.length > 50) {
                                return Promise.reject([intl.get('createEntity.noMoreThan50')]);
                              }
                              if (value && checkName) {
                                return Promise.reject([intl.get('createEntity.entityClassRepeat')]);
                              }
                              return Promise.resolve();
                            }
                          };
                        }
                      ]}
                    >
                      <Input
                        ref={this.inputFirst}
                        className="name-input"
                        autoComplete="off"
                        disabled={!!selectedElement?.model}
                        allowClear
                        placeholder={intl.get('global.pleaseEnter')}
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
                                return Promise.reject(intl.get('createEntity.aliasRepeat'));
                              }

                              return Promise.resolve();
                            }
                          };
                        }
                      ]}
                    >
                      <Input
                        className="name-input"
                        autoComplete="off"
                        allowClear
                        placeholder={intl.get('global.pleaseEnter')}
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
                  </div>
                </Form>
              </div>

              <div className="color-select-box">
                <div className="color-name">{intl.get('createEntity.color')}</div>

                <div className="color-select-container">
                  <div
                    className={classNames('color-box', { 'color-focused': this.state.displayColorPicker })}
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

              <div className="icon-box">
                <div className="kw-mb-2 kw-c-header">{intl.get('createEntity.icon')}</div>
                <IconSelect value={icon} onChange={this.onIconChange} />
              </div>
            </Panel>

            <Panel
              header={
                <div className="kw-space-between kw-w-100 kw-pr-5">
                  <span>{intl.get('createEntity.attlist')}</span>
                  {!selectedElement?.model ? (
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
              <div className="add-all-index kw-mb-3">
                <span>{intl.get('createEntity.index')}</span>
                <Switch
                  className="switch"
                  checked={this.isSwitchAll()}
                  onClick={value => {
                    this.switchAllIndex(value);
                  }}
                />
              </div>

              {!!checkData.notIndex && (
                <div className="pro-error kw-c-header">
                  <CloseCircleFilled className="kw-mr-2 kw-c-error" />
                  {intl.get('createEntity.limitIndex')}
                </div>
              )}

              <div className="add-box">
                <PropertyList
                  ref={this.propertyRef}
                  type="node"
                  page={page}
                  property={property}
                  errorData={checkData}
                  PAGESIZE={PAGESIZE}
                  forceDisabled={!!selectedElement?.model}
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
              <div className="pro-flag kw-mt-4">
                <div className="kw-mb-2 kw-c-header">
                  {intl.get('createEntity.defaultTag')}
                  <ExplainTip title={intl.get('createEntity.defaultTagTip')} />
                </div>
                <Select
                  className={classNames('kw-w-100', { 'err-border': defaultTagIndex < 0 })}
                  placeholder={intl.get('createEntity.select')}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  value={defaultTagIndex < 0 ? undefined : defaultTagIndex}
                  onChange={this.onDefaultTagChange}
                >
                  {property.map((pro, index) => (
                    <Option key={String(index)} value={index}>
                      {pro.name}&nbsp;
                    </Option>
                  ))}
                </Select>
                {defaultTagIndex < 0 && (
                  <div className="kw-c-error" style={{ fontSize: 12, lineHeight: '20px' }}>
                    {intl.get('exploreGraph.noSelectTip')}
                  </div>
                )}
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
          <div
            className="add-edges"
            onClick={() => {
              this.formNameRef.current
                .validateFields()
                .then(() => {
                  if (checkData.isErr) {
                    // message.error([intl.get('createEntity.de')]);
                    message.error({
                      content: [intl.get('createEntity.de')],
                      className: 'custom-class',
                      style: {
                        marginTop: '6vh'
                      }
                    });
                    this.setActiveKey(['1', '2']);
                    return;
                  }

                  this.setEdgesModal(true);
                })
                .catch(() => {
                  // message.error([intl.get('createEntity.de')]);
                  message.error({
                    content: [intl.get('createEntity.de')],
                    className: 'custom-class',
                    style: {
                      marginTop: '6vh'
                    }
                  });
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

          {!selectedElement?.model && (
            <Collapse defaultActiveKey={['3']} expandIconPosition="right">
              <Panel header={intl.get('createEntity.asS')} key="3">
                {this.relatedFile()}
              </Panel>
            </Collapse>
          )}
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

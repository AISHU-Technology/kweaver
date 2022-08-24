/* eslint-disable max-lines */
/**
 * 点或边的信息
 *
 * @author Eden
 * @date 2020/05/14
 *
 */

import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { SketchPicker } from 'react-color';
import {
  Form,
  Collapse,
  Input,
  Tooltip,
  Switch,
  Select,
  message,
  Modal,
  ConfigProvider,
  Button,
  AutoComplete
} from 'antd';
import {
  RightOutlined,
  InfoCircleFilled,
  MinusCircleFilled,
  DisconnectOutlined,
  MinusCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

import Alert from '@/components/Alert';
import IconFont from '@/components/IconFont';
import BottomPagination from '@/components/Pagination';
import { wrapperTitle } from '@/utils/handleFunction';

import NodeToEdgesModal from './edgesModal';
import Property from './Property';
import { handleProperty, analyUrl, isFlow } from './assistFunction';

import dianIcon from '@/assets/images/dian.svg';
import edgeIcon from '@/assets/images/edge.svg';
import DataSheet from '@/assets/images/DataSheet.svg';

import './style.less';

const { Panel } = Collapse;
const PAGESIZE = 10;

class DataInfo extends Component {
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
    modalVisible: false, // 删除弹窗
    edgesModalVisible: false, // 一键建边弹窗
    fileModalVisible: false, // 解绑数据源
    activeKey: ['1', '2'],
    isInitAlias: false
  };

  formNameRef = React.createRef();

  inputRef = React.createRef();

  componentDidMount() {
    this.initData();
    this.props.onDataInfoRef(this);
    this.props.setTouch(true);

    if (!this.props.selectedElement.name) {
      this.setState({
        isInitAlias: true
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedElement && this.props.selectedElement !== prevProps.selectedElement) {
      this.initData();

      if (!this.props.selectedElement.name) {
        this.setState({
          isInitAlias: true
        });
      }
    }
  }

  /**
   * @description 初始化数据
   */
  initData = () => {
    const { edges, selectedElement } = this.props;

    if (selectedElement) {
      const { properties, properties_index } = selectedElement;

      // const sameName = edges.filter(item => {
      //   return (
      //     `${item?.relations?.[0]}_${item?.relations?.[2]}` ===
      //     `${selectedElement?.source?.name}_${selectedElement?.target?.name}`
      //   );
      // });

      this.formNameRef.current &&
        this.formNameRef.current.setFieldsValue({
          dataInfoName: selectedElement.name || '',
          // nickName: sameName?.length > 0 ? sameName?.[0]?.alias : selectedElement.alias || ''
          nickName: selectedElement.alias || ''
        });

      this.setState({
        color: {
          hex: selectedElement.colour
        },
        property: handleProperty(properties, properties_index)
      });
    }
  };

  /**
   * @description 手动创建的节点同步显示名内容
   */
  initAlias = ({ value, type }) => {
    const { edges } = this.props;
    const { isInitAlias } = this.state;

    if (type === 'edge') {
      const selectedEdge = _.filter(edges, item => {
        return item.name === value;
      })?.[0];
      if (!selectedEdge) return;

      this.setState({ property: selectedEdge?.properties, color: { hex: selectedEdge?.colour } });
      this.formNameRef.current.setFieldsValue({ nickName: selectedEdge?.alias });
      this.updateData();
    } else if (type === 'node') {
      if (!isInitAlias) return;
      this.formNameRef.current &&
        this.formNameRef.current.setFieldsValue({
          nickName: value || ''
        });
    }
  };

  /**
   * @description 选择颜色
   */
  changeColor = color => {
    this.setState(
      {
        color
      },
      () => {
        this.updateData('isBatch');
      }
    );
  };

  /**
   * @description 更新数据
   */
  updateData = async isBatch => {
    await this.checkAllData();

    const { checkData } = this.state;

    // 输入名是否有错
    const nameRight = !this.formNameRef.current.getFieldsError()[0].errors.length;

    if (nameRight && !checkData.isIncorrect) {
      const name = this.formNameRef.current.getFieldValue('dataInfoName');
      const alias = this.formNameRef.current.getFieldValue('nickName');
      const { color, property } = this.state;

      const newProperty = _.map(property, item => {
        if (item[2] !== true && item[2] !== false) {
          item[2] = true;
        }
        return item;
      });
      const data = {
        name,
        alias,
        color,
        property: newProperty
      };

      this.props.freeGraphRef.updateData(data);

      // 同名边类，属性改变要保持统一
      if (isBatch) {
        const { edges } = this.props;
        _.forEach(edges, item => {
          if (item.name === name) {
            this.props.freeGraphRef.updateData(data, item);
          }
        });
      }
    }
  };

  /**
   * @description 添加属性
   */
  addProperty = () => {
    if (!this.checkAllData()) {
      return;
    }

    let { property } = this.state;

    property = [...property, ['', 'string', true]];

    this.setState(
      {
        property,
        page: Math.ceil(property.length / PAGESIZE)
      },
      () => {
        // 添加属性的时候自动聚焦
        this.inputRef.current
          ? this.inputRef.current.focus()
          : document.getElementsByClassName('attr-input')[0] &&
            document.getElementsByClassName('attr-input')[0].focus();
      }
    );
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
    this.setState({
      property
    });

    this.checkInputData(value, currentIndex);
  };

  /**
   * @description 修改前缀
   */
  changeSelect = (value, index) => {
    const { property } = this.state;
    property[index][1] = value;
    this.setState(
      {
        property
      },
      () => {
        this.updateData('isBatch');
      }
    );
  };

  /**
   * @description 改变索引信息
   */
  changeIndex = (value, index) => {
    const { property } = this.state;
    property[index][2] = value;
    this.setState(
      {
        property
      },
      () => {
        this.updateData('isBatch');
      }
    );
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

    this.setState(
      {
        property
      },
      () => {
        this.updateData('isBatch');
      }
    );

    if (page > Math.ceil(property.length / PAGESIZE)) {
      this.setState({
        page: Math.ceil(property.length / PAGESIZE)
      });
    }

    message.success(intl.get('createEntity.attrDeleteSuc'));
  };

  /**
   * @description 改变分页
   */
  changePage = page => {
    if (!this.checkAllData()) {
      return;
    }

    this.setState({
      page
    });
  };

  /**
   * @description 设置展开状态
   */
  setActiveKey = activeKey => {
    this.setState({
      activeKey
    });
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
    if (page === 1 && index === 0) {
      return true;
    }

    // 如果输入有错，锁定
    if (isIncorrect && index !== currentIndex) {
      return true;
    }

    return false;
  };

  /**
   * @description 在添加属性或切换分页时，进行数据的总体校验
   */
  checkAllData = () => {
    const { checkData, property, page } = this.state;
    const { isIncorrect } = checkData;

    if (isIncorrect) {
      return false;
    }

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
    let { property } = this.state;

    if (value) {
      property = property.map((item, index) => {
        item[2] = true;

        return item;
      });

      this.setState(
        {
          property
        },
        () => {
          this.updateData('isBatch');
        }
      );

      return;
    }

    property = property.map((item, index) => {
      if (index === 0) {
        return item;
      }

      item[2] = false;

      return item;
    });

    this.setState(
      {
        property
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

    for (let i = 0, { length } = property; i < length; i++) {
      if (!property[i][2]) {
        return false;
      }
    }

    return true;
  };

  /**
   * @description 删除点类或边类
   */
  deleteInfo = () => {
    const { selectedElement } = this.props;

    if (selectedElement && typeof selectedElement.entity_id === 'number') {
      this.props.freeGraphRef.deleteNodes([selectedElement.entity_id]);
    }

    if (selectedElement && typeof selectedElement.edge_id === 'number') {
      this.props.freeGraphRef.deleteEdges([selectedElement.edge_id]);
    }

    this.setState(
      {
        modalVisible: false,
        checkData: {
          currentIndex: 0, // 正在检测的输入框在当前分页的下标
          isIncorrect: false, // 输入内容是否正确
          content: '' // 错误提示
        }
      },
      () => {
        this.props.selectRightTool('', true);
        this.props.setSelectedElement('');
        message.success([intl.get('createEntity.deleteSuc')]);
      }
    );
  };

  /**
   * @description 一键建边弹窗控制
   */
  setEdgesModal = edgesModalVisible => {
    this.setState({
      edgesModalVisible
    });
  };

  /**
   * @description 关联数据源
   */
  relatedFile = () => {
    const { selectedElement } = this.props;
    const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型 // 进入图谱的类型

    if (selectedElement && selectedElement.source_table.length > 0) {
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

            {TYPE === 'view' ? null : (
              <div className="delete">
                <DisconnectOutlined
                  className="icon"
                  onClick={() => {
                    this.setState({
                      fileModalVisible: true
                    });
                  }}
                />
              </div>
            )}
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

          {TYPE === 'view' ? null : (
            <div className="delete">
              <DisconnectOutlined
                className="icon"
                onClick={() => {
                  this.setState({
                    fileModalVisible: true
                  });
                }}
              />
            </div>
          )}
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
  deleteSource = () => {
    const { selectedElement } = this.props;

    this.props.cancelSource(selectedElement);

    this.setState({
      fileModalVisible: false
    });
  };

  /**
   * @description 检测名称是否重复
   */
  checkName = value => {
    const { nodes, edges, selectedElement } = this.props;

    let tem = false;

    if (typeof selectedElement.entity_id === 'number') {
      nodes.forEach((item, index) => {
        if (
          item.name &&
          value &&
          item.name.toLowerCase() === value.toLowerCase() &&
          item.entity_id !== selectedElement.entity_id
        ) {
          tem = true;
        }
      });
    }

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

  render() {
    const {
      displayColorPicker,
      color,
      property,
      page,
      modalVisible,
      edgesModalVisible,
      fileModalVisible,
      checkData,
      activeKey
    } = this.state;
    const { edges, selectedElement } = this.props;
    const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型
    const isNode = selectedElement && typeof selectedElement.entity_id === 'number';

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
      <div className="data-info">
        {TYPE !== 'view' && !(selectedElement && selectedElement.model) && (
          <div>
            <Alert message={intl.get('createEntity.tip')} type="warning" showIcon />
          </div>
        )}
        <div className="title">
          <div className="word">
            {isNode ? (
              <img src={dianIcon} alt="AnyDATA" className="dian-icon" />
            ) : (
              <img src={edgeIcon} alt="AnyDATA" className="dian-icon" />
            )}

            <span>{isNode ? [intl.get('createEntity.ec')] : [intl.get('createEntity.rc')]}</span>
          </div>
          <div className="icon">
            <IconFont
              type="icon-lajitong"
              className={TYPE === 'view' ? 'disabled' : 'icon'}
              onClick={() => {
                if (TYPE !== 'view') {
                  this.setState({
                    modalVisible: true
                  });
                }
              }}
            />
          </div>
        </div>

        <div className={isFlow() ? 'info-content-flow' : 'info-content'}>
          <Collapse
            activeKey={activeKey}
            expandIconPosition="right"
            onChange={value => {
              this.setState({
                activeKey: value
              });
            }}
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
                    label={isNode ? [intl.get('createEntity.ecn')] : [intl.get('createEntity.reN')]}
                    name="dataInfoName"
                    className="entity-describe"
                    colon={false}
                    rules={[
                      { required: true, message: [intl.get('createEntity.inputNotEmpty')] },
                      ({ getFieldValue }) => {
                        const checkName = this.checkName(getFieldValue('dataInfoName'));

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
                    {isNode ? (
                      <Input
                        autoComplete="off"
                        disabled={TYPE === 'view' || (selectedElement && selectedElement.model)}
                        placeholder={
                          isNode ? [intl.get('workflow.information.nameHolder')] : [intl.get('createEntity.rp')]
                        }
                        onChange={e => {
                          this.initAlias({ value: e.target.value, type: 'node' });
                        }}
                        onBlur={() => {
                          this.formNameRef.current
                            .validateFields()
                            .then(() => {
                              this.updateData();
                            })
                            .catch(() => {});
                        }}
                      />
                    ) : (
                      <AutoComplete
                        className="input-relation"
                        allowClear
                        placeholder={[intl.get('createEntity.rp')]}
                        disabled={TYPE === 'view' || (selectedElement && selectedElement.model)}
                        options={edgesNameOption?.length ? edgesNameOption.map(item => ({ value: item.name })) : []}
                        onChange={value => {
                          this.initAlias({ value, type: 'edge' });
                        }}
                        onBlur={() => {
                          this.formNameRef.current
                            .validateFields()
                            .then(() => {
                              this.updateData();
                            })
                            .catch(() => {});
                        }}
                      />
                    )}
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
                    {isNode ? (
                      <Input
                        autoComplete="off"
                        placeholder={[intl.get('createEntity.nnc')]}
                        disabled={TYPE === 'view'}
                        onChange={() => {
                          this.setState({
                            isInitAlias: false
                          });
                        }}
                        onBlur={() => {
                          this.formNameRef.current
                            .validateFields()
                            .then(() => {
                              this.updateData();
                            })
                            .catch(() => {});
                        }}
                      />
                    ) : (
                      <AutoComplete
                        className="show-name-input"
                        allowClear
                        disabled={TYPE === 'view'}
                        placeholder={[intl.get('createEntity.nnc')]}
                        options={edgesAliasOption?.length ? edgesAliasOption.map(item => ({ value: item.alias })) : []}
                        onChange={() => {
                          this.setState({
                            isInitAlias: false
                          });
                        }}
                        onBlur={() => {
                          this.formNameRef.current
                            .validateFields()
                            .then(() => {
                              this.updateData('isBatch');
                            })
                            .catch(() => {});
                        }}
                      />
                    )}
                  </Form.Item>
                </Form>
              </div>

              <div className="color-select-box">
                <div className="color-name">
                  <span>{[intl.get('createEntity.color')]}</span>
                </div>

                <div className="color-select-container">
                  <div
                    className={TYPE === 'view' ? 'color-box color-box-view' : 'color-box'}
                    onClick={() => {
                      if (TYPE === 'view') return;
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
                <span>{intl.get('createEntity.addI')}</span>

                <span className="add">
                  <Tooltip placement="right" title={intl.get('createEntity.addAllIndex')}>
                    <QuestionCircleOutlined className="icon" />
                  </Tooltip>
                </span>
                <Switch
                  className="switch"
                  checked={this.isSwitchAll()}
                  disabled={TYPE === 'view'}
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
                  analyUrl={analyUrl}
                  PAGESIZE={PAGESIZE}
                  deleteProperty={this.deleteProperty}
                  inputRef={this.inputRef}
                  canInput={this.canInput}
                  changeInput={this.changeInput}
                  updateData={this.updateData}
                  changeSelect={this.changeSelect}
                  changeIndex={this.changeIndex}
                />
                {TYPE === 'view' ? null : (
                  <div className="add-button" onClick={this.addProperty}>
                    <span className="icon">+</span>
                  </div>
                )}

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
          </Collapse>

          {TYPE !== 'view' && isNode ? (
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

                    if (this.props.checkSaveData('edge')) return;
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
          ) : null}

          {isNode ? (
            <Collapse defaultActiveKey={['3']} expandIconPosition="right">
              <Panel header={intl.get('createEntity.asS')} key="3">
                {this.relatedFile()}
              </Panel>
            </Collapse>
          ) : null}
        </div>

        <Modal
          className="delete-create-info-4567911"
          visible={modalVisible}
          bodyStyle={{ height: 92 }}
          footer={[
            <ConfigProvider key="deleteCreateInfo" autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setState({
                    modalVisible: false
                  });
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
              <Button type="primary" className="add-modal-save" key="ok" onClick={this.deleteInfo}>
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          ]}
          closable={false}
        >
          <div className="title-content">
            <InfoCircleFilled className="icon" />
            <span className="title-word">{[intl.get('createEntity.sureDelete')]}</span>
          </div>
          <div className="content-word">{[intl.get('createEntity.sureDeleteInfo')]}</div>
        </Modal>

        <Modal
          className="delete-create-info-4567911-qw"
          visible={fileModalVisible}
          bodyStyle={{ height: 92 }}
          maskClosable={false}
          footer={[
            <ConfigProvider key="deleteCreateInfo">
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setState({
                    fileModalVisible: false
                  });
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
              <Button type="primary" className="add-modal-save" key="ok" onClick={this.deleteSource}>
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          ]}
          onCancel={() => {
            this.setState({
              fileModalVisible: false
            });
          }}
        >
          <div className="title-content">
            <InfoCircleFilled className="icon" />
            <span className="title-word">{[intl.get('createEntity.uf')]}</span>
          </div>
          <div className="content-word">{[intl.get('createEntity.ufw')]}</div>
        </Modal>

        <Modal
          className="edge-modal-qzdj-true-node"
          title={[intl.get('createEntity.aR')]}
          width={1000}
          visible={edgesModalVisible}
          footer={null}
          destroyOnClose={true}
          maskClosable={false}
          onCancel={() => {
            this.setEdgesModal(false);
          }}
        >
          <NodeToEdgesModal
            nodes={this.props.nodes}
            selectedElement={this.props.selectedElement}
            setEdgesModal={this.setEdgesModal}
            freeGraphRef={this.props.freeGraphRef}
          />
        </Modal>
      </div>
    );
  }
}

DataInfo.defaultProps = {
  selectedElement: '',
  onDataInfoRef: () => {},
  setTouch: () => {},
  selectRightTool: () => {},
  setSelectedElement: () => {}
};

export default DataInfo;

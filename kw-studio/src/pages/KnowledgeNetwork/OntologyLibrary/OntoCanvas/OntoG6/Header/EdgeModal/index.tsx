/* eslint-disable max-lines */
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Select, Modal, ConfigProvider, Button, Empty, AutoComplete } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { fuzzyMatch, getCorrectColor } from '@/utils/handleFunction';

import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;
const PAGESIZE = 10;
const NAME_REG = /^\w+$/;
const ALIAS_REG = /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/;

interface OntoEdgesModalStates {
  nodes: any;
  addEdges: any;
  page: number;
  edgeHasError: any;
}

interface Props<T> {
  [key: string]: T | any;
}

class OntoEdgesModal<T> extends Component<Props<T>, OntoEdgesModalStates> {
  language = intl.getInitOptions().currentLocale || 'zh-CN';
  state: OntoEdgesModalStates = {
    nodes: [],
    addEdges: [
      {
        lineLength: 200,
        color: getCorrectColor(),
        startName: this.props.selectedElement?.name, // 如果有selectedElement则锁定为起点
        startId: this.props.selectedElement?.uid || '',
        selectedPoint: this.props.selectedElement?.uid ? 'start' : undefined,
        endName: undefined,
        endId: '',
        name: undefined,
        alias: undefined,
        size: 0.75,
        switchDefault: false,
        switchMaster: false,
        default_tag: ''
      }
    ], // 添加的边
    page: 1, // 页码
    edgeHasError: {
      target: 'name',
      status: false,
      index: 0,
      content: ''
    }
  };

  componentDidMount() {
    this.setState({ nodes: this.props.nodes });
  }

  componentDidUpdate(prevProps: any) {
    if (JSON.stringify(prevProps.nodes) !== JSON.stringify(this.props.nodes)) {
      this.setState({ nodes: this.props.nodes });
    }
  }

  /**
   * @description 添加边
   */
  addEdge = () => {
    if (this.checkData()) {
      return;
    }

    let { addEdges } = this.state;

    addEdges = [
      ...addEdges,
      {
        lineLength: 200,
        color: getCorrectColor(),
        startName: this.props.selectedElement?.name,
        startId: this.props.selectedElement?.uid || '',
        selectedPoint: this.props.selectedElement?.uid ? 'start' : undefined,
        endName: undefined,
        endId: '',
        name: undefined,
        alias: undefined,
        size: 0.75,
        switchDefault: false,
        switchMaster: false,
        default_tag: ''
      }
    ];

    this.setState(
      {
        addEdges,
        page: Math.ceil(addEdges.length / PAGESIZE)
      },
      () => {
        document.getElementById('scrollBox') && document.getElementById('scrollBox')!.scrollTo(0, 10000);
      }
    );
  };

  /**
   * @description 删除边
   */
  deleteEdge = (deleteIndex: any) => {
    // eslint-disable-next-line prefer-const
    let { addEdges, edgeHasError } = this.state;

    if (addEdges.length === 1) {
      addEdges[0] = {
        lineLength: 200,
        color: addEdges[0].color,
        startName: undefined,
        startId: '',
        endName: undefined,
        endId: '',
        name: undefined,
        alias: undefined,
        size: 0.75,
        switchDefault: false,
        switchMaster: false,
        default_tag: ''
      };

      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });
    } else {
      addEdges = addEdges.filter((item: any, index: any) => {
        return deleteIndex !== index;
      });

      if (edgeHasError.status) {
        if (edgeHasError.index === deleteIndex) {
          this.setState({
            edgeHasError: {
              status: false,
              index: 0,
              content: ''
            }
          });
        }

        if (edgeHasError.index !== deleteIndex) {
          this.setState({
            edgeHasError: {
              target: edgeHasError.target,
              status: true,
              index: deleteIndex > edgeHasError.index ? edgeHasError.index : edgeHasError.index - 1,
              content: edgeHasError.content
            }
          });
        }
      }
    }

    this.setState({
      addEdges
    });
  };

  /**
   * @description 选择起始点
   */
  selectStart = (option: any, index: any) => {
    const { edges } = this.props;
    const { addEdges } = this.state;

    if (!option) {
      addEdges[index].startName = '';
      addEdges[index].startId = 0;
      addEdges[index].name = '';
      addEdges[index].alias = '';
      addEdges[index].default_tag = '';
      this.setState({ addEdges });

      return;
    }

    if (`${addEdges[index].startName}_2_${addEdges[index].endName}` === addEdges[index].name) {
      addEdges[index].startName = option.data.name;
      addEdges[index].startId = option.data.uid;

      const _tempName = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

      addEdges[index].name = _tempName;

      if (edges?.length) {
        const sameName = edges.filter((item: any) => {
          return (
            `${item?.relations?.[0]}_${item?.relations?.[2]}` ===
            `${addEdges[index].startName}_${addEdges[index].endName}`
          );
        });

        if (sameName.length > 0) {
          addEdges[index].name = sameName?.[0]?.name || _tempName;
          addEdges[index].alias = sameName?.[0]?.alias || _tempName;
        } else {
          addEdges[index].alias = _tempName;
        }
      } else {
        addEdges[index].alias = _tempName;
      }

      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });
    } else {
      addEdges[index].startName = option.data.name;
      addEdges[index].startId = option.data.uid;

      if (!addEdges[index].name && addEdges[index].startName && addEdges[index].endName) {
        const _tempName = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

        addEdges[index].name = _tempName;

        if (edges?.length) {
          const sameName = edges.filter((item: any) => {
            return (
              `${item?.relations?.[0]}_${item?.relations?.[2]}` ===
              `${addEdges[index].startName}_${addEdges[index].endName}`
            );
          });

          if (sameName.length > 0) {
            addEdges[index].name = sameName?.[0]?.name || _tempName;
            addEdges[index].alias = sameName?.[0]?.alias || _tempName;
          } else {
            addEdges[index].alias = _tempName;
          }
        } else {
          addEdges[index].alias = _tempName;
        }

        this.setState({
          edgeHasError: {
            status: false,
            index: 0,
            content: ''
          }
        });
      }
    }

    this.setState({ addEdges });
  };

  /**
   * @description 选择终点
   */
  selectEnd = (option: any, index: any) => {
    const { edges } = this.props;
    const { addEdges } = this.state;

    if (!option) {
      addEdges[index].endName = '';
      addEdges[index].endId = 0;
      addEdges[index].name = '';
      addEdges[index].alias = '';
      addEdges[index].default_tag = '';
      this.setState({ addEdges });

      return;
    }

    if (`${addEdges[index].startName}_2_${addEdges[index].endName}` === addEdges[index].name) {
      addEdges[index].endName = option.data.name;
      addEdges[index].endId = option.data.uid;

      const _tempName = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

      addEdges[index].name = _tempName;

      if (edges?.length) {
        const sameName = edges.filter((item: any) => {
          return (
            `${item?.relations?.[0]}_${item?.relations?.[2]}` ===
            `${addEdges[index].startName}_${addEdges[index].endName}`
          );
        });

        if (sameName.length > 0) {
          addEdges[index].name = sameName?.[0]?.name || _tempName;
          addEdges[index].alias = sameName?.[0]?.alias || _tempName;
        } else {
          addEdges[index].alias = _tempName;
        }
      } else {
        addEdges[index].alias = _tempName;
      }

      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });
    } else {
      addEdges[index].endName = option.data.name;
      addEdges[index].endId = option.data.uid;

      if (!addEdges[index].name && addEdges[index].startName && addEdges[index].endName) {
        const _tempName = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

        addEdges[index].name = _tempName;

        if (edges?.length) {
          const sameName = edges.filter((item: any) => {
            return (
              `${item?.relations?.[0]}_${item?.relations?.[2]}` ===
              `${addEdges[index].startName}_${addEdges[index].endName}`
            );
          });

          if (sameName.length > 0) {
            addEdges[index].name = sameName?.[0]?.name || _tempName;
            addEdges[index].alias = sameName?.[0]?.alias || _tempName;
          } else {
            addEdges[index].alias = _tempName;
          }
        } else {
          addEdges[index].alias = _tempName;
        }

        this.setState({
          edgeHasError: {
            status: false,
            index: 0,
            content: ''
          }
        });
      }
    }

    this.setState({
      addEdges
    });
  };

  /**
   * 校验
   * @param {string} value 校验值
   * @param {number} index 索引
   * @param {string} target 'name' | 'alias
   */
  verifyName = (value: string, index: number, target = 'name') => {
    let content = '';
    switch (true) {
      case !value:
        content = intl.get('global.noNull');
        break;
      case value.length > 255:
        content = intl.get('global.lenErr', { len: 255 });
        break;
      case target === 'name' && !NAME_REG.test(value):
        content = intl.get('global.onlyMetacharacters');
        break;
      case target === 'alias' && !ALIAS_REG.test(value):
        content = intl.get('createEntity.onlyThreeType');
        break;
      default:
        break;
    }

    this.setState({
      edgeHasError: {
        target,
        status: !!content,
        index: content ? index : 0,
        content
      }
    });
  };

  /**
   * @description 改变关系类类名
   */
  edgeClassNameChanged = (value: string, index: number) => {
    const { edges } = this.props;
    const { addEdges } = this.state;

    addEdges[index].name = value;
    _.forEach(edges, item => {
      if (item.name === value) {
        addEdges[index].alias = item.alias;
        addEdges[index].color = item.color;
        addEdges[index].properties = item.properties;
        addEdges[index].properties_index = item.properties_index;
      }
    });

    // 新建复用边更改
    _.forEach(addEdges, item => {
      if (item.name === addEdges[index].name) {
        addEdges[index].alias = item.alias;
      }
    });

    this.setState({
      addEdges
    });

    if (NAME_REG.test(value) && value.length <= 255 && value !== '') {
      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });

      return;
    }
    this.verifyName(value, index, 'name');
  };

  /**
   * @description 改变关系类显示名
   */
  edgeClassAliasChanged = (value: string, index: number) => {
    const { addEdges } = this.state;

    addEdges[index].alias = value;

    // 新建复用边更改
    _.forEach(addEdges, item => {
      if (item.name === addEdges[index].name) {
        item.alias = value;
      }
    });

    this.verifyName(value, index, 'alias');
    this.setState({ addEdges });
  };

  /**
   * @description 切换起点和终点
   */
  exchangeName = (data: any, index: number) => {
    const { addEdges } = this.state;
    const hasSelected = !!this.props.selectedElement?.uid;

    const newEdges = {
      lineLength: data.lineLength,
      color: data.color,
      startName: data.endName,
      startId: data.endId,
      selectedPoint: hasSelected ? (data.selectedPoint === 'start' ? 'end' : 'start') : undefined,
      endName: data.startName,
      endId: data.startId,
      name: data.name,
      alias: data.alias,
      size: data.size,
      switchDefault: data.switchDefault,
      switchMaster: data.switchMaster
    };

    if (data.name === `${data.startName}_2_${data.endName}`) {
      newEdges.name = `${data.endName}_2_${data.startName}`;
    }
    // 显示名同步切换
    if (data.alias === `${data.startName}_2_${data.endName}`) {
      newEdges.alias = `${data.endName}_2_${data.startName}`;
    }
    addEdges[index] = newEdges;

    this.setState({
      addEdges
    });
  };

  /**
   * @description 复制边
   */
  copy = (data: any) => {
    if (this.checkData()) {
      return;
    }

    let { addEdges } = this.state;

    const newEdges = {
      lineLength: data.lineLength,
      color: data.color,
      startName: data.startName,
      startId: data.startId,
      endName: data.endName,
      endId: data.endId,
      name: data.name,
      alias: data.alias,
      size: data.size,
      switchDefault: data.switchDefault,
      switchMaster: data.switchMaster
    };

    addEdges = [...addEdges, newEdges];

    this.setState(
      {
        addEdges
      },
      () => {
        document.getElementById('scrollBox') && document.getElementById('scrollBox')!.scrollTo(0, 10000);
      }
    );
  };

  /**
   * @description 添加边集
   */
  save = () => {
    const { edges } = this.props;
    const { addEdges } = this.state;

    // 如果有错误，不能保存
    if (this.checkData()) {
      return;
    }

    const reusedEdges = edges.filter((item: any) => addEdges.some((addItem: any) => addItem.name === item.name));
    const updateEdges = reusedEdges.map((item: any) => {
      for (const addItems of addEdges) {
        if (addItems.name === item.name) {
          item.alias = addItems.alias;
          return item;
        }
      }
      return null;
    });

    // 更新画布上的边
    this?.props?.detailUpdateData({ type: 'edge', items: updateEdges });
    // 批量新建边
    this?.props?.onAddEdgesBatch(addEdges);
    // 关闭modal
    this.props.closeEdgesModal();
  };

  /**
   * @description 检验添加的数据是否正确
   */
  checkData = () => {
    const { addEdges, edgeHasError } = this.state;
    let hasError = false;

    if (edgeHasError.status) {
      return edgeHasError.status;
    }

    for (let i = 0, { length } = addEdges; i < length; i++) {
      if (!addEdges[i].startName) {
        addEdges[i].startName = '';
        hasError = true;
      }

      if (!addEdges[i].endName) {
        addEdges[i].endName = '';
        hasError = true;
      }

      if (addEdges[i].startName && addEdges[i].endName && (!addEdges[i].name || !addEdges[i].alias)) {
        hasError = true;

        this.setState({
          edgeHasError: {
            target: !addEdges[i].name ? 'name' : 'alias',
            status: true,
            index: i,
            content: intl.get('createEntity.inputNotEmpty')
          }
        });
      }

      if (addEdges[i].name?.length > 50 || addEdges[i].alias?.length > 50) {
        hasError = true;

        this.setState({
          edgeHasError: {
            target: addEdges[i].name?.length > 50 ? 'name' : 'alias',
            status: true,
            index: i,
            content: intl.get('createEntity.noMoreThan50')
          }
        });
      }

      if (!NAME_REG.test(addEdges[i].name)) {
        hasError = true;

        this.setState({
          edgeHasError: {
            target: 'name',
            status: true,
            index: i,
            content: intl.get('global.onlyMetacharacters')
          }
        });
      }

      if (!ALIAS_REG.test(addEdges[i].alias)) {
        hasError = true;

        this.setState({
          edgeHasError: {
            target: 'alias',
            status: true,
            index: i,
            content: intl.get('createEntity.onlyThreeType')
          }
        });
      }
    }

    this.setState({
      addEdges
    });

    return hasError;
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kong} description={[intl.get('createEntity.noData')]} />
    </div>
  );

  render() {
    const { addEdges, nodes, edgeHasError } = this.state;
    const { edges, isVisibleEdges, closeEdgesModal, selectedElement } = this.props;

    const edgesName: any = {};
    const edgesAlias: any = {};
    const edgesNameOption = edges?.filter((item: any) => {
      let flag = false;

      if (edgesName?.[item.name]) {
        flag = false;
      } else {
        edgesName[item.name] = true;
        flag = true;
      }

      return flag;
    });
    const edgesAliasOption = edges?.filter((item: any) => {
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
      <UniversalModal
        className="batch-add-edge-modal"
        title={intl.get('createEntity.bulikR')}
        width={1000}
        open={isVisibleEdges}
        footer={null}
        destroyOnClose
        maskClosable={false}
        onCancel={closeEdgesModal}
        // footerExtra={
        //   <div>
        //     <ExclamationCircleFilled className="kw-mr-2 kw-c-warning" />
        //     {intl.get('createEntity.tip')}
        //   </div>
        // }
        footerData={[
          {
            label: intl.get('global.cancel'),
            onHandle: () => {
              this.props.closeEdgesModal();
            }
          },
          { label: intl.get('global.ok'), type: 'primary', onHandle: this.save }
        ]}
      >
        <div className="edges-modal">
          <div className="tip">
            <div>
              <ExclamationCircleFilled className="kw-mr-2 kw-c-warning" />
              {intl.get('createEntity.tip')}
            </div>
          </div>
          <div className={classNames('table', { EN: this.language === 'en-US' })}>
            <div className="table-head">
              <div className="title tilte-1">{[intl.get('createEntity.startPoint')]}</div>
              <div className="title title-2">{[intl.get('createEntity.endPoint')]}</div>
              <div className="title title-3">{[intl.get('createEntity.reN')]}</div>
              <div className="title title-4">{[intl.get('createEntity.relationShowName')]}</div>
              <div className="title-right">{[intl.get('createEntity.op')]}</div>
            </div>

            <div className="content-box" id="scrollBox">
              {addEdges &&
                addEdges.length > 0 &&
                addEdges.map((item: any, index: number) => {
                  const isDisabled = !item.startId || !item.endId;

                  return (
                    <div className="table-content" key={index.toString()}>
                      <div className={item.startName === '' ? 'select-box-error' : 'select-box'}>
                        <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                          <Select
                            showSearch
                            allowClear
                            className="select-name"
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            placeholder={intl.get('createEntity.startPointPlace')}
                            listHeight={32 * 4}
                            disabled={item.selectedPoint === 'start' && selectedElement?.uid === item.startId}
                            value={item.startName || undefined}
                            onChange={(value, option) => {
                              this.selectStart(option, index);
                            }}
                            filterOption={(inputValue, option) => {
                              if (
                                fuzzyMatch(inputValue, option?.data?.name) ||
                                fuzzyMatch(inputValue, option?.data?.alias)
                              ) {
                                return true;
                              }
                              return false;
                            }}
                          >
                            {nodes &&
                              nodes.map((item: any, index: number) => {
                                return (
                                  <Option value={item.name} key={item.name} data={item}>
                                    {item.alias ? item.alias : item.name}
                                  </Option>
                                );
                              })}
                          </Select>
                        </ConfigProvider>

                        <div className="error-word">
                          {item.startName === '' ? intl.get('createEntity.inputNotEmpty') : null}
                        </div>
                      </div>

                      <div className="icon-box">
                        <IconFont
                          type="icon-qiehuan1"
                          className="icon"
                          onClick={() => {
                            this.exchangeName(item, index);
                          }}
                        />
                      </div>

                      <div className={item.endName === '' ? 'select-box-error' : 'select-box'}>
                        <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                          <Select
                            showSearch
                            allowClear
                            className="select-name"
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            placeholder={[intl.get('createEntity.endPointPlace')]}
                            listHeight={32 * 4}
                            disabled={item.selectedPoint === 'end' && selectedElement?.uid === item.endId}
                            value={item.endName || undefined}
                            onChange={(value, option) => {
                              this.selectEnd(option, index);
                            }}
                            filterOption={(inputValue, option) => {
                              if (
                                fuzzyMatch(inputValue, option?.data?.name) ||
                                fuzzyMatch(inputValue, option?.data?.alias)
                              ) {
                                return true;
                              }
                              return false;
                            }}
                          >
                            {nodes &&
                              nodes.map((item: any, index: number) => {
                                return (
                                  <Option value={item.name} key={item.name} data={item}>
                                    {item.alias ? item.alias : item.name}
                                  </Option>
                                );
                              })}
                          </Select>
                        </ConfigProvider>

                        <div className="error-word">
                          {item.endName === '' ? intl.get('createEntity.inputNotEmpty') : null}
                        </div>
                      </div>

                      <div className="icon-box">
                        <IconFont type="icon-lianjie" className="icon" />
                      </div>

                      <div
                        className={
                          edgeHasError.status && edgeHasError.index === index && edgeHasError.target !== 'alias'
                            ? 'select-box-error'
                            : 'select-box'
                        }
                      >
                        <AutoComplete
                          className="input-relation"
                          allowClear
                          value={item.name}
                          placeholder={[intl.get('createEntity.rp')]}
                          disabled={isDisabled || (edgeHasError.status && edgeHasError.index !== index)}
                          options={
                            edgesNameOption?.length ? edgesNameOption.map((item: any) => ({ value: item.name })) : []
                          }
                          onChange={value => {
                            this.edgeClassNameChanged(value || '', index);
                          }}
                        />
                        <div className="error-word">
                          {edgeHasError.status && edgeHasError.index === index && edgeHasError.target !== 'alias'
                            ? edgeHasError.content
                            : null}
                        </div>
                      </div>

                      <div
                        className={classNames('show-name-box', {
                          'error-border':
                            edgeHasError.status && edgeHasError.index === index && edgeHasError.target === 'alias'
                        })}
                      >
                        <AutoComplete
                          className="show-name-input"
                          allowClear
                          value={item.alias}
                          disabled={isDisabled}
                          placeholder={[intl.get('createEntity.showName')]}
                          options={
                            edgesAliasOption?.length ? edgesAliasOption.map((item: any) => ({ value: item.alias })) : []
                          }
                          onChange={value => {
                            this.edgeClassAliasChanged(value, index);
                            // addEdges[index].alias = value;
                            // this.verifyName(value, index, 'alias');
                            // this.setState({ addEdges });
                          }}
                        />
                        <div className="error-word">
                          {edgeHasError.status && edgeHasError.index === index && edgeHasError.target === 'alias'
                            ? edgeHasError.content
                            : null}
                        </div>
                      </div>

                      <div className="tool">
                        <IconFont
                          type="icon-copy"
                          className="icon-copy"
                          onClick={() => {
                            this.copy(item);
                          }}
                        />
                        <span className="set">|</span>
                        <IconFont
                          type="icon-lajitong"
                          className="icon-delete"
                          onClick={() => {
                            this.deleteEdge(index);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

              <div className="kw-c-primary kw-pointer" onClick={this.addEdge}>
                <IconFont type="icon-Add" className="icon" style={{ marginRight: 8 }} />
                <span>{[intl.get('createEntity.add')]}</span>
              </div>
            </div>

            {/* <div className="bottom-button kw-space-between">
              <div>
                <ExclamationCircleFilled className="kw-mr-2 kw-c-warning" />
                {intl.get('createEntity.tip')}
              </div>
              <div>
                <ConfigProvider autoInsertSpaceInButton={false}>
                  <Button
                    onClick={() => {
                      this.props.closeEdgesModal();
                    }}
                  >
                    {intl.get('global.cancel')}
                  </Button>

                  <Button type="primary" className="kw-ml-3" onClick={this.save}>
                    {intl.get('global.ok')}
                  </Button>
                </ConfigProvider>
              </div>
            </div> */}
          </div>
        </div>
      </UniversalModal>
    );
  }
}

export default OntoEdgesModal;

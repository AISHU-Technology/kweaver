/**
 * 特定点批量建边
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, ConfigProvider, Button, Empty } from 'antd';

import IconFont from '@/components/IconFont';
import { setColor } from './assistFunction';

import kong from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;
const PAGESIZE = 10;
const REGTHREE = /^\w+$/g;

class NodeToEdgesModal extends Component {
  state = {
    nodes: [],
    addEdges: [
      {
        lineLength: 200,
        colour: setColor(),
        startName: this.props.selectedElement.name,
        startId: this.props.selectedElement.entity_id,
        endName: undefined,
        endId: '',
        name: undefined,
        disable: 'start'
      }
    ], // 添加的边
    page: 1, // 页码
    edgeHasError: {
      status: false,
      index: 0,
      content: ''
    }
  };

  componentDidMount() {
    this.setState({
      nodes: this.props.nodes
    });
  }

  /**
   * @description 添加边
   */
  addEdge = () => {
    if (this.checkData()) {
      return;
    }

    const { selectedElement } = this.props;
    let { addEdges } = this.state;

    addEdges = [
      ...addEdges,
      {
        lineLength: 200,
        colour: setColor(),
        startName: selectedElement.name,
        startId: selectedElement.entity_id,
        endName: undefined,
        endId: '',
        name: undefined,
        disable: 'start'
      }
    ];

    this.setState(
      {
        addEdges,
        page: Math.ceil(addEdges.length / PAGESIZE)
      },
      () => {
        document.getElementById('scrollBoxRight') && document.getElementById('scrollBoxRight').scrollTo(0, 10000);
      }
    );
  };

  /**
   * @description 删除边
   */
  deleteEdge = deleteIndex => {
    // eslint-disable-next-line prefer-const
    let { addEdges, edgeHasError } = this.state;

    if (addEdges.length === 1) {
      addEdges[0] = {
        lineLength: 200,
        colour: addEdges[0].colour,
        startName: addEdges[0].disable === 'start' ? addEdges[0].startName : undefined,
        startId: addEdges[0].disable === 'start' ? addEdges[0].startId : '',
        endName: addEdges[0].disable === 'end' ? addEdges[0].endName : undefined,
        endId: addEdges[0].disable === 'end' ? addEdges[0].endId : '',
        name: undefined,
        disable: addEdges[0].disable
      };

      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });
    } else {
      addEdges = addEdges.filter((_item, index) => {
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
  selectStart = (option, index) => {
    const { addEdges } = this.state;

    if (`${addEdges[index].startName}_2_${addEdges[index].endName}` === addEdges[index].name) {
      addEdges[index].startName = option.data.name;
      addEdges[index].startId = option.data.entity_id;
      addEdges[index].name = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });
    } else {
      addEdges[index].startName = option.data.name;
      addEdges[index].startId = option.data.entity_id;

      if (!addEdges[index].name && addEdges[index].startName && addEdges[index].endName) {
        addEdges[index].name = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

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
   * @description 选择终点
   */
  selectEnd = (option, index) => {
    const { addEdges } = this.state;

    if (`${addEdges[index].startName}_2_${addEdges[index].endName}` === addEdges[index].name) {
      addEdges[index].endName = option.data.name;
      addEdges[index].endId = option.data.entity_id;
      addEdges[index].name = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });
    } else {
      addEdges[index].endName = option.data.name;
      addEdges[index].endId = option.data.entity_id;

      if (!addEdges[index].name && addEdges[index].startName && addEdges[index].endName) {
        addEdges[index].name = `${addEdges[index].startName}_2_${addEdges[index].endName}`;

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
   * @description 改变边名
   */
  changeInput = (value, index) => {
    const { addEdges } = this.state;

    addEdges[index].name = value;

    this.setState({
      addEdges
    });

    if (REGTHREE.test(value) && value.length <= 50 && value !== '') {
      this.setState({
        edgeHasError: {
          status: false,
          index: 0,
          content: ''
        }
      });

      return;
    }

    if (value === '') {
      this.setState({
        edgeHasError: {
          status: true,
          index,
          content: intl.get('createEntity.inputNotEmpty')
        }
      });

      return;
    }

    if (value.length > 50) {
      this.setState({
        edgeHasError: {
          status: true,
          index,
          content: intl.get('createEntity.noMoreThan50')
        }
      });

      return;
    }

    if (!REGTHREE.test(value)) {
      this.setState({
        edgeHasError: {
          status: true,
          index,
          content: intl.get('createEntity.onlyType')
        }
      });
    }
  };

  /**
   * @description 复制边
   */
  copy = data => {
    if (this.checkData()) {
      return;
    }

    let { addEdges } = this.state;

    const newEdge = {
      lineLength: data.lineLength,
      colour: data.colour,
      startName: data.startName,
      startId: data.startId,
      endName: data.endName,
      endId: data.endId,
      name: data.name,
      disable: data.disable
    };

    addEdges = [...addEdges, newEdge];

    this.setState(
      {
        addEdges
      },
      () => {
        document.getElementById('scrollBoxRight') && document.getElementById('scrollBoxRight').scrollTo(0, 10000);
      }
    );
  };

  /**
   * @description 添加边集
   */
  save = () => {
    const { addEdges } = this.state;

    // 如果有错误，不能保存
    if (this.checkData()) {
      return;
    }

    this.props.freeGraphRef?.batchAddEdges?.(addEdges);
    this.props.setEdgesModal(false);
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

      if (!addEdges[i].name) {
        addEdges[i].name = '';
        hasError = true;

        this.setState({
          edgeHasError: {
            status: true,
            index: i,
            content: intl.get('createEntity.inputNotEmpty')
          }
        });
      }

      if (addEdges[i].name && addEdges[i].name.length > 50) {
        hasError = true;

        this.setState({
          edgeHasError: {
            status: true,
            index: i,
            content: intl.get('createEntity.noMoreThan50')
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
   * @description 交换数据
   */
  exchangeData = (data, index) => {
    const { addEdges } = this.state;

    const newEdges = {
      lineLength: data.lineLength,
      colour: data.colour,
      startName: data.endName,
      startId: data.endId,
      endName: data.startName,
      endId: data.startId,
      name: data.name
    };

    if (data.name === `${data.startName}_2_${data.endName}`) {
      newEdges.name = `${data.endName}_2_${data.startName}`;
    }

    if (data.disable === 'start') {
      newEdges.disable = 'end';
    } else {
      newEdges.disable = 'start';
    }

    addEdges[index] = newEdges;

    this.setState({
      addEdges
    });
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

    return (
      <div className="node-edges-modal">
        <div className="table">
          <div className="table-head">
            <div className="title tilte-1">{[intl.get('createEntity.startOnt')]}</div>
            <div className="title title-2">{[intl.get('createEntity.endOnt')]}</div>
            <div className="title title-3">{[intl.get('createEntity.reN')]}</div>
            <div className="title-right">{[intl.get('createEntity.op')]}</div>
          </div>

          <div className="content-box" id="scrollBoxRight">
            {addEdges &&
              addEdges.length > 0 &&
              addEdges.map((item, index) => {
                return (
                  <div className="table-content" key={index.toString()}>
                    <div className={item.startName === '' ? 'select-box-error' : 'select-box'}>
                      <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                        <Select
                          showSearch
                          className="select-name"
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                          placeholder={[intl.get('createEntity.sp')]}
                          disabled={item.disable === 'start'}
                          value={item.startName || undefined}
                          listHeight={32 * 4}
                          onChange={(_value, option) => {
                            this.selectStart(option, index);
                          }}
                        >
                          {nodes.map(item => {
                            return (
                              <Option value={item.name} key={item.name} data={item}>
                                {/* {item.alias ? `${item.name}【${item.alias}】` : item.name} */}
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
                          this.exchangeData(item, index);
                        }}
                      />
                    </div>

                    <div className={item.endName === '' ? 'select-box-error' : 'select-box'}>
                      <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
                        <Select
                          showSearch
                          className="select-name"
                          getPopupContainer={triggerNode => triggerNode.parentElement}
                          placeholder={[intl.get('createEntity.sp')]}
                          disabled={item.disable === 'end'}
                          value={item.endName || undefined}
                          listHeight={32 * 4}
                          onChange={(_value, option) => {
                            this.selectEnd(option, index);
                          }}
                        >
                          {nodes.map(item => {
                            return (
                              <Option value={item.name} key={item.name} data={item}>
                                {/* {item.alias ? `${item.name}【${item.alias}】` : item.name} */}
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
                        edgeHasError.status && edgeHasError.index === index ? 'select-box-error' : 'select-box'
                      }
                    >
                      <Input
                        className="input-relation"
                        placeholder={[intl.get('createEntity.rp')]}
                        value={item.name}
                        disabled={edgeHasError.status && edgeHasError.index !== index}
                        onChange={e => {
                          this.changeInput(e.target.value, index);
                        }}
                      />

                      <div className="error-word">
                        {edgeHasError.status && edgeHasError.index === index ? edgeHasError.content : null}
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

            <div className="add-edge" onClick={this.addEdge}>
              <IconFont type="icon-Add" className="icon" />
              <span>{[intl.get('createEntity.add')]}</span>
            </div>
          </div>

          <div className="bottom-button">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default cancel"
                onClick={() => {
                  this.props.setEdgesModal(false);
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
            </ConfigProvider>

            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button type="primary" className="save" onClick={this.save}>
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          </div>
        </div>
      </div>
    );
  }
}

NodeToEdgesModal.defaultProps = {
  setEdgesModal: () => {},
  selectedElement: {},
  nodes: {},
  freeGraphRef: {}
};

export default NodeToEdgesModal;

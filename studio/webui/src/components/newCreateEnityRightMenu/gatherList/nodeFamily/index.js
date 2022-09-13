import React, { Component, createRef } from 'react';
import intl from 'react-intl-universal';
import { Tooltip, Checkbox, Button, Modal, ConfigProvider, message } from 'antd';
import { ExclamationCircleOutlined, InfoCircleFilled } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import ScrollBar from '@/components/ScrollBar';

import emptyImg from '@/assets/images/empty.svg';
import './style.less';

class NodeFamily extends Component {
  state = {
    checkDelete: [], // 需要删除的点的唯一标识集合
    modalVisible: false,
    deleteOne: ''
  };

  scrollRef = createRef();

  componentDidMount() {
    this.props.onNodeFamilyRef(this.scrollRef.current?.scrollBars);
  }

  changeCheck = (e, data) => {
    let { checkDelete } = this.state;

    if (e.target.checked) {
      checkDelete = [...checkDelete, data.entity_id];
    } else {
      checkDelete = checkDelete.filter((item, index) => {
        return item !== data.entity_id;
      });
    }

    this.setState({
      checkDelete
    });
  };

  /**
   * @description 判断节点是否重复
   * @param {object} node 节点
   * @param {number} index 节点所在数组里的下标
   */
  isRepeatNode = (node, index) => {
    const { nodes, edges } = this.props;
    const all = [...nodes, ...edges];
    const reg = /^\w+$/;
    const maxLength = 50;

    if (!reg.test(node.name) || node.name.length > maxLength) {
      return true;
    }

    for (let i = 0; i < all.length; i++) {
      if (
        (node.name && all[i].name && node.name.toLowerCase() === all[i].name.toLowerCase() && index !== i) ||
        (node.alias && all[i].alias && node.alias.toLowerCase() === all[i].alias.toLowerCase() && index !== i)
      ) {
        return true;
      }
    }

    return false;
  };

  /**
   * @description 是否要删除
   */
  isInDelete = data => {
    const { checkDelete } = this.state;

    if (checkDelete.includes(data.entity_id)) {
      return true;
    }

    return false;
  };

  /**
   * @description 全选点
   */
  checkAllNode = e => {
    if (e.target.checked) {
      const { nodes } = this.props;

      let checkDelete = [];

      for (let i = 0; i < nodes.length; i++) {
        checkDelete = [...checkDelete, nodes[i].entity_id];
      }

      this.setState({
        checkDelete
      });

      return;
    }

    this.setState({
      checkDelete: []
    });
  };

  /**
   * @description 一键删除
   */
  deleteNode = () => {
    const { checkDelete } = this.state;

    if (!checkDelete.length) {
      return;
    }

    this.setState({
      modalVisible: true
    });
  };

  /**
   * @description 弹框删除确认
   */
  deleteInfo = () => {
    // eslint-disable-next-line prefer-const
    let { checkDelete, deleteOne } = this.state;

    if (deleteOne) {
      checkDelete = checkDelete.filter((item, index) => {
        return item !== deleteOne[0];
      });
      this.props.freeGraphRef.deleteNodes(deleteOne);

      this.setState({
        checkDelete,
        modalVisible: false,
        deleteOne: ''
      });
    } else {
      this.props.freeGraphRef.deleteNodes(checkDelete);

      this.setState({
        checkDelete: [],
        modalVisible: false,
        deleteOne: ''
      });
    }

    message.success([intl.get('createEntity.deleteSuc')]);
  };

  /**
   * @description 跳转详情
   */
  rowOnclick = node => {
    this.props.setSelectedElement(node);
    this.props.selectRightTool('dataInfo');
  };

  /**
   * @description 是否在流程中
   */
  isFlow = () => {
    if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
      return true;
    }

    return false;
  };

  analyUrl = url => {
    if (this.isFlow()) {
      return { name: '', type: '' };
    }

    if (url === '') {
      return { name: '', type: '' };
    }

    return { name: url.split('&')[0].substring(13), type: url.split('&')[1].substring(5) };
  };

  /**
   * @description tip展示
   */
  tipShow = data => {
    if (data.alias) {
      return (
        <div>
          <div className="name-tip">{[intl.get('createEntity.ecn')]}</div>
          <div className="des-tip">{data.name}</div>
          <div className="nick-name">{[intl.get('createEntity.acn')]}</div>
          <div className="des-tip">{data.alias}</div>
        </div>
      );
    }

    return (
      <div>
        <div className="name-tip">{[intl.get('createEntity.ecn')]}</div>
        <div className="des-tip">{data.name}</div>
        <div className="nick-name">{[intl.get('createEntity.acn')]}</div>
        <div className="des-tip">- -</div>
      </div>
    );
  };

  render() {
    const { nodes } = this.props;
    const { checkDelete, modalVisible } = this.state;
    const TYPE = window?.location?.pathname?.includes('knowledge')
      ? 'view'
      : this.analyUrl(window.location.search).type; // 进入图谱的类型 // 进入图谱的类型

    return (
      <div className="new-node-family">
        <ScrollBar
          autoHeight
          autoHeightMin={this.isFlow() ? '669px' : '725px'}
          autoHeightMax={this.isFlow() ? 'calc(100vh - 290px)' : 'calc(100vh - 234px)'}
          isshowx="false"
          color="rgb(184,184,184)"
          ref={this.scrollRef}
          onScroll={e => {
            if (e.target.scrollTop === 0) {
              window.scrollTo(0, 0);
            }

            if (e.target.scrollTop === 925) {
              window.scrollTo(0, 100000);
            }
          }}
        >
          <div className="node-family">
            {nodes && nodes.length > 0 ? (
              nodes.map((item, index) => {
                return (
                  <div
                    className={
                      this.isRepeatNode(item, index)
                        ? 'row-repeat all-row'
                        : this.isInDelete(item)
                        ? 'all-row-checked'
                        : index === 0
                        ? 'all-row all-row-top'
                        : 'all-row'
                    }
                    key={index.toString()}
                  >
                    {TYPE === 'view' ? null : (
                      <Checkbox
                        className="check-data-row"
                        checked={this.isInDelete(item)}
                        onChange={e => {
                          this.changeCheck(e, item);
                        }}
                      />
                    )}

                    <div
                      className="row"
                      onClick={() => {
                        this.rowOnclick(item);
                      }}
                    >
                      <div className="color" style={{ backgroundColor: item.colour }}></div>
                      <div className="name">
                        <div className="ori-name" title={item.alias}>
                          {item.alias}
                        </div>
                      </div>

                      <div className="repeat">
                        {this.isRepeatNode(item, index) ? (
                          <Tooltip
                            placement="bottom"
                            title={[intl.get('createEntity.configError')]}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                          >
                            <ExclamationCircleOutlined />
                          </Tooltip>
                        ) : null}
                      </div>

                      {TYPE === 'view' ? null : (
                        <div className="delete">
                          <IconFont
                            type="icon-lajitong"
                            className="icon"
                            onClick={e => {
                              e.stopPropagation();

                              this.setState({
                                modalVisible: true,
                                deleteOne: [item.entity_id]
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">
                <img className="icon" src={emptyImg} alt="noData" />
                <div className="word">{[intl.get('createEntity.noData')]}</div>
              </div>
            )}
          </div>
        </ScrollBar>

        {TYPE !== 'view' && nodes && nodes.length > 0 ? (
          <div className="select-all-check">
            <Checkbox
              className="check-data"
              onChange={this.checkAllNode}
              indeterminate={nodes.length !== checkDelete.length && checkDelete.length !== 0}
              checked={nodes && nodes.length === checkDelete.length && checkDelete.length !== 0}
            >
              {[intl.get('createEntity.selectAll')]}
            </Checkbox>

            <Button className="ant-btn-default delete" onClick={this.deleteNode}>
              {[intl.get('createEntity.deleteAll')]}
            </Button>
          </div>
        ) : null}

        <Modal
          className="delete-create-info-45679"
          visible={modalVisible}
          bodyStyle={{ height: 92 }}
          footer={[
            <ConfigProvider key="deleteNodeGroup" autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setState({
                    modalVisible: false,
                    deleteOne: ''
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
          <div className="content-word">{[intl.get('createEntity.groupDelete')]}</div>
        </Modal>
      </div>
    );
  }
}

NodeFamily.defaultProps = {
  onNodeFamilyRef: () => {}
};

export default NodeFamily;

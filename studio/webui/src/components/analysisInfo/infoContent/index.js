/* eslint-disable */
/**
 * 标注展示
 *
 * @author Eden
 * @date 2021/1/26
 *
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Collapse } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';

import { wrapperTitle } from '@/utils/handleFunction';

import emptyImg from '@/assets/images/empty.svg';
import listentity from '@/assets/images/listentity.svg';
import listproperty from '@/assets/images/listproperty.svg';
import './style.less';

const { Panel } = Collapse;

class InfoContent extends Component {
  state = {
    selectedTag: 'left',
    nodes: []
  };

  componentDidMount() {
    this.initData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.bottomLines !== this.props.bottomLines) {
      this.initData();
    }
  }

  /**
   * @description 切换列表
   * @param {string} selectedTag 所选列表
   */
  changeTag = selectedTag => {
    this.setState({
      selectedTag
    });
  };

  /**
   * @description 初始化数据
   */
  initData = () => {
    const { bottomLines } = this.props;
    let nodes = [];

    for (let i = 0; i < bottomLines.length; i++) {
      const signal = this.isInNodes(nodes, bottomLines[i]);

      if (signal === -1) {
        nodes = [
          ...nodes,
          {
            entity: bottomLines[i].entity,
            color: bottomLines[i].color,
            alias: bottomLines[i].alias,
            property: [
              {
                name: bottomLines[i].property,
                text: [bottomLines[i].text]
              }
            ]
          }
        ];
      } else {
        const proSingal = this.isInProperty(nodes[signal].property, bottomLines[i]);

        if (proSingal === -1) {
          nodes[signal].property = [
            ...nodes[signal].property,
            {
              name: bottomLines[i].property,
              text: [bottomLines[i].text],
              alias: bottomLines[i].alias
            }
          ];
        } else {
          nodes[signal].property[proSingal].text = [...nodes[signal].property[proSingal].text, bottomLines[i].text];
        }
      }
    }

    // 属性去重
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes[i].property.length; j++) {
        nodes[i].property[j].text = this.unique(nodes[i].property[j].text);
      }
    }

    this.setState({
      nodes
    });
  };

  /**
   * @description 是否在nodes里
   */
  isInNodes = (nodes, data) => {
    for (let i = 0; i < nodes.length; i++) {
      if (data.entity === nodes[i].entity) {
        return i;
      }
    }

    return -1;
  };

  isInProperty = (property, data) => {
    for (let i = 0; i < property.length; i++) {
      if (property[i].name === data.property) {
        return i;
      }
    }

    return -1;
  };

  unique = arr => {
    return Array.from(new Set(arr));
  };

  /**
   * @description tip展示
   */
  tipShow = data => {
    if (data.alias) {
      return (
        <div>
          <div className="name-tip">{[intl.get('createEntity.ecn')]}</div>
          <div className="des-tip">{data.entity}</div>
          <div className="nick-name">{[intl.get('createEntity.acn')]}</div>
          <div className="des-tip">{data.alias}</div>
        </div>
      );
    }

    return (
      <div>
        <div className="name-tip">{[intl.get('createEntity.ecn')]}</div>
        <div className="des-tip">{data.entity}</div>
        <div className="nick-name">{[intl.get('createEntity.acn')]}</div>
        <div className="des-tip">- -</div>
      </div>
    );
  };

  setHead = item => {
    return (
      <div className="head-node-display">
        <div className="node-color" style={{ background: item.color }}></div>
        {/* <Tooltip title={this.tipShow(item)} getPopupContainer={triggerNode => triggerNode.parentElement}> */}
        <div className="node-name">
          <div className="name" title={wrapperTitle(item.alias)}>
            {item.alias}
          </div>
          {/* <div className="alias">{intl.get('createEntity.alias')}{item.alias ? item.alias : '--'}</div> */}
        </div>
        {/* </Tooltip> */}
      </div>
    );
  };

  render() {
    const { selectedTag, nodes } = this.state;

    return (
      <div className="info-content">
        <div className="head">
          <div
            className={selectedTag === 'left' ? 'left-tag tag-selected' : 'left-tag'}
            onClick={() => {
              this.changeTag('left');
            }}
          >
            {intl.get('searchGraph.entityList')}
          </div>
          <div
            className={selectedTag === 'left' ? 'right-tag' : 'right-tag tag-selected'}
            onClick={() => {
              this.changeTag('right');
            }}
          >
            {intl.get('searchGraph.reList')}
          </div>
        </div>

        <div className="content">
          {selectedTag === 'left' && nodes && nodes.length > 0 ? (
            <Collapse
              accordion
              ghost
              expandIconPosition={'right'}
              expandIcon={({ isActive }) => <CaretDownOutlined rotate={isActive ? 180 : 0} className="down-icon" />}
            >
              {nodes.map((item, index) => {
                return (
                  <Panel key={index.toString()} header={this.setHead(item)}>
                    {item &&
                      item.property &&
                      item.property.length > 0 &&
                      item.property.map((pItem, pIndex) => {
                        return (
                          <div className="line" key={pIndex.toString()}>
                            <div className="node" title={pItem.name}>
                              <img src={listproperty} alt="AnyDATA" />
                              <span className="word">{pItem.name}</span>
                            </div>
                            {pItem &&
                              pItem.text &&
                              pItem.text.length > 0 &&
                              pItem.text.map((tItem, tIndex) => {
                                return tIndex ? (
                                  <div className="property property-border" title={tItem} key={tIndex.toString()}>
                                    <img className="icon-left" src={listentity} alt="AnyDATA" />
                                    <span className="word">{tItem}</span>
                                  </div>
                                ) : (
                                  <div className="property" title={tItem} key={tIndex.toString()}>
                                    <img className="icon-left" src={listentity} alt="AnyDATA" />
                                    <span className="word">{tItem}</span>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </Panel>
                );
              })}
            </Collapse>
          ) : (
            <div className="no-data">
              <div className="image">
                <img src={emptyImg} alt="AnyDATA" className="no-data-image" />
              </div>
              <div className="describe">{intl.get('createEntity.noData')}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

InfoContent.defaultProps = {
  bottomLines: []
};

export default InfoContent;

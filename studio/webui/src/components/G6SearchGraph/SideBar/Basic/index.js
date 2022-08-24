/**
 * @description 实体基本信息
 * @author Eden
 * @date 2022/01/20
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { Radio } from 'antd';
import intl from 'react-intl-universal';
import kong from '@/assets/images/kong.svg';
import './style.less';

const SHOW_INFO = [{ n: 'id' }, { n: 'class' }];
class Basic extends Component {
  state = {
    check: 'info'
  };

  render() {
    const { selectedNode, showNodeProperty, setShowNodeProperty, showEdgeProperty } = this.props;
    const { check } = this.state;
    let property = [];
    let selectedNodeClass = '';
    if (selectedNode) {
      selectedNodeClass = selectedNode.class || selectedNode.data.class;
      property = selectedNode.properties || selectedNode.data.properties;
    }

    return (
      <div className="class-basic-info">
        <div className="class-basic-info-title">{intl.get('searchGraph.baseInfo')}</div>
        {selectedNode ? (
          <>
            <div className="head">
              <div
                className={
                  check === 'info' ? 'basicinfo-header-box-checked left-border' : 'basicinfo-header-box left-border'
                }
                onClick={() => {
                  this.setState({
                    check: 'info'
                  });
                }}
              >
                {intl.get('searchGraph.attribute')}
              </div>
              <div
                className={
                  check === 'showSet'
                    ? 'basicinfo-header-box-checked right-border'
                    : 'basicinfo-header-box right-border'
                }
                onClick={() => {
                  this.setState({
                    check: 'showSet'
                  });
                }}
              >
                {intl.get('searchGraph.display')}
              </div>
            </div>
            {check === 'info' ? (
              <div className="property-show">
                {property.map((item, index) => {
                  return (
                    <div className="property-line" key={index.toString()}>
                      <div className="key" title={item.n}>
                        {item.n}
                      </div>
                      <div className="value" title={item.v}>
                        {item.v}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="show-seting">
                <p>{intl.get('searchGraph.selectDes')}</p>
                <Radio.Group
                  onChange={e => {
                    const type = selectedNode.source ? 'edge' : 'node';
                    setShowNodeProperty({ key: selectedNodeClass, value: e.target.value }, type);
                  }}
                  value={
                    selectedNode.source ? showEdgeProperty?.[selectedNodeClass] : showNodeProperty?.[selectedNodeClass]
                  }
                >
                  <div className="set-show-item">
                    <Radio value="name">name</Radio>
                  </div>
                  {_.map(SHOW_INFO.concat(property), item => {
                    if (item.n === 'name') return;
                    return (
                      <div className="set-show-item" key={item.n}>
                        <Radio value={item.n} key={item.n}>
                          {item.n}
                        </Radio>
                      </div>
                    );
                  })}
                </Radio.Group>
              </div>
            )}
          </>
        ) : (
          <div className="no-basic-info">
            <img src={kong} alt="noinfamation" className="basic-nodata-image"></img>
            <div className="word">{intl.get('searchGraph.nullDes')}</div>
          </div>
        )}
      </div>
    );
  }
}

export default Basic;

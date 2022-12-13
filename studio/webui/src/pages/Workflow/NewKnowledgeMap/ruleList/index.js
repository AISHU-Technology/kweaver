/**
 * 信息抽取列表
 */

import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';

import { switchIcon, formatModel } from '@/utils/handleFunction';
import ScrollBar from '@/components/ScrollBar';

import './style.less';

const { Panel } = Collapse;

class RuleList extends Component {
  /**
   * @description 信息抽取列表按实体类名分组
   */
  setListData = rules => {
    let entityType = [];
    let entityList = [];

    rules.forEach(item => {
      if (!entityType.includes(item.entity_type)) {
        entityType = [...entityType, item.entity_type];
        entityList = [...entityList, { name: item.entity_type, property: [item.property.property_field] }];
        return;
      }

      entityList.forEach(listItem => {
        if (listItem.name === item.entity_type) {
          listItem.property = [...listItem.property, item.property.property_field];
        }
      });
    });

    return entityList;
  };

  /**
   * @description 渲染选择内容
   */
  fileHead = data => {
    let path = data.file_path;
    let name = '';

    if (path.length > 30) {
      let newPath = '';
      const int = parseInt(path.length / 30);
      const residue = path.length % 30;

      for (let i = 1; i <= int; i++) {
        newPath = `${newPath + path.substring(i * 30 - 30, i * 30)}\n`;
      }

      if (residue) newPath += path.substring(path.length - residue, path.length);
      path = newPath;
    }

    if (!['hive', 'mysql', 'rabbitmq'].includes(data.data_source) && !data.extract_model) {
      name = data.file_name.split('.');
      name = name[name.length - 1];
    }

    return (
      <div className="filehead">
        <div className="title-on174zt">
          {data.file_type === 'dir'
            ? switchIcon('dir', '', 34)
            : data.data_source.includes('as')
            ? switchIcon('file', data.file_name, 34)
            : switchIcon('sheet', '', 34)}
          <span className="big-select-modal-onl74zt" title={data.file_name}>
            {data.file_name}
          </span>
        </div>

        <div className="box-onl74zt">
          <span className="little-select-modal-onl74zt" title={path}>
            {data.file_path}
          </span>
        </div>

        <div className="box-onl74zt-c">
          <span className="little-select-modal-onl74zt-c" title={this.setShowSource(data.data_source)}>
            {this.setShowSource(data.data_source)}
          </span>

          {data.extract_model ? (
            <span className="little-select-modal-onl74zt-c" title={formatModel(data.extract_model)}>
              {formatModel(data.extract_model)}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  /**
   * @description 信息抽取实体名称
   */
  entityHead = name => {
    return (
      <div className="entity-class">
        <div className="tips">{[intl.get('workflow.knowledge.entityClass')]}：</div>
        <div className="entity-name" title={name}>
          {name}
        </div>
      </div>
    );
  };

  setShowSource = data => {
    if (data === 'as7') return 'AnyShare7';
    if (data === 'as') return 'AnyShare';
    if (data === 'mysql') return 'MySQL';
    if (data === 'hive') return 'Hive';
    if (data === 'rabbitmq') return 'RabbitMQ';
  };

  /**
   * @description 最后panel的样式
   */
  lastPanel = (rulesIndex, length) => {
    if (!rulesIndex) return 'white entity-panel';
    if (rulesIndex === length) return 'white last-panel';
    return 'white';
  };

  render() {
    const { infoExtrData } = this.props;

    return (
      <div className="rule-list-content">
        <div className="title">
          <span className="word">{[intl.get('workflow.knowledge.infoList')]}</span>
        </div>
        <ScrollBar
          className="scrollbar"
          isshowx="false"
          color="rgb(184,184,184)"
          style={{ height: 'calc(100% - 58px)' }}
        >
          <div className="rule-list-box"></div>
          <Collapse
            accordion
            bordered={false}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
          >
            {infoExtrData &&
              infoExtrData.length > 0 &&
              infoExtrData.map((item, index) => {
                return (
                  <Panel className={index ? '' : 'normal-panel'} header={this.fileHead(item)} key={index.toString()}>
                    <Collapse
                      className="rule-collapse"
                      bordered={false}
                      expandIcon={({ isActive }) => (
                        <CaretRightOutlined className="rotate-icon" rotate={isActive ? 90 : 0} />
                      )}
                    >
                      {this.setListData(item.extract_rules).map((rulesItem, rulesIndex) => {
                        return (
                          <Panel
                            className={this.lastPanel(rulesIndex, this.setListData(item.extract_rules).length - 1)}
                            header={this.entityHead(rulesItem.name)}
                            key={rulesIndex.toString()}
                          >
                            <div className="property-list">
                              {rulesItem.property.map((proItem, proIndex) => {
                                return (
                                  <div className="line" key={proIndex.toString()}>
                                    <div className="icon"></div>
                                    <div className="word" title={proItem}>
                                      {proItem}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Panel>
                        );
                      })}
                    </Collapse>
                  </Panel>
                );
              })}
          </Collapse>
        </ScrollBar>
      </div>
    );
  }
}

export default RuleList;

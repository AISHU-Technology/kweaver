import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Select, ConfigProvider, Empty } from 'antd';

import servicesCreateEntity from '@/services/createEntity';

import DataBase from './database';
import AnyShare from './anyshare';
import RabbitMQ from './rabbitMQ';

import AS from '@/assets/images/as.svg';
import hive from '@/assets/images/hive.svg';
import kong from '@/assets/images/kong.svg';
import mqImg from '@/assets/images/rabbitmq.svg';
import MySQL from '@/assets/images/CocoaMySQL.svg';
import './style.less';

const { Option } = Select;

class SourceImport extends Component {
  state = {
    dsName: [],
    selectedValue: {
      createuser: '',
      dataType: '',
      data_source: '',
      dsname: '',
      extract_type: '',
      id: 0,
      updatetime: ''
    }
  };

  componentDidMount() {
    this.getAllEntityData();
  }

  /**
   * @description 页面加载时获取所有数据源数据
   */
  getAllEntityData = async () => {
    // 加载开始
    this.props.openLoading();

    let resData = '';

    // 在流程三中
    if (this.isFlow()) {
      const data = {
        id: this.props.graphId,
        type: 'filter'
      };

      resData = await servicesCreateEntity.getFlowSource(data);
    } else {
      resData = await servicesCreateEntity.getSource();
    }

    if (resData && resData.res && resData.res.df && resData.res.df.length > 0) {
      this.setState({
        dsName: resData.res.df,
        selectedValue: resData.res.df[0]
      });
    }

    // 加载开始
    this.props.closedLoading();
  };

  /**
   * @description 获取图片
   */
  getImage = item => {
    if (item.data_source === 'hive') {
      return <img className="icon-ti" src={hive} alt="KWeaver" />;
    }

    if (item.data_source === 'as' || item.data_source === 'as7') {
      return <img className="icon-ti" src={AS} alt="KWeaver" />;
    }

    if (item.data_source === 'mysql') {
      return <img className="icon-ti" src={MySQL} alt="KWeaver" />;
    }

    if (item.data_source === 'rabbitmq') {
      return <img className="icon-ti" src={mqImg} alt="KWeaver" />;
    }

    return null;
  };

  /**
   * @description 自定义结果空白页
   */
  customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kong} description={[intl.get('createEntity.noData')]} style={{ marginTop: 10 }} />
    </div>
  );

  /**
   * @description 是否在流程中
   */
  isFlow = () => {
    if (window.location.pathname === '/home/workflow/edit' || window.location.pathname === '/home/workflow/create') {
      return true;
    }

    return false;
  };

  render() {
    const { dsName, selectedValue } = this.state;

    return (
      <div className="source-import">
        <div className="source-name">
          {/* <div className="source-title">
            <label className="name">{[intl.get('createEntity.dataName')]}</label>
          </div> */}

          <ConfigProvider renderEmpty={this.customizeRenderEmpty}>
            <Select
              className="source-select"
              // showSearch={true}
              getPopupContainer={triggerNode => triggerNode.parentElement}
              value={selectedValue.dsname}
              virtual={false}
              onChange={(value, option) => {
                this.setState({
                  selectedValue: option.data
                });
              }}
            >
              {dsName.map((item, index) => {
                return (
                  <Option value={item.dsname} key={index.toString()} data={item}>
                    <div className="select-style">
                      <div className="image">{this.getImage(item)}</div>
                      <div className="word">
                        <div className="line-one">{item.dsname}</div>
                        <div className="line-two">{item.ds_path}</div>
                      </div>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </ConfigProvider>
        </div>

        <div className="select-result">
          {['mysql', 'hive', ''].includes(selectedValue.data_source) && (
            <DataBase selectedValue={selectedValue} setSaveData={this.props.setSaveData} />
          )}

          {['as', 'as7'].includes(selectedValue.data_source) && (
            <AnyShare selectedValue={selectedValue} setSaveData={this.props.setSaveData} />
          )}

          {['rabbitmq'].includes(selectedValue.data_source) && (
            <RabbitMQ selectedValue={selectedValue} setSaveData={this.props.setSaveData} />
          )}
        </div>
      </div>
    );
  }
}

export default SourceImport;

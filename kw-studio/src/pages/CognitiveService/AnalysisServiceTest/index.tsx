/**
 * 认知服务-服务测试
 */
import React, { useState, useEffect, useMemo } from 'react';
import { message, Button, Menu, Dropdown } from 'antd';
import { LeftOutlined, DownOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import analysisService from '@/services/analysisService';
import { getParam } from '@/utils/handleFunction';
import CanvasContainer from './CanvasContainer';
import { ANALYSIS_SERVICES } from '@/enums';
import './style.less';
import NeighborContainer from './Neighbors';
import PathContainer from './Paths';

import TemplateDataAssetInventory from '@/pages/KnowledgeNetwork/ExploreGraph/GraphContainer/TemplateGraph/DataAssetInventory';

const DEFAULT_BODY = {
  page: 1,
  size: 1000,
  order_type: 'desc',
  order_field: 'edit_time'
};
const { SEARCH_TYPE } = ANALYSIS_SERVICES;

const AnalysisServiceTest = (props: any) => {
  const { iframeFrom } = getParam();
  const { sId = '', serviceId = '', canSelectSever = true, operation_type = '' } = props;
  const history = useHistory();
  const [serviceInfo, setServiceInfo] = useState<Record<string, any>>({ id: serviceId }); // 认知服务数据
  const [serviceList, setServiceList] = useState<any[]>([]); // 所有服务

  const operationType = useMemo(() => {
    return operation_type || serviceInfo?.operation_type || getParam('operation_type');
  }, [operation_type, serviceInfo]);

  useEffect(() => {
    if (!canSelectSever) return;
    init();
  }, []);

  const init = async () => {
    const id = getParam('service_id');
    if (!id) return;
    try {
      // const knw_id = getParam('knw_id');
      const { res }: any = (await analysisService.analysisServiceList({ ...DEFAULT_BODY })) || {};

      if (res) {
        const service = _.find(res.results, s => String(s.id) === String(id));
        const sInfo = service || { id };
        setServiceInfo(sInfo);
        setServiceList(res.results || []);
      }
    } catch (err) {
      const { Description } = err?.response || err || {};
      Description && message.error(Description);
    }
  };

  /**
   * 退出
   */
  const onExit = async () => {
    history.push('/cognitive-application/domain-analysis');
  };

  const SERVICE_MENUS = serviceList?.length ? (
    <Menu className="kw-analysis-iframe-dropdown" selectedKeys={[String(serviceInfo.id)]}>
      {_.map(serviceList, item => {
        const { name, id } = item;
        const selected = String(item?.id) === id;
        return (
          <Menu.Item
            key={String(id)}
            className={classNames({ selected })}
            style={{ height: 40 }}
            onClick={() => setServiceInfo(item)}
          >
            <div className="kw-ellipsis" style={{ maxWidth: 196 }} title={name}>
              {name}
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  ) : (
    <></>
  );

  return (
    <div className="analysis-service-test-root kw-flex-column kw-h-100">
      {canSelectSever && (
        <div className="top-header kw-align-center">
          <Button onClick={onExit} type="text" className="kw-pl-6">
            <LeftOutlined />
            <span>{intl.get('global.exit')}</span>
          </Button>
          <div className="t-line kw-mr-3" />
          <Dropdown overlay={SERVICE_MENUS} trigger={['click']} placement="bottomLeft">
            <div className="s-name kw-align-center kw-pointer">
              <div className="kw-ellipsis" style={{ maxWidth: 160 }}>
                {serviceInfo.name || ''}
              </div>
              <DownOutlined className="kw-ml-2" style={{ fontSize: 13 }} />
            </div>
          </Dropdown>
        </div>
      )}
      {iframeFrom === 'af-template-asset' ? (
        <TemplateDataAssetInventory serviceInfo={serviceInfo} />
      ) : (
        <div className="container-wrapper">
          {/* 自定义查询 */}
          {operationType === SEARCH_TYPE.CUSTOM_SEARCH && (
            <CanvasContainer key={serviceInfo.id} serviceInfo={serviceInfo} sId={sId} />
          )}
          {/* 邻居 */}
          {operationType === SEARCH_TYPE.NEIGHBOR && (
            <NeighborContainer key={serviceInfo.id} serviceInfo={serviceInfo} sId={sId} />
          )}
          {/* 路径*/}
          {(operationType === SEARCH_TYPE?.ALL_PATH || operationType === SEARCH_TYPE.SHOREST_PATH) && (
            <PathContainer key={serviceInfo.id} serviceInfo={serviceInfo} sId={sId} />
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisServiceTest;

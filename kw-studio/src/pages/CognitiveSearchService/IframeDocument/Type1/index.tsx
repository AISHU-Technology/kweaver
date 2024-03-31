import React, { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import snapshotsService from '@/services/snapshotsService';

import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import { copyToBoard, getParam } from '@/utils/handleFunction';
import { PARAM_TYPE } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules/enums';

import './style.less';
import ParamTable from './paramTable';
const pageSize = 4;
const getDefaultRow = () => {
  return [
    {
      name: 'service_id',
      type: 'string',
      required: true,
      description: intl.get('cognitiveService.iframeDocument.descText')
    },
    {
      name: 'knw_id',
      type: 'string',
      required: true,
      description: intl.get('cognitiveSearch.knwDescription')
    }
  ];
};
const neighbors = [
  {
    name: 'vids',
    type: 'array',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.neighborVids')
  },
  {
    name: 'steps',
    type: 'array',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.neighborSteps')
  },
  {
    name: 'direction',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.neighborDirection')
  }
];
const Type1 = (props: any) => {
  const { origin, serviceId, appid, serviceData, openAppidModal, knw_id } = props;
  const [snapshotsId, setSnapshotsId] = useState<any>(''); // 选择应用的快照id
  const [isGetList, setIsGetList] = useState<boolean>(false); // 是否要获取快照列表
  const operation_type = getParam('operation_type');
  const language = HOOKS.useLanguage();
  const apiUrl = useMemo(() => {
    const applySId = snapshotsId ? `&s_id=${snapshotsId}` : '';
    return `${origin}/iframe/search?appid=${
      appid || '{your appid}'
    }&knw_id=${knw_id}&service_id=${serviceId}${applySId}`;
  }, [origin, serviceId, appid, snapshotsId]);

  const tableData = useMemo(() => {
    let data = getDefaultRow();
    if (operation_type === 'custom-search') {
      _.forEach(serviceData?.config_info?.params, param => {
        data.push({
          name: param.name,
          type: param.param_type,
          required: false,
          description: param.description
        });
      });
    }
    if (operation_type === 'neighbors') {
      // 邻居规则参数
      data = _.concat(data, neighbors);
      _.forEach(serviceData?.config_info?.filters, item => {
        const { v_filters, e_filters } = item;
        _.forEach(v_filters, v => {
          _.forEach(v?.property_filters, pro => {
            if (pro.type === PARAM_TYPE?._CUSTOMVAR) {
              const param = pro?.custom_param;
              data.push({
                name: param.name,
                type: 'string',
                required: false,
                description: param.description
              });
            }
          });
        });
        _.forEach(e_filters, e => {
          _.forEach(e?.property_filters, pro => {
            if (pro.type === PARAM_TYPE?._CUSTOMVAR) {
              const param = pro?.custom_param;
              data.push({
                name: param.name,
                type: 'string',
                required: false,
                description: param.description
              });
            }
          });
        });
      });
    }
    return data;
  }, [serviceId, serviceData]);

  const onCopy = () => {
    copyToBoard(apiUrl);
    message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  useEffect(() => {
    if (isGetList) {
      setIsGetList(false);
    }
  }, [appid]);

  return (
    <div className="IframeDocument-type1 kw-mt-3">
      <div className="kw-mt-3">
        {/* 您可以通过URL方式将服务内嵌 */}
        {intl.get('cognitiveService.iframeDocument.urlEmbed')}
      </div>
      <div className="url-input kw-flex kw-mt-3">
        <div className="url-text kw-ellipsis" title={apiUrl}>
          {apiUrl}
        </div>
        <div className="copy-btn kw-pointer" title={intl.get('global.copy')} onClick={onCopy}>
          <IconFont type="icon-copy" />
        </div>
      </div>

      <div className="url-explain">
        <h2>{intl.get('cognitiveService.iframeDocument.urlTitle')}</h2>
        <div className={language === 'zh-CN' ? 'break-div' : ''}>
          {intl.get('cognitiveService.iframeDocument.urlExplain1')}
        </div>
        <div className={language === 'zh-CN' ? 'break-div' : ''}>
          {intl.get('cognitiveService.iframeDocument.urlExplain3')}
        </div>
        <div className="kw-mt-5">
          <span>
            {/* 举例一：在服务配置中设置一个参数为A,且参数类型为单选 */}
            {intl.get('cognitiveService.iframeDocument.example1')}
          </span>
          <div className="kw-border kw-align-center urlBox">{`${apiUrl}&A=aa`}</div>
        </div>
        <div className="kw-mt-4">
          <span>
            {/* 举例二：在服务配置中设置一个参数为A,且参数类型为多选 */}
            {intl.get('cognitiveService.iframeDocument.example2')}
          </span>
          <div className="kw-border kw-align-center urlBox">{`${apiUrl}&A=aa$$bb`}</div>
        </div>
      </div>
      <div className="params-explain">
        <h2>{intl.get('cognitiveService.iframeDocument.paramTitle')}</h2>
        {/* <Table rowKey="name" columns={columns} dataSource={tableData} pagination={false} /> */}
        <ParamTable tableData={tableData} />
      </div>
    </div>
  );
};

export default Type1;

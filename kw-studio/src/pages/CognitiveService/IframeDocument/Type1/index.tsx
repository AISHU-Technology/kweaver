import React, { useEffect, useMemo, useState } from 'react';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import snapshotsService from '@/services/snapshotsService';

import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import { copyToBoard, getParam, isDef } from '@/utils/handleFunction';
import { PARAM_TYPE } from '@/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/ConfigPanel/ConfigureRules/enums';

import SnapshotsTable from './snapshotsTable';
import ParamTable from './paramTable';
import { DEFAULT_PARAMS, INIT_ALL_PATH, INIT_NEIGHBOR_PARAMS, INIT_SHORTEST_PATH } from './enums';
import { ANALYSIS_SERVICES } from '@/enums';

import { SearchType } from '@/pages/CognitiveService/AnalysisServiceConfig/types';
import './style.less';

const pageSize = 4;
const { SEARCH_TYPE } = ANALYSIS_SERVICES;

const getDefaultRow = (type: SearchType) => {
  if (type === SEARCH_TYPE.CUSTOM_SEARCH) {
    return DEFAULT_PARAMS;
  }
  if (type === SEARCH_TYPE.NEIGHBOR) {
    return _.concat(DEFAULT_PARAMS, INIT_NEIGHBOR_PARAMS);
  }
  if (type === SEARCH_TYPE.ALL_PATH) {
    return _.concat(DEFAULT_PARAMS, INIT_ALL_PATH);
  }
  if (type === SEARCH_TYPE.SHOREST_PATH) {
    return _.concat(DEFAULT_PARAMS, INIT_SHORTEST_PATH);
  }

  return DEFAULT_PARAMS;
};

const Type1 = (props: any) => {
  const { origin, serviceId, appid, serviceData, openAppidModal } = props;
  const [pagedata, setPagedata] = useState<{ page: number; total: number }>({ page: 1, total: 0 });
  const [snapshotsData, setSnapshotsData] = useState<any>([]);
  const [snapshotsId, setSnapshotsId] = useState<any>(''); // 选择应用的快照id
  const [isGetList, setIsGetList] = useState<boolean>(false); // 是否要获取快照列表
  const operation_type = getParam('operation_type');
  const language = HOOKS.useLanguage();
  const apiUrl = useMemo(() => {
    const applySId = snapshotsId ? `&s_id=${snapshotsId}` : '';
    return `${origin}/iframe/graph?appid=${
      appid || '{your appid}'
    }&operation_type=${operation_type}&service_id=${serviceId}${applySId}`;
  }, [origin, serviceId, appid, snapshotsId]);

  const tableData = useMemo(() => {
    let data = _.cloneDeep(getDefaultRow(operation_type));
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
      const defaultNeighborsMap = _.cloneDeep(_.keyBy(INIT_NEIGHBOR_PARAMS, 'name'));
      _.entries(_.pick(serviceData?.config_info, ['steps', 'direction', 'final_step'])).forEach(([key, value]) => {
        if (isDef(value)) {
          defaultNeighborsMap[key].defaultValue = value;
        }
        if (key === 'final_step') {
          defaultNeighborsMap[key].description = intl.get('analysisService.finalStepExplain', {
            steps: serviceData?.config_info?.steps
          });
        }
      });
      data = _.concat(data, _.values(defaultNeighborsMap));
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
    // 路径和服务可配置自定义参数规则
    if (['shortest-path', 'full-path'].includes(operation_type)) {
      // 路径规则参数
      _.forEach(serviceData?.config_info?.filters, item => {
        const { e_filters } = item;
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
      getSnapshots(1);
    }
  }, [appid]);

  /** 获取快照列表 */
  const getSnapshots = async (queryPage = pagedata.page) => {
    if (!appid) {
      setIsGetList(true);
      openAppidModal();
      return;
    }
    try {
      const getData: any = {
        kg_id: serviceData.kg_id,
        service_id: serviceId,
        page: queryPage,
        size: pageSize,
        appid
      };

      const { res } = (await snapshotsService.snapshotsGetList(getData)) || {};
      if (!res) return;
      const { count, snapshots } = res;
      setPagedata({ page: queryPage, total: count });
      setSnapshotsData(snapshots);
    } catch (error) {
      if (error.type !== 'message') return;
      if (error?.response?.ErrorDetails?.[0]?.detail) {
        message.error(error?.response?.ErrorDetails?.[0]?.detail);
      } else {
        message.error(error?.response?.ErrorCode);
      }
    }
  };

  return (
    <div className="IframeDocument-type1">
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
        <ParamTable tableData={tableData} type={operation_type} />
      </div>
      <div className="params-explain">
        <h2>
          {/* {'获取快照列表'} */}
          {intl.get('cognitiveService.iframeDocument.snashotsList')}
        </h2>
        <div>
          {/* 将服务内嵌访问时，可选择任意快照ID作为默认显示。 */}
          {intl.get('cognitiveService.iframeDocument.snashotsExplain1')}
        </div>
        <div>
          {/* 注意：若应用快照ID为-1，则显示最新快照内容。 */}
          {intl.get('cognitiveService.iframeDocument.snashotsExplain2')}
        </div>
        <div className="kw-mt-4">
          {/* 操作指引： */}
          {intl.get('cognitiveService.iframeDocument.snashotsOp')}
        </div>
        <div>
          {/* 1.点击下方【获取快照类】按钮，即可获取快照列表。 */}
          {intl.get('cognitiveService.iframeDocument.snashotsExplain3')}
        </div>
        <div>
          {/* 2.选择服务内嵌访问时默认显示快照内容并点击【应用】按钮，系统将自动更新URL。 */}
          {intl.get('cognitiveService.iframeDocument.snashotsExplain4')}
        </div>
        <Button
          className="kw-mt-3 kw-mb-3"
          type="primary"
          ghost
          style={{ height: 40, minWidth: 120 }}
          onClick={() => getSnapshots(1)}
        >
          {intl.get('cognitiveService.iframeDocument.snashotsList')}
          {/* 获取快照列表 */}
        </Button>
        <SnapshotsTable
          dataSource={snapshotsData}
          pagedata={pagedata}
          snapshotsId={snapshotsId}
          getSnapshots={getSnapshots}
          setSnapshotsId={setSnapshotsId}
        />
      </div>
    </div>
  );
};

export default Type1;

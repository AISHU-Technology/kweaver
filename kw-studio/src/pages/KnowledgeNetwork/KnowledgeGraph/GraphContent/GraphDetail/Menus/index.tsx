import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';

import { getParam } from '@/utils/handleFunction';
import IconFont from '@/components/IconFont';
import BasicInfo from './GraphInfo/BasicInfo';
import SummaryInfo from './GraphInfo/SummaryInfo';
import ConfigurationDetails from './GraphInfo/ConfigurationDetails';
import Statistics from './GraphInfo/Statistics';

import './style.less';

const INFO_LIST_INFO = [
  // {
  //   id: 'operate',
  //   icon: <DoubleLeftOutlined />,
  //   icon2: <DoubleRightOutlined />,
  //   intl: intl.get('graphDetail.open'),
  //   intl2: intl.get('graphDetail.close')
  // },
  {
    id: 'basicInfo',
    icon: <IconFont type="icon-iconzhengli_dangan" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.knGraphOverview')
  },
  {
    id: 'summaryInfo',
    icon: <IconFont type="icon-leibietongji" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.knGraphClassStatistic')
  },
  {
    id: 'statistics',
    icon: <IconFont type="icon-zhishangjisuan" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.knGraphIQ')
  },
  {
    id: 'configurationDetails',
    icon: <IconFont type="icon-wendang-xianxing" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.knGraphClassDetail')
  }
];

const Menus = (props: any) => {
  const { ad_graphStatus, refInstance } = props;
  const { selectedData, graphid, graphData, graphCount, graphBasicData } = props;
  const [isInit, setIsInit] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(() => {
    const key = getParam('tab_detail_key');
    if (['basicInfo', 'summaryInfo', 'configurationDetails', 'statistics'].includes(key)) return key;
    return null;
  });
  const isVisibleDrawer = !!activeKey;

  useImperativeHandle(refInstance, () => ({
    closeDrawer
  }));

  useEffect(() => {
    if (_.isEmpty(selectedData)) {
      if (!isInit) setActiveKey(null);
    } else {
      onClickMenu('configurationDetails')();
    }
  }, [selectedData?.data?.uid]);

  const onClickMenu = (id: string) => () => {
    setIsInit(false);
    if (id === 'operate') {
      setActiveKey(isVisibleDrawer ? null : 'basicInfo');
    } else if (id !== activeKey) {
      setActiveKey(id);
    }
  };

  const closeDrawer = () => {
    setActiveKey('');
  };

  return (
    <div className="graphMenusRoot">
      <div
        className={classnames(
          'infoList',
          { infoListOpen: isVisibleDrawer },
          { infoListClose: !isVisibleDrawer && !isInit }
        )}
      >
        {_.map(INFO_LIST_INFO, item => {
          const { id, icon, icon2, intl, intl2 } = item as any;
          const isSelected = id !== 'operate' && id === activeKey;
          const INTL = id === 'operate' && isVisibleDrawer ? intl2 : intl;
          const ICON: any = isVisibleDrawer ? icon2 || icon : icon;
          if (id === 'statistics') {
            return null;
          }
          return (
            <Tooltip title={INTL} key={id} placement="left" trigger={['click', 'hover']}>
              <div className={classnames('item', { selected: isSelected })} onClick={onClickMenu(id)}>
                {ICON}
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div
        className={classnames(
          'infoDrawer kw-border-l',
          { infoDrawerOpen: isVisibleDrawer },
          { infoDrawerClose: !isVisibleDrawer && !isInit }
        )}
      >
        <BasicInfo
          isShow={activeKey === 'basicInfo'}
          ad_graphStatus={ad_graphStatus}
          graphBasicData={graphBasicData}
          graphCount={graphCount}
          closeDrawer={closeDrawer}
        />
        <SummaryInfo
          closeDrawer={closeDrawer}
          isShow={activeKey === 'summaryInfo'}
          graphData={graphData}
          graphCount={graphCount}
        />
        <ConfigurationDetails
          isShow={activeKey === 'configurationDetails'}
          selectedData={selectedData}
          graphid={graphid}
          closeDrawer={closeDrawer}
        />
        <Statistics closeDrawer={closeDrawer} isShow={activeKey === 'statistics'} graphBasicData={graphBasicData} />
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
});

const Component = connect(mapStateToProps)(Menus);

export default forwardRef((props: any, ref) => <Component {...props} refInstance={ref} />);

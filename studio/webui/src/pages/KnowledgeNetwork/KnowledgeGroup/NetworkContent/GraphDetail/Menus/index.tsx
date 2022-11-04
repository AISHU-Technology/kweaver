import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import BasicInfo from './GraphInfo/BasicInfo';
import SummaryInfo from './GraphInfo/SummaryInfo';
import ConfigurationDetails from './GraphInfo/ConfigurationDetails';

import './style.less';

const INFO_LIST_INFO = [
  {
    id: 'operate',
    icon: <DoubleLeftOutlined />,
    icon2: <DoubleRightOutlined />,
    intl: intl.get('graphDetail.open'),
    intl2: intl.get('graphDetail.close')
  },
  {
    id: 'basicInfo',
    icon: <IconFont type="icon-cebianlan" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.kgGeneralProperties')
  },
  {
    id: 'summaryInfo',
    icon: <IconFont type="icon-iconzhengli_dangan" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.kgOverview')
  },
  {
    id: 'configurationDetails',
    icon: <IconFont type="icon-jibenxinxi" style={{ fontSize: 16 }} />,
    intl: intl.get('graphDetail.categoryInformation')
  }
];

const Menus = (props: any) => {
  const { selectedData, graphid, graphData, graphCount, graphBasicData } = props;
  const [isInit, setIsInit] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const isVisibleDrawer = !!activeKey;

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
          const { id, icon, icon2, intl, intl2 } = item;
          const isSelected = id !== 'operate' && id === activeKey;
          const INTL = id === 'operate' && isVisibleDrawer ? intl2 : intl;
          const ICON: any = isVisibleDrawer ? icon2 || icon : icon;

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
          'infoDrawer',
          { infoDrawerOpen: isVisibleDrawer },
          { infoDrawerClose: !isVisibleDrawer && !isInit }
        )}
      >
        <BasicInfo isShow={activeKey === 'basicInfo'} graphCount={graphCount} graphBasicData={graphBasicData} />
        <SummaryInfo isShow={activeKey === 'summaryInfo'} graphData={graphData} graphCount={graphCount} />
        <ConfigurationDetails
          isShow={activeKey === 'configurationDetails'}
          selectedData={selectedData}
          graphid={graphid}
        />
      </div>
    </div>
  );
};

export default Menus;

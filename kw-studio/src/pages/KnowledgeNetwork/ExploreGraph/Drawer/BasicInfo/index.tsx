import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { CloseOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import { ANALYSIS_PROPERTIES } from '@/enums';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import './style.less';
import _ from 'lodash';
import ScrollBar from '@/components/ScrollBar';
import intl from 'react-intl-universal';
const { textMap } = ANALYSIS_PROPERTIES;
const Line = (props: any) => {
  const { label, value, className } = props;
  let _value = '--';
  if (value === 0 || !!value) _value = value?.name || value;

  return (
    <div className={classnames('kw-border-b lineBox', className)}>
      <div className="kw-pb-1 kw-pt-1">
        <Format.Text className="kw-c-subtext" noHeight={true}>
          {_.includes(_.keys(textMap), label) ? intl.get(textMap?.[label]) : label.replace('#', '')}
        </Format.Text>
      </div>
      <div className="kw-mb-1 propertyValue">{_value}</div>
    </div>
  );
};

type BasicInfoProps = {
  style?: any;
  selectedNode: any;
  summaryOpenInfo: any;
  onChangeDrawerKey: () => void;
  onOpenRightDrawer?: (key: any, from: any) => void;
};

const a: any = {
  node: {
    '#id': intl.get('exploreGraph.nodeId'),
    '#entity_class': intl.get('exploreGraph.nodeClass2'),
    '#alias': intl.get('exploreGraph.nodeShowName')
  },
  edge: {
    '#id': intl.get('exploreGraph.edgeId'),
    '#edge_class': intl.get('exploreGraph.edgeClass2'),
    '#alias': intl.get('exploreGraph.edgeShowName')
  }
};

const BasicInfo = (props: BasicInfoProps) => {
  const { style = {}, selectedNode, summaryOpenInfo, onChangeDrawerKey, onOpenRightDrawer } = props;
  const [basicInfo, setBasicInfo] = useState<any>(); // 显示的点的基本信息

  useEffect(() => {
    if (!selectedNode?._cfg) return;
    setBasicInfo(selectedNode?.getModel()?._sourceData);
    window?.getSelection()?.removeAllRanges(); // 快捷键画布全选
  }, [selectedNode]);

  // 返回到汇总信息
  const backToSummary = () => {
    onOpenRightDrawer?.('summary', summaryOpenInfo?.infoId);
  };

  const type = selectedNode?._cfg?.type;

  return (
    <div className="graph-analysis-basicInfo kw-h-100" style={style}>
      <div className="kw-c-header kw-space-between title">
        <div className="kw-align-center">
          {summaryOpenInfo?.infoId && (
            <div className="kw-pointer" onClick={backToSummary}>
              <IconFont type="icon-shangfanye" />
              <span className="kw-ml-2">{intl.get('global.back')}</span>
              <Divider className="kw-ml-3" type="vertical" style={{ height: 20 }} />
            </div>
          )}
          <Format.Title>{intl.get('exploreGraph.basicInfo')}</Format.Title>
        </div>
        <CloseOutlined classID="kw-pointer" onClick={onChangeDrawerKey} />
      </div>
      <div className="content kw-mt-3">
        <ScrollBar style={{ maxHeight: 'calc(100% - 10px)' }}>
          {_.map(basicInfo?.showLabels, item => {
            const { key, value, alias } = item;
            let _alias = alias;
            if (a?.[type]?.[key]) _alias = a[type][key];
            return <Line key={item?.key} label={_alias || key} value={value} />;
          })}
        </ScrollBar>
      </div>
    </div>
  );
};

export default BasicInfo;

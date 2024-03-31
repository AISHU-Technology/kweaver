/**
 * 路径查询的配置面板
 */

import React, { useState } from 'react';
import { message, Tooltip } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import ExplainTip from '@/components/ExplainTip';
import IconFont from '@/components/IconFont';
import InfoDisplay from '../InfoDisplay';
import { BasicData } from '../../../types';
import SelectEdgeClass from '../SelectConfigTags';
import ConfigureRules from '../ConfigureRules';
import SearchRuleList from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/SearchRuleList';

type PathConfigProps = {
  configError: any;
  basicData: BasicData;
  isDisabled?: boolean;
  editingData: Record<string, any>;
  isEdit?: boolean;
  ontoData?: any;
  onChangeConfig: (data: any) => void;
};

const PathConfig = (props: PathConfigProps) => {
  const { basicData, ontoData, editingData, configError, onChangeConfig } = props;
  const [ruleModalVisible, setRuleModalVisible] = useState<boolean>(false); // 规则弹窗
  const [editRule, setEditRule] = useState<any>({}); // 控制编辑的规则

  const onChangeRule = (rule: any) => {
    let filters = _.cloneDeep(editingData?.filters) || [];
    if (editRule?.name) {
      filters = _.map(filters, item => {
        if (item?.name === editRule?.name) return { ...item, ...rule };
        return item;
      });
      message.success(intl.get('graphList.editSuccess'));
    } else {
      filters.unshift(rule);
      message.success(intl.get('graphList.addSuccess'));
    }

    setEditRule({});
    onChangeConfig({ filters });
  };

  // 编辑规则
  const onEditRule = (item: any) => {
    setEditRule(item);
    setRuleModalVisible(true);
  };

  // 删除
  const onDeleteRule = (name: any) => {
    const rule = _.filter(editingData?.filters, item => item?.name !== name);
    onChangeConfig({ filters: rule });

    message.success(intl.get('global.deleteSuccess'));
  };

  // 勾选
  const onCheckRule = (name: any, checked: boolean) => {
    const filters = _.cloneDeep(editingData?.filters) || [];
    _.forEach(filters, f => {
      if (f.name === name) {
        f.checked = checked;
      }
    });
    onChangeConfig({ filters });
  };

  return (
    <div>
      {/* 基本信息 */}
      <InfoDisplay className="kw-mt-5 kw-pl-6 kw-pr-6" data={basicData} isHorizontal={false} />
      {/* 起点实体类 */}
      <div className="kw-pl-6 kw-pr-6">
        <div className="item-label kw-mb-2">{'起点实体类型'}</div>
        <SelectEdgeClass
          onChange={(tags: any) => onChangeConfig({ start_tags: tags })}
          classList={ontoData?.entity}
          value={editingData?.start_tags}
        />
        {configError?.start_tags && <p className="kw-c-error">{intl.get('cognitiveService.neighbors.notNull')}</p>}
      </div>
      {/* 终点实体类 */}
      <div className="kw-pl-6 kw-pr-6 kw-mt-4">
        <div className="item-label kw-mb-2">{'终点实体类型'}</div>
        <SelectEdgeClass
          onChange={(tags: any) => onChangeConfig({ end_tags: tags })}
          classList={ontoData?.entity}
          value={editingData?.end_tags}
        />
        {configError?.end_tags && <p className="kw-c-error">{intl.get('cognitiveService.neighbors.notNull')}</p>}
      </div>
      {/* 搜索规则 */}
      <div className="kw-mt-8">
        <div className="kw-space-between kw-pl-6 kw-pr-6">
          <div className="">
            {intl.get('exploreGraph.searchRules')}
            <ExplainTip className="kw-ml-2 kw-pointer" title={intl.get('exploreGraph.rulesTip')} />
          </div>
          <div>
            <Tooltip title={intl.get('cognitiveService.neighbors.addRules')}>
              <IconFont
                type="icon-Add"
                className={classNames('kw-pointer')}
                onClick={() => setRuleModalVisible(true)}
              />
            </Tooltip>
          </div>
        </div>
        <SearchRuleList
          hasTip
          allowcheck
          ruleItemClass="kw-pl-6 kw-pr-6"
          searchRules={editingData?.filters}
          onEdit={item => onEditRule(item)}
          onDelete={name => onDeleteRule(name)}
          onCheckRule={(name, checked) => onCheckRule(name, checked)}
        />
      </div>

      <ConfigureRules
        visible={ruleModalVisible}
        editRule={editRule}
        ruleList={editingData?.filters}
        ontoData={ontoData}
        filterType="e_filters"
        onCancel={() => {
          setEditRule({});
          setRuleModalVisible(false);
        }}
        onOk={onChangeRule}
      />
    </div>
  );
};

export default PathConfig;

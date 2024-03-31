/**
 * 邻居查询的配置面板
 */

import React, { useState } from 'react';
import { Radio, message, Tooltip, Checkbox } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import ExplainTip from '@/components/ExplainTip';
import IconFont from '@/components/IconFont';
import NumberInput from '@/components/NumberInput';
import Format from '@/components/Format';
import InfoDisplay from '../InfoDisplay';
import { BasicData } from '../../../types';
import { ConfigData } from '../../Neighbors';
import SelectEdgeClass from '../SelectConfigTags';
import ConfigureRules from '../ConfigureRules';
import SearchRuleList from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/SearchRuleList';

type NeighborProps = {
  // editor: any;
  configError: any;
  basicData: BasicData;
  isDisabled?: boolean;
  editingData: ConfigData;
  isEdit?: boolean;
  classData?: any;
  isTree?: boolean;
  onChangeConfig: (data: Partial<ConfigData>) => void;
};

const Neighbor = (props: NeighborProps) => {
  const { basicData, classData, editingData, configError, isTree, onChangeConfig } = props;
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
      {/* 边类 */}
      <div className="kw-pl-6 kw-pr-6">
        <div className="item-label kw-mb-2">{intl.get('cognitiveService.neighbors.startPointType')}</div>
        <SelectEdgeClass
          onChange={(data: any) => onChangeConfig({ tags: data })}
          classList={classData?.entity}
          value={editingData?.tags}
        />
        {configError?.tags && <p className="kw-c-error">{intl.get('cognitiveService.neighbors.notNull')}</p>}
      </div>
      <div className="kw-mt-6 kw-pl-6 kw-pr-6">
        <Format.Title strong={4}>
          {intl.get('exploreGraph.SearchDepth')}
          <span className="kw-ml-2 kw-c-subtext">({intl.get('analysisService.defaultValue')})</span>
        </Format.Title>
        <NumberInput
          className="kw-mt-2 kw-w-100"
          min={1}
          value={editingData.steps}
          onChange={e => onChangeConfig({ steps: e as number })}
        />
        <div style={{ height: 24 }} className={editingData.steps >= 3 ? 'kw-mb-2' : ''}>
          {editingData.steps >= 3 && (
            <>
              <ExclamationCircleOutlined className="kw-c-warning" />
              <span className="kw-ml-2">{intl.get('exploreGraph.moreStepTip')}</span>
            </>
          )}
        </div>
      </div>
      <div className="kw-pl-6 kw-pr-6">
        <Format.Title block strong={4}>
          {intl.get('exploreGraph.direction')}
          <span className="kw-ml-2 kw-c-subtext">({intl.get('analysisService.defaultValue')})</span>
        </Format.Title>
        <Radio.Group
          className="kw-w-100"
          onChange={e => onChangeConfig({ direction: e?.target?.value })}
          value={editingData.direction}
        >
          <Radio.Button className="dire-btn" value="positive">
            {intl.get('exploreGraph.positive')}
          </Radio.Button>
          <Radio.Button className="dire-btn" value="reverse" disabled={isTree}>
            {intl.get('exploreGraph.reverse')}
          </Radio.Button>
          <Radio.Button className="dire-btn" value="bidirect" disabled={isTree}>
            {intl.get('exploreGraph.bidirectional')}
          </Radio.Button>
        </Radio.Group>
      </div>
      <div className="kw-mt-6 kw-pl-6 kw-pr-6">
        <Format.Title block strong={4} className="kw-mb-2">
          {intl.get('analysisService.result')}
          <span className="kw-ml-2 kw-c-subtext">({intl.get('analysisService.defaultValue')})</span>
        </Format.Title>
        <Checkbox checked={editingData.final_step} onChange={e => onChangeConfig({ final_step: e.target.checked })}>
          {intl.get('analysisService.finalStepLabel').split('|')[0]}
          <span className="kw-c-primary">{editingData.steps}</span>
          {intl.get('analysisService.finalStepLabel').split('|')[1]}
        </Checkbox>
      </div>
      {/* 搜索规则 */}
      <div className="kw-mt-7">
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
        // style={{ top: 180 }}
        visible={ruleModalVisible}
        editRule={editRule}
        ruleList={editingData?.filters}
        ontoData={classData}
        onCancel={() => {
          setEditRule({});
          setRuleModalVisible(false);
        }}
        onOk={onChangeRule}
      />
    </div>
  );
};

export default Neighbor;

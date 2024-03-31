/**
 * 组件描述
 * @author Jason.ji
 * @date 2022/06/27
 *
 */

import React, { memo } from 'react';
import { Tooltip, Input } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { CN_NUMBER, EN_NUMBER } from '../../assistFunction';
import './style.less';

interface BaseInfoProps {
  store?: any;
  kwLang?: string;
  data: Record<string, any>;
  graphData: Record<string, any>;
  configData: Record<string, any>;
}

const BaseInfo: React.FC<BaseInfoProps> = ({ kwLang, data, graphData, configData }) => {
  const { kg_name, conf_content } = data;

  return (
    <div className={`search-config-modal-info ${kwLang === 'en-US' && 'en-style'}`}>
      <h2 className="h-title" style={{ marginTop: 20 }}>
        {intl.get('searchConfig.basicInfo')}
      </h2>

      {/* 图谱 */}
      <div className="config-row">
        <p className="row-title required">{intl.get('global.graph')}</p>
        <Input value={kg_name} disabled title={kg_name} />
      </div>

      <div className="config-row">
        <p className="row-title required">{intl.get('searchConfig.deep')}</p>
        <div className="deep-text">
          &le;&nbsp;&nbsp;
          {kwLang === 'en-US' ? EN_NUMBER[conf_content.max_depth] : CN_NUMBER[conf_content.max_depth]}
          {intl.get('searchConfig.deepFix')}
        </div>
      </div>

      <h2 className="h-title">{intl.get('searchConfig.searchRule')}</h2>
      <div className="config-row">
        <p className="row-title">
          {intl.get('searchConfig.searchScope')}
          <Tooltip
            getPopupContainer={triggerNode => triggerNode.parentElement!}
            placement="right"
            title={intl.get('searchConfig.scopeTip')}
          >
            <QuestionCircleOutlined className="q-icon" />
          </Tooltip>
        </p>

        <div className="rule-box">
          <div className="combo-row" style={{ marginBottom: 16 }}>
            <div className="addon-before">{intl.get('global.entityClass')}</div>
            <div className="rule-num">
              {(graphData.nodeLen || 0) > configData.nodeScope.length ? (
                <>
                  {intl.get('searchConfig.checked1')}
                  <span className="num-span">{configData.nodeScope.length}</span>
                  {intl.get('searchConfig.checked2')}
                </>
              ) : (
                intl.get('global.all')
              )}
            </div>
          </div>

          <div className="combo-row">
            <div className="addon-before">{intl.get('global.relationClass')}</div>
            <div className="rule-num">
              {(graphData.edgeLen || 0) > configData.edgeScope.length ? (
                <>
                  {intl.get('searchConfig.checked1')}
                  <span className="num-span">{configData.edgeScope.length}</span>
                  {intl.get('searchConfig.checked2')}
                </>
              ) : (
                intl.get('global.all')
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="config-row">
        <p className="row-title" style={{ marginTop: 24 }}>
          {intl.get('searchConfig.searchRes')}
          <Tooltip
            getPopupContainer={triggerNode => triggerNode!}
            placement="right"
            title={intl.get('searchConfig.resTip')}
          >
            <QuestionCircleOutlined className="q-icon" />
          </Tooltip>
        </p>

        <div className="rule-box">
          <div className="combo-row">
            <div className="addon-before">{intl.get('global.entityClass')}</div>
            <div className="rule-num">
              {(graphData.nodeLen || 0) > configData.nodeRes.length ? (
                <>
                  {intl.get('searchConfig.checked1')}
                  <span className="num-span">{configData.nodeRes.length}</span>
                  {intl.get('searchConfig.checked2')}
                </>
              ) : (
                intl.get('global.all')
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: Record<string, any>) => ({
  kwLang: state.getIn(['changekwLang', 'kwLang'])
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(memo(BaseInfo));

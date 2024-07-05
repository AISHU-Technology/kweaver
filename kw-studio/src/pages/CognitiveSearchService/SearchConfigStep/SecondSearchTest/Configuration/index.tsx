import React from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ConfigurationTypeTwo from './ConfigurationTypeTwo';
import ExplainTip from '@/components/ExplainTip';

import './style.less';
const CONFIG_ITEM = {
  query: 'query',
  qa: 'qa',
  fullText: 'fulltext',
  card: 'card',
  commend: 'commend'
};
const configTitleTwo = [
  // {
  //   title: intl.get('cognitiveSearch.semantic'),
  //   key: '1',
  //   count: 2,
  //   children: [
  //     {
  //       title: (
  //         <span>
  //           {intl.get('cognitiveSearch.query')} <ExplainTip title={intl.get('cognitiveSearch.queryTip')} />
  //         </span>
  //       ),
  //       key: '1-1',
  //       id: CONFIG_ITEM.query,
  //       children: [
  //         {
  //           title: intl.get('cognitiveSearch.recognition'),
  //           key: '1-1-1',
  //           configType: 'setting'
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    title: intl.get('cognitiveSearch.modeTwo'),
    key: '2',
    count: 6,
    children: [
      {
        title: intl.get('cognitiveSearch.graphQA.configTitle'),
        key: '2-2',
        count: 3,
        id: CONFIG_ITEM.qa,
        children: [
          {
            title: intl.get('cognitiveSearch.returnLimit'),
            key: '2-2-1',
            configType: 'setting'
          },
          {
            title: intl.get('cognitiveSearch.qaAdvConfig.qaBasicConfig'),
            key: '2-2-2',
            configType: 'setting',
            authkey: 'qa'
          },
          {
            title: intl.get('cognitiveSearch.qaAdvConfig.qaAdvConfigTwo'),
            key: 'advConfig'
          },
          {
            title: (
              <span>
                {intl.get('cognitiveSearch.answersOrganization.subgraph')}
                <ExplainTip title={intl.get('cognitiveSearch.answersOrganization.subgraphTip')} />
              </span>
            ),
            key: '2-2-4',
            configType: 'switch',
            children: [
              {
                title: intl.get('cognitiveSearch.canvasConfig'),
                key: '2-2-4-1',
                configType: 'setting'
              }
            ]
          }
        ]
      },
      {
        title: intl.get('cognitiveSearch.fullText'),
        key: '2-1',
        id: CONFIG_ITEM.fullText,
        children: [
          {
            title: intl.get('cognitiveSearch.full.graphCategory'),
            isLeaf: true,
            key: '2-1-1',
            configType: 'setting',
            authkey: 'classify'
          },
          {
            title: intl.get('cognitiveSearch.searchRangeTwo'),
            isLeaf: true,
            key: '2-1-2',
            configType: 'setting',
            authkey: 'range'
          }
          // {
          //   title: '搜索策略',
          //   isLeaf: true,
          //   key: '2-1-3',
          //   configType: 'setting',
          //   authkey: 'range'
          // }
        ]
      },
      {
        title: (
          <span>
            {intl.get('knowledgeCard.card')}
            <ExplainTip title={intl.get('knowledgeCard.cardExplain')} />
          </span>
        ),
        key: '2-3',
        id: CONFIG_ITEM.card,
        children: [
          {
            title: <span>{intl.get('cognitiveSearch.entityLow')}</span>,
            key: '2-3-1',
            configType: 'setting'
          },
          {
            title: intl.get('knowledgeCard.cardConfig'),
            key: '2-3-2',
            configType: 'setting'
          },
          {
            title: intl.get('knowledgeCard.querySort'),
            key: '2-3-3',
            configType: 'setting'
          }
        ]
      },
      {
        title: (
          <span>
            {intl.get('knowledgeCard.recommend')}
            <ExplainTip title={intl.get('knowledgeCard.recommendExplain')} />
          </span>
        ),
        key: '2-4',
        id: CONFIG_ITEM.commend,
        children: [
          {
            title: <span>{intl.get('cognitiveSearch.entityLow')}</span>,
            key: '2-4-1',
            configType: 'setting'
          },
          {
            title: intl.get('knowledgeCard.recommendConfig'),
            key: '2-4-2',
            configType: 'setting'
          },
          {
            title: intl.get('knowledgeCard.querySort'),
            key: '2-4-3',
            configType: 'setting'
          }
        ]
      }
    ]
  }
];

const Configuration = (props: any) => {
  const {
    setQueryModal,
    setFullTextModal,
    textIsDisable,
    isSwitchDisable,
    onSaveDefault,
    onTextConfig,
    checked,
    setChecked,
    setIsClassifySetting,
    setQaModal,
    setIsOpenQA,
    setQaStep,
    authError,
    operateFail,
    isQAConfigError,
    openModalHelper,
    error,
    qaError,
    setCanvasConfigModal,
    advError,
    emError
  } = props;

  const checkedObj = {
    '1-1': checked.queryChecked,
    '2-1': checked.checked,
    '2-2': checked.qAChecked,
    '2-3': checked.card,
    '2-4': checked.recommend,
    '2-2-4': checked.qaSubgraph
  };

  const errorObj = {
    '2-3-2': error?.card,
    '2-4-2': error?.recommend,
    '1-1-1': error?.query
  };

  /**
   * 各配置弹窗开启
   * P_BUTTON 流程二弹窗打开
   */
  const onSettingModal = (key: string) => {
    switch (key) {
      case '1-1-1':
        setQueryModal(true);
        break;
      case '2-1-2':
        setFullTextModal(true);
        break;
      case '2-2':
        break;
      case '2-1-1':
        setIsClassifySetting(true);
        break;
      case '2-2-1':
        setQaModal(true);
        setQaStep(1);
        break;
      case '2-2-2':
        setQaModal(true);
        setQaStep(2);
        break;
      case '2-2-4-1':
        setCanvasConfigModal(true);
        break;
      default:
        break;
    }

    const keyMap: any = {
      '2-2-3': { configType: 'qa', modalType: 'answerOrganization' },
      '2-3-1': { configType: 'card', modalType: 'score' },
      '2-3-2': { configType: 'card', modalType: 'card' },
      '2-3-3': { configType: 'card', modalType: 'weights' },
      '2-4-1': { configType: 'recommend', modalType: 'score' },
      '2-4-2': { configType: 'recommend', modalType: 'card' },
      '2-4-3': { configType: 'recommend', modalType: 'weights' },
      advConfig: { configType: 'card', modalType: 'advconfig' }
    };
    keyMap[key] && openModalHelper(keyMap[key]);
  };

  /**
   * 开关变化
   */
  const onSwitch = (isCheck: boolean, key: string) => {
    switch (key) {
      case '1-1':
        setChecked({ ...checked, queryChecked: isCheck });
        onSaveDefault();
        break;
      case '2-1':
        setChecked({ ...checked, checked: isCheck });
        onSaveDefault();
        break;
      case '2-2':
        setChecked({ ...checked, qAChecked: isCheck });
        setIsOpenQA(isCheck);
        onSaveDefault();
        break;
      case '2-3':
        setChecked({ ...checked, card: isCheck });
        onSaveDefault();
        break;
      case '2-4':
        setChecked({ ...checked, recommend: isCheck });
        onSaveDefault();
        break;
      case '2-2-4':
        setChecked({ ...checked, qaSubgraph: isCheck });
        break;
      default:
        break;
    }
  };

  return (
    <div className="mode-configuration-wrap kw-h-100">
      <div className="file-left">
        <div className="second-header kw-pb-4">
          <Format.Title className="second-format">{intl.get('cognitiveSearch.configurations')}</Format.Title>
        </div>
        {!textIsDisable ? (
          <div className="kw-flex test-content-tip kw-mt-3">
            <IconFont type="icon-Warning" className="kw-mr-2" style={{ color: '#FFBF00' }} />
            <div>{intl.get('cognitiveSearch.updateMode')}</div>
          </div>
        ) : null}
        <ConfigurationTypeTwo
          authError={authError}
          configTitleTwo={configTitleTwo}
          onSwitch={onSwitch}
          checked={checked}
          onSettingModal={onSettingModal}
          isSwitchDisable={isSwitchDisable}
          checkedObj={checkedObj}
          errorObj={errorObj}
          qaError={qaError}
          advError={advError}
          isQAConfigError={isQAConfigError}
        />

        <div
          className={`test-classification kw-center kw-mt-7 kw-pointer ${textIsDisable && 'not-allow'}`}
          onClick={() => onTextConfig()}
          title={
            !checked?.queryChecked && !checked?.checked && !checked?.qAChecked
              ? intl.get('cognitiveSearch.openMode')
              : ''
          }
        >
          {intl.get('cognitiveSearch.test')}
        </div>
      </div>
    </div>
  );
};

export default Configuration;

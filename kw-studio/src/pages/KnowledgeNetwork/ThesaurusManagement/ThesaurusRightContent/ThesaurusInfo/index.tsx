import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Divider } from 'antd';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import intl from 'react-intl-universal';

import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import Format from '@/components/Format';
import HOOKS from '@/hooks';

import thesaurusSvg from '@/assets/images/graphCircle.svg';

import './style.less';
import IconFont from '@/components/IconFont';

const ItemBox = (props: any) => {
  const { tip, value, name, isEllipsis = false, className } = props;
  return (
    <div className="kw-pb-4">
      <div className="kw-pb-2">
        <Format.Text className="kw-c-subtext">{name}</Format.Text>
      </div>
      <div
        title={tip}
        className={classnames('kw-c-header', 'kw-w-100', 'text-line', { 'kw-ellipsis': isEllipsis }, className)}
      >
        {value || '--'}
      </div>
    </div>
  );
};

const ThesaurusInfo = (props: any) => {
  const { selectedThesaurus, setShowInfo } = props;
  const { height } = HOOKS.useWindowSize();

  const [showAll, setShowAll] = useState<any>(false); // 是否展示全部关联资源名称

  /**
   * 关联的所有图谱、词库名称
   */
  const onHandleData = () => {
    const cloneGraphData = _.cloneDeep(selectedThesaurus?.extract_info?.graph);
    const allGraphName: any = [];
    _.map(cloneGraphData, (item: any) => allGraphName.push({ name: item?.name, type: 'graph' }));

    const cloneLexiconData = _.cloneDeep(selectedThesaurus?.extract_info?.lexicon);
    const allLexiconName: any = [];
    _.map(cloneLexiconData, (item: any) => allLexiconName.push({ name: item?.name, type: 'thesaurus' }));
    return [...allGraphName, ...allLexiconName];
  };

  /**
   * 展开收起
   */
  const onOpenAndClose = () => {
    setShowAll(!showAll);
  };

  /**
   * 关联资源展示
   */
  const onShowAllResource = () => {
    return (
      <>
        {_.map(showAll ? onHandleData() : onHandleData()?.slice(0, 3), (item: any, index: any) => {
          return (
            <div className="kw-flex all-resource-name-box kw-mb-3" key={index}>
              <div className="resource-icon-box kw-mr-2 kw-center">
                {item?.type === 'graph' ? <IconFont type="icon-color-zhishitupu11" /> : <IconFont type="icon-ciku1" />}
              </div>
              <div className="kw-ellipsis resource-name kw-c-header" title={item?.name}>
                {item?.name}
              </div>
            </div>
          );
        })}
        {onHandleData()?.length > 3 ? (
          <div className="  kw-center " onClick={onOpenAndClose}>
            <div className="show-more kw-pointer kw-c-primary">
              <span className="kw-mr-1">
                {showAll ? intl.get('ThesaurusManage.collapseMore') : intl.get('ThesaurusManage.viewMore')}
              </span>
              {showAll ? <UpOutlined /> : <DownOutlined />}
            </div>
          </div>
        ) : null}
        {_.isEmpty(onHandleData()) ? '--' : null}
      </>
    );
  };

  return (
    <div
      className="ThesaurusInfo-box kw-pl-5 kw-pt-4 kw-pr-5 kw-h-100"
      id="ThesaurusInfo"
      style={{ height: height - 100 }}
    >
      <div className="border-style kw-pb-2 kw-mb-4">
        <Format.Text strong={6} className="kw-c-header info-box-title">
          {intl.get('ThesaurusManage.lexiconView')}
        </Format.Text>
        <div className="kw-pointer close-box">
          <IconFont
            type="icon-guanbiquxiao"
            onClick={() => {
              setShowInfo(false);
            }}
          />
        </div>
      </div>
      <ItemBox name="ID" value={selectedThesaurus?.id} tip={selectedThesaurus?.id} isEllipsis={true} />
      <ItemBox
        isEllipsis={true}
        name={intl.get('ThesaurusManage.createMode.lexiconName')}
        value={selectedThesaurus?.lexicon_name}
        tip={selectedThesaurus?.lexicon_name}
      />

      <ItemBox
        className="kw-ellipsis-3"
        name={intl.get('datamanagement.description')}
        value={selectedThesaurus?.description}
        tip={selectedThesaurus?.description}
      />
      <Divider className="divider-style" />
      <ItemBox
        name={intl.get('ThesaurusManage.type')}
        value={THESAURUS_TEXT.THESAURUS_MODE_ZH_CN[selectedThesaurus?.mode] || '--'}
      />
      <div className="kw-mb-4">
        <p className="kw-c-subtext kw-mb-2">{intl.get('ThesaurusManage.associate')}</p>
        <div>{onShowAllResource()}</div>
      </div>
      <Divider className="divider-style" />

      <ItemBox
        name={intl.get('global.creator')}
        value={selectedThesaurus?.create_user || '--'}
        tip={selectedThesaurus?.create_user}
        isEllipsis={true}
      />
      <ItemBox name={intl.get('global.creationTime')} value={selectedThesaurus.create_time || '--'} />
      <ItemBox
        name={intl.get('global.finalOperator')}
        value={selectedThesaurus?.operate_user || '--'}
        tip={selectedThesaurus?.operate_user}
        isEllipsis={true}
      />
      <ItemBox name={intl.get('subscriptionService.updateTime')} value={selectedThesaurus.update_time || '--'} />
    </div>
  );
};
export default ThesaurusInfo;

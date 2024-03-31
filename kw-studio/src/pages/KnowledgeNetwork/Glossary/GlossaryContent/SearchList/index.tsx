import React from 'react';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import './style.less';
import { TermLabelType, TermType } from '@/pages/KnowledgeNetwork/Glossary/types';
import intl from 'react-intl-universal';
import NoDataBox from '@/components/NoDataBox';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import classNames from 'classnames';
import LoadingMask from '@/components/LoadingMask';

type TypeSearchList = {
  data: TermType[];
  onSelect?: (key: string, data: TermType) => void;
  selectedLanguage: string;
  value?: string;
  searchValue?: string;
  loading?: boolean;
};

const SearchList = (props: TypeSearchList) => {
  const { data, selectedLanguage, value, onSelect, loading = false, searchValue = '' } = props;
  const renderTitle = (data: TermLabelType[]) => {
    const target = data.find(item => item.language === selectedLanguage);
    if (target) {
      return target.name;
    }
    return data[0].name;
  };

  const renderSubTitle = (data: TermLabelType[]) => {
    const translateData: string[] = [];
    let synonymData: string[] = [];
    data.forEach(item => {
      if (item.name.includes(searchValue)) {
        const language = languageOptions.find(ii => ii.value === item.language)!;
        translateData.push(`${language.label} ${intl.get('glossary.translate')}：${item.name}`);
      }
      const target = item.synonym.filter(synonymItem => synonymItem.includes(searchValue));
      synonymData = [...synonymData, ...target];
    });
    return {
      translateData,
      synonymData
    };
  };
  const prefixCls = 'glossarySearchRoot';

  const renderContent = () => {
    if (!loading) {
      if (_.isEmpty(data)) {
        return (
          <NoDataBox
            style={{ marginTop: 120 }}
            imgSrc={require('@/assets/images/noResult.svg').default}
            desc={intl.get('global.noResult')}
          />
        );
      }
      return _.map(data, item => {
        const subTitle = renderSubTitle(item.label);
        const title = renderTitle(item.label);
        let subTitleText = `${subTitle.translateData.join('；')}`;
        if (subTitle.synonymData.length > 0) {
          if (subTitleText) {
            subTitleText += `；${intl.get('glossary.synonym')}：${subTitle.synonymData.join('、')}`;
          } else {
            subTitleText += `${intl.get('glossary.synonym')}：${subTitle.synonymData.join('、')}`;
          }
        }
        return (
          <div
            key={item.id}
            className={classNames(`${prefixCls}-item`, {
              [`${prefixCls}-item-active`]: value === item.id
            })}
            onClick={e => {
              e.stopPropagation();
              onSelect?.(item.id, item);
            }}
          >
            <div className="kw-align-center kw-c-header" title={title}>
              <IconFont type="icon-shuyu" />
              <div className="kw-ellipsis kw-ml-1">{title}</div>
            </div>
            <div className="kw-c-subtext kw-ellipsis" title={subTitleText}>
              {subTitleText}
            </div>
          </div>
        );
      });
    }
  };
  return (
    <div className={prefixCls}>
      <LoadingMask loading={loading} />
      {renderContent()}
    </div>
  );
};
export default SearchList;

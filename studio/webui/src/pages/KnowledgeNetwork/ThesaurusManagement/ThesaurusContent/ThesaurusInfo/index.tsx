import React from 'react'
import _ from 'lodash';
import { Tag, Popover, Divider } from 'antd';

import { EllipsisOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import { numToThousand } from '@/utils/handleFunction';

import './style.less'

const ItemBox = (props: any) => {
  const { tip, value, name, isEllipsis = false, className } = props
  return (
    <div className="ad-pb-4">
      <div className="ad-pb-2">
        <Format.Text className="ad-c-subtext">
          {name}
        </Format.Text>
      </div>
      <div title={tip} className={classnames('ad-c-header', 'ad-w-100', 'text-line', { 'ad-ellipsis': isEllipsis }, className)}>
        {value || '--'}
      </div>
    </div >
  )
}

const ThesaurusInfo = (props: any) => {
  const { selectedThesaurus } = props;

  // 计算标签展示的个数
  const getLabels = (maxWidth: number) => {
    if (_.isEmpty(selectedThesaurus?.labels)) {
      return;
    }
    const labels = selectedThesaurus?.labels;
    let length = 0;
    let index = labels?.length
    _.forEach(labels, (item, itemindex) => {
      // 字体大小14,标签最多显示6个字符，左右内边距8，外边距8
      const itemLength = item?.length > 6 ? (98 + 24) : item?.length * 14 + 24;
      length += itemLength
      if (length > maxWidth && index === labels?.length) {
        index = itemindex;
      }
    });

    return index + 1;
  }

  return (
    <div className="ThesaurusInfo-box" id="ThesaurusInfo">
      <div className="border-style ad-pb-2 ad-mb-4">
        <Format.Text strong={6} className="ad-c-header">
          {intl.get('ThesaurusManage.infomation')}
        </Format.Text>
      </div>
      <ItemBox
        isEllipsis={true}
        name={intl.get('ThesaurusManage.name')}
        value={selectedThesaurus?.lexicon_name}
        tip={selectedThesaurus?.lexicon_name}
      />
      <ItemBox name="ID" value={selectedThesaurus?.id} tip={selectedThesaurus?.id} isEllipsis={true} />
      <ItemBox
        className="ad-ellipsis-3"
        name={intl.get('datamanagement.description')}
        value={selectedThesaurus?.description}
        tip={selectedThesaurus?.description}
      />
      <Divider className="divider-style" />
      <ItemBox name={intl.get('ThesaurusManage.count')} value={numToThousand(selectedThesaurus.count)} />
      <div className="ad-mb-4">
        <p className="ad-c-subtext ad-mb-2">
          {intl.get('ThesaurusManage.labels')}
        </p>
        <div className="ad-align-center">
          {!_.isEmpty(selectedThesaurus?.labels) ? <>
            {_.map(selectedThesaurus.labels.slice(0, getLabels(236)), (item, index) => {
              return (
                <Tag className="ad-ellipsis tag-style" key={index} title={item}>{item}</Tag>
              )
            })
            }
            {
              selectedThesaurus.labels.length > getLabels(236) &&
              <Popover
                placement="top"
                title={null}
                trigger="hover"
                getPopupContainer={triggerNode => triggerNode.parentElement!}
                content={
                  <div className="popover-content-wrap">
                    {_.map(selectedThesaurus.labels.slice(getLabels(236)), (item, index) => {
                      return (
                        <Tag className="ad-ellipsis tag-width" key={index} title={item}>{item}</Tag>
                      )
                    })
                    }
                  </div>
                }
              >
                <div className="ad-center more-labels">
                  <EllipsisOutlined style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
                </div>
              </Popover>
            }</> : <span>--</span>}
        </div>
      </div >
      <Divider className="divider-style" />

      <ItemBox name={intl.get('global.creator')}
        value={selectedThesaurus?.create_user || '--'}
        tip={selectedThesaurus?.create_user} isEllipsis={true} />
      <ItemBox name={intl.get('global.creationTime')} value={selectedThesaurus.create_time || '--'} />
      <ItemBox name={intl.get('global.finalOperator')}
        value={selectedThesaurus?.update_user || '--'}
        tip={selectedThesaurus?.update_user} isEllipsis={true} />
      <ItemBox name={intl.get('global.finalOperatorTime')} value={selectedThesaurus.update_time || '--'} />
    </div>
  )
}
export default ThesaurusInfo
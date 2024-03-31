import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { MenuFoldOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import ComponentCard from './ComponentCard';
import { getSortedComponents } from '../utils';
import { useCard } from '../useCard';
import KNOWLEDGE_CARD from '../enums';
import './style.less';

const LABEL: any = KNOWLEDGE_CARD.getLabel();
const getComponents = (type: 'card' | 'recommend' | string) => {
  const knwCardComponents = [
    {
      title: intl.get('knowledgeCard.entityComponent'),
      components: [
        {
          name: LABEL[KNOWLEDGE_CARD.ENTITY_INFO],
          key: KNOWLEDGE_CARD.ENTITY_INFO,
          img: '',
          disabled: true
        }
      ]
    },
    {
      title: intl.get('knowledgeCard.reEntityComponent'),
      components: [
        {
          name: LABEL[KNOWLEDGE_CARD.RELATED_LABEL],
          key: KNOWLEDGE_CARD.RELATED_LABEL,
          img: ''
        },
        {
          name: LABEL[KNOWLEDGE_CARD.RELATED_DOCUMENT_1],
          key: KNOWLEDGE_CARD.RELATED_DOCUMENT_1,
          img: ''
        },
        {
          name: LABEL[KNOWLEDGE_CARD.RELATED_DOCUMENT_2],
          key: KNOWLEDGE_CARD.RELATED_DOCUMENT_2,
          img: ''
        }
      ]
    }
  ];

  const recommendComponents = [{ ...knwCardComponents[1], title: '' }];
  return type === 'recommend' ? recommendComponents : knwCardComponents;
};

const BlockComponents = (props: any) => {
  const { state, dispatch } = useCard();
  const [isOpen, setIsOpen] = useState(true);

  /**
   * 点击添加组件
   * @param item
   */
  const onAdd = (item: any) => {
    const CARD_DEFAULT: any = KNOWLEDGE_CARD.getKeyValueList();
    const component = CARD_DEFAULT[item.key];

    if (component) {
      component.id = (+new Date()).toString();
      component.type = item.key;
      const { activeID, sort, components } = state?.configs || {};
      const newComponents = getSortedComponents(components, sort);
      const activeIndex = _.findIndex(newComponents, c => c.id === activeID);
      newComponents.splice(activeIndex + 1, 0, component); // 当前编辑的后一位插入
      dispatch({ key: 'configs', data: { activeID: component.id, components: newComponents } });
    }
  };

  return (
    <div className="blockComponentsRoot" style={{ width: isOpen ? 240 : 56 }}>
      <div className="opened-menu kw-h-100 kw-p-4 kw-pt-6" style={{ display: isOpen ? undefined : 'none' }}>
        <Format.Title>{intl.get('knowledgeCard.addComponent')}</Format.Title>
        <div>
          {_.map(getComponents(state.configType), (item, index) => {
            return (
              <React.Fragment key={index}>
                {!!item.title && <div className="group-title kw-mt-4 kw-mb-2">{item.title}</div>}
                <div
                  className={classNames('component-list-box kw-flex', !item.title ? 'kw-mt-4 kw-mb-2' : '')}
                  style={{ flexWrap: 'wrap' }}
                >
                  {_.map(item.components, (component: { key: string; img: any; name: string; disabled?: boolean }) => {
                    return (
                      <ComponentCard
                        key={component.key}
                        img={component.img}
                        title={intl.get(component.name)}
                        allowAdd={!component?.disabled}
                        onAdd={() => onAdd(component)}
                      />
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="bar-icon kw-pointer" onClick={() => setIsOpen(false)}>
          <MenuFoldOutlined />
        </div>
      </div>

      <div
        className="closed-menu kw-flex-column kw-h-100"
        style={{ display: !isOpen ? undefined : 'none', justifyContent: 'space-between' }}
      >
        <Tooltip title={intl.get('knowledgeCard.component')}>
          <div className="bar-icon">
            <IconFont type="icon-zujian" />
          </div>
        </Tooltip>
        <div className="bar-icon kw-pointer" onClick={() => setIsOpen(true)}>
          <MenuFoldOutlined rotate={180} />
        </div>
      </div>
    </div>
  );
};

export default BlockComponents;

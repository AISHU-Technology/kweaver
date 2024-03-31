import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import _ from 'lodash';
import './style.less';

import KnowledgeCard, { KnowledgeCardProps } from '.';

export type KnowledgeCardModalProps = {
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;
  visible?: boolean;
} & KnowledgeCardProps;

let domCache: HTMLDivElement | null = null;
const createContainer = () => {
  if (domCache) return domCache;
  const container = document.createElement('div');
  domCache = container;
  document.body.appendChild(container);
  return container;
};

const KnowledgeCardModal = (props: any) => {
  const { className, style = {}, zIndex = 201, visible, ...otherProps } = props;
  const container = useMemo(() => createContainer(), []); // 在document.body渲染

  useEffect(() => {
    document.body.classList.add('hidden-scroll');
    return () => {
      document.body.classList.remove('hidden-scroll');
      domCache?.remove();
      domCache = null;
    };
  }, []);

  return createPortal(
    <div className={classNames(className, 'knowledgeCardRoot-modal')} style={{ zIndex, ...style }}>
      <KnowledgeCard {...otherProps} />
    </div>,
    container
  );
};

export default (props: KnowledgeCardModalProps) => (props.visible ? <KnowledgeCardModal {...props} /> : null);

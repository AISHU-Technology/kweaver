import React, { useState, useEffect } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { getParam } from '@/utils/handleFunction';
import ThesaurusModeContent from './ThesaurusModeContent';
import Top from '@/pages/KnowledgeNetwork/';

import './style.less';

export type KnwItem = {
  id: number;
  color: string;
  knw_name: string;
  knw_description: string;
  intelligence_score: number;
  recent_calculate_time: string;
  creation_time: string;
  update_time: string;
};

const ThesaurusModeCreate = (props: any) => {
  const { isChange, setIsChange } = props;

  return (
    <div className="thesaurus-mode-create-wrap-root kw-h-100">
      <ThesaurusModeContent isChange={isChange} setIsChange={setIsChange} />
    </div>
  );
};

export default ThesaurusModeCreate;

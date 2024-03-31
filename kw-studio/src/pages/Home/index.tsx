import React from 'react';
import _ from 'lodash';

import CHeader from '@/components/Header';

import Navigation from './Navigation';

import './style.less';

const Homepage = () => {
  return (
    <div className="homepageRoot">
      <CHeader />
      <div className="homepageContent">
        <Navigation />
      </div>
    </div>
  );
};

export default Homepage;

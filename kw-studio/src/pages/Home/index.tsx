import React from 'react';

import KwHeader from '@/components/KwHeader';

import Navigation from './Navigation';

import './style.less';

const Homepage = () => {
  return (
    <div className="homepageRoot">
      <KwHeader />
      <div className="homepageContent">
        <Navigation />
      </div>
    </div>
  );
};

export default Homepage;

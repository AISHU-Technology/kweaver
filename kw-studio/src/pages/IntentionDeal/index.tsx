import React, { useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import TopHeader from './TopHeader';
import IntentionCreate from './IntentionCreate';
import './style.less';

const IntentionDeal = () => {
  const [knwData, setKnwData] = useState<any>({});
  const [knwStudio, setKnwStudio] = useState<any>('');
  const onKnwChange = (data: any) => {
    setKnwData({ ...data });
  };
  return (
    <div className="cognitive-intention-slot-root">
      <TopHeader selectValue={knwData} onChange={onKnwChange} setKnwStudio={setKnwStudio} />
      <div className="l-layout">
        <IntentionCreate knwData={knwData} knwStudio={knwStudio} />
        {/* <Switch>
          <Route path="/intention/create" render={() => <IntentionCreate knwData={knwData} knwStudio={knwStudio} />} />
          <Redirect to="/home" />
        </Switch> */}
      </div>
    </div>
  );
};

export default IntentionDeal;

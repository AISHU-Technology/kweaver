import React from 'react';
import { shallow } from 'enzyme';
import DataInfo from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(
      <DataInfo
        props={{
          selectedElement: {
            entity_id: 1,
            source_table: ['1', '2', '3']
          }
        }}
      />
    );
  });
});

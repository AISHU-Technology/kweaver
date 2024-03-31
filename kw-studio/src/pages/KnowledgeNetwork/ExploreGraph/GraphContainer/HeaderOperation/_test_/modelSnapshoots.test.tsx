import React from 'react';
import { shallow } from 'enzyme';
import ModelSnapshoots from '../ModelSnapshoots';

describe('ModelSnapshoots', () => {
  const props = {
    selectedItem: {},
    isVisible: true,
    onChangeData: () => {},
    onClosePopover: () => {},
    onOpenLeftDrawer: () => {}
  };

  it('ModelSnapshoots have class', () => {
    const app = shallow(<ModelSnapshoots {...props} />);
    expect(app.find('.modelSnapshotsRoot').exists()).toBe(true);
  });
});

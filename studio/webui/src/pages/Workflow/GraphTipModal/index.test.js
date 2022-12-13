import { sleep } from '@/tests';
import { graphTipModal } from './index';

describe('graphTipModal', () => {
  it('test ', async () => {
    const desc = '一段描述';

    graphTipModal.open(desc);
    await sleep();
    expect(document.querySelector('.ant-modal-confirm-content').innerHTML).toBe(desc);

    graphTipModal.close();
    await sleep();
    expect(document.querySelector('.graph-not-exist-modal')).toBeFalsy();
  });
});

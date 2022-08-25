import { renderHook } from '@testing-library/react-hooks';
import PaginationConfig from '../PaginationConfigHook';

const init = (props: any) => renderHook(() => PaginationConfig(props)).result.current;

describe('PaginationConfigHook', () => {
  it('pagination page is 1', () => {
    const { pagination } = init({ count: 0 });
    expect(pagination.page).toBe(1);
  });
});

import { clientForKg, clientForExplore, clientForLoopKg } from '@/graphQLSerVer';

/**
 * @description 查询
 * @param {object} query gql语句
 * @param {object} variables 查询参数
 */
const kgQuery = async (query, variables) => {
  const res = await clientForKg.query({
    query,
    variables,
    fetchPolicy: 'network-only'
  });

  return res;
};

/**
 * @description 查询
 * @param {object} query gql语句
 * @param {object} variables 查询参数
 */
const kgLoopQuery = async (query, variables) => {
  const res = await clientForLoopKg.query({
    query,
    variables,
    fetchPolicy: 'network-only'
  });

  return res;
};

/**
 * @description 变更
 * @param {object} query 变更语句
 * @param {object} variables 变更参数
 */
const kgMutate = async (query, variables) => {
  const res = await clientForKg.mutate({
    query,
    variables
  });

  return res;
};

const exploreQuery = async (query, variables) => {
  const res = await clientForExplore.query({
    query,
    variables,
    fetchPolicy: 'network-only'
  });

  return res;
};

export { kgQuery, kgMutate, exploreQuery, kgLoopQuery };

import { gql } from 'apollo-boost';

// 获取所有实体类
const GET_CLASSDATA = gql`
  query KGdata($id: ID!) {
    kg(id: $id) {
      id
      name
      onto {
        v {
          class
          alias
        }
      }
    }
  }
`;

// 搜索
const GET_SEARCHLIST = gql`
  query DataQuery(
    $id: ID!
    $class: String!
    $q: String!
    $page: Int = 1
    $size: Int = 20
    $query_all: Boolean!
    $search_filter_args: SearchFilterArgs!
  ) {
    search_v(
      id: $id
      class: $class
      q: $q
      page: $page
      size: $size
      query_all: $query_all
      search_filter_args: $search_filter_args
    ) {
      time
      count
      vertexes {
        class
        color
        name
        id
        expand
        analysis
        hl
        alias
        properties {
          n
          v
          hl
        }
      }
    }
  }
`;

// const GET_SEARCHLIST = gql`
//   query DataQuery($id: ID!, $class: String!, $q: String!, $page: Int = 1, $size: Int = 20, $query_all: Boolean!) {
//     search_v(id: $id, class: $class, q: $q, page: $page, size: $size, query_all: $query_all) {
//       time
//       count
//       vertexes {
//         class
//         color
//         name
//         id
//         expand
//         analysis
//         hl
//         alias
//         properties {
//           n
//           v
//           hl
//         }
//       }
//     }
//   }
// `;

const GET_SEARCHE = gql`
  query GetSearchE($id: ID!, $rid: String!) {
    search_e(id: $id, rid: $rid) {
      inE {
        class
        color
        count
        alias
      }
      outE {
        class
        color
        count
        alias
      }
    }
  }
`;

export { GET_CLASSDATA, GET_SEARCHLIST, GET_SEARCHE };

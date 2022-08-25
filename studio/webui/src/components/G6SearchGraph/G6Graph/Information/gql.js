import { gql } from 'apollo-boost';

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

const GET_EXPANDE = gql`
  query getExpandE($id: ID!, $class: String!, $io: String!, $rid: String!, $page: Int = 1, $size: Int = -1) {
    expand_e(id: $id, class: $class, io: $io, rid: $rid, page: $page, size: $size) {
      id
      class
      color
      name
      alias
      properties {
        n
        v
      }
      inV {
        id
        class
        color
        name
        expand
        analysis
        alias
        properties {
          n
          v
        }
      }
      outV {
        id
        class
        color
        name
        expand
        analysis
        alias
        properties {
          n
          v
        }
      }
    }
  }
`;

export { GET_EXPANDE, GET_SEARCHE };

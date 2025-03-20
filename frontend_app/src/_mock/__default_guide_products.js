import { gql, useQuery } from '@apollo/client';



const GET_ALL_DEFAULT_GUIDE_PRODUCTS = gql`
  {
    allProjectDefaultGuideProducts {
      createdTime
      description
      id
      isActive
      lastModifiedTime
      name
      order
      price
    }
  }
`;

export const useDefaultGuideProductsQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_DEFAULT_GUIDE_PRODUCTS, {
    context: {
      clientName: 'Projects',
    },
  });

  const defaultGuideProducts = data?.allProjectDefaultGuideProducts || [];

  return { loading, error, data: defaultGuideProducts, refetch };

};
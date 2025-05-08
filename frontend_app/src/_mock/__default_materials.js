import { gql, useQuery } from '@apollo/client';



const GET_ALL_DEFAULT_MATERIALS = gql`
  {
    allProjectDefaultMaterials {
      createdTime
      description
      id
      isActive
      lastModifiedTime
      name
      price
      quantity
      isPackaged
      packageQuantity
    }
  }
`;

export const useDefaultMaterialsQuery = () => {

  const { loading, error, data, refetch } = useQuery(GET_ALL_DEFAULT_MATERIALS, {
    context: {
      clientName: 'Projects',
    },
  });

  const defaultMaterials = data?.allProjectDefaultMaterials || [];

  return { loading, error, data: defaultMaterials, refetch };

};
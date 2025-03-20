import { split, HttpLink, ApolloClient, InMemoryCache } from '@apollo/client';

import { CONFIG } from '../config-global';

const httpLinkProjects = new HttpLink({
  uri: `${CONFIG.apiUrl}/projects/graphql/`,
});

const httpLinkUsers = new HttpLink({
  uri: `${CONFIG.apiUrl}/users/graphql/`,
});

const httpLinkServices = new HttpLink({
  uri: `${CONFIG.apiUrl}/services/graphql/`,
});

const splitLink = split(
  (operation) => operation.getContext().clientName === 'Projects',
  httpLinkProjects,
  split(
    (operation) => operation.getContext().clientName === 'Users',
    httpLinkUsers,
    httpLinkServices
  )
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;

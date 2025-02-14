import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  split,
} from '@apollo/client';
import { CONFIG } from '../config-global';


const client = new ApolloClient({
  uri: `${CONFIG.apiUrl}/projects/graphql/`, 
  cache: new InMemoryCache(),
});

export default client;

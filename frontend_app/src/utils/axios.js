import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });
const axiosInstanceBackend = axios.create({ baseURL: CONFIG.apiUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance ;

axiosInstanceBackend.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export { axiosInstanceBackend };

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

export const fetcherBackend = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstanceBackend.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/chat',
  kanban: '/kanban',
  calendar: '/calendar',
  auth: {
    me: '/auth/me',
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    login: '/authorization/login/',
    token: '/authorization/token/',
  },
  mail: {
    list: '/mail/list',
    details: '/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/post/list',
    details: '/post/details',
    latest: '/post/latest',
    search: '/post/search',
  },
  product: {
    list: '/product/list',
    details: '/product/details',
    search: '/product/search',
  },
  item: {
    list: '/product/list',
  },
};

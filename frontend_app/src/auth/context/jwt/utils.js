import { paths } from 'src/routes/paths';

import axios from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { STORAGE_KEY, STORAGE_KEY_REFRESH } from './constant';


// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp) {
  const currentTime = Date.now();
  const gracePeriod = 30 * 60 * 1000;
  const timeLeft = exp * 1000 - currentTime + gracePeriod;

  setTimeout(() => {
    try {
      alert('Token expired!');
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken, refreshToken) {
  // console.log('setSession', accessToken, refreshToken);
  try {
    if (accessToken && refreshToken) {
      sessionStorage.setItem(STORAGE_KEY, accessToken);
      sessionStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY_REFRESH);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function renewToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    sessionStorage.removeItem('accessToken');
    window.location.href = paths.auth.jwt.signIn;
    return;
  }

  try {
    const response = await axios.post(`${CONFIG.apiUrl}/authorization/token/refresh/`, { 
      refresh: refreshToken 
    });
    const newAccessToken = response.data.accessToken;
    setSession(newAccessToken, refreshToken);
  } catch (error) {
    console.error('Error renewing token:', error);
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = paths.auth.jwt.signIn;
  }
}
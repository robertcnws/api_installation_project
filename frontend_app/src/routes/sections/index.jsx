import { lazy, Suspense, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { useDataContext } from 'src/auth/context/data/data-context';

import { Backdrop, CircularProgress, Typography, Button } from '@mui/material';

import { LoadingContext } from 'src/auth/context/loading-context';

import { MainLayout } from 'src/layouts/main';

import { SplashScreen } from 'src/components/loading-screen';

import { AuthSplitLayout } from 'src/layouts/auth-split';

import { GuestGuard } from 'src/auth/guard';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';






// ----------------------------------------------------------------------

// const HomePage = lazy(() => import('src/pages/home'));
const Jwt = {
  SignInPage: lazy(() => import('src/pages/auth/jwt/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/jwt/sign-up')),
};

export function Router() {

  const { loadedPermissions } = useDataContext();

  const [listPermissions, setListPermissions] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userLogged'));
    if (loadedPermissions && user) {
      const results = loadedPermissions?.results;

      const permissions = results?.filter((item) => item.username === user?.data.username);

      if (permissions.length > 0) {
        setListPermissions(permissions[0].permissions);
      }

    }
  }, [loadedPermissions]);

  return useRoutes([
    {
      path: '/',
      /**
       * Skip home page
       * element: <Navigate to={CONFIG.auth.redirectPath} replace />,
       */
      // element: (
      //   <Suspense fallback={<SplashScreen />}>
      //     <MainLayout>
      //       <HomePage />
      //     </MainLayout>
      //   </Suspense>
      // ),
      element: (
        <Suspense fallback={<SplashScreen />}>
          <GuestGuard>
            <AuthSplitLayout section={{ title: '' }}>
              <Jwt.SignInPage />
            </AuthSplitLayout>
          </GuestGuard>
        </Suspense>
      ),
    },

    // Auth
    ...authRoutes,
    ...authDemoRoutes,

    // Dashboard
    ...dashboardRoutes(listPermissions),

    // Main
    ...mainRoutes,

    // Components
    ...componentsRoutes,

    // No match
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}

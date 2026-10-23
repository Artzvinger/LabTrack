import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router';

import RequireAuth from '../auth/RequireAuth';

import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import SamplesPage from '../pages/SamplesPage';
import SampleDetailsPage from '../pages/SampleDetailsPage';

import type { User } from '../types/sample';

type AppRouterProviderProps = {
    user: User | null;
    error: string;
    onLogin: (
        username: string,
        password: string,
    ) => Promise<void>;
    onLogout: () => Promise<void>;
    onUserChange: (user: User) => void;
    onSessionExpired: () => void;
};

function AppRouterProvider({
                               user,
                               error,
                               onLogin,
                               onLogout,
                               onUserChange,
                               onSessionExpired,
                           }: AppRouterProviderProps) {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <LoginPage
                            user={user}
                            error={error}
                            onLogin={onLogin}
                        />
                    }
                />

                <Route
                    element={
                        <RequireAuth
                            user={user}
                        />
                    }
                >
                    <Route
                        path="/samples"
                        element={
                            <SamplesPage
                                user={user!}
                                onLogout={
                                    onLogout
                                }
                                onSessionExpired={
                                    onSessionExpired
                                }
                            />
                        }
                    />

                    <Route
                        path="/samples/:id"
                        element={
                            <SampleDetailsPage
                                onSessionExpired={
                                    onSessionExpired
                                }
                            />
                        }
                    />

                    <Route
                        path="/profile"
                        element={
                            <ProfilePage
                                user={user!}
                                onUserChange={
                                    onUserChange
                                }
                                onLogout={onLogout}
                                onSessionExpired={
                                    onSessionExpired
                                }
                            />
                        }
                    />
                </Route>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                user
                                    ? '/samples'
                                    : '/login'
                            }
                            replace
                        />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to={
                                user
                                    ? '/samples'
                                    : '/login'
                            }
                            replace
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouterProvider;
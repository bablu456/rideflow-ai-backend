export const saveSession = (authResponse) => {
  if (!authResponse?.token) return;

  localStorage.setItem('token', authResponse.token);

  const authUser = {
    userId: authResponse.userId ?? null,
    name: authResponse.name ?? null,
    email: authResponse.email ?? null,
    roles: authResponse.roles ?? [],
    primaryRole: authResponse.primaryRole ?? 'RIDER',
    driverId: authResponse.driverId ?? null,
  };

  localStorage.setItem('authUser', JSON.stringify(authUser));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authUser');
};

export const getAuthUser = () => {
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const getPrimaryRole = () => {
  const authUser = getAuthUser();
  return authUser?.primaryRole ?? 'RIDER';
};

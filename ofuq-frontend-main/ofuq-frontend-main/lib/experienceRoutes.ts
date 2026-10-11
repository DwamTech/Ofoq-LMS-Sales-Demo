/** Marketing entry only; protected-page redirects retain /auth. */
export const experienceRoutes = {
  gateway: '/experience',
  login: '/login_old',
  register: '/register_old',
  student: '/user',
  admin: '/admin',
} as const;

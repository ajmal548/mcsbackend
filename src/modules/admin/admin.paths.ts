const adminPaths = {
  root: '/auth',
  auth: {
    login: '/admin/login',
  },
  admin: {
    base: '/admin',
    list: '/admin/list',
    byId: '/admin/:id',
  },
};

export default adminPaths;

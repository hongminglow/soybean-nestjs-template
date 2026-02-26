import { request } from '../request';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({
    url: '/role/page',
    method: 'get',
    params
  });
}

/**
 * get all roles
 *
 * these roles are all enabled
 */
export function fetchGetAllRoles() {
  return request<Api.SystemManage.RoleList>({
    url: '/role/page',
    method: 'get',
    params: {
      current: 1,
      size: 999,
      status: 'ENABLED'
    }
  }).then(response => {
    if (response.error || !response.data) {
      return response;
    }

    return {
      ...response,
      data: response.data.records,
      error: null
    };
  });
}

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return request<Api.SystemManage.UserList>({
    url: '/user/page',
    method: 'get',
    params
  });
}

/** get menu list */
export async function fetchGetMenuList(): Promise<NaiveUI.FlatResponseData<Api.SystemManage.MenuList>> {
  const response = await request<Api.SystemManage.Menu[]>({
    url: '/menu/all',
    method: 'get'
  });

  if (response.error || !response.data) {
    return response;
  }

  const menus = response.data;

  return {
    ...response,
    data: {
      records: menus,
      total: menus.length,
      current: 1,
      size: menus.length || 10
    },
    error: null
  };
}

/** get all pages */
export function fetchGetAllPages() {
  return request<Api.SystemManage.Menu[]>({
    url: '/menu/all',
    method: 'get'
  }).then(response => {
    if (response.error || !response.data) {
      return response;
    }

    return {
      ...response,
      data: response.data.map(menu => menu.routeName).filter(Boolean),
      error: null
    };
  });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.Menu[]>({
    url: '/menu/tree',
    method: 'get'
  });
}

export type RoleModel = Pick<Api.SystemManage.Role, 'name' | 'code' | 'description' | 'status'>;

/**
 * 创建角色
 *
 * @param req 角色实体
 * @returns nothing
 */
export function createRole(req: RoleModel) {
  return request({
    url: '/role',
    method: 'post',
    data: {
      pid: '0',
      ...req
    }
  });
}

/**
 * 更新角色
 *
 * @param req 角色实体
 * @returns nothing
 */
export function updateRole(req: RoleModel) {
  return request({
    url: '/role',
    method: 'put',
    data: req
  });
}

/**
 * 删除角色
 *
 * @param id 删除ID
 * @returns nothing
 */
export function deleteRole(id: string) {
  return request({
    url: '/role',
    method: 'delete',
    params: { id }
  });
}

/**
 * 获取角色对应菜单数组集合
 *
 * @param roleId 角色ID
 * @returns 菜单数组集合
 */
export function fetchGetRoleMenuIds(roleId: string) {
  return request<number[]>({
    url: '/menu/getMenuIdsByRoleIdAndDomain',
    method: 'get',
    params: {
      roleId,
      domain: 'built-in'
    }
  });
}

/**
 * 角色授权菜单
 *
 * @param req 授权角色菜单实体
 * @returns nothing
 */
export function fetchAssignRoutes(req: Api.SystemManage.RoleMenu) {
  return request<boolean>({
    url: '/authorization/assignRoutes',
    method: 'post',
    data: {
      ...req,
      // eslint-disable-next-line no-warning-comments
      // TODO 超级管理员主动选择 domain管理员默认自身
      domain: 'built-in'
    }
  });
}

/**
 * 角色授权API
 *
 * @param req 授权角色API实体
 * @returns nothing
 */
export function fetchAssignPermission(req: Api.SystemManage.RolePermission) {
  return request<boolean>({
    url: '/authorization/assignPermission',
    method: 'post',
    data: {
      ...req,
      // eslint-disable-next-line no-warning-comments
      // TODO 超级管理员主动选择 domain管理员默认自身
      domain: 'built-in'
    }
  });
}

export type RouteModel = Pick<
  Api.SystemManage.Menu,
  | 'menuType'
  | 'menuName'
  | 'routeName'
  | 'routePath'
  | 'component'
  | 'order'
  | 'i18nKey'
  | 'icon'
  | 'iconType'
  | 'status'
  | 'pid'
  | 'keepAlive'
  | 'constant'
  | 'href'
  | 'hideInMenu'
  | 'activeMenu'
  | 'multiTab'
  | 'fixedIndexInTab'
>;

/**
 * 创建路由
 *
 * @param req 路由实体
 * @returns nothing
 */
export function createRoute(req: RouteModel) {
  return request({
    url: '/menu',
    method: 'post',
    data: req
  });
}

/**
 * 更新路由
 *
 * @param req 路由实体
 * @returns nothing
 */
export function updateRoute(req: RouteModel) {
  return request({
    url: '/menu',
    method: 'put',
    data: req
  });
}

/**
 * 删除路由
 *
 * @param id 路由ID
 * @returns nothing
 */
export function deleteRoute(id: number) {
  return request({
    url: '/menu',
    method: 'delete',
    params: { id }
  });
}

export type UserModel = Pick<
  Api.SystemManage.User,
  'username' | 'password' | 'domain' | 'nickName' | 'phoneNumber' | 'email' | 'status'
>;

/**
 * 创建用户
 *
 * @param req 用户实体
 * @returns nothing
 */
export function createUser(req: UserModel) {
  return request({
    url: '/user',
    method: 'post',
    data: req
  });
}

/**
 * 更新用户
 *
 * @param req 用户实体
 * @returns nothing
 */
export function updateUser(req: UserModel) {
  return request({
    url: '/user',
    method: 'put',
    data: req
  });
}

/**
 * 删除用户
 *
 * @param id 删除ID
 * @returns nothing
 */
export function deleteUser(id: string) {
  return request({
    url: '/user',
    method: 'delete',
    params: { id }
  });
}

/** get api-endpoint tree */
export function fetchGetApiEndpointTree() {
  return request<Api.SystemManage.ApiEndpoint[]>({
    url: '/endpoint/tree',
    method: 'get'
  });
}

/**
 * 获取角色对应API数组集合
 *
 * @param roleCode 角色code
 * @returns API数组集合
 */
export async function fetchGetRoleApiEndpoints(roleCode: string) {
  const response = await request<any[]>({
    url: '/endpoint/authApiEndpoint',
    method: 'get',
    params: {
      roleCode,
      domain: 'built-in'
    }
  });
  const casbinRules = response.data || [];
  return casbinRules.map(item => `${item.v1}:${item.v2}`);
}

import { request } from '../request';

export function fetchGetConfigList(params?: Config.ConfigSearchParams) {
  return request<Config.ConfigList>({
    url: '/config/page',
    method: 'get',
    params
  });
}

export function createConfig(req: Config.ConfigCreateModel) {
  return request({
    url: '/config',
    method: 'post',
    data: req
  });
}

export function updateConfig(req: Config.ConfigModel) {
  return request({
    url: '/config',
    method: 'put',
    data: req
  });
}

export function deleteConfig(id: string) {
  return request({
    url: '/config',
    method: 'delete',
    params: { id }
  });
}

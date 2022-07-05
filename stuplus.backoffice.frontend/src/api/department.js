import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/department/list',
    method: 'get',
    params: query
  })
}
export function addUpdateDepartment(data) {
  return request({
    url: '/department/addUpdateDepartment',
    method: 'post',
    data
  })
}
export function deleteDepartment(data) {
  return request({
    url: '/department/deleteDepartment',
    method: 'delete',
    data
  })
}

import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/school/list',
    method: 'get',
    params: query
  })
}
export function addUpdateSchool(data) {
  return request({
    url: '/school/addUpdateSchool',
    method: 'post',
    data
  })
}
export function deleteSchool(data) {
  return request({
    url: '/school/deleteSchool',
    method: 'delete',
    data
  })
}

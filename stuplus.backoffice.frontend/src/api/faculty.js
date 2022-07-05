import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/faculty/list',
    method: 'get',
    params: query
  })
}
export function addUpdateFaculty(data) {
  return request({
    url: '/faculty/addUpdateFaculty',
    method: 'post',
    data
  })
}
export function deleteFaculty(data) {
  return request({
    url: '/faculty/deleteFaculty',
    method: 'delete',
    data
  })
}

import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/interest/list',
    method: 'get',
    params: query
  })
}
export function addUpdateInterest(data) {
  return request({
    url: '/interest/addUpdateInterest',
    method: 'post',
    data
  })
}
export function deleteInterest(data) {
  return request({
    url: '/interest/deleteInterest',
    method: 'delete',
    data
  })
}

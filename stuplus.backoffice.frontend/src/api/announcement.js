import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/announcement/list',
    method: 'get',
    params: query
  })
}
export function addUpdateAnnouncement(data) {
  return request({
    url: '/announcement/addUpdateAnnouncement',
    method: 'post',
    data
  })
}
export function deleteAnnouncement(data) {
  return request({
    url: '/announcement/deleteAnnouncement',
    method: 'delete',
    data
  })
}

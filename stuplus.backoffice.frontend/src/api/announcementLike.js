import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/announcementLike/list',
    method: 'get',
    params: query
  })
}
export function addUpdateAnnouncementLike(data) {
  return request({
    url: '/announcementLike/addUpdateAnnouncementLike',
    method: 'post',
    data
  })
}
export function deleteAnnouncementLike(data) {
  return request({
    url: '/announcementLike/deleteAnnouncementLike',
    method: 'delete',
    data
  })
}

import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/announcementComment/list',
    method: 'get',
    params: query
  })
}
export function addUpdateAnnouncementComment(data) {
  return request({
    url: '/announcementComment/addUpdateAnnouncementComment',
    method: 'post',
    data
  })
}
export function deleteAnnouncementComment(data) {
  return request({
    url: '/announcementComment/deleteAnnouncementComment',
    method: 'delete',
    data
  })
}

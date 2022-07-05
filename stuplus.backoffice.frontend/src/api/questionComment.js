import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/questionComment/list',
    method: 'get',
    params: query
  })
}
export function addUpdateQuestionComment(data) {
  return request({
    url: '/questionComment/addUpdateQuestionComment',
    method: 'post',
    data
  })
}
export function deleteQuestionComment(data) {
  return request({
    url: '/questionComment/deleteQuestionComment',
    method: 'delete',
    data
  })
}

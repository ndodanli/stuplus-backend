import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/questionCommentLike/list',
    method: 'get',
    params: query
  })
}
export function addUpdateQuestionCommentLike(data) {
  return request({
    url: '/questionCommentLike/addUpdateQuestionCommentLike',
    method: 'post',
    data
  })
}
export function deleteQuestionCommentLike(data) {
  return request({
    url: '/questionCommentLike/deleteQuestionCommentLike',
    method: 'delete',
    data
  })
}

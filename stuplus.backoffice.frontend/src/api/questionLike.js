import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/questionLike/list',
    method: 'get',
    params: query
  })
}
export function addUpdateQuestionLike(data) {
  return request({
    url: '/questionLike/addUpdateQuestionLike',
    method: 'post',
    data
  })
}
export function deleteQuestionLike(data) {
  return request({
    url: '/questionLike/deleteQuestionLike',
    method: 'delete',
    data
  })
}

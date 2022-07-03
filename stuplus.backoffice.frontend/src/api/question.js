import request from '@/utils/request'

export function fetchList(query) {
  console.log
  return request({
    url: '/question/list',
    method: 'get',
    params: query
  })
}
export function addUpdateQuestion(data) {
  return request({
    url: '/question/addUpdateQuestion',
    method: 'post',
    data
  })
}
export function deleteQuestion(data) {
  return request({
    url: '/question/deleteQuestion',
    method: 'delete',
    data
  })
}

import request from '@/utils/request'

export function uploadFile(data) {
  return request({
    url: '/general/uploadFile',
    method: 'post',
    data
  })
}

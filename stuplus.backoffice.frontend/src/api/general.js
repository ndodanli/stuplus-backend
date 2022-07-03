import request from '@/utils/request'

export function uploadFile(data) {
  return request({
    url: '/general/uploadFile',
    method: 'post',
    data
  })
}

export function getAllInterests() {
  return request({
    url: '/general/getAllInterests',
    method: 'get'
  })
}

export function getAllSchools() {
  return request({
    url: '/general/getAllSchools',
    method: 'get'
  })
}

export function getAllFaculties() {
  return request({
    url: '/general/getAllFaculties',
    method: 'get'
  })
}

export function getAllDepartments() {
  return request({
    url: '/general/getAllDepartments',
    method: 'get'
  })
}

export function getUsers(query) {
  return request({
    url: '/general/getUsers',
    method: 'get',
    params: query
  })
}
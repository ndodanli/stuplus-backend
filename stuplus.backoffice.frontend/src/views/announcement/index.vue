<template>
  <div class="app-container">
    <div class="filter-container d-flex" style="gap:5px;">
      <el-input v-model="listQuery.search" placeholder="Title" style="width: 200px" class="filter-item"
        @keyup.enter.native="handleFilter" />
      <el-select v-model="listQuery.sort" style="width: 140px" class="filter-item" @change="handleFilter">
        <el-option v-for="item in sortOptions" :key="item.key" :label="item.label" :value="item.key" />
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px" type="primary" icon="el-icon-edit" @click="handleCreate">
        Add
      </el-button>
      <!-- <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download"
        @click="handleDownload">
        Export
      </el-button> -->
    </div>

    <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%"
      @sort-change="sortChange">
      <el-table-column label="Order No" width="150px" align="center">
        <template slot-scope="scope">
          <span>{{
          (listQuery.page - 1) * listQuery.pageSize + scope.$index + 1
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Owner" prop="ownerId" align="center">
        <template slot-scope="{ row }">
          <span style="font-size:14px;" class="m-1">
            <el-tag type="success"> {{ owners.find(user => user._id === row.ownerId)?.username }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Title" prop="title" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Cover Image" width="120px" prop="coverImageUrl" align="center">
        <template slot-scope="{ row }">
          <span><img :src="row.coverImageUrl || 'https://www.ibavet.com.tr/wp-content/uploads/2021/11/a01.png'"
              width="100px" height="100px" style="border: 0;"></span>
        </template>
      </el-table-column>
      <el-table-column label="Related Schools" prop="relatedSchoolIds" align="center">
        <template slot-scope="{ row }">
          <span v-if="!anySchool(row.relatedSchoolIds)" style="font-size:14px;" class="m-1">
            <el-tag type="info">
              All
            </el-tag>
          </span>
          <span v-else style="font-size:14px;" class="m-1" v-for="relatedSchoolId in row.relatedSchoolIds">
            <el-tag type="light">
              {{ getSchoolTitle(relatedSchoolId) }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Text" prop="text" width="300px" align="center">
        <template slot-scope="{ row }">
          <span :inner-html.prop="row.text | truncate(250)"></span>
        </template>
      </el-table-column>
      <el-table-column label="Is Active?" prop="isActive" align="center">
        <template slot-scope="{ row }">
          <span v-if="row.isActive">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="green" class="bi bi-check"
              viewBox="0 0 16 16">
              <path
                d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z">
              </path>
            </svg></span>
          <span v-else>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="red" class="bi bi-x"
              viewBox="0 0 16 16">
              <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="From/To" width="200px" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.fromDate ? formatDate(row.fromDate) : 'N/A' }}</span> <br>
          <span>{{ row.toDate ? formatDate(row.toDate) : 'N/A' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Created/Updated At" width="250px" align="center">
        <template slot-scope="{ row }">
          <span>{{ formatDate(row.createdAt) }}</span> <br>
          <span>{{ formatDate(row.updatedAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{ row, $index }">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            Edit
          </el-button>
          <el-button v-if="row.status != 'deleted'" size="mini" type="danger" @click="handleDelete(row, $index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.pageSize"
      @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left">
        <el-form-item label="User" prop="ownerId">
          <el-select v-model="temp.ownerId" filterable placeholder="Select user..." remote reserve-keyword
            :remote-method="remoteMethod" :loading="remoteLoading">
            <el-option v-for="item in users" :key="item._id" :label="item.username" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Title" prop="title">
          <el-input v-model="temp.title" />
        </el-form-item>
        <el-form-item label="Cover Image" prop="coverImageUrl">
          <el-upload name="file" class="avatar-uploader" :action="uploadFilePath" :show-file-list="false"
            :headers="{ Authorization: 'Bearer ' + token }" :on-success="handleCoverImageUploadSuccess"
            :before-upload="handleCoverImageUploadBefore">
            <img v-if="temp.coverImageUrl" :src="temp.coverImageUrl" width="150px" height="150px">
            <i v-else class="el-icon-plus avatar-uploader-icon" />
          </el-upload>
        </el-form-item>
        <el-form-item label="Related Schools" prop="relatedSchoolIds">
          <el-select v-model="temp.relatedSchoolIds" multiple filterable placeholder="Select a school...">
            <el-option v-for="item in schools" :key="item._id" :label="getSchoolTitle(item._id)" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Text" prop="text">
          <ckeditor :editor="editor" v-model="temp.text" :config="editorConfig"></ckeditor>
        </el-form-item>
        <el-form-item label="Is Active?" prop="isActive">
          <el-checkbox v-model="temp.isActive">Active</el-checkbox>
        </el-form-item>
        <el-form-item label="From" prop="fromDate">
          <el-date-picker v-model="temp.fromDate" type="datetime" placeholder="Select date and time">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="To" prop="toDate">
          <el-date-picker v-model="temp.toDate" type="datetime" placeholder="Select date and time">
          </el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false"> Cancel </el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
          Confirm
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { fetchList, addUpdateAnnouncement, deleteAnnouncement } from '@/api/announcement'
import { getAllSchools, getUsers } from '@/api/general'
import waves from '@/directive/waves' // waves directive
import { formatDate, parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { getToken } from '@/utils/auth'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import VClamp from 'vue-clamp'
const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]

// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'Schools',
  components: { Pagination, VClamp },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      editor: ClassicEditor,
      editorData: '<p>Content of the editor.</p>',
      editorConfig: {
        // The configuration of the editor.
      },
      token: getToken(),
      uploadFilePath:
        'process.env.VUE_APP_BASE_API/general/uploadFile?uploadPath=announcement/cover_images',
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        pageSize: 20,
        sort: '-createdAt',
        search: null
      },
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      sortOptions: [
        { label: 'Created At Ascending', key: '+createdAt' },
        { label: 'Created At Descending', key: '-createdAt' }
      ],
      statusOptions: ['published', 'draft', 'deleted'],
      showReviewer: false,
      temp: {
        _id: null,
        ownerId: null,
        title: null,
        coverImageUrl: null,
        relatedSchoolIds: null,
        text: null,
        isActive: null,
        fromDate: null,
        toDate: null,
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        title: [
          { required: true, message: 'Title is required', trigger: 'blur' }
        ],
        ownerId: [
          { required: true, message: 'Owner is required', trigger: 'blur' }
        ],
        text: [
          { required: true, message: 'text is required', trigger: 'blur' }
        ]
      },
      downloadLoading: false,
      schools: [],
      users: [],
      owners: [],
      remoteLoading: false,
      schoolTypes: {
        OpenEducation: 0,
        Government: 1,
        Special: 2
      }
    }
  },
  async created() {
    this.getList()
    const schoolResult = await getAllSchools();
    this.schools = schoolResult?.data
    console.log("schools", this.schools)
  },
  methods: {
    anySchool(relatedSchoolIds) {
      return this.schools.map(x => x._id).some(x => relatedSchoolIds.includes(x));
    },
    getSchoolTitle(schoolId) {
      const school = this.schools.find(x => x._id === schoolId);
      let title = school?.title;
      if (school.type === this.schoolTypes.OpenEducation) {
        title = `${title} (Açık Öğretim)`
      } else if (school.type === this.schoolTypes.Government) {
        title = `${title} (Devlet)`
      } else if (school.type === this.schoolTypes.Special) {
        title = `${title} (Özel)`
      }
      return title;
    },
    async remoteMethod(query) {
      if (query !== '') {
        this.remoteLoading = true;
        const userResult = await getUsers({ search: query });
        this.users = userResult?.data
        //concat two arrays without duplicates
        this.owners = this.users.concat(this.owners)
        this.remoteLoading = false;
        console.log(" this.owners: ", this.owners)
      } else {
        this.users = [];
      }
    },
    handleCoverImageUploadSuccess(res, file) {
      this.temp.coverImageUrl = res.data.url
    },
    handleCoverImageUploadBefore(file) {
      const isJpgOrPng =
        file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        this.$message.error('You can only upload JPG/PNG file!')
      }
      const isLt2M = file.size / 1024 / 1024 < 5
      if (!isLt2M) {
        this.$message.error('Image must smaller than 5MB')
      }
      this.$message.info('Uploading...')
      return isJpgOrPng && isLt2M
    },
    formatDate: formatDate,
    getList() {
      this.listLoading = true
      fetchList(this.listQuery).then((response) => {
        this.list = response.data.items
        this.total = response.data.total
        this.owners = response.data.owners
        this.users = response.data.owners
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+createdAt'
      } else {
        this.listQuery.sort = '-createdAt'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        _id: null,
        ownerId: null,
        title: null,
        coverImageUrl: null,
        relatedSchoolIds: null,
        text: null,
        isActive: null,
        fromDate: null,
        toDate: null,
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          addUpdateAnnouncement(this.temp).then(() => {
            this.temp.createdAt = new Date().toISOString()
            this.temp.updatedAt = new Date().toISOString()
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          console.log('tempData', tempData)
          addUpdateAnnouncement(tempData).then(() => {
            const index = this.list.findIndex((v) => v._id === this.temp._id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      this.$swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          deleteAnnouncement({ _id: row._id }).then(() => {
            this.$notify({
              title: 'Success',
              message: 'Deleted Successfully',
              type: 'success',
              duration: 2000
            })
            this.list.splice(index, 1)
          })
        }
      })
    },
    handleFetchPv(pv) {
      fetchPv(pv).then((response) => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then((excel) => {
        const tHeader = ['timestamp', 'title', 'type', 'importance', 'status']
        const filterVal = [
          'timestamp',
          'title',
          'type',
          'importance',
          'status'
        ]
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    },
    formatJson(filterVal) {
      return this.list.map((v) =>
        filterVal.map((j) => {
          if (j === 'timestamp') {
            return parseTime(v[j])
          } else {
            return v[j]
          }
        })
      )
    },
    getSortClass: function (key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  },
}
</script>
<style>
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

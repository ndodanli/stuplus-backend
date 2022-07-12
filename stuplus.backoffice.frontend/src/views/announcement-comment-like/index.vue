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
      <el-table-column label="Announcement" prop="announcementId" align="center">
        <template slot-scope="{ row }">
          <span style="font-size:14px;" class="m-1">
            <el-tag type="success"> {{ announcements.find(announcement => announcement._id ===
                row.announcementId)?.title
            }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Comment" prop="commentId" align="center">
        <template slot-scope="{ row }">
          <span style="font-size:14px;" class="m-1">
            <el-tag type="success"> {{ commentsData.find(comment => comment._id ===
                row.commentId)?.comment
            }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Type" prop="type" align="center">
        <template slot-scope="{ row }">
          <span class="m-1">
            <img v-if="row.type == 1" src="@/assets/images/heart.png" width="25px" height="25px" />
            <img v-else-if="row.type == 0" src="@/assets/images/dislike.png" width="25px" height="25px" />
            <span v-else>None</span>
          </span>
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
        <el-form-item label="Announcement" prop="announcementId">
          <el-select @change="handleAnnouncementChange(temp.announcementId)" v-model="temp.announcementId" filterable
            placeholder="Select announcement..." remote reserve-keyword :remote-method="remoteMethodAnnouncement"
            :loading="remoteLoading">
            <el-option v-for="item in searchedAnnouncements" :key="item._id" :label="item.title" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Comment" prop="commentId">
          <el-select v-model="temp.commentId" filterable placeholder="Select comment...">
            <el-option v-for="item in comments" :key="item._id" :label="item.comment" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-select v-model="temp.type" placeholder="Select Like type...">
            <el-option v-for="likeType in likeTypes" :key="likeType.value" :label="likeType.key"
              :value="likeType.value">
            </el-option>
          </el-select>
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
import { fetchList, fetchPv, addUpdateAnnouncementCommentLike, deleteAnnouncementCommentLike } from '@/api/announcementCommentLike'
import waves from '@/directive/waves' // waves directive
import { formatDate, parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { getToken } from '@/utils/auth'
import { getUsers, getAnnouncements, getAnnouncementComments } from '@/api/general'
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
  components: { Pagination },
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
      token: getToken(),
      uploadFilePath:
        'http://212.98.224.208:25050/general/uploadFile?uploadPath=school_images',
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
        commentId: null,
        announcementId: null,
        type: null
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
        ownerId: [
          { required: true, message: 'Owner is required', trigger: 'blur' }
        ],
        commentId: [
          { required: true, message: 'Comment is required', trigger: 'blur' }
        ],
        announcementId: [
          { required: true, message: 'Announcement is required', trigger: 'blur' }
        ],
        type: [
          { required: true, message: 'Type is required', trigger: 'blur' }
        ],
      },
      downloadLoading: false,
      owners: [],
      users: [],
      announcements: [],
      searchedAnnouncements: [],
      remoteLoading: false,
      likeTypes: [
        { key: "Dislike", value: 0 },
        { key: "Like", value: 1 },
      ],
      comments: [],
      commentsData: []
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async handleAnnouncementChange(announcementId) {
      const commentsResult = await getAnnouncementComments({ announcementId: announcementId });
      this.comments = commentsResult.data;
    },
    async remoteMethod(query) {
      if (query !== '') {
        this.remoteLoading = true;
        const userResult = await getUsers({ search: query });
        this.users = userResult?.data
        this.owners = this.users.concat(this.owners)
        this.remoteLoading = false;
        console.log(" this.owners: ", this.owners)
      } else {
        this.users = [];
      }
    },
    async remoteMethodAnnouncement(query) {
      if (query !== '') {
        this.remoteLoading = true;
        const annoResult = await getAnnouncements({ search: query });
        this.searchedAnnouncements = annoResult?.data
        this.announcements = this.searchedAnnouncements.concat(this.announcements)
        this.remoteLoading = false;
      } else {
        this.announcements = [];
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
        console.log('response DD', response)
        this.list = response.data.items;
        this.total = response.data.total;
        this.owners = response.data.owners;
        this.users = response.data.owners;
        this.announcements = response.data.announcements;
        this.searchedAnnouncements = response.data.announcements;
        this.commentsData = response.data.comments;
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
        commentId: null,
        announcementId: null,
        type: null
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
          addUpdateAnnouncementCommentLike(this.temp).then(() => {
            this.temp.createdAt = new Date().toISOString()
            this.temp.updatedAt = new Date().toISOString()
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.commentsData = this.comments.concat(this.commentsData)
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
      this.comments.push(this.commentsData.find(x => x._id == this.temp.commentId));
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
          addUpdateAnnouncementCommentLike(tempData).then(() => {
            const index = this.list.findIndex((v) => v._id === this.temp._id);
            this.list.splice(index, 1, this.temp);
            this.dialogFormVisible = false;
            this.commentsData = this.comments.concat(this.commentsData);
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
          deleteAnnouncementCommentLike({ _id: row._id }).then(() => {
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
  }
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

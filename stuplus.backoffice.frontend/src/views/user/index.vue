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
      <el-table-column label="Order No" width="70px" align="center">
        <template slot-scope="scope">
          <span>{{
              (listQuery.page - 1) * listQuery.pageSize + scope.$index + 1
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Email" prop="email" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.email }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Username" prop="username" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.username }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Role" prop="role" align="center">
        <template slot-scope="{ row }">
          <span>
            <el-tag type="success">
              {{ getRoleName(row.role) }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="First Name" prop="firstName" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.firstName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Last Name" prop="lastName" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.lastName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="School" prop="schoolId" align="center">
        <template slot-scope="{ row }">
          <span v-if="!anySchool([row.schoolId])" style="font-size:14px;" class="m-1">
            <el-tag type="danger">
              None
            </el-tag>
          </span>
          <span v-else style="font-size:14px;" class="m-1">
            <el-tag type="light">
              {{ schools.find(school => school._id === row.schoolId)?.title }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Faculty" prop="facultyId" align="center">
        <template slot-scope="{ row }">
          <span v-if="!anySchool([row.facultyId])" style="font-size:14px;" class="m-1">
            <el-tag type="danger">
              None
            </el-tag>
          </span>
          <span v-else style="font-size:14px;" class="m-1">
            <el-tag type="light">
              {{ faculties.find(faculty => faculty._id === row.facultyId)?.title }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="Department" prop="departmentId" align="center">
        <template slot-scope="{ row }">
          <span v-if="!anySchool([row.departmentId])" style="font-size:14px;" class="m-1">
            <el-tag type="danger">
              None
            </el-tag>
          </span>
          <span v-else style="font-size:14px;" class="m-1">
            <el-tag type="light">
              {{ departments.find(department => department._id === row.departmentId)?.title }}
            </el-tag>
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
        <el-form-item label="Email" prop="email">
          <el-input v-model="temp.email" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="temp.password" />
        </el-form-item>
        <el-form-item label="Username" prop="username">
          <el-input v-model="temp.username" />
        </el-form-item>
        <el-form-item label="Role" prop="role">
          <el-select v-model="temp.role" placeholder="Select Role...">
            <el-option v-for="role in roles" :key="role.value" :label="role.key" :value="role.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="School Email" prop="schoolEmail">
          <el-input v-model="temp.schoolEmail" />
        </el-form-item>
        <el-form-item label="First Name" prop="firstName">
          <el-input v-model="temp.firstName" />
        </el-form-item>
        <el-form-item label="Last Name" prop="lastName">
          <el-input v-model="temp.lastName" />
        </el-form-item>
        <el-form-item label="Phone Number" prop="phoneNumber">
          <el-input v-model="temp.phoneNumber" />
        </el-form-item>
        <el-form-item label="School" prop="schoolId">
          <el-select v-model="temp.schoolId" filterable placeholder="Select school...">
            <el-option v-for="item in schools" :key="item._id" :label="item.title" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Faculty" prop="facultyId">
          <el-select v-model="temp.facultyId" filterable placeholder="Select school...">
            <el-option v-for="item in faculties" :key="item._id" :label="item.title" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Department" prop="departmentId">
          <el-select v-model="temp.departmentId" filterable placeholder="Select school...">
            <el-option v-for="item in departments" :key="item._id" :label="item.title" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Account Email Confirmed?" prop="isAccEmailConfirmed">
          <el-checkbox v-model="temp.isAccEmailConfirmed">Confirmed</el-checkbox>
        </el-form-item>
        <el-form-item label="School Email Confirmed?" prop="isSchoolEmailConfirmed">
          <el-checkbox v-model="temp.isSchoolEmailConfirmed">Confirmed</el-checkbox>
        </el-form-item>
        <el-form-item label="Grade" prop="grade">
          <el-input-number v-model="temp.grade" :min="1" :max="10"></el-input-number>
        </el-form-item>
        <el-form-item label="Profile Photo" prop="profilePhotoUrl">
          <el-upload name="file" class="avatar-uploader" :action="uploadFilePath" :show-file-list="false"
            :headers="{ Authorization: 'Bearer ' + token }" :on-success="handleCoverImageUploadSuccess"
            :before-upload="handleCoverImageUploadBefore">
            <img v-if="temp.profilePhotoUrl" :src="temp.profilePhotoUrl" width="150px" height="150px">
            <i v-else class="el-icon-plus avatar-uploader-icon" />
          </el-upload>
        </el-form-item>
        <el-form-item label="Gender" prop="gender">
          <el-select v-model="temp.gender" placeholder="Select Gender...">
            <el-option v-for="gender in genders" :key="gender.value" :label="gender.key" :value="gender.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Interests" prop="interestIds">
          <el-select v-model="temp.interestIds" multiple filterable placeholder="Select a interest...">
            <el-option v-for="item in interests" :key="item._id" :label="item.title" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Related Schools" prop="relatedSchoolIds">
          <el-select v-model="temp.relatedSchoolIds" multiple filterable placeholder="Select a school...">
            <el-option v-for="item in schools" :key="item._id" :label="item.title" :value="item._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Avatar Key" prop="avatarKey">
          <el-input v-model="temp.avatarKey" />
        </el-form-item>
        <el-form-item label="First Name" prop="about">
          <el-input type="textarea" v-model="temp.about" />
        </el-form-item>
        <hr />
        <h3>Privacy Settings</h3>
        <el-form-item label="Follow Limitation" prop="gender">
          <el-select v-model="temp.privacySettings.followLimitation" placeholder="Select Limitation...">
            <el-option v-for="followLimitation in followLimitations" :key="followLimitation.value"
              :label="followLimitation.key" :value="followLimitation.value">
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
import { fetchList, addUpdateUser, deleteUser } from '@/api/user'
import { getAllSchools, getAllInterests, getAllFaculties, getAllDepartments, getUsers } from '@/api/general'
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
        'http://212.98.224.208:25050/general/uploadFile?uploadPath=profile_images',
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
        email: null,
        password: null,
        role: null,
        schoolEmail: null,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        schoolId: null,
        facultyId: null,
        departmentId: null,
        isAccEmailConfirmed: null,
        isSchoolEmailConfirmed: null,
        grade: null,
        profilePhotoUrl: null,
        gender: null,
        notificationSettings: {},
        blockedUserIds: [],
        interestIds: [],
        relatedSchoolIds: [],
        avatarKey: null,
        about: null,
        privacySettings: {
          followLimitation: null
        },
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
        email: [
          { required: true, message: 'email is required', trigger: 'blur' }
        ],
        role: [
          { required: true, message: 'role is required', trigger: 'blur' }
        ],
        firstName: [
          { required: true, message: 'firstName is required', trigger: 'blur' }
        ],
        lastName: [
          { required: true, message: 'lastName is required', trigger: 'blur' }
        ],
        gender: [
          { required: true, message: 'gender is required', trigger: 'blur' }
        ],
        avatarKey: [
          { required: true, message: 'avatarKey is required', trigger: 'blur' }
        ],
      },
      downloadLoading: false,
      schools: [],
      faculties: [],
      departments: [],
      interests: [],
      users: [],
      owners: [],
      remoteLoading: false,
      roles: [
        { key: "Admin", value: 0 },
        { key: "User", value: 1 },
        { key: "ContentCreator", value: 2 },
        { key: "GroupGuard", value: 3 },
      ],
      genders: [
        { key: "NotSpecified", value: 0 },
        { key: "Male", value: 1 },
        { key: "Female", value: 2 },
        { key: "NotDefined", value: 3 },

      ],
      followLimitations: [
        { key: "None", value: 0 },
        { key: "By Request", value: 1 },
      ],
    }
  },
  async created() {
    this.getList()
    const interestResult = await getAllInterests();
    this.interests = interestResult?.data
    const schoolResult = await getAllSchools();
    this.schools = schoolResult?.data
    const facultyResult = await getAllFaculties();
    this.faculties = facultyResult?.data
    const departmentResult = await getAllDepartments();
    this.departments = departmentResult?.data
  },
  methods: {
    getRoleName(role) {
      return this.roles.find(x => x.value == role).key;
    },
    anySchool(relatedSchoolIds) {
      console.log("anyschool", this.schools.map(x => x._id).some(x => relatedSchoolIds.includes(x)));
      return this.schools.map(x => x._id).some(x => relatedSchoolIds.includes(x));
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
      this.temp.profilePhotoUrl = res.data.url
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
        email: null,
        password: null,
        role: null,
        schoolEmail: null,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        schoolId: null,
        facultyId: null,
        departmentId: null,
        isAccEmailConfirmed: null,
        isSchoolEmailConfirmed: null,
        grade: null,
        profilePhotoUrl: null,
        gender: null,
        notificationSettings: {},
        blockedUserIds: [],
        interestIds: [],
        relatedSchoolIds: [],
        avatarKey: null,
        about: null,
        privacySettings: {
          followLimitation: null
        },
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
          addUpdateUser(this.temp).then(() => {
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
          addUpdateUser(tempData).then(() => {
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
          deleteUser({ _id: row._id }).then(() => {
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

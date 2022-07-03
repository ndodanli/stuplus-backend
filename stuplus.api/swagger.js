const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
    info: {
        version: "1.0.0",
        title: "Stuplus API",
        description: "Stuplus API Documentation."
    },
    servers: [{ url: "http://46.101.160.93:25010/", description: "Canli API" }, { url: "http://127.0.0.1:25010/", description: "Local API" },],
    basePath: "/",
    schemes: ['http'],
    consumes: ['application/json', 'multipart/form-data'],
    produces: ['application/json'],
    tags: [
        {
            "name": "Account",
            "description": "Endpoints"
        },
        {
            "name": "Announcement",
            "description": "Endpoints"
        },
        {
            "name": "Interest",
            "description": "Endpoints"
        },
        {
            "name": "Login",
            "description": "Endpoints"
        },
        {
            "name": "School",
            "description": "Endpoints"
        }
    ],
    securityDefinitions: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
        }
    },
    definitions: {
        //Requests
        NullResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        BasePaginationRequest: {
            lastRecordDate: "2022-07-02T20:12:59.891Z",
            $pageSize: 20,
        },
        GetAccountUserRequest: {

        },
        GetAccountUserResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: {
                    _id: "62ab8a204166fd1eaebbb3fa",
                    email: "ndodanli14@gmail.com",
                    role: 0,
                    schoolId: null,
                    facultyId: null,
                    departmentId: null,
                    grade: null,
                    firstName: "string",
                    lastName: "string",
                    phoneNumber: "5073959353",
                    profilePhotoUrl: "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                    isAccEmailConfirmed: true,
                    isSchoolEmailConfirmed: false,
                    interestIds: [
                        "string"
                    ],
                    __t: "User",
                    avatarKey: "string",
                    username: "string",
                    about: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.",
                }
            }
        },
        AccountUpdateProfileRequest: {
            firstName: "string",
            lastName: "string",
            phoneNumber: "string",
            avatarKey: "string",
            about: "string"
        },
        AccountUpdateProfileResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountUpdateInterestsRequest: {
            $interestIds: ["insterestId1", "insterestId2"],
        },
        AccountUpdateInterestsResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountUpdatePasswordRequest: {
            $password: "oldPassword",
            $newPassword: "newPassword",
            $newPasswordRepeat: "newPassword",
        },
        AccountUpdatePasswordResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountForgotPasswordRequest: {
            $email: "stuplus@gmail.com",
        },
        AccountForgotPasswordResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountConfirmForgotPasswordCodeRequest: {
            $code: "12345",
            $email: "stuplus@gmail.com"
        },
        AccountConfirmForgotPasswordCodeResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountResetPasswordCodeRequest: {
            $code: "12345",
            $email: "stuplus@gmail.com",
            $newPassword: "newPassword",
            $newPasswordRepeat: "newPassword",
        },
        AccountResetPasswordCodeResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountSendConfirmationEmailRequest: {
            $isStudentEmail: false
        },
        AccountSendConfirmationEmailResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "null"
            }
        },
        AccountUpdateProfilePhotoResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: {
                    url: {
                        type: "string",
                        description: "Uploaded photo's URL."
                    },
                }
            }
        },
        AnnouncementGetAnnouncementsRequest: {
            lastRecordDate: "2022-07-02T20:12:59.891Z",
            $pageSize: 20,
            schoolIds: ["schoolId1", "schoolId2"],
        },
        AnnouncementGetAnnouncementsResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                "_id": "62af8aade035eb1764400d30",
                "ownerId": "62ab8a204166fd1eaebbb3fa",
                "owner": {
                    "_id": "62ab8a204166fd1eaebbb3fa",
                    "username": "ndodanli14",
                    "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                    "schoolId": "schoolId1",
                    "__t": "User"
                },
                "coverImageUrl": null,
                "title": "das",
                "relatedSchoolIds": [
                    "string1",
                    "string2"
                ],
                "text": "dasdsa",
                "isActive": true,
                "fromDate": null,
                "toDate": null,
                "__t": "Announcement",
                "createdAt": "2022-06-19T20:44:29.536Z",
                "updatedAt": "2022-06-19T20:44:29.536Z",
                "__v": 0,
                "recordStatus": 1,
                "likeCount": 0,
                "commentCount": 0,
                "likeType": 1
            },
        },
        AnnouncementGetCommentsRequest: {
            lastRecordDate: "2022-07-02T20:12:59.891Z",
            $pageSize: 20,
            $announcementId: "announcementId",
        },
        AnnouncementGetCommentsResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: [
                {
                    "_id": "62b6f0b662245f6dc443a9ad",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "announcementId": "62af8aade035eb1764400d36",
                    "comment": "some comment.",
                    "score": 15,
                    "recordStatus": 1,
                    "__t": "AnnouncementComment",
                    "__v": 0,
                    "createdAt": "2022-06-25T11:26:00.538Z",
                    "updatedAt": "2022-06-25T13:22:02.391Z",
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "schoolId": "schoolId1",
                        "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2
                },
                {
                    "_id": "62b6f0b662245f6dc443a9ae",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "announcementId": "62af8aade035eb1764400d36",
                    "comment": "some comment.",
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "AnnouncementComment",
                    "__v": 0,
                    "createdAt": "2022-06-25T11:26:00.539Z",
                    "updatedAt": "2022-06-25T13:22:02.391Z",
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "schoolId": null,
                        "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2
                },
            ]
        },
        AnnouncementGetAnnouncementResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: [
                {
                    "_id": "62af8aade035eb1764400d36",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "coverImageUrl": null,
                    "title": "das",
                    "relatedSchoolIds": [
                        "string1",
                        "string2"
                    ],
                    "text": "dasdsa",
                    "isActive": true,
                    "fromDate": null,
                    "toDate": null,
                    "__t": "Announcement",
                    "createdAt": "2022-06-19T20:44:29.908Z",
                    "updatedAt": "2022-06-25T11:18:01.665Z",
                    "__v": 0,
                    "recordStatus": 1,
                    "score": 47,
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                        "schoolId": "schoolId1",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2,
                    "comments": [
                        {
                            "_id": "62b6f0b662245f6dc443a9ad",
                            "ownerId": "62ab8a204166fd1eaebbb3fa",
                            "comment": "some comment.",
                            "__t": "AnnouncementComment",
                            "owner": {
                                "_id": "62ab8a204166fd1eaebbb3fa",
                                "username": "ndodanli14",
                                "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                                "__t": "User"
                            },
                            "likeCount": 22,
                            "likeType": 1
                        },
                        {
                            "_id": "62b6f0b662245f6dc443a9ae",
                            "ownerId": "62ab8a204166fd1eaebbb3fa",
                            "comment": "some comment.",
                            "__t": "AnnouncementComment",
                            "owner": {
                                "_id": "62ab8a204166fd1eaebbb3fa",
                                "username": "ndodanli14",
                                "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                                "__t": "User"
                            },
                            "likeCount": 22,
                            "likeType": 0
                        },]
                }
            ],
        },
        AnnouncementLikeDislikeRequest: {
            $announcementId: "announcementId",
            $type: {
                type: "enum",
                values: {
                    Dislike: 0,
                    Like: 1
                }
            },
            $beforeType: {
                type: "enum",
                description: "Type of the previous like/dislike.",
                values: {
                    Dislike: 0,
                    Like: 1,
                    None: 2
                }
            }
        },
        AnnouncementCommentRequest: {
            $announcementId: "announcementId",
            $comment: "some comment."
        },
        AnnouncementCommentLikeDislikeRequest: {
            $commentId: "commentId",
            $announcementId: "announcementId",
            $type: {
                type: "enum",
                values: {
                    Dislike: 0,
                    Like: 1
                }
            },
            $beforeType: {
                type: "enum",
                description: "Type of the previous like/dislike.",
                values: {
                    Dislike: 0,
                    Like: 1,
                    None: 2
                }
            }
        },
        InterestGetAllInterestsResponse: {
            "_id": "interestId",
            "url": "url",
            "title": "interestTitle",
            "icon": "http://fakultembucket.s3.amazonaws.com/public/interest_icons/interestId/icon.png",
        },
        LoginRequest: {
            $email: "stuplus@gmail.com",
            $password: "tesTtesT@33"
        },
        LoginResponse: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmFiOGEyMDQxNjZmZDFlYWViYmIzZmEiLCJyb2xlIjowLCJpYXQiOjE2NTYwNjA0MzAsImV4cCI6MTY1ODY1MjQzMH0.ZwB2RiwHwRx_-HkU1ziIwWeXQucaPQFBDQH5QVjjvdE"
        },
        LoginGoogleRequest: {
            $AccessToken: "string",
        },
        LoginGoogleResponse: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmFiOGEyMDQxNjZmZDFlYWViYmIzZmEiLCJyb2xlIjowLCJpYXQiOjE2NTYwNjA0MzAsImV4cCI6MTY1ODY1MjQzMH0.ZwB2RiwHwRx_-HkU1ziIwWeXQucaPQFBDQH5QVjjvdE"
        },
        LoginRegisterRequest: {
            $email: "stuplus@gmail.com",
            $password: "tesTtesT@33",
            $gender: {
                type: "enum",
                values: {
                    NotSpecified: 0,
                    Male: 1,
                    Female: 2,
                    NotDefined: 3
                }
            }
        },
        LoginRegisterResponse: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmFiOGEyMDQxNjZmZDFlYWViYmIzZmEiLCJyb2xlIjowLCJpYXQiOjE2NTYwNjA0MzAsImV4cCI6MTY1ODY1MjQzMH0.ZwB2RiwHwRx_-HkU1ziIwWeXQucaPQFBDQH5QVjjvdE"
        },
        SchoolGetAllSchoolsResponse: {
            "_id": "interestId",
            "title": "interestTitle",
            "coverImageUrl": "https://fakultembucket.s3.amazonaws.com/public/school_covers/62b0c8d63721b9b60d3585db/cover.jpg",
        },
        SchoolGetFacultiesResponse: {
            "_id": "interestId",
            "title": "interestTitle",
            "schoolId": "schoolId",
        },
        SchoolGetDepartmentsResponse: {
            "_id": "interestId",
            "title": "interestTitle",
            "facultyId": "facultyId",
            "grade": 0,
        },
        AccountGetUserProfileProfileRequest: {
            $targetUserId: "targetUserId",
        },
        AccountGetUserProfileProfileResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: {
                    _id: "62ab8a204166fd1eaebbb3fa",
                    role: 0,
                    schoolId: null,
                    facultyId: null,
                    departmentId: null,
                    grade: null,
                    firstName: "string",
                    lastName: "string",
                    profilePhotoUrl: "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                    isAccEmailConfirmed: true,
                    isSchoolEmailConfirmed: false,
                    interestIds: [
                        "string"
                    ],
                    __t: "User",
                    avatarKey: "string",
                    username: "string",
                    followerCount: 232,
                    followingCount: 40,
                    about: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.",
                    followStatus: {
                        followId: "string",
                        status: {
                            type: "enum",
                            values: {
                                Pending: 2,
                                Accepted: 3,
                                None: 4
                            }
                        }
                    }
                }
            }
        },
        AccountFollowUserRequest: {
            $requestedId: "userToFollowId",
        },
        AccountFollowUserResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: {
                    followId: "string",
                }
            }
        },
        AccountFollowUserResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: {
                    followId: "string"
                }
            }
        },
        AccountChangeFollowStatusRequest: {
            $followId: "followId",
        },
        AccountGetFollowRequestsFromMeResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: [
                    {
                        "_id": "62c0788b300e9fafa0923819",
                        "requestedId": "62ad8f706cc42f3e54e3d1e8",
                        "recordStatus": 1,
                        "createdAt": "2022-07-02T16:55:39.470Z",
                        "updatedAt": "2022-07-02T16:55:39.470Z",
                        "requestedUser": {
                            "_id": "62ad8f706cc42f3e54e3d1e8",
                            "username": "deneme45",
                            "firstName": null,
                            "lastName": null,
                            "profilePhotoUrl": null,
                            "__t": "User"
                        }
                    }
                ]
            }
        },
        AccountGetFollowRequestsToMeResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: [
                    {
                        "_id": "62c0788b300e9fafa0923819",
                        "ownerId": "62ad8f706cc42f3e54e3d1e8",
                        "recordStatus": 1,
                        "createdAt": "2022-07-02T16:55:39.470Z",
                        "updatedAt": "2022-07-02T16:55:39.470Z",
                        "ownerUser": {
                            "_id": "62ad8f706cc42f3e54e3d1e8",
                            "username": "deneme45",
                            "firstName": null,
                            "lastName": null,
                            "profilePhotoUrl": null,
                            "__t": "User"
                        }
                    }
                ]
            }
        },
        AccountGetFollowersResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: [
                {
                    type: "object",
                    description: "Data returned by the operation.",
                    properties: {
                        "_id": "62c0788b300e9fafa0923819",
                        "followerId": "62ad8f706cc42f3e54e3d1e8",
                        "recordStatus": 1,
                        "createdAt": "2022-07-02T16:55:39.470Z",
                        "updatedAt": "2022-07-02T16:55:39.470Z",
                        "followerUser": {
                            "_id": "62ad8f706cc42f3e54e3d1e8",
                            "username": "deneme45",
                            "firstName": null,
                            "lastName": null,
                            "profilePhotoUrl": null,
                            "__t": "User"
                        }
                    }
                }
            ]
        },
        AccountGetFollowingResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: [
                {
                    type: "object",
                    description: "Data returned by the operation.",
                    properties: {
                        "_id": "62c0788b300e9fafa0923819",
                        "followingId": "62ad8f706cc42f3e54e3d1e8",
                        "recordStatus": 1,
                        "createdAt": "2022-07-02T16:55:39.470Z",
                        "updatedAt": "2022-07-02T16:55:39.470Z",
                        "followingUser": {
                            "_id": "62ad8f706cc42f3e54e3d1e8",
                            "username": "deneme45",
                            "firstName": null,
                            "lastName": null,
                            "profilePhotoUrl": null,
                            "__t": "User"
                        }
                    }
                }
            ]
        },
        AccountUpdateProfilePhotoResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                type: "object",
                description: "Data returned by the operation.",
                properties: {
                    url: {
                        type: "string",
                        description: "Uploaded photo's URL."
                    },
                }
            }
        },
        //#region Questions
        QuestionGetQuestionsRequest: {
            lastRecordDate: "2022-07-02T20:12:59.891Z",
            $pageSize: 20,
            schoolIds: ["schoolId1", "schoolId2"],
        },
        QuestionGetQuestionsResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: {
                "_id": "62af8aade035eb1764400d30",
                "ownerId": "62ab8a204166fd1eaebbb3fa",
                "owner": {
                    "_id": "62ab8a204166fd1eaebbb3fa",
                    "username": "ndodanli14",
                    "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                    "schoolId": "schoolId1",
                    "__t": "User"
                },
                "coverImageUrl": null,
                "title": "das",
                "relatedSchoolIds": [
                    "string1",
                    "string2"
                ],
                "text": "dasdsa",
                "isActive": true,
                "fromDate": null,
                "toDate": null,
                "__t": "Question",
                "createdAt": "2022-06-19T20:44:29.536Z",
                "updatedAt": "2022-06-19T20:44:29.536Z",
                "__v": 0,
                "recordStatus": 1,
                "likeCount": 0,
                "commentCount": 0,
                "likeType": 1
            },
        },
        QuestionGetCommentsRequest: {
            lastRecordDate: "2022-07-02T20:12:59.891Z",
            $pageSize: 20,
            $questionId: "questionId",
        },
        QuestionGetCommentsResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: [
                {
                    "_id": "62b6f0b662245f6dc443a9ad",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "questionId": "62af8aade035eb1764400d36",
                    "comment": "some comment.",
                    "score": 15,
                    "recordStatus": 1,
                    "__t": "QuestionComment",
                    "__v": 0,
                    "createdAt": "2022-06-25T11:26:00.538Z",
                    "updatedAt": "2022-06-25T13:22:02.391Z",
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "schoolId": "schoolId1",
                        "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2
                },
                {
                    "_id": "62b6f0b662245f6dc443a9ae",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "questionId": "62af8aade035eb1764400d36",
                    "comment": "some comment.",
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "QuestionComment",
                    "__v": 0,
                    "createdAt": "2022-06-25T11:26:00.539Z",
                    "updatedAt": "2022-06-25T13:22:02.391Z",
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "schoolId": null,
                        "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2
                },
            ]
        },
        QuestionGetQuestionResponse: {
            hasError: {
                type: "boolean",
                description: "Indicates whether the operation was successful or not."
            },
            validationErrors: {
                type: "array",
                description: "List of validation errors.",
            },
            message: {
                type: "string",
                description: "Message describing the error."
            },
            data: [
                {
                    "_id": "62af8aade035eb1764400d36",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "coverImageUrl": null,
                    "title": "das",
                    "relatedSchoolIds": [
                        "string1",
                        "string2"
                    ],
                    "text": "dasdsa",
                    "isActive": true,
                    "fromDate": null,
                    "toDate": null,
                    "__t": "Question",
                    "createdAt": "2022-06-19T20:44:29.908Z",
                    "updatedAt": "2022-06-25T11:18:01.665Z",
                    "__v": 0,
                    "recordStatus": 1,
                    "score": 47,
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                        "schoolId": "schoolId1",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2,
                    "comments": [
                        {
                            "_id": "62b6f0b662245f6dc443a9ad",
                            "ownerId": "62ab8a204166fd1eaebbb3fa",
                            "comment": "some comment.",
                            "__t": "QuestionComment",
                            "owner": {
                                "_id": "62ab8a204166fd1eaebbb3fa",
                                "username": "ndodanli14",
                                "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                                "__t": "User"
                            },
                            "likeCount": 22,
                            "likeType": 1
                        },
                        {
                            "_id": "62b6f0b662245f6dc443a9ae",
                            "ownerId": "62ab8a204166fd1eaebbb3fa",
                            "comment": "some comment.",
                            "__t": "QuestionComment",
                            "owner": {
                                "_id": "62ab8a204166fd1eaebbb3fa",
                                "username": "ndodanli14",
                                "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                                "__t": "User"
                            },
                            "likeCount": 22,
                            "likeType": 0
                        },]
                }
            ],
        },
        QuestionLikeDislikeRequest: {
            $questionId: "questionId",
            $type: {
                type: "enum",
                values: {
                    Dislike: 0,
                    Like: 1
                }
            },
            $beforeType: {
                type: "enum",
                description: "Type of the previous like/dislike.",
                values: {
                    Dislike: 0,
                    Like: 1,
                    None: 2
                }
            }
        },
        QuestionCommentRequest: {
            $questionId: "questionId",
            $comment: "some comment."
        },
        QuestionCommentLikeDislikeRequest: {
            $commentId: "commentId",
            $questionId: "questionId",
            $type: {
                type: "enum",
                values: {
                    Dislike: 0,
                    Like: 1
                }
            },
            $beforeType: {
                type: "enum",
                description: "Type of the previous like/dislike.",
                values: {
                    Dislike: 0,
                    Like: 1,
                    None: 2
                }
            }
        },
        //#endregion
    }
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./server.ts'];
swaggerAutogen(outputFile, endpointsFiles, doc).then(async () => {
    // await import"../api/server";
});
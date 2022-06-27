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
                    avatarKey: "string"

                }
            }
        },
        AccountUpdateProfileRequest: {
            firstName: "string",
            lastName: "string",
            phoneNumber: "string",
            avatarKey: "string",
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
        //Announcement
        AnnouncementGetAnnouncementsRequest: {
            $page: 1,
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
                    "__t": "User"
                },
                "coverImageUrl": null,
                "title": "das",
                "relatedSchoolIds": [
                    "string1",
                    "string2"
                ],
                "relatedSchools": [
                    {
                        "title": "test",
                        "schoolId": "62b0c8d63721b9b60d3585db",
                        "coverImageUrl": "https://fakultembucket.s3.amazonaws.com/public/school_covers/62b0c8d63721b9b60d3585db/cover.jpg",
                    },
                    {
                        "title": "test",
                        "schoolId": "62b0c8f91faac470de48b820",
                        "coverImageUrl": "https://fakultembucket.s3.amazonaws.com/public/school_covers/62b0c8d63721b9b60d3585db/cover.jpg",
                    }
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
            $page: 1,
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
                        "schoolId": null,
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
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "relatedSchools": [
                        {
                            "title": "test",
                            "schoolId": "62b0c8d63721b9b60d3585db",
                            "coverImageUrl": "https://fakultembucket.s3.amazonaws.com/public/school_covers/62b0c8d63721b9b60d3585db/cover.jpg",
                        },
                        {
                            "title": "test",
                            "schoolId": "62b0c8f91faac470de48b820",
                            "coverImageUrl": "https://fakultembucket.s3.amazonaws.com/public/school_covers/62b0c8d63721b9b60d3585db/cover.jpg",
                        }
                    ],
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
    }
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./server.ts'];
swaggerAutogen(outputFile, endpointsFiles, doc).then(async () => {
    // await import"../api/server";
});
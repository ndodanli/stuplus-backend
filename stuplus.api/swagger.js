const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
    info: {
        version: "1.0.0",
        title: "Stuplus API",
        description: "Stuplus API Documentation."
    },
    servers: [{ url: "http://212.98.224.208:25010/", description: "Canli API" }, { url: "http://127.0.0.1:25010/", description: "Local API" },],
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
        //#region Search
        SearchAnnouncementRequest: {
            $searchTerm: "test",
            $page: 1,
            $pageSize: 20,
        },
        SearchAnnouncementResponse: {
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
                    "_id": "62cf05da39b1a28284adf3ae",
                    "ownerId": "628a9e39b483f428a74e75c1",
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/announcement/cover_images/1657734350307-9055-duyuru.PNG",
                    "title": "SEYEHATSEVER UYGULAMASI İLE KYK YURTLARI TÜM YAZ BOYU ÜCRETSİZ!",
                    "relatedSchoolIds": [
                        "62cc9c8f5c9816cc1e36858d"
                    ],
                    "text": "<p>Yaz Tatili için seyahat edecek gençler Erzurum için Erkek yurdu olarak Ömer Nasuhi Bilmen yurdunda; Kız yurdu ise Yakutiye Öğrenci Yurdunda kalabileceklerdir. Hangi şehirde hangi yurdun aktif olduğunu ve yurtların iletişim bilgilerini öğrenmek isteyen öğrenciler \"https://seyahatsever.gsb.gov.tr/\" adresinden belirtilen bilgilere erişim sağlayabileceklerdir.</p>",
                    "isActive": true,
                    "fromDate": "2022-07-14T21:00:00.000Z",
                    "toDate": "2022-08-31T21:00:00.000Z",
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "Announcement",
                    "createdAt": "2022-07-13T17:50:18.488Z",
                    "updatedAt": "2022-07-16T21:40:50.861Z",
                    "__v": 1,
                    "hashTags": [],
                    "titlesch": "seyehatsever uygulamasi ile kyk yurtlari"
                }
            ],
        },
        SearchQuestionRequest: {
            $searchTerm: "test",
            $page: 1,
            $pageSize: 20,
        },
        SearchQuestionResponse: {
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
                    "_id": "62c09acb63c9dc82f6bcf9b9",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "coverImageUrl": null,
                    "title": "TEST NO SCHOOL",
                    "relatedSchoolIds": [],
                    "text": "<br> dasfksdfdsfd",
                    "isActive": true,
                    "fromDate": null,
                    "toDate": null,
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "Question",
                    "createdAt": "2022-07-02T19:21:47.409Z",
                    "updatedAt": "2022-07-03T15:47:20.351Z",
                    "__v": 0
                },
                {
                    "_id": "62c09ab763c9dc82f6bcf956",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "coverImageUrl": null,
                    "title": "test q",
                    "relatedSchoolIds": [],
                    "text": "<br> dasfksdfdsfd",
                    "isActive": true,
                    "fromDate": null,
                    "toDate": null,
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "Question",
                    "createdAt": "2022-07-02T19:21:27.109Z",
                    "updatedAt": "2022-07-02T19:21:27.109Z",
                    "__v": 0
                },
                {
                    "_id": "62c09a23120eabd0fa61b145",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/question/cover_images/1656965469743-1656856337742-1MFqZJCvcok.jpg",
                    "title": "test q",
                    "relatedSchoolIds": [
                        "62b0c8d63721b9b60d3585db"
                    ],
                    "text": "<p><br>dasfksdfdsfd</p>",
                    "isActive": true,
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "Question",
                    "createdAt": "2022-07-02T19:18:59.894Z",
                    "updatedAt": "2022-07-04T20:11:13.713Z",
                    "__v": 0
                },
                {
                    "_id": "62c092f0e6a6394e2a0c1fe9",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/question/cover_images/1656965479314-xf3o1tBz13o.jpg",
                    "title": "test q",
                    "relatedSchoolIds": [
                        "62b0c8d63721b9b60d3585db"
                    ],
                    "text": "<p><br>dasfksdfdsfd</p>",
                    "isActive": true,
                    "score": 0,
                    "recordStatus": 1,
                    "__t": "Question",
                    "createdAt": "2022-07-02T18:48:16.030Z",
                    "updatedAt": "2022-07-04T20:11:21.961Z",
                    "__v": 0
                },
            ]
        },
        SearchHashtagRequest: {
            $searchTerm: "test",
            $page: 1,
            $pageSize: 20,
        },
        SearchHashtagResponse: {
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
                    "_id": "62d07d5eea5d4faa14396e6f",
                    "__t": "Hashtag",
                    "recordStatus": 1,
                    "tag": "sinif",
                    "__v": 0,
                    "announcementPopularity": 0,
                    "createdAt": "2022-07-14T20:32:30.156Z",
                    "groupPopularity": 1912,
                    "overallPopularity": 1914,
                    "questionPopularity": 0,
                    "updatedAt": "2022-07-14T20:36:00.279Z"
                },
                {
                    "_id": "62d07d5eea5d4faa14396b91",
                    "__t": "Hashtag",
                    "recordStatus": 1,
                    "tag": "cocukgelisimi1sinif",
                    "__v": 0,
                    "announcementPopularity": 0,
                    "createdAt": "2022-07-14T20:32:30.123Z",
                    "groupPopularity": 9,
                    "overallPopularity": 9,
                    "questionPopularity": 0,
                    "updatedAt": "2022-07-14T20:42:30.915Z"
                },
                {
                    "_id": "62d07d6eea5d4faa1439b028",
                    "__t": "Hashtag",
                    "recordStatus": 1,
                    "tag": "bankacilikvesigortacilik2sinif",
                    "__v": 0,
                    "announcementPopularity": 0,
                    "createdAt": "2022-07-14T20:32:45.238Z",
                    "groupPopularity": 7,
                    "overallPopularity": 7,
                    "questionPopularity": 0,
                    "updatedAt": "2022-07-14T20:36:00.267Z"
                },
                {
                    "_id": "62d07d6fea5d4faa1439b53b",
                    "__t": "Hashtag",
                    "recordStatus": 1,
                    "tag": "bankacilikvesigortacilik1sinif",
                    "__v": 0,
                    "announcementPopularity": 0,
                    "createdAt": "2022-07-14T20:32:45.285Z",
                    "groupPopularity": 7,
                    "overallPopularity": 7,
                    "questionPopularity": 0,
                    "updatedAt": "2022-07-14T20:36:00.287Z"
                },
            ],
        },
        SearchPeopleRequest: {
            $searchTerm: "test",
            $page: 1,
            $pageSize: 20,
        },
        SearchPeopleResponse: {
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
                    "_id": "62ad8e696cc42f3e54e3d1cd",
                    "username": "test1021",
                    "firstName": "test1021",
                    "lastName": "test1021",
                    "profilePhotoUrl": null,
                    "__t": "User",
                    "confidenceScore": 42.900000000000006
                },
                {
                    "_id": "62ad91716cc42f3e54e3d1fb",
                    "username": "test1025",
                    "firstName": "test1025",
                    "lastName": "test1025",
                    "profilePhotoUrl": null,
                    "__t": "User",
                    "confidenceScore": 42.900000000000006
                },
                {
                    "_id": "62ab41a460884a883ed78080",
                    "username": "test1013",
                    "firstName": "test1013",
                    "lastName": "test1013",
                    "profilePhotoUrl": null,
                    "__t": "User",
                    "confidenceScore": 42.900000000000006
                },
            ],
        },
        SearchGroupChatsRequest: {
            $searchTerm: "uni",
            $page: 1,
            $pageSize: 20,
        },
        SearchGroupChatsResponse: {
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
                    "_id": "62cc9c905c9816cc1e368592",
                    "title": "Atatürk Üniversitesi ",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657569337023-6615-a%C3%83%C2%A7%C3%84%C2%B1k%C3%83%C2%B6%C3%84%C2%9Fretim%20fak%C3%83%C2%BCltesi.png",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": null,
                    "grade": null,
                    "__t": "GroupChat",
                    "confidenceScore": 4.4,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    }
                },
                {
                    "_id": "62cc9ca55c9816cc1e36889b",
                    "title": "Sivil Hava Ulaştırma İşletmeciliği 2. Sınıf",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657575612135-7343-u%C3%83%C2%A7ak.jpg",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "sivilhavaulastirmaisletmeciligi2sin",
                        "Sivil",
                        "Hava",
                        "Ulaştırma",
                        "İşletmeciliği",
                        "2.",
                        "Sınıf",
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": "62cc9ca45c9816cc1e368887",
                    "grade": 2,
                    "__t": "GroupChat",
                    "confidenceScore": 3.3000000000000003,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    },
                    "department": {
                        "_id": "62cc9ca45c9816cc1e368887",
                        "facultyId": null,
                        "schoolId": "62cc9c8f5c9816cc1e36858d",
                        "grade": 2,
                        "title": "Sivil Hava Ulaştırma İşletmeciliği",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657575612135-7343-u%C3%83%C2%A7ak.jpg",
                        "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                        "avatarKey": null,
                        "recordStatus": 1,
                        "__t": "Department",
                        "createdAt": "2022-07-11T21:56:52.809Z",
                        "updatedAt": "2022-07-11T21:56:52.809Z"
                    }
                },
                {
                    "_id": "62cc9c9e5c9816cc1e368738",
                    "title": "Emlak Yönetimi 1. Sınıf",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657573549165-2171-emlak.jpg",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "emlakyonetimi1sinif",
                        "Emlak",
                        "Yönetimi",
                        "1.",
                        "Sınıf",
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": "62cc9c9e5c9816cc1e368732",
                    "grade": 1,
                    "__t": "GroupChat",
                    "confidenceScore": 3.3000000000000003,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    },
                    "department": {
                        "_id": "62cc9c9e5c9816cc1e368732",
                        "facultyId": null,
                        "schoolId": "62cc9c8f5c9816cc1e36858d",
                        "grade": 2,
                        "title": "Emlak Yönetimi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657573549165-2171-emlak.jpg",
                        "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                        "avatarKey": null,
                        "recordStatus": 1,
                        "__t": "Department",
                        "createdAt": "2022-07-11T21:56:46.547Z",
                        "updatedAt": "2022-07-11T21:56:46.547Z"
                    }
                },
                {
                    "_id": "62cc9ca25c9816cc1e36880d",
                    "title": "Muhasebe ve Vergi Uygulamaları 2. Sınıf",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657574858083-4379-muhabasebe.jpg",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "muhasebevevergiuygulamalari2sinif",
                        "Muhasebe",
                        "ve",
                        "Vergi",
                        "Uygulamaları",
                        "2.",
                        "Sınıf",
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": "62cc9ca25c9816cc1e3687f9",
                    "grade": 2,
                    "__t": "GroupChat",
                    "confidenceScore": 3.3000000000000003,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    },
                    "department": {
                        "_id": "62cc9ca25c9816cc1e3687f9",
                        "facultyId": null,
                        "schoolId": "62cc9c8f5c9816cc1e36858d",
                        "grade": 2,
                        "title": "Muhasebe ve Vergi Uygulamaları",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657574858083-4379-muhabasebe.jpg",
                        "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                        "avatarKey": null,
                        "recordStatus": 1,
                        "__t": "Department",
                        "createdAt": "2022-07-11T21:56:50.330Z",
                        "updatedAt": "2022-07-11T21:56:50.330Z"
                    }
                },
            ],
        },
        SearchPeopleAndGroupChatsRequest: {
            $searchTerm: "tes",
            $page: 1,
            $pageSize: 20,
        },
        SearchPeopleAndGroupChatsResponse: {
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
                    "_id": "62ad8f096cc42f3e54e3d1dd",
                    "username": "test1023",
                    "firstName": "test1023",
                    "lastName": "test1023",
                    "profilePhotoUrl": null,
                    "__t": "User",
                    "confidenceScore": 14.3
                },
                {
                    "_id": "62ad91716cc42f3e54e3d1fb",
                    "username": "test1025",
                    "firstName": "test1025",
                    "lastName": "test1025",
                    "profilePhotoUrl": null,
                    "__t": "User",
                    "confidenceScore": 14.3
                },
                {
                    "_id": "62ad8e696cc42f3e54e3d1cd",
                    "username": "test1021",
                    "firstName": "test1021",
                    "lastName": "test1021",
                    "profilePhotoUrl": null,
                    "__t": "User",
                    "confidenceScore": 14.3
                },
                {
                    "_id": "62cc9c905c9816cc1e368592",
                    "title": "Atatürk Üniversitesi ",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657569337023-6615-a%C3%83%C2%A7%C3%84%C2%B1k%C3%83%C2%B6%C3%84%C2%9Fretim%20fak%C3%83%C2%BCltesi.png",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": null,
                    "grade": null,
                    "__t": "GroupChat",
                    "confidenceScore": 4.4,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    }
                },
                {
                    "_id": "62cc9c975c9816cc1e368674",
                    "title": "Sosyoloji",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657571350220-5996-sosyoloji.jpg",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "sosyoloji",
                        "Sosyoloji",
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": "62cc9c975c9816cc1e368672",
                    "grade": null,
                    "__t": "GroupChat",
                    "confidenceScore": 3.3000000000000003,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    },
                    "department": {
                        "_id": "62cc9c975c9816cc1e368672",
                        "facultyId": null,
                        "schoolId": "62cc9c8f5c9816cc1e36858d",
                        "grade": 4,
                        "title": "Sosyoloji",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657571350220-5996-sosyoloji.jpg",
                        "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                        "avatarKey": null,
                        "recordStatus": 1,
                        "__t": "Department",
                        "createdAt": "2022-07-11T21:56:39.930Z",
                        "updatedAt": "2022-07-11T21:56:39.930Z"
                    }
                },
                {
                    "_id": "62cc9c945c9816cc1e36860e",
                    "title": "Kamu Yönetimi 2. Sınıf",
                    "type": 0,
                    "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657570576441-4039-kamu%20y%C3%83%C2%B6netimi.jpg",
                    "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                    "hashTags": [
                        "kamuyonetimi2sinif",
                        "Kamu",
                        "Yönetimi",
                        "2.",
                        "Sınıf",
                        "ataturkuniversitesi",
                        "Atatürk",
                        "Üniversitesi",
                        ""
                    ],
                    "schoolId": "62cc9c8f5c9816cc1e36858d",
                    "departmentId": "62cc9c945c9816cc1e368604",
                    "grade": 2,
                    "__t": "GroupChat",
                    "confidenceScore": 3.3000000000000003,
                    "school": {
                        "_id": "62cc9c8f5c9816cc1e36858d",
                        "emailFormat": "atauni.edu.tr",
                        "title": "Atatürk Üniversitesi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/school_images/1657578697785-2773-ataturk_uni.png",
                        "type": 0,
                        "recordStatus": 1,
                        "__t": "School",
                        "createdAt": "2022-07-11T22:35:13.961Z",
                        "updatedAt": "2022-07-11T22:35:13.961Z"
                    },
                    "department": {
                        "_id": "62cc9c945c9816cc1e368604",
                        "facultyId": null,
                        "schoolId": "62cc9c8f5c9816cc1e36858d",
                        "grade": 4,
                        "title": "Kamu Yönetimi",
                        "coverImageUrl": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/department_images/1657570576441-4039-kamu%20y%C3%83%C2%B6netimi.jpg",
                        "about": "Bu grubu sizin için biz(stuplus) oluşturduk. Tepe tepe kullanıp hayrını görün.",
                        "avatarKey": null,
                        "recordStatus": 1,
                        "__t": "Department",
                        "createdAt": "2022-07-11T21:56:36.162Z",
                        "updatedAt": "2022-07-11T21:56:36.162Z"
                    }
                }
            ],
        },
        //#endregion

        //#region Account
        AccountReportRequest: {
            $reportType: {
                type: "enum",
                values: {
                    JustDontLike: 0,
                    BullyingOrHarassment: 1,
                    FalseInformation: 2,
                    Spam: 3,
                    NudityOrSexualActivity: 4,
                    HateSpeechOrSymbols: 5,
                    ViolanceOrDangerousOrganizations: 6,
                    ScamOrFraud: 7,
                    IntellectualPropertyViolation: 8,
                    SaleOfIllegalOrRegulatedGoods: 9,
                    SuicideOrSelfInjury: 10,
                    EatingDisorders: 11,
                    Other: 12
                }
            },
            details: "xxx",
            userId: "62ab8a204166fd1eaebbb3fa",
            messageId: "62ab8a204166fd1eaebbb3fa",
            messageText: "xxx",
            commentId: "62ab8a204166fd1eaebbb3fa",
            commentText: "xxx",
            announcementId: "62ab8a204166fd1eaebbb3fa",
            announcementText: "xxx",
            questionId: "62ab8a204166fd1eaebbb3fa",
            questionText: "xxx"
        },
        GetNotificationHistoryResponse: {
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
            notes: {
                NotificationType: {
                    type: "enum",
                    values: {
                        StartedFollowingYou: 0,
                        FollowRequestAccepted: 1,
                        AddedYouToGroupChat: 2,
                    }
                }
            },
            data: [
                {
                    "_id": "62cdf2b616b915025c0627d1",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "relatedUserId": "62ab3f45527e4cb74d06e967",
                    "groupChatId": "62cc9c925c9816cc1e3685de",
                    "readed": false,
                    "type": 2,
                    "recordStatus": 1,
                    "__t": "Notification",
                    "createdAt": "2022-07-12T22:16:22.813Z",
                    "updatedAt": "2022-07-12T22:16:22.813Z",
                    "relatedUser": {
                        "_id": "62ab3f45527e4cb74d06e967",
                        "username": "test1008",
                        "firstName": "test1008",
                        "lastName": "test1008",
                        "profilePhotoUrl": null,
                        "__t": "User"
                    }
                },
                {
                    "_id": "62cdf2b616b915025c0627cf",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "relatedUserId": "62ab3f45527e4cb74d06e967",
                    "groupChatId": null,
                    "readed": false,
                    "type": 1,
                    "recordStatus": 1,
                    "__t": "Notification",
                    "createdAt": "2022-07-12T22:16:22.738Z",
                    "updatedAt": "2022-07-12T22:16:22.738Z",
                    "relatedUser": {
                        "_id": "62ab3f45527e4cb74d06e967",
                        "username": "test1008",
                        "firstName": "test1008",
                        "lastName": "test1008",
                        "profilePhotoUrl": null,
                        "__t": "User"
                    }
                }
            ],
        },
        AccountNotifyReadNotificationsRequest: {
            notificationIds: ["62cdf2b616b915025c0627d1", "62cdf2b616b915025c0627cf"]
        },
        //#endregion
        ChatGetNewChatUsersResponse: {
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
                    "_id": "62dc3c62a72364961b13cfb2",
                    "username": "testNew",
                    "firstName": "John",
                    "lastName": "Jones",
                    "profilePhotoUrl": null,
                    "avatarKey": "testNew",
                    "__t": "User"
                }
            ],
        },
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
        AnnouncementAddRequest: {
            images: [
                {
                    "url": "https://stuplus-bucket.s3.amazonaws.com/public/sdasds/1658614127031-1657324327987-S3eDQ3yqXMw.jpg",
                    "mimeType": "image/jpeg",
                    "size": 2250194,
                    "isCompressed": true
                },
            ],
            $relatedSchoolIds: ["62ab8a204166fd1eaebbb3fa", "62ab8a204166fd1eaebbb3fa"],
            $title: "string",
            $text: "string",
            $ownerSchoolId: {
                type: "string",
                description: "Duyurunun sahibinin school idsi."
            },
            hashTags: ["string"],
        },
        QuestionAddRequest: {
            images: [
                {
                    "url": "https://stuplus-bucket.s3.amazonaws.com/public/sdasds/1658614127031-1657324327987-S3eDQ3yqXMw.jpg",
                    "mimeType": "image/jpeg",
                    "size": 2250194,
                    "isCompressed": true
                },
            ],
            $title: "string",
            $text: "string",
            $ownerSchoolId: {
                type: "string",
                description: "Sorunun sahibinin school idsi."
            },
            hashTags: ["string"],
        },
        BasePaginationRequest: {
            lastRecordId: "62ee7233490026ff5d31726b",
            $pageSize: 20,
        },
        BasePaginationSearchTermRequest: {
            lastRecordId: "62ee7233490026ff5d31726b",
            $pageSize: 20,
            searchTerm: "xxx"
        },
        GeneralUploadImagesResponse: {
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
                    "url": "https://stuplus-bucket.s3.amazonaws.com/public/sdasds/1658614127031-1657324327987-S3eDQ3yqXMw.jpg",
                    "mimeType": "image/jpeg",
                    "size": 2250194,
                    "isCompressed": true
                },
                {
                    "url": "https://stuplus-bucket.s3.amazonaws.com/public/sdasds/1658614127046-1657706021214-5562-Atat%C3%83%C2%83%C3%82%C2%BCrk%20",
                    "mimeType": "image/jpeg",
                    "size": 140897,
                    "isCompressed": true
                }
            ],
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
                    profilePhotoUrl: "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
            $username: "string",
            $firstName: "string",
            $lastName: "string",
            $avatarKey: "string",
            $about: "string"
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
        AccountUpdatePrivacySettingsRequest: {
            followLimitation: {
                type: "enum",
                values: {
                    None: 0,
                    ByRequest: 1
                }
            },
            messageLimitation: {
                type: "enum",
                values: {
                    None: 0,
                    OnlyWhoUserFollows: 1
                }
            },
            profileStatus: {
                type: "enum",
                values: {
                    Public: 0,
                    Private: 1
                }
            },
        },
        AccountUpdatePrivacySettingsResponse: {
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
            lastRecordId: "62ee7233490026ff5d31726b",
            $schoolSearch: {
                type: "boolean",
                description: "Eğer gönderilen son kaydın(lastRecordId'nin alındığı kayıt) " +
                    "okul idsi sorguyu yapan kullanıcının okul idsine eşit ise true, değilse false gönderilecek."
            },
            $ownerSchoolId: {
                type: "string",
                description: "Sorguyu yapan kullanıcının okul idsi."
            },
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
            data: [
                {
                    "_id": "62af8aade035eb1764400d30",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "owner": {
                        "_id": "62ab8a204166fd1eaebbb3fa",
                        "username": "ndodanli14",
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
                }
            ],
        },
        AnnouncementGetCommentsRequest: {
            lastRecordId: "62ee7233490026ff5d31726b",
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
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
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
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
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
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
                                "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
                                "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
        AnnouncementSubCommentRequest: {
            $announcementId: "announcementId",
            $commentId: "commentId.",
            $comment: "some comment.",
            replyToId: "replyToId"
        },
        AnnouncementGetSubCommentsRequest: {
            lastRecordId: "62ee7233490026ff5d31726b",
            $pageSize: 20,
            $commentId: "commentId",
        },
        AnnouncementSubCommentLikeDislikeRequest: {
            $subCommentId: "subCommentId",
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
            "icon": "http://stuplus-bucket.s3.amazonaws.com/public/interest_icons/interestId/icon.png",
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
            "coverImageUrl": "https://stuplus-bucket.s3.amazonaws.com/public/school_covers/62b0c8d63721b9b60d3585db/cover.jpg",
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
        AccountUpdateSchoolRequest: {
            $schoolId: "schoolId",
            $departmentId: "departmentId",
            $grade: 0,
            $secondaryEducation: false
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
                "user": {
                    "_id": "62b444af42c36c87dff387d7",
                    "username": "test1030",
                    "role": 1,
                    "facultyId": null,
                    "grade": 3,
                    "firstName": "test1030",
                    "lastName": "test1030",
                    "isAccEmailConfirmed": true,
                    "isSchoolEmailConfirmed": true,
                    "privacySettings": {
                        "followLimitation": 0
                    },
                    "avatarKey": "dsads",
                    "schoolId": null,
                    "profilePhotoUrl": "https://fakultembucket.s3.amazonaws.com/public/profile_images/1656883392736-1656856337742-1MFqZJCvcok.jpg",
                    "interestIds": [],
                    "blockedUserIds": [],
                    "followerCount": 0,
                    "followingCount": 0
                },
                "followStatus": {
                    "followId": null,
                    "status": 4
                }
            },
        },
        AccountGetAccountSuggestionsResponse: {
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
                    "_id": "62d59d53f6f9c3b703544540",
                    "username": "cihat",
                    "firstName": "Mary",
                    "lastName": "Jackson",
                    "profilePhotoUrl": null,
                    "avatarKey": "*TSc-hCJRyl=",
                    "__t": "User",
                    "createdAt": "2022-07-18T17:50:11.113Z"
                },
                {
                    "_id": "62d8eeafa72364961b06fd06",
                    "username": "jdjrj",
                    "firstName": "John",
                    "lastName": "Jones",
                    "profilePhotoUrl": null,
                    "avatarKey": "jdjrj",
                    "__t": "User",
                    "createdAt": "2022-07-21T06:14:07.071Z"
                }
            ],
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
            lastRecordId: "62ee7233490026ff5d31726b",
            $schoolSearch: {
                type: "boolean", description: "Eğer gönderilen son kaydın(lastRecordId'nin alındığı kayıt) "
                    + "okul idsi sorguyu yapan kullanıcının okul idsine eşit ise true, değilse false gönderilecek."
            },
            $ownerSchoolId: { type: "string", description: "Sorguyu yapan kullanıcının okul idsi." },
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
                    "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
            lastRecordId: "62ee7233490026ff5d31726b",
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
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2,
                    "subCommentCount": 42
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
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
                        "__t": "User"
                    },
                    "likeCount": 22,
                    "likeType": 2,
                    "subCommentCount": 12
                },
            ]
        },
        QuestionGetSubCommentsRequest: {
            lastRecordId: "62ee7233490026ff5d31726b",
            $pageSize: 20,
            $commentId: "commentId",
        },
        // QuestionGetSubCommentsResponse: {
        //     hasError: {
        //         type: "boolean",
        //         description: "Indicates whether the operation was successful or not."
        //     },
        //     validationErrors: {
        //         type: "array",
        //         description: "List of validation errors.",
        //     },
        //     message: {
        //         type: "string",
        //         description: "Message describing the error."
        //     },
        //     data: [
        //         {
        //             "_id": "62b6f0b662245f6dc443a9ad",
        //             "ownerId": "62ab8a204166fd1eaebbb3fa",
        //             "questionId": "62af8aade035eb1764400d36",
        //             "comment": "some comment.",
        //             "score": 15,
        //             "recordStatus": 1,
        //             "__t": "QuestionComment",
        //             "__v": 0,
        //             "createdAt": "2022-06-25T11:26:00.538Z",
        //             "updatedAt": "2022-06-25T13:22:02.391Z",
        //             "owner": {
        //                 "_id": "62ab8a204166fd1eaebbb3fa",
        //                 "username": "ndodanli14",
        //                 "schoolId": "schoolId1",
        //                 "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
        //                 "__t": "User"
        //             },
        //             "likeCount": 22,
        //             "likeType": 2
        //         },
        //         {
        //             "_id": "62b6f0b662245f6dc443a9ae",
        //             "ownerId": "62ab8a204166fd1eaebbb3fa",
        //             "questionId": "62af8aade035eb1764400d36",
        //             "comment": "some comment.",
        //             "score": 0,
        //             "recordStatus": 1,
        //             "__t": "QuestionComment",
        //             "__v": 0,
        //             "createdAt": "2022-06-25T11:26:00.539Z",
        //             "updatedAt": "2022-06-25T13:22:02.391Z",
        //             "owner": {
        //                 "_id": "62ab8a204166fd1eaebbb3fa",
        //                 "username": "ndodanli14",
        //                 "schoolId": null,
        //                 "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_images/1656159197445-1MFqZJCvcok.jpg",
        //                 "__t": "User"
        //             },
        //             "likeCount": 22,
        //             "likeType": 2
        //         },
        //     ]
        // },
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
                        "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
                                "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
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
                                "profilePhotoUrl": "https://stuplus-bucket.s3.amazonaws.com/public/profile_photos/1656012020219-1MFqZJCvcok.jpg",
                                "__t": "User"
                            },
                            "likeCount": 22,
                            "likeType": 0
                        },],
                    "commentCount": 66
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
        QuestionSubCommentRequest: {
            $questionId: "questionId",
            $commentId: "commentId.",
            $comment: "some comment.",
            replyToId: "replyToId"
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
        QuestionSubCommentLikeDislikeRequest: {
            $subCommentId: "subCommentId",
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
        //#region Chat
        ChatGetGroupMessagesRequest: {
            $groupChatId: "groupChatId",
            lastRecordId: "62ee7233490026ff5d31726b",
            $pageSize: 20,
        },
        ChatGetGroupMessagesResponse: {
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
                "messages": [
                    {
                        "_id": "62dd547f638e8ddf4e7f5712",
                        "ownerId": "62ab8a204166fd1eaebbb3fa",
                        "text": null,
                        "forwarded": false,
                        "readed": false,
                        "files": [
                            {
                                "url": "https://stuplus-bucket.s3.amazonaws.com/public/chat/group_message_files/1658672252496-8238-1657569337023-6615-a%C3%83%C2%83%C3%82%C2%A7%C3%83%C2%84%C3%82%C2%B1k%C3%83",
                                "mimeType": "image/png",
                                "size": 1501486,
                                "_id": "62dd5489638e8ddf4e7f5714"
                            },
                            {
                                "url": "https://stuplus-bucket.s3.amazonaws.com/public/chat/message_files/1658674373794-9335-1657324327987-S3eDQ3yqXMw.jpg",
                                "mimeType": "image/jpeg",
                                "size": 2250194,
                                "_id": "62dd5cc94ee5eb9cf53c7bcd"
                            },
                            {
                                "url": "https://stuplus-bucket.s3.amazonaws.com/public/chat/message_files/1658674540766-5060-1657324327987-S3eDQ3yqXMw.jpg",
                                "mimeType": "image/jpeg",
                                "size": 2250194,
                                "_id": "62dd5d70ec5e34ad4b75012c"
                            }
                        ],
                        "replyToId": "62aa35971c1df0aaea949dfe",
                        "deletedForUserIds": [],
                        "deletedForUserDate": null,
                        "groupChatId": "62cc37746d89dc2f329e0beb",
                        "recordStatus": 1,
                        "updatedAt": "2022-07-24T14:55:44.876Z",
                        "createdAt": "2022-07-24T14:17:35.525Z",
                        "__t": "GroupMessage",
                        "__v": 2
                    },
                    {
                        "_id": "62dd5322b8f26724a0a6cae5",
                        "ownerId": "62ab8a204166fd1eaebbb3fa",
                        "text": null,
                        "forwarded": false,
                        "readed": false,
                        "files": [
                            {
                                "url": "https://stuplus-bucket.s3.amazonaws.com/public/chat/group_message_files/1658671900289-2703-1657569337023-6615-a%C3%83%C2%83%C3%82%C2%A7%C3%83%C2%84%C3%82%C2%B1k%C3%83",
                                "mimeType": "image/png",
                                "size": 1501486,
                                "_id": "62dd5330b8f26724a0a6cae7"
                            }
                        ],
                        "replyToId": null,
                        "deletedForUserIds": [],
                        "deletedForUserDate": null,
                        "groupChatId": "62cc37746d89dc2f329e0beb",
                        "recordStatus": 1,
                        "updatedAt": "2022-07-24T14:11:45.369Z",
                        "createdAt": "2022-07-24T14:11:45.369Z",
                        "__t": "GroupMessage",
                        "__v": 0
                    }
                ],
                "groupChat": {
                    "memberCount": 1
                }
            },
        },
        ChatGetPrivateMessagesRequest: {
            $chatId: "chatId",
            lastRecordId: "62ee7233490026ff5d31726b",
            $pageSize: 20,
        },
        ChatGetPrivateMessagesResponse: {
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
                    "_id": "62dd4c23eec956be9f969c5d",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "text": null,
                    "forwarded": false,
                    "forwardedAt": null,
                    "readed": false,
                    "readedAt": null,
                    "chatId": "62dd4a15bc72d4ea5a381173",
                    "files": [
                        {
                            "url": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/chat/message_files/1658670111604-7091-1658614127031-1657324327987-S3",
                            "mimeType": "image/jpeg",
                            "size": 2250194,
                            "_id": "62dd4c28eec956be9f969c5f"
                        },
                        {
                            "url": "https://stuplus-bucket.s3.eu-central-1.amazonaws.com/public/chat/message_files/1658673750835-5674-ataturk_uni.png",
                            "mimeType": "image/png",
                            "size": 1501486,
                            "_id": "62dd5a63f3f7b4b5542c3a7e"
                        }
                    ],
                    "replyToId": null,
                    "deletedForUserIds": [],
                    "deletedForUserDate": null,
                    "recordStatus": 1,
                    "updatedAt": "2022-07-24T14:42:45.118Z",
                    "createdAt": "2022-07-24T13:41:55.351Z",
                    "__t": "Message",
                    "__v": 1
                },
                {
                    "_id": "62dd4bd1e0a8ae0a67a3000b",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "text": null,
                    "forwarded": false,
                    "forwardedAt": null,
                    "readed": false,
                    "readedAt": null,
                    "chatId": "62dd4a15bc72d4ea5a381173",
                    "files": [
                        {
                            "url": "https://stuplus-bucket.s3.amazonaws.com/public/chat/message_files/1658670025994-3641-1658614127031-1657324327987-S3",
                            "mimeType": "image/jpeg",
                            "size": 2250194,
                            "_id": "62dd4bdde0a8ae0a67a3000d"
                        }
                    ],
                    "replyToId": null,
                    "deletedForUserIds": [],
                    "deletedForUserDate": null,
                    "recordStatus": 1,
                    "updatedAt": "2022-07-24T13:40:33.593Z",
                    "createdAt": "2022-07-24T13:40:33.593Z",
                    "__t": "Message",
                    "__v": 0
                },
                {
                    "_id": "62dd4b6aaa364d55018527d7",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "text": null,
                    "forwarded": false,
                    "forwardedAt": null,
                    "readed": false,
                    "readedAt": null,
                    "chatId": "62dd4a15bc72d4ea5a381173",
                    "files": [
                        {
                            "url": "https://stuplus-bucket.s3.amazonaws.com/public/chat/message_files/1658669919894-5464-1658614127031-1657324327987-S3",
                            "mimeType": "image/jpeg",
                            "size": 2250194,
                            "_id": "62dd4bb0e0a8ae0a67a30008"
                        }
                    ],
                    "replyToId": null,
                    "deletedForUserIds": [],
                    "deletedForUserDate": null,
                    "recordStatus": 1,
                    "updatedAt": "2022-07-24T13:38:50.314Z",
                    "createdAt": "2022-07-24T13:38:50.314Z",
                    "__t": "Message",
                    "__v": 0
                },
                {
                    "_id": "62dd4b2df0b3194fb940e642",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "text": null,
                    "forwarded": false,
                    "forwardedAt": null,
                    "readed": false,
                    "readedAt": null,
                    "chatId": "62dd4a15bc72d4ea5a381173",
                    "replyToId": null,
                    "deletedForUserIds": [],
                    "deletedForUserDate": null,
                    "recordStatus": 1,
                    "updatedAt": "2022-07-24T13:37:49.001Z",
                    "createdAt": "2022-07-24T13:37:49.001Z",
                    "__t": "Message",
                    "files": [],
                    "__v": 0
                },
                {
                    "_id": "62dd4a85869aa18a7cd9ddfb",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "text": null,
                    "forwarded": false,
                    "forwardedAt": null,
                    "readed": false,
                    "readedAt": null,
                    "chatId": "62dd4a15bc72d4ea5a381173",
                    "replyToId": null,
                    "deletedForUserIds": [],
                    "deletedForUserDate": null,
                    "recordStatus": 1,
                    "updatedAt": "2022-07-24T13:35:01.373Z",
                    "createdAt": "2022-07-24T13:35:01.373Z",
                    "__t": "Message",
                    "files": [],
                    "__v": 0
                },
                {
                    "_id": "62dd4a20423dfa3a80bc849d",
                    "ownerId": "62ab8a204166fd1eaebbb3fa",
                    "text": null,
                    "forwarded": false,
                    "forwardedAt": null,
                    "readed": false,
                    "readedAt": null,
                    "chatId": "62dd4a15bc72d4ea5a381173",
                    "replyToId": null,
                    "deletedForUserIds": [],
                    "deletedForUserDate": null,
                    "recordStatus": 1,
                    "updatedAt": "2022-07-24T13:33:20.627Z",
                    "createdAt": "2022-07-24T13:33:20.627Z",
                    "__t": "Message",
                    "files": [],
                    "__v": 0
                }
            ],
        },
        ChatUpdatePMFileResponse: {
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
                "ci": "62dd4a15bc72d4ea5a381173",
                "mi": "62dd4c23eec956be9f969c5d"
            },
        },
        ChatUpdateGMFileResponse: {
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
            "data": {
                "gCi": "62cc37746d89dc2f329e0beb",
                "mi": "62dd547f638e8ddf4e7f5712"
            },
        },
        ChatDeleteSingleGMRequest: {
            $chatId: "chatId",
            $messageId: "messageId",
            $deleteFor: {
                type: "enum",
                values: {
                    Me: 0,
                    Both: 1
                }
            }
        },
        ChatDeleteSinglePMRequest: {
            $chatId: "chatId",
            $messageId: "messageId",
            $deleteFor: {
                type: "enum",
                values: {
                    Me: 0,
                    Both: 1
                }
            }
        },
        ChatClearPMChatHistoryRequest: {
            $chatId: "chatId",
            $deleteFor: {
                type: "enum",
                values: {
                    Me: 0,
                    Both: 1
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
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
    info: {
        version: "1.0.0",
        title: "Stuplus API",
        description: "Stuplus API Documentation."
    },
    host: "127.0.0.1:25010",
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
            interestIds: ["insterestId1", "insterestId2"],
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
            password: "oldPassword",
            newPassword: "newPassword",
            newPasswordRepeat: "newPassword",
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
            email: "stuplus@gmail.com",
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
            code: "12345",
            email: "stuplus@gmail.com"
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
            code: "12345",
            email: "stuplus@gmail.com",
            newPassword: "newPassword",
            newPasswordRepeat: "newPassword",
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
            isStudentEmail: false
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
    }
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./server.ts'];
swaggerAutogen(outputFile, endpointsFiles, doc).then(async () => {
    // await import"../api/server";
});
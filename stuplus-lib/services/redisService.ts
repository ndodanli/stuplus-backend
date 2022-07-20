import path from 'path';
import { createClient } from 'redis';
import logger from '../config/logger';
import { DepartmentEntity, FacultyEntity, SchoolEntity, UserEntity } from '../entities/BaseEntity';
import { User, UserDocument } from '../entities/UserEntity';
import { RedisKeyType } from '../enums/enums_socket';
import NotValidError from '../errors/NotValidError';
import { getMessage } from '../localization/responseMessages';
import { Document } from "mongoose";
import { RedisAcquireEntityFilterOrder } from '../enums/enums';
import { School } from '../entities/SchoolEntity';

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// const url = process.env.REDIS_URL
const client = createClient({ url: process.env.REDIS_URL });
setup()

async function setup() {
    try {
        await client.connect();
        console.log("redis client created");
    } catch (error) {
        logger.error({ err: error }, "An error occurred while connecting to redis.");
        console.error({ err: error }, "An error occurred while connecting to redis.");
        process.exit(1);
    }
}

interface RedisAcquireEntityFilters {
    sort: { property: string, order: RedisAcquireEntityFilterOrder };
    limit: number;
}
export default class RedisService {
    static client = client;

    static async acquire<T>(key: string, ttl: number, func: Function): Promise<T> {
        const value = await this.client.get(key);
        if (value) {
            return JSON.parse(value) as unknown as T;
        } else {
            const result = await func();
            await this.client.set(key, JSON.stringify(result), { EX: ttl });
            return result;
        }
    }

    static async acquireHash<T>(masterKey: string, subKey: string, ttl: number, func: Function): Promise<T> {
        const value = await this.client.hGet(masterKey, subKey);
        if (value) {
            return JSON.parse(value) as unknown as T;
        } else {
            const result = await func();
            await this.client.hSet(masterKey, subKey, JSON.stringify(result));
            this.client.expire(masterKey, ttl);
            return result;
        }
    }

    static async acquirePlayerId(userId: string): Promise<string> {
        return this.acquireHash(RedisKeyType.UserPlayerIds, userId, 60 * 60 * 4, async () => {
            const user = await UserEntity.findOne({ _id: userId }, { _id: 0, playerId: 1 }, { lean: true });
            if (!user) throw new NotValidError(getMessage("userNotFound", ["tr"]));
            return user.playerId;
        });
    }

    static async acquireUser(userId: string, project?: string[] | any): Promise<User> {
        const redisUser = await this.acquire<User>(RedisKeyType.User + userId, 60 * 120, async () => {

            const user = await UserEntity.findOne({ _id: userId }, {
                username_fuzzy: 0, firstName_fuzzy: 0, lastName_fuzzy: 0, externalLogins: 0,

            }, { lean: true })

            if (!user) throw new NotValidError(getMessage("userNotFound", ["tr"]));

            const school = await SchoolEntity.findOne({ _id: user.schoolId }, { "title": 1, "_id": 0 });
            const faculty = await FacultyEntity.findOne({ _id: user.facultyId }, { "title": 1, "_id": 0 });
            const department = await DepartmentEntity.findOne({ _id: user.departmentId }, { "title": 1, "_id": 0 });

            if (school)
                user.schoolName = school.title;

            if (faculty)
                user.facultyName = faculty.title;

            if (department)
                user.departmentName = department.title;

            return user;
        });

        if (project) {
            if (Array.isArray(project) && project.length > 0) {
                for (const key in redisUser) {
                    if (!project.includes(key))
                        delete redisUser[key];
                }
            } else {
                for (const key in redisUser) {
                    const hasOwnProperty = project.hasOwnProperty(key);
                    if (!hasOwnProperty || (hasOwnProperty && project[key] === 0))
                        delete redisUser[key];
                }
            }
        }

        return redisUser;
    }

    static async delGroupChatIdsFromUser(userId: string): Promise<void> {
        await this.client.del(RedisKeyType.User + userId + ":groupChats");
    }

    static async delMultipleGCIdsFromUsers(userIds: string[]): Promise<void> {
        const keys = userIds.map(userId => RedisKeyType.User + userId + ":groupChats");
        await this.client.del(keys);
    }

    static async updateUser(user: UserDocument): Promise<void> {
        await this.client.set(RedisKeyType.User + user.id, JSON.stringify(user), { EX: 60 * 120 });
    }

    static async acquireAllSchools(): Promise<any[]> {
        let schools: any = await this.client.hVals(RedisKeyType.Schools).then(values => {
            return values.map(value => JSON.parse(value));
        }
        ).catch(err => {
            logger.error({ err: err }, "An error occurred while acquiring all schools.");
            console.error({ err: err }, "An error occurred while acquiring all schools.");
        });
        if (!schools || schools.length === 0) {
            schools = await SchoolEntity.find({}, {}, { lean: true });
            for (let i = 0; i < schools.length; i++) {
                const school = schools[i];
                await this.client.hSet(RedisKeyType.Schools, school._id.toString(), JSON.stringify(school));
            }
        }
        return schools;
    }

    static async acquireSingleSchool(schoolId: string): Promise<any> {
        let school: any = await this.client.hGet(RedisKeyType.Schools, schoolId).then(value => JSON.parse(value ?? "")).catch(err => {
            logger.error({ err: err }, "An error occurred while acquiring school.");
            console.error({ err: err }, "An error occurred while acquiring school.");
        });
        if (!school) {
            await this.acquireAllSchools();
            school = await this.client.hGet(RedisKeyType.Schools, schoolId).then(value => JSON.parse(value ?? "")).catch(err => {
                logger.error({ err: err }, "An error occurred while acquiring school.");
                console.error({ err: err }, "An error occurred while acquiring school.");
            });
        }
        return school;
    }

    static async updateSchools(): Promise<void> {
        await this.client.del(RedisKeyType.Schools);
    }

    static async updateInterests(): Promise<void> {
        await this.client.del(RedisKeyType.Interests + "interests");
    }

    static async acquireEntity<T extends object>(key: string, query: any, filters?: RedisAcquireEntityFilters): Promise<T> {
        let documentList = [];

        const redisValue = await this.client.lRange(key, 0, -1);
        const redisDocumentList = redisValue.map(x => JSON.parse(x).e);

        documentList = await query();

        if (redisDocumentList.length > 0) {
            for (let i = 0; i < redisDocumentList.length; i++) {
                const redisDocument = redisDocumentList[i];
                if (documentList.every((document: Document) => document._id.toString() !== redisDocument._id)) {
                    documentList.push(redisDocument);
                }
            }
            if (filters) {
                // if (filters.sort) {
                //     if (filters.sort.order === RedisAcquireEntityFilterOrder.ASC)
                //         documentList = documentList.sort((a: any, b: any) => (a[filters.sort.property] > b[filters.sort.property]) ? 1 : ((b[filters.sort.property] > a[filters.sort.property]) ? -1 : 0));
                //     else
                //         documentList = documentList.sort((a: any, b: any) => (a[filters.sort.property] < b[filters.sort.property]) ? 1 : ((b[filters.sort.property] < a[filters.sort.property]) ? -1 : 0));
                // }
                if (filters.limit) {
                    documentList = documentList.slice(0, filters.limit);
                }
            }
        }
        // await this.client.set(key, JSON.stringify(data), { EX: 60 * 120 });

        return documentList as unknown as T;
    }
}


import path from 'path';
import { createClient } from 'redis';
import logger from '../../api/config/logger';
import { AnnouncementEntity, DepartmentEntity, FacultyEntity, SchoolEntity, UserEntity } from '../entities/BaseEntity';
import { UserDocument } from '../entities/UserEntity';
import { RedisKeyType } from '../enums/enums_socket';
import NotValidError from '../errors/NotValidError';
import { getMessage } from '../localization/responseMessages';
import { Document, Schema } from "mongoose";
import { RedisAcquireEntityFilterOrder } from '../enums/enums';

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// const url = process.env.REDIS_URL
const client = createClient({ url: process.env.REDIS_URL });
setup()

async function setup() {
    try {
        console.log("redis client created");
        await client.connect();
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

    static async acquireUser(userId: string, acceptedLanguages: Array<string> = ["tr"]): Promise<UserDocument> {
        return await this.acquire<UserDocument>(RedisKeyType.User + userId, 60 * 120, async () => {

            const user = await UserEntity.findOne({ _id: userId }, {}, { lean: true })

            if (!user) throw new NotValidError(getMessage("userNotFound", acceptedLanguages));

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
        }
        )
    }

    static async updateUser(user: UserDocument): Promise<void> {
        await this.client.set(RedisKeyType.User + user.id, JSON.stringify(user), { EX: 60 * 120 });
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


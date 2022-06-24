import path from 'path';
import { createClient } from 'redis';
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// const url = process.env.REDIS_URL
const client = createClient({ url: process.env.REDIS_URL });
setup()

async function setup() {
    try {
        console.log("redis client created");
        await client.connect();
    } catch (error) {
        console.log("redis error: ", error)
        process.exit(1);
    }
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

}

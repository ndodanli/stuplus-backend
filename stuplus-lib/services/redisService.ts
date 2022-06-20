import { createClient } from 'redis';

// const url = process.env.REDIS_URL
const client = createClient();
setup()

async function setup() {
    await client.connect();
}

export default class RedisService {
    static client = client;

    static async acquire<T>(key: string, ttl: number, func: Function) : Promise<T> {
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

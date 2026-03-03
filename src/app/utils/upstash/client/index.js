import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // Upstash Redisクライアントを環境変数から自動的に生成
const lockTimeout = 15; // [s]

export const lockScript = async (scriptIds, userId) => {

    for(let scriptId of scriptIds){
        // 1行あたり4回->2回のRedisアクセスが発生する.
        // if(await redis.get(`script:${scriptId}:lock`) !== null){
        //     return false;
        // }
        const current_lock = await redis.get(`script:${scriptId}:lock`);
        if(current_lock !== null && current_lock !== `user:${userId}`){
            return false;
        }
        const lockKey = `script:${scriptId}:lock`;
        const lockResult = await redis.set(lockKey, `user:${userId}`);
        const expireResult = await redis.expire(lockKey, lockTimeout);
    }
    return true;
}

export const lockScriptMulti = async (scriptIds, userId) => {
    const getMulti = redis.multi()
    
    for (let scriptId of scriptIds) {
        getMulti.get(`script:${scriptId}:lock`);
    }
    const currentLocks = await getMulti.exec();
    const isLocked = currentLocks.some(lock => lock !== null && lock !== `user:${userId}`);
    if (isLocked) {
        return false;
    }

    const setExpireMulti = redis.multi();
    for (let scriptId of scriptIds) {
        setExpireMulti.set(`script:${scriptId}:lock`, `user:${userId}`);
        setExpireMulti.expire(`script:${scriptId}:lock`, lockTimeout);
    }
    const result = await setExpireMulti.exec();
    // result = ["OK", 1, "OK", 1, ...]  長さは scriptIds.length * 2
    const allOk = result.length === scriptIds.length * 2
        && result.every((r, i) => i % 2 === 0 ? r === "OK" : r === 1);
    return allOk;
}

export const unlockScript = async (scriptIds, userId) => {
    for(let scriptId of scriptIds){
        const current_lock = await redis.get(`script:${scriptId}:lock`);
        if(current_lock === null || current_lock !== `user:${userId}`){
            return false;
        }
        const lockKey = `script:${scriptId}:lock`;
        const lockResult = await redis.del(lockKey);
    }
    return true;
}

export const unlockScriptMulti = async (scriptIds, userId) => {
    const getMulti = redis.multi()
    for (let scriptId of scriptIds) {
        getMulti.get(`script:${scriptId}:lock`);
    }
    const currentLocks = await getMulti.exec();
    const isLocked = currentLocks.some(lock => lock !== null && lock !== `user:${userId}`);
    if (isLocked) {
        return false;
    }
    const delMulti = redis.multi()
    for (let scriptId of scriptIds) {
        delMulti.del(`script:${scriptId}:lock`);
    }
    const result = await delMulti.exec();
    console.log("result: ", result);
    return result.every(r => r === 1);
}

export const expandLock = async (userId) => {
    const lockValue = `user:${userId}`;
    const scriptIds = (await redis.keys("script:*:lock")).map(key => key.split(":")[1]);
    for(let scriptId of scriptIds){
        const lockKey = `script:${scriptId}:lock`;
        const lockResult = await redis.set(lockKey, lockValue);
        const expireResult = await redis.expire(lockKey, lockTimeout);
    }
    return true;
}

export const getPermissionList = async () => {
    const permission_list = await redis.keys("script:*:lock");
    const result = await Promise.all(permission_list.map(async (key) => {
        console.log("key: ", key, "value: ", await redis.get(key));
        const scriptId = key.split(":")[1];
        const userId = (await redis.get(key))?.split(":")[1];
        return {
            scriptId: scriptId,
            userId: userId,
        };
    }));
    return result;
}
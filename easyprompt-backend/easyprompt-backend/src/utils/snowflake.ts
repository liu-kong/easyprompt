import Snowflake from 'snowflake-id';

// 创建雪花算法实例
const snowflake = new Snowflake({
  mid: 1, // 机器ID，可以根据需要设置
  offset: 0 // 时间偏移量
});

/**
 * 生成雪花算法ID
 * @returns 返回一个唯一的雪花ID
 */
export function generateSnowflakeId(): string {
  return snowflake.generate().toString();
}

/**
 * 将字符串ID转换为数字（用于数据库存储）
 * @param id 雪花算法生成的字符串ID
 * @returns 返回数字类型的ID
 */
export function snowflakeIdToNumber(id: string): number {
  return parseInt(id, 10);
}
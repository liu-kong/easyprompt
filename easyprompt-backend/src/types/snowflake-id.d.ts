declare module 'snowflake-id' {
  class Snowflake {
    constructor(options?: { mid?: number; offset?: number });
    generate(): string;
  }
  
  export = Snowflake;
}
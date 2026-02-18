declare module 'hive-driver' {
  export const TCLIService: any;
  export const TCLIService_types: any;
  export class HiveClient {
    constructor(service: any, types: any);
    connect(options: any, connection: any, auth: any): Promise<void>;
    close(): Promise<void>;
    openSession(options: any): Promise<any>;
  }
  export const connections: any;
  export const auth: any;
}

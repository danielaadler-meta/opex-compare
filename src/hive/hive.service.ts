import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HiveService implements OnModuleDestroy {
  private readonly logger = new Logger(HiveService.name);
  private client: any = null;
  private session: any = null;
  private connected = false;

  constructor(private config: ConfigService) {}

  async onModuleDestroy() {
    await this.disconnect();
  }

  isConfigured(): boolean {
    return !!this.config.get('HIVE_HOST');
  }

  async connect(): Promise<boolean> {
    if (this.connected) return true;
    if (!this.isConfigured()) {
      this.logger.warn('Hive is not configured. Set HIVE_HOST in .env to enable Hive queries.');
      return false;
    }

    try {
      const hive = await import('hive-driver');
      const { TCLIService, TCLIService_types } = hive;
      const host = this.config.get('HIVE_HOST', 'localhost');
      const port = this.config.get<number>('HIVE_PORT', 10000);
      const authMechanism = this.config.get('HIVE_AUTH_MECHANISM', 'NOSASL');

      this.client = new hive.HiveClient(TCLIService, TCLIService_types);

      await this.client.connect(
        { host, port },
        new hive.connections.TcpConnection(),
        new hive.auth[`${authMechanism}Authentication`]?.() ||
          new hive.auth.NoSaslAuthentication(),
      );

      this.session = await this.client.openSession({
        client_protocol:
          TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10,
      });

      this.connected = true;
      this.logger.log(`Connected to Hive at ${host}:${port}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to Hive: ${error.message}`);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.session) {
        await this.session.close();
      }
      if (this.client) {
        await this.client.close();
      }
    } catch (error) {
      this.logger.error(`Error disconnecting from Hive: ${error.message}`);
    } finally {
      this.connected = false;
      this.session = null;
      this.client = null;
    }
  }

  async executeQuery(query: string): Promise<any[]> {
    const isConnected = await this.connect();
    if (!isConnected) {
      throw new Error('Hive is not configured or connection failed. Set HIVE_HOST in .env.');
    }

    try {
      const operation = await this.session.executeStatement(query, {
        runAsync: true,
      });
      await operation.waitUntilReady();

      const schema = await operation.getSchema();
      const resultSet = await operation.fetchAll();
      await operation.close();

      const columns = schema.columns.map((col: any) => col.columnName);
      return resultSet.map((row: any) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = row[col] ?? row[i];
        });
        return obj;
      });
    } catch (error) {
      this.logger.error(`Hive query failed: ${error.message}`);
      throw error;
    }
  }
}

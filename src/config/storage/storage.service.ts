import * as fs from 'fs';
import * as path from 'path';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { ensureDirectoryExists } from '@/common/utils/ensure-dir.util';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageConfig {
  type: 'local' | 's3';
  localPath?: string;
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
  };
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.config = {
      type: configService.get('STORAGE_TYPE', 'local'),
      localPath: configService.get('STORAGE_LOCAL_PATH', './uploads'),
      s3: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
        bucket: configService.get('AWS_BUCKET'),
        region: configService.get('AWS_REGION'),
      },
    };

    if (this.config.type === 's3') {
      this.initS3Client();
    }
  }

  private initS3Client() {
    this.s3Client = new S3Client({
      region: this.config.s3.region,
      credentials: {
        accessKeyId: this.config.s3.accessKeyId,
        secretAccessKey: this.config.s3.secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(folder, filename);

    try {
      if (this.config.type === 's3') {
        await this.uploadToS3(file.buffer, filePath, file.mimetype, metadata);
      } else {
        await this.uploadToLocal(file.buffer, filePath);
      }

      return filePath;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error}`);
      throw error;
    }
  }

  async getFileUrl(filePath: string, expiresIn = 3600): Promise<string> {
    try {
      if (this.config.type === 's3') {
        const command = new GetObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: filePath,
        });
        return getSignedUrl(this.s3Client, command, { expiresIn });
      } else {
        return path.join(this.config.localPath, filePath);
      }
    } catch (error) {
      this.logger.error(`Error getting file URL: ${error}`);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (this.config.type === 's3') {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.config.s3.bucket,
            Key: filePath,
          }),
        );
      } else {
        const fullPath = path.join(this.config.localPath, filePath);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${error}`);
      throw error;
    }
  }

  async getFileStream(filePath: string): Promise<NodeJS.ReadableStream> {
    try {
      if (this.config.type === 's3') {
        const command = new GetObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: filePath,
        });
        const response = await this.s3Client.send(command);
        return response.Body as NodeJS.ReadableStream;
      } else {
        const fullPath = path.join(this.config.localPath, filePath);
        return fs.createReadStream(fullPath);
      }
    } catch (error) {
      this.logger.error(`Error getting file stream: ${error}`);
      throw error;
    }
  }

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
    });
    await this.s3Client.send(command);
  }

  private async uploadToLocal(buffer: Buffer, relativePath: string): Promise<void> {
    const fullPath = path.join(this.config.localPath, relativePath);
    ensureDirectoryExists(path.dirname(fullPath));
    await fs.promises.writeFile(fullPath, buffer);
  }
}

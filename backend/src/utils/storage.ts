import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

const localRoot = path.resolve(process.cwd(), env.localUploadDir);

const s3 = env.storageDriver === 's3'
  ? new S3Client({
      region: env.aws.region,
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
    })
  : null;

/** Salva um buffer sob a chave (ex: "previews/uuid.jpg") e retorna a chave salva. */
export async function saveObject(key: string, buffer: Buffer, contentType: string): Promise<string> {
  if (env.storageDriver === 's3' && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return key;
  }

  const filePath = path.join(localRoot, key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
  return key;
}

/** URL pública (para previews/thumbs, que não são sensíveis). */
export function publicUrl(key: string): string {
  if (env.storageDriver === 's3') {
    return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
  }
  return `/files/${key}`;
}

/** Stream de leitura para servir um arquivo protegido (originais). */
export async function readObjectStream(key: string): Promise<NodeJS.ReadableStream> {
  if (env.storageDriver === 's3' && s3) {
    const res = await s3.send(new GetObjectCommand({ Bucket: env.aws.bucket, Key: key }));
    return res.Body as NodeJS.ReadableStream;
  }
  const filePath = path.join(localRoot, key);
  return fs.createReadStream(filePath);
}

/** URL assinada temporária (S3) — no modo local retorna a rota autenticada do próprio backend. */
export async function signedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string | null> {
  if (env.storageDriver === 's3' && s3) {
    const command = new GetObjectCommand({ Bucket: env.aws.bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  }
  return null;
}

export async function deleteObject(key: string): Promise<void> {
  if (env.storageDriver === 's3' && s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: env.aws.bucket, Key: key }));
    return;
  }
  const filePath = path.join(localRoot, key);
  await fs.promises.rm(filePath, { force: true });
}

export function localRootDir(): string {
  return localRoot;
}

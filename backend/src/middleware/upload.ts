import multer from 'multer';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Formato inválido. Envie JPG, PNG ou WEBP.'));
      return;
    }
    cb(null, true);
  },
});

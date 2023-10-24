import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { Helper as MulterHelper } from '../helpers';
import { MulterEnum, MulterOptions } from '../interfaces/multer.interfaces';

export function MulterIntercepter({
  fieldName,
  path,
  type,
  addDateTime = true,
  maxFiles,
}: MulterOptions) {
  if (type === MulterEnum.single) {
    return FileInterceptor(fieldName, {
      storage: diskStorage({
        destination: 'src/public' + path,
        filename: (req: Request, file: Express.Multer.File, cb: any) =>
          MulterHelper.customFileName(req, file, cb, addDateTime),
      }),
    });
  } else if (type === MulterEnum.multiple) {
    return FilesInterceptor(fieldName, maxFiles, {
      storage: diskStorage({
        destination: 'src/public' + path,
        filename: (req: Request, file: Express.Multer.File, cb: any) =>
          MulterHelper.customFileName(req, file, cb, addDateTime),
      }),
    });
  }
}

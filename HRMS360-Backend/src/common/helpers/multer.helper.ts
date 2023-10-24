import { Request } from 'express';
import { extname } from 'path';

export class Helper {
  static customFileName(
    _: Request,
    file: Express.Multer.File,
    cb: any,
    addDateTime: boolean = true
  ) {
    let uniqueSuffix = '';
    if (addDateTime) {
      uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    }

    let fileExtension = extname(file.originalname);
    const originalName = file.originalname.split('.')[0];
    cb(null, originalName + '-' + uniqueSuffix + fileExtension);
  }

  static destinationPath(
    _: Request,
    _1: Express.Multer.File,
    cb: any,
    path: string
  ) {
    cb(null, './src/public' + path);
  }
}

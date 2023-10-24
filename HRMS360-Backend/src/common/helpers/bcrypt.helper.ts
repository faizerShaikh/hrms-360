import * as bcryptjs from "bcryptjs";

export class bcrypt {
  static async createHash(password: string) {
    return await bcryptjs.hash(password, 10);
  }

  static async compare(oldPassword: string, currPassword: string) {
    return await bcryptjs.compare(currPassword, oldPassword);
  }
}

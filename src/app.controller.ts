import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  private readonly PROMO_CODES_FILE = path.join(__dirname, '../data/data.txt');
  private readonly accessTokenHash: string;

  constructor(private readonly appService: AppService) {
    const saltRounds = 10;
    const accessToken = 'devhubonesecrettokennobodyknows';

    this.accessTokenHash = bcrypt.hashSync(accessToken, saltRounds);
  }

  @Get('promo-codes')
  async getPromoCode(@Query('accessToken') accessToken: string): Promise<string> {

    if (!accessToken) {
      throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
    }


    if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }

    return this.readAndDeletePromoCode();
  }

  private async readAndDeletePromoCode(): Promise<string> {
    const fileLock = fs.openSync(this.PROMO_CODES_FILE, 'r+');
    let promoCodes: string[];

    try {
      const data = fs.readFileSync(this.PROMO_CODES_FILE, { encoding: 'utf8' });
      promoCodes = data.split('\n').filter(code => code.trim());

      if (promoCodes.length === 0) {
        throw new HttpException('No promo codes available', HttpStatus.NOT_FOUND);
      }

      const promoCode = promoCodes.shift();
      fs.writeFileSync(this.PROMO_CODES_FILE, promoCodes.join('\n'));
      return promoCode;
    } finally {
      fs.closeSync(fileLock);
    }
  }
}
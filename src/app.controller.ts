import { Controller, Get, Post, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  private readonly PROMO_CODES_FILE = path.join(__dirname, '../data/data.txt');
  private readonly PARAMS_FILE = path.join(__dirname, '../data/params.json');
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

  @Get('promo-chance')
  getPromoChance(@Query('accessToken') accessToken: string): number {
    if (!accessToken) {
      throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
    }

    if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }

    try {
      const paramsData = fs.readFileSync(this.PARAMS_FILE, { encoding: 'utf8' });
      const params = JSON.parse(paramsData);

      if (typeof params.codeChance !== 'number') {
        throw new Error('Invalid format for codeChance');
      }

      return params.codeChance;
    } catch (err) {
      throw new HttpException('Unable to read promo chance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('increment-50-button')
  increment50Button(@Query('accessToken') accessToken: string): HttpStatus {
    if (!accessToken) {
      throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
    }

    if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }
    return this.incrementButton('level50Presses');
  }

  @Post('increment-80-button')
  increment80Button(@Query('accessToken') accessToken: string): HttpStatus {
    if (!accessToken) {
      throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
    }

    if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }
    return this.incrementButton('level80Presses');
  }

  @Get('get-50-button')
  get50Button(@Query('accessToken') accessToken: string): number {
    if (!accessToken) {
      throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
    }

    if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }
    return this.getButtonCount('level50Presses');
  }

  @Get('get-80-button')
  get80Button(@Query('accessToken') accessToken: string): number {
    if (!accessToken) {
      throw new HttpException('Access token is required', HttpStatus.BAD_REQUEST);
    }

    if (!bcrypt.compareSync(accessToken, this.accessTokenHash)) {
      throw new HttpException('Invalid access token', HttpStatus.UNAUTHORIZED);
    }
    return this.getButtonCount('level80Presses');
  }

  private getButtonCount(buttonType: 'level50Presses' | 'level80Presses'): number {
    try {
      const paramsData = fs.readFileSync(this.PARAMS_FILE, { encoding: 'utf8' });
      const params = JSON.parse(paramsData);

      return params[buttonType] || 0;
    } catch (err) {
      throw new HttpException('Unable to read button count', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private incrementButton(buttonType: 'level50Presses' | 'level80Presses'): HttpStatus {
    try {
      const paramsData = fs.readFileSync(this.PARAMS_FILE, { encoding: 'utf8' });
      const params = JSON.parse(paramsData);

      if (!params[buttonType]) {
        params[buttonType] = 0;
      }

      params[buttonType]++;

      fs.writeFileSync(this.PARAMS_FILE, JSON.stringify(params, null, 2));

      return HttpStatus.OK;
    } catch (err) {
      throw new HttpException('Unable to increment button count', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
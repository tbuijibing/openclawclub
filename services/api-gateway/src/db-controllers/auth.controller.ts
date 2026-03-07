import { Controller, Post, Body, Get, Req, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../packages/database/src/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'openclaw-dev-secret-2026';
const JWT_EXPIRES = '7d';

interface JwtPayload { sub: string; role: string; displayName: string; }

@Controller('auth')
export class DbAuthController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Post('register')
  async register(@Body() body: { displayName: string; password: string; accountType?: string }) {
    if (!body.displayName || !body.password) {
      throw new HttpException('displayName and password required', HttpStatus.BAD_REQUEST);
    }
    if (body.password.length < 6) {
      throw new HttpException('Password must be at least 6 characters', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.userRepo.findOne({ where: { displayName: body.displayName } });
    if (existing) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = this.userRepo.create({
      id: randomUUID(),
      logtoUserId: `local-${randomUUID().substring(0, 8)}`,
      accountType: body.accountType || 'individual',
      displayName: body.displayName,
      passwordHash,
      role: 'individual_user',
      languagePreference: 'zh',
      timezone: 'Asia/Shanghai',
    });
    await this.userRepo.save(user);

    const token = this.signToken(user);
    return { token, user: this.sanitize(user) };
  }

  @Post('login')
  async login(@Body() body: { displayName: string; password: string }) {
    if (!body.displayName || !body.password) {
      throw new HttpException('displayName and password required', HttpStatus.BAD_REQUEST);
    }

    const trimmedName = body.displayName.trim();
    const user = await this.userRepo.findOne({ where: { displayName: trimmedName } });
    if (!user || !user.passwordHash) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const token = this.signToken(user);
    return { token, user: this.sanitize(user) };
  }

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.extractUser(req);
    if (!user) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.sanitize(user);
  }

  async extractUser(req: any): Promise<User | null> {
    const authHeader = req.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as JwtPayload;
      return this.userRepo.findOne({ where: { id: payload.sub } });
    } catch {
      return null;
    }
  }

  private signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, role: user.role, displayName: user.displayName || '' };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  }

  private sanitize(user: User) {
    return {
      id: user.id, displayName: user.displayName, accountType: user.accountType,
      role: user.role, languagePreference: user.languagePreference,
      timezone: user.timezone, region: user.region, createdAt: user.createdAt,
    };
  }
}

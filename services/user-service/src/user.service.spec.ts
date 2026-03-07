import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User, EnterpriseInfo, Organization } from '@openclaw-club/database';
import { UserService } from './user.service';
import { LogtoService } from './logto/logto.service';

const mockUser = {
  id: 'user-uuid-1',
  logtoUserId: 'logto-123',
  accountType: 'individual',
  displayName: 'Test User',
  languagePreference: 'en',
  timezone: 'UTC',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mkRepo = () => ({ findOne: jest.fn(), create: jest.fn(), save: jest.fn() });
const mkLogto = () => ({
  getRoles: jest.fn(),
  assignRoleToUser: jest.fn(),
  getUserRoles: jest.fn(),
  createOrganization: jest.fn(),
  addUserToOrganization: jest.fn(),
  verifyToken: jest.fn(),
  getUser: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepo: ReturnType<typeof mkRepo>;
  let eiRepo: ReturnType<typeof mkRepo>;
  let orgRepo: ReturnType<typeof mkRepo>;
  let logto: ReturnType<typeof mkLogto>;

  beforeEach(async () => {
    userRepo = mkRepo();
    eiRepo = mkRepo();
    orgRepo = mkRepo();
    logto = mkLogto();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(EnterpriseInfo), useValue: eiRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: LogtoService, useValue: logto },
      ],
    }).compile();
    service = mod.get<UserService>(UserService);
  });

  it('handleWebhook: creates user on User.Created', async () => {
    userRepo.findOne.mockResolvedValue(null);
    userRepo.create.mockReturnValue({ ...mockUser });
    userRepo.save.mockResolvedValue({ ...mockUser });
    const r = await service.handleWebhook({
      event: 'User.Created', createdAt: new Date().toISOString(),
      data: { id: 'logto-123', name: 'Test User' },
    });
    expect(r).toBeDefined();
    expect(userRepo.save).toHaveBeenCalled();
  });

  it('handleWebhook: returns null for non-User.Created', async () => {
    const r = await service.handleWebhook({ event: 'User.Updated', createdAt: '' });
    expect(r).toBeNull();
  });

  it('handleWebhook: returns existing user', async () => {
    userRepo.findOne.mockResolvedValue(mockUser);
    const r = await service.handleWebhook({
      event: 'User.Created', createdAt: '', data: { id: 'logto-123' },
    });
    expect(r).toEqual(mockUser);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('completeProfile: updates fields', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    userRepo.save.mockImplementation(async (u: any) => u);
    const r = await service.completeProfile('logto-123', {
      displayName: 'New', languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    });
    expect(r.displayName).toBe('New');
    expect(r.languagePreference).toBe('zh');
  });

  it('completeProfile: throws for unknown user', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.completeProfile('x', { displayName: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('selectAccountType: updates type and assigns role', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    userRepo.save.mockImplementation(async (u: any) => u);
    logto.getRoles.mockResolvedValue([{ id: 'r1', name: 'enterprise_user' }]);
    const r = await service.selectAccountType('logto-123', { accountType: 'enterprise' });
    expect(r.accountType).toBe('enterprise');
    expect(logto.assignRoleToUser).toHaveBeenCalledWith('logto-123', 'r1');
  });

  it('updateEnterpriseInfo: creates info for enterprise user', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser, accountType: 'enterprise' });
    eiRepo.findOne.mockResolvedValue(null);
    eiRepo.create.mockReturnValue({ userId: 'user-uuid-1', companyName: 'Acme' });
    eiRepo.save.mockImplementation(async (e: any) => e);
    const r = await service.updateEnterpriseInfo('logto-123', { companyName: 'Acme', industry: 'tech' });
    expect(r.companyName).toBe('Acme');
  });

  it('updateEnterpriseInfo: rejects non-enterprise', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    await expect(service.updateEnterpriseInfo('logto-123', { companyName: 'X' })).rejects.toThrow(BadRequestException);
  });

  it('createOrganization: creates org for enterprise user', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser, accountType: 'enterprise' });
    logto.createOrganization.mockResolvedValue({ id: 'lo1', name: 'Acme Org' });
    orgRepo.create.mockReturnValue({ logtoOrgId: 'lo1', name: 'Acme Org', ownerUserId: 'user-uuid-1' });
    orgRepo.save.mockImplementation(async (o: any) => ({ ...o, id: 'org-1' }));
    eiRepo.findOne.mockResolvedValue(null);
    const r = await service.createOrganization('logto-123', 'Acme Org');
    expect(r.name).toBe('Acme Org');
    expect(logto.addUserToOrganization).toHaveBeenCalled();
  });

  it('createOrganization: rejects non-enterprise', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    await expect(service.createOrganization('logto-123', 'Org')).rejects.toThrow(BadRequestException);
  });

  it('inviteMember: invites when caller is owner', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    orgRepo.findOne.mockResolvedValue({ id: 'org-1', name: 'A', ownerUserId: 'user-uuid-1' });
    const r = await service.inviteMember('logto-123', 'org-1', 'a@b.com');
    expect(r.invited).toBe(true);
  });

  it('inviteMember: rejects non-owner', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    orgRepo.findOne.mockResolvedValue({ id: 'org-1', name: 'A', ownerUserId: 'other' });
    await expect(service.inviteMember('logto-123', 'org-1', 'a@b.com')).rejects.toThrow(BadRequestException);
  });

  it('inviteMember: throws for unknown org', async () => {
    userRepo.findOne.mockResolvedValue({ ...mockUser });
    orgRepo.findOne.mockResolvedValue(null);
    await expect(service.inviteMember('logto-123', 'x', 'a@b.com')).rejects.toThrow(NotFoundException);
  });

  it('assignRole: assigns when role exists', async () => {
    logto.getRoles.mockResolvedValue([{ id: 'r1', name: 'certified_engineer' }]);
    await service.assignRole('logto-123', 'certified_engineer');
    expect(logto.assignRoleToUser).toHaveBeenCalledWith('logto-123', 'r1');
  });

  it('assignRole: skips when role not found', async () => {
    logto.getRoles.mockResolvedValue([]);
    await service.assignRole('logto-123', 'certified_engineer');
    expect(logto.assignRoleToUser).not.toHaveBeenCalled();
  });
});

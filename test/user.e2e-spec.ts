import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@/user/user.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentsService } from '@/payments/payments.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';


jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),

}));

import * as bcrypt from 'bcryptjs';


describe('UserService', () => {
    let service: UserService;

    const mockPrismaService = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    const mockPaymentsService = {
        createStripeCustomer: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PaymentsService, useValue: mockPaymentsService },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a user successfully', async () => {
            const userInput = { name: 'John', email: 'john@example.com', password: '123456' };
            const fakeCustomer = { id: 'cus_123' };
            const fakeUser = { id: 'user_1', ...userInput, password: 'hashedpass', stripeCustomerId: fakeCustomer.id };

            mockPaymentsService.createStripeCustomer.mockResolvedValue(fakeCustomer);
            mockPrismaService.user.create.mockResolvedValue(fakeUser);

            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');  // MOCKA AQUI

            const result = await service.create(userInput);

            expect(bcrypt.hash).toHaveBeenCalledWith(userInput.password, 8);
            expect(mockPaymentsService.createStripeCustomer).toHaveBeenCalledWith({ email: userInput.email, name: userInput.name });
            expect(mockPrismaService.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: userInput.name,
                        email: userInput.email,
                        password: 'hashedpass',
                        stripeCustomerId: fakeCustomer.id,
                    }),
                }),
            );

            expect(result).toEqual(fakeUser);
        });
    });

    describe('login', () => {
        it('should login successfully when credentials are valid', async () => {
            const hashedPassword = '$2b$08$C.Tg4aIULdUDSYsqFmz4vu37Zxa9wGlrRzPaaHpOgvaldWx02XjyW';
            const userInput = { email: 'john@example.com', password: '123' };
            const fakeUser = { email: userInput.email, password: hashedPassword };

            mockPrismaService.user.findUnique.mockResolvedValue(fakeUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await service.login(userInput);

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: userInput.email } });
            expect(bcrypt.compare).toHaveBeenCalledWith(userInput.password, fakeUser.password);
            expect(result).toBe(true);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.login({ email: 'no@user.com', password: '123456' }))
                .rejects
                .toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const fakeUser = { email: 'john@example.com', password: 'hashedpass' };
            mockPrismaService.user.findUnique.mockResolvedValue(fakeUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ email: 'john@example.com', password: 'wrongpass' }))
                .rejects
                .toThrow(UnauthorizedException);
        });
    });

    describe('fetchById', () => {
        it('should return user if found', async () => {
            const userId = 'user_1';
            const fakeUser = { id: userId, name: 'John', email: 'john@example.com' };

            mockPrismaService.user.findUnique.mockResolvedValue(fakeUser);

            const result = await service.fetchById(userId);

            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
            expect(result).toEqual(fakeUser);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.fetchById('invalid_id')).rejects.toThrow(NotFoundException);
        });
    });
});

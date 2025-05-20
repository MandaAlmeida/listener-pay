import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { PaymentsService } from '@/payments/payments.service';
import { EnvService } from '@/env/env.service';

jest.mock('stripe'); // Mocka a classe Stripe inteira

describe('PaymentsService', () => {
    let service: PaymentsService;
    let prisma: PrismaService;
    let env: EnvService;
    let mockStripeInstance: any;

    beforeEach(async () => {
        const stripeMock = {
            customers: {
                list: jest.fn().mockResolvedValue({ data: [] }),
                create: jest.fn().mockResolvedValue({ id: 'cust_123' }),
            },
            checkout: {
                sessions: {
                    create: jest.fn().mockResolvedValue({ url: 'http://checkout-url' }),
                },
            },
        };
        const mockEnvService = {
            get: jest.fn().mockImplementation((key: string) => {
                if (key === 'STRIPE_SECRET_WEBHOOK') return 'whsec_test_secret';
                if (key === 'STRIPE_SECRET_KEY') return 'sk_test_1234567890abcdef';  // chave fake válida
                if (key === 'STRIPE_ID_PLAN') return 'price_12345'; // se usar em outras funções
                return '';
            }),
        };


        const mockPrismaService = {
            user: {
                findFirst: jest.fn(),
                update: jest.fn(),
            },
        };



        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                {
                    provide: EnvService,
                    useValue: mockEnvService,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();


        service = module.get<PaymentsService>(PaymentsService);
        env = module.get<EnvService>(EnvService);
        prisma = module.get<PrismaService>(PrismaService);

        // @ts-ignore - acessa internamente o Stripe real
        service['stripe'] = stripeMock;
        mockStripeInstance = stripeMock;
    });

    it('should generate a checkout session successfully', async () => {
        const result = await service.generateCheckout('user_123', 'test@example.com');

        expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({ email: 'test@example.com', name: undefined });
        expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled();

        expect(result).toEqual({ url: 'http://checkout-url' });
    });

    it('should throw ConflictException if session is not created', async () => {
        mockStripeInstance.checkout.sessions.create.mockResolvedValue(null); // força erro

        await expect(service.generateCheckout('user_123', 'test@example.com')).rejects.toThrow(ConflictException);
    });
});

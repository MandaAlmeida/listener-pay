import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '@/payments/payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EnvService } from '@/env/env.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';

describe('PaymentsService', () => {
    let service: PaymentsService;

    const mockStripeConstructEvent = jest.fn();
    const mockHandleCheckoutSessionCompleted = jest.fn();
    const mockHandleSubscriptionSessionCompleted = jest.fn();
    const mockHandleCancelPlan = jest.fn();

    const mockStripe = {
        webhooks: {
            constructEvent: mockStripeConstructEvent,
        },
    } as any;

    const mockEnvService = {
        get: jest.fn().mockImplementation((key: string) => {
            if (key === 'STRIPE_SECRET_WEBHOOK') return 'whsec_test_secret';
            if (key === 'STRIPE_SECRET_KEY') return 'sk_test_fakeKey123456'; // chave fake para stripe
            return '';
        }),
    };


    const mockPrismaService = {
        user: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EnvService, useValue: mockEnvService },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);

        // Injetar stripe mock manualmente (override da instância real)
        (service as any).stripe = mockStripe;

        // Substituir métodos privados por mocks
        (service as any).handleCheckoutSessionCompleted = mockHandleCheckoutSessionCompleted;
        (service as any).handleSubscriptionSessionCompleted = mockHandleSubscriptionSessionCompleted;
        (service as any).handleCancelPlan = mockHandleCancelPlan;
    });

    it('should handle a checkout.session.completed event', async () => {
        const req = {
            body: Buffer.from(''),
        } as unknown as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;

        const fakeEvent: Stripe.Event = {
            id: 'evt_1',
            type: 'checkout.session.completed',
            object: 'event',
            created: Date.now(),
            data: {
                object: {
                    client_reference_id: 'user123',
                    subscription: 'sub_123',
                    customer: 'cus_123',
                    status: 'complete',
                } as unknown as Stripe.Checkout.Session,
            },

            livemode: false,
            pending_webhooks: 1,
            request: { id: 'req_1', idempotency_key: null },
            api_version: '2024-08-01',
        };

        mockStripeConstructEvent.mockReturnValue(fakeEvent);

        await service.handleWebhook(req, res, 'test-signature');

        expect(mockStripeConstructEvent).toHaveBeenCalled();
        expect(mockHandleCheckoutSessionCompleted).toHaveBeenCalledWith(fakeEvent.data.object);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalled();
    });

    it('should return 400 if webhook signature is invalid', async () => {
        const req = {
            body: Buffer.from('invalid'),
        } as unknown as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as Response;

        mockStripeConstructEvent.mockImplementation(() => {
            throw new Error('Invalid signature');
        });

        await service.handleWebhook(req, res, 'bad-signature');

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Webhook Error'));
    });
});

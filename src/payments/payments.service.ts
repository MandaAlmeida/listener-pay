import { ConflictException, Injectable } from "@nestjs/common";
import { EnvService } from "src/env/env.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Request, Response } from 'express';

import Stripe from "stripe";

@Injectable()
export class PaymentsService {
    private stripe: Stripe;

    constructor(
        private config: EnvService,
        private prisma: PrismaService,
    ) {
        this.stripe = new Stripe(this.config.get("STRIPE_SECRET_KEY"), {
            apiVersion: "2025-04-30.basil",
        });
    }

    private async getStripeCustomerByEmail(email: string) {
        const custumers = await this.stripe.customers.list({ email })
        return custumers.data[0]
    }

    async createStripeCustomer(data: { email: string, name?: string }) {
        const customer = await this.getStripeCustomerByEmail(data.email);
        if (customer) return customer;

        return this.stripe.customers.create({
            email: data.email,
            name: data.name
        })
    }

    async generateCheckout(userId: string, email: string) {
        const customer = await this.createStripeCustomer({
            email
        })

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            client_reference_id: userId,
            customer: customer.id,
            success_url: "http://localhost:3000/done",
            cancel_url: "http://localhost:3000/error",
            line_items: [
                {
                    price: this.config.get("STRIPE_ID_PLAN"),
                    quantity: 1
                }
            ]

        });

        if (!session) throw new ConflictException("Usuario nao encontrado")

        return {
            url: session.url,
        }
    }

    async handleWebhook(
        req: Request,
        res: Response,
        signature: string
    ) {
        let event: Stripe.Event;

        try {
            if (!req) throw new Error('Request body is missing');
            event = this.stripe.webhooks.constructEvent(
                req.body,
                signature,
                this.config.get("STRIPE_SECRET_WEBHOOK")
            );
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionSessionCompleted(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleCancelPlan(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.status(200).send();
    }

    async handleCancelSubscription(idSubscriptions: string) {
        const subscription = await this.stripe.subscriptions.update(idSubscriptions, {
            cancel_at_period_end: true,
        })

        return subscription;
    }

    async createPortalCustomer(id: string) {

        const user = await this.prisma.user.findFirst({ where: { id } })

        if (!user) throw new ConflictException("Usuario nao encontrado")

        const subscription = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId as string,
            return_url: "http://localhost:3333"
        })

        return subscription;
    }

    private async handleCheckoutSessionCompleted(data: Stripe.Checkout.Session) {
        const { client_reference_id, subscription, customer, status } = data

        const stripeCustomerId = customer as string
        const stripeSubscriptionId = subscription as string

        if (status !== "complete") return;

        if (!client_reference_id || !subscription || !customer) throw new ConflictException("client_reference_id, subscription,customer precisa estar preenchido")

        const UserExist = await this.prisma.user.findFirst({ where: { id: client_reference_id } })

        if (!UserExist) throw new ConflictException("Usuario nao encontrado")

        await this.prisma.user.update({
            where: {
                id: UserExist.id,
            },
            data: {
                stripeCustomerId,
                stripeSubscriptionId
            }
        })
    }

    private async handleSubscriptionSessionCompleted(data: Stripe.Subscription) {
        const { id, customer, status } = data

        const stripeCustomerId = customer as string
        const stripeSubscriptionId = id as string

        const UserExist = await this.prisma.user.findFirst({ where: { stripeCustomerId } })

        if (!UserExist) throw new ConflictException("Usuario nao encontrado")

        await this.prisma.user.update({
            where: {
                id: UserExist.id,
            },
            data: {
                stripeCustomerId,
                stripeSubscriptionId,
                stripeSubscriptionStatus: status
            }
        })
    }

    private async handleCancelPlan(data: Stripe.Subscription) {
        const { customer } = data

        const stripeCustomerId = customer as string

        const UserExist = await this.prisma.user.findFirst({ where: { stripeCustomerId } })

        if (!UserExist) throw new ConflictException("Usuario nao encontrado")

        await this.prisma.user.update({
            where: {
                id: UserExist.id,
            },
            data: {
                stripeCustomerId,
                stripeSubscriptionStatus: null
            }
        })
    }


}
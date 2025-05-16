import { Injectable } from "@nestjs/common";
import { EnvService } from "src/env/env.service";
import Stripe from "stripe";

@Injectable()
export class PaymentsService {
    private stripe: Stripe;

    constructor(private config: EnvService) {
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
}
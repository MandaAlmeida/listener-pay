import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res } from "@nestjs/common";
import { Request, Response } from 'express';
import { PaymentsService } from "./payments.service";

@Controller()
export class PaymentsController {
    constructor(
        private readonly PaymentsService: PaymentsService,
    ) { }

    @Post("customer")
    async createStripeCustomer(@Body() user: { email: string, name?: string }) {
        return this.PaymentsService.createStripeCustomer(user)
    }

    @Get("checkout/:id")
    async generateCheckout(@Param("id") userId: string, @Query("email") email: string) {
        return this.PaymentsService.generateCheckout(userId, email)
    }

    @Get("portal/stripe/:id")
    async createPortalCustomer(@Param("id") userId: string) {
        return this.PaymentsService.createPortalCustomer(userId)
    }

    @Post('webhook')
    async handleWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') signature: string) {
        return this.PaymentsService.handleWebhook(req, res, signature)
    }

}
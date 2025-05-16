import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller("user")
export class UserController {
    constructor(
        private readonly UserService: UserService,
    ) { }

    @Post("register")
    async create(@Body() user: { name: string, email: string, password: string }) {
        return this.UserService.create(user);
    }

    @Post("login")
    async login(@Body() user: { email: string, password: string }) {
        return this.UserService.login(user)
    }

    @Get("fetch/:id")
    async fetchById(@Param("id") userId: string) {
        return this.UserService.fetchById(userId)
    }


}

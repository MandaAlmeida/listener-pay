import { IsString } from "class-validator";

export class EnvDTO {
    @IsString()
    DATABASE_URL: string

    @IsString()
    STRIPE_SECRET_KEY: string
}
import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { PaymentsService } from "src/payments/payments.service";
import { PrismaService } from "src/prisma/prisma.service";



// Decorador para tornar a classe injetável no NestJS
@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private customer: PaymentsService
    ) { }

    /**
     * Cria um novo usuário.
     * Realiza validação de senha, verificação de e-mail existente e criação de categorias padrão.
     */
    async create(user: { name: string, email: string, password: string }) {
        const { name, email, password } = user;

        // Criptografa a senha
        const hashedPassword = await hash(password, 8);

        // Cria o cliente no Stripe
        const customer = await this.customer.createStripeCustomer({ email, name });

        // Cria o novo usuário no banco com Prisma
        const createdUser = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                stripeCustomerId: customer.id, // se você estiver salvando isso no banco
            },
        });

        return createdUser;
    }


    /**
     * Realiza o login do usuário e retorna o token JWT.
     */
    async login(user: { email: string, password: string }) {
        const { email, password } = user;

        // Verifica se o usuário existe
        const confirmeUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!confirmeUser) throw new UnauthorizedException("Senha ou email incorretos");


        // Compara a senha fornecida com a senha armazenada
        const checkPassword = await compare(password, confirmeUser.password);
        if (!checkPassword) throw new UnauthorizedException("Senha ou email incorretos");

        return true;
    }

    /**
     * Recupera os dados do usuário a partir do token JWT, tentar criar apenas um fetch, atualmente existe 3
     */
    async fetchById(userId: string) {
        // Busca o usuário no banco, excluindo a senha
        const userFound = this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!userFound) {
            throw new NotFoundException("Usuário não encontrado");
        }

        return userFound;
    }


}

# 💳 NestJS + Stripe Subscriptions + Autenticação

Este projeto é um serviço de pagamentos baseado em [NestJS](https://nestjs.com/), integrado com a [Stripe API](https://stripe.com/docs/api) e um sistema de **autenticação de usuários** com **Prisma ORM** e **bcryptjs**.

---

## 💠 Funcionalidades

### 📟 Assinaturas Stripe

* Criação de clientes na Stripe
* Sessão de checkout para planos
* Portal do cliente
* Escuta de webhooks:

  * `checkout.session.completed`
  * `customer.subscription.created`, `updated`, `deleted`
* Cancelamento de assinatura

### 👤 Autenticação

* Cadastro de usuários
* Login com validação segura de senha
* Busca de perfil por ID
* Integração com Stripe ao criar usuário

---

## ✨ Tecnologias

* [NestJS](https://nestjs.com/)
* [Stripe Node SDK](https://github.com/stripe/stripe-node)
* [Prisma ORM](https://www.prisma.io/)
* [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
* [Docker](https://www.docker.com/)
* TypeScript

---

## ⚙️ Configuração

### 1. Variáveis de ambiente

Crie um arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres:docker@localhost:5432/seu_banco_de_dados?schema=public
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_WEBHOOK=whsec_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_ID_PLAN=price_XXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 2. Instale o Stripe CLI (opcional para testes locais)

```bash
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3000/webhook
```

---

## 📦 Endpoints principais

### 🔐 `POST /auth/register`

Registra um novo usuário.

**Body:**

```json
{
  "name": "João",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Retorno:**

```json
{
  "id": "uuid",
  "name": "João",
  "email": "joao@email.com"
}
```

---

### 🔑 `POST /auth/login`

Realiza o login do usuário.

**Body:**

```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Retorno:**

```json
{
  "success": true
}
```

> Em versões futuras, será possível retornar também um **JWT**.

---

### 👤 `GET /users/:id`

Busca os dados do usuário logado pelo `id`.

**Retorno:**

```json
{
  "id": "uuid",
  "name": "João",
  "email": "joao@email.com",
  "stripeCustomerId": "cus_XXXXXX"
}
```

---

### 💳 `POST /generate-checkout`

Gera uma sessão de checkout para assinatura.

**Body:**

```json
{
  "userId": "uuid-do-usuario",
  "email": "joao@email.com"
}
```

**Retorno:**

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

### 💡 `POST /webhook`

Endpoint para receber os eventos Stripe.

---

### 💠 `GET /create-portal-customer/:id`

Gera uma URL para o cliente gerenciar sua assinatura no portal Stripe.

---

## 🔄 Webhooks tratados

* ✅ `checkout.session.completed`: salva `stripeCustomerId` e `subscriptionId`
* ✅ `customer.subscription.created` / `updated`: atualiza status de assinatura
* ✅ `customer.subscription.deleted`: remove status de assinatura

---

## 🥪 Testando com cartão de teste

Use os cartões de teste da Stripe durante o checkout:

* **Aprovado:** `4242 4242 4242 4242`
* Expiração: qualquer data futura
* CVC: qualquer

Mais opções: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

---

## 🚜 Possíveis erros

### ❌ `No configuration provided and your test mode default configuration has not been created`

Configure o portal de cobrança no modo de teste:
👉 [https://dashboard.stripe.com/test/settings/billing/portal](https://dashboard.stripe.com/test/settings/billing/portal)

---

## ✨ Contribuição

Sinta-se livre para abrir *issues*, enviar *pull requests* ou sugerir melhorias.

---

## 📝 Licença

Este projeto está licenciado sob a licença **MIT**.

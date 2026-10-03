import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "./database";

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getPrismaClient(), property, receiver);
  }
});

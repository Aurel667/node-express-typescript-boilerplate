import prisma from "../config/prisma";
import { User } from "@prisma/client";

export const getAllUsers = async () => {
    const users = await prisma.user.findMany();
    return users;
}

export const createUser = async (data: Omit<User, "id">) => {
    const user = await prisma.user.create({
        data
    });
    return user;
};

export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });
    return user;
};

export const getUserByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    return user;
}

export const updateUser = async (id: string, data: Partial<User>) => {
    const user = await prisma.user.update({
        where: { id },
        data
    });
    return user;
};

export const deleteUser = async (id: string) => {
    const user = await prisma.user.delete({
        where: { id }
    });
    return user;
};
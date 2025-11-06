import prisma from '../../db/client.mjs';

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      createdAt: true,
    },
  });
};

export const createUser = async (email, hashedPassword) => {
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
};

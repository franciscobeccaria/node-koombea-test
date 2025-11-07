import prisma from '../../db/client.mjs';

export const findUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      createdAt: true,
    },
  });
};

export const createUser = async (username, hashedPassword) => {
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });
};

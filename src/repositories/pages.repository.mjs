import prisma from '../../db/client.mjs';

export const createPage = async (userId, url, title) => {
  return prisma.page.create({
    data: {
      userId,
      url,
      title,
    },
    select: {
      id: true,
      userId: true,
      url: true,
      title: true,
      linkCount: true,
      status: true,
      createdAt: true,
    },
  });
};

export const createManyLinks = async (pageId, links) => {
  if (!links || links.length === 0) return [];

  return prisma.link.createMany({
    data: links.map(link => ({
      pageId,
      href: link.href,
      text: link.text,
    })),
  });
};

export const updatePageLinkCount = async (pageId, linkCount) => {
  return prisma.page.update({
    where: { id: pageId },
    data: { linkCount },
    select: {
      id: true,
      url: true,
      title: true,
      linkCount: true,
      status: true,
    },
  });
};

export const findPagesByUser = async (userId, limit, offset) => {
  return prisma.page.findMany({
    where: { userId },
    select: {
      id: true,
      url: true,
      title: true,
      linkCount: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
};

export const countPagesByUser = async (userId) => {
  return prisma.page.count({
    where: { userId },
  });
};

export const findPageById = async (id, userId) => {
  return prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      url: true,
      title: true,
      linkCount: true,
      status: true,
      createdAt: true,
    },
  }).then(page => {
    if (!page) return null;
    if (page.userId !== userId) return null;
    return page;
  });
};

export const findLinksByPage = async (pageId, limit, offset) => {
  return prisma.link.findMany({
    where: { pageId },
    select: {
      id: true,
      href: true,
      text: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    skip: offset,
  });
};

export const countLinksByPage = async (pageId) => {
  return prisma.link.count({
    where: { pageId },
  });
};

export const updatePageStatus = async (pageId, status) => {
  return prisma.page.update({
    where: { id: pageId },
    data: { status },
    select: {
      id: true,
      url: true,
      title: true,
      linkCount: true,
      status: true,
      createdAt: true,
    },
  });
};

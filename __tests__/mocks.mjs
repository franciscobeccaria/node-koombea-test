import { jest } from '@jest/globals';

// Mock functions for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  password: '$2a$10$mockhashedpassword',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const mockPage = {
  id: 'test-page-id',
  userId: 'test-user-id',
  url: 'https://example.com',
  title: 'Example Domain',
  linkCount: 2,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

export const mockLinks = [
  {
    id: 'link-1',
    pageId: 'test-page-id',
    href: 'https://example.com/page1',
    text: 'Page 1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'link-2',
    pageId: 'test-page-id',
    href: 'https://example.com/page2',
    text: 'Page 2',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const mockScrapedData = {
  title: 'Example Domain',
  links: [
    { href: 'https://example.com/page1', text: 'Page 1' },
    { href: 'https://example.com/page2', text: 'Page 2' },
  ],
};

// Create mock functions
export const createMockAuthRepository = () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
});

export const createMockPagesRepository = () => ({
  findPagesByUser: jest.fn(),
  countPagesByUser: jest.fn(),
  findPageById: jest.fn(),
  createPage: jest.fn(),
  createManyLinks: jest.fn(),
  updatePageLinkCount: jest.fn(),
  findLinksByPage: jest.fn(),
  countLinksByPage: jest.fn(),
});

export const createMockScraper = () => ({
  scrapeUrl: jest.fn(),
});
